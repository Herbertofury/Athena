use athena_foundry_store::{Store, backup};
use serde_json::{Value, json};
const JS: &str = include_str!("fixtures/js-workspace.json");
fn fixture() -> Value {
    serde_json::from_str(JS).unwrap()
}
#[test]
fn actual_js_export_roundtrips() {
    assert_eq!(
        serde_json::from_str::<Value>(&backup::normalize(JS).unwrap()).unwrap(),
        fixture()
    );
}
#[test]
fn bad_backups_rejected() {
    let changes: Vec<(&str, Value)> = vec![
        ("/version", json!(11)),
        ("/active/themeId", json!("wrong")),
        ("/active/roomId", json!("wrong")),
        ("/active/time", json!("later")),
        ("/active/placements/frutiger-aero:aqua-globe/x", json!(1.1)),
        (
            "/active/placements/frutiger-aero:aqua-globe/pinned",
            json!("true"),
        ),
        ("/view/inspectorDock", json!("up")),
        ("/view/inspectorWidth", json!(179)),
        ("/view/inspectorWidth", json!(240.5)),
        ("/savedLayouts/0/name", json!(" padded ")),
    ];
    for (path, value) in changes {
        let mut v = fixture();
        *v.pointer_mut(path).unwrap() = value;
        assert!(backup::normalize(&v.to_string()).is_err(), "{path}");
    }
}
#[test]
fn rejects_unknown_fields_nested_and_top_level() {
    for pointer in [
        "",
        "/active",
        "/view",
        "/savedLayouts/0",
        "/active/placements/frutiger-aero:aqua-globe",
    ] {
        let mut v = fixture();
        v.pointer_mut(pointer)
            .unwrap()
            .as_object_mut()
            .unwrap()
            .insert("apiKey".into(), json!("never-store"));
        assert!(backup::normalize(&v.to_string()).is_err());
    }
}
#[test]
fn defaults_and_active_override_match_js() {
    let mut v = fixture();
    v.as_object_mut().unwrap().remove("view");
    v.as_object_mut().unwrap().remove("savedLayouts");
    v["layouts"] = json!({});
    let result: Value = serde_json::from_str(&backup::normalize(&v.to_string()).unwrap()).unwrap();
    assert_eq!(
        result["view"],
        json!({"inspectorDock":"right","inspectorWidth":240})
    );
    assert_eq!(result["savedLayouts"], json!([]));
    assert_eq!(
        result["layouts"]["frutiger-aero:room:aqua-atrium"],
        v["active"]
    );
}
#[test]
fn preset_count_duplicates_utf16_and_unknown_object_reject() {
    let mut v = fixture();
    v["savedLayouts"] = json!([v["savedLayouts"][0].clone(), v["savedLayouts"][0].clone()]);
    assert!(backup::normalize(&v.to_string()).is_err());
    let mut v = fixture();
    v["savedLayouts"][0]["name"] = json!("🌙".repeat(41));
    assert!(backup::normalize(&v.to_string()).is_err());
    let mut v = fixture();
    v["active"]["placements"]["wrong"] = json!({"x":0,"y":0,"pinned":false});
    assert!(backup::normalize(&v.to_string()).is_err());
    let mut v = fixture();
    v["savedLayouts"] = Value::Array(
        (0..21)
            .map(|i| json!({"name":i.to_string(),"layout":v["active"].clone()}))
            .collect(),
    );
    assert!(backup::normalize(&v.to_string()).is_err());
    assert!(backup::normalize(&" ".repeat(1_000_001)).is_err());
}
#[test]
fn real_store_preserves_last_good_and_reopens() {
    let p = std::env::temp_dir().join(format!("athena-backup-test-{}.sqlite", std::process::id()));
    let mut s = Store::create(&p).unwrap();
    assert!(s.load_backup().unwrap().is_none());
    s.save_backup(JS).unwrap();
    assert!(s.save_backup("{\"apiKey\":\"secret\"}").is_err());
    drop(s);
    let s = Store::open(&p).unwrap();
    assert_eq!(
        serde_json::from_str::<Value>(&s.load_backup().unwrap().unwrap()).unwrap(),
        fixture()
    );
    drop(s);
    std::fs::remove_file(p).unwrap();
}

#[test]
fn explicit_schema1_upgrade_and_failed_migration_rollback() {
    let p = std::env::temp_dir().join(format!(
        "athena-backup-migration-{}.sqlite",
        std::process::id()
    ));
    drop(Store::create(&p).unwrap());
    let db = rusqlite::Connection::open(&p).unwrap();
    db.execute_batch("DROP TABLE workspace_backup; PRAGMA user_version=1;")
        .unwrap();
    drop(db);
    let mut s = Store::open(&p).unwrap();
    assert_eq!(s.summary().unwrap().schema, 1);
    assert!(s.save_backup(JS).is_err());
    drop(s);
    // Simulate incompatible preexisting object: migration must not bump version on failure.
    let db = rusqlite::Connection::open(&p).unwrap();
    db.execute_batch("CREATE VIEW workspace_backup AS SELECT 1 AS singleton,'{}' AS json;")
        .unwrap();
    drop(db);
    let mut s = Store::open(&p).unwrap();
    assert!(s.migrate_backups().is_err());
    assert_eq!(s.summary().unwrap().schema, 1);
    drop(s);
    let db = rusqlite::Connection::open(&p).unwrap();
    db.execute_batch("DROP VIEW workspace_backup;").unwrap();
    drop(db);
    let mut s = Store::open(&p).unwrap();
    s.migrate_backups().unwrap();
    s.migrate_backups().unwrap();
    assert_eq!(s.summary().unwrap().schema, 2);
    assert_eq!(s.summary().unwrap().themes, 17);
    s.save_backup(JS).unwrap();
    drop(s);
    assert!(Store::open(&p).unwrap().load_backup().unwrap().is_some());
    std::fs::remove_file(p).unwrap();
}
