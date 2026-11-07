use atlas_lab::{modrinth::Project, snapshots::SnapshotStore};
use std::{
    fs::OpenOptions,
    path::PathBuf,
    time::{SystemTime, UNIX_EPOCH},
};
struct Scratch(PathBuf);
impl Scratch {
    fn new() -> Self {
        let n = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let path =
            std::env::temp_dir().join(format!("atlas-lab-test-{}-{n}.sqlite", std::process::id()));
        OpenOptions::new()
            .create_new(true)
            .write(true)
            .open(&path)
            .unwrap();
        Self(path)
    }
}
impl Drop for Scratch {
    fn drop(&mut self) {
        let _ = std::fs::remove_file(&self.0);
    }
}
#[test]
fn snapshots_survive_close_reopen_and_failure() {
    let scratch = Scratch::new();
    let project = Project {
        id: "AANobbMI".into(),
        slug: "sodium".into(),
        title: "fixture".into(),
        description: "not a live result".into(),
        body: Some("# Full fixture\n![image](https://example.invalid/a.png)".into()),
        project_type: "mod".into(),
        versions: vec!["abc".into()],
        icon_url: None,
        gallery: None,
    };
    {
        let mut s = SnapshotStore::open(&scratch.0).unwrap();
        s.save_modrinth("sodium", &project).unwrap();
    }
    {
        let s = SnapshotStore::open(&scratch.0).unwrap();
        s.record_failure("sodium").unwrap();
        assert_eq!(
            s.latest_modrinth("AANobbMI").unwrap().unwrap().versions,
            vec!["abc"]
        );
        assert_eq!(
            s.latest_modrinth("AANobbMI").unwrap().unwrap().body,
            project.body
        );
        assert_eq!(s.attempts().unwrap(), 2);
    }
    let c = rusqlite::Connection::open(&scratch.0).unwrap();
    assert_eq!(
        c.query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))
            .unwrap(),
        "ok"
    );
}

#[test]
fn separate_connections_cannot_claim_the_same_live_job() {
    use atlas_lab::jobs::{Job, Queue};
    let scratch = Scratch::new();
    let mut first = Queue::open(&scratch.0).unwrap();
    let mut second = Queue::open(&scratch.0).unwrap();
    first.enqueue(&Job::DedupExperiment, 0).unwrap();
    let a = first.claim("worker-a", 1, 1000).unwrap().unwrap();
    assert!(second.claim("worker-b", 2, 1000).unwrap().is_none());
    drop(first);
    let b = second.claim("worker-b", 1001, 1000).unwrap().unwrap();
    assert_eq!(a.id, b.id);
    assert!(second.finish(&a, true, 1002).is_err());
    second.finish(&b, true, 1003).unwrap();
}

#[test]
fn batch_survives_reopen_without_replacing_missing_project() {
    let scratch = Scratch::new();
    let ids = vec!["AANobbMI".into(), "P7dR8mSH".into()];
    let body=br#"[{"id":"AANobbMI","slug":"fixture","title":"Full fixture","description":"test","project_type":"mod","versions":["all1","all2"],"gallery":[]}]"#;
    let batch = atlas_lab::modrinth::parse_projects(body, &ids).unwrap();
    {
        let mut store = SnapshotStore::open(&scratch.0).unwrap();
        store.save_modrinth_batch(&batch).unwrap();
        store.record_batch_failure(&ids).unwrap();
    }
    let store = SnapshotStore::open(&scratch.0).unwrap();
    assert_eq!(store.attempts().unwrap(), 4);
    assert_eq!(
        serde_json::to_value(store.latest_modrinth("AANobbMI").unwrap().unwrap()).unwrap(),
        serde_json::to_value(&batch.projects[0]).unwrap()
    );
    assert!(store.latest_modrinth("P7dR8mSH").unwrap().is_none());
    let connection = rusqlite::Connection::open(&scratch.0).unwrap();
    assert_eq!(
        connection
            .query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))
            .unwrap(),
        "ok"
    );
}

