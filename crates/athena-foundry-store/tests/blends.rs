use athena_foundry_store::{Store, backup};
use serde_json::{Value, json};
const FIX: &str = include_str!("fixtures/js-blends.json");
fn ready(path: &std::path::Path) -> Store {
    let mut s = Store::create(path).unwrap();
    s.migrate_history().unwrap();
    s.migrate_soundtrack_metadata().unwrap();
    s.migrate_transforms().unwrap();
    s.migrate_scopes().unwrap();
    s.migrate_environment().unwrap();
    s.migrate_targets().unwrap();
    s.migrate_instances().unwrap();
    s.migrate_appearance().unwrap();
    s.migrate_filters().unwrap();
    s.migrate_origins().unwrap();
    s.migrate_environments().unwrap();
    s
}
#[test]
fn blends_fence_history_and_validation() {
    let path = std::env::temp_dir().join(format!("blend-{}.db", std::process::id()));
    let mut s = ready(&path);
    let mut v: Value = serde_json::from_str(FIX).unwrap();
    let id = v["active"]["placements"]
        .as_object()
        .unwrap()
        .keys()
        .next()
        .unwrap()
        .clone();
    assert!(
        s.save_backup(FIX)
            .unwrap_err()
            .to_string()
            .contains("upgrade-blend-modes")
    );
    assert_eq!(s.summary().unwrap().schema, 13);
    s.save_backup(include_str!("fixtures/js-workspace.json"))
        .unwrap();
    let old_backup = s.load_backup().unwrap();
    let old_revisions = serde_json::to_value(s.revisions().unwrap()).unwrap();
    s.migrate_blend_modes().unwrap();
    assert_eq!(s.load_backup().unwrap(), old_backup);
    assert_eq!(
        serde_json::to_value(s.revisions().unwrap()).unwrap(),
        old_revisions
    );
    assert_eq!(s.summary().unwrap().schema, 14);
    for mode in [
        "normal",
        "multiply",
        "screen",
        "overlay",
        "soft-light",
        "hard-light",
        "difference",
        "color-dodge",
        "luminosity",
    ] {
        v["active"]["placements"][&id]["blendMode"] = json!(mode);
        s.save_backup(&v.to_string()).unwrap();
        let loaded = s.load_backup().unwrap().unwrap();
        assert_eq!(
            serde_json::from_str::<Value>(&loaded).unwrap()["active"]["placements"][&id]["blendMode"],
            mode
        );
    }
    let good = s.load_backup().unwrap();
    for bad in [
        json!(null),
        json!("url(https://example.com)"),
        json!("inherit"),
        json!(5),
    ] {
        let mut b = v.clone();
        b["active"]["placements"][&id]["blendMode"] = bad;
        assert!(s.save_backup(&b.to_string()).is_err());
        assert_eq!(s.load_backup().unwrap(), good);
    }
    for version in 1..=10 {
        let mut b = v.clone();
        b["version"] = json!(version);
        b["active"]["version"] = json!(version);
        assert!(backup::normalize(&b.to_string()).is_err());
    }
    let mut b = v.clone();
    b["active"]["placements"][&id]
        .as_object_mut()
        .unwrap()
        .remove("blendMode");
    assert!(backup::normalize(&b.to_string()).is_err());
    drop(s);
    let before = std::fs::read(&path).unwrap();
    Store::open(&path).unwrap().migrate_blend_modes().unwrap();
    assert_eq!(std::fs::read(&path).unwrap(), before);
    std::fs::remove_file(path).unwrap();
}
#[test]
fn blend_upgrade_refuses_corrupt_active_and_history() {
    let path = std::env::temp_dir().join(format!("blend-corrupt-{}.db", std::process::id()));
    let mut s = ready(&path);
    let db = rusqlite::Connection::open(&path).unwrap();
    db.execute(
        "INSERT INTO workspace_backup(singleton,json) VALUES(1,'{}')",
        [],
    )
    .unwrap();
    assert!(s.migrate_blend_modes().is_err());
    assert_eq!(s.summary().unwrap().schema, 13);
    db.execute("DELETE FROM workspace_backup", []).unwrap();
    s.save_backup(include_str!("fixtures/js-workspace.json"))
        .unwrap();
    db.execute("UPDATE workspace_revisions SET sha256='broken'", [])
        .unwrap();
    let before = std::fs::read(&path).unwrap();
    assert!(s.migrate_blend_modes().is_err());
    assert_eq!(std::fs::read(&path).unwrap(), before);
    drop(db);
    drop(s);
    std::fs::remove_file(path).unwrap();
}
