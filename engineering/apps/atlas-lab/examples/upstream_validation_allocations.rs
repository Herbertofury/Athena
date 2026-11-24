//! Isolated requested-allocation measurements, never RSS or timing claims.
#[path = "../../../experiments/upstream-validation-lab/candidate.rs"]
mod candidate;
#[path = "../../../experiments/version-validation-lab/allocation_counter.rs"]
mod counter;
use atlas_lab::build_identity::sha256_hex;
use atlas_lab::upstream_reviews::{Source, parse_record};
use serde_json::json;
use std::{hint::black_box, io::Read};
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    let source = Source::parse(args.get(1).ok_or("Supply fixed source ID")?)?;
    let mut bytes = Vec::new();
    std::fs::File::open(args.get(2).ok_or("Supply local public response")?)?
        .take(256 * 1024 + 1)
        .read_to_end(&mut bytes)?;
    if bytes.len() > 256 * 1024 {
        return Err("Input exceeds 256 KiB".into());
    }
    let mut samples = Vec::new();
    for round in 0..6 {
        let start = counter::live_requested();
        let base = || parse_record(source, black_box(&bytes));
        let cand = || candidate::parse_record(source, black_box(&bytes));
        let ((a, sa), (b, sb)) = if round % 2 == 0 {
            (counter::measure(base), counter::measure(cand))
        } else {
            let b = counter::measure(cand);
            (counter::measure(base), b)
        };
        let equal = matches!((&a,&b),(Ok(a),Ok(b)) if a.revision==b.revision&&a.source_url==b.source_url&&a.published_at==b.published_at&&a.payload==b.payload);
        drop(a);
        drop(b);
        let post = counter::live_requested() as i128 - start as i128;
        samples.push(json!({"round":round,"complete_record_equal":equal,"post_drop_live_requested_delta":post,"baseline":counter::row(sa),"candidate":counter::row(sb)}));
    }
    println!(
        "{}",
        serde_json::to_string_pretty(
            &json!({"source":source.id(),"input_bytes":bytes.len(),"input_sha256":sha256_hex(&bytes),"scope":"Requested Rust allocations for actual upstream parser; not RSS, stack, native allocation or physical peak; no instrumented timing claims","samples":samples,"accounting_error":counter::accounting_error(),"default_parser_changed":false})
        )?
    );
    Ok(())
}
