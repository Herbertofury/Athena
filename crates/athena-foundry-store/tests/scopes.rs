use athena_foundry_store::{Store, backup};
use serde_json::{Value, json};
use std::{
    process::Command,
    sync::atomic::{AtomicUsize, Ordering},
};
static NEXT: AtomicUsize = AtomicUsize::new(0);
fn value() -> Value {
    let mut v: Value = serde_json::from_str(include_str!("fixtures/js-workspace.json")).unwrap();
    v["version"] = json!(3);
    v["active"]["version"] = json!(3);
    for p in v["active"]["placements"]
        .as_object_mut()
        .unwrap()
        .values_mut()
    {
        p["rotation"] = json!(45);
        p["scaleX"] = json!(-2);
        p["scaleY"] = json!(0.5);
        p["scope"] = json!("sticker");
        p["anchor"] = json!("missing-panel");
    }
    v
}
#[test]
fn strict_scope_fields_and_null_contract() {
    let v = value();
    assert!(backup::normalize(&v.to_string()).is_ok());
    let id = v["active"]["placements"]
        .as_object()
        .unwrap()
        .keys()
        .next()
        .unwrap();
    for (field, bad) in [
        ("scope", json!(null)),
        ("scope", json!("global")),
        ("anchor", json!(null)),
        ("anchor", json!("../path")),
        ("anchor", json!("#private")),
        ("anchor", json!("")),
    ] {
        let mut badv = v.clone();
        badv["active"]["placements"][id][field] = bad;
        assert!(backup::normalize(&badv.to_string()).is_err());
    }
    for version in [1, 2] {
        let mut old = v.clone();
        old["active"]["version"] = json!(version);
        old["active"]["placements"][id]["scope"] = Value::Null;
        assert!(backup::normalize(&old.to_string()).is_err());
    }
    let mut ui = v.clone();
    for p in ui["active"]["placements"]
        .as_object_mut()
        .unwrap()
        .values_mut()
    {
        p["scope"] = json!("ui");
        p["anchor"] = Value::Null;
    }
    let normalized: Value =
        serde_json::from_str(&backup::normalize(&ui.to_string()).unwrap()).unwrap();
    assert!(
        normalized["active"]["placements"][id]
            .get("anchor")
            .unwrap()
            .is_null()
    );
    let mut missing = ui.clone();
    missing["active"]["placements"][id]
        .as_object_mut()
        .unwrap()
        .remove("anchor");
    assert!(backup::normalize(&missing.to_string()).is_err());
}
#[test]
fn explicit_scope_migration_history_and_old_writer_fence() {
    let path = std::env::temp_dir().join(format!(
        "scopes-{}-{}.db",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::SeqCst)
    ));
    let mut store = Store::create(&path).unwrap();
    store.migrate_history().unwrap();
    store.migrate_soundtrack_metadata().unwrap();
    store.migrate_transforms().unwrap();
    let v = value().to_string();
    let before = std::fs::read(&path).unwrap();
    assert!(store.save_backup(&v).is_err());
    assert_eq!(before, std::fs::read(&path).unwrap());
    store.migrate_scopes().unwrap();
    store.save_backup(&v).unwrap();
    let expected: Value = serde_json::from_str(&backup::normalize(&v).unwrap()).unwrap();
    assert_eq!(
        serde_json::from_str::<Value>(&store.load_backup().unwrap().unwrap()).unwrap(),
        expected
    );
    drop(store);
    let before = std::fs::read(&path).unwrap();
    for cmd in [
        "upgrade-backups",
        "upgrade-history",
        "upgrade-soundtracks",
        "upgrade-transforms",
        "upgrade-scopes",
    ] {
        let out = Command::new(env!("CARGO_BIN_EXE_athena-foundry-store"))
            .args([cmd, path.to_str().unwrap()])
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "{cmd}: {}",
            String::from_utf8_lossy(&out.stderr)
        );
        assert_eq!(
            serde_json::from_slice::<Value>(&out.stdout).unwrap()["schema"],
            6
        );
        assert_eq!(before, std::fs::read(&path).unwrap());
    }
    std::fs::remove_file(path).unwrap();
}

#[test]
#[ignore = "Requires explicitly supplied matching historical store binary"]
fn historical_binary_explicit_scope_migration_history_and_old_writer_fence() {
    let path = std::env::temp_dir().join(format!(
        "scopes-{}-{}.db",
        std::process::id(),
        NEXT.fetch_add(1, Ordering::SeqCst)
    ));
    let mut store = Store::create(&path).unwrap();
    store.migrate_history().unwrap();
    store.migrate_soundtrack_metadata().unwrap();
    store.migrate_transforms().unwrap();
    let v = value().to_string();
    let before = std::fs::read(&path).unwrap();
    assert!(store.save_backup(&v).is_err());
    assert_eq!(before, std::fs::read(&path).unwrap());
    store.migrate_scopes().unwrap();
    store.save_backup(&v).unwrap();
    let expected: Value = serde_json::from_str(&backup::normalize(&v).unwrap()).unwrap();
    assert_eq!(
        serde_json::from_str::<Value>(&store.load_backup().unwrap().unwrap()).unwrap(),
        expected
    );
    drop(store);
    let before = std::fs::read(&path).unwrap();
    for cmd in [
        "upgrade-backups",
        "upgrade-history",
        "upgrade-soundtracks",
        "upgrade-transforms",
        "upgrade-scopes",
    ] {
        let out = Command::new(env!("CARGO_BIN_EXE_athena-foundry-store"))
            .args([cmd, path.to_str().unwrap()])
            .output()
            .unwrap();
        assert!(
            out.status.success(),
            "{cmd}: {}",
            String::from_utf8_lossy(&out.stderr)
        );
        assert_eq!(
            serde_json::from_slice::<Value>(&out.stdout).unwrap()["schema"],
            6
        );
        assert_eq!(before, std::fs::read(&path).unwrap());
    }
    let old = Command::new(
        std::env::var("ATHENA_FOUNDRY_OLD_TRANSFORMS_BINARY")
            .expect("Set ATHENA_FOUNDRY_OLD_TRANSFORMS_BINARY to the matching historical binary"),
    )
    .args(["status", path.to_str().unwrap()])
    .output()
    .unwrap();
    assert!(!old.status.success());
    assert_eq!(before, std::fs::read(&path).unwrap());
    std::fs::remove_file(path).unwrap();
}
