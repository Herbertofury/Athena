//! Equal-record, already-owned-buffer validation comparison; not network latency.
use atlas_lab::{
    build_identity::sha256_hex,
    modrinth::{parse_project, parse_project_record, parse_project_record_owned},
};
use std::{hint::black_box, io::Read, time::Instant};
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    if !(2..=3).contains(&args.len()) || args.get(2).is_some_and(|x| x != "spare") {
        return Err("Supply one retained public or labeled generated input".into());
    }
    let mut bytes = Vec::new();
    std::fs::File::open(&args[1])?
        .take(2 * 1024 * 1024 + 1)
        .read_to_end(&mut bytes)?;
    let project = parse_project(&bytes)?;
    let spare = args.len() == 3;
    let expected = serde_json::to_value(&project)?;
    let mut samples = Vec::new();
    let budget = Instant::now();
    for round in 0..40 {
        if budget.elapsed().as_secs() > 30 {
            return Err("Bounded measurement budget exceeded".into());
        }
        for lane in if round % 2 == 0 {
            ["borrowed_copy", "owned_reuse"]
        } else {
            ["owned_reuse", "borrowed_copy"]
        } {
            let mut input = Vec::with_capacity(bytes.len() * if spare { 2 } else { 1 });
            input.extend_from_slice(&bytes);
            let pointer = input.as_ptr();
            let started = Instant::now();
            let record = if lane == "borrowed_copy" {
                parse_project_record(black_box(&input), &project.id)?
            } else {
                parse_project_record_owned(black_box(input), &project.id)?
            };
            let elapsed_ns = started.elapsed().as_nanos();
            let equal = record.raw_json().as_bytes() == bytes
                && serde_json::to_value(record.project())? == expected;
            assert!(equal);
            let reuse = record.raw_json().as_ptr() == pointer;
            if lane == "owned_reuse" && !spare {
                assert!(reuse);
            }
            samples.push(serde_json::json!({"round":round,"warmup":round<8,"lane":lane,"elapsed_ns":elapsed_ns,"complete_record_equal":equal,"raw_buffer_reused":reuse}));
        }
    }
    println!(
        "{}",
        serde_json::to_string_pretty(
            &serde_json::json!({"input_bytes":bytes.len(),"input_capacity_mode":if spare{"double length"}else{"exact length"},"input_sha256":sha256_hex(&bytes),"project_id":project.id,"harness_sha256":sha256_hex(include_bytes!("project_ownership_lab.rs")),"adapter_sha256":sha256_hex(include_bytes!("../src/modrinth.rs")),"samples":samples,"scope":"Equal complete records from already owned buffers; input creation excluded equally; eight warmup plus 32 measured alternating pairs","limitations":["Not network, SQLite, full-UI or durable-write timing","One host; no universal stack recommendation","Allocation instrumentation is in a separate executable"]})
        )?
    );
    Ok(())
}
