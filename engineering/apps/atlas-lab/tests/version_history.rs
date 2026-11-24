use atlas_lab::{modrinth_versions::parse_versions, snapshots::SnapshotStore};
use rusqlite::{Connection, params};
#[test]
fn exact_version_history_is_paginated_and_never_falls_back() {
    let path = std::env::temp_dir().join(format!(
        "athena-version-history-{}-{}.sqlite",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    let mut store = SnapshotStore::open(&path).unwrap();
    let id = "abcdefgh".to_owned();
    let first = r#" {"id":"abcdefgh","project_id":"AANobbMI","name":"Old 雪","version_number":"1","date_published":"2026-10-30","game_versions":[],"loaders":[],"files":[],"dependencies":[],"unknown":18446744073709551617,"changelog":null} "#;
    let second = first.replace("Old 雪", "New ❄");
    let mut generations = Vec::new();
    for body in [first, second.as_str()] {
        let batch =
            parse_versions(format!("[{body}]").as_bytes(), std::slice::from_ref(&id)).unwrap();
        generations.push(store.save_modrinth_versions(&batch).unwrap()[0].1);
    }
    store
        .record_version_failure(std::slice::from_ref(&id))
        .unwrap();
    drop(store);
    let store = SnapshotStore::open(&path).unwrap();
    // The batch parser defines each preserved JSON object, excluding array separators.
    let expected = parse_versions(format!("[{first}]").as_bytes(), std::slice::from_ref(&id))
        .unwrap()
        .versions[0]
        .payload
        .get()
        .to_owned();
    assert_eq!(
        store
            .modrinth_version_generation(&id, generations[0])
            .unwrap()
            .unwrap()
            .1
            .payload
            .get(),
        expected
    );
    let page = store.modrinth_version_history(&id, None, 1).unwrap();
    assert_eq!(page.entries[0].generation, generations[1].to_string());
    let old = store
        .modrinth_version_history(&id, Some(page.next_before.unwrap().parse().unwrap()), 1)
        .unwrap();
    assert_eq!(old.entries[0].generation, generations[0].to_string());
    assert!(old.next_before.is_none());
    assert!(store.modrinth_version_generation(&id, 0).is_err());
    assert!(
        store
            .modrinth_version_generation(&id, generations[1] + 1)
            .unwrap()
            .is_none()
    );
    assert!(
        store
            .modrinth_version_generation("OTHER123", generations[0])
            .unwrap()
            .is_none()
    );
    assert!(
        store
            .modrinth_version_history("OTHER123", None, 100)
            .unwrap()
            .entries
            .is_empty()
    );
    assert!(store.modrinth_version_history(&id, None, 101).is_err());
    assert!(store.modrinth_version_history(&id, Some(-1), 1).is_err());
    let c = Connection::open(&path).unwrap();
    c.execute(
        "UPDATE snapshots SET payload='{}' WHERE generation=?1",
        [generations[0]],
    )
    .unwrap();
    assert!(
        store
            .modrinth_version_generation(&id, generations[0])
            .is_err()
    );
    assert_eq!(
        store
            .latest_modrinth_version_snapshot(&id)
            .unwrap()
            .unwrap()
            .0,
        generations[1]
    );
    c.execute(
        "UPDATE snapshots SET payload=?1 WHERE generation=?2",
        params!["x".repeat(4194305), generations[0]],
    )
    .unwrap();
    assert!(
        store
            .modrinth_version_generation(&id, generations[0])
            .is_err()
    );
    assert_eq!(store.attempts().unwrap(), 3);
    drop(c);
    drop(store);
    std::fs::remove_file(path).unwrap();
}
