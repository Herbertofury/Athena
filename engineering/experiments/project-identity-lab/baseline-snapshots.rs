//! Atomic metadata generations. Failed refreshes never replace a successful snapshot.
use crate::modrinth::Project;
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use std::path::Path;
pub struct SnapshotStore(Connection);
impl SnapshotStore {
    pub fn open(path: &Path) -> rusqlite::Result<Self> {
        let c = Connection::open(path)?;
        c.busy_timeout(std::time::Duration::from_secs(5))?;
        c.execute_batch("PRAGMA foreign_keys=ON; PRAGMA synchronous=FULL;
            CREATE TABLE IF NOT EXISTS snapshots (
              generation INTEGER PRIMARY KEY, provider TEXT NOT NULL,
              canonical_id TEXT NOT NULL, observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              payload TEXT NOT NULL);
            CREATE INDEX IF NOT EXISTS latest_snapshot ON snapshots(provider,canonical_id,generation DESC);
            CREATE TABLE IF NOT EXISTS collection_attempts (
              id INTEGER PRIMARY KEY, requested_id TEXT NOT NULL,
              outcome TEXT NOT NULL CHECK(outcome IN ('success','failure')),
              generation INTEGER REFERENCES snapshots(generation),
              recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CHECK((outcome='success' AND generation IS NOT NULL) OR (outcome='failure' AND generation IS NULL)));")?;
        Ok(Self(c))
    }
    fn prepare_upstream_tables(&self) -> rusqlite::Result<()> {
        self.0.execute_batch("CREATE TABLE IF NOT EXISTS upstream_budget (id INTEGER PRIMARY KEY CHECK(id=1), window_start INTEGER NOT NULL, attempts INTEGER NOT NULL, next_allowed INTEGER NOT NULL, limited_count INTEGER NOT NULL, pending INTEGER NOT NULL CHECK(pending IN(0,1)));
        INSERT OR IGNORE INTO upstream_budget VALUES(1,0,0,0,0,0);
        CREATE TABLE IF NOT EXISTS upstream_receipts (generation INTEGER PRIMARY KEY REFERENCES snapshots(generation), payload TEXT NOT NULL);")
    }
    pub fn upstream_delay(&self, now: i64) -> Result<i64, Box<dyn std::error::Error>> {
        self.prepare_upstream_tables()?;
        let (start, attempts, next): (i64, i64, i64) = self.0.query_row(
            "SELECT window_start,attempts,next_allowed FROM upstream_budget WHERE id=1",
            [],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        )?;
        let until = if attempts >= 30 {
            next.max(start.saturating_add(3600))
        } else {
            next
        };
        Ok(until.saturating_sub(now).max(0))
    }
    /// Reserve before any public request. An interrupted reservation fails closed.
    pub fn reserve_upstream_request(
        &mut self,
        now: i64,
    ) -> Result<u32, Box<dyn std::error::Error>> {
        if now < 0 {
            return Err("Invalid upstream clock".into());
        }
        self.prepare_upstream_tables()?;
        let tx = self
            .0
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let (mut start,mut attempts,next,limits,pending):(i64,i64,i64,i64,i64)=tx.query_row("SELECT window_start,attempts,next_allowed,limited_count,pending FROM upstream_budget WHERE id=1",[],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?,r.get(3)?,r.get(4)?)))?;
        if pending != 0 {
            return Err("Interrupted upstream request requires cooldown reconciliation before another request".into());
        }
        if now < next {
            return Err("Provider cooldown active; retry later".into());
        }
        if now < start {
            return Err("Upstream clock moved backwards; no request made".into());
        }
        if now.saturating_sub(start) >= 3600 {
            start = now;
            attempts = 0;
        }
        if attempts >= 30 {
            return Err("Local public-upstream hourly request budget reached".into());
        }
        tx.execute("UPDATE upstream_budget SET window_start=?1,attempts=?2,next_allowed=?3,pending=1 WHERE id=1",params![start,attempts+1,now.saturating_add(1)])?;
        tx.commit()?;
        Ok(limits.clamp(0, 10) as u32)
    }
    pub fn finish_upstream_request(
        &mut self,
        meta: &crate::upstream_reviews::ResponseMeta,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.prepare_upstream_tables()?;
        if meta.next_allowed_epoch < 0 {
            return Err("Invalid upstream cooldown".into());
        }
        let count=self.0.execute("UPDATE upstream_budget SET next_allowed=max(next_allowed,?1),limited_count=CASE WHEN ?2 THEN min(limited_count+1,10) WHEN ?3=200 THEN 0 ELSE limited_count END,pending=0 WHERE id=1 AND pending=1",params![meta.next_allowed_epoch,meta.rate_limited,meta.status])?;
        if count != 1 {
            return Err("No upstream request reservation".into());
        }
        Ok(())
    }
    pub fn record_upstream_failure(
        &self,
        source: crate::upstream_reviews::Source,
    ) -> rusqlite::Result<()> {
        self.record_failure(&format!("github-upstream:{}", source.id()))
    }
    pub fn save_upstream(
        &mut self,
        source: crate::upstream_reviews::Source,
        bytes: &[u8],
        meta: &crate::upstream_reviews::ResponseMeta,
    ) -> Result<serde_json::Value, Box<dyn std::error::Error>> {
        if meta.status != 200
            || meta.rate_limited
            || meta.api_version_requested != crate::upstream_reviews::API_VERSION
            || meta
                .api_version_selected
                .as_deref()
                .is_some_and(|v| v != crate::upstream_reviews::API_VERSION)
        {
            return Err("Unverified upstream response metadata".into());
        }
        let record = crate::upstream_reviews::parse_record(source, bytes)?;
        self.prepare_upstream_tables()?;
        let tx = self
            .0
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let previous:Option<(i64,String)>=tx.query_row("SELECT generation,payload FROM snapshots WHERE provider='github-upstream' AND canonical_id=?1 ORDER BY generation DESC LIMIT 1",[source.id()],|r|Ok((r.get(0)?,r.get(1)?))).optional()?;
        let comparison = match &previous {
            None => "first_observation",
            Some((_, old)) => match crate::upstream_reviews::parse_record(source, old.as_bytes()) {
                Err(_) => "previous_record_invalid",
                Ok(p) if p.revision != record.revision => "revision_changed",
                Ok(_) if old.as_bytes() != bytes => "raw_metadata_changed",
                Ok(_) => "unchanged",
            },
        };
        tx.execute(
            "INSERT INTO snapshots(provider,canonical_id,payload) VALUES('github-upstream',?1,?2)",
            params![source.id(), record.payload],
        )?;
        let generation = tx.last_insert_rowid();
        let observed_at: String = tx.query_row(
            "SELECT observed_at FROM snapshots WHERE generation=?1",
            [generation],
            |r| r.get(0),
        )?;
        let receipt = serde_json::json!({"source_id":source.id(),"repository":source.repo(),"revision":record.revision,"source_url":record.source_url,"provider_timestamp":record.published_at,"timestamp_kind":if source==crate::upstream_reviews::Source::RustSec {"commit_committer_date"}else{"release_published_at"},"observed_at_utc":observed_at,"generation":generation.to_string(),"previous_generation":previous.map(|p|p.0.to_string()),"comparison":comparison,"payload_sha256":crate::build_identity::sha256_hex(bytes),"payload_bytes":bytes.len(),"response":meta,"scope":"Fixed public upstream observation; not registry-newest, installed version, signature verification, security clearance or automatic adoption. Complete original JSON retained locally; no assets downloaded."});
        tx.execute(
            "INSERT INTO upstream_receipts(generation,payload) VALUES(?1,?2)",
            params![generation, serde_json::to_string(&receipt)?],
        )?;
        tx.execute("INSERT INTO collection_attempts(requested_id,outcome,generation) VALUES(?1,'success',?2)",params![format!("github-upstream:{}",source.id()),generation])?;
        tx.commit()?;
        Ok(receipt)
    }
    pub fn latest_upstream_payload(
        &self,
        source: crate::upstream_reviews::Source,
    ) -> rusqlite::Result<Option<String>> {
        self.0.query_row("SELECT payload FROM snapshots WHERE provider='github-upstream' AND canonical_id=?1 ORDER BY generation DESC LIMIT 1",[source.id()],|r|r.get(0)).optional()
    }
    pub fn save_modrinth(
        &mut self,
        requested_id: &str,
        p: &Project,
    ) -> Result<i64, Box<dyn std::error::Error>> {
        crate::modrinth::project_url(requested_id)?;
        let body = serde_json::to_vec(p)?;
        // Enforce the same validation for callers as for network responses.
        crate::modrinth::parse_project(&body)?;
        let body = String::from_utf8(body)?;
        let tx = self.0.transaction()?;
        tx.execute(
            "INSERT INTO snapshots(provider,canonical_id,payload) VALUES('modrinth',?1,?2)",
            params![p.id, body],
        )?;
        let generation = tx.last_insert_rowid();
        tx.execute("INSERT INTO collection_attempts(requested_id,outcome,generation) VALUES(?1,'success',?2)",params![requested_id,generation])?;
        tx.commit()?;
        Ok(generation)
    }
    pub fn save_modrinth_batch(
        &mut self,
        batch: &crate::modrinth::ProjectBatch,
    ) -> Result<Vec<(String, i64)>, Box<dyn std::error::Error>> {
        // Revalidate before opening the transaction, including forged missing-state metadata.
        let validated = crate::modrinth::parse_projects(
            &serde_json::to_vec(&batch.projects)?,
            &batch.requested_ids,
        )?;
        if validated.missing_ids != batch.missing_ids {
            return Err("Inconsistent missing project identities".into());
        }
        let tx = self.0.transaction()?;
        let mut generations = Vec::new();
        for project in validated.projects {
            let body = serde_json::to_string(&project)?;
            tx.execute(
                "INSERT INTO snapshots(provider,canonical_id,payload) VALUES('modrinth',?1,?2)",
                params![project.id, body],
            )?;
            let generation = tx.last_insert_rowid();
            tx.execute("INSERT INTO collection_attempts(requested_id,outcome,generation) VALUES(?1,'success',?2)",params![project.id,generation])?;
            generations.push((project.id, generation));
        }
        for id in validated.missing_ids {
            tx.execute(
                "INSERT INTO collection_attempts(requested_id,outcome) VALUES(?1,'failure')",
                [id],
            )?;
        }
        tx.commit()?;
        Ok(generations)
    }
    pub fn record_batch_failure(
        &mut self,
        ids: &[String],
    ) -> Result<(), Box<dyn std::error::Error>> {
        crate::modrinth::projects_url(ids)?;
        let tx = self.0.transaction()?;
        for id in ids {
            tx.execute(
                "INSERT INTO collection_attempts(requested_id,outcome) VALUES(?1,'failure')",
                [id],
            )?;
        }
        tx.commit()?;
        Ok(())
    }
    pub fn record_failure(&self, requested_id: &str) -> rusqlite::Result<()> {
        // Intentionally do not persist error URLs, response bodies or credentials.
        self.0.execute(
            "INSERT INTO collection_attempts(requested_id,outcome) VALUES(?1,'failure')",
            [requested_id],
        )?;
        Ok(())
    }
    pub fn latest_modrinth(
        &self,
        canonical_id: &str,
    ) -> Result<Option<Project>, Box<dyn std::error::Error>> {
        let body: Option<String>=self.0.query_row("SELECT payload FROM snapshots WHERE provider='modrinth' AND canonical_id=?1 ORDER BY generation DESC LIMIT 1",[canonical_id],|r|r.get(0)).optional()?;
        body.map(|b| crate::modrinth::parse_project(b.as_bytes()))
            .transpose()
    }
    pub fn attempts(&self) -> rusqlite::Result<i64> {
        self.0
            .query_row("SELECT count(*) FROM collection_attempts", [], |r| r.get(0))
    }

