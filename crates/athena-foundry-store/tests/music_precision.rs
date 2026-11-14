use athena_foundry_store::{Store, music_import::MusicImport};
use serde_json::json;
fn setup() -> (std::path::PathBuf, Store) {
    let p = std::env::temp_dir().join(format!(
        "music-precision-{}-{}.sqlite",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    let mut s = Store::create(&p).unwrap();
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
    s.migrate_blend_modes().unwrap();
    (p, s)
}
fn payload() -> serde_json::Value {
    json!({"version":2,"rows":[{"assignment":{"theme_id":"frutiger-aero","room_id":"frutiger-aero:room:aqua-atrium","provider":"youtube","url":"https://music.youtube.com/watch?v=abc","label":"Synthetic","status":"USER_ASSIGNED","source_id":"local:1"},"updated_at":1672531200,"updated_at_ms":1672531200123i64}]})
}
#[test]
fn precision_upgrade_import_validation_and_overwrite() {
    let (p, mut s) = setup();
    let input: MusicImport = serde_json::from_value(payload()).unwrap();
    let before = std::fs::read(&p).unwrap();
    assert!(s.import_music(&input).is_err());
    assert_eq!(std::fs::read(&p).unwrap(), before);
    s.migrate_music_precision().unwrap();
    let upgraded = std::fs::read(&p).unwrap();
    s.migrate_music_precision().unwrap();
    assert_eq!(std::fs::read(&p).unwrap(), upgraded);
    for bad in [json!(-1), json!(1672531201123i64), json!(i64::MAX)] {
        let mut v = payload();
        v["rows"][0]["updated_at_ms"] = bad;
        assert!(s.import_music(&serde_json::from_value(v).unwrap()).is_err());
        assert_eq!(std::fs::read(&p).unwrap(), upgraded);
    }
    s.import_music(&input).unwrap();
    let row = s
        .soundtrack_native("frutiger-aero", "frutiger-aero:room:aqua-atrium")
        .unwrap()
        .unwrap();
    assert_eq!(row.updated_at_ms, Some(1672531200123));
    assert_eq!(row.updated_at, Some(1672531200));
    let before = std::fs::read(&p).unwrap();
    let mut conflict = payload();
    let mut new = conflict["rows"][0].clone();
    new["assignment"]["room_id"] = "frutiger-aero:room:cloud-terminal".into();
    conflict["rows"].as_array_mut().unwrap().insert(0, new);
    assert!(
        s.import_music(&serde_json::from_value(conflict).unwrap())
            .is_err()
    );
    assert_eq!(std::fs::read(&p).unwrap(), before);
    let old = s
        .soundtrack_versioned("frutiger-aero", "frutiger-aero:room:aqua-atrium")
        .unwrap()
        .version;
    let db = rusqlite::Connection::open(&p).unwrap();
    db.execute("UPDATE soundtracks SET updated_at_ms=1672531200999", [])
        .unwrap();
    drop(db);
    let new = s
        .soundtrack_versioned("frutiger-aero", "frutiger-aero:room:aqua-atrium")
        .unwrap()
        .version;
    assert_ne!(old, new);
    let plain = athena_foundry_store::Soundtrack {
        theme_id: row.assignment.theme_id.clone(),
        room_id: row.assignment.room_id.clone(),
        provider: row.assignment.provider.clone(),
        url: row.assignment.url.clone(),
        label: "New local edit".into(),
    };
    assert!(s.compare_assign_soundtrack(&old, &plain).unwrap().is_none());
    let result = s
        .compare_assign_soundtrack(&new, &plain)
        .unwrap()
        .unwrap()
        .value
        .unwrap();
    assert_eq!(result.updated_at_ms, None);
    // Native and legacy entry points must clear stale imported precision too.
    for legacy in [false, true] {
        let db = rusqlite::Connection::open(&p).unwrap();
        db.execute(
            "UPDATE soundtracks SET updated_at_ms=updated_at*1000+123",
            [],
        )
        .unwrap();
        drop(db);
        if legacy {
            s.assign(&plain).unwrap();
        } else {
            s.assign_native(&row.assignment).unwrap();
        }
        assert_eq!(
            s.soundtrack_native(&plain.theme_id, &plain.room_id)
                .unwrap()
                .unwrap()
                .updated_at_ms,
            None
        );
    }
    drop(s);
    std::fs::remove_file(p).unwrap();
}
#[test]
fn upgrade_preserves_unknown_precision_and_old_import_contract() {
    let (p, mut s) = setup();
    let mut v = payload();
    v["version"] = 1.into();
    v["rows"][0]
        .as_object_mut()
        .unwrap()
        .remove("updated_at_ms");
    let i: MusicImport = serde_json::from_value(v).unwrap();
    s.import_music(&i).unwrap();
    let old = s
        .soundtrack_native("frutiger-aero", "frutiger-aero:room:aqua-atrium")
        .unwrap();
    s.migrate_music_precision().unwrap();
    assert_eq!(
        s.soundtrack_native("frutiger-aero", "frutiger-aero:room:aqua-atrium")
            .unwrap(),
        old
    );
    let mut malformed = payload();
    malformed["version"] = 1.into();
    assert!(
        s.import_music(&serde_json::from_value(malformed).unwrap())
            .is_err()
    );
    drop(s);
    std::fs::remove_file(p).unwrap();
}
