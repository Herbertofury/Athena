//! Evidence gates for bounded implementation experiments, not a general self-rewriting AI.
extern crate self as atlas_lab;
pub mod collection_failure;
mod storage_connection;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct Trial {
    pub baseline_ns: u64,
    pub candidate_ns: u64,
    pub equal_complete_output: bool,
    pub peak_bytes: u64,
    pub cancelled_cleanly: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Evidence {
    pub candidate_revision: String,
    pub baseline_revision: String,
    pub workload_id: String,
    pub environment_id: String,
    pub trials: Vec<Trial>,
    pub stress_cases: u64,
    pub stress_failures: u64,
    #[serde(default, skip_serializing_if = "is_zero")]
    pub correctness_failures: u64,
}

fn is_zero(value: &u64) -> bool {
    *value == 0
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Decision {
    Incomplete(String),
    Stabilize(String),
    RetainBaseline(String),
    EligibleForReview { median_speedup: f64 },
}

/// Explicit workload-specific limits. Passing does not authorize production deployment.
#[derive(Debug, Clone)]
pub struct Gate {
    pub minimum_pairs: usize,
    pub minimum_stress_cases: u64,
    pub minimum_speedup: f64,
    pub memory_budget_bytes: u64,
}

/// Versioned acceptance requirements, stored with each journal record.
/// Decimal strings and hexadecimal float bits survive browser JSON roundtrips.
/// Bump evaluator_version when decision semantics change.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub struct GatePolicy {
    schema_version: u32,
    evaluator_version: u32,
    minimum_pairs_decimal: String,
    minimum_stress_cases_decimal: String,
    minimum_speedup_text: String,
    minimum_speedup_bits_hex: String,
    memory_budget_bytes_decimal: String,
}
impl GatePolicy {
    pub fn evaluate(&self, evidence: &Evidence) -> Decision {
        let restore = || -> Option<Gate> {
            if self.schema_version != 1 || self.evaluator_version != 1 {
                return None;
            }
            let gate = Gate {
                minimum_pairs: self.minimum_pairs_decimal.parse().ok()?,
                minimum_stress_cases: self.minimum_stress_cases_decimal.parse().ok()?,
                minimum_speedup: f64::from_bits(
                    u64::from_str_radix(&self.minimum_speedup_bits_hex, 16).ok()?,
                ),
                memory_budget_bytes: self.memory_budget_bytes_decimal.parse().ok()?,
            };
            (gate.snapshot() == *self).then_some(gate)
        };
        match restore() {
            Some(gate) => gate.evaluate(evidence),
            None => Decision::Incomplete(
                "Unsupported or inconsistent acceptance policy snapshot".into(),
            ),
        }
    }
}

impl Gate {
    pub fn snapshot(&self) -> GatePolicy {
        GatePolicy {
            schema_version: 1,
            evaluator_version: 1,
            minimum_pairs_decimal: self.minimum_pairs.to_string(),
            minimum_stress_cases_decimal: self.minimum_stress_cases.to_string(),
            minimum_speedup_text: self.minimum_speedup.to_string(),
            minimum_speedup_bits_hex: format!("{:016x}", self.minimum_speedup.to_bits()),
            memory_budget_bytes_decimal: self.memory_budget_bytes.to_string(),
        }
    }
    pub fn evaluate(&self, e: &Evidence) -> Decision {
        if self.minimum_pairs < 5
            || self.minimum_stress_cases == 0
            || !self.minimum_speedup.is_finite()
            || self.minimum_speedup <= 1.0
            || self.memory_budget_bytes == 0
        {
            return Decision::Incomplete("Invalid acceptance policy".into());
        }
        if [
            &e.candidate_revision,
            &e.baseline_revision,
            &e.workload_id,
            &e.environment_id,
        ]
        .iter()
        .any(|s| s.trim().is_empty())
            || e.candidate_revision == e.baseline_revision
        {
            return Decision::Incomplete("Missing or indistinguishable experiment identity".into());
        }
        // Never hide a known failure behind an insufficient sample count.
        if e.correctness_failures > 0
            || e.stress_failures > 0
            || e.trials
                .iter()
                .any(|t| !t.equal_complete_output || t.cancelled_cleanly == Some(false))
        {
            return Decision::Stabilize("Reproduce and repair correctness, stress or cancellation failures; retain all evidence".into());
        }
        if e.trials.len() < self.minimum_pairs
            || e.stress_cases < self.minimum_stress_cases
            || e.trials.iter().any(|t| {
                t.baseline_ns == 0
                    || t.candidate_ns == 0
                    || t.peak_bytes == 0
                    || t.cancelled_cleanly.is_none()
            })
        {
            return Decision::Incomplete(
                "Missing repeated timing, stress or memory measurements".into(),
            );
        }
        if e.trials
            .iter()
            .any(|t| t.peak_bytes > self.memory_budget_bytes)
        {
            return Decision::Stabilize(
                "Memory budget exceeded; optimize without dropping outputs".into(),
            );
        }
        let mut ratios: Vec<f64> = e
            .trials
            .iter()
            .map(|t| t.baseline_ns as f64 / t.candidate_ns as f64)
            .collect();
        ratios.sort_by(f64::total_cmp);
        let n = ratios.len();
        let median = if n.is_multiple_of(2) {
            (ratios[n / 2 - 1] + ratios[n / 2]) / 2.0
        } else {
            ratios[n / 2]
        };
        // Tail regression cannot be concealed by a good median.
        if ratios.iter().any(|r| *r < 0.9) {
            return Decision::RetainBaseline(
                "At least one paired trial regressed by more than the permitted noise margin"
                    .into(),
            );
        }
        if median < self.minimum_speedup {
            return Decision::RetainBaseline("Insufficient measured improvement".into());
        }
        Decision::EligibleForReview {
            median_speedup: median,
        }
    }
}

pub mod journal {
    use super::{Evidence, Gate, GatePolicy};
    use rusqlite::{Connection, params};
    #[cfg(test)]
    #[test]
    fn opened_journal_requests_extra_sync() {
        let store = Journal::open(std::path::Path::new(":memory:")).unwrap();
        assert_eq!(
            store
                .0
                .query_row("PRAGMA synchronous", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            3
        );
    }
    /// Local append-only API. Not tamper-proof against someone editing the database itself.
    pub struct Journal(Connection);
    impl Journal {
        pub fn open(path: &std::path::Path) -> rusqlite::Result<Self> {
            let mut conn = Connection::open(path)?;
            crate::storage_connection::configure(&conn)?;
            conn.execute_batch(
                "CREATE TABLE IF NOT EXISTS experiments (
                  id INTEGER PRIMARY KEY, recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  candidate TEXT NOT NULL, baseline TEXT NOT NULL, evidence TEXT NOT NULL,
                  decision TEXT NOT NULL, parent INTEGER REFERENCES experiments(id), acceptance_policy TEXT);",
            )?;
            // Preserve legacy records as policy-unknown, never invent their thresholds.
            if !Self::has_policy_column(&conn)? {
                let tx =
                    conn.transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
                // Recheck under the write lock in case another opener migrated first.
                if !Self::has_policy_column(&tx)? {
                    tx.execute(
                        "ALTER TABLE experiments ADD COLUMN acceptance_policy TEXT",
                        [],
                    )?;
                }
                tx.commit()?;
            }
            Ok(Self(conn))
        }
        fn has_policy_column(conn: &Connection) -> rusqlite::Result<bool> {
            let mut statement = conn.prepare("PRAGMA table_info(experiments)")?;
            for name in statement.query_map([], |row| row.get::<_, String>(1))? {
                if name? == "acceptance_policy" {
                    return Ok(true);
                }
            }
            Ok(false)
        }
        pub fn recorded_policy(
            &self,
            id: i64,
        ) -> Result<Option<GatePolicy>, Box<dyn std::error::Error>> {
            let raw: Option<String> = self.0.query_row(
                "SELECT acceptance_policy FROM experiments WHERE id=?1",
                [id],
                |row| row.get(0),
            )?;
            Ok(raw.map(|text| serde_json::from_str(&text)).transpose()?)
        }
        /// Repairs create new records linked to the failed experiment, never overwrite it.
        pub fn record(
            &mut self,
            e: &Evidence,
            gate: &Gate,
            parent: Option<i64>,
        ) -> Result<i64, Box<dyn std::error::Error>> {
            let evidence = serde_json::to_string(e)?;
            let decision = serde_json::to_string(&gate.evaluate(e))?;
            let policy = gate.snapshot();
            let policy_json = serde_json::to_string(&policy)?;
            let tx = self.0.transaction()?;
            if let Some(parent_id) = parent {
                let (previous, previous_policy): (String, Option<String>) = tx.query_row(
                    "SELECT evidence,acceptance_policy FROM experiments WHERE id=?1",
                    [parent_id],
                    |r| Ok((r.get(0)?, r.get(1)?)),
                )?;
                let previous_policy = previous_policy.ok_or("Legacy parent has no recorded acceptance policy; use a distinct experiment rather than claim a comparable repair")?;
                let previous_policy: GatePolicy = serde_json::from_str(&previous_policy)?;
                if previous_policy != policy {
                    return Err("Repair must preserve the parent's exact acceptance policy".into());
                }
                let previous: Evidence = serde_json::from_str(&previous)?;
                if previous.baseline_revision != e.baseline_revision
                    || previous.workload_id != e.workload_id
                    || previous.environment_id != e.environment_id
                    || previous.candidate_revision == e.candidate_revision
                {
                    return Err("Repair must identify a new candidate against the same baseline, workload and environment".into());
                }
            }
            tx.execute("INSERT INTO experiments(candidate,baseline,evidence,decision,parent,acceptance_policy) VALUES(?1,?2,?3,?4,?5,?6)",
                params![e.candidate_revision,e.baseline_revision,evidence,decision,parent,policy_json])?;
            let id = tx.last_insert_rowid();
            tx.commit()?;
            Ok(id)
        }
        pub fn count(&self) -> rusqlite::Result<i64> {
            self.0
                .query_row("SELECT count(*) FROM experiments", [], |r| r.get(0))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn legacy_evidence_defaults_and_early_failure_gate() {
        let mut e = evidence();
        let serialized = serde_json::to_string(&e).unwrap();
        assert!(!serialized.contains("correctness_failures"));
        let old: Evidence = serde_json::from_str(&serialized).unwrap();
        assert_eq!(old.correctness_failures, 0);
        e.trials.clear();
        e.stress_cases = 0;
        e.correctness_failures = 1;
        assert!(matches!(gate().evaluate(&e), Decision::Stabilize(_)));
    }
    #[test]
    fn repair_lineage_rejects_changed_environment() {
        let mut journal = journal::Journal::open(std::path::Path::new(":memory:")).unwrap();
        let original = evidence();
        let id = journal.record(&original, &gate(), None).unwrap();
        let mut next = original.clone();
        next.candidate_revision = "another-candidate".into();
        next.environment_id = "changed-compiler-or-lock".into();
        assert!(journal.record(&next, &gate(), Some(id)).is_err());
        assert_eq!(journal.count().unwrap(), 1);
    }
    #[test]
    fn repair_cannot_relax_acceptance_policy() {
        let mut journal = journal::Journal::open(std::path::Path::new(":memory:")).unwrap();
        let mut original = evidence();
        for trial in &mut original.trials {
            trial.peak_bytes = 2048;
        }
        assert!(matches!(gate().evaluate(&original), Decision::Stabilize(_)));
        let parent = journal.record(&original, &gate(), None).unwrap();
        let mut next = original.clone();
        next.candidate_revision = "unchanged-work-with-looser-budget".into();
        let mut relaxed = gate();
        relaxed.memory_budget_bytes = 4096;
        assert!(matches!(
            relaxed.evaluate(&next),
            Decision::EligibleForReview { .. }
        ));
        assert!(journal.record(&next, &relaxed, Some(parent)).is_err());
        assert_eq!(journal.count().unwrap(), 1);
    }
    #[test]
    fn policy_snapshot_roundtrips_invalid_float_bits_and_large_limits() {
        for bits in [
            1.1f64.to_bits(),
            f64::INFINITY.to_bits(),
            0x7ff8000000000042,
            (-0.0f64).to_bits(),
        ] {
            let mut policy = gate();
            policy.minimum_speedup = f64::from_bits(bits);
            policy.memory_budget_bytes = u64::MAX;
            let snapshot = policy.snapshot();
            let wire = serde_json::to_string(&snapshot).unwrap();
            let restored: GatePolicy = serde_json::from_str(&wire).unwrap();
            assert_eq!(restored, snapshot);
            assert_eq!(restored.evaluate(&evidence()), policy.evaluate(&evidence()));
            assert_eq!(restored.memory_budget_bytes_decimal, u64::MAX.to_string());
        }
        let mut damaged = gate().snapshot();
        damaged.minimum_speedup_text = "999".into();
        assert!(matches!(
            damaged.evaluate(&evidence()),
            Decision::Incomplete(_)
        ));
        damaged = gate().snapshot();
        damaged.evaluator_version = 2;
        assert!(matches!(
            damaged.evaluate(&evidence()),
            Decision::Incomplete(_)
        ));
    }
    #[test]
    fn journal_policy_survives_reopen_and_legacy_rows_remain_unknown() {
        let path = std::env::temp_dir().join(format!(
            "atlas-policy-{}-{}.sqlite",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let db = rusqlite::Connection::open(&path).unwrap();
        db.execute_batch("CREATE TABLE experiments(id INTEGER PRIMARY KEY, recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,candidate TEXT NOT NULL,baseline TEXT NOT NULL,evidence TEXT NOT NULL,decision TEXT NOT NULL,parent INTEGER REFERENCES experiments(id));").unwrap();
        let original = evidence();
        let wire = serde_json::to_string(&original).unwrap();
        let decision = serde_json::to_string(&gate().evaluate(&original)).unwrap();
        db.execute("INSERT INTO experiments(id,candidate,baseline,evidence,decision) VALUES(1,?1,?2,?3,?4)", rusqlite::params![original.candidate_revision,original.baseline_revision,wire,decision]).unwrap();
        let before: (String, String, String) = db
            .query_row(
                "SELECT recorded_at,evidence,decision FROM experiments WHERE id=1",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();
        drop(db);
        let mut journal = journal::Journal::open(&path).unwrap();
        assert_eq!(journal.recorded_policy(1).unwrap(), None);
        let mut next = original.clone();
        next.candidate_revision = "legacy-child".into();
        assert!(journal.record(&next, &gate(), Some(1)).is_err());
        assert_eq!(journal.count().unwrap(), 1);
        let id = journal.record(&next, &gate(), None).unwrap();
        drop(journal);
        let reopened = journal::Journal::open(&path).unwrap();
        assert_eq!(
            reopened.recorded_policy(id).unwrap(),
            Some(gate().snapshot())
        );
        assert_eq!(reopened.count().unwrap(), 2);
        drop(reopened);
        let db = rusqlite::Connection::open(&path).unwrap();
        let after: (String, String, String) = db
            .query_row(
                "SELECT recorded_at,evidence,decision FROM experiments WHERE id=1",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .unwrap();
        assert_eq!(before, after);
    }
    #[test]
    fn every_acceptance_requirement_is_bound_to_repair_lineage() {
        let mut journal = journal::Journal::open(std::path::Path::new(":memory:")).unwrap();
        let original = evidence();
        let parent = journal.record(&original, &gate(), None).unwrap();
        for field in 0..4 {
            let mut changed = gate();
            match field {
                0 => changed.minimum_pairs = 6,
                1 => changed.minimum_stress_cases = 999,
                2 => changed.minimum_speedup = 1.01,
                _ => changed.memory_budget_bytes = 4096,
            }
            let mut next = original.clone();
            next.candidate_revision = format!("policy-change-{field}");
            assert!(journal.record(&next, &changed, Some(parent)).is_err());
        }
        assert_eq!(journal.count().unwrap(), 1);
        let mut next = original.clone();
        next.candidate_revision = "same-policy-repair".into();
        let id = journal.record(&next, &gate(), Some(parent)).unwrap();
        assert_eq!(
            journal.recorded_policy(id).unwrap(),
            Some(gate().snapshot())
        );
    }
    fn gate() -> Gate {
        Gate {
            minimum_pairs: 5,
            minimum_stress_cases: 1000,
            minimum_speedup: 1.1,
            memory_budget_bytes: 1024,
        }
    }
    fn evidence() -> Evidence {
        Evidence {
            candidate_revision: "candidate-v2".into(),
            baseline_revision: "baseline-v1".into(),
            workload_id: "fixture-only".into(),
            environment_id: "unit-test".into(),
            trials: vec![
                Trial {
                    baseline_ns: 100,
                    candidate_ns: 50,
                    equal_complete_output: true,
                    peak_bytes: 512,
                    cancelled_cleanly: Some(true)
                };
                7
            ],
            stress_cases: 1000,
            stress_failures: 0,
            correctness_failures: 0,
        }
    }
    #[test]
    fn unknown_cancellation_is_not_a_success() {
        let mut e = evidence();
        e.trials[0].cancelled_cleanly = None;
        assert!(matches!(gate().evaluate(&e), Decision::Incomplete(_)));
    }
    #[test]
    fn repair_cannot_change_the_workload_to_hide_failure() {
        let mut j = journal::Journal::open(std::path::Path::new(":memory:")).unwrap();
        let mut e = evidence();
        e.stress_failures = 1;
        let parent = j.record(&e, &gate(), None).unwrap();
        e.candidate_revision = "repair".into();
        e.workload_id = "easier-input".into();
        e.stress_failures = 0;
        assert!(j.record(&e, &gate(), Some(parent)).is_err());
        assert_eq!(j.count().unwrap(), 1);
    }
    #[test]
    fn unknown_fields_are_rejected_in_experiment_evidence() {
        let mut v = serde_json::to_value(evidence()).unwrap();
        v["ignore_output_differences"] = true.into();
        assert!(serde_json::from_value::<Evidence>(v).is_err());
    }
    #[test]
    fn healthy_is_review_only() {
        assert_eq!(
            gate().evaluate(&evidence()),
            Decision::EligibleForReview {
                median_speedup: 2.0
            }
        );
    }
    #[test]
    fn fast_wrong_goes_to_stabilization() {
        let mut e = evidence();
        e.trials[0].equal_complete_output = false;
        assert!(matches!(gate().evaluate(&e), Decision::Stabilize(_)));
    }
    #[test]
    fn stress_failure_not_hidden_by_few_trials() {
        let mut e = evidence();
        e.trials.clear();
        e.stress_failures = 1;
        assert!(matches!(gate().evaluate(&e), Decision::Stabilize(_)));
    }
    #[test]
    fn no_memory_measurement_blocks_review() {
        let mut e = evidence();
        e.trials[0].peak_bytes = 0;
        assert!(matches!(gate().evaluate(&e), Decision::Incomplete(_)));
    }
    #[test]
    fn cancellation_failure_requires_repair() {
        let mut e = evidence();
        e.trials[0].cancelled_cleanly = Some(false);
        assert!(matches!(gate().evaluate(&e), Decision::Stabilize(_)));
    }
    #[test]
    fn one_tail_regression_is_not_hidden() {
        let mut e = evidence();
        e.trials[0].candidate_ns = 200;
        assert!(matches!(gate().evaluate(&e), Decision::RetainBaseline(_)));
    }
    #[test]
    fn same_revision_rejected() {
        let mut e = evidence();
        e.candidate_revision = e.baseline_revision.clone();
        assert!(matches!(gate().evaluate(&e), Decision::Incomplete(_)));
    }
    #[test]
    fn invalid_policy_fails_closed() {
        let mut g = gate();
        g.minimum_speedup = f64::NAN;
        assert!(matches!(g.evaluate(&evidence()), Decision::Incomplete(_)));
    }
    #[test]
    fn zero_duration_is_not_infinite_speedup() {
        let mut e = evidence();
        e.trials[0].candidate_ns = 0;
        assert!(matches!(gate().evaluate(&e), Decision::Incomplete(_)));
    }
    #[test]
    fn excess_memory_requires_repair() {
        let mut e = evidence();
        e.trials[0].peak_bytes = 2048;
        assert!(matches!(gate().evaluate(&e), Decision::Stabilize(_)));
    }
    #[test]
    fn journal_preserves_failure_and_repair() {
        let mut j = journal::Journal::open(std::path::Path::new(":memory:")).unwrap();
        let mut e = evidence();
        e.stress_failures = 1;
        let failure = j.record(&e, &gate(), None).unwrap();
        e.stress_failures = 0;
        e.candidate_revision = "repaired-v3".into();
        j.record(&e, &gate(), Some(failure)).unwrap();
        assert_eq!(j.count().unwrap(), 2);
        assert!(j.record(&e, &gate(), Some(999)).is_err());
        assert_eq!(j.count().unwrap(), 2);
    }
}

pub mod collection;

pub mod modrinth;
pub mod modrinth_versions;

pub mod snapshots;

pub mod jobs;

pub mod server;

pub mod storage_lab;

pub mod validated_raw;

pub mod experiment_runner;

// Compiled only as an explicit experimental strategy; collection keeps its baseline.
#[path = "../../../experiments/version-validation-lab/candidate.rs"]
pub mod version_validation_candidate;

pub mod version_experiment_runner;

pub mod build_identity;

pub(crate) mod public_http;
pub mod upstream_reviews;

pub mod project_archive;

/// Isolated experiment only; not wired to the application store or server.
#[path = "../../../experiments/content-addressed-snapshot-lab/store.rs"]
pub mod content_addressed_candidate;

// Isolated binary-address/integer-reference study; not used by application storage.
#[path = "../../../experiments/content-addressed-snapshot-lab/compact_store.rs"]
pub mod compact_addressed_candidate;
