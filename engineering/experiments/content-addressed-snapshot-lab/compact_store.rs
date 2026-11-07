//! Isolated append-only experiment. Never opens or migrates the app database.
use atlas_lab::modrinth::ProjectRecord;
use rusqlite::{Connection, OptionalExtension, params};
use sha2::{Digest, Sha256};
use std::path::Path;
fn payload_digest(bytes: &[u8]) -> Vec<u8> {
    Sha256::digest(bytes).to_vec()
}
type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;
pub struct CompactStore(pub(crate) Connection);
impl CompactStore {
    pub fn open(path: &Path) -> Result<Self> {
        let c = Connection::open(path)?;
        let tables: i64 = c.query_row(
            "SELECT count(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
            [],
            |r| r.get(0),
        )?;
        let identity: i64 = c.query_row("PRAGMA application_id", [], |r| r.get(0))?;
        if identity != 0x41544342 && (tables > 0 || identity != 0) {
            return Err("Not an isolated addressed snapshot database; unchanged".into());
        }
        crate::storage_connection::configure(&c)?;
        c.execute_batch("CREATE TABLE IF NOT EXISTS payloads(id INTEGER PRIMARY KEY, hash BLOB NOT NULL UNIQUE CHECK(typeof(hash)='blob' AND length(hash)=32), payload TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS snapshots(generation INTEGER PRIMARY KEY,provider TEXT NOT NULL,canonical_id TEXT NOT NULL,observed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,payload_id INTEGER NOT NULL REFERENCES payloads(id));
        CREATE INDEX IF NOT EXISTS latest_snapshot ON snapshots(provider,canonical_id,generation DESC);
        CREATE TABLE IF NOT EXISTS collection_attempts(id INTEGER PRIMARY KEY,requested_id TEXT NOT NULL,outcome TEXT NOT NULL CHECK(outcome IN ('success','failure')),generation INTEGER REFERENCES snapshots(generation),recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,CHECK((outcome='success' AND generation IS NOT NULL) OR (outcome='failure' AND generation IS NULL)));")?;
        // Assign the format marker only for a new database. Reissuing this
        // pragma on reopen writes the header and forces needless durable I/O.
        if identity != 0x41544342 {
            c.pragma_update(None, "application_id", 0x41544342_i64)?;
        }
        Ok(Self(c))
    }
    pub fn save(&mut self, requested: &str, record: &ProjectRecord) -> Result<i64> {
        record.bind_request(requested)?;
        let hash = payload_digest(record.raw_json().as_bytes());
        let tx = self.0.transaction()?;
        tx.execute(
            "INSERT OR IGNORE INTO payloads(hash,payload) VALUES(?1,?2)",
            params![hash, record.raw_json()],
        )?;
        // Never treat a matching hash alone as complete-data equality.
        // Compare SQLite's borrowed value while the row is live. Every byte
        // is still checked; no duplicate owned payload allocation is needed.
        let (payload_id, equal): (i64, bool) = tx.query_row("SELECT id,CASE WHEN octet_length(payload)<=4194304 THEN payload ELSE NULL END FROM payloads WHERE hash=?1", [&hash], |r| {
            Ok((r.get(0)?, matches!(r.get_ref(1)?, rusqlite::types::ValueRef::Text(stored) if stored == record.raw_json().as_bytes())))
        })?;
        if !equal {
            return Err(
                "Payload hash collision or damaged payload; transaction rolled back".into(),
            );
        }
        tx.execute("INSERT INTO snapshots(provider,canonical_id,payload_id) VALUES('modrinth-project-raw',?1,?2)",params![record.project().id,payload_id])?;
        let generation = tx.last_insert_rowid();
        tx.execute("INSERT INTO collection_attempts(requested_id,outcome,generation) VALUES(?1,'success',?2)",params![format!("modrinth-project-raw:{requested}"),generation])?;
        tx.commit()?;
        Ok(generation)
    }
    pub fn latest(&self, id: &str) -> Result<Option<(i64, ProjectRecord)>> {
        atlas_lab::modrinth::projects_url(&[id.to_owned()])?;
        let row: Option<(i64,Vec<u8>,Option<String>)> = self.0.query_row("SELECT s.generation,p.hash,CASE WHEN octet_length(p.payload)<=4194304 THEN p.payload ELSE NULL END FROM snapshots s JOIN payloads p ON p.id=s.payload_id WHERE s.provider='modrinth-project-raw' AND s.canonical_id=?1 ORDER BY s.generation DESC LIMIT 1",[id],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?))).optional()?;
        row.map(|(generation, hash, text)| {
            if generation < 1 {
                return Err("Invalid generation".into());
            }
            let text = text.ok_or("Oversized or missing stored payload")?;
            if payload_digest(text.as_bytes()) != hash {
                return Err("Stored payload digest mismatch".into());
            }
            Ok((
                generation,
                atlas_lab::modrinth::parse_project_record_owned(text.into_bytes(), id)?,
            ))
        })
        .transpose()
    }
    pub fn record_failure(&self, requested: &str) -> Result<()> {
        atlas_lab::modrinth::project_url(requested)?;
        self.0.execute("INSERT INTO collection_attempts(requested_id,outcome,generation) VALUES(?1,'failure',NULL)",[format!("modrinth-project-raw:{requested}")])?;
        Ok(())
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    fn fixture(title: &str) -> ProjectRecord {
        let text = format!(
            r#" {{"id":"AANobbMI","slug":"sodium","title":"{title}","description":"fixture","project_type":"mod","versions":[],"future":{{"exact":18446744073709551617,"empty":null}}}} "#
        );
        atlas_lab::modrinth::parse_project_record(text.as_bytes(), "sodium").unwrap()
    }
    #[test]
    fn duplicate_bytes_share_payload_but_keep_every_observation() {
        let mut s = CompactStore::open(Path::new(":memory:")).unwrap();
        let a = fixture("one");
        assert_eq!(s.save("sodium", &a).unwrap(), 1);
        assert_eq!(s.save("AANobbMI", &a).unwrap(), 2);
        assert_eq!(
            s.0.query_row("SELECT count(*) FROM payloads", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            1
        );
        assert_eq!(
            s.0.query_row("SELECT count(*) FROM snapshots", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            2
        );
        assert_eq!(
            s.0.query_row("SELECT count(*) FROM collection_attempts", [], |r| r
                .get::<_, i64>(0))
                .unwrap(),
            2
        );
        let got = s.latest("AANobbMI").unwrap().unwrap();
        assert_eq!(got.0, 2);
        assert_eq!(got.1.raw_json(), a.raw_json());
        let b = fixture("two");
        s.save("sodium", &b).unwrap();
        assert_eq!(
            s.0.query_row("SELECT count(*) FROM payloads", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            2
        );
        s.record_failure("sodium").unwrap();
        assert_eq!(
            s.latest("AANobbMI").unwrap().unwrap().1.raw_json(),
            b.raw_json()
        );
    }
    #[test]
    fn forced_collision_and_failed_attempt_roll_back_all_new_state() {
        let mut s = CompactStore::open(Path::new(":memory:")).unwrap();
        let a = fixture("one");
        let hash = payload_digest(a.raw_json().as_bytes());
        s.0.execute(
            "INSERT INTO payloads(hash,payload) VALUES(?1,'different')",
            [hash],
        )
        .unwrap();
        assert!(s.save("sodium", &a).is_err());
        assert_eq!(
            s.0.query_row("SELECT count(*) FROM snapshots", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            0
        );
        s.0.execute("DELETE FROM payloads", []).unwrap();
        s.0.execute_batch("CREATE TRIGGER fail_attempt BEFORE INSERT ON collection_attempts BEGIN SELECT RAISE(ABORT,'fixture rejection'); END;").unwrap();
        assert!(s.save("sodium", &a).is_err());
        for table in ["payloads", "snapshots", "collection_attempts"] {
            assert_eq!(
                s.0.query_row(&format!("SELECT count(*) FROM {table}"), [], |r| r
                    .get::<_, i64>(0))
                    .unwrap(),
                0
            );
        }
    }
    #[test]
    fn borrowed_comparison_rejects_wrong_types_and_oversized_values() {
        for value in [
            rusqlite::types::Value::Blob(b"different".to_vec()),
            rusqlite::types::Value::Text("x".repeat(4 * 1024 * 1024 + 1)),
        ] {
            let mut s = CompactStore::open(Path::new(":memory:")).unwrap();
            let a = fixture("one");
            let hash = payload_digest(a.raw_json().as_bytes());
            s.0.execute(
                "INSERT INTO payloads(hash,payload) VALUES(?1,?2)",
                params![hash, value],
            )
            .unwrap();
            assert!(s.save("sodium", &a).is_err());
            assert_eq!(
                s.0.query_row("SELECT count(*) FROM snapshots", [], |r| r.get::<_, i64>(0))
                    .unwrap(),
                0
            );
            assert_eq!(
                s.0.query_row("SELECT count(*) FROM collection_attempts", [], |r| r
                    .get::<_, i64>(0))
                    .unwrap(),
                0
            );
        }
    }
    #[test]
    fn binary_key_constraints_and_integer_references_are_enforced() {
        let mut s = CompactStore::open(Path::new(":memory:")).unwrap();
        for bad in [
            rusqlite::types::Value::Text("x".repeat(32)),
            rusqlite::types::Value::Blob(vec![0; 31]),
            rusqlite::types::Value::Blob(vec![0; 33]),
        ] {
            assert!(
                s.0.execute("INSERT INTO payloads(hash,payload) VALUES(?1,'{}')", [bad])
                    .is_err()
            );
        }
        s.save("sodium", &fixture("one")).unwrap();
        let shape:(String,i64,String)=s.0.query_row("SELECT typeof(p.hash),length(p.hash),typeof(s.payload_id) FROM snapshots s JOIN payloads p ON p.id=s.payload_id",[],|r|Ok((r.get(0)?,r.get(1)?,r.get(2)?))).unwrap();
        assert_eq!(shape, ("blob".into(), 32, "integer".into()));
    }
    #[test]
    fn other_experimental_format_is_rejected_without_changes() {
        let root = std::env::temp_dir().join(format!(
            "atlas-format-isolation-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir(&root).unwrap();
        let old = root.join("text-key.sqlite");
        let mut reference = crate::content_addressed_candidate::AddressedStore::open(&old).unwrap();
        reference.save("sodium", &fixture("original")).unwrap();
        drop(reference);
        let before = std::fs::read(&old).unwrap();
        assert!(CompactStore::open(&old).is_err());
        assert_eq!(before, std::fs::read(&old).unwrap());
        let new = root.join("integer-key.sqlite");
        let mut compact = CompactStore::open(&new).unwrap();
        compact.save("sodium", &fixture("compact")).unwrap();
        drop(compact);
        let before = std::fs::read(&new).unwrap();
        assert!(crate::content_addressed_candidate::AddressedStore::open(&new).is_err());
        assert_eq!(before, std::fs::read(&new).unwrap());
        std::fs::remove_dir_all(root).unwrap();
    }
    #[test]
    fn identity_and_tampering_fail_closed() {
        let mut s = CompactStore::open(Path::new(":memory:")).unwrap();
        let a = fixture("one");
        assert!(s.save("other", &a).is_err());
        s.save("sodium", &a).unwrap();
        s.0.execute("UPDATE payloads SET payload='{}'", []).unwrap();
        assert!(s.latest("AANobbMI").is_err());
        assert!(s.latest("../secret").is_err());
        assert!(s.record_failure("https://example.invalid/").is_err());
    }
    #[test]
    fn existing_application_database_is_rejected_without_schema_changes() {
        let path = std::env::temp_dir().join(format!(
            "atlas-compact-rejection-{}-{}.sqlite",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&path)
            .unwrap();
        let mut original = atlas_lab::snapshots::SnapshotStore::open(&path).unwrap();
        let record = fixture("original");
        original
            .save_modrinth_project_record("sodium", &record)
            .unwrap();
        drop(original);
        let before = std::fs::read(&path).unwrap();
        assert!(CompactStore::open(&path).is_err());
        assert_eq!(before, std::fs::read(&path).unwrap());
        std::fs::remove_file(path).unwrap();
    }
    #[test]
    fn repeated_changed_generations_keep_exact_history_and_recover_after_rejection() {
        let mut s = CompactStore::open(Path::new(":memory:")).unwrap();
        for i in 0..1000 {
            let record = fixture(&format!("revision-{}", i % 13));
            let generation = s.save("sodium", &record).unwrap();
            assert_eq!(generation, i + 1);
            if i % 17 == 0 {
                assert!(s.save("wrong-slug", &record).is_err());
            }
            assert_eq!(
                s.latest("AANobbMI").unwrap().unwrap().1.raw_json(),
                record.raw_json()
            );
        }
        assert_eq!(
            s.0.query_row("SELECT count(*) FROM payloads", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            13
        );
        assert_eq!(
            s.0.query_row("SELECT count(*) FROM snapshots", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            1000
        );
        assert_eq!(
            s.0.query_row("SELECT count(*) FROM collection_attempts", [], |r| r
                .get::<_, i64>(0))
                .unwrap(),
            1000
        );
        assert_eq!(
            s.0.query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))
                .unwrap(),
            "ok"
        );
    }
    #[test]
    fn reopening_for_read_does_not_write_the_database_header() {
        let path = std::env::temp_dir().join(format!(
            "atlas-compact-reopen-{}-{}.sqlite",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&path)
            .unwrap();
        let mut s = CompactStore::open(&path).unwrap();
        s.save("sodium", &fixture("one")).unwrap();
        drop(s);
        let before = std::fs::read(&path).unwrap();
        let reopened = CompactStore::open(&path).unwrap();
        assert!(reopened.latest("AANobbMI").unwrap().is_some());
        drop(reopened);
        let after = std::fs::read(&path).unwrap();
        std::fs::remove_file(path).unwrap();
        assert_eq!(
            payload_digest(&before),
            payload_digest(&after),
            "Read-only reopen changed stored database bytes"
        );
    }
}
