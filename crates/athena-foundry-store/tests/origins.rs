use athena_foundry_store::{Store, backup};
use serde_json::{Value, json};
use std::process::Command;
fn value() -> Value {
    let mut v: Value = serde_json::from_str(include_str!("fixtures/js-workspace.json")).unwrap();
    v["version"] = json!(9);
    v["active"]["version"] = json!(9);
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
    for (id, p) in v["active"]["placements"].as_object_mut().unwrap() {
        p["objectId"] = json!(id);
    }
    let copy = v["active"]["placements"]["frutiger-aero:aqua-globe"].clone();
    v["active"]["placements"]["instance-01234567-89ab-cdef-0123-456789abcdef"] = copy;
    for p in v["active"]["placements"]
        .as_object_mut()
        .unwrap()
        .values_mut()
    {
        p["opacity"] = json!(0.4);
        p["visible"] = json!(false);
        p["zIndex"] = json!(7);
    }
    for p in v["active"]["placements"]
        .as_object_mut()
        .unwrap()
        .values_mut()
    {
        for (key, n) in [
            ("skewX", 15.),
            ("skewY", -10.),
            ("brightness", 1.2),
            ("contrast", 0.8),
            ("saturation", 1.4),
            ("hue", 25.),
            ("blur", 2.),
        ] {
            p[key] = json!(n);
        }
    }
    for p in v["active"]["placements"]
        .as_object_mut()
        .unwrap()
        .values_mut()
    {
        p["transformOrigin"] = json!("br");
    }
    v
}
#[test]
fn explicit_origin_upgrade_roundtrip_old_writer_and_actual_schema_reporting() {
    let path = std::env::temp_dir().join(format!("origins-{}.db", std::process::id()));
    let mut store = Store::create(&path).unwrap();
    store.migrate_history().unwrap();
    store.migrate_soundtrack_metadata().unwrap();
    store.migrate_transforms().unwrap();
    store.migrate_scopes().unwrap();
    store.migrate_environment().unwrap();
    store.migrate_targets().unwrap();
    store.migrate_instances().unwrap();
    store.migrate_appearance().unwrap();
    store.migrate_filters().unwrap();
    let v = value().to_string();
    let before = std::fs::read(&path).unwrap();
    assert!(store.save_backup(&v).is_err());
    assert_eq!(before, std::fs::read(&path).unwrap());
    store.migrate_origins().unwrap();
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
        "upgrade-instances",
        "upgrade-appearance",
        "upgrade-filters",
    ] {
        let out = Command::new(env!("CARGO_BIN_EXE_athena-foundry-store"))
            .args([cmd, path.to_str().unwrap()])
            .output()
            .unwrap();
        assert!(out.status.success());
        assert_eq!(
            serde_json::from_slice::<Value>(&out.stdout).unwrap()["schema"],
            12
        );
        assert_eq!(before, std::fs::read(&path).unwrap());
    }
    std::fs::remove_file(path).unwrap();
}

#[test]
#[ignore = "Requires explicitly supplied matching historical store binary"]
fn historical_binary_explicit_origin_upgrade_roundtrip_old_writer_and_actual_schema_reporting() {
    let path = std::env::temp_dir().join(format!("origins-{}.db", std::process::id()));
    let mut store = Store::create(&path).unwrap();
    store.migrate_history().unwrap();
    store.migrate_soundtrack_metadata().unwrap();
    store.migrate_transforms().unwrap();
    store.migrate_scopes().unwrap();
    store.migrate_environment().unwrap();
    store.migrate_targets().unwrap();
    store.migrate_instances().unwrap();
    store.migrate_appearance().unwrap();
    store.migrate_filters().unwrap();
    let v = value().to_string();
    let before = std::fs::read(&path).unwrap();
    assert!(store.save_backup(&v).is_err());
    assert_eq!(before, std::fs::read(&path).unwrap());
    store.migrate_origins().unwrap();
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
        "upgrade-instances",
        "upgrade-appearance",
        "upgrade-filters",
    ] {
        let out = Command::new(env!("CARGO_BIN_EXE_athena-foundry-store"))
            .args([cmd, path.to_str().unwrap()])
            .output()
            .unwrap();
        assert!(out.status.success());
        assert_eq!(
            serde_json::from_slice::<Value>(&out.stdout).unwrap()["schema"],
            12
        );
        assert_eq!(before, std::fs::read(&path).unwrap());
    }
    let old = Command::new(
        std::env::var("ATHENA_FOUNDRY_OLD_FILTERS_BINARY")
            .expect("Set ATHENA_FOUNDRY_OLD_FILTERS_BINARY to the matching historical binary"),
    )
    .args(["status", path.to_str().unwrap()])
    .output()
    .unwrap();
    assert!(!old.status.success());
    assert_eq!(before, std::fs::read(&path).unwrap());
    std::fs::remove_file(path).unwrap();
}

#[test]
fn origins_strict() {
    let v = value();
    for origin in ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"] {
        let mut b = v.clone();
        for p in b["active"]["placements"]
            .as_object_mut()
            .unwrap()
            .values_mut()
        {
            p["transformOrigin"] = json!(origin);
        }
        assert!(backup::normalize(&b.to_string()).is_ok());
    }
    for invalid in [json!(null), json!("center"), json!("url(x)")] {
        let mut b = v.clone();
        for p in b["active"]["placements"]
            .as_object_mut()
            .unwrap()
            .values_mut()
        {
            p["transformOrigin"] = invalid.clone();
        }
        assert!(backup::normalize(&b.to_string()).is_err());
    }
    let mut old = v;
    old["version"] = json!(8);
    old["active"]["version"] = json!(8);
    assert!(backup::normalize(&old.to_string()).is_err());
}
