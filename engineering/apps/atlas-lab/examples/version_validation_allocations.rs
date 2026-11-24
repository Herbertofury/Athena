//! Isolated requested-Rust-allocation comparison, never application RSS or timing.
#[path = "../../../experiments/version-validation-lab/candidate.rs"]
mod candidate;
#[path = "../../../experiments/version-validation-lab/allocation_counter.rs"]
mod counter;
use serde_json::json;
use std::{hint::black_box, io::Read};
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let path = std::env::args()
        .nth(1)
        .ok_or("Supply one local public version response")?;
    let mut bytes = Vec::new();
    std::fs::File::open(path)?
        .take(256 * 1024 + 1)
        .read_to_end(&mut bytes)?;
    if bytes.len() > 256 * 1024 {
        return Err("Allocation experiment input exceeds 256 KiB".into());
    }
    let mut samples = Vec::new();
    let id = atlas_lab::modrinth_versions::parse_version(&bytes)?.canonical_id;
    for round in 0..6 {
        let start = counter::live_requested();
        let base = || atlas_lab::modrinth_versions::parse_version(black_box(&bytes));
        let cand = || candidate::parse_version(black_box(&bytes));
        let ((a, sa), (b, sb)) = if round % 2 == 0 {
            (counter::measure(base), counter::measure(cand))
        } else {
            let c = counter::measure(cand);
            (counter::measure(base), c)
        };
        let equal = matches!((&a,&b),(Ok(a),Ok(b)) if a.canonical_id==b.canonical_id&&a.project_id==b.project_id&&a.payload.get()==b.payload.get());
        drop(a);
        drop(b);
        let post_drop = counter::live_requested() as i128 - start as i128;
        samples.push(json!({"round":round,"full_payload_and_binding_equal":equal,"post_drop_requested_live_delta":post_drop,"baseline":counter::row(sa),"candidate":counter::row(sb)}));
    }
    println!(
        "{}",
        serde_json::to_string_pretty(
            &json!({"scope":"actual Atlas version-parser component; requested Rust allocation counters only","canonical_id":id,"input_bytes":bytes.len(),"accounting_error":counter::accounting_error(),"samples":samples,"limits":["No time measurements from instrumented code","Not RSS, native allocator usage, stack or physical peak","Original input retained outside each delta; output raw JSON is retained identically","Default application parser is unchanged"]})
        )?
    );
    Ok(())
}
