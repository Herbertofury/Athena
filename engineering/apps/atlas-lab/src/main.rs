use atlas_lab::{
    Evidence, Gate, Trial,
    collection::{indexed_unique, reference_unique},
    journal::Journal,
};
use std::{hint::black_box, path::Path, time::Instant};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args: Vec<String> = std::env::args().collect();
    if args.len() == 4 && args[1] == "review-upstream" {
        let source = atlas_lab::upstream_reviews::Source::parse(&args[3])?;
        let (accepted, receipt) = atlas_lab::upstream_reviews::review(
            &atlas_lab::upstream_reviews::PublicClient::new()?,
            source,
            Path::new(&args[2]),
        )?;
        println!("{}", serde_json::to_string_pretty(&receipt)?);
        if !accepted {
            return Err(
                "No new upstream observation; failure or cooldown receipt printed above".into(),
            );
        }
        return Ok(());
    }
    if args.len() >= 4 && args[1] == "collect-modrinth-versions" {
        let ids = &args[3..];
        atlas_lab::modrinth_versions::versions_url(ids)?;
        let mut store = atlas_lab::snapshots::SnapshotStore::open(Path::new(&args[2]))?;
        match atlas_lab::modrinth::PublicClient::new()?.versions(ids) {
            Ok(batch) => {
                let generations = store.save_modrinth_versions(&batch)?;
                #[derive(serde::Serialize)]
                struct Receipt {
                    generations: Vec<(String, i64)>,
                    batch: atlas_lab::modrinth_versions::VersionBatch,
                    scope: &'static str,
                }
                println!(
                    "{}",
                    serde_json::to_string_pretty(&Receipt {
                        generations,
                        batch,
                        scope: "bounded public version metadata; file links retained only, no downloads or execution; CLI lane, not queued UI coverage"
                    })?
                );
                return Ok(());
            }
            Err(error) => {
                store.record_version_failure(ids)?;
                return Err(error);
            }
        }
    }
    if args.len() >= 4 && args[1] == "collect-modrinth-batch" {
        let ids = &args[3..];
        atlas_lab::modrinth::projects_url(ids)?;
        let mut store = atlas_lab::snapshots::SnapshotStore::open(Path::new(&args[2]))?;
        match atlas_lab::modrinth::PublicClient::new()?.projects(ids) {
            Ok(batch) => {
                let generations = store.save_modrinth_batch(&batch)?;
                println!(
                    "{}",
                    serde_json::to_string_pretty(
                        &serde_json::json!({"generations":generations,"batch":batch,"scope":"bounded public project projection; missing IDs explicit, not a complete content collector"})
                    )?
                );
                return Ok(());
            }
            Err(error) => {
                store.record_batch_failure(ids)?;
                return Err(error);
            }
        }
    }
    if args.len() == 3 && args[1] == "storage-lab" {
        println!(
            "{}",
            serde_json::to_string_pretty(&atlas_lab::storage_lab::run(Path::new(&args[2]))?)?
        );
        return Ok(());
    }
    if args.len() == 3 && matches!(args[1].as_str(), "serve" | "serve-candidate") {
        return tokio::runtime::Builder::new_multi_thread()
            .worker_threads(2)
            .enable_all()
            .build()?
            .block_on(async {
                if args[1] == "serve-candidate" {
                    atlas_lab::server::serve_candidate(args[2].clone().into()).await
                } else {
                    atlas_lab::server::serve(args[2].clone().into()).await
                }
            });
    }
    if args.len() == 4 && args[1] == "collect-modrinth-raw" {
        atlas_lab::modrinth::project_url(&args[2])?;
        let mut store = atlas_lab::snapshots::SnapshotStore::open(Path::new(&args[3]))?;
        match atlas_lab::modrinth::PublicClient::new()?.project_record(&args[2]) {
            Ok(record) => {
                let generation = store.save_modrinth_project_record(&args[2], &record)?;
                println!(
                    "{}",
                    serde_json::to_string_pretty(
                        &serde_json::json!({"generation":generation.to_string(),"project_id":record.project().id,"payload_bytes":record.raw_json().len(),"payload_sha256":atlas_lab::build_identity::sha256_hex(record.raw_json().as_bytes()),"scope":"Complete received single public project JSON retained locally; not all project content. Optional CLI lane, no queued UI or account coverage."})
                    )?
                );
                return Ok(());
            }
            Err(error) => {
                store.record_project_raw_failure(&args[2])?;
                return Err(error);
            }
        }
    }
    if args.len() == 4 && args[1] == "collect-modrinth" {
        atlas_lab::modrinth::project_url(&args[2])?;
        let mut store = atlas_lab::snapshots::SnapshotStore::open(Path::new(&args[3]))?;
        match atlas_lab::modrinth::PublicClient::new()?.project(&args[2]) {
            Ok(project) => {
                let generation = store.save_modrinth(&args[2], &project)?;
                println!(
                    "{}",
                    serde_json::to_string_pretty(
                        &serde_json::json!({"generation":generation,"project":project,"scope":"one public project metadata projection; not all project content"})
                    )?
                );
                return Ok(());
            }
            Err(error) => {
                store.record_failure(&args[2])?;
                return Err(error);
            }
        }
    }
    if args.len() == 3 && args[1] == "modrinth-project" {
        let project = atlas_lab::modrinth::PublicClient::new()?.project(&args[2])?;
        println!("{}", serde_json::to_string_pretty(&project)?);
        return Ok(());
    }
    if args.len() != 3 || args[1] != "dedup-lab" {
        eprintln!(
            "Usage: atlas-lab review-upstream OUTPUT.sqlite rustsec|hls|serde-json\n       atlas-lab collect-modrinth-versions OUTPUT.sqlite CANONICAL_VERSION_ID...\n       atlas-lab serve OUTPUT.sqlite\n       atlas-lab serve-candidate OUTPUT.sqlite (isolated validated-raw overview)\n       atlas-lab storage-lab NEW_DIRECTORY\n       atlas-lab collect-modrinth-batch OUTPUT.sqlite CANONICAL_ID...\n       atlas-lab modrinth-project ID_OR_SLUG\n       atlas-lab collect-modrinth ID_OR_SLUG OUTPUT.sqlite\n       atlas-lab collect-modrinth-raw ID_OR_SLUG OUTPUT.sqlite (complete received public JSON)\n       atlas-lab dedup-lab OUTPUT.sqlite\nRuns a built-in generated-workload experiment only. No downloads or deployment."
        );
        std::process::exit(2);
    }
    let input: Vec<String> = (0..6000)
        .map(|i| format!("provider:item-{:05}", (i * 37) % 4001))
        .collect();
    let mut trials = Vec::new();
    for round in 0..17 {
        let measure = |indexed: bool| {
            let start = Instant::now();
            let result = if indexed {
                indexed_unique(black_box(&input))
            } else {
                reference_unique(black_box(&input))
            };
            black_box(&result);
            (
                start.elapsed().as_nanos().min(u64::MAX as u128) as u64,
                result,
            )
        };
        // Alternate ordering; the first two pairs warm both implementations and are not measured samples.
        let (baseline, candidate) = if round % 2 == 0 {
            (measure(false), measure(true))
        } else {
            let c = measure(true);
            let b = measure(false);
            (b, c)
        };
        if round >= 2 {
            trials.push(Trial {
                baseline_ns: baseline.0,
                candidate_ns: candidate.0,
                equal_complete_output: baseline.1 == candidate.1,
                peak_bytes: 0, // Explicitly unmeasured, blocks review eligibility.
                cancelled_cleanly: None, // Cancellation support not yet implemented or tested.
            });
        }
    }
    let evidence = Evidence {
        candidate_revision: "indexed-unique-v1".into(),
        baseline_revision: "linear-unique-v1".into(),
        workload_id: "generated-6000-ids-4001-unique-v1".into(),
        environment_id: format!(
            "{}; runner:{}",
            atlas_lab::build_identity::environment("standalone generated workload"),
            atlas_lab::build_identity::sha256_hex(include_bytes!("main.rs"))
        ),
        trials,
        stress_cases: 0,
        stress_failures: 0,
        correctness_failures: 0,
    };
    let policy = Gate {
        minimum_pairs: 15,
        minimum_stress_cases: 10_000,
        minimum_speedup: 1.1,
        memory_budget_bytes: 64 * 1024 * 1024,
    };
    let decision = policy.evaluate(&evidence);
    let mut journal = Journal::open(Path::new(&args[2]))?;
    let id = journal.record(&evidence, &policy, None)?;
    println!(
        "{}",
        serde_json::to_string_pretty(
            &serde_json::json!({"experiment_id":id,"evidence":evidence,"decision":decision,"acceptance_policy":policy.snapshot(),
        "limitations":["No peak memory measurement","Cancellation not implemented/tested","No production acceptance","Generated IDs, not a live platform collection","Unit stress cases are not counted as this run's evidence"]})
        )?
    );
    Ok(())
}
