use atlas_lab::{modrinth::parse_project_record, snapshots::SnapshotStore};
use rusqlite::Connection;
#[test]
fn metadata_pages_are_bounded_isolated_and_do_not_hide_bad_payloads() {
    let path = std::env::temp_dir().join(format!(
        "athena-history-page-{}-{}.sqlite",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos()
    ));
    let mut store = SnapshotStore::open(&path).unwrap();
    let body = r#"{"id":"AANobbMI","slug":"sodium","title":"Fixture","description":"PRIVATE_PAYLOAD_NOT_IN_METADATA","project_type":"mod","versions":[]}"#;
    let record = parse_project_record(body.as_bytes(), "sodium").unwrap();
    let mut generations = Vec::new();
    for _ in 0..5 {
        generations.push(
            store
                .save_modrinth_project_record("sodium", &record)
                .unwrap(),
        );
    }
    let first = store.modrinth_project_history("AANobbMI", None, 2).unwrap();
    assert_eq!(first.entries.len(), 2);
    assert_eq!(first.entries[0].generation, generations[4].to_string());
    assert!(
        !serde_json::to_string(&first)
            .unwrap()
            .contains("PRIVATE_PAYLOAD")
    );
    // A new observation must not shift a keyset page or duplicate old entries.
    store
        .save_modrinth_project_record("sodium", &record)
        .unwrap();
    let second = store
        .modrinth_project_history(
            "AANobbMI",
            Some(first.next_before.unwrap().parse().unwrap()),
            2,
        )
        .unwrap();
    assert_eq!(second.entries[0].generation, generations[2].to_string());
    let last = store
        .modrinth_project_history(
            "AANobbMI",
            Some(second.next_before.unwrap().parse().unwrap()),
            2,
        )
        .unwrap();
    assert_eq!(last.entries.len(), 1);
    assert!(last.next_before.is_none());
    assert!(
        store
            .modrinth_project_history("OTHER123", None, 2)
            .unwrap()
            .entries
            .is_empty()
    );
    assert!(
        store
            .modrinth_project_history("AANobbMI", Some(1), 2)
            .unwrap()
            .entries
            .is_empty()
    );
    for limit in [0, 101, usize::MAX] {
        assert!(
            store
                .modrinth_project_history("AANobbMI", None, limit)
                .is_err()
        );
    }
    for before in [0, -1] {
        assert!(
            store
                .modrinth_project_history("AANobbMI", Some(before), 2)
                .is_err()
        );
    }
    let c = Connection::open(&path).unwrap();
    c.execute(
        "UPDATE snapshots SET payload='corrupt' WHERE generation=?1",
        [generations[0]],
    )
    .unwrap();
    assert!(
        store
            .modrinth_project_generation("AANobbMI", generations[0])
            .is_err()
    );
    assert_eq!(
        store
            .modrinth_project_history("AANobbMI", Some(generations[1]), 2)
            .unwrap()
            .entries[0]
            .stored_bytes,
        7
    );
    drop(c);
    drop(store);
    std::fs::remove_file(path).unwrap();
}
