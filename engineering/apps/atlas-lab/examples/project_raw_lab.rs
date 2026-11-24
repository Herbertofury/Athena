//! Retained-public-response coverage/cost comparison, not equal-output speed ranking.
use atlas_lab::{
    build_identity::sha256_hex,
    modrinth::{parse_project_record, parse_requested_project},
    snapshots::SnapshotStore,
};
use std::{io::Read, path::Path, time::Instant};
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() != 3 {
        return Err("Usage: project_raw_lab PUBLIC_RESPONSE.json NEW_DIRECTORY".into());
    }
    let mut bytes = Vec::new();
    std::fs::File::open(&args[1])?
        .take(2 * 1024 * 1024 + 1)
        .read_to_end(&mut bytes)?;
    let original = atlas_lab::modrinth::parse_project(&bytes)?;
    let full: serde_json::Value = serde_json::from_slice(&bytes)?;
    let projection = serde_json::to_value(&original)?;
    let added: Vec<_> = full
        .as_object()
        .ok_or("object required")?
        .keys()
        .filter(|k| !projection.as_object().unwrap().contains_key(*k))
        .cloned()
        .collect();
    let dir = Path::new(&args[2]);
    std::fs::create_dir(dir)?; // Existing evidence is never overwritten.
    let (baseline_path, raw_path) = (dir.join("projection.sqlite"), dir.join("complete.sqlite"));
    let mut baseline = SnapshotStore::open(&baseline_path)?;
    let mut archive = SnapshotStore::open(&raw_path)?;
    let began = Instant::now();
    let mut samples = Vec::new();
    for round in 0..16 {
        if began.elapsed().as_secs() > 30 {
            return Err("Local measurement budget exceeded; databases retained".into());
        }
        for lane in if round % 2 == 0 {
            ["projection", "complete"]
        } else {
            ["complete", "projection"]
        } {
            let started = Instant::now();
            let (parse_ns, write_ns) = if lane == "projection" {
                let record = parse_requested_project(&bytes, &original.id)?;
                let parsed = Instant::now();
                baseline.save_modrinth(&original.id, &record)?;
                (
                    parsed.duration_since(started).as_nanos(),
                    parsed.elapsed().as_nanos(),
                )
            } else {
                let record = parse_project_record(&bytes, &original.id)?;
                let parsed = Instant::now();
                archive.save_modrinth_project_record(&original.id, &record)?;
                (
                    parsed.duration_since(started).as_nanos(),
                    parsed.elapsed().as_nanos(),
                )
            };
            let end_to_end_ns = started.elapsed().as_nanos();
            if lane == "projection" {
                assert_eq!(
                    serde_json::to_value(baseline.latest_modrinth(&original.id)?.unwrap())?,
                    projection
                );
            } else {
                let saved = archive
                    .latest_modrinth_project_record(&original.id)?
                    .unwrap();
                assert_eq!(saved.raw_json().as_bytes(), bytes);
                assert_eq!(serde_json::to_value(saved.project())?, projection);
            }
            samples.push(serde_json::json!({"round":round,"warmup":round<4,"lane":lane,"parse_ns":parse_ns,"write_and_commit_ns":write_ns,"end_to_end_ns":end_to_end_ns,"complete_existing_projection_equal":true,"exact_original_wire_retained":lane=="complete"}));
        }
    }
    drop(baseline);
    drop(archive);
    let reopened = SnapshotStore::open(&raw_path)?;
    reopened.record_project_raw_failure(&original.id)?;
    let restored = reopened
        .latest_modrinth_project_record(&original.id)?
        .unwrap();
    assert_eq!(restored.raw_json().as_bytes(), bytes);
    assert_eq!(serde_json::to_value(restored.project())?, projection);
    let receipt = serde_json::json!({"source_mode":"retained public response; no new provider request","harness_sha256":sha256_hex(include_bytes!("project_raw_lab.rs")),"adapter_sha256":sha256_hex(include_bytes!("../src/modrinth.rs")),"snapshot_store_sha256":sha256_hex(include_bytes!("../src/snapshots.rs")),"project_id":original.id,"source_bytes":bytes.len(),"source_sha256":sha256_hex(&bytes),"typed_projection_bytes":serde_json::to_vec(&projection)?.len(),"additional_top_level_fields":added,"samples":samples,"reopened_exact_wire_equal":true,"failed_refresh_retained_last_good":true,"snapshot_write_policy":"Existing SnapshotStore synchronous FULL, atomic snapshot/attempt transaction","database_bytes":{"projection":std::fs::metadata(baseline_path)?.len(),"complete":std::fs::metadata(raw_path)?.len()},"limitations":["Outputs differ in coverage; timings are costs, not a fair speed ranking","One local filesystem, sequential paired requests; not target hardware throughput","No power-loss, native UI, peak-memory, authenticated or exhaustive platform acceptance"]});
    println!("{}", serde_json::to_string_pretty(&receipt)?);
    Ok(())
}
