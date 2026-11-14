//! Independent native Foundry persistence. No engine, browser, Tauri or network dependency.
//! Explicitly opened database only; never discovers or modifies a legacy database.
use rusqlite::{Connection, OpenFlags, OptionalExtension, params};
use serde::{Deserialize, Serialize};
use std::{collections::HashSet, path::Path, time::Duration};
use url::Url;

pub type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;
const CATALOG: &str = include_str!("../catalog.json");
const SCHEMA: &str = include_str!("schema.sql");
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Catalog {
    schema: u32,
    themes: Vec<Theme>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Theme {
    id: String,
    name: String,
    rooms: Vec<Room>,
    objects: Vec<Object>,
    colors: Vec<String>,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Room {
    id: String,
    name: String,
}
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Object {
    id: String,
    name: String,
    shape: String,
    role: String,
}
#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub struct Soundtrack {
    pub theme_id: String,
    pub room_id: String,
    pub provider: String,
    pub url: String,
    pub label: String,
}
#[derive(Debug, Serialize)]
pub struct Summary {
    pub schema: i64,
    pub themes: i64,
    pub rooms: i64,
    pub objects: i64,
    pub soundtracks: i64,
    pub integrity: String,
}
pub struct Store {
    db: Connection,
}

fn nonempty(s: &str, max: usize) -> bool {
    !s.trim().is_empty() && s.len() <= max && !s.chars().any(char::is_control)
}
fn catalog(text: &str) -> Result<Catalog> {
    let c: Catalog = serde_json::from_str(text)?;
    if c.schema != 1 || c.themes.is_empty() {
        return Err("Unsupported or empty catalog".into());
    }
    let mut themes = HashSet::new();
    let mut rooms = HashSet::new();
    let mut objects = HashSet::new();
    for t in &c.themes {
        if !nonempty(&t.id, 200)
            || !nonempty(&t.name, 200)
            || !themes.insert(&t.id)
            || t.colors.len() != 4
            || t.rooms.is_empty()
        {
            return Err("Invalid theme".into());
        }
        for r in &t.rooms {
            if !nonempty(&r.id, 200) || !nonempty(&r.name, 200) || !rooms.insert(&r.id) {
                return Err("Invalid room".into());
            }
        }
        for o in &t.objects {
            if !nonempty(&o.id, 200)
                || !nonempty(&o.name, 200)
                || !nonempty(&o.shape, 100)
                || !nonempty(&o.role, 100)
                || !objects.insert(&o.id)
            {
                return Err("Invalid object".into());
            }
        }
    }
    Ok(c)
}
impl Store {
    /// Creates a new file exclusively; refuses existing files and removes nothing on error.
    pub fn create(path: &Path) -> Result<Self> {
        let c = catalog(CATALOG)?;
        let mut options = std::fs::OpenOptions::new();
        options.write(true).create_new(true);
        // New local stores may contain personal metadata. Never rely on a
        // permissive process umask; do not chmod or alter existing user files.
        #[cfg(unix)]
        {
            use std::os::unix::fs::OpenOptionsExt;
            options.mode(0o600);
        }
        let file = options.open(path)?;
        drop(file);
        let mut db = Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_READ_WRITE)?;
        configure(&db)?;
        let tx = db.transaction()?;
        tx.execute_batch(SCHEMA)?;
        for t in c.themes {
            tx.execute("INSERT INTO themes VALUES(?1,?2)", params![t.id, t.name])?;
            for r in t.rooms {
                tx.execute(
                    "INSERT INTO rooms VALUES(?1,?2,?3)",
                    params![t.id, r.id, r.name],
                )?;
            }
            for o in t.objects {
                tx.execute(
                    "INSERT INTO objects VALUES(?1,?2,?3,?4,?5)",
                    params![t.id, o.id, o.name, o.shape, o.role],
                )?;
            }
        }
        tx.commit()?;
        let s = Self { db };
        s.summary()?;
        Ok(s)
    }
    /// Opens an existing Athena store. Never creates, seeds, migrates or changes journal mode.
    pub fn open(path: &Path) -> Result<Self> {
        let db = Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_READ_WRITE)?;
        let version: i64 = db.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if !matches!(version, 1..=16) {
            return Err("Unsupported database schema; no migration performed".into());
        }
        configure(&db)?;
        let s = Self { db };
        s.summary()?;
        Ok(s)
    }
    pub fn summary(&self) -> Result<Summary> {
        let integrity: String = self
            .db
            .query_row("PRAGMA integrity_check", [], |r| r.get(0))?;
        if integrity != "ok" {
            return Err("Database integrity check failed".into());
        }
        let foreign_errors: i64 =
            self.db
                .query_row("SELECT count(*) FROM pragma_foreign_key_check", [], |r| {
                    r.get(0)
                })?;
        if foreign_errors != 0 {
            return Err("Database relationship check failed".into());
        }
        let count =
            |table: &str| -> rusqlite::Result<i64> { self.db.query_row(table, [], |r| r.get(0)) };
        Ok(Summary {
            schema: self.db.query_row("PRAGMA user_version", [], |r| r.get(0))?,
            themes: count("SELECT count(*) FROM themes")?,
            rooms: count("SELECT count(*) FROM rooms")?,
            objects: count("SELECT count(*) FROM objects")?,
            soundtracks: count("SELECT count(*) FROM soundtracks")?,
            integrity,
        })
    }
    pub fn assign(&mut self, value: &Soundtrack) -> Result<()> {
        validate_soundtrack(value)?;
        if matches!(self.summary()?.schema, 4..=16) {
            self.assign_native(&metadata::NativeAssignment::from_soundtrack(value))?;
            return Ok(());
        }
        let tx = self.db.transaction()?;
        tx.execute("INSERT INTO soundtracks(theme_id,room_id,provider,url,label) VALUES(?1,?2,?3,?4,?5) ON CONFLICT(theme_id,room_id) DO UPDATE SET provider=excluded.provider,url=excluded.url,label=excluded.label",params![value.theme_id,value.room_id,value.provider,value.url,value.label])?;
        tx.commit()?;
        Ok(())
    }
    pub fn soundtrack(&self, theme: &str, room: &str) -> Result<Option<Soundtrack>> {
        Ok(self.db.query_row("SELECT theme_id,room_id,provider,url,label FROM soundtracks WHERE theme_id=?1 AND room_id=?2",params![theme,room],|r|Ok(Soundtrack{theme_id:r.get(0)?,room_id:r.get(1)?,provider:r.get(2)?,url:r.get(3)?,label:r.get(4)?})).optional()?)
    }
}
fn configure(db: &Connection) -> Result<()> {
    db.busy_timeout(Duration::from_secs(5))?;
    db.execute_batch("PRAGMA foreign_keys=ON; PRAGMA synchronous=EXTRA;")?;
    Ok(())
}
fn validate_soundtrack(v: &Soundtrack) -> Result<()> {
    if !nonempty(&v.theme_id, 200)
        || !nonempty(&v.room_id, 200)
        || !nonempty(&v.label, 300)
        || v.url.len() > 2048
    {
        return Err("Invalid soundtrack fields".into());
    }
    let u = Url::parse(&v.url)?;
    let allowed: &[&str] = match v.provider.as_str() {
        "spotify" => &["open.spotify.com"],
        "apple" => &["music.apple.com"],
        "deezer" => &["deezer.com", "www.deezer.com"],
        "soundcloud" => &["soundcloud.com", "www.soundcloud.com"],
        "tidal" => &["tidal.com", "listen.tidal.com"],
        "youtube" => &["music.youtube.com"],
        _ => return Err("Unknown provider".into()),
    };
    // These are public bookmark URLs, never credentials or provider API grants.
    if u.scheme() != "https"
        || !allowed.contains(&u.host_str().unwrap_or(""))
        || !u.username().is_empty()
        || u.password().is_some()
        || u.port().is_some()
        || u.fragment().is_some()
    {
        return Err("Use a credential-free public provider URL without fragment".into());
    }
    if u.query().is_some() {
        let mut keys = HashSet::new();
        for (key, value) in u.query_pairs() {
            if !keys.insert(key.to_string()) {
                return Err("Duplicate public query key".into());
            }
            let public_id = matches!(
                (v.provider.as_str(), key.as_ref()),
                ("youtube", "v" | "list")
            );
            let apple_id = v.provider == "apple" && key == "i";
            let search = (v.provider == "apple" && key == "term" && u.path().ends_with("/search"))
                || (matches!(v.provider.as_str(), "soundcloud" | "tidal" | "youtube")
                    && matches!(key.as_ref(), "q" | "search_query")
                    && u.path() == "/search"
                    && (key == "q" || v.provider == "youtube"));
            if public_id {
                if value.is_empty()
                    || value.len() > 128
                    || !value
                        .bytes()
                        .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
                {
                    return Err("Invalid public media ID".into());
                }
            } else if apple_id {
                if value.is_empty()
                    || value.len() > 32
                    || !value.bytes().all(|b| b.is_ascii_digit())
                {
                    return Err("Invalid Apple track ID".into());
                }
            } else if search {
                if !nonempty(&value, 512) {
                    return Err("Invalid public search term".into());
                }
            } else {
                return Err("Unexpected provider query key".into());
            }
        }
        if keys.is_empty() {
            return Err("Empty query is unsupported".into());
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};
    static NEXT: AtomicUsize = AtomicUsize::new(0);
    struct Fixture(std::path::PathBuf);
    impl Fixture {
        fn new() -> Self {
            Self(std::env::temp_dir().join(format!(
                "athena-foundry-test-{}-{}",
                std::process::id(),
                NEXT.fetch_add(1, Ordering::Relaxed)
            )))
        }
    }
    impl Drop for Fixture {
        fn drop(&mut self) {
            let _ = std::fs::remove_file(&self.0);
        }
    }
    fn sample() -> Soundtrack {
        Soundtrack {
            theme_id: "frutiger-aero".into(),
            room_id: "frutiger-aero:room:aqua-atrium".into(),
            provider: "spotify".into(),
            url: "https://open.spotify.com/track/example".into(),
            label: "Música 🌙 'quoted'".into(),
        }
    }
    #[test]
    fn catalog_counts_and_reopen() {
        let f = Fixture::new();
        let s = Store::create(&f.0).unwrap();
        let m = s.summary().unwrap();
        assert_eq!((m.themes, m.rooms, m.objects), (17, 34, 85));
        drop(s);
        assert_eq!(
            Store::open(&f.0).unwrap().summary().unwrap().integrity,
            "ok"
        );
    }
    #[test]
    fn assignment_is_durable_and_parameterized() {
        let f = Fixture::new();
        let mut s = Store::create(&f.0).unwrap();
        let v = sample();
        s.assign(&v).unwrap();
        drop(s);
        let s = Store::open(&f.0).unwrap();
        assert_eq!(s.soundtrack(&v.theme_id, &v.room_id).unwrap(), Some(v));
    }
    #[test]
    fn invalid_relationship_keeps_prior() {
        let f = Fixture::new();
        let mut s = Store::create(&f.0).unwrap();
        let v = sample();
        s.assign(&v).unwrap();
        let mut bad = sample();
        bad.theme_id = "utopian-scholastic".into();
        assert!(s.assign(&bad).is_err());
        assert_eq!(s.soundtrack(&v.theme_id, &v.room_id).unwrap(), Some(v));
        assert_eq!(s.summary().unwrap().soundtracks, 1);
    }
    #[test]
    fn url_validation_rejects_credentials_and_spoofing() {
        for url in [
            "http://open.spotify.com/track/x",
            "https://open.spotify.com.evil.test/x",
            "https://user:secret@open.spotify.com/x",
            "https://open.spotify.com/x?token=secret",
            "https://open.spotify.com/x#secret",
            "https://open.spotify.com:8443/x",
        ] {
            let mut v = sample();
            v.url = url.into();
            assert!(validate_soundtrack(&v).is_err(), "{url}");
        }
    }
    #[test]
    fn existing_file_never_overwritten() {
        let f = Fixture::new();
        std::fs::write(&f.0, b"last-good").unwrap();
        assert!(Store::create(&f.0).is_err());
        assert_eq!(std::fs::read(&f.0).unwrap(), b"last-good");
    }
    #[test]
    fn future_schema_not_migrated() {
        let f = Fixture::new();
        let db = Connection::open(&f.0).unwrap();
        db.execute_batch("PRAGMA user_version=99;").unwrap();
        drop(db);
        let before = std::fs::read(&f.0).unwrap();
        assert!(Store::open(&f.0).is_err());
        assert_eq!(std::fs::read(&f.0).unwrap(), before);
    }
    #[test]
    fn malformed_catalog_fails_before_seed() {
        assert!(catalog("{}").is_err());
        let bad = CATALOG.replacen("\"schema\": 1", "\"schema\": 2", 1);
        assert!(catalog(&bad).is_err());
    }
    #[test]
    fn write_failure_preserves_last_good() {
        let f = Fixture::new();
        let mut s = Store::create(&f.0).unwrap();
        let v = sample();
        s.assign(&v).unwrap();
        s.db.execute_batch("PRAGMA query_only=ON").unwrap();
        let mut next = sample();
        next.label = "new".into();
        assert!(s.assign(&next).is_err());
        assert_eq!(s.soundtrack(&v.theme_id, &v.room_id).unwrap(), Some(v));
    }
}

#[cfg(test)]
mod youtube_tests {
    use super::*;
    #[test]
    fn public_youtube_ids_only() {
        let mut v = Soundtrack {
            theme_id: "t".into(),
            room_id: "r".into(),
            provider: "youtube".into(),
            url: "https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=PL_public-123".into(),
            label: "Music".into(),
        };
        assert!(validate_soundtrack(&v).is_ok());
        for tail in [
            "?token=secret",
            "?v=valid&v=other",
            "?v=",
            "?list=bad%20id",
            "?v=valid&auth=secret",
        ] {
            v.url = format!("https://music.youtube.com/watch{tail}");
            assert!(validate_soundtrack(&v).is_err());
        }
    }
}

/// Counts only. No unapproved row contents or arbitrary source metadata are returned.
#[derive(Debug, Serialize)]
pub struct LegacyReport {
    /// Count-only accounting of known source tables; never raw row payloads.
    pub source_table_rows: std::collections::BTreeMap<String, i64>,
    pub unknown_source_tables: usize,
    pub source_catalog_rows_not_copied: i64,
    pub lossless_migration: bool,
    pub reviewed_themes: usize,
    pub reviewed_rooms: usize,
    pub soundtracks: usize,
    pub skipped_unreviewed_themes: usize,
    pub skipped_unreviewed_rooms: usize,
    pub skipped_unreviewed_soundtracks: usize,
    pub skipped_metadata_rows: i64,
    pub skipped_assignment_metadata_rows: usize,
}
fn legacy_snapshot(path: &Path) -> Result<(LegacyReport, Vec<metadata::NativeSoundtrack>)> {
    // A quiescent standalone SQLite backup is required; never ignore uncheckpointed WAL.
    for suffix in ["-wal", "-shm", "-journal"] {
        let mut side = path.as_os_str().to_os_string();
        side.push(suffix);
        if Path::new(&side).exists() {
            return Err(
                "Legacy file has journal/WAL sidecars; provide a quiescent SQLite backup".into(),
            );
        }
    }
    if std::fs::metadata(path)?.len() > 64 * 1024 * 1024 {
        return Err("Legacy database exceeds 64 MiB pilot limit".into());
    }
    // Read-only SQLite may still create shared-memory sidecars for a WAL-format file.
    // Refuse WAL headers even after checkpoint/close; never mutate the source to convert it.
    let mut header = [0u8; 20];
    std::io::Read::read_exact(&mut std::fs::File::open(path)?, &mut header)?;
    if &header[..16] != b"SQLite format 3\0" || header[18] != 1 || header[19] != 1 {
        return Err(
            "Legacy source must be a standalone rollback-journal SQLite backup, not WAL format"
                .into(),
        );
    }
    let db = Connection::open_with_flags(path, OpenFlags::SQLITE_OPEN_READ_ONLY)?;
    db.execute_batch("PRAGMA query_only=ON; PRAGMA trusted_schema=OFF; BEGIN;")?;
    let version: String = db.query_row(
        "SELECT value FROM metadata WHERE key='schema_version'",
        [],
        |r| r.get(0),
    )?;
    if version != "1" {
        return Err("Unsupported legacy metadata schema version".into());
    }
    let integrity: String = db.query_row("PRAGMA integrity_check", [], |r| r.get(0))?;
    if integrity != "ok" {
        return Err("Legacy integrity check failed".into());
    }
    // Verify actual source tables, not views or a guessed user_version convention.
    for table in ["metadata", "theme_packages", "rooms", "room_soundtracks"] {
        let kind: String = db.query_row(
            "SELECT type FROM sqlite_master WHERE name=?1",
            [table],
            |r| r.get(0),
        )?;
        if kind != "table" {
            return Err("Legacy source requires ordinary tables".into());
        }
    }
    let c = catalog(CATALOG)?;
    let themes: HashSet<_> = c.themes.iter().map(|t| t.id.as_str()).collect();
    let rooms: HashSet<_> = c
        .themes
        .iter()
        .flat_map(|t| t.rooms.iter().map(move |r| (t.id.as_str(), r.id.as_str())))
        .collect();
    let mut source_themes = HashSet::new();
    let mut source_rooms = HashSet::new();
    let mut report = LegacyReport {
        source_table_rows: std::collections::BTreeMap::new(),
        unknown_source_tables: 0,
        source_catalog_rows_not_copied: 0,
        lossless_migration: false,
        reviewed_themes: 0,
        reviewed_rooms: 0,
        soundtracks: 0,
        skipped_unreviewed_themes: 0,
        skipped_unreviewed_rooms: 0,
        skipped_unreviewed_soundtracks: 0,
        skipped_metadata_rows: 0,
        skipped_assignment_metadata_rows: 0,
    };
    for row in db
        .prepare("SELECT id FROM theme_packages")?
        .query_map([], |r| r.get::<_, String>(0))?
    {
        let id = row?;
        if themes.contains(id.as_str()) {
            report.reviewed_themes += 1
        } else {
            report.skipped_unreviewed_themes += 1
        }
        source_themes.insert(id);
    }
    for row in db
        .prepare("SELECT theme_id,id FROM rooms")?
        .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?
    {
        let (theme, id) = row?;
        if !source_themes.contains(&theme) {
            return Err("Legacy room has missing theme".into());
        }
        if rooms.contains(&(theme.as_str(), id.as_str())) {
            report.reviewed_rooms += 1
        } else if themes.contains(theme.as_str()) {
            return Err("Legacy reviewed theme has unknown or mismatched room".into());
        } else {
            report.skipped_unreviewed_rooms += 1
        }
        source_rooms.insert((theme, id));
    }
    let mut assignments = Vec::new();
    for row in db
        .prepare("SELECT theme_id,room_id FROM room_soundtracks")?
        .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?
    {
        let (theme, room) = row?;
        if !source_rooms.contains(&(theme.clone(), room.clone())) {
            return Err("Legacy soundtrack has missing or mismatched room".into());
        }
        if !rooms.contains(&(theme.as_str(), room.as_str())) {
            report.skipped_unreviewed_soundtracks += 1;
            continue;
        }
        let v=db.query_row("SELECT theme_id,room_id,provider,url,label,status,source_id,updated_at FROM room_soundtracks WHERE theme_id=?1 AND room_id=?2",params![theme,room],|r| Ok(metadata::NativeSoundtrack {assignment:metadata::NativeAssignment{theme_id:r.get(0)?,room_id:r.get(1)?,provider:r.get(2)?,url:r.get(3)?,label:r.get(4)?,status:r.get(5)?,source_id:r.get(6)?},updated_at:Some(r.get(7)?),updated_at_ms:None}))?;
        v.assignment.validate()?;
        metadata::validate_timestamp(v.updated_at.ok_or("Missing legacy timestamp")?)?;
        assignments.push(v);
        if assignments.len() > 1000 {
            return Err("Legacy assignments exceed pilot limit".into());
        }
    }
    report.soundtracks = assignments.len();
    report.skipped_assignment_metadata_rows = 0;
    for table in [
        "artist_worlds",
        "artist_districts",
        "artist_weather",
        "music_routes",
        "history",
    ] {
        let exists: i64 = db.query_row(
            "SELECT count(*) FROM sqlite_master WHERE type='table' AND name=?1",
            [table],
            |r| r.get(0),
        )?;
        if exists == 1 {
            report.skipped_metadata_rows +=
                db.query_row(&format!("SELECT count(*) FROM {table}"), [], |r| {
                    r.get::<_, i64>(0)
                })?;
        }
    }
    // Reconcile all actual source families. Catalog identity matching is not a
    // raw catalog migration: source descriptions/behavior/metadata remain there.
    const KNOWN: &[&str] = &[
        "metadata",
        "theme_packages",
        "rooms",
        "ecology_objects",
        "artist_worlds",
        "artist_districts",
        "artist_weather",
        "music_routes",
        "room_soundtracks",
        "history",
    ];
    let names: Vec<String> = db
        .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")?
        .query_map([], |r| r.get(0))?
        .collect::<rusqlite::Result<_>>()?;
    for table in KNOWN {
        if names.iter().any(|name| name == table) {
            let count: i64 =
                db.query_row(&format!("SELECT count(*) FROM {table}"), [], |r| r.get(0))?;
            report.source_table_rows.insert((*table).to_owned(), count);
            if matches!(*table, "theme_packages" | "rooms" | "ecology_objects") {
                report.source_catalog_rows_not_copied += count;
            }
        }
    }
    // Unknown identifiers can themselves contain private data; return only count.
    report.unknown_source_tables = names
        .iter()
        .filter(|name| !KNOWN.contains(&name.as_str()))
        .count();
    Ok((report, assignments))
}
pub fn inspect_legacy(path: &Path) -> Result<LegacyReport> {
    Ok(legacy_snapshot(path)?.0)
}
/// Explicit source -> new destination only. Catalog content always comes from reviewed Athena data.
pub fn import_legacy(source: &Path, destination: &Path) -> Result<LegacyReport> {
    let canonical_source = std::fs::canonicalize(source)?;
    let parent = destination
        .parent()
        .filter(|p| !p.as_os_str().is_empty())
        .unwrap_or(Path::new("."));
    let canonical_destination = std::fs::canonicalize(parent)?.join(
        destination
            .file_name()
            .ok_or("Destination requires a filename")?,
    );
    for suffix in ["", "-wal", "-shm", "-journal"] {
        let mut reserved = canonical_source.as_os_str().to_os_string();
        reserved.push(suffix);
        if canonical_destination == Path::new(&reserved) {
            return Err("Import destination must not be source or a source sidecar".into());
        }
    }
    if destination.exists() {
        return Err("Import destination already exists".into());
    }
    let (report, assignments) = legacy_snapshot(source)?;
    let mut store = Store::create(destination)?;
    store.migrate_history()?;
    store.migrate_soundtrack_metadata()?;
    let tx = store.db.transaction()?;
    for v in assignments {
        tx.execute(
            "INSERT INTO soundtracks VALUES(?1,?2,?3,?4,?5,?6,?7,?8)",
            params![
                v.assignment.theme_id,
                v.assignment.room_id,
                v.assignment.provider,
                v.assignment.url,
                v.assignment.label,
                v.assignment.status,
                v.assignment.source_id,
                v.updated_at
            ],
        )?;
    }
    tx.commit()?;
    store.summary()?;
    Ok(report)
}

pub mod backup;
impl Store {
    /// Saves one fully validated workspace atomically, without schema migration.
    pub fn migrate_backups(&mut self) -> Result<()> {
        let tx = self.db.transaction()?;
        let version: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if matches!(version, 2..=16) {
            return Ok(());
        }
        if version != 1 {
            return Err("Unsupported schema for backup migration".into());
        }
        tx.execute_batch("CREATE TABLE workspace_backup(singleton INTEGER PRIMARY KEY CHECK(singleton=1), json TEXT NOT NULL); PRAGMA user_version=2;")?;
        tx.commit()?;
        Ok(())
    }
    pub fn save_backup(&mut self, text: &str) -> Result<()> {
        let version: i64 = self.db.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if !matches!(version, 2..=16) {
            return Err("Run explicit upgrade-backups before saving workspace backups".into());
        }
        let encoded = backup::normalize(text)?;
        let tx = self
            .db
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let version: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        backup::require_storage_version(&encoded, version)?;
        tx.execute("INSERT INTO workspace_backup VALUES(1,?1) ON CONFLICT(singleton) DO UPDATE SET json=excluded.json",[&encoded])?;
        if matches!(version, 3..=16) {
            history::append(&tx, &encoded, "save", None)?;
        }
        tx.commit()?;
        Ok(())
    }
    pub fn load_backup(&self) -> Result<Option<String>> {
        let version: i64 = self.db.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if !matches!(version, 2..=16) {
            return Err("Run explicit upgrade-backups before loading workspace backups".into());
        }
        let value: Option<String> = self
            .db
            .query_row(
                "SELECT json FROM workspace_backup WHERE singleton=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        value
            .map(|v| {
                let normalized = backup::normalize(&v)?;
                backup::require_storage_version(&normalized, version)?;
                Ok(normalized)
            })
            .transpose()
    }
}

#[cfg(test)]
mod backup_write_failure {
    use super::*;
    #[test]
    fn rejected_write_retains_previous_backup() {
        let p = std::env::temp_dir().join(format!(
            "athena-backup-write-failure-{}.sqlite",
            std::process::id()
        ));
        let mut s = Store::create(&p).unwrap();
        let fixture = include_str!("../tests/fixtures/js-workspace.json");
        s.save_backup(fixture).unwrap();
        let previous = s.load_backup().unwrap();
        s.db.execute_batch("PRAGMA query_only=ON").unwrap();
        let next = fixture.replace("Workspace 🌙", "Changed name");
        assert!(s.save_backup(&next).is_err());
        assert_eq!(s.load_backup().unwrap(), previous);
        drop(s);
        std::fs::remove_file(p).unwrap();
    }
}

pub mod history;

pub mod metadata;

pub mod concurrency;

impl Store {
    pub fn migrate_transforms(&mut self) -> Result<()> {
        let tx = self
            .db
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let version: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if version >= 5 {
            return Ok(());
        }
        if version != 4 {
            return Err(
                "Run explicit upgrade-history and upgrade-soundtracks before upgrade-transforms"
                    .into(),
            );
        }
        let active: Option<String> = tx
            .query_row(
                "SELECT json FROM workspace_backup WHERE singleton=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        if let Some(text) = active {
            let normalized = backup::normalize(&text)?;
            backup::require_storage_version(&normalized, 4)?;
        }
        {
            let mut statement =
                tx.prepare("SELECT json,sha256 FROM workspace_revisions LIMIT 51")?;
            let rows = statement
                .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            if rows.len() > 50 {
                return Err("Unexpected revision count; preserve database for review".into());
            }
            for (text, digest) in rows {
                if concurrency::version(Some(&text)) != format!("\"{digest}\"") {
                    return Err("Revision integrity mismatch; upgrade not applied".into());
                }
                let normalized = backup::normalize(&text)?;
                backup::require_storage_version(&normalized, 4)?;
            }
        }
        tx.execute_batch("PRAGMA user_version=5;")?;
        tx.commit()?;
        Ok(())
    }
    pub fn migrate_scopes(&mut self) -> Result<()> {
        let tx = self
            .db
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let version: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if version >= 6 {
            return Ok(());
        }
        if version != 5 {
            return Err("Run explicit upgrade-transforms before upgrade-scopes".into());
        }
        let active: Option<String> = tx
            .query_row(
                "SELECT json FROM workspace_backup WHERE singleton=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        if let Some(text) = active {
            let normalized = backup::normalize(&text)?;
            backup::require_storage_version(&normalized, 5)?;
        }
        {
            let mut statement =
                tx.prepare("SELECT json,sha256 FROM workspace_revisions LIMIT 51")?;
            let rows = statement
                .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            if rows.len() > 50 {
                return Err("Unexpected revision count; preserve database for review".into());
            }
            for (text, digest) in rows {
                if concurrency::version(Some(&text)) != format!("\"{digest}\"") {
                    return Err("Revision integrity mismatch; upgrade not applied".into());
                }
                let normalized = backup::normalize(&text)?;
                backup::require_storage_version(&normalized, 5)?;
            }
        }
        tx.execute_batch("PRAGMA user_version=6;")?;
        tx.commit()?;
        Ok(())
    }
    pub fn migrate_environment(&mut self) -> Result<()> {
        let tx = self
            .db
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let version: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if version >= 7 {
            return Ok(());
        }
        if version != 6 {
            return Err("Run explicit upgrade-scopes before upgrade-environment".into());
        }
        let active: Option<String> = tx
            .query_row(
                "SELECT json FROM workspace_backup WHERE singleton=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        if let Some(text) = active {
            let normalized = backup::normalize(&text)?;
            backup::require_storage_version(&normalized, 6)?;
        }
        {
            let mut statement =
                tx.prepare("SELECT json,sha256 FROM workspace_revisions LIMIT 51")?;
            let rows = statement
                .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            if rows.len() > 50 {
                return Err("Unexpected revision count; preserve database for review".into());
            }
            for (text, digest) in rows {
                if concurrency::version(Some(&text)) != format!("\"{digest}\"") {
                    return Err("Revision integrity mismatch; upgrade not applied".into());
                }
                let normalized = backup::normalize(&text)?;
                backup::require_storage_version(&normalized, 6)?;
            }
        }
        tx.execute_batch("PRAGMA user_version=7;")?;
        tx.commit()?;
        Ok(())
    }
    pub fn migrate_targets(&mut self) -> Result<()> {
        let tx = self
            .db
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let version: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if version >= 8 {
            return Ok(());
        }
        if version != 7 {
            return Err("Run explicit upgrade-environment before upgrade-targets".into());
        }
        let active: Option<String> = tx
            .query_row(
                "SELECT json FROM workspace_backup WHERE singleton=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        if let Some(text) = active {
            let normalized = backup::normalize(&text)?;
            backup::require_storage_version(&normalized, 7)?;
        }
        {
            let mut statement =
                tx.prepare("SELECT json,sha256 FROM workspace_revisions LIMIT 51")?;
            let rows = statement
                .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            if rows.len() > 50 {
                return Err("Unexpected revision count; preserve database for review".into());
            }
            for (text, digest) in rows {
                if concurrency::version(Some(&text)) != format!("\"{digest}\"") {
                    return Err("Revision integrity mismatch; upgrade not applied".into());
                }
                let normalized = backup::normalize(&text)?;
                backup::require_storage_version(&normalized, 7)?;
            }
        }
        tx.execute_batch("PRAGMA user_version=8;")?;
        tx.commit()?;
        Ok(())
    }
    pub fn migrate_instances(&mut self) -> Result<()> {
        let tx = self
            .db
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let version: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if version >= 9 {
            return Ok(());
        }
        if version != 8 {
            return Err("Run explicit upgrade-targets before upgrade-instances".into());
        }
        let active: Option<String> = tx
            .query_row(
                "SELECT json FROM workspace_backup WHERE singleton=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        if let Some(text) = active {
            let normalized = backup::normalize(&text)?;
            backup::require_storage_version(&normalized, 8)?;
        }
        {
            let mut statement =
                tx.prepare("SELECT json,sha256 FROM workspace_revisions LIMIT 51")?;
            let rows = statement
                .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            if rows.len() > 50 {
                return Err("Unexpected revision count; preserve database for review".into());
            }
            for (text, digest) in rows {
                if concurrency::version(Some(&text)) != format!("\"{digest}\"") {
                    return Err("Revision integrity mismatch; upgrade not applied".into());
                }
                let normalized = backup::normalize(&text)?;
                backup::require_storage_version(&normalized, 8)?;
            }
        }
        tx.execute_batch("PRAGMA user_version=9;")?;
        tx.commit()?;
        Ok(())
    }
    pub fn migrate_appearance(&mut self) -> Result<()> {
        let tx = self
            .db
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let version: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if version >= 10 {
            return Ok(());
        }
        if version != 9 {
            return Err("Run explicit upgrade-instances before upgrade-appearance".into());
        }
        let active: Option<String> = tx
            .query_row(
                "SELECT json FROM workspace_backup WHERE singleton=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        if let Some(text) = active {
            let normalized = backup::normalize(&text)?;
            backup::require_storage_version(&normalized, 9)?;
        }
        {
            let mut statement =
                tx.prepare("SELECT json,sha256 FROM workspace_revisions LIMIT 51")?;
            let rows = statement
                .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            if rows.len() > 50 {
                return Err("Unexpected revision count; preserve database for review".into());
            }
            for (text, digest) in rows {
                if concurrency::version(Some(&text)) != format!("\"{digest}\"") {
                    return Err("Revision integrity mismatch; upgrade not applied".into());
                }
                let normalized = backup::normalize(&text)?;
                backup::require_storage_version(&normalized, 9)?;
            }
        }
        tx.execute_batch("PRAGMA user_version=10;")?;
        tx.commit()?;
        Ok(())
    }
    pub fn migrate_filters(&mut self) -> Result<()> {
        let tx = self
            .db
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let version: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if version >= 11 {
            return Ok(());
        }
        if version != 10 {
            return Err("Run explicit upgrade-appearance before upgrade-filters".into());
        }
        let active: Option<String> = tx
            .query_row(
                "SELECT json FROM workspace_backup WHERE singleton=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        if let Some(text) = active {
            let normalized = backup::normalize(&text)?;
            backup::require_storage_version(&normalized, 10)?;
        }
        {
            let mut statement =
                tx.prepare("SELECT json,sha256 FROM workspace_revisions LIMIT 51")?;
            let rows = statement
                .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            if rows.len() > 50 {
                return Err("Unexpected revision count; preserve database for review".into());
            }
            for (text, digest) in rows {
                if concurrency::version(Some(&text)) != format!("\"{digest}\"") {
                    return Err("Revision integrity mismatch; upgrade not applied".into());
                }
                let normalized = backup::normalize(&text)?;
                backup::require_storage_version(&normalized, 10)?;
            }
        }
        tx.execute_batch("PRAGMA user_version=11;")?;
        tx.commit()?;
        Ok(())
    }
    pub fn migrate_origins(&mut self) -> Result<()> {
        let tx = self
            .db
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let version: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if version >= 12 {
            return Ok(());
        }
        if version != 11 {
            return Err("Run explicit upgrade-filters before upgrade-origins".into());
        }
        let active: Option<String> = tx
            .query_row(
                "SELECT json FROM workspace_backup WHERE singleton=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        if let Some(text) = active {
            let normalized = backup::normalize(&text)?;
            backup::require_storage_version(&normalized, 11)?;
        }
        {
            let mut statement =
                tx.prepare("SELECT json,sha256 FROM workspace_revisions LIMIT 51")?;
            let rows = statement
                .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            if rows.len() > 50 {
                return Err("Unexpected revision count; preserve database for review".into());
            }
            for (text, digest) in rows {
                if concurrency::version(Some(&text)) != format!("\"{digest}\"") {
                    return Err("Revision integrity mismatch; upgrade not applied".into());
                }
                let normalized = backup::normalize(&text)?;
                backup::require_storage_version(&normalized, 11)?;
            }
        }
        tx.execute_batch("PRAGMA user_version=12;")?;
        tx.commit()?;
        Ok(())
    }
    pub fn migrate_environments(&mut self) -> Result<()> {
        let tx = self
            .db
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let version: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if version >= 13 {
            return Ok(());
        }
        if version != 12 {
            return Err("Run explicit upgrade-origins before upgrade-environments".into());
        }
        let active: Option<String> = tx
            .query_row(
                "SELECT json FROM workspace_backup WHERE singleton=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        if let Some(text) = active {
            let normalized = backup::normalize(&text)?;
            backup::require_storage_version(&normalized, 12)?;
        }
        {
            let mut statement =
                tx.prepare("SELECT json,sha256 FROM workspace_revisions LIMIT 51")?;
            let rows = statement
                .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            if rows.len() > 50 {
                return Err("Unexpected revision count; preserve database for review".into());
            }
            for (text, digest) in rows {
                if concurrency::version(Some(&text)) != format!("\"{digest}\"") {
                    return Err("Revision integrity mismatch; upgrade not applied".into());
                }
                let normalized = backup::normalize(&text)?;
                backup::require_storage_version(&normalized, 12)?;
            }
        }
        tx.execute_batch("PRAGMA user_version=13;")?;
        tx.commit()?;
        Ok(())
    }
    pub fn migrate_blend_modes(&mut self) -> Result<()> {
        let tx = self
            .db
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let version: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if version >= 14 {
            return Ok(());
        }
        if version != 13 {
            return Err("Run explicit upgrade-environments before upgrade-blend-modes".into());
        }
        let active: Option<String> = tx
            .query_row(
                "SELECT json FROM workspace_backup WHERE singleton=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        if let Some(text) = active {
            let normalized = backup::normalize(&text)?;
            backup::require_storage_version(&normalized, 13)?;
        }
        {
            let mut statement =
                tx.prepare("SELECT json,sha256 FROM workspace_revisions LIMIT 51")?;
            let rows = statement
                .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            if rows.len() > 50 {
                return Err("Unexpected revision count; preserve database for review".into());
            }
            for (text, digest) in rows {
                if concurrency::version(Some(&text)) != format!("\"{digest}\"") {
                    return Err("Revision integrity mismatch; upgrade not applied".into());
                }
                let normalized = backup::normalize(&text)?;
                backup::require_storage_version(&normalized, 13)?;
            }
        }
        tx.execute_batch("PRAGMA user_version=14;")?;
        tx.commit()?;
        Ok(())
    }
    pub fn migrate_cosmic_environment(&mut self) -> Result<()> {
        let tx = self
            .db
            .transaction_with_behavior(rusqlite::TransactionBehavior::Immediate)?;
        let version: i64 = tx.query_row("PRAGMA user_version", [], |r| r.get(0))?;
        if version >= 16 {
            return Ok(());
        }
        if version != 15 {
            return Err(
                "Run explicit upgrade-music-precision before upgrade-cosmic-environment".into(),
            );
        }
        let active: Option<String> = tx
            .query_row(
                "SELECT json FROM workspace_backup WHERE singleton=1",
                [],
                |r| r.get(0),
            )
            .optional()?;
        if let Some(text) = active {
            let normalized = backup::normalize(&text)?;
            backup::require_storage_version(&normalized, 15)?;
        }
        {
            let mut statement =
                tx.prepare("SELECT json,sha256 FROM workspace_revisions LIMIT 51")?;
            let rows = statement
                .query_map([], |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?)))?
                .collect::<rusqlite::Result<Vec<_>>>()?;
            if rows.len() > 50 {
                return Err("Unexpected revision count; preserve database for review".into());
            }
            for (text, digest) in rows {
                if concurrency::version(Some(&text)) != format!("\"{digest}\"") {
                    return Err("Revision integrity mismatch; upgrade not applied".into());
                }
                let normalized = backup::normalize(&text)?;
                backup::require_storage_version(&normalized, 15)?;
            }
        }
        tx.execute_batch("PRAGMA user_version=16;")?;
        tx.commit()?;
        Ok(())
    }
}

pub mod music_import;
