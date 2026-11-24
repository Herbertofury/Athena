//! Fresh-process Linux RSS/HWM observation, not an allocation counter or app-wide claim.
use atlas_lab::{
    build_identity::sha256_hex,
    modrinth::{parse_project, parse_project_record, parse_project_record_owned},
};
use std::io::Read;
#[path = "../../../experiments/process-memory-lab/linux_memory.rs"]
mod linux_memory;
use linux_memory::memory;
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 4
        || !matches!(args[2].as_str(), "baseline" | "candidate")
        || !matches!(args[3].as_str(), "exact" | "spare")
    {
        return Err(
            "Usage: project_process_memory_lab INPUT.json baseline|candidate exact|spare".into(),
        );
    }
    let before_input = memory()?;
    let mut bytes = Vec::new();
    std::fs::File::open(&args[1])?
        .take(2 * 1024 * 1024 + 1)
        .read_to_end(&mut bytes)?;
    let project = parse_project(&bytes)?;
    let expected = serde_json::to_value(&project)?;
    let before_records = memory()?;
    let mut records = Vec::with_capacity(8);
    for _ in 0..8 {
        let mut input = Vec::with_capacity(bytes.len() * if args[3] == "spare" { 2 } else { 1 });
        input.extend_from_slice(&bytes);
        let record = if args[2] == "candidate" {
            parse_project_record_owned(input, &project.id)?
        } else {
            let result = parse_project_record(&input, &project.id)?;
            drop(input);
            result
        };
        records.push(record);
    }
    for r in &records {
        assert_eq!(r.raw_json().as_bytes(), bytes);
        assert_eq!(serde_json::to_value(r.project())?, expected);
    }
    let retained = memory()?;
    let count = records.len();
    drop(records);
    let after_drop = memory()?;
    println!(
        "{}",
        serde_json::to_string_pretty(
            &serde_json::json!({"schema_version":2,"lane":args[2],"capacity_mode":args[3],"source_bytes":bytes.len(),"source_sha256":sha256_hex(&bytes),"project_id":project.id,"repeated_records":count,"complete_output_equal":true,"before_input":before_input,"before_records":before_records,"retained":retained,"after_drop":after_drop,"harness_sha256":sha256_hex(include_bytes!("project_process_memory_lab.rs")),"adapter_sha256":sha256_hex(include_bytes!("../src/modrinth.rs")),"observer_sha256":sha256_hex(include_bytes!("../../../experiments/process-memory-lab/linux_memory.rs")),"limitations":["Eight repeats of one retained input; generated stress replay, not eight unique provider records","Whole fresh Linux process including runtime, input, validation and measurement overhead","OS accounting is page-granular and allocator-dependent; after-drop RSS need not fall","Not browser/GPU memory, Windows, shared-service RSS or a target-project adoption result","No elapsed-time or warm-cache speed claim"]})
        )?
    );
    Ok(())
}
