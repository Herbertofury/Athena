use athena_foundry_store::{Store, backup};
use serde_json::{Value, json};
use std::process::Command;
fn value() -> Value {
    let mut v: Value = serde_json::from_str(include_str!("fixtures/js-workspace.json")).unwrap();
    v["version"] = json!(8);
    v["active"]["version"] = json!(8);
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
    v
}
#[test]
fn filters_strict_format() {
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
    let mut missing = v.clone();
    missing["active"]["placements"]["frutiger-aero:aqua-globe"]
        .as_object_mut()
        .unwrap()
        .remove("objectId");
    assert!(backup::normalize(&missing.to_string()).is_err());
    let mut old = v.clone();
    old["active"]["version"] = json!(5);
    old["active"]["placements"]["frutiger-aero:aqua-globe"]["objectId"] = Value::Null;
    assert!(backup::normalize(&old.to_string()).is_err());
    let mut deleted = v.clone();
    deleted["active"]["environment"]["targetId"] =
        json!("instance-01234567-89ab-cdef-0123-456789abcdef");
    deleted["active"]["placements"]
        .as_object_mut()
        .unwrap()
        .clear();
    assert!(backup::normalize(&deleted.to_string()).is_ok());
    let mut too_many = v.clone();
    let template = too_many["active"]["placements"]["frutiger-aero:aqua-globe"].clone();
    for i in 0..101 {
        too_many["active"]["placements"][format!("instance-00000000-0000-0000-0000-{i:012x}")] =
            template.clone();
    }
    assert!(backup::normalize(&too_many.to_string()).is_err());
    for (key, bad) in [
        ("opacity", json!(-0.1)),
        ("opacity", Value::Null),
        ("visible", Value::Null),
        ("visible", json!("false")),
        ("zIndex", json!(1.5)),
        ("zIndex", json!(100001)),
    ] {
        let mut b = v.clone();
        b["active"]["placements"]["frutiger-aero:aqua-globe"][key] = bad;
        assert!(backup::normalize(&b.to_string()).is_err());
    }
    let mut old = v.clone();
    old["active"]["version"] = json!(6);
    old["active"]["placements"]["frutiger-aero:aqua-globe"]["opacity"] = Value::Null;
    assert!(backup::normalize(&old.to_string()).is_err());
    for (key, lo, hi) in [
        ("skewX", -85., 85.),
        ("skewY", -85., 85.),
        ("brightness", 0., 2.5),
        ("contrast", 0., 2.5),
        ("saturation", 0., 2.5),
        ("hue", -180., 180.),
        ("blur", 0., 20.),
    ] {
        for bad in [
            Value::Null,
            json!(lo - 0.1),
            json!(hi + 0.1),
            json!("url(fixture)"),
        ] {
            let mut b = v.clone();
            b["active"]["placements"]["frutiger-aero:aqua-globe"][key] = bad;
            assert!(backup::normalize(&b.to_string()).is_err());
        }
        let mut old = v.clone();
        old["active"]["version"] = json!(7);
        old["active"]["placements"]["frutiger-aero:aqua-globe"][key] = Value::Null;
        assert!(backup::normalize(&old.to_string()).is_err());
    }
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
fn explicit_filter_upgrade_roundtrip_old_writer_and_actual_schema_reporting() {
    let path = std::env::temp_dir().join(format!("filters-{}.db", std::process::id()));
    let mut store = Store::create(&path).unwrap();
    store.migrate_history().unwrap();
    store.migrate_soundtrack_metadata().unwrap();
    store.migrate_transforms().unwrap();
    store.migrate_scopes().unwrap();
    store.migrate_environment().unwrap();
    store.migrate_targets().unwrap();
    store.migrate_instances().unwrap();
    store.migrate_appearance().unwrap();
    let v = value().to_string();
    let before = std::fs::read(&path).unwrap();
    assert!(store.save_backup(&v).is_err());
    assert_eq!(before, std::fs::read(&path).unwrap());
    store.migrate_filters().unwrap();
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
            11
        );
        assert_eq!(before, std::fs::read(&path).unwrap());
    }
    std::fs::remove_file(path).unwrap();
}

#[test]
#[ignore = "Requires explicitly supplied matching historical store binary"]
fn historical_binary_explicit_filter_upgrade_roundtrip_old_writer_and_actual_schema_reporting() {
    let path = std::env::temp_dir().join(format!("filters-{}.db", std::process::id()));
    let mut store = Store::create(&path).unwrap();
    store.migrate_history().unwrap();
    store.migrate_soundtrack_metadata().unwrap();
    store.migrate_transforms().unwrap();
    store.migrate_scopes().unwrap();
    store.migrate_environment().unwrap();
    store.migrate_targets().unwrap();
    store.migrate_instances().unwrap();
    store.migrate_appearance().unwrap();
    let v = value().to_string();
    let before = std::fs::read(&path).unwrap();
    assert!(store.save_backup(&v).is_err());
    assert_eq!(before, std::fs::read(&path).unwrap());
    store.migrate_filters().unwrap();
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
            11
        );
        assert_eq!(before, std::fs::read(&path).unwrap());
    }
    let old = Command::new(
        std::env::var("ATHENA_FOUNDRY_OLD_APPEARANCE_BINARY")
            .expect("Set ATHENA_FOUNDRY_OLD_APPEARANCE_BINARY to the matching historical binary"),
    )
    .args(["status", path.to_str().unwrap()])
    .output()
    .unwrap();
    assert!(!old.status.success());
    assert_eq!(before, std::fs::read(&path).unwrap());
    std::fs::remove_file(path).unwrap();
}
