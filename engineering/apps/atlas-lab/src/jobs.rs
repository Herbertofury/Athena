//! Durable, bounded work claims. Jobs select built-in operations, never arbitrary commands.
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use serde::{Deserialize, Serialize};
use std::path::Path;
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub enum Job {
    CollectModrinth { project: String },
    CollectModrinthRaw { project: String },
    CollectModrinthBatch { projects: Vec<String> },
    CollectModrinthVersions { versions: Vec<String> },
    ReviewUpstream { source: String },
    DedupExperiment,
    VersionValidationExperiment { version: String },
}
#[derive(Debug, Clone, PartialEq)]
pub struct Claim {
    pub id: i64,
    pub attempt: i64,
    pub worker: String,
    pub job: Job,
}
pub const MAX_JOB_OUTPUT_BYTES: usize = 2 * 1024 * 1024;
pub struct Queue(Connection);
impl Queue {
    pub fn open(path: &Path) -> rusqlite::Result<Self> {
        let c = Connection::open(path)?;
        crate::storage_connection::configure(&c)?;
        c.execute_batch("CREATE TABLE IF NOT EXISTS jobs (
              id INTEGER PRIMARY KEY, payload TEXT NOT NULL, state TEXT NOT NULL,
              attempt INTEGER NOT NULL DEFAULT 0, worker TEXT, lease_until INTEGER, result TEXT,
              CHECK(state IN ('queued','running','succeeded','failed')));
            CREATE UNIQUE INDEX IF NOT EXISTS one_active_job ON jobs(payload) WHERE state IN ('queued','running');
            CREATE TABLE IF NOT EXISTS job_events (
              id INTEGER PRIMARY KEY, job_id INTEGER NOT NULL, attempt INTEGER NOT NULL,
              event TEXT NOT NULL, at_ms INTEGER NOT NULL);")?;
        Ok(Self(c))
    }
    pub fn enqueue(&mut self, job: &Job, now_ms: i64) -> Result<i64, Box<dyn std::error::Error>> {
        if now_ms < 0 {
            return Err("Invalid clock".into());
        }
        match job {
            Job::CollectModrinth { project } | Job::CollectModrinthRaw { project } => {
                crate::modrinth::project_url(project)?;
            }
            Job::CollectModrinthBatch { projects } => {
                crate::modrinth::projects_url(projects)?;
            }
            Job::CollectModrinthVersions { versions } => {
                crate::modrinth_versions::versions_url(versions)?;
            }
            Job::ReviewUpstream { source } => {
                crate::upstream_reviews::Source::parse(source)?;
            }
            Job::DedupExperiment => {}
            Job::VersionValidationExperiment { version } => {
                crate::modrinth_versions::versions_url(std::slice::from_ref(version))?;
            }
        }
        let payload = serde_json::to_string(job)?;
        let tx = self
            .0
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        if let Some(id) = tx
            .query_row(
                "SELECT id FROM jobs WHERE payload=?1 AND state IN ('queued','running')",
                [&payload],
                |r| r.get::<_, i64>(0),
            )
            .optional()?
        {
            return Ok(id);
        }
        let pending: i64 = tx.query_row(
            "SELECT count(*) FROM jobs WHERE state IN ('queued','running')",
            [],
            |r| r.get(0),
        )?;
        if pending >= 4096 {
            return Err("Pending job budget reached".into());
        }
        tx.execute(
            "INSERT INTO jobs(payload,state) VALUES(?1,'queued')",
            [payload],
        )?;
        let id = tx.last_insert_rowid();
        tx.execute(
            "INSERT INTO job_events(job_id,attempt,event,at_ms) VALUES(?1,0,'queued',?2)",
            params![id, now_ms],
        )?;
        tx.commit()?;
        Ok(id)
    }
    pub fn claim(
        &mut self,
        worker: &str,
        now_ms: i64,
        lease_ms: i64,
    ) -> Result<Option<Claim>, Box<dyn std::error::Error>> {
        if worker.trim().is_empty()
            || worker.len() > 128
            || now_ms < 0
            || !(1000..=300000).contains(&lease_ms)
        {
            return Err("Invalid lease request".into());
        }
        let expires = now_ms.checked_add(lease_ms).ok_or("Lease clock overflow")?;
        let tx = self
            .0
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        tx.execute("INSERT INTO job_events(job_id,attempt,event,at_ms) SELECT id,attempt,'lease_expired',?1 FROM jobs WHERE state='running' AND lease_until<=?1",[now_ms])?;
        tx.execute("UPDATE jobs SET state='queued',worker=NULL,lease_until=NULL WHERE state='running' AND lease_until<=?1",[now_ms])?;
        let next: Option<(i64, String, i64)> = tx
            .query_row(
                "SELECT id,payload,attempt FROM jobs WHERE state='queued' ORDER BY id LIMIT 1",
                [],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
            )
            .optional()?;
        let Some((id, payload, attempt)) = next else {
            tx.commit()?;
            return Ok(None);
        };
        let job = serde_json::from_str(&payload)?;
        let attempt = attempt.checked_add(1).ok_or("Attempt overflow")?;
        tx.execute(
            "UPDATE jobs SET state='running',worker=?1,lease_until=?2,attempt=?3 WHERE id=?4",
            params![worker, expires, attempt, id],
        )?;
        tx.execute(
            "INSERT INTO job_events(job_id,attempt,event,at_ms) VALUES(?1,?2,'claimed',?3)",
            params![id, attempt, now_ms],
        )?;
        tx.commit()?;
        Ok(Some(Claim {
            id,
            attempt,
            worker: worker.into(),
            job,
        }))
    }
    pub fn finish(
        &mut self,
        claim: &Claim,
        succeeded: bool,
        now_ms: i64,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.finish_output(claim, succeeded, now_ms, None)
    }
    pub fn finish_output(
        &mut self,
        claim: &Claim,
        succeeded: bool,
        now_ms: i64,
        result: Option<&serde_json::Value>,
    ) -> Result<(), Box<dyn std::error::Error>> {
        if now_ms < 0 {
            return Err("Invalid clock".into());
        }
        let payload = result.map(serde_json::to_string).transpose()?;
        if payload
            .as_ref()
            .is_some_and(|s| s.len() > MAX_JOB_OUTPUT_BYTES)
        {
            return Err("Job output exceeds budget".into());
        }
        let state = if succeeded { "succeeded" } else { "failed" };
        let tx = self
            .0
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let n = tx.execute("UPDATE jobs SET state=?1,lease_until=NULL,result=?6 WHERE id=?2 AND attempt=?3 AND worker=?4 AND state='running' AND lease_until>?5",params![state,claim.id,claim.attempt,claim.worker,now_ms,payload])?;
        if n != 1 {
            return Err("Stale or expired worker cannot finalize this job".into());
        }
        tx.execute(
            "INSERT INTO job_events(job_id,attempt,event,at_ms) VALUES(?1,?2,?3,?4)",
            params![claim.id, claim.attempt, state, now_ms],
        )?;
        tx.commit()?;
        Ok(())
    }
    /// Isolated experiment. Normal serve uses overview(); serve-candidate explicitly opts in.
    pub fn overview_raw_candidate(&self) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        self.serialize_overview_candidate(None)
    }
    pub fn overview_raw_candidate_with_worker_status(
        &self,
        status: &str,
    ) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        self.serialize_overview_candidate(Some(status))
    }
    fn serialize_overview_candidate(
        &self,
        status: Option<&str>,
    ) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        // One database snapshot for rows and aggregate counts. JSON validation remains checked.
        let tx = self.0.unchecked_transaction()?;
        let result = Self::serialize_overview_candidate_in(&tx, status)?;
        tx.commit()?;
        Ok(result)
    }
    fn serialize_overview_candidate_in(
        connection: &Connection,
        status: Option<&str>,
    ) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        #[derive(Serialize)]
        struct Row {
            id: i64,
            id_text: String,
            job: Job,
            state: String,
            attempt: i64,
            result: Option<Box<serde_json::value::RawValue>>,
        }
        #[derive(Serialize)]
        struct Overview<'a> {
            #[serde(skip_serializing_if = "Option::is_none")]
            worker_status: Option<&'a str>,
            jobs: Vec<Row>,
            counts: std::collections::BTreeMap<String, i64>,
            display_limit: usize,
        }
        let mut stmt = connection.prepare(
            "SELECT id,payload,state,attempt,result FROM jobs ORDER BY id DESC LIMIT 50",
        )?;
        let rows = stmt.query_map([], |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, i64>(3)?,
                r.get::<_, Option<String>>(4)?,
            ))
        })?;
        let mut jobs = Vec::new();
        for row in rows {
            let (id, payload, state, attempt, result) = row?;
            jobs.push(Row {
                id,
                id_text: id.to_string(),
                job: serde_json::from_str(&payload)?,
                state,
                attempt,
                result: result
                    .map(crate::validated_raw::validate_and_preserve)
                    .transpose()?,
            });
        }
        let mut counts = std::collections::BTreeMap::new();
        let mut stmt = connection.prepare("SELECT state,count(*) FROM jobs GROUP BY state")?;
        for row in stmt.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?)))? {
            let (state, count) = row?;
            counts.insert(state, count);
        }
        Ok(serde_json::to_vec(&Overview {
            worker_status: status,
            jobs,
            counts,
            display_limit: 50,
        })?)
    }
    pub fn overview(&self) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        let tx = self.0.unchecked_transaction()?;
        let result = Self::overview_in(&tx)?;
        tx.commit()?;
        Ok(result)
    }
    fn overview_in(
        connection: &Connection,
    ) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        let mut stmt = connection.prepare(
            "SELECT id,payload,state,attempt,result FROM jobs ORDER BY id DESC LIMIT 50",
        )?;
        let rows = stmt.query_map([], |r| {
            Ok((
                r.get::<_, i64>(0)?,
                r.get::<_, String>(1)?,
                r.get::<_, String>(2)?,
                r.get::<_, i64>(3)?,
                r.get::<_, Option<String>>(4)?,
            ))
        })?;
        let mut jobs = Vec::new();
        for row in rows {
            let (id, payload, state, attempt, result) = row?;
            let job: Job = serde_json::from_str(&payload)?;
            let result = result
                .map(|s| serde_json::from_str::<serde_json::Value>(&s))
                .transpose()?;
            jobs.push(serde_json::json!({"id":id,"id_text":id.to_string(),"job":job,"state":state,"attempt":attempt,"result":result}));
        }
        let mut counts = serde_json::Map::new();
        let mut stmt = connection.prepare("SELECT state,count(*) FROM jobs GROUP BY state")?;
        for row in stmt.query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, i64>(1)?)))? {
            let (state, count) = row?;
            counts.insert(state, count.into());
        }
        Ok(serde_json::json!({"jobs":jobs,"counts":counts,"display_limit":50}))
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn overview_retains_exact_text_ids_without_changing_legacy_numeric_fields() {
        let queue = Queue::open(Path::new(":memory:")).unwrap();
        let ids = [1_i64, 9007199254740992, 9007199254740993, i64::MAX];
        for id in ids {
            queue.0.execute("INSERT INTO jobs(id,payload,state,result) VALUES(?1,'\"DedupExperiment\"','succeeded','{\"full\":[1,2,3]}')",[id]).unwrap();
        }
        let value = queue.overview().unwrap();
        let candidate: serde_json::Value =
            serde_json::from_slice(&queue.overview_raw_candidate().unwrap()).unwrap();
        assert_eq!(candidate, value);
        for (row, id) in value["jobs"]
            .as_array()
            .unwrap()
            .iter()
            .zip(ids.into_iter().rev())
        {
            assert_eq!(row["id"].as_i64(), Some(id));
            assert_eq!(row["id_text"], id.to_string());
            assert_eq!(row["result"]["full"], serde_json::json!([1, 2, 3]));
        }
        assert_eq!(value["jobs"].as_array().unwrap().len(), 4);
        assert_eq!(
            queue
                .0
                .query_row("SELECT count(*) FROM jobs", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            4
        );
        assert!(queue.0.is_autocommit());
    }

    #[test]
    fn upstream_jobs_accept_only_fixed_public_sources() {
        let mut q = Queue::open(Path::new(":memory:")).unwrap();
        let job = Job::ReviewUpstream {
            source: "rustsec".into(),
        };
        let id = q.enqueue(&job, 0).unwrap();
        assert_eq!(q.enqueue(&job, 1).unwrap(), id);
        assert_eq!(q.claim("worker", 2, 1000).unwrap().unwrap().job, job);
        assert!(
            q.enqueue(
                &Job::ReviewUpstream {
                    source: "https://api.github.com/repos/private/repo".into()
                },
                3
            )
            .is_err()
        );
        assert!(
            serde_json::from_str::<Job>(
                r#"{"ReviewUpstream":{"source":"hls","token":"not accepted"}}"#
            )
            .is_err()
        );
    }
    #[test]
    fn complete_project_job_is_bounded_and_keeps_legacy_jobs_distinct() {
        let mut q = Queue::open(Path::new(":memory:")).unwrap();
        let job = Job::CollectModrinthRaw {
            project: "sodium".into(),
        };
        let id = q.enqueue(&job, 0).unwrap();
        assert_eq!(q.enqueue(&job, 1).unwrap(), id);
        assert_ne!(
            q.enqueue(
                &Job::CollectModrinth {
                    project: "sodium".into()
                },
                1
            )
            .unwrap(),
            id
        );
        assert_eq!(q.claim("worker", 2, 1000).unwrap().unwrap().job, job);
        for project in ["", "../path", "https://example.invalid", "sodium,lithium"] {
            assert!(
                q.enqueue(
                    &Job::CollectModrinthRaw {
                        project: project.into()
                    },
                    3
                )
                .is_err()
            );
        }
        assert!(
            serde_json::from_str::<Job>(
                r#"{"CollectModrinthRaw":{"project":"sodium","url":"https://example.invalid"}}"#
            )
            .is_err()
        );
    }
    #[test]
    fn version_collection_is_bounded_durable_and_not_an_arbitrary_request() {
        let mut q = Queue::open(Path::new(":memory:")).unwrap();
        let job = Job::CollectModrinthVersions {
            versions: vec!["g6ju16VJ".into(), "Ag5S66CF".into()],
        };
        let id = q.enqueue(&job, 0).unwrap();
        assert_eq!(q.enqueue(&job, 1).unwrap(), id);
        assert_eq!(q.claim("worker", 2, 1000).unwrap().unwrap().job, job);
        for versions in [
            vec![],
            vec!["sodium".into()],
            vec!["abcdefgh".into(); 2],
            (0..21).map(|i| format!("{i:08}")).collect(),
        ] {
            assert!(
                q.enqueue(&Job::CollectModrinthVersions { versions }, 3)
                    .is_err()
            );
        }
        assert!(serde_json::from_str::<Job>(r#"{"CollectModrinthVersions":{"versions":["g6ju16VJ"],"url":"https://example.com"}}"#).is_err());
    }
    #[test]
    fn raw_overview_worker_status_is_serialized_not_concatenated() {
        let queue = Queue::open(Path::new(":memory:")).unwrap();
        for status in ["running", "failed", "quoted\"status", "</script>", "\0"] {
            let mut expected = queue.overview().unwrap();
            expected["worker_status"] = status.into();
            let actual: serde_json::Value = serde_json::from_slice(
                &queue
                    .overview_raw_candidate_with_worker_status(status)
                    .unwrap(),
            )
            .unwrap();
            assert_eq!(actual, expected);
        }
    }
    #[test]
    fn raw_overview_retains_complete_outputs_and_rejects_corruption() {
        let mut queue = Queue::open(Path::new(":memory:")).unwrap();
        for index in 0..5 {
            queue.enqueue(&Job::DedupExperiment, index * 3).unwrap();
            let claim = queue.claim("test", index * 3 + 1, 1000).unwrap().unwrap();
            queue.finish_output(&claim,true,index*3+2,Some(&serde_json::json!({"id":index,"text":"Unicode 🎮","full":[1,2,3],"unknown_forward_field":{"x":true}}))).unwrap();
        }
        assert_eq!(
            queue.overview().unwrap(),
            serde_json::from_slice::<serde_json::Value>(&queue.overview_raw_candidate().unwrap())
                .unwrap()
        );
        queue
            .0
            .execute("UPDATE jobs SET result='1e400' WHERE id=1", [])
            .unwrap();
        assert!(queue.overview().is_err());
        assert!(
            queue.0.is_autocommit(),
            "Failed overview must release read transaction"
        );
        assert!(queue.overview_raw_candidate().is_err());
        assert!(
            queue.0.is_autocommit(),
            "Failed candidate must release read transaction"
        );
    }
    #[test]
    fn saved_version_jobs_are_bounded_deduplicated_and_reject_extra_fields() {
        let mut queue = Queue::open(Path::new(":memory:")).unwrap();
        let job = Job::VersionValidationExperiment {
            version: "g6ju16VJ".into(),
        };
        let id = queue.enqueue(&job, 0).unwrap();
        assert_eq!(queue.enqueue(&job, 1).unwrap(), id);
        assert_eq!(queue.claim("worker", 2, 1000).unwrap().unwrap().job, job);
        for version in ["sodium", "../file", "", "abcdefghijk"] {
            assert!(
                queue
                    .enqueue(
                        &Job::VersionValidationExperiment {
                            version: version.into()
                        },
                        3
                    )
                    .is_err()
            );
        }
        assert!(
            serde_json::from_str::<Job>(
                r#"{"VersionValidationExperiment":{"version":"g6ju16VJ","command":"not executed"}}"#
            )
            .is_err()
        );
    }
    #[test]
    fn batch_jobs_validate_and_deduplicate_without_reordering() {
        let mut q = Queue::open(Path::new(":memory:")).unwrap();
        let job = Job::CollectModrinthBatch {
            projects: vec!["AANobbMI".into(), "gvQqBUqZ".into()],
        };
        let first = q.enqueue(&job, 0).unwrap();
        assert_eq!(q.enqueue(&job, 1).unwrap(), first);
        assert_eq!(q.claim("worker", 2, 1000).unwrap().unwrap().job, job);
        for projects in [
            vec![],
            vec!["sodium".into()],
            vec!["AANobbMI".into(), "AANobbMI".into()],
        ] {
            assert!(
                q.enqueue(&Job::CollectModrinthBatch { projects }, 3)
                    .is_err()
            );
        }
    }
    #[test]
    fn duplicate_pending_jobs_share_one_record() {
        let mut q = Queue::open(Path::new(":memory:")).unwrap();
        let a = q.enqueue(&Job::DedupExperiment, 0).unwrap();
        assert_eq!(q.enqueue(&Job::DedupExperiment, 1).unwrap(), a);
        let claim = q.claim("worker", 2, 1000).unwrap().unwrap();
        assert!(q.claim("other", 3, 1000).unwrap().is_none());
        q.finish(&claim, true, 4).unwrap();
        assert!(q.finish(&claim, true, 5).is_err());
        assert_ne!(q.enqueue(&Job::DedupExperiment, 6).unwrap(), a);
    }
    #[test]
    fn crash_recovery_fences_stale_worker() {
        let mut q = Queue::open(Path::new(":memory:")).unwrap();
        q.enqueue(&Job::DedupExperiment, 0).unwrap();
        let old = q.claim("a", 1, 1000).unwrap().unwrap();
        let new = q.claim("b", 1001, 1000).unwrap().unwrap();
        assert_eq!(old.id, new.id);
        assert_eq!(new.attempt, old.attempt + 1);
        assert!(q.finish(&old, true, 1002).is_err());
        q.finish(&new, true, 1003).unwrap();
    }
    #[test]
    fn expired_claim_cannot_finish_before_reclaim() {
        let mut q = Queue::open(Path::new(":memory:")).unwrap();
        q.enqueue(&Job::DedupExperiment, 0).unwrap();
        let claim = q.claim("a", 1, 1000).unwrap().unwrap();
        assert!(q.finish(&claim, true, 1001).is_err());
    }
    #[test]
    fn no_arbitrary_urls_or_commands() {
        let mut q = Queue::open(Path::new(":memory:")).unwrap();
        assert!(
            q.enqueue(
                &Job::CollectModrinth {
                    project: "https://localhost/private".into()
                },
                0
            )
            .is_err()
        );
        assert!(serde_json::from_str::<Job>(r#"{"RunShell":"echo unsafe"}"#).is_err());
    }
}

#[cfg(test)]
mod durability_contract_regression {
    #[test]
    fn opened_store_requests_extra_sync() {
        let store = super::Queue::open(std::path::Path::new(":memory:")).unwrap();
        assert_eq!(
            store
                .0
                .query_row("PRAGMA synchronous", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            3
        );
    }
}
