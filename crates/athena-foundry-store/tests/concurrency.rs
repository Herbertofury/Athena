use athena_foundry_store::{Store, concurrency::version};
use std::sync::{Arc, Barrier};
const FIX: &str = include_str!("fixtures/js-workspace.json");
#[test]
fn competing_connections_only_one_wins_and_history_is_atomic() {
    let p = std::env::temp_dir().join(format!("foundry-cas-{}.sqlite", std::process::id()));
    let mut s = Store::create(&p).unwrap();
    s.migrate_history().unwrap();
    s.migrate_soundtrack_metadata().unwrap();
    let gate = Arc::new(Barrier::new(3));
    let mut handles = vec![];
    for name in ["WriterA", "WriterB"] {
        let p = p.clone();
        let gate = gate.clone();
        handles.push(std::thread::spawn(move || {
            let mut s = Store::open(&p).unwrap();
            let input = FIX.replace("Workspace 🌙", name);
            gate.wait();
            s.compare_save_backup("\"empty\"", &input)
                .ok()
                .flatten()
                .is_some()
        }));
    }
    gate.wait();
    let count = handles
        .into_iter()
        .filter(|h| h.thread().id() != std::thread::current().id())
        .map(|h| usize::from(h.join().unwrap()))
        .sum::<usize>();
    assert_eq!(count, 1);
    assert_eq!(s.revisions().unwrap().len(), 1);
    let good = s.load_backup().unwrap().unwrap();
    assert!(s.compare_save_backup("\"empty\"", FIX).unwrap().is_none());
    assert_eq!(s.load_backup().unwrap().unwrap(), good);
    assert_eq!(s.revisions().unwrap().len(), 1);
    assert!(s.compare_save_backup(&version(Some(&good)), "{}").is_err());
    assert_eq!(s.revisions().unwrap().len(), 1);
    assert!(
        s.compare_save_backup(&version(Some(&good)), FIX)
            .unwrap()
            .is_some()
    );
    assert_eq!(s.revisions().unwrap().len(), 2);
    drop(s);
    std::fs::remove_file(p).unwrap();
}

#[test]
fn schema_two_three_and_write_failure_preserve_last_good() {
    let p = std::env::temp_dir().join(format!("foundry-cas-compat-{}.sqlite", std::process::id()));
    let mut s = Store::create(&p).unwrap();
    assert!(s.compare_save_backup("\"empty\"", FIX).unwrap().is_some());
    let good = s.load_backup().unwrap().unwrap();
    s.migrate_history().unwrap();
    let next = FIX.replace("Workspace 🌙", "SchemaThree");
    assert!(
        s.compare_save_backup(&version(Some(&good)), &next)
            .unwrap()
            .is_some()
    );
    let good = s.load_backup().unwrap().unwrap();
    let revisions = s.revisions().unwrap().len();
    let raw = rusqlite::Connection::open(&p).unwrap();
    raw.execute_batch("CREATE TRIGGER reject_revision BEFORE INSERT ON workspace_revisions BEGIN SELECT RAISE(ABORT,'injected failure'); END;").unwrap();
    assert!(s.compare_save_backup(&version(Some(&good)), FIX).is_err());
    assert_eq!(s.load_backup().unwrap().unwrap(), good);
    assert_eq!(s.revisions().unwrap().len(), revisions);
    drop(raw);
    drop(s);
    std::fs::remove_file(p).unwrap();
}

#[test]
fn compare_restore_preserves_lineage_conflicts_and_rollback() {
    let p = std::env::temp_dir().join(format!("foundry-lineage-{}.sqlite", std::process::id()));
    let mut s = Store::create(&p).unwrap();
    assert!(s.compare_restore_revision("\"empty\"", 1).is_err());
    s.migrate_history().unwrap();
    s.migrate_soundtrack_metadata().unwrap();
    s.save_backup(FIX).unwrap();
    let source = s.revisions().unwrap()[0].id;
    s.save_backup(&FIX.replace("Workspace 🌙", "Newer"))
        .unwrap();
    let active = s.load_backup().unwrap().unwrap();
    let token = version(Some(&active));
    let count = s.revisions().unwrap().len();
    assert!(
        s.compare_restore_revision("\"empty\"", source)
            .unwrap()
            .is_none()
    );
    assert_eq!(s.revisions().unwrap().len(), count);
    assert!(s.compare_restore_revision(&token, 999).is_err());
    assert_eq!(s.load_backup().unwrap().unwrap(), active);
    let raw = rusqlite::Connection::open(&p).unwrap();
    let digest: String = raw
        .query_row(
            "SELECT sha256 FROM workspace_revisions WHERE id=?1",
            [source],
            |r| r.get(0),
        )
        .unwrap();
    raw.execute(
        "UPDATE workspace_revisions SET sha256='corrupt' WHERE id=?1",
        [source],
    )
    .unwrap();
    assert!(s.compare_restore_revision(&token, source).is_err());
    assert_eq!(s.load_backup().unwrap().unwrap(), active);
    assert_eq!(s.revisions().unwrap().len(), count);
    raw.execute(
        "UPDATE workspace_revisions SET sha256=?1 WHERE id=?2",
        rusqlite::params![digest, source],
    )
    .unwrap();
    raw.execute_batch("CREATE TRIGGER fail_restore BEFORE INSERT ON workspace_revisions BEGIN SELECT RAISE(ABORT,'injected failure'); END;").unwrap();
    assert!(s.compare_restore_revision(&token, source).is_err());
    assert_eq!(s.load_backup().unwrap().unwrap(), active);
    assert_eq!(s.revisions().unwrap().len(), count);
    raw.execute_batch("DROP TRIGGER fail_restore").unwrap();
    let result = s.compare_restore_revision(&token, source).unwrap().unwrap();
    assert_eq!(result.text, s.read_revision(source).unwrap());
    assert_eq!(result.version, version(Some(&result.text)));
    let latest = &s.revisions().unwrap()[0];
    assert_eq!(latest.id, result.revision);
    assert_eq!(latest.event, "restore");
    assert_eq!(latest.source_revision, Some(source));
    drop(raw);
    drop(s);
    std::fs::remove_file(p).unwrap();
}
