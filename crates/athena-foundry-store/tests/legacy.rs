use athena_foundry_store::{Store, import_legacy, inspect_legacy};
use rusqlite::Connection;
use std::{
    path::PathBuf,
    sync::atomic::{AtomicUsize, Ordering},
};
static NEXT: AtomicUsize = AtomicUsize::new(0);
struct Files {
    source: PathBuf,
    target: PathBuf,
}
impl Files {
    fn new() -> Self {
        let root = std::env::temp_dir().join(format!(
            "athena-import-{}-{}",
            std::process::id(),
            NEXT.fetch_add(1, Ordering::Relaxed)
        ));
        std::fs::create_dir(&root).unwrap();
        Self {
            source: root.join("source.sqlite"),
            target: root.join("new.sqlite"),
        }
    }
}
impl Drop for Files {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(self.source.parent().unwrap());
    }
}
fn fixture() -> Files {
    let f = Files::new();
    let c = Connection::open(&f.source).unwrap();
    c.execute_batch(include_str!("fixtures/legacy-schema.sql"))
        .unwrap();
    c.execute_batch("INSERT INTO metadata VALUES('schema_version','1'); INSERT INTO theme_packages VALUES('frutiger-aero','Aero','1',1,'World','glass','soft','{}'); INSERT INTO rooms VALUES('frutiger-aero:room:aqua-atrium','frutiger-aero','d','Aqua','v33-runtime','{}'); INSERT INTO room_soundtracks VALUES('frutiger-aero','frutiger-aero:room:aqua-atrium','youtube','https://music.youtube.com/watch?v=abc_123','Music','pending',NULL,0); INSERT INTO history(event_type,payload_json,created_at) VALUES('private','{\"never_read\":true}',0);").unwrap();
    drop(c);
    f
}
#[test]
fn source_schema_dry_run_then_import_reopens_without_source_changes() {
    let f = fixture();
    let before = std::fs::read(&f.source).unwrap();
    let r = inspect_legacy(&f.source).unwrap();
    assert_eq!(
        (
            r.reviewed_themes,
            r.reviewed_rooms,
            r.soundtracks,
            r.skipped_metadata_rows
        ),
        (1, 1, 1, 1)
    );
    assert!(!f.target.exists());
    import_legacy(&f.source, &f.target).unwrap();
    assert_eq!(std::fs::read(&f.source).unwrap(), before);
    let s = Store::open(&f.target).unwrap();
    assert_eq!(s.summary().unwrap().soundtracks, 1);
    assert_eq!(
        s.soundtrack("frutiger-aero", "frutiger-aero:room:aqua-atrium")
            .unwrap()
            .unwrap()
            .label,
        "Music"
    );
    assert!(import_legacy(&f.source, &f.target).is_err());
}
#[test]
fn malformed_relationship_rejects_before_destination_creation() {
    let f = fixture();
    let c = Connection::open(&f.source).unwrap();
    c.execute("UPDATE room_soundtracks SET room_id='absent'", [])
        .unwrap();
    drop(c);
    assert!(import_legacy(&f.source, &f.target).is_err());
    assert!(!f.target.exists());
}
#[test]
fn future_source_schema_is_not_guessed_from_user_version() {
    let f = fixture();
    let c = Connection::open(&f.source).unwrap();
    c.execute(
        "UPDATE metadata SET value='2' WHERE key='schema_version'",
        [],
    )
    .unwrap();
    drop(c);
    assert!(import_legacy(&f.source, &f.target).is_err());
    assert!(!f.target.exists());
}
#[test]
fn wal_sidecars_are_not_silently_ignored() {
    let f = fixture();
    let wal = PathBuf::from(format!("{}-wal", f.source.display()));
    std::fs::write(wal, b"uncheckpointed").unwrap();
    assert!(inspect_legacy(&f.source).is_err());
}
#[test]
fn unreviewed_worlds_are_counted_not_imported() {
    let f = fixture();
    let c = Connection::open(&f.source).unwrap();
    c.execute_batch("INSERT INTO theme_packages VALUES('unreviewed','Private','1',0,'World','glass','soft','{}'); INSERT INTO rooms VALUES('private-room','unreviewed','d','Private','other','{}'); INSERT INTO room_soundtracks VALUES('unreviewed','private-room','unknown','private','Private','unknown','private',0);").unwrap();
    drop(c);
    let r = import_legacy(&f.source, &f.target).unwrap();
    assert_eq!(
        (
            r.skipped_unreviewed_themes,
            r.skipped_unreviewed_rooms,
            r.skipped_unreviewed_soundtracks
        ),
        (1, 1, 1)
    );
    assert_eq!(
        Store::open(&f.target)
            .unwrap()
            .summary()
            .unwrap()
            .soundtracks,
        1
    );
}

