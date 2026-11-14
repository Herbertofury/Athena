use athena_foundry_store::Store;
use rusqlite::Connection;
use std::{
    path::PathBuf,
    sync::atomic::{AtomicUsize, Ordering},
};
const JS: &str = include_str!("fixtures/js-workspace.json");
static NEXT: AtomicUsize = AtomicUsize::new(0);
struct File(PathBuf);
impl File {
    fn new() -> Self {
        Self(std::env::temp_dir().join(format!(
            "athena-history-{}-{}.sqlite",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        )))
    }
}
impl Drop for File {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.0);
    }
}
#[test]
fn explicit_history_migration_and_restore_preserve_original_revisions() {
    let f = File::new();
    let mut s = Store::create(&f.0).unwrap();
    assert!(s.revisions().is_err());
    s.save_backup(JS).unwrap();
    s.migrate_history().unwrap();
    s.migrate_history().unwrap();
    let old = s.revisions().unwrap()[0].id;
    assert_eq!(s.revisions().unwrap()[0].event, "baseline");
    let initial = s.load_backup().unwrap();
    s.save_backup(&JS.replace("Workspace 🌙", "New workspace"))
        .unwrap();
    assert_ne!(s.load_backup().unwrap(), initial);
    let restored = s.restore_revision(old).unwrap();
    assert!(restored > old);
    assert_eq!(s.load_backup().unwrap(), initial);
    let rows = s.revisions().unwrap();
    assert_eq!(rows[0].source_revision, Some(old));
    assert_eq!(rows[0].event, "restore");
    assert_eq!(rows[2].id, old);
    drop(s);
    assert_eq!(Store::open(&f.0).unwrap().summary().unwrap().schema, 3);
}
#[test]
fn bounded50_snapshots_and_missing_id_refusal() {
    let f = File::new();
    let mut s = Store::create(&f.0).unwrap();
    s.migrate_history().unwrap();
    for i in 0..55 {
        s.save_backup(&JS.replace("Workspace 🌙", &format!("Snapshot {i}")))
            .unwrap();
    }
    assert_eq!(s.revisions().unwrap().len(), 50);
    let active = s.load_backup().unwrap();
    assert!(s.restore_revision(1).is_err());
    assert!(s.restore_revision(-1).is_err());
    assert_eq!(s.load_backup().unwrap(), active);
}
#[test]
fn corrupt_revision_refuses_even_when_json_still_valid() {
    let f = File::new();
    let mut s = Store::create(&f.0).unwrap();
    s.migrate_history().unwrap();
    s.save_backup(JS).unwrap();
    let id = s.revisions().unwrap()[0].id;
    let active = s.load_backup().unwrap();
    drop(s);
    let db = Connection::open(&f.0).unwrap();
    db.execute(
        "UPDATE workspace_revisions SET json=?1 WHERE id=?2",
        rusqlite::params![JS.replace("Workspace 🌙", "Tampered"), id],
    )
    .unwrap();
    drop(db);
    let mut s = Store::open(&f.0).unwrap();
    assert!(s.restore_revision(id).is_err());
    assert_eq!(s.load_backup().unwrap(), active);
    assert_eq!(s.revisions().unwrap().len(), 1);
}
#[test]
fn migration_validation_failure_preserves_schema2() {
    let f = File::new();
    drop(Store::create(&f.0).unwrap());
    let db = Connection::open(&f.0).unwrap();
    db.execute("INSERT INTO workspace_backup VALUES(1,'{}')", [])
        .unwrap();
    drop(db);
    let mut s = Store::open(&f.0).unwrap();
    assert!(s.migrate_history().is_err());
    assert_eq!(s.summary().unwrap().schema, 2);
    drop(s);
    let db = Connection::open(&f.0).unwrap();
    assert_eq!(
        db.query_row(
            "SELECT count(*) FROM sqlite_master WHERE name='workspace_revisions'",
            [],
            |r| r.get::<_, i64>(0)
        )
        .unwrap(),
        0
    );
}
#[test]
fn failed_revision_insert_rolls_back_active_and_restore() {
    let f = File::new();
    let mut s = Store::create(&f.0).unwrap();
    s.migrate_history().unwrap();
    s.save_backup(JS).unwrap();
    let initial = s.load_backup().unwrap();
    let id = s.revisions().unwrap()[0].id;
    drop(s);
    let db = Connection::open(&f.0).unwrap();
    db.execute_batch("CREATE TRIGGER deny_revision BEFORE INSERT ON workspace_revisions BEGIN SELECT RAISE(ABORT,'injected failure'); END;").unwrap();
    drop(db);
    let mut s = Store::open(&f.0).unwrap();
    assert!(s.save_backup(&JS.replace("Workspace 🌙", "new")).is_err());
    assert!(s.restore_revision(id).is_err());
    assert_eq!(s.load_backup().unwrap(), initial);
    assert_eq!(s.revisions().unwrap().len(), 1);
}

