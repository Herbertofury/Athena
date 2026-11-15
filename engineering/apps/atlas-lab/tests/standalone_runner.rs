use atlas_lab::{
    experiment_runner::{self, Failure, StopReason},
    journal::Journal,
};
use rusqlite::Connection;
use std::{
    path::PathBuf,
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};
struct Scratch(PathBuf);
impl Scratch {
    fn new() -> Self {
        Self::at_timestamp(
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos(),
        )
    }
    fn at_timestamp(timestamp: u128) -> Self {
        use std::sync::atomic::{AtomicU64, Ordering};
        static NEXT: AtomicU64 = AtomicU64::new(0);
        let sequence = NEXT.fetch_add(1, Ordering::Relaxed);
        let path = std::env::temp_dir().join(format!(
            "athena-standalone-{}-{timestamp}-{sequence}",
            std::process::id()
        ));
        std::fs::create_dir(&path).unwrap();
        Self(path)
    }
    fn db(&self) -> PathBuf {
        self.0.join("evidence.sqlite")
    }
}
impl Drop for Scratch {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}
#[test]
fn cancelled_and_failed_raw_evidence_survives_reopen() {
    let scratch = Scratch::new();
    let mut run = experiment_runner::run_builtin(|| true).unwrap();
    let cancelled = serde_json::to_value(&run).unwrap();
    let first;
    {
        let mut journal = Journal::open(&scratch.db()).unwrap();
        first = journal.record_run(&run).unwrap();
    }
    assert_eq!(Journal::read_run(&scratch.db(), first).unwrap(), cancelled);
    // Explicit synthetic failure receipt; this is not a claim that built-in code failed.
    run.reason = StopReason::CorrectnessFailure;
    run.completed = false;
    run.evidence.correctness_failures = 1;
    run.first_failure = Some(Failure {
        phase: "synthetic-retention-fixture",
        case_index: 7,
        input: vec!["fixture".into()],
        baseline_output: vec!["fixture".into()],
        candidate_output: vec![],
    });
    run.decision = experiment_runner::policy().evaluate(&run.evidence);
    let second;
    {
        let mut journal = Journal::open(&scratch.db()).unwrap();
        second = journal.record_run(&run).unwrap();
        assert_eq!(journal.count().unwrap(), 2);
    }
    assert_eq!(Journal::read_run(&scratch.db(), first).unwrap(), cancelled);
    assert_eq!(
        Journal::read_run(&scratch.db(), second).unwrap(),
        serde_json::to_value(run).unwrap()
    );
}
#[test]
fn output_insert_failure_rolls_back_evidence_and_oversize_refuses() {
    let scratch = Scratch::new();
    let mut journal = Journal::open(&scratch.db()).unwrap();
    {
        let c = Connection::open(scratch.db()).unwrap();
        c.execute_batch("CREATE TRIGGER reject_run BEFORE INSERT ON experiment_runs BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;").unwrap();
    }
    let mut run = experiment_runner::run_builtin(|| true).unwrap();
    assert!(journal.record_run(&run).is_err());
    assert_eq!(journal.count().unwrap(), 0);
    {
        let c = Connection::open(scratch.db()).unwrap();
        c.execute_batch("DROP TRIGGER reject_run").unwrap();
    }
    run.evidence.environment_id = "x".repeat(2 * 1024 * 1024);
    assert!(journal.record_run(&run).is_err());
    assert_eq!(journal.count().unwrap(), 0);
}
#[test]
fn read_only_missing_and_legacy_receipts_are_not_created_or_invented() {
    let scratch = Scratch::new();
    assert!(Journal::read_run(&scratch.db(), 1).is_err());
    assert!(!scratch.db().exists());
    {
        let c = Connection::open(scratch.db()).unwrap();
        c.execute_batch("CREATE TABLE legacy(value TEXT); INSERT INTO legacy VALUES('preserve')")
            .unwrap();
    }
    let before = std::fs::read(scratch.db()).unwrap();
    assert!(Journal::read_run(&scratch.db(), 1).is_err());
    assert_eq!(std::fs::read(scratch.db()).unwrap(), before);
}
#[test]
fn actual_cli_uses_bounded_runner_and_retrieves_complete_run() {
    let scratch = Scratch::new();
    let bin = env!("CARGO_BIN_EXE_atlas-lab");
    let output = Command::new(bin)
        .arg("dedup-lab")
        .arg(scratch.db())
        .output()
        .unwrap();
    assert!(
        output.status.success(),
        "{}",
        String::from_utf8_lossy(&output.stderr)
    );
    let result: serde_json::Value = serde_json::from_slice(&output.stdout).unwrap();
    for name in [
        "experiment_id",
        "evidence",
        "decision",
        "acceptance_policy",
        "limitations",
    ] {
        assert!(result.get(name).is_some());
    }
    assert_eq!(result["run"]["completed"], true);
    assert_eq!(result["run"]["evidence"]["stress_cases"], 10000);
    assert_eq!(result["evidence"], result["run"]["evidence"]);
    assert_eq!(result["decision"], result["run"]["decision"]);
    let before = std::fs::read(scratch.db()).unwrap();
    let retrieved = Command::new(bin)
        .arg("show-experiment")
        .arg(scratch.db())
        .arg(result["experiment_id"].as_i64().unwrap().to_string())
        .output()
        .unwrap();
    assert!(retrieved.status.success());
    let retrieved: serde_json::Value = serde_json::from_slice(&retrieved.stdout).unwrap();
    assert_eq!(retrieved["run"], result["run"]);
    assert_eq!(std::fs::read(scratch.db()).unwrap(), before);
}

#[test]
fn repeated_clock_fixture_directories_are_independent() {
    let fixtures = std::thread::scope(|scope| {
        let handles: Vec<_> = (0..16)
            .map(|_| scope.spawn(|| Scratch::at_timestamp(123456)))
            .collect();
        handles
            .into_iter()
            .map(|h| h.join().unwrap())
            .collect::<Vec<_>>()
    });
    let names: std::collections::HashSet<_> = fixtures.iter().map(|f| f.0.clone()).collect();
    assert_eq!(names.len(), 16);
    for (index, fixture) in fixtures.iter().enumerate() {
        std::fs::write(fixture.0.join("sentinel"), index.to_string()).unwrap();
    }
    for (index, fixture) in fixtures.iter().enumerate() {
        assert_eq!(
            std::fs::read_to_string(fixture.0.join("sentinel")).unwrap(),
            index.to_string()
        );
    }
    drop(fixtures);
    assert!(names.iter().all(|path| !path.exists()));
}
