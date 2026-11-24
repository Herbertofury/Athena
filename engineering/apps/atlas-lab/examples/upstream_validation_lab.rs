//! Isolated parser comparison. No provider request or application parser change.
#[path = "../../../experiments/upstream-validation-lab/candidate.rs"]
mod candidate;
use atlas_lab::build_identity::sha256_hex;
use atlas_lab::upstream_reviews::{Source, parse_record};
use serde_json::json;
use std::{hint::black_box, io::Read, time::Instant};
fn same(a: &atlas_lab::upstream_reviews::Record, b: &candidate::Record) -> bool {
    a.revision == b.revision
        && a.source_url == b.source_url
        && a.published_at == b.published_at
        && a.payload == b.payload
}
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    let source = Source::parse(args.get(1).ok_or("Supply fixed source ID")?)?;
    let path = args.get(2).ok_or("Supply a local public JSON input")?;
    let mut bytes = Vec::new();
    std::fs::File::open(path)?
        .take(256 * 1024 + 1)
        .read_to_end(&mut bytes)?;
    if bytes.len() > 256 * 1024 {
        return Err("Input exceeds 256 KiB experiment budget".into());
    }
    let expected = parse_record(source, &bytes)?;
    if !same(&expected, &candidate::parse_record(source, &bytes)?) {
        return Err("Full record mismatch".into());
    }
    let began = Instant::now();
    let mut samples = Vec::new();
    for round in 0..24 {
        let measure = |new: bool| -> Result<(u128, bool), Box<dyn std::error::Error>> {
            let started = Instant::now();
            let mut equal = true;
            for _ in 0..100 {
                if new {
                    let r = candidate::parse_record(source, black_box(&bytes))?;
                    equal &= same(&expected, black_box(&r));
                } else {
                    let r = parse_record(source, black_box(&bytes))?;
                    equal &= r.revision == expected.revision
                        && r.source_url == expected.source_url
                        && r.published_at == expected.published_at
                        && r.payload == expected.payload;
                    black_box(r);
                }
            }
            Ok((started.elapsed().as_nanos(), equal))
        };
        let (a, b) = if round % 2 == 0 {
            (measure(false)?, measure(true)?)
        } else {
            let b = measure(true)?;
            (measure(false)?, b)
        };
        samples.push(json!({"round":round,"warmup":round<4,"iterations":100,"baseline_ns":a.0,"candidate_ns":b.0,"complete_record_equal":a.1&&b.1}));
        if began.elapsed().as_secs() >= 15 {
            break;
        }
    }
    println!(
        "{}",
        serde_json::to_string_pretty(
            &json!({"scope":"Actual Atlas parser component; caller-supplied JSON origin must be classified in the run manifest; not network or UI timing","harness_sha256":sha256_hex(include_bytes!("upstream_validation_lab.rs")),"source":source.id(),"input_bytes":bytes.len(),"input_sha256":sha256_hex(&bytes),"baseline_source_sha256":sha256_hex(include_bytes!("../src/upstream_reviews.rs")),"candidate_sha256":sha256_hex(include_bytes!("../../../experiments/upstream-validation-lab/candidate.rs")),"validator_sha256":sha256_hex(include_bytes!("../src/validated_raw.rs")),"compiler":env!("ATLAS_RUSTC_VERSION"),"profile":env!("ATLAS_BUILD_PROFILE"),"target":env!("ATLAS_BUILD_TARGET"),"flags_sha256":env!("ATLAS_BUILD_FLAGS_SHA256"),"lock_sha256":sha256_hex(include_bytes!("../Cargo.lock")),"complete":samples.len()==24,"samples":samples,"default_parser_changed":false})
        )?
    );
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    fn fixture(extra: &str) -> Vec<u8> {
        format!(" {{\"tag_name\":\"v1\",\"html_url\":\"https://github.com/video-dev/hls.js/releases/tag/v1\",\"published_at\":\"2026-10-27T00:00:00Z\",\"draft\":false,\"prerelease\":false,{extra}}}\n").into_bytes()
    }
    fn compare(bytes: &[u8]) {
        let a = parse_record(Source::Hls, bytes);
        let b = candidate::parse_record(Source::Hls, bytes);
        assert_eq!(a.is_ok(), b.is_ok());
        if let (Ok(a), Ok(b)) = (a, b) {
            assert!(same(&a, &b));
            assert_eq!(a.payload.as_bytes(), bytes);
        }
    }
    #[test]
    fn complete_bytes_and_numeric_boundaries() {
        for v in [
            "null",
            "18446744073709551617",
            "-9223372036854775809",
            "1e400",
            "1e-400",
            "-0.0",
            "[1,true,null,{\"x\":2}]",
        ] {
            compare(&fixture(&format!("\"unknown\":{v}")));
        }
    }
    #[test]
    fn schema_binding_duplicates_and_invalid_unicode() {
        for v in [
            r#""tag_name":"v2""#,
            r#""draft":true"#,
            r#""unknown":"\uD800""#,
            r#""\uDC00":1"#,
            r#""unknown":{"x":1,"x":2}"#,
        ] {
            compare(&fixture(v));
        }
        for b in [b"not json".as_slice(), b"[]", b"null", b"{}", b"\xff"] {
            compare(b);
        }
    }
    #[test]
    fn generated_single_escape_differential_stress() {
        for n in 0..=u16::MAX {
            compare(&fixture(&format!(r#""unknown":"\u{n:04x}""#)));
        }
    }
    #[test]
    fn recursive_depth_and_size_guard() {
        for n in 0..150 {
            compare(&fixture(&format!(
                "\"unknown\":{}0{}",
                "[".repeat(n),
                "]".repeat(n)
            )));
        }
        compare(&vec![b' '; candidate::MAX_BODY as usize + 1]);
    }
    #[test]
    fn commit_contract_matches() {
        let sha = "a".repeat(40);
        for tail in [
            "",
            ",\"future\":18446744073709551617",
            ",\"sha\":\"bad\"",
            ",\"future\":1e400",
        ] {
            let bytes = format!(
                r#" [{{"sha":"{sha}","html_url":"https://github.com/RustSec/advisory-db/commit/{sha}","commit":{{"committer":{{"date":"2026-10-27T00:00:00Z"}}}}{tail}}}] "#
            );
            let a = parse_record(Source::RustSec, bytes.as_bytes());
            let b = candidate::parse_record(Source::RustSec, bytes.as_bytes());
            assert_eq!(a.is_ok(), b.is_ok());
            if let (Ok(a), Ok(b)) = (a, b) {
                assert!(same(&a, &b));
            }
        }
    }
}
