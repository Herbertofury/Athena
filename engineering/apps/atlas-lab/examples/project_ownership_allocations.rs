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
    if !(2..=3).contains(&args.len()) || args.get(2).is_some_and(|x| x != "spare") {
        return Err("Supply one retained public response".into());
    }
    let mut bytes = Vec::new();
    std::fs::File::open(&args[1])?
        .take(2 * 1024 * 1024 + 1)
        .read_to_end(&mut bytes)?;
    let id = parse_project(&bytes)?.id;
    let spare = args.len() == 3;
    let make_input = || {
        let mut v = Vec::with_capacity(bytes.len() * if spare { 2 } else { 1 });
        v.extend_from_slice(&bytes);
        v
    };
    let mut samples = Vec::new();
    for round in 0..8 {
        let start = counter::live_requested();
        let a_input = make_input();
        let b_input = make_input();
        let input_capacity = b_input.capacity();
        let pointer = b_input.as_ptr();
        let ((a, sa), (b, sb)) = if round % 2 == 0 {
            (
                counter::measure(|| {
                    let result = parse_project_record(&a_input, &id);
                    drop(a_input);
                    result
                }),
                counter::measure(|| parse_project_record_owned(b_input, &id)),
            )
        } else {
            let b = counter::measure(|| parse_project_record_owned(b_input, &id));
            (
                counter::measure(|| {
                    let result = parse_project_record(&a_input, &id);
                    drop(a_input);
                    result
                }),
                b,
            )
        };
        let a = a?;
        let b = b?;
        let equal = a.raw_json() == b.raw_json()
            && b.raw_json().as_bytes() == bytes
            && serde_json::to_value(a.project())? == serde_json::to_value(b.project())?;
        let reused = b.raw_json().as_ptr() == pointer;
        assert!(equal);
        if !spare {
            assert!(reused);
        }
        drop(a);
        drop(b);
        let post = counter::live_requested() as i128 - start as i128;
        let a_stats = counter::row(sa);
        let b_stats = counter::row(sb);
        let a_retained = a_stats["held_requested_rust_bytes_above_start"]
            .as_i64()
            .unwrap()
            + input_capacity as i64;
        let b_retained = b_stats["held_requested_rust_bytes_above_start"]
            .as_i64()
            .unwrap()
            + input_capacity as i64;
        assert_eq!(a_retained, b_retained);
        samples.push(serde_json::json!({"round":round,"complete_record_equal":equal,"candidate_reuses_owned_buffer":reused,"post_drop_live_requested_delta":post,"input_capacity":input_capacity,"baseline_retained_record_requested_bytes":a_retained,"candidate_retained_record_requested_bytes":b_retained,"baseline":a_stats,"candidate":b_stats}));
    }
    println!(
        "{}",
        serde_json::to_string_pretty(
            &serde_json::json!({"source_mode":"retained public response; no provider request","project_id":id,"input_capacity_mode":if spare{"double length"}else{"exact length"},"input_bytes":bytes.len(),"input_sha256":sha256_hex(&bytes),"harness_sha256":sha256_hex(include_bytes!("project_ownership_allocations.rs")),"adapter_sha256":sha256_hex(include_bytes!("../src/modrinth.rs")),"samples":samples,"accounting_error":counter::accounting_error(),"limitations":["Both inputs already owned before measurement; input creation excluded equally","Requested Rust allocations only; not RSS, native allocations or physical peak memory","No instrumented timing, network, durable-write or full-UI speed claim","Final checked implementation; spare capacity discarded, may reallocate"]})
        )?
    );
    Ok(())
}
