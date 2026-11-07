//! Explicit local experiment. The application parser is not replaced.
#[path = "../../../experiments/version-validation-lab/candidate.rs"]
mod candidate;
use serde_json::json;
use std::{hint::black_box, io::Read, time::Instant};
fn same(
    a: &atlas_lab::modrinth_versions::VersionRecord,
    b: &atlas_lab::modrinth_versions::VersionRecord,
) -> bool {
    a.canonical_id == b.canonical_id
        && a.project_id == b.project_id
        && a.payload.get() == b.payload.get()
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let path = std::env::args()
        .nth(1)
        .ok_or("Supply one local public version JSON response")?;
    let mut bytes = Vec::new();
    std::fs::File::open(path)?
        .take(256 * 1024 + 1)
        .read_to_end(&mut bytes)?;
    if bytes.len() > 256 * 1024 {
        return Err("Benchmark input exceeds 256 KiB budget".into());
    }
    let a = atlas_lab::modrinth_versions::parse_version(&bytes)?;
    let b = candidate::parse_version(&bytes)?;
    if !same(&a, &b) {
        return Err("Full original payload or binding mismatch".into());
    }
    let started = Instant::now();
    let mut trials = Vec::new();
    for round in 0..24 {
        let measure = |new: bool| {
            let began = Instant::now();
            let mut equal = true;
            for _ in 0..100 {
                let result = if new {
                    candidate::parse_version(black_box(&bytes))
                } else {
                    atlas_lab::modrinth_versions::parse_version(black_box(&bytes))
                }
                .unwrap();
                equal &= same(black_box(&result), &a);
            }
            (began.elapsed().as_nanos(), equal)
        };
        let (base, cand) = if round % 2 == 0 {
            (measure(false), measure(true))
        } else {
            let c = measure(true);
            (measure(false), c)
        };
        trials.push(json!({"round":round,"warmup":round<4,"baseline_100_ns":base.0,"candidate_100_ns":cand.0,"full_payload_and_binding_equal":base.1&&cand.1}));
        if started.elapsed().as_secs() >= 30 {
            break;
        }
    }
    println!(
        "{}",
        serde_json::to_string_pretty(
            &json!({"scope":"actual Atlas version-parser component on a retained public response; not promoted","input_bytes":bytes.len(),"canonical_id":a.canonical_id,"complete":trials.len()==24,"trials":trials,"limitations":["Full-byte comparison included in both timers","No network, storage, UI or peak-memory acceptance","Candidate still isolated from application collector"]})
        )?
    );
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    fn fixture() -> String {
        r#"{"id":"abcdefgh","project_id":"AANobbMI","name":"Fixture","version_number":"1","date_published":"2026-10-27","game_versions":["1.21.1"],"loaders":["fabric"],"files":[{"filename":"x.jar","url":"https://cdn.modrinth.com/x.jar","size":42,"primary":true,"hashes":{"sha1":"fixture"}}],"dependencies":[{}],"unknown":{"large":18446744073709551617,"null":null,"string":"whole text"}}"#.into()
    }
    fn parity(input: &[u8]) {
        let a = atlas_lab::modrinth_versions::parse_version(input);
        let b = candidate::parse_version(input);
        assert_eq!(a.is_ok(), b.is_ok(), "{}", String::from_utf8_lossy(input));
        if let (Ok(a), Ok(b)) = (a, b) {
            assert!(same(&a, &b));
        }
    }
    #[test]
    fn known_and_unknown_validation_and_duplicate_semantics() {
        let f = fixture();
        parity(f.as_bytes());
        for old in ["42", "1e400", "-1", "1.0", "null", "\"42\""] {
            parity(f.replace("42", old).as_bytes());
        }
        for input in [
            format!("  {f}\n"),
            f.replace("whole text", "\\uD800"),
            f.replace("whole text", "\\uD83D\\uDE00"),
            f.replacen("{", "{\"id\":\"ijklmnop\",", 1),
            f.replace("\"name\":\"Fixture\"", "\"name\":null,\"name\":\"Fixture\""),
            f.replace("\"sha1\":\"fixture\"", "\"sha1\":null,\"sha1\":\"fixture\""),
            f.replace("abcdefgh", "a\\u0062cdefgh"),
        ] {
            parity(input.as_bytes());
        }
        parity(&vec![b' '; 2 * 1024 * 1024 + 1]);
    }
    #[test]
    fn deterministic_complete_payload_stress() {
        let f = fixture();
        for n in 0..10_000 {
            let value = if n % 5 == 0 {
                "\\uD800".into()
            } else {
                format!("record-{n}-é-\\n-full")
            };
            parity(f.replace("whole text", &value).as_bytes());
        }
    }
}