    pub fn save_modrinth_versions(
        &mut self,
        batch: &crate::modrinth_versions::VersionBatch,
    ) -> Result<Vec<(String, i64)>, Box<dyn std::error::Error>> {
        let payloads: Vec<_> = batch.versions.iter().map(|v| &v.payload).collect();
        let checked = crate::modrinth_versions::parse_versions(
            &serde_json::to_vec(&payloads)?,
            &batch.requested_ids,
        )?;
        if checked.missing_ids != batch.missing_ids
            || checked.versions.len() != batch.versions.len()
            || checked
                .versions
                .iter()
                .zip(&batch.versions)
                .any(|(a, b)| a.canonical_id != b.canonical_id || a.project_id != b.project_id)
        {
            return Err("Inconsistent version batch identities or missing state".into());
        }
        let tx = self.0.transaction()?;
        let mut generations = Vec::new();
        for version in checked.versions {
            tx.execute("INSERT INTO snapshots(provider,canonical_id,payload) VALUES('modrinth-version',?1,?2)", params![version.canonical_id, version.payload.get()])?;
            let generation = tx.last_insert_rowid();
            tx.execute("INSERT INTO collection_attempts(requested_id,outcome,generation) VALUES(?1,'success',?2)", params![format!("modrinth-version:{}",version.canonical_id),generation])?;
            generations.push((version.canonical_id, generation));
        }
        for id in checked.missing_ids {
            tx.execute(
                "INSERT INTO collection_attempts(requested_id,outcome) VALUES(?1,'failure')",
                [format!("modrinth-version:{id}")],
            )?;
        }
        tx.commit()?;
        Ok(generations)
    }

