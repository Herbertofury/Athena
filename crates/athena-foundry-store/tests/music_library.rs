use athena_foundry_store::{Store, music_import::MusicImport};
static NEXT_PATH: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);
fn path() -> std::path::PathBuf {
    path_at(
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos(),
    )
}
fn path_at(timestamp: u128) -> std::path::PathBuf {
    std::env::temp_dir().join(format!(
        "music-library-{}-{}-{}.sqlite",
        std::process::id(),
        timestamp,
        NEXT_PATH.fetch_add(1, std::sync::atomic::Ordering::Relaxed)
    ))
}
#[test]
fn library_is_complete_ordered_validated_and_read_only() {
    let p = path();
    let mut store = Store::create(&p).unwrap();
    assert!(store.soundtrack_library().is_err());
    store.migrate_history().unwrap();
    store.migrate_soundtrack_metadata().unwrap();
    assert!(store.soundtrack_library().unwrap().is_empty());
    let rooms = [
        "frutiger-aero:room:cloud-terminal",
        "frutiger-aero:room:aqua-atrium",
    ];
    let rows:Vec<_>=rooms.iter().map(|room|serde_json::json!({"assignment":{"theme_id":"frutiger-aero","room_id":room,"provider":"youtube","url":"https://music.youtube.com/watch?v=synthetic","label":"音楽 🦉","status":"USER_ASSIGNED","source_id":"local:synthetic"},"updated_at":1672531200})).collect();
    let input: MusicImport =
        serde_json::from_value(serde_json::json!({"version":1,"rows":rows})).unwrap();
    store.import_music(&input).unwrap();
    let before = std::fs::read(&p).unwrap();
    let values = store.soundtrack_library().unwrap();
    assert_eq!(values.len(), 2);
    assert_eq!(
        values[0].value.as_ref().unwrap().assignment.room_id,
        rooms[1]
    );
    for value in &values {
        let record = value.value.as_ref().unwrap();
        let single = store
            .soundtrack_versioned(&record.assignment.theme_id, &record.assignment.room_id)
            .unwrap();
        assert_eq!(
            serde_json::to_value(value).unwrap(),
            serde_json::to_value(single).unwrap()
        );
        assert_eq!(record.updated_at_ms, None);
    }
    assert_eq!(std::fs::read(&p).unwrap(), before);
    drop(store);
    let reopened = Store::open(&p).unwrap();
    assert_eq!(
        serde_json::to_value(reopened.soundtrack_library().unwrap()).unwrap(),
        serde_json::to_value(values).unwrap()
    );
    drop(reopened);
    let db = rusqlite::Connection::open(&p).unwrap();
    db.execute(
        "UPDATE soundtracks SET url='https://invalid.example/' WHERE room_id=?1",
        [rooms[0]],
    )
    .unwrap();
    drop(db);
    let store = Store::open(&p).unwrap();
    assert!(store.soundtrack_library().is_err());
    drop(store);
    std::fs::remove_file(p).unwrap();
}
#[test]
fn oversized_library_refuses_instead_of_truncating() {
    let p = path();
    let mut store = Store::create(&p).unwrap();
    store.migrate_history().unwrap();
    store.migrate_soundtrack_metadata().unwrap();
    drop(store);
    let mut db = rusqlite::Connection::open(&p).unwrap();
    let tx = db.transaction().unwrap();
    for n in 0..1001 {
        tx.execute(
            "INSERT INTO rooms(theme_id,id,name) VALUES('frutiger-aero',?1,'synthetic')",
            [format!("synthetic-{n}")],
        )
        .unwrap();
        tx.execute("INSERT INTO soundtracks(theme_id,room_id,provider,url,label,status,source_id,updated_at) VALUES('frutiger-aero',?1,'youtube','https://music.youtube.com/watch?v=synthetic','fixture','USER_ASSIGNED',NULL,1672531200)",[format!("synthetic-{n}")]).unwrap();
    }
    tx.commit().unwrap();
    drop(db);
    let before = std::fs::read(&p).unwrap();
    let store = Store::open(&p).unwrap();
    let error = store.soundtrack_library().err().unwrap().to_string();
    assert!(error.contains("no partial result"));
    drop(store);
    assert_eq!(std::fs::read(&p).unwrap(), before);
    std::fs::remove_file(p).unwrap();
}

#[test]
fn concurrent_fixture_paths_are_unique() {
    let threads: Vec<_> = (0..16)
        .map(|_| std::thread::spawn(|| (0..100).map(|_| path_at(123)).collect::<Vec<_>>()))
        .collect();
    let paths: Vec<_> = threads
        .into_iter()
        .flat_map(|t| t.join().unwrap())
        .collect();
    let unique: std::collections::HashSet<_> = paths.iter().collect();
    assert_eq!(unique.len(), paths.len());
}
