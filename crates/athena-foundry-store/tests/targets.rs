use athena_foundry_store::{Store, backup};
use serde_json::{Value, json};
use std::process::Command;
fn value() -> Value {
    let mut v: Value = serde_json::from_str(include_str!("fixtures/js-workspace.json")).unwrap();
    v["version"] = json!(5);
    v["active"]["version"] = json!(5);
    v["active"]["environment"] = json!({"preset":"vapor","opacity":0.4,"horizon":0.6,"target":"object","targetId":"frutiger-aero:aqua-globe"});
    for p in v["active"]["placements"]
        .as_object_mut()
        .unwrap()
        .values_mut()
    {
        p["rotation"] = json!(45);
        p["scaleX"] = json!(-2);
        p["scaleY"] = json!(0.5);
        p["scope"] = json!("world");
        p["anchor"] = Value::Null;
    }
    v
}
#[test]
fn targets_strict_format() {
    let v = value();
    assert!(backup::normalize(&v.to_string()).is_ok());
    for (key, bad) in [
        ("preset", json!("media")),
        ("opacity", json!(2)),
        ("horizon", json!(0)),
        ("privateUrl", json!("fixture")),
    ] {
        let mut b = v.clone();
        b["active"]["environment"][key] = bad;
        assert!(backup::normalize(&b.to_string()).is_err());
    }
    for (key, bad) in [
        ("target", json!(null)),
        ("target", json!("global")),
        ("targetId", json!(null)),
        ("targetId", json!("../../file")),
        ("targetId", json!("other-theme:object")),
    ] {
        let mut b = v.clone();
        b["active"]["environment"][key] = bad;
        assert!(backup::normalize(&b.to_string()).is_err());
    }
    let mut old = v.clone();
    old["active"]["version"] = json!(4);
    old["active"]["environment"]["target"] = Value::Null;
    assert!(backup::normalize(&old.to_string()).is_err());
    let mut room = v.clone();
    room["active"]["environment"]["target"] = json!("room");
    room["active"]["environment"]["targetId"] = Value::Null;
    assert!(
        backup::normalize(&room.to_string())
            .unwrap()
            .contains("\"targetId\":null")
    );
    for version in 1..=3 {
        let mut b = v.clone();
        b["active"]["version"] = json!(version);
        b["active"]["environment"] = Value::Null;
        assert!(backup::normalize(&b.to_string()).is_err());
    }
    let mut b = v.clone();
    b["active"].as_object_mut().unwrap().remove("environment");
    assert!(backup::normalize(&b.to_string()).is_err());
}
#[test]
fn explicit_target_upgrade_roundtrip_old_writer_and_actual_schema_reporting() {
    let path = std::env::temp_dir().join(format!("targets-{}.db", std::process::id()));
    let mut store = Store::create(&path).unwrap();
    store.migrate_history().unwrap();
    store.migrate_soundtrack_metadata().unwrap();
    store.migrate_transforms().unwrap();
    store.migrate_scopes().unwrap();
    store.migrate_environment().unwrap();
    let v = value().to_string();
    let before = std::fs::read(&path).unwrap();
    assert!(store.save_backup(&v).is_err());
    assert_eq!(before, std::fs::read(&path).unwrap());
    store.migrate_targets().unwrap();
    store.save_backup(&v).unwrap();
    assert_eq!(
        serde_json::from_str::<Value>(&store.load_backup().unwrap().unwrap()).unwrap(),
        serde_json::from_str::<Value>(&backup::normalize(&v).unwrap()).unwrap()
    );
    drop(store);
    let before = std::fs::read(&path).unwrap();
    for cmd in [
        "upgrade-backups",
        "upgrade-history",
        "upgrade-soundtracks",
        "upgrade-transforms",
        "upgrade-scopes",
        "upgrade-environment",
        "upgrade-targets",
    ] {
        let out = Command::new(env!("CARGO_BIN_EXE_athena-foundry-store"))
            .args([cmd, path.to_str().unwrap()])
            .output()
            .unwrap();
        assert!(out.status.success());
        assert_eq!(
            serde_json::from_slice::<Value>(&out.stdout).unwrap()["schema"],
            8
        );
        assert_eq!(before, std::fs::read(&path).unwrap());
    }
    std::fs::remove_file(path).unwrap();
}

#[test]
#[ignore = "Requires explicitly supplied matching historical store binary"]
fn historical_binary_explicit_target_upgrade_roundtrip_old_writer_and_actual_schema_reporting() {
    let path = std::env::temp_dir().join(format!("targets-{}.db", std::process::id()));
    let mut store = Store::create(&path).unwrap();
    store.migrate_history().unwrap();
    store.migrate_soundtrack_metadata().unwrap();
    store.migrate_transforms().unwrap();
    store.migrate_scopes().unwrap();
    store.migrate_environment().unwrap();
    let v = value().to_string();
    let before = std::fs::read(&path).unwrap();
    assert!(store.save_backup(&v).is_err());
    assert_eq!(before, std::fs::read(&path).unwrap());
    store.migrate_targets().unwrap();
    store.save_backup(&v).unwrap();
    assert_eq!(
        serde_json::from_str::<Value>(&store.load_backup().unwrap().unwrap()).unwrap(),
        serde_json::from_str::<Value>(&backup::normalize(&v).unwrap()).unwrap()
    );
    drop(store);
    let before = std::fs::read(&path).unwrap();
    for cmd in [
        "upgrade-backups",
        "upgrade-history",
        "upgrade-soundtracks",
        "upgrade-transforms",
        "upgrade-scopes",
        "upgrade-environment",
        "upgrade-targets",
    ] {
        let out = Command::new(env!("CARGO_BIN_EXE_athena-foundry-store"))
            .args([cmd, path.to_str().unwrap()])
            .output()
            .unwrap();
        assert!(out.status.success());
        assert_eq!(
            serde_json::from_slice::<Value>(&out.stdout).unwrap()["schema"],
            8
        );
        assert_eq!(before, std::fs::read(&path).unwrap());
    }
    let old = Command::new(
        std::env::var("ATHENA_FOUNDRY_OLD_ENVIRONMENT_BINARY")
            .expect("Set ATHENA_FOUNDRY_OLD_ENVIRONMENT_BINARY to the matching historical binary"),
    )
    .args(["status", path.to_str().unwrap()])
    .output()
    .unwrap();
    assert!(!old.status.success());
    assert_eq!(before, std::fs::read(&path).unwrap());
    std::fs::remove_file(path).unwrap();
}
