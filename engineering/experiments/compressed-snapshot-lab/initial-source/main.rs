//! Isolated lossless-storage candidate. Never migrates or opens a production database.
use rusqlite::{Connection, params};
use serde::Serialize;
use sha2::{Digest, Sha256};
use std::{error::Error, fs, io::Read, path::Path, time::Instant};
const MAX_RECORD: usize = 2 * 1024 * 1024;
const MAX_WORKLOAD: usize = 4 * 1024 * 1024;
fn read_bounded(path: impl AsRef<Path>, limit: usize) -> Result<Vec<u8>, Box<dyn Error>> {
    let file = fs::File::open(path)?;
    if file.metadata()?.len() > limit as u64 {
        return Err("Input size budget exceeded".into());
    }
    let mut bytes = Vec::new();
    file.take(limit as u64 + 1).read_to_end(&mut bytes)?;
    if bytes.len() > limit {
        return Err("Input grew past size budget".into());
    }
    Ok(bytes)
}
fn hash(bytes: &[u8]) -> String {
    Sha256::digest(bytes)
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}
fn encode(input: &[u8], compressed: bool) -> Result<Vec<u8>, Box<dyn Error>> {
    if input.len() > MAX_RECORD {
        return Err("Record budget exceeded".into());
    }
    if compressed {
        Ok(zstd::bulk::compress(input, 3)?)
    } else {
        Ok(input.to_vec())
    }
}
fn decode(
    input: &[u8],
    compressed: bool,
    length: usize,
    expected: &str,
) -> Result<Vec<u8>, Box<dyn Error>> {
    if length > MAX_RECORD || input.len() > MAX_RECORD + 65536 {
        return Err("Stored record budget exceeded".into());
    }
    let bytes = if compressed {
        zstd::bulk::decompress(input, length)?
    } else {
        input.to_vec()
    };
    if bytes.len() != length || hash(&bytes) != expected {
        return Err("Stored record integrity mismatch".into());
    }
    Ok(bytes)
}
#[derive(Serialize)]
struct Sample {
    scope: &'static str,
    round: usize,
    strategy: &'static str,
    records: usize,
    input_bytes: usize,
    stored_payload_bytes: usize,
    database_bytes: u64,
    encode_ns: u128,
    transaction_commit_ns: u128,
    encode_and_commit_ns: u128,
    reopen_read_decode_verify_ns: u128,
    all_bytes_equal: bool,
    rollback_preserved: bool,
    integrity: String,
    journal_mode: String,
    synchronous: i64,
}
fn sample(
    path: &Path,
    originals: &[Vec<u8>],
    repeat: usize,
    compressed: bool,
    round: usize,
) -> Result<Sample, Box<dyn Error>> {
    if path.exists() {
        return Err("Refuse existing experiment database".into());
    }
    let count = originals.len() * repeat;
    let total = originals.iter().map(Vec::len).sum::<usize>() * repeat;
    if count > 256 || total > MAX_WORKLOAD {
        return Err("Workload budget exceeded".into());
    }
    let mut c = Connection::open(path)?;
    c.execute_batch("PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL; CREATE TABLE records(id INTEGER PRIMARY KEY, codec TEXT NOT NULL, original_bytes INTEGER NOT NULL, sha256 TEXT NOT NULL, payload BLOB NOT NULL);")?;
    let journal_mode: String = c.query_row("PRAGMA journal_mode", [], |r| r.get(0))?;
    let synchronous: i64 = c.query_row("PRAGMA synchronous", [], |r| r.get(0))?;
    if journal_mode != "delete" || synchronous != 2 {
        return Err("Durability settings mismatch".into());
    }
    let start = Instant::now();
    let encoded: Vec<_> = (0..count)
        .map(|i| {
            let raw = &originals[i % originals.len()];
            Ok((encode(raw, compressed)?, raw.len(), hash(raw)))
        })
        .collect::<Result<_, Box<dyn Error>>>()?;
    let encode_ns = start.elapsed().as_nanos();
    let commit_started = Instant::now();
    let tx = c.transaction()?;
    {
        let mut statement = tx.prepare(
            "INSERT INTO records(id,codec,original_bytes,sha256,payload) VALUES(?1,?2,?3,?4,?5)",
        )?;
        for (i, (bytes, len, digest)) in encoded.iter().enumerate() {
            statement.execute(params![
                i as i64,
                if compressed { "zstd3" } else { "raw" },
                *len as i64,
                digest,
                bytes
            ])?;
        }
    }
    tx.commit()?;
    let transaction_commit_ns = commit_started.elapsed().as_nanos();
    let encode_and_commit_ns = start.elapsed().as_nanos();
    drop(c);
    let read_started = Instant::now();
    let mut c = Connection::open(path)?;
    let mut materialized = Vec::new();
    {
        let mut stmt =
            c.prepare("SELECT id,codec,original_bytes,sha256,payload FROM records ORDER BY id")?;
        let mut rows = stmt.query([])?;
        while let Some(row) = rows.next()? {
            let id: i64 = row.get(0)?;
            let codec: String = row.get(1)?;
            let length: i64 = row.get(2)?;
            let digest: String = row.get(3)?;
            let bytes: Vec<u8> = row.get(4)?;
            if id != materialized.len() as i64
                || length < 0
                || codec != if compressed { "zstd3" } else { "raw" }
            {
                return Err("Stored metadata mismatch".into());
            }
            materialized.push(decode(&bytes, compressed, length as usize, &digest)?);
        }
    }
    let reopen_read_decode_verify_ns = read_started.elapsed().as_nanos();
    let all_bytes_equal = materialized.len() == count
        && materialized
            .iter()
            .enumerate()
            .all(|(i, b)| b == &originals[i % originals.len()]);
    if !all_bytes_equal {
        return Err("Complete output differs".into());
    }
    {
        let tx = c.transaction()?;
        tx.execute("UPDATE records SET payload=X'00' WHERE id=0", [])?;
        tx.rollback()?;
    }
    let (b, len, digest): (Vec<u8>, i64, String) = c.query_row(
        "SELECT payload,original_bytes,sha256 FROM records WHERE id=0",
        [],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
    )?;
    let rollback_preserved = decode(&b, compressed, len as usize, &digest)? == originals[0];
    let integrity: String = c.query_row("PRAGMA integrity_check", [], |r| r.get(0))?;
    if !rollback_preserved || integrity != "ok" {
        return Err("Rollback or integrity failure".into());
    }
    drop(c);
    Ok(Sample {
        scope: if repeat == 1 {
            "six_real_public_records"
        } else {
            "generated_replay_of_six_public_records"
        },
        round,
        strategy: if compressed {
            "zstd_level3"
        } else {
            "uncompressed_blob"
        },
        records: count,
        input_bytes: total,
        stored_payload_bytes: encoded.iter().map(|x| x.0.len()).sum(),
        database_bytes: fs::metadata(path)?.len(),
        encode_ns,
        transaction_commit_ns,
        encode_and_commit_ns,
        reopen_read_decode_verify_ns,
        all_bytes_equal,
        rollback_preserved,
        integrity,
        journal_mode,
        synchronous,
    })
}
fn main() -> Result<(), Box<dyn Error>> {
    let args: Vec<_> = std::env::args().collect();
    if args.len() != 3 {
        return Err("Usage: atlas-compressed-snapshot-lab MANIFEST.json NEW_OUTPUT_DIR".into());
    }
    let manifest = read_bounded(&args[1], 16384)?;
    if manifest.len() > 16384 {
        return Err("Manifest too large".into());
    }
    let paths: Vec<String> = serde_json::from_slice(&manifest)?;
    if paths.len() != 6 {
        return Err("Exactly six permitted public records required".into());
    }
    let mut records = Vec::new();
    let mut identities = Vec::new();
    for path in &paths {
        let b = read_bounded(path, MAX_RECORD)?;
        if b.len() > MAX_RECORD {
            return Err("Input too large".into());
        }
        let _: serde_json::Value = serde_json::from_slice(&b)?;
        identities.push(serde_json::json!({"bytes":b.len(),"sha256":hash(&b)}));
        records.push(b);
    }
    let out = Path::new(&args[2]);
    fs::create_dir(out)?;
    let mut samples = Vec::new();
    let start = Instant::now();
    for repeat in [1, 32] {
        for round in 0..7 {
            for compressed in if round % 2 == 0 {
                [false, true]
            } else {
                [true, false]
            } {
                if start.elapsed().as_secs() > 120 {
                    return Err(
                        "Experiment time budget reached; earlier raw samples retained".into(),
                    );
                }
                let s = sample(
                    &out.join(format!("{repeat}-{round}-{compressed}.sqlite")),
                    &records,
                    repeat,
                    compressed,
                    round,
                )?;
                fs::write(
                    out.join(format!("{repeat}-{round}-{compressed}.json")),
                    serde_json::to_vec_pretty(&s)?,
                )?;
                samples.push(s);
            }
        }
    }
    let result = serde_json::json!({"schema_version":1,"scope":"Isolated codec/storage component; not current SnapshotStore implementation or another project baseline","sqlite_version":rusqlite::version(),"zstd_version":zstd::zstd_safe::version_string(),"input_identities":identities,"samples":samples,"limitations":["No power-loss proof; virtualized filesystem and host caches","Readback is reopened, not cold-cache","Compression and checksum CPU included; no peak-memory measurement","Replica density is generated, not additional real provider coverage","No automatic migration, deletion, default adoption or cross-project recommendation"]});
    fs::write(
        out.join("results.json"),
        serde_json::to_vec_pretty(&result)?,
    )?;
    println!(
        "{}",
        serde_json::json!({"samples":samples.len(),"all_complete":samples.iter().all(|x|x.all_bytes_equal),"elapsed_ms":start.elapsed().as_millis()})
    );
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn lossless_and_bounded() {
        let b = br#"{"n":18446744073709551617,"null":null,"text":"line\\nline"}"#;
        for compressed in [false, true] {
            let encoded = encode(b, compressed).unwrap();
            assert_eq!(decode(&encoded, compressed, b.len(), &hash(b)).unwrap(), b);
            assert!(decode(&encoded, compressed, b.len() + 1, &hash(b)).is_err());
            assert!(decode(&encoded, compressed, b.len(), "wrong").is_err());
            assert!(decode(&encoded, compressed, MAX_RECORD + 1, &hash(b)).is_err());
        }
    }
    #[test]
    fn corrupt_and_truncated_frames_fail() {
        let b = vec![b'a'; 10000];
        let encoded = encode(&b, true).unwrap();
        for n in 0..encoded.len() {
            assert!(decode(&encoded[..n], true, b.len(), &hash(&b)).is_err());
        }
        assert!(decode(&encoded, true, 100, &hash(&b)).is_err());
        let mut corrupt = encoded.clone();
        corrupt[0] ^= 255;
        assert!(decode(&corrupt, true, b.len(), &hash(&b)).is_err());
    }
}
