use atlas_lab::{modrinth::parse_project_record, snapshots::SnapshotStore};
use rusqlite::{Connection, params};

#[test]
fn explicit_generation_keeps_exact_history_and_never_substitutes_latest() {
    let path = std::env::temp_dir().join(format!(
        "athena-project-history-{}-{}.sqlite",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    let mut store = SnapshotStore::open(&path).unwrap();
    let first = r#" {"id":"AANobbMI","slug":"sodium","title":"Old 雪","description":"fixture","project_type":"mod","versions":[],"future":18446744073709551617} "#;
    let second = first.replace("Old 雪", "New ❄");
    let one = store
        .save_modrinth_project_record(
            "sodium",
            &parse_project_record(first.as_bytes(), "sodium").unwrap(),
        )
        .unwrap();
    let two = store
        .save_modrinth_project_record(
            "sodium",
            &parse_project_record(second.as_bytes(), "sodium").unwrap(),
        )
        .unwrap();
    store.record_project_raw_failure("sodium").unwrap();
    drop(store);
    let store = SnapshotStore::open(&path).unwrap();
    assert_eq!(
        store
            .modrinth_project_generation("AANobbMI", one)
            .unwrap()
            .unwrap()
            .1
            .raw_json(),
        first
    );
    assert_eq!(
        store
            .latest_modrinth_project_snapshot("AANobbMI")
            .unwrap()
            .unwrap()
            .0,
        two
    );
    assert!(
        store
            .modrinth_project_generation("AANobbMI", two + 100)
            .unwrap()
            .is_none()
    );
    assert!(
        store
            .modrinth_project_generation("OTHER123", one)
            .unwrap()
            .is_none()
    );
    assert!(store.modrinth_project_generation("AANobbMI", 0).is_err());
    assert!(store.modrinth_project_generation("AANobbMI", -1).is_err());
    assert_eq!(store.attempts().unwrap(), 3);
    let connection = Connection::open(&path).unwrap();
    connection
        .execute(
            "UPDATE snapshots SET payload='{}' WHERE generation=?1",
            [one],
        )
        .unwrap();
    assert!(store.modrinth_project_generation("AANobbMI", one).is_err());
    assert_eq!(
        store
            .latest_modrinth_project_snapshot("AANobbMI")
            .unwrap()
            .unwrap()
            .0,
        two
    );
    connection
        .execute(
            "UPDATE snapshots SET payload=?1 WHERE generation=?2",
            params!["x".repeat(4 * 1024 * 1024 + 1), one],
        )
        .unwrap();
    assert!(store.modrinth_project_generation("AANobbMI", one).is_err());
    drop(connection);
    drop(store);
    std::fs::remove_file(path).unwrap();
}
