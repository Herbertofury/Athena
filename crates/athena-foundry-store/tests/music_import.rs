use athena_foundry_store::{Store, music_import::MusicImport};
#[test]
fn imports_exact_metadata_and_refuses_occupied_rooms_atomically() {
    let path = std::env::temp_dir().join(format!(
        "music-import-{}-{}.sqlite3",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    let mut store = Store::create(&path).unwrap();
    store.migrate_history().unwrap();
    store.migrate_soundtrack_metadata().unwrap();
    let value = serde_json::json!({"version":1,"rows":[{"assignment":{"theme_id":"frutiger-aero","room_id":"frutiger-aero:room:aqua-atrium","provider":"youtube","url":"https://music.youtube.com/watch?v=abc","label":"Track","status":"USER_SEARCH_ROUTE","source_id":"local:1"},"updated_at":1672531200}]});
    let input: MusicImport = serde_json::from_value(value.clone()).unwrap();
    assert_eq!(store.import_music(&input).unwrap(), 1);
    let actual = store
        .soundtrack_native("frutiger-aero", "frutiger-aero:room:aqua-atrium")
        .unwrap()
        .unwrap();
    assert_eq!(actual.updated_at, Some(1672531200));
    assert_eq!(actual.assignment.source_id.as_deref(), Some("local:1"));
    assert!(store.import_music(&input).is_err());
    let mut invalid = value.clone();
    invalid["rows"][0]["assignment"]["url"] = "https://unapproved.invalid/".into();
    assert!(
        store
            .import_music(&serde_json::from_value(invalid).unwrap())
            .is_err()
    );
    let mut duplicate = value.clone();
    duplicate["rows"]
        .as_array_mut()
        .unwrap()
        .push(value["rows"][0].clone());
    assert!(
        store
            .import_music(&serde_json::from_value(duplicate).unwrap())
            .is_err()
    );
    let mut conflict = value.clone();
    let mut new_row = value["rows"][0].clone();
    new_row["assignment"]["room_id"] = "frutiger-aero:room:cloud-terminal".into();
    conflict["rows"].as_array_mut().unwrap().insert(0, new_row);
    assert!(
        store
            .import_music(&serde_json::from_value(conflict).unwrap())
            .is_err()
    );
    assert!(
        store
            .soundtrack_native("frutiger-aero", "frutiger-aero:room:cloud-terminal")
            .unwrap()
            .is_none()
    );
    assert_eq!(store.summary().unwrap().soundtracks, 1);
    drop(store);
    std::fs::remove_file(path).unwrap();
}
