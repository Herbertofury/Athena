use athena_foundry_store::{Soundtrack, Store};
#[test]
fn clear_is_scoped_versioned_and_idempotent() {
    let p = std::env::temp_dir().join(format!(
        "clear-soundtrack-{}-{}.sqlite",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    let mut store = Store::create(&p).unwrap();
    store.migrate_history().unwrap();
    store.migrate_soundtrack_metadata().unwrap();
    let theme = "frutiger-aero";
    let room = "frutiger-aero:room:aqua-atrium";
    let other = "frutiger-aero:room:cloud-terminal";
    let assignment = |room: &str| Soundtrack {
        theme_id: theme.into(),
        room_id: room.into(),
        provider: "youtube".into(),
        url: "https://music.youtube.com/watch?v=synthetic".into(),
        label: "Synthetic".into(),
    };
    for key in [room, other] {
        let token = store.soundtrack_versioned(theme, key).unwrap().version;
        store
            .compare_assign_soundtrack(&token, &assignment(key))
            .unwrap()
            .unwrap();
    }
    let initial = store.soundtrack_versioned(theme, room).unwrap();
    let other_before =
        serde_json::to_value(store.soundtrack_versioned(theme, other).unwrap()).unwrap();
    let bytes = std::fs::read(&p).unwrap();
    assert!(
        store
            .compare_clear_soundtrack("stale", theme, room)
            .unwrap()
            .is_none()
    );
    assert_eq!(std::fs::read(&p).unwrap(), bytes);
    assert!(
        store
            .compare_clear_soundtrack(&initial.version, theme, "unknown")
            .is_err()
    );
    assert_eq!(std::fs::read(&p).unwrap(), bytes);
    let cleared = store
        .compare_clear_soundtrack(&initial.version, theme, room)
        .unwrap()
        .unwrap();
    assert!(cleared.value.is_none());
    assert_ne!(cleared.version, initial.version);
    assert_eq!(
        serde_json::to_value(store.soundtrack_versioned(theme, other).unwrap()).unwrap(),
        other_before
    );
    let bytes = std::fs::read(&p).unwrap();
    assert!(
        store
            .compare_clear_soundtrack(&initial.version, theme, room)
            .unwrap()
            .is_none()
    );
    assert!(
        store
            .compare_clear_soundtrack(&cleared.version, theme, room)
            .unwrap()
            .unwrap()
            .value
            .is_none()
    );
    assert_eq!(std::fs::read(&p).unwrap(), bytes);
    drop(store);
    let reopened = Store::open(&p).unwrap();
    assert!(reopened.soundtrack_native(theme, room).unwrap().is_none());
    assert!(reopened.soundtrack_native(theme, other).unwrap().is_some());
    drop(reopened);
    std::fs::remove_file(p).unwrap();
}