#[test]
fn version_payloads_survive_reopen_missing_refresh_and_failed_transaction() {
    use atlas_lab::modrinth_versions::parse_versions;
    let scratch = Scratch::new();
    let body = r#"[{"id":"abcdefgh","project_id":"AANobbMI","name":"Fixture","version_number":"1","date_published":"2026-10-27T00:00:00Z","game_versions":["1.21.1"],"loaders":["fabric"],"dependencies":[],"files":[{"filename":"fixture.jar","url":"https://cdn.modrinth.com/example.jar","size":42,"primary":true,"hashes":{"sha1":"fixture-only"}}],"changelog":null,"future_field":18446744073709551617}]"#;
    let ids = vec!["abcdefgh".into()];
    let batch = parse_versions(body.as_bytes(), &ids).unwrap();
    let exact = batch.versions[0].payload.get().to_owned();
    {
        let mut store = SnapshotStore::open(&scratch.0).unwrap();
        store.save_modrinth_versions(&batch).unwrap();
    }
    {
        let mut store = SnapshotStore::open(&scratch.0).unwrap();
        assert_eq!(
            store
                .latest_modrinth_version("abcdefgh")
                .unwrap()
                .unwrap()
                .payload
                .get(),
            exact
        );
        store
            .save_modrinth_versions(&parse_versions(b"[]", &ids).unwrap())
            .unwrap();
        store.record_version_failure(&ids).unwrap();
        assert_eq!(store.attempts().unwrap(), 3);
        assert_eq!(
            store
                .latest_modrinth_version("abcdefgh")
                .unwrap()
                .unwrap()
                .payload
                .get(),
            exact
        );
        assert!(store.latest_modrinth("abcdefgh").unwrap().is_none());
        let mut forged = parse_versions(body.as_bytes(), &ids).unwrap();
        forged.versions[0].project_id = "ijklmnop".into();
        assert!(store.save_modrinth_versions(&forged).is_err());
        assert_eq!(store.attempts().unwrap(), 3);
        let c = rusqlite::Connection::open(&scratch.0).unwrap();
        c.execute_batch("CREATE TRIGGER reject_version_attempt BEFORE INSERT ON collection_attempts WHEN NEW.requested_id LIKE 'modrinth-version:%' BEGIN SELECT RAISE(ABORT,'fixture failure'); END;").unwrap();
        assert!(store.save_modrinth_versions(&batch).is_err());
        assert_eq!(
            c.query_row(
                "SELECT count(*) FROM snapshots WHERE provider='modrinth-version'",
                [],
                |r| r.get::<_, i64>(0)
            )
            .unwrap(),
            1
        );
        assert_eq!(
            c.query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))
                .unwrap(),
            "ok"
        );
    }
}

#[test]
fn complete_project_json_survives_reopen_without_projection_loss() {
    let scratch = Scratch::new();
    let body=br#" {"id":"AANobbMI","slug":"sodium","title":"Fixture","description":"generated","project_type":"mod","versions":[],"future":{"integer":18446744073709551617,"empty":[],"nullable":null}} "#;
    {
        let mut store = SnapshotStore::open(&scratch.0).unwrap();
        let record = atlas_lab::modrinth::parse_project_record(body, "SODIUM").unwrap();
        store
            .save_modrinth_project_record("sodium", &record)
            .unwrap();
    }
    {
        let store = SnapshotStore::open(&scratch.0).unwrap();
        store.record_project_raw_failure("sodium").unwrap();
        assert_eq!(
            store
                .latest_modrinth_project_record("AANobbMI")
                .unwrap()
                .unwrap()
                .raw_json()
                .as_bytes(),
            body
        );
        assert!(store.latest_modrinth("AANobbMI").unwrap().is_none());
        assert_eq!(store.attempts().unwrap(), 2);
    }
}