#[test]
fn schema1_requires_explicit_separate_upgrades() {
    let f = File::new();
    drop(Store::create(&f.0).unwrap());
    let db = Connection::open(&f.0).unwrap();
    db.execute_batch("DROP TABLE workspace_backup; PRAGMA user_version=1;")
        .unwrap();
    drop(db);
    let mut s = Store::open(&f.0).unwrap();
    assert!(s.migrate_history().is_err());
    assert_eq!(s.summary().unwrap().schema, 1);
    s.migrate_backups().unwrap();
    assert_eq!(s.summary().unwrap().schema, 2);
    s.migrate_history().unwrap();
    assert_eq!(s.summary().unwrap().schema, 3);
    assert_eq!(s.summary().unwrap().objects, 85);
}

#[test]
fn soundtrack_upgrade_keeps_history_and_atomic_failure_guarantees() {
    let f = File::new();
    let mut s = Store::create(&f.0).unwrap();
    s.migrate_history().unwrap();
    s.save_backup(JS).unwrap();
    let first = s.revisions().unwrap()[0].id;
    s.migrate_soundtrack_metadata().unwrap();
    s.save_backup(&JS.replace("Workspace 🌙", "Schema four"))
        .unwrap();
    assert_eq!(s.revisions().unwrap().len(), 2);
    let last_good = s.load_backup().unwrap();
    drop(s);
    let db = Connection::open(&f.0).unwrap();
    db.execute_batch("CREATE TRIGGER refuse_history BEFORE INSERT ON workspace_revisions BEGIN SELECT RAISE(ABORT, 'synthetic failure'); END;").unwrap();
    drop(db);
    let mut s = Store::open(&f.0).unwrap();
    assert!(s.save_backup(JS).is_err());
    assert_eq!(s.load_backup().unwrap(), last_good);
    assert_eq!(s.revisions().unwrap().len(), 2);
    drop(s);
    let db = Connection::open(&f.0).unwrap();
    db.execute_batch("DROP TRIGGER refuse_history;").unwrap();
    drop(db);
    let mut s = Store::open(&f.0).unwrap();
    s.restore_revision(first).unwrap();
    assert_eq!(s.revisions().unwrap().len(), 3);
    assert_eq!(s.revisions().unwrap()[0].source_revision, Some(first));
}

#[test]
fn verified_revision_read_rejects_schema_missing_and_corruption() {
    let f = File::new();
    let mut s = Store::create(&f.0).unwrap();
    assert!(s.read_revision(1).is_err());
    s.migrate_history().unwrap();
    s.save_backup(JS).unwrap();
    let id = s.revisions().unwrap()[0].id;
    assert_eq!(
        s.read_revision(id).unwrap(),
        s.load_backup().unwrap().unwrap()
    );
    assert!(s.read_revision(0).is_err());
    assert!(s.read_revision(id + 100).is_err());
    let before = s.load_backup().unwrap();
    let raw = Connection::open(&f.0).unwrap();
    raw.execute(
        "UPDATE workspace_revisions SET sha256='corrupt' WHERE id=?1",
        [id],
    )
    .unwrap();
    assert!(s.read_revision(id).is_err());
    assert_eq!(s.load_backup().unwrap(), before);
}