    pub fn record_version_failure(
        &mut self,
        ids: &[String],
    ) -> Result<(), Box<dyn std::error::Error>> {
        crate::modrinth_versions::versions_url(ids)?;
        let tx = self.0.transaction()?;
        for id in ids {
            tx.execute(
                "INSERT INTO collection_attempts(requested_id,outcome) VALUES(?1,'failure')",
                [format!("modrinth-version:{id}")],
            )?;
        }
        tx.commit()?;
        Ok(())
    }

    pub fn latest_modrinth_version(
        &self,
        id: &str,
    ) -> Result<Option<crate::modrinth_versions::VersionRecord>, Box<dyn std::error::Error>> {
        Ok(self
            .latest_modrinth_version_snapshot(id)?
            .map(|(_, record)| record))
    }
    pub fn latest_modrinth_version_snapshot(
        &self,
        id: &str,
    ) -> Result<Option<(i64, crate::modrinth_versions::VersionRecord)>, Box<dyn std::error::Error>>
    {
        let stored:Option<(i64,String)>=self.0.query_row("SELECT generation,payload FROM snapshots WHERE provider='modrinth-version' AND canonical_id=?1 ORDER BY generation DESC LIMIT 1",[id],|r|Ok((r.get(0)?,r.get(1)?))).optional()?;
        stored
            .map(|(generation, body)| {
                let record = crate::modrinth_versions::parse_version(body.as_bytes())?;
                if record.canonical_id != id {
                    return Err("Stored version identity does not match its lookup key".into());
                }
                Ok((generation, record))
            })
            .transpose()
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    fn upstream_meta(now: i64) -> crate::upstream_reviews::ResponseMeta {
        crate::upstream_reviews::response_meta(200, &reqwest::header::HeaderMap::new(), now, 0)
    }
    #[test]
    fn upstream_budget_is_bounded_and_interruption_fails_closed() {
        let mut store = SnapshotStore::open(Path::new(":memory:")).unwrap();
        store.reserve_upstream_request(10000).unwrap();
        assert!(
            store
                .reserve_upstream_request(20000)
                .unwrap_err()
                .to_string()
                .contains("Interrupted")
        );
        store
            .finish_upstream_request(&upstream_meta(10000))
            .unwrap();
        assert!(store.reserve_upstream_request(10000).is_err());
        for i in 1..30 {
            let now = 10000 + i * 2;
            store.reserve_upstream_request(now).unwrap();
            store.finish_upstream_request(&upstream_meta(now)).unwrap();
        }
        assert!(
            store
                .reserve_upstream_request(10061)
                .unwrap_err()
                .to_string()
                .contains("hourly")
        );
        store.reserve_upstream_request(13600).unwrap();
    }
    #[test]
    fn upstream_snapshots_preserve_bytes_states_and_failures() {
        use crate::upstream_reviews::{Source, tests::fixture};
        let mut store = SnapshotStore::open(Path::new(":memory:")).unwrap();
        let first = fixture("v1.7.3");
        let a = store
            .save_upstream(Source::Hls, &first, &upstream_meta(10000))
            .unwrap();
        assert_eq!(a["comparison"], "first_observation");
        assert!(a["generation"].is_string());
        let b = store
            .save_upstream(Source::Hls, &first, &upstream_meta(10002))
            .unwrap();
        assert_eq!(b["comparison"], "unchanged");
        let metadata = String::from_utf8(first.clone())
            .unwrap()
            .replace("unknown", "another_unknown")
            .into_bytes();
        assert_eq!(
            store
                .save_upstream(Source::Hls, &metadata, &upstream_meta(10004))
                .unwrap()["comparison"],
            "raw_metadata_changed"
        );
        assert_eq!(
            store
                .save_upstream(Source::Hls, &fixture("v1.7.4"), &upstream_meta(10006))
                .unwrap()["comparison"],
            "revision_changed"
        );
        store.record_upstream_failure(Source::Hls).unwrap();
        assert_eq!(
            store
                .latest_upstream_payload(Source::Hls)
                .unwrap()
                .unwrap()
                .as_bytes(),
            fixture("v1.7.4")
        );
        let mut bad = upstream_meta(10008);
        bad.status = 403;
        assert!(
            store
                .save_upstream(Source::Hls, &fixture("v1.7.5"), &bad)
                .is_err()
        );
        let before = store.attempts().unwrap();
        store.0.execute_batch("CREATE TRIGGER fixture_block_upstream_receipt BEFORE INSERT ON upstream_receipts BEGIN SELECT RAISE(ABORT,'fixture rollback'); END;").unwrap();
        assert!(
            store
                .save_upstream(Source::Hls, &fixture("v1.7.5"), &upstream_meta(10010))
                .is_err()
        );
        assert_eq!(store.attempts().unwrap(), before);
        assert_eq!(
            store
                .latest_upstream_payload(Source::Hls)
                .unwrap()
                .unwrap()
                .as_bytes(),
            fixture("v1.7.4")
        );
    }
    #[test]
    fn upstream_provider_cooldown_survives_reopen() {
        let path = std::env::temp_dir().join(format!(
            "atlas-upstream-{}-{}.sqlite",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let mut store = SnapshotStore::open(&path).unwrap();
        store.reserve_upstream_request(10000).unwrap();
        let mut headers = reqwest::header::HeaderMap::new();
        headers.insert("retry-after", "5000".parse().unwrap());
        store
            .finish_upstream_request(&crate::upstream_reviews::response_meta(
                429, &headers, 10000, 0,
            ))
            .unwrap();
        drop(store);
        let mut reopened = SnapshotStore::open(&path).unwrap();
        assert_eq!(reopened.upstream_delay(11000).unwrap(), 4000);
        assert!(reopened.reserve_upstream_request(11000).is_err());
        assert_eq!(reopened.reserve_upstream_request(15000).unwrap(), 1);
    }
    #[test]
    fn version_lookup_rejects_misbound_stored_identity() {
        let mut store = SnapshotStore::open(Path::new(":memory:")).unwrap();
        let body=br#"[{"id":"abcdefgh","project_id":"AANobbMI","name":"fixture","version_number":"1","date_published":"2026-10-27","game_versions":[],"loaders":[],"files":[],"dependencies":[]}]"#;
        let batch = crate::modrinth_versions::parse_versions(body, &["abcdefgh".into()]).unwrap();
        store.save_modrinth_versions(&batch).unwrap();
        assert!(
            store
                .latest_modrinth_version_snapshot("abcdefgh")
                .unwrap()
                .unwrap()
                .0
                > 0
        );
        store
            .0
            .execute(
                "UPDATE snapshots SET canonical_id='ijklmnop' WHERE provider='modrinth-version'",
                [],
            )
            .unwrap();
        assert!(store.latest_modrinth_version_snapshot("ijklmnop").is_err());
    }
    fn project() -> Project {
        Project {
            id: "AANobbMI".into(),
            slug: "sodium".into(),
            title: "Sodium fixture".into(),
            description: "unit fixture only".into(),
            body: Some("full description fixture".into()),
            project_type: "mod".into(),
            versions: vec!["version-a".into()],
            icon_url: None,
            gallery: None,
        }
    }
    #[test]
    fn partial_batch_keeps_last_good_and_records_each_identity() {
        let mut store = SnapshotStore::open(Path::new(":memory:")).unwrap();
        store.save_modrinth("AANobbMI", &project()).unwrap();
        let mut other = project();
        other.id = "P7dR8mSH".into();
        let batch = crate::modrinth::ProjectBatch {
            requested_ids: vec!["AANobbMI".into(), "P7dR8mSH".into()],
            projects: vec![other],
            missing_ids: vec!["AANobbMI".into()],
        };
        assert_eq!(store.save_modrinth_batch(&batch).unwrap().len(), 1);
        assert_eq!(store.attempts().unwrap(), 3);
        assert_eq!(
            store.latest_modrinth("AANobbMI").unwrap().unwrap().title,
            "Sodium fixture"
        );
        assert!(store.latest_modrinth("P7dR8mSH").unwrap().is_some());
    }
    #[test]
    fn database_failure_rolls_back_earlier_batch_rows() {
        let mut store = SnapshotStore::open(Path::new(":memory:")).unwrap();
        store.0.execute_batch("CREATE TRIGGER reject_second BEFORE INSERT ON snapshots WHEN NEW.canonical_id='P7dR8mSH' BEGIN SELECT RAISE(ABORT,'injected fixture failure'); END;").unwrap();
        let mut other = project();
        other.id = "P7dR8mSH".into();
        let batch = crate::modrinth::ProjectBatch {
            requested_ids: vec!["AANobbMI".into(), "P7dR8mSH".into()],
            projects: vec![project(), other],
            missing_ids: vec![],
        };
        assert!(store.save_modrinth_batch(&batch).is_err());
        assert_eq!(store.attempts().unwrap(), 0);
        assert!(store.latest_modrinth("AANobbMI").unwrap().is_none());
    }
    #[test]
    fn invalid_batch_cannot_partially_commit() {
        let mut store = SnapshotStore::open(Path::new(":memory:")).unwrap();
        let batch = crate::modrinth::ProjectBatch {
            requested_ids: vec!["AANobbMI".into()],
            projects: vec![project()],
            missing_ids: vec!["AANobbMI".into()],
        };
        assert!(store.save_modrinth_batch(&batch).is_err());
        assert_eq!(store.attempts().unwrap(), 0);
        assert!(store.latest_modrinth("AANobbMI").unwrap().is_none());
    }
    #[test]
    fn failure_preserves_last_verified_generation() {
        let mut s = SnapshotStore::open(Path::new(":memory:")).unwrap();
        s.save_modrinth("sodium", &project()).unwrap();
        s.record_failure("sodium").unwrap();
        assert_eq!(
            s.latest_modrinth("AANobbMI").unwrap().unwrap().versions,
            ["version-a"]
        );
        assert_eq!(s.attempts().unwrap(), 2);
    }
    #[test]
    fn invalid_snapshot_does_not_replace_good_one() {
        let mut s = SnapshotStore::open(Path::new(":memory:")).unwrap();
        s.save_modrinth("sodium", &project()).unwrap();
        let mut bad = project();
        bad.title.clear();
        assert!(s.save_modrinth("sodium", &bad).is_err());
        assert_eq!(s.attempts().unwrap(), 1);
        assert_eq!(
            s.latest_modrinth("AANobbMI").unwrap().unwrap().title,
            "Sodium fixture"
        );
    }
    #[test]
    fn canonical_id_survives_slug_change() {
        let mut s = SnapshotStore::open(Path::new(":memory:")).unwrap();
        s.save_modrinth("sodium", &project()).unwrap();
        let mut p = project();
        p.slug = "new-name".into();
        s.save_modrinth("new-name", &p).unwrap();
        assert_eq!(
            s.latest_modrinth("AANobbMI").unwrap().unwrap().slug,
            "new-name"
        );
        assert!(s.latest_modrinth("missing").unwrap().is_none());
    }
}
