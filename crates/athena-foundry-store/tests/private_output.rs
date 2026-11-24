#![cfg(unix)]
use athena_foundry_store::Store;
use std::{fs, os::unix::fs::PermissionsExt, process::Command};
#[test]
fn newly_created_and_imported_stores_are_private_under_permissive_umask() {
    let root = std::env::temp_dir().join(format!("foundry-private-output-{}", std::process::id()));
    fs::create_dir(&root).unwrap();
    let new = root.join("new.sqlite");
    let binary = env!("CARGO_BIN_EXE_athena-foundry-store");
    let status = Command::new("sh")
        .args(["-c", "umask 022; exec \"$1\" init \"$2\"", "test"])
        .arg(binary)
        .arg(&new)
        .output()
        .unwrap();
    assert!(status.status.success());
    assert_eq!(
        fs::metadata(&new).unwrap().permissions().mode() & 0o777,
        0o600
    );
    let source = root.join("source.sqlite");
    let db = rusqlite::Connection::open(&source).unwrap();
    db.execute_batch(include_str!("fixtures/legacy-schema.sql"))
        .unwrap();
    db.execute("INSERT INTO metadata VALUES('schema_version','1')", [])
        .unwrap();
    drop(db);
    let before = fs::read(&source).unwrap();
    let permissions = fs::metadata(&source).unwrap().permissions().mode();
    let imported = root.join("imported.sqlite");
    let status = Command::new("sh")
        .args([
            "-c",
            "umask 022; exec \"$1\" import-legacy \"$2\" \"$3\"",
            "test",
        ])
        .arg(binary)
        .arg(&source)
        .arg(&imported)
        .output()
        .unwrap();
    assert!(
        status.status.success(),
        "{}",
        String::from_utf8_lossy(&status.stderr)
    );
    assert_eq!(
        fs::metadata(&imported).unwrap().permissions().mode() & 0o777,
        0o600
    );
    assert_eq!(fs::read(&source).unwrap(), before);
    assert_eq!(
        fs::metadata(&source).unwrap().permissions().mode(),
        permissions
    );
    fs::set_permissions(&new, fs::Permissions::from_mode(0o640)).unwrap();
    let existing = fs::read(&new).unwrap();
    assert!(Store::create(&new).is_err());
    assert_eq!(
        fs::metadata(&new).unwrap().permissions().mode() & 0o777,
        0o640
    );
    assert_eq!(fs::read(&new).unwrap(), existing);
    fs::remove_dir_all(root).unwrap();
}
