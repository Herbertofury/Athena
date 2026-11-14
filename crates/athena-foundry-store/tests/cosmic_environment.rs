use athena_foundry_store::{Store, backup};
use serde_json::json;
#[test]
fn cosmic_environment_fence_roundtrip_and_old_format_rejection() {
    let path = std::env::temp_dir().join(format!(
        "cosmic-env-{}-{}.sqlite3",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
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
    store.migrate_origins().unwrap();
    store.migrate_environments().unwrap();
    store.migrate_blend_modes().unwrap();
    store.migrate_music_precision().unwrap();
    let mut v = json!({"version":12,"active":{"version":12,"themeId":"frutiger-aero","roomId":"frutiger-aero:room:aqua-atrium","time":"day","placements":{},"environment":{"preset":"cosmic","opacity":0.82,"horizon":0.48,"target":"room","targetId":null}},"layouts":{},"view":{"inspectorDock":"right","inspectorWidth":240},"savedLayouts":[]});
    assert!(store.save_backup(&v.to_string()).is_err());
    assert_eq!(store.summary().unwrap().schema, 15);
    {
        let db = rusqlite::Connection::open(&path).unwrap();
        db.execute(
            "INSERT INTO workspace_backup(singleton,json) VALUES(1,'{}')",
            [],
        )
        .unwrap();
        assert!(store.migrate_cosmic_environment().is_err());
        assert_eq!(store.summary().unwrap().schema, 15);
        let retained: String = db
            .query_row("SELECT json FROM workspace_backup", [], |r| r.get(0))
            .unwrap();
        assert_eq!(retained, "{}");
        db.execute("DELETE FROM workspace_backup WHERE singleton=1", [])
            .unwrap();
    }
    store.migrate_cosmic_environment().unwrap();
    assert_eq!(store.summary().unwrap().schema, 16);
    {
        let preset = "cosmic";
        v["active"]["environment"]["preset"] = json!(preset);
        store.save_backup(&v.to_string()).unwrap();
        assert_eq!(
            serde_json::from_str::<serde_json::Value>(&store.load_backup().unwrap().unwrap())
                .unwrap(),
            serde_json::from_str::<serde_json::Value>(&backup::normalize(&v.to_string()).unwrap())
                .unwrap()
        );
        let mut old = v.clone();
        old["version"] = json!(11);
        old["active"]["version"] = json!(11);
        assert!(backup::normalize(&old.to_string()).is_err());
    }
    drop(store);
    assert_eq!(Store::open(&path).unwrap().summary().unwrap().schema, 16);
    std::fs::remove_file(path).unwrap();
}