#[test]
fn wal_header_without_sidecars_rejected_without_directory_changes() {
    let f = fixture();
    let c = Connection::open(&f.source).unwrap();
    c.pragma_update(None, "journal_mode", "WAL").unwrap();
    c.execute_batch("PRAGMA wal_checkpoint(TRUNCATE)").unwrap();
    drop(c);
    let root = f.source.parent().unwrap();
    let snapshot = || {
        let mut entries = std::fs::read_dir(root)
            .unwrap()
            .map(|e| {
                let p = e.unwrap().path();
                (
                    p.file_name().unwrap().to_os_string(),
                    std::fs::read(p).unwrap(),
                )
            })
            .collect::<Vec<_>>();
        entries.sort();
        entries
    };
    let before = snapshot();
    assert_eq!(before.len(), 1);
    assert_eq!(before[0].1[18], 2);
    assert!(inspect_legacy(&f.source).is_err());
    assert!(import_legacy(&f.source, &f.target).is_err());
    assert_eq!(snapshot(), before);
}

#[test]
fn complete_count_inventory_never_implies_lossless_or_leaks_unknown_names() {
    let f = fixture();
    let c = Connection::open(&f.source).unwrap();
    c.execute_batch("INSERT INTO ecology_objects VALUES('custom','frutiger-aero','private-name','role','material','shape','[]','{}','{\"secret_marker\":true}'); CREATE TABLE private_secret_marker(payload TEXT); INSERT INTO private_secret_marker VALUES('private-content'); INSERT INTO metadata VALUES('private-secret-key','private-secret-value');").unwrap();
    drop(c);
    let before = std::fs::read(&f.source).unwrap();
    let r = inspect_legacy(&f.source).unwrap();
    assert_eq!(r.source_table_rows.len(), 10);
    assert_eq!(r.source_table_rows["ecology_objects"], 1);
    assert_eq!(r.source_table_rows["metadata"], 2);
    assert_eq!(r.source_table_rows["history"], 1);
    assert_eq!(r.unknown_source_tables, 1);
    assert_eq!(r.source_catalog_rows_not_copied, 3);
    assert!(!r.lossless_migration);
    let report = serde_json::to_string(&r).unwrap();
    for forbidden in [
        "secret_marker",
        "private-content",
        "private-secret",
        "private-name",
    ] {
        assert!(!report.contains(forbidden));
    }
    let imported = import_legacy(&f.source, &f.target).unwrap();
    assert_eq!(imported.source_table_rows, r.source_table_rows);
    assert_eq!(std::fs::read(&f.source).unwrap(), before);
    assert!(!imported.lossless_migration);
}

#[test]
fn source_sidecar_import_destinations_are_never_created() {
    let f = fixture();
    let before = std::fs::read(&f.source).unwrap();
    for suffix in ["-wal", "-shm", "-journal"] {
        let destination = std::path::PathBuf::from(format!("{}{suffix}", f.source.display()));
        assert!(import_legacy(&f.source, &destination).is_err());
        assert!(!destination.exists());
        assert_eq!(std::fs::read(&f.source).unwrap(), before);
    }
}

#[cfg(unix)]
#[test]
fn source_and_symlink_parent_sidecar_aliases_are_refused() {
    let f = fixture();
    let root = f.source.parent().unwrap();
    let alias = root.join("alias");
    std::os::unix::fs::symlink(root, &alias).unwrap();
    let before = std::fs::read(&f.source).unwrap();
    for suffix in ["", "-wal", "-shm", "-journal"] {
        let destination = alias.join(format!("source.sqlite{suffix}"));
        assert!(import_legacy(&f.source, &destination).is_err());
        if !suffix.is_empty() {
            assert!(!destination.exists());
        }
        assert_eq!(std::fs::read(&f.source).unwrap(), before);
    }
}
#[test]
fn ordinary_relative_destination_still_imports() {
    let f = fixture();
    let target = PathBuf::from(format!(
        "relative-import-fixture-{}.sqlite",
        std::process::id()
    ));
    assert!(!target.exists());
    let report = import_legacy(&f.source, &target).unwrap();
    assert_eq!(report.soundtracks, 1);
    assert_eq!(
        Store::open(&target).unwrap().summary().unwrap().soundtracks,
        1
    );
    std::fs::remove_file(target).unwrap();
}