#[test]
fn concurrent_snapshot_writers_preserve_complete_history_and_attempt_pairing() {
    use std::sync::{Arc, Barrier};
    for mode in ["DELETE", "WAL"] {
        let scratch = Scratch::new();
        let connection = rusqlite::Connection::open(&scratch.0).unwrap();
        connection
            .pragma_update(None, "journal_mode", mode)
            .unwrap();
        drop(connection);
        // Open serially so the concurrent phase tests writes, not schema setup.
        let stores: Vec<_> = (0..4)
            .map(|_| SnapshotStore::open(&scratch.0).unwrap())
            .collect();
        let start = Arc::new(Barrier::new(stores.len()));
        let mut expected = std::thread::scope(|scope| {
            let handles: Vec<_> = stores.into_iter().enumerate().map(|(writer, mut store)| {
                let start = Arc::clone(&start);
                scope.spawn(move || {
                    start.wait();
                    let mut committed = Vec::new();
                    for observation in 0..16 {
                        // Generated content: preserve whitespace, Unicode and a number
                        // that cannot be represented exactly by an IEEE-754 double.
                        let raw = format!(r#" {{"id":"AANobbMI","slug":"sodium","title":"Generated concurrent fixture","description":"not live data","project_type":"mod","versions":[],"future":{{"writer":{writer},"observation":{observation},"integer":18446744073709551617,"text":"雪🔥","empty":[],"nullable":null}}}} "#);
                        let record = atlas_lab::modrinth::parse_project_record(raw.as_bytes(), "sodium").unwrap();
                        let generation = store.save_modrinth_project_record("sodium", &record).unwrap();
                        if let Some((previous, _)) = committed.last() {
                            assert!(generation > *previous);
                        }
                        committed.push((generation, raw));
                    }
                    store.record_project_raw_failure("sodium").unwrap();
                    committed
                })
            }).collect();
            handles
                .into_iter()
                .flat_map(|handle| handle.join().unwrap())
                .collect::<Vec<_>>()
        });
        expected.sort_by_key(|(generation, _)| *generation);
        assert_eq!(expected.len(), 64);
        let store = SnapshotStore::open(&scratch.0).unwrap();
        assert_eq!(store.attempts().unwrap(), 68);
        assert_eq!(
            store
                .latest_modrinth_project_record("AANobbMI")
                .unwrap()
                .unwrap()
                .raw_json(),
            expected.last().unwrap().1
        );
        drop(store);
        let connection = rusqlite::Connection::open(&scratch.0).unwrap();
        let actual: Vec<(i64, String)> = connection.prepare("SELECT generation,payload FROM snapshots WHERE provider='modrinth-project-raw' AND canonical_id='AANobbMI' ORDER BY generation").unwrap()
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?))).unwrap()
            .collect::<Result<_,_>>().unwrap();
        assert_eq!(actual, expected);
        let paired: i64 = connection.query_row("SELECT count(*) FROM snapshots s WHERE (SELECT count(*) FROM collection_attempts a WHERE a.generation=s.generation AND a.outcome='success')=1", [], |r| r.get(0)).unwrap();
        assert_eq!(paired, 64);
        let failures: i64 = connection.query_row("SELECT count(*) FROM collection_attempts WHERE outcome='failure' AND generation IS NULL", [], |r| r.get(0)).unwrap();
        assert_eq!(failures, 4);
        assert_eq!(
            connection
                .query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))
                .unwrap(),
            "ok"
        );
        assert!(
            connection
                .prepare("PRAGMA foreign_key_check")
                .unwrap()
                .query([])
                .unwrap()
                .next()
                .unwrap()
                .is_none()
        );
        assert_eq!(
            connection
                .query_row("PRAGMA journal_mode", [], |r| r.get::<_, String>(0))
                .unwrap(),
            mode.to_lowercase()
        );
    }
}
