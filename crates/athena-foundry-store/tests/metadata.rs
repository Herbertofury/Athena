use athena_foundry_store::{Store, import_legacy, metadata::NativeAssignment};
use rusqlite::Connection;
use std::{
    path::PathBuf,
    sync::atomic::{AtomicUsize, Ordering},
    time::{SystemTime, UNIX_EPOCH},
};
static NEXT: AtomicUsize = AtomicUsize::new(0);
struct Files(PathBuf);
impl Files {
    fn new() -> Self {
        let p = std::env::temp_dir().join(format!(
            "athena-metadata-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        std::fs::create_dir(&p).unwrap();
        Self(p)
    }
}
impl Drop for Files {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}
fn input() -> NativeAssignment {
    NativeAssignment {
        theme_id: "frutiger-aero".into(),
        room_id: "frutiger-aero:room:aqua-atrium".into(),
        provider: "apple".into(),
        url: "https://music.apple.com/us/search?term=Calm%20music".into(),
        label: "Calm".into(),
        status: "USER_SEARCH_ROUTE".into(),
        source_id: Some("local:route-1".into()),
    }
}
fn legacy(p: &std::path::Path, time: i64) {
    let c = Connection::open(p).unwrap();
    c.execute_batch(include_str!("fixtures/legacy-schema.sql"))
        .unwrap();
    c.execute_batch("INSERT INTO metadata VALUES('schema_version','1'); INSERT INTO theme_packages VALUES('frutiger-aero','Aero','1',1,'World','glass','soft','{}'); INSERT INTO rooms VALUES('frutiger-aero:room:aqua-atrium','frutiger-aero','d','Aqua','v33-runtime','{}');").unwrap();
    c.execute("INSERT INTO room_soundtracks VALUES('frutiger-aero','frutiger-aero:room:aqua-atrium','apple','https://music.apple.com/us/search?term=Calm%20music','Calm','USER_SEARCH_ROUTE','local:route-1',?1)",[time]).unwrap();
}
#[test]
fn actual_legacy_metadata_exact_preserved() {
    let f = Files::new();
    let source = f.0.join("old");
    let dest = f.0.join("new");
    legacy(&source, 123456789);
    let before = std::fs::read(&source).unwrap();
    let r = import_legacy(&source, &dest).unwrap();
    assert_eq!(r.skipped_assignment_metadata_rows, 0);
    let v = Store::open(&dest)
        .unwrap()
        .soundtrack_native(&input().theme_id, &input().room_id)
        .unwrap()
        .unwrap();
    assert_eq!(v.assignment, input());
    assert_eq!(v.updated_at, Some(123456789));
    assert_eq!(std::fs::read(&source).unwrap(), before);
}
#[test]
fn invalid_legacy_timestamps_reject_before_creation() {
    for timestamp in [-1, i64::MAX] {
        let f = Files::new();
        let source = f.0.join("old");
        let dest = f.0.join("new");
        legacy(&source, timestamp);
        assert!(import_legacy(&source, &dest).is_err());
        assert!(!dest.exists());
    }
}
#[test]
fn migration_and_current_assignment_time() {
    let f = Files::new();
    let p = f.0.join("db");
    let mut s = Store::create(&p).unwrap();
    assert!(s.migrate_soundtrack_metadata().is_err());
    s.migrate_history().unwrap();
    s.migrate_soundtrack_metadata().unwrap();
    s.migrate_soundtrack_metadata().unwrap();
    let before = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    let v = s.assign_native(&input()).unwrap();
    let after = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;
    assert!((before..=after).contains(&v.updated_at.unwrap()));
    let mut bad = input();
    bad.source_id = Some("secret?token=bad".into());
    assert!(s.assign_native(&bad).is_err());
    assert_eq!(
        s.soundtrack_native(&input().theme_id, &input().room_id)
            .unwrap(),
        Some(v)
    );
}
#[test]
fn existing_schema3_rows_keep_unknown_timestamp_explicit() {
    let f = Files::new();
    let p = f.0.join("db");
    let mut s = Store::create(&p).unwrap();
    let i = input();
    s.assign(&athena_foundry_store::Soundtrack {
        theme_id: i.theme_id.clone(),
        room_id: i.room_id.clone(),
        provider: i.provider.clone(),
        url: i.url.clone(),
        label: i.label.clone(),
    })
    .unwrap();
    s.migrate_history().unwrap();
    s.migrate_soundtrack_metadata().unwrap();
    let v = s
        .soundtrack_native(&i.theme_id, &i.room_id)
        .unwrap()
        .unwrap();
    assert_eq!(v.updated_at, None);
    assert_eq!(v.assignment.status, "LEGACY_UNSPECIFIED");
    assert_eq!(v.assignment.source_id, None);
}
#[test]
fn public_source_queries_supported_not_auth_keys() {
    let f = Files::new();
    let mut s = Store::create(&f.0.join("db")).unwrap();
    s.migrate_history().unwrap();
    s.migrate_soundtrack_metadata().unwrap();
    for (provider, url) in [
        ("apple", "https://music.apple.com/us/album/example?i=12345"),
        ("soundcloud", "https://soundcloud.com/search?q=Calm%20music"),
        ("tidal", "https://tidal.com/search?q=Calm"),
        ("youtube", "https://music.youtube.com/search?q=Calm"),
        (
            "youtube",
            "https://music.youtube.com/search?search_query=Calm",
        ),
    ] {
        let mut i = input();
        i.provider = provider.into();
        i.url = url.into();
        assert!(s.assign_native(&i).is_ok());
        i.url.push_str("&access_token=bad");
        assert!(s.assign_native(&i).is_err());
    }
}

#[test]
fn metadata_migration_failure_rolls_back_columns_and_version() {
    let f = Files::new();
    let p = f.0.join("db");
    let mut s = Store::create(&p).unwrap();
    s.migrate_history().unwrap();
    drop(s);
    let db = Connection::open(&p).unwrap();
    db.execute_batch("ALTER TABLE soundtracks ADD COLUMN source_id TEXT;")
        .unwrap();
    drop(db);
    let mut s = Store::open(&p).unwrap();
    assert!(s.migrate_soundtrack_metadata().is_err());
    assert_eq!(s.summary().unwrap().schema, 3);
    drop(s);
    let db = Connection::open(&p).unwrap();
    let n: i64 = db
        .query_row(
            "SELECT count(*) FROM pragma_table_info('soundtracks') WHERE name='status'",
            [],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(n, 0);
}

#[test]
fn native_read_revalidates_tampered_database_without_mutation() {
    let f = Files::new();
    let p = f.0.join("store.sqlite");
    let mut s = Store::create(&p).unwrap();
    s.migrate_history().unwrap();
    s.migrate_soundtrack_metadata().unwrap();
    let v = input();
    s.assign_native(&v).unwrap();
    let raw = Connection::open(&p).unwrap();
    raw.execute("UPDATE soundtracks SET url='javascript:alert(1)'", [])
        .unwrap();
    let before = std::fs::read(&p).unwrap();
    assert!(s.soundtrack_native(&v.theme_id, &v.room_id).is_err());
    assert_eq!(std::fs::read(&p).unwrap(), before);
    raw.execute("UPDATE soundtracks SET url=?1,updated_at=-1", [&v.url])
        .unwrap();
    assert!(s.soundtrack_native(&v.theme_id, &v.room_id).is_err());
    raw.execute("UPDATE soundtracks SET updated_at=NULL", [])
        .unwrap();
    assert_eq!(
        s.soundtrack_native(&v.theme_id, &v.room_id)
            .unwrap()
            .unwrap()
            .updated_at,
        None
    );
}

#[test]
fn atomic_public_bookmark_assignment_fences_room_time_and_rolls_back() {
    let f = Files::new();
    let p = f.0.join("store.sqlite");
    let mut s = Store::create(&p).unwrap();
    let native = input();
    let a = athena_foundry_store::Soundtrack {
        theme_id: native.theme_id.clone(),
        room_id: native.room_id.clone(),
        provider: native.provider.clone(),
        url: native.url.clone(),
        label: native.label.clone(),
    };
    assert!(s.compare_assign_soundtrack("empty", &a).is_err());
    s.migrate_history().unwrap();
    s.migrate_soundtrack_metadata().unwrap();
    let empty = s.soundtrack_versioned(&a.theme_id, &a.room_id).unwrap();
    let other = s.soundtrack_versioned(&a.theme_id, "other-room").unwrap();
    assert_ne!(empty.version, other.version);
    assert!(
        s.compare_assign_soundtrack(&other.version, &a)
            .unwrap()
            .is_none()
    );
    let result = s
        .compare_assign_soundtrack(&empty.version, &a)
        .unwrap()
        .unwrap();
    let v = result.value.unwrap();
    assert_eq!(v.assignment.status, "USER_ASSIGNED");
    assert_eq!(v.assignment.source_id, None);
    assert!(v.updated_at.is_some());
    assert!(
        s.compare_assign_soundtrack(&empty.version, &a)
            .unwrap()
            .is_none()
    );
    let before = s
        .soundtrack_versioned(&a.theme_id, &a.room_id)
        .unwrap()
        .version;
    let raw = Connection::open(&p).unwrap();
    raw.execute("UPDATE soundtracks SET updated_at=1", [])
        .unwrap();
    let changed = s
        .soundtrack_versioned(&a.theme_id, &a.room_id)
        .unwrap()
        .version;
    assert_ne!(before, changed);
    assert!(s.compare_assign_soundtrack(&before, &a).unwrap().is_none());
    raw.execute_batch("CREATE TRIGGER reject_assignment BEFORE UPDATE ON soundtracks BEGIN SELECT RAISE(ABORT,'injected failure'); END;").unwrap();
    assert!(s.compare_assign_soundtrack(&changed, &a).is_err());
    assert_eq!(
        s.soundtrack_versioned(&a.theme_id, &a.room_id)
            .unwrap()
            .version,
        changed
    );
    raw.execute_batch("DROP TRIGGER reject_assignment;")
        .unwrap();
    raw.execute("UPDATE soundtracks SET url='javascript:bad'", [])
        .unwrap();
    assert!(s.compare_assign_soundtrack(&changed, &a).is_err());
}

#[test]
fn competing_bookmark_connections_only_one_empty_assignment_wins() {
    let f = Files::new();
    let p = f.0.join("store.sqlite");
    let mut s = Store::create(&p).unwrap();
    s.migrate_history().unwrap();
    s.migrate_soundtrack_metadata().unwrap();
    let v = input();
    let token = s
        .soundtrack_versioned(&v.theme_id, &v.room_id)
        .unwrap()
        .version;
    let barrier = std::sync::Arc::new(std::sync::Barrier::new(3));
    let mut tasks = vec![];
    for label in ["First", "Second"] {
        let p = p.clone();
        let token = token.clone();
        let b = barrier.clone();
        tasks.push(std::thread::spawn(move || {
            let v = input();
            let a = athena_foundry_store::Soundtrack {
                theme_id: v.theme_id,
                room_id: v.room_id,
                provider: v.provider,
                url: v.url,
                label: label.into(),
            };
            let mut s = Store::open(&p).unwrap();
            b.wait();
            s.compare_assign_soundtrack(&token, &a)
                .ok()
                .flatten()
                .is_some()
        }));
    }
    barrier.wait();
    assert_eq!(
        tasks
            .into_iter()
            .map(|t| usize::from(t.join().unwrap()))
            .sum::<usize>(),
        1
    );
    assert!(
        s.soundtrack_native(&v.theme_id, &v.room_id)
            .unwrap()
            .is_some()
    );
}
