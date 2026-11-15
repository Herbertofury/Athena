use athena_foundry_store::{Store, import_legacy};
use std::{
    fs,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};
fn root(label: &str) -> PathBuf {
    let path = std::env::temp_dir().join(format!(
        "athena-family-{label}-{}-{}",
        std::process::id(),
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    fs::create_dir(&path).unwrap();
    path
}
fn member(path: &std::path::Path, suffix: &str) -> PathBuf {
    let mut name = path.as_os_str().to_os_string();
    name.push(suffix);
    PathBuf::from(name)
}
#[test]
fn create_refuses_existing_family_files_and_directories_without_changes() {
    for suffix in ["", "-wal", "-shm", "-journal"] {
        for directory in [false, true] {
            let root = root("existing");
            let target = root.join("new.sqlite");
            let occupied = member(&target, suffix);
            if directory {
                fs::create_dir(&occupied).unwrap();
            } else {
                fs::write(&occupied, b"synthetic recovery sentinel").unwrap();
            }
            assert!(Store::create(&target).is_err());
            assert!(occupied.exists());
            if !directory {
                assert_eq!(fs::read(&occupied).unwrap(), b"synthetic recovery sentinel");
            }
            if !suffix.is_empty() {
                assert!(!target.exists());
            }
            fs::remove_dir_all(root).unwrap();
        }
    }
}
#[cfg(unix)]
#[test]
fn create_refuses_dangling_family_symlinks() {
    use std::os::unix::fs::symlink;
    for suffix in ["", "-wal", "-shm", "-journal"] {
        let root = root("dangling");
        let target = root.join("new.sqlite");
        let occupied = member(&target, suffix);
        let missing = root.join("missing");
        symlink(&missing, &occupied).unwrap();
        assert!(Store::create(&target).is_err());
        assert_eq!(fs::read_link(&occupied).unwrap(), missing);
        assert!(!missing.exists());
        if !suffix.is_empty() {
            assert!(!target.exists());
        }
        fs::remove_dir_all(root).unwrap();
    }
}
#[test]
fn legacy_import_preserves_destination_recovery_state_and_source() {
    for suffix in ["-wal", "-shm", "-journal"] {
        let root = root("legacy");
        let source = root.join("source.sqlite");
        let db = rusqlite::Connection::open(&source).unwrap();
        db.execute_batch(include_str!("fixtures/legacy-schema.sql"))
            .unwrap();
        db.execute("INSERT INTO metadata VALUES('schema_version','1')", [])
            .unwrap();
        drop(db);
        let before = fs::read(&source).unwrap();
        let target = root.join("new.sqlite");
        let occupied = member(&target, suffix);
        fs::write(&occupied, b"synthetic recovery sentinel").unwrap();
        assert!(import_legacy(&source, &target).is_err());
        assert!(!target.exists());
        assert_eq!(fs::read(&occupied).unwrap(), b"synthetic recovery sentinel");
        assert_eq!(fs::read(&source).unwrap(), before);
        fs::remove_dir_all(root).unwrap();
    }
}
#[test]
fn clean_destination_still_initializes() {
    let root = root("clean");
    let target = root.join("new.sqlite");
    let store = Store::create(&target).unwrap();
    assert_eq!(store.summary().unwrap().integrity, "ok");
    drop(store);
    fs::remove_dir_all(root).unwrap();
}
