//! Local authorized fixture comparison. Emits metrics only; source bodies remain local.
#[allow(dead_code)]
#[path = "../../../experiments/body-projection-lab/baseline_modrinth.rs"]
mod baseline;
use std::{hint::black_box, time::Instant};
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let path = std::env::args()
        .nth(1)
        .ok_or("Provide a local public-response fixture")?;
    let bytes = std::fs::read(path)?;
    let old = baseline::parse_project(&bytes)?;
    let new = atlas_lab::modrinth::parse_project(&bytes)?;
    let old_value = serde_json::to_value(&old)?;
    let mut new_common = serde_json::to_value(&new)?;
    new_common
        .as_object_mut()
        .ok_or("Expected object")?
        .remove("body");
    if old_value != new_common {
        return Err("Existing projection changed".into());
    }
    let source: serde_json::Value = serde_json::from_slice(&bytes)?;
    if new.body.as_deref() != source.get("body").and_then(|x| x.as_str()) {
        return Err("Body mismatch".into());
    }
    let persistence = if let Some(path) = std::env::args().nth(2) {
        let path = std::path::Path::new(&path);
        if path.exists() {
            return Err("Preserve prior database; choose a fresh path".into());
        }
        let mut store = atlas_lab::snapshots::SnapshotStore::open(path)?;
        let began = Instant::now();
        store.save_modrinth(&new.id, &new)?;
        let durable_write_ns = began.elapsed().as_nanos();
        drop(store);
        let reopened = atlas_lab::snapshots::SnapshotStore::open(path)?;
        let saved = reopened
            .latest_modrinth(&new.id)?
            .ok_or("Missing reopened project")?;
        if serde_json::to_value(saved)? != serde_json::to_value(&new)? {
            return Err("Reopened full output differs".into());
        }
        Some(
            serde_json::json!({"reopened_full_output_equal":true,"durable_write_ns":durable_write_ns}),
        )
    } else {
        None
    };
    let mut trials = Vec::new();
    for i in 0..24 {
        let measure_old = || {
            let t = Instant::now();
            for _ in 0..100 {
                black_box(baseline::parse_project(black_box(&bytes)).unwrap());
            }
            t.elapsed().as_nanos()
        };
        let measure_new = || {
            let t = Instant::now();
            for _ in 0..100 {
                black_box(atlas_lab::modrinth::parse_project(black_box(&bytes)).unwrap());
            }
            t.elapsed().as_nanos()
        };
        let (a, b) = if i % 2 == 0 {
            (measure_old(), measure_new())
        } else {
            let b = measure_new();
            (measure_old(), b)
        };
        trials.push(
            serde_json::json!({"round":i,"warmup":i<4,"baseline_100_ns":a,"candidate_100_ns":b}),
        );
    }
    println!(
        "{}",
        serde_json::json!({"id":new.id,"input_bytes":bytes.len(),"body_bytes":new.body.as_ref().map(|x|x.len()),"old_projection_bytes":serde_json::to_vec(&old)?.len(),"new_projection_bytes":serde_json::to_vec(&new)?.len(),"existing_projection_equal":true,"body_exact":true,"persistence":persistence,"trials":trials})
    );
    Ok(())
}
