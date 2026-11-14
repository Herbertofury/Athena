use athena_foundry_store::{Store, backup, concurrency};
use rusqlite::Connection;
use serde_json::{Value, json};
use std::{
    path::PathBuf,
    sync::atomic::{AtomicUsize, Ordering},
};
const V1: &str = include_str!("fixtures/js-workspace.json");
static NEXT: AtomicUsize = AtomicUsize::new(0);
struct File(PathBuf);
impl File {
    fn new() -> Self {
        Self(std::env::temp_dir().join(format!(
            "athena-transforms-{}-{}.sqlite",
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
fn v2() -> Value {
    let mut v: Value = serde_json::from_str(V1).unwrap();
    v["version"] = json!(2);
    v["active"]["version"] = json!(2);
    for p in v["active"]["placements"]
        .as_object_mut()
        .unwrap()
        .values_mut()
    {
        p["rotation"] = json!(45);
        p["scaleX"] = json!(-2);
        p["scaleY"] = json!(0.5);
    }
    v
}
#[test]
fn v2_strict_bounds_and_version_contract() {
    let base = v2();
    assert!(backup::normalize(&base.to_string()).is_ok());
    for field in ["rotation", "scaleX", "scaleY"] {
        let mut v = base.clone();
        v["active"]["placements"]["frutiger-aero:aqua-globe"]
            .as_object_mut()
            .unwrap()
            .remove(field);
        assert!(backup::normalize(&v.to_string()).is_err())
    }
    for (field, value) in [
        ("rotation", json!(361)),
        ("scaleX", json!(0)),
        ("scaleY", json!(-8.1)),
        ("opacity", json!(0.5)),
    ] {
        let mut v = base.clone();
        v["active"]["placements"]["frutiger-aero:aqua-globe"][field] = value;
        assert!(backup::normalize(&v.to_string()).is_err())
    }
    let mut v = base.clone();
    v["version"] = json!(1);
    assert!(backup::normalize(&v.to_string()).is_err());
    let mut v: Value = serde_json::from_str(V1).unwrap();
    v["active"]["placements"]["frutiger-aero:aqua-globe"]["rotation"] = Value::Null;
    assert!(backup::normalize(&v.to_string()).is_err());
}
#[test]
fn explicit_schema5_preserves_v1_and_roundtrips_v2_history_cas() {
    let f = File::new();
    let mut s = Store::create(&f.0).unwrap();
    s.save_backup(V1).unwrap();
    assert!(s.save_backup(&v2().to_string()).is_err());
    s.migrate_history().unwrap();
    s.migrate_soundtrack_metadata().unwrap();
    let old = s.load_backup().unwrap().unwrap();
    let before = std::fs::read(&f.0).unwrap();
    assert!(
        s.compare_save_backup(&concurrency::version(Some(&old)), &v2().to_string())
            .is_err()
    );
    assert_eq!(std::fs::read(&f.0).unwrap(), before);
    s.migrate_transforms().unwrap();
    assert_eq!(s.summary().unwrap().schema, 5);
    assert_eq!(s.load_backup().unwrap().unwrap(), old);
    let encoded = backup::normalize(&v2().to_string()).unwrap();
    let version = s
        .compare_save_backup(&concurrency::version(Some(&old)), &encoded)
        .unwrap()
        .unwrap();
    assert_eq!(s.load_backup().unwrap().unwrap(), encoded);
    let id = s.revisions().unwrap()[0].id;
    s.save_backup(V1).unwrap();
    let active = s.load_backup().unwrap().unwrap();
    let restored = s
        .compare_restore_revision(&concurrency::version(Some(&active)), id)
        .unwrap()
        .unwrap();
    assert_eq!(restored.text, encoded);
    assert_eq!(restored.version, version);
    drop(s);
    assert_eq!(
        Store::open(&f.0).unwrap().load_backup().unwrap().unwrap(),
        encoded
    );
}
#[test]
fn corrupt_history_refuses_schema5_upgrade_without_mutation() {
    let f = File::new();
    let mut s = Store::create(&f.0).unwrap();
    s.save_backup(V1).unwrap();
    s.migrate_history().unwrap();
    s.migrate_soundtrack_metadata().unwrap();
    Connection::open(&f.0)
        .unwrap()
        .execute("UPDATE workspace_revisions SET sha256='bad'", [])
        .unwrap();
    let before = std::fs::read(&f.0).unwrap();
    assert!(s.migrate_transforms().is_err());
    assert_eq!(s.summary().unwrap().schema, 4);
    assert_eq!(std::fs::read(&f.0).unwrap(), before);
}
#[test]
#[ignore = "Requires explicitly supplied matching historical store binary"]
fn schema5_refuses_old_writer_preserving_exact_bytes() {
    let f = File::new();
    let mut s = Store::create(&f.0).unwrap();
    s.migrate_history().unwrap();
    s.migrate_soundtrack_metadata().unwrap();
    s.migrate_transforms().unwrap();
    s.save_backup(&v2().to_string()).unwrap();
    drop(s);
    let before = std::fs::read(&f.0).unwrap();
    let mut child = std::process::Command::new(
        std::env::var("ATHENA_FOUNDRY_OLD_PRIVATE_OUTPUT_BINARY").expect(
            "Set ATHENA_FOUNDRY_OLD_PRIVATE_OUTPUT_BINARY to the matching historical binary",
        ),
    )
    .arg("save-backup")
    .arg(&f.0)
    .stdin(std::process::Stdio::piped())
    .stdout(std::process::Stdio::piped())
    .stderr(std::process::Stdio::piped())
    .spawn()
    .unwrap();
    use std::io::Write;
    child
        .stdin
        .take()
        .unwrap()
        .write_all(V1.as_bytes())
        .unwrap();
    assert!(!child.wait_with_output().unwrap().status.success());
    assert_eq!(std::fs::read(&f.0).unwrap(), before);
}
