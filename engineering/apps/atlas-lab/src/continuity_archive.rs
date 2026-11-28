//! Read-only, streaming verification of Athena's portable artifact backup.
use serde::{Deserialize, Serialize};
use serde_json::value::RawValue;
use sha2::{Digest, Sha256};
use std::{collections::BTreeMap, fs::File, io::Read, path::Path};

const MAGIC: &[u8; 8] = b"ATHART01";
const HEADER: usize = 44;
const MAX_MANIFEST: usize = 256 * 1024;
const MAX_FILE: u64 = 8 * 1024 * 1024;
const MAX_BYTES: u64 = 64 * 1024 * 1024;
const MAX_REVISIONS: usize = 100;
const INVALID: &str = "Invalid or inconsistent artifact journal bundle";
const SHORT: &str = "Artifact journal bundle ended early or could not be read";

#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
struct Metadata<'a> {
    #[serde(borrow)]
    artifacts: Vec<Artifact<'a>>,
    #[serde(borrow)]
    revisions: Vec<Revision<'a>>,
}

#[derive(Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
struct Artifact<'a> {
    id: &'a str,
    latest: usize,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
struct Revision<'a> {
    artifact_id: &'a str,
    sequence: usize,
    #[serde(borrow)]
    filename: &'a RawValue,
    #[serde(borrow)]
    mime: &'a RawValue,
    size: u64,
    hash: &'a str,
    at: u64,
}

#[derive(Serialize)]
pub struct Receipt {
    schema: &'static str,
    artifacts: usize,
    revisions: usize,
    distinct_payloads: usize,
    distinct_payload_bytes: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    archive_sha256: Option<String>,
    verified: bool,
}

fn is_hex(byte: u8) -> bool {
    byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte)
}

fn js_valid_label(raw: &RawValue, max_units: usize, nonblank: bool) -> bool {
    // Honor JS's code-unit length limit and retain compatibility with JSON
    // strings containing a literal escaped lone surrogate (never rendered).
    // Decode just enough UTF-16 to check metadata, never include it in output.
    let Some(s) = raw
        .get()
        .strip_prefix('"')
        .and_then(|s| s.strip_suffix('"'))
    else {
        return false;
    };
    let mut chars = s.chars();
    let mut units = 0;
    let mut has_content = false;
    let mut previous_escaped_high = false;
    while let Some(c) = chars.next() {
        let mut escaped = false;
        let point = if c == '\\' {
            match chars.next() {
                Some('u') => {
                    escaped = true;
                    let mut value = 0;
                    for _ in 0..4 {
                        let Some(x) = chars
                            .next()
                            .filter(|x| !x.is_ascii_uppercase())
                            .and_then(|x| x.to_digit(16))
                        else {
                            return false;
                        };
                        value = value * 16 + x;
                    }
                    value
                }
                Some(x @ ('"' | '\\')) => u32::from(x),
                Some('b') => 8,
                Some('f') => 12,
                Some('n') => 10,
                Some('r') => 13,
                Some('t') => 9,
                _ => return false,
            }
        } else {
            u32::from(c)
        };
        if point < 32
            || point == 127
            || (escaped
                && (!(0xd800..=0xdfff).contains(&point)
                    || (previous_escaped_high && (0xdc00..=0xdfff).contains(&point))))
        {
            return false;
        }
        previous_escaped_high = escaped && (0xd800..=0xdbff).contains(&point);
        units += if point > 0xffff { 2 } else { 1 };
        if units > max_units {
            return false;
        }
        has_content |= !matches!(
            point,
            32 | 0xa0 | 0x1680 | 0x2000
                ..=0x200a | 0x2028 | 0x2029 | 0x202f | 0x205f | 0x3000 | 0xfeff
        );
    }
    !nonblank || has_content
}

