//! Reuses Atlas's requested-allocation counter; no instrumented timing claims.
#[path = "../../../experiments/version-validation-lab/allocation_counter.rs"]
mod counter;
use atlas_lab::{
    build_identity::sha256_hex,
    modrinth::{parse_project, parse_project_record, parse_project_record_owned},
};
use std::io::Read;
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 2 {
        return Err("Supply one retained public response".into());
    }
    let mut bytes = Vec::new();
    std::fs::File::open(&args[1])?
        .take(2 * 1024 * 1024 + 1)
        .read_to_end(&mut bytes)?;
    let id = parse_project(&bytes)?.id;
    let mut samples = Vec::new();
    for round in 0..8 {
        let start = counter::live_requested();
        let a_input = bytes.clone();
        let b_input = bytes.clone();
        let pointer = b_input.as_ptr();
        let ((a, sa), (b, sb)) = if round % 2 == 0 {
            (
                counter::measure(|| parse_project_record(&a_input, &id)),
                counter::measure(|| parse_project_record_owned(b_input, &id)),
            )
        } else {
            let b = counter::measure(|| parse_project_record_owned(b_input, &id));
            (counter::measure(|| parse_project_record(&a_input, &id)), b)
        };
        let a = a?;
        let b = b?;
        let equal = a.raw_json() == b.raw_json()
            && b.raw_json().as_bytes() == bytes
            && serde_json::to_value(a.project())? == serde_json::to_value(b.project())?;
        let reused = b.raw_json().as_ptr() == pointer;
        assert!(equal && reused);
        drop(a);
        drop(b);
        drop(a_input);
        let post = counter::live_requested() as i128 - start as i128;
        samples.push(serde_json::json!({"round":round,"complete_record_equal":equal,"candidate_reuses_owned_buffer":reused,"post_drop_live_requested_delta":post,"baseline":counter::row(sa),"candidate":counter::row(sb)}));
    }
    println!(
        "{}",
        serde_json::to_string_pretty(
            &serde_json::json!({"source_mode":"retained public response; no provider request","project_id":id,"input_bytes":bytes.len(),"input_sha256":sha256_hex(&bytes),"harness_sha256":sha256_hex(include_bytes!("project_ownership_allocations.rs")),"adapter_sha256":sha256_hex(include_bytes!("../src/modrinth.rs")),"samples":samples,"accounting_error":counter::accounting_error(),"limitations":["Both inputs already owned before measurement; input creation excluded equally","Requested Rust allocations only; not RSS, native allocations or physical peak memory","No instrumented timing, network, durable-write or full-UI speed claim","Candidate not yet connected to production collectors at this measurement"]})
        )?
    );
    Ok(())
}
