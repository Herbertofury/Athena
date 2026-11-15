use athena_foundry_store::Store;
const JS: &str = include_str!("fixtures/js-workspace.json");
#[test]
fn preview_is_revision_verified_read_only_and_current_versioned() {
    let p = std::env::temp_dir().join(format!(
        "revision-preview-{}-{}.sqlite",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    let mut s = Store::create(&p).unwrap();
    assert!(s.preview_revision(1).is_err());
    s.save_backup(JS).unwrap();
    s.migrate_history().unwrap();
    let old = s.revisions().unwrap()[0].id;
    assert!(s.preview_revision(old).unwrap().changes.is_empty());
    s.save_backup(
        &JS.replace("Workspace 🌙", "Changed")
            .replace("\"inspectorWidth\":320", "\"inspectorWidth\":300"),
    )
    .unwrap();
    let before = std::fs::read(&p).unwrap();
    let current = s.load_backup().unwrap();
    let count = s.revisions().unwrap().len();
    let preview = s.preview_revision(old).unwrap();
    assert!(!preview.restore_applied);
    assert_eq!(preview.target_revision, old);
    assert_eq!(
        preview
            .changes
            .iter()
            .map(|c| c.path.as_str())
            .collect::<Vec<_>>(),
        vec!["/savedLayouts", "/view/inspectorWidth"]
    );
    assert_eq!(
        preview.current_version,
        athena_foundry_store::concurrency::version(current.as_deref())
    );
    assert_eq!(s.load_backup().unwrap(), current);
    assert_eq!(s.revisions().unwrap().len(), count);
    assert_eq!(std::fs::read(&p).unwrap(), before);
    assert!(s.preview_revision(-1).is_err());
    assert!(s.preview_revision(999999).is_err());
    drop(s);
    let db = rusqlite::Connection::open(&p).unwrap();
    db.execute(
        "UPDATE workspace_revisions SET sha256='corrupt' WHERE id=?1",
        [old],
    )
    .unwrap();
    drop(db);
    let s = Store::open(&p).unwrap();
    let before = std::fs::read(&p).unwrap();
    assert!(s.preview_revision(old).is_err());
    assert_eq!(std::fs::read(&p).unwrap(), before);
    drop(s);
    std::fs::remove_file(p).unwrap();
}