fn hex(bytes: impl AsRef<[u8]>) -> String {
    bytes
        .as_ref()
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

fn verify<R: Read>(mut input: R, fingerprint: bool) -> Result<Receipt, &'static str> {
    let mut prefix = [0_u8; HEADER];
    input.read_exact(&mut prefix).map_err(|_| SHORT)?;
    if &prefix[..8] != MAGIC {
        return Err(INVALID);
    }
    let size = u32::from_be_bytes([prefix[8], prefix[9], prefix[10], prefix[11]]) as usize;
    if size == 0 || size > MAX_MANIFEST {
        return Err(INVALID);
    }
    let mut body = vec![0; size];
    input.read_exact(&mut body).map_err(|_| SHORT)?;
    if Sha256::digest(&body)[..] != prefix[12..] {
        return Err("Artifact journal metadata checksum failed");
    }
    let metadata: Metadata<'_> = serde_json::from_slice(&body).map_err(|_| INVALID)?;
    if metadata.revisions.len() > MAX_REVISIONS
        || metadata.artifacts.len() > metadata.revisions.len()
        || serde_json::to_vec(&metadata).map_err(|_| INVALID)? != body
        || metadata
            .artifacts
            .windows(2)
            .any(|pair| pair[0].id >= pair[1].id)
        || metadata.revisions.windows(2).any(|pair| {
            (pair[0].artifact_id, pair[0].sequence) >= (pair[1].artifact_id, pair[1].sequence)
        })
    {
        return Err(INVALID);
    }
    let mut groups = BTreeMap::new();
    for a in &metadata.artifacts {
        if a.id.len() != 36
            || !a.id.bytes().all(|byte| byte == b'-' || is_hex(byte))
            || !(1..=MAX_REVISIONS).contains(&a.latest)
            || groups.insert(a.id, (a.latest, 0_u128)).is_some()
        {
            return Err(INVALID);
        }
    }
    let mut sizes = BTreeMap::new();
    let mut total = 0;
    for rev in &metadata.revisions {
        let Some((latest, flags)) = groups.get_mut(rev.artifact_id) else {
            return Err(INVALID);
        };
        if !(1..=*latest).contains(&rev.sequence)
            || !(1..=MAX_FILE).contains(&rev.size)
            || rev.hash.len() != 64
            || !rev.hash.bytes().all(is_hex)
            || rev.at > 9_007_199_254_740_991
            || !js_valid_label(rev.filename, 255, true)
            || !js_valid_label(rev.mime, 100, false)
        {
            return Err(INVALID);
        }
        let flag = 1_u128 << (rev.sequence - 1);
        if *flags & flag != 0 {
            return Err(INVALID);
        }
        *flags |= flag;
        match sizes.insert(rev.hash, rev.size) {
            Some(old) if old != rev.size => return Err(INVALID),
            None => {
                total += rev.size;
                if total > MAX_BYTES {
                    return Err(INVALID);
                }
            }
            _ => {}
        }
    }
    if groups
        .values()
        .any(|(latest, bitmap)| bitmap.count_ones() as usize != *latest)
    {
        return Err(INVALID);
    }
    let mut whole = fingerprint.then(|| {
        let mut digest = Sha256::new();
        digest.update(prefix);
        digest.update(&body);
        digest
    });
    let mut buffer = vec![0; 64 * 1024];
    for (&hash, &payload_size) in &sizes {
        let mut payload = Sha256::new();
        let mut missing = payload_size;
        while missing != 0 {
            let length = missing.min(buffer.len() as u64) as usize;
            let part = &mut buffer[..length];
            input.read_exact(part).map_err(|_| SHORT)?;
            payload.update(&*part);
            if let Some(digest) = &mut whole {
                digest.update(&*part);
            }
            missing -= length as u64;
        }
        if hex(payload.finalize()) != hash {
            return Err("Artifact journal payload checksum failed");
        }
    }
    match input.read(&mut buffer[..1]) {
        Ok(0) => {}
        Ok(_) => return Err(INVALID),
        Err(_) => return Err(SHORT),
    }
    Ok(Receipt {
        schema: "athena-artifact-journal-file-verification-v1",
        artifacts: metadata.artifacts.len(),
        revisions: metadata.revisions.len(),
        distinct_payloads: sizes.len(),
        distinct_payload_bytes: total,
        archive_sha256: whole.map(|digest| hex(digest.finalize())),
        verified: true,
    })
}

pub fn verify_file(path: &Path, fingerprint: bool) -> Result<Receipt, &'static str> {
    let meta = std::fs::symlink_metadata(path).map_err(|_| "Could not inspect artifact bundle")?;
    if !meta.is_file() || meta.len() > (HEADER + MAX_MANIFEST) as u64 + MAX_BYTES {
        return Err("Choose a regular artifact file within the journal size limit");
    }
    let file = File::open(path).map_err(|_| "Could not open artifact bundle")?;
    if !file
        .metadata()
        .map_err(|_| "Could not inspect opened artifact bundle")?
        .is_file()
    {
        return Err("Opened artifact bundle is not a regular file");
    }
    verify(file, fingerprint)
}
