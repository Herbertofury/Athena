//! Public, attributed mod knowledge. No transport, credentials or scraped seeds.
//! Permission to retain and publish is separate; reference-only sources stay out.
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use std::{error::Error, path::Path, time::Duration};
pub type Result<T> = std::result::Result<T, Box<dyn Error>>;
pub struct Store {
    db: Connection,
}
#[derive(Debug, PartialEq, Eq)]
pub struct Observation {
    pub id: String,
    pub entity_id: String,
    pub source_id: String,
    pub source_url: String,
    pub predicate: String,
    pub value: String,
    pub observed_unix: i64,
    pub applicable_build: String,
    pub mod_version: String,
    pub completeness: String,
    pub policy_revision: String,
}
fn public_url(raw: &str) -> Result<()> {
    let u = url::Url::parse(raw)?;
    if u.scheme() != "https"
        || u.host_str().is_none()
        || !u.username().is_empty()
        || u.password().is_some()
        || u.query().is_some()
        || u.fragment().is_some()
    {
        return Err(
            "Expected canonical HTTPS reference without credentials, query or fragment".into(),
        );
    }
    Ok(())
}
impl Store {
    pub fn open(path: impl AsRef<Path>) -> Result<Self> {
        let db = Connection::open(path)?;
        db.busy_timeout(Duration::from_secs(5))?;
        db.pragma_update(None, "foreign_keys", true)?;
        let version: i64 = db.pragma_query_value(None, "user_version", |r| r.get(0))?;
        if version > 1 {
            return Err("Unsupported future schema; left untouched".into());
        }
        if version == 0 {
            let tables: i64=db.query_row("SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",[],|r|r.get(0))?;
            if tables != 0 {
                return Err("Unrecognized database; left untouched".into());
            }
            db.execute_batch(concat!(
                "BEGIN IMMEDIATE;",
                include_str!("schema.sql"),
                "COMMIT;"
            ))?;
        }
        Ok(Self { db })
    }
    pub fn register_game(&self, id: &str, name: &str) -> Result<()> {
        self.db.execute(
            "INSERT INTO games VALUES(?1,?2) ON CONFLICT(id) DO UPDATE SET name=excluded.name",
            params![id, name],
        )?;
        Ok(())
    }
    /// Policy is user/provider-reviewed input, never inferred from public visibility.
    pub fn set_source_policy(
        &self,
        id: &str,
        url: &str,
        retain: bool,
        publish: bool,
        revision: &str,
    ) -> Result<()> {
        public_url(url)?;
        self.db.execute("INSERT INTO sources VALUES(?1,?2,?3,?4,?5) ON CONFLICT(id) DO UPDATE SET policy_url=excluded.policy_url,can_retain=excluded.can_retain,can_publish=excluded.can_publish,policy_revision=excluded.policy_revision",params![id,url,retain,publish,revision])?;
        Ok(())
    }
    pub fn register_entity(&self, id: &str, game: &str, kind: &str, name: &str) -> Result<()> {
        self.db.execute(
            "INSERT INTO entities VALUES(?1,?2,?3,?4)",
            params![id, game, kind, name],
        )?;
        Ok(())
    }
    /// Atomic batch; replay must be byte-identical. Conflicting claims use distinct IDs.
    pub fn import(&mut self, records: &[Observation]) -> Result<()> {
        if records.len() > 1000 {
            return Err("Batch exceeds 1000 observations".into());
        }
        let tx = self
            .db
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        for r in records {
            public_url(&r.source_url)?;
            if r.value.len() > 65536 {
                return Err("Observation exceeds 64KiB".into());
            }
            let policy: Option<(bool, bool, String)> = tx
                .query_row(
                    "SELECT can_retain,can_publish,policy_revision FROM sources WHERE id=?1",
                    [&r.source_id],
                    |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
                )
                .optional()?;
            if policy != Some((true, true, r.policy_revision.clone())) {
                return Err("Public ingestion denied by current source policy".into());
            }
            tx.execute("INSERT INTO observations VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11) ON CONFLICT(id) DO NOTHING",params![r.id,r.entity_id,r.source_id,r.source_url,r.predicate,r.value,r.observed_unix,r.applicable_build,r.mod_version,r.completeness,r.policy_revision])?;
            let same:bool=tx.query_row("SELECT entity_id=?2 AND source_id=?3 AND source_url=?4 AND predicate=?5 AND value=?6 AND observed_unix=?7 AND applicable_build=?8 AND mod_version=?9 AND completeness=?10 AND policy_revision=?11 FROM observations WHERE id=?1",params![r.id,r.entity_id,r.source_id,r.source_url,r.predicate,r.value,r.observed_unix,r.applicable_build,r.mod_version,r.completeness,r.policy_revision],|row|row.get(0))?;
            if !same {
                return Err("Observation ID conflict; history not overwritten".into());
            }
        }
        tx.commit()?;
        Ok(())
    }
    /// Current public policy is rechecked on reads: withdrawal hides prior rows.
    pub fn observations(&self, entity: &str) -> Result<Vec<Observation>> {
        self.observations_page(entity, 0)
    }
    /// Pages contain at most 1000 records; callers continue until a short page.
    pub fn observations_page(&self, entity: &str, offset: u32) -> Result<Vec<Observation>> {
        let mut q=self.db.prepare("SELECT o.id,o.entity_id,o.source_id,o.source_url,o.predicate,o.value,o.observed_unix,o.applicable_build,o.mod_version,o.completeness,o.policy_revision FROM observations o JOIN sources s ON s.id=o.source_id WHERE o.entity_id=?1 AND s.can_retain=1 AND s.can_publish=1 AND o.policy_revision=s.policy_revision ORDER BY o.observed_unix DESC,o.id LIMIT 1000 OFFSET ?2")?;
        Ok(q.query_map(params![entity, offset], |r| {
            Ok(Observation {
                id: r.get(0)?,
                entity_id: r.get(1)?,
                source_id: r.get(2)?,
                source_url: r.get(3)?,
                predicate: r.get(4)?,
                value: r.get(5)?,
                observed_unix: r.get(6)?,
                applicable_build: r.get(7)?,
                mod_version: r.get(8)?,
                completeness: r.get(9)?,
                policy_revision: r.get(10)?,
            })
        })?
        .collect::<rusqlite::Result<Vec<_>>>()?)
    }
    pub fn record_refresh(&self, source: &str, at: i64, outcome: &str, detail: &str) -> Result<()> {
        if detail.len() > 4096 {
            return Err("Refresh detail exceeds 4KiB".into());
        }
        self.db.execute("INSERT INTO refresh_attempts(source_id,attempted_unix,outcome,detail) VALUES(?1,?2,?3,?4)",params![source,at,outcome,detail])?;
        Ok(())
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    fn store() -> Store {
        let s = Store::open(":memory:").unwrap();
        s.register_game("sims4", "The Sims 4").unwrap();
        s.set_source_policy("fixture", "https://example.org/terms", true, true, "v1")
            .unwrap();
        s.register_entity("fixture:mod:1", "sims4", "mod", "Synthetic mod")
            .unwrap();
        s
    }
    fn row(id: &str, value: &str) -> Observation {
        Observation {
            id: id.into(),
            entity_id: "fixture:mod:1".into(),
            source_id: "fixture".into(),
            source_url: "https://example.org/mod/1".into(),
            predicate: "compatibility".into(),
            value: value.into(),
            observed_unix: 1,
            applicable_build: "fixture-build".into(),
            mod_version: "1.0".into(),
            completeness: "unknown".into(),
            policy_revision: "v1".into(),
        }
    }
    #[test]
    fn replay_and_conflict() {
        let mut s = store();
        s.import(&[row("a", "works")]).unwrap();
        s.import(&[row("a", "works")]).unwrap();
        assert!(
            s.import(&[row("b", "broken"), row("a", "changed")])
                .is_err()
        );
        assert_eq!(s.observations("fixture:mod:1").unwrap().len(), 1);
    }
    #[test]
    fn denied_and_withdrawn() {
        let mut s = store();
        s.import(&[row("a", "works")]).unwrap();
        s.set_source_policy("fixture", "https://example.org/terms", true, false, "v2")
            .unwrap();
        assert!(s.import(&[row("b", "broken")]).is_err());
        assert!(s.observations("fixture:mod:1").unwrap().is_empty());
    }
    #[test]
    fn conflicting_sources_retained_and_failure_preserves() {
        let mut s = store();
        s.import(&[row("a", "works"), row("b", "broken")]).unwrap();
        s.record_refresh("fixture", 2, "failed", "fixture timeout")
            .unwrap();
        assert_eq!(s.observations("fixture:mod:1").unwrap().len(), 2);
    }
    #[test]
    fn foreign_key_and_url_rejected() {
        let mut s = store();
        let mut r = row("a", "works");
        r.entity_id = "missing".into();
        assert!(s.import(&[r]).is_err());
        let mut r = row("b", "works");
        r.source_url = "https://example.org/mod?token=private".into();
        assert!(s.import(&[r]).is_err());
        assert!(s.observations("fixture:mod:1").unwrap().is_empty());
    }
    #[test]
    fn durable_reopen_and_future_schema() {
        let path = std::env::temp_dir().join(format!(
            "athena-mod-knowledge-{}-{}.sqlite",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        {
            let mut s = Store::open(&path).unwrap();
            s.register_game("sims4", "Sims").unwrap();
            s.set_source_policy("fixture", "https://example.org/terms", true, true, "v1")
                .unwrap();
            s.register_entity("fixture:mod:1", "sims4", "mod", "Fixture")
                .unwrap();
            s.import(&[row("durable", "unknown")]).unwrap();
        }
        {
            let s = Store::open(&path).unwrap();
            assert_eq!(s.observations("fixture:mod:1").unwrap()[0].value, "unknown");
            assert!(s.observations_page("fixture:mod:1", 1).unwrap().is_empty());
            let integrity: String =
                s.db.query_row("PRAGMA integrity_check", [], |r| r.get(0))
                    .unwrap();
            assert_eq!(integrity, "ok");
            s.db.pragma_update(None, "user_version", 99).unwrap();
        }
        assert!(Store::open(&path).is_err());
        let db = Connection::open(&path).unwrap();
        let version: i64 = db
            .pragma_query_value(None, "user_version", |r| r.get(0))
            .unwrap();
        assert_eq!(version, 99);
        drop(db);
        std::fs::remove_file(path).unwrap();
    }
}
