//! Offline queue/coordinator integration using retained public response bytes.
use atlas_lab::{
    build_identity::sha256_hex,
    jobs::{Job, Queue},
    snapshots::SnapshotStore,
};
use std::{io::Read, path::Path};
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 3 {
        return Err("Usage: project_archive_queue_lab NEW_DIRECTORY PUBLIC_RESPONSE...".into());
    }
    if args.len() > 6 {
        return Err("At most four retained responses per run".into());
    }
    let dir = Path::new(&args[1]);
    std::fs::create_dir(dir)?;
    let path = dir.join("workflow.sqlite");
    let mut queue = Queue::open(&path)?;
    let mut results = Vec::new();
    for (index, file) in args[2..].iter().enumerate() {
        let mut bytes = Vec::new();
        std::fs::File::open(file)?
            .take(2 * 1024 * 1024 + 1)
            .read_to_end(&mut bytes)?;
        let original = atlas_lab::modrinth::parse_project(&bytes)?;
        let requested = original.slug.to_ascii_uppercase();
        let clock = (index as i64) * 100;
        let job = Job::CollectModrinthRaw {
            project: requested.clone(),
        };
        let id = queue.enqueue(&job, clock)?;
        let claim = queue
            .claim("offline-fixture-worker", clock + 1, 60000)?
            .ok_or("Missing claim")?;
        assert_eq!(claim.id, id);
        assert_eq!(claim.job, job);
        let receipt = atlas_lab::project_archive::collect(&path, &requested, || {
            atlas_lab::modrinth::parse_project_record(&bytes, &requested)
        })?;
        let output = serde_json::json!({"project_archive":receipt});
        queue.finish_output(&claim, true, clock + 2, Some(&output))?;
        let store = SnapshotStore::open(&path)?;
        let restored = store
            .latest_modrinth_project_record(&original.id)?
            .ok_or("Missing archived data")?;
        assert_eq!(restored.raw_json().as_bytes(), bytes);
        assert_eq!(
            serde_json::to_value(restored.project())?,
            serde_json::to_value(&original)?
        );
        let failure_id = queue.enqueue(&job, clock + 3)?;
        let failure_claim = queue
            .claim("offline-fixture-worker", clock + 4, 60000)?
            .ok_or("Missing failure claim")?;
        assert_eq!(failure_claim.id, failure_id);
        let error = atlas_lab::project_archive::collect(&path, &requested, || {
            Err("generated transport failure, private marker=DO_NOT_DISCLOSE".into())
        })
        .unwrap_err();
        assert!(!error.contains("DO_NOT_DISCLOSE"));
        queue.finish_output(
            &failure_claim,
            false,
            clock + 5,
            Some(&serde_json::json!({"error":error})),
        )?;
        assert_eq!(
            store
                .latest_modrinth_project_record(&original.id)?
                .unwrap()
                .raw_json()
                .as_bytes(),
            bytes
        );
        results.push(serde_json::json!({"canonical_id":original.id,"source_sha256":sha256_hex(&bytes),"source_bytes":bytes.len(),"queue_job_id":id.to_string(),"failed_job_id":failure_id.to_string(),"receipt":output,"job_output_bytes":serde_json::to_vec(&output)?.len(),"complete_typed_projection_equal":true,"exact_original_json_reopened":true,"failed_refresh_retained_last_good":true}));
    }
    let overview = queue.overview()?;
    assert_eq!(
        overview["counts"]["succeeded"].as_u64(),
        Some(results.len() as u64)
    );
    assert_eq!(
        overview["counts"]["failed"].as_u64(),
        Some(results.len() as u64)
    );
    println!(
        "{}",
        serde_json::to_string_pretty(
            &serde_json::json!({"mode":"retained public bytes through actual queue and archival coordinator; fetch is fixture-supplied, no provider requests","harness_sha256":sha256_hex(include_bytes!("project_archive_queue_lab.rs")),"coordinator_sha256":sha256_hex(include_bytes!("../src/project_archive.rs")),"queue_source_sha256":sha256_hex(include_bytes!("../src/jobs.rs")),"results":results,"queue_counts":overview["counts"],"scope":"not live HTTP-provider or native-browser acceptance; snapshot commit and job finalization are separate, not exactly-once"})
        )?
    );
    Ok(())
}
