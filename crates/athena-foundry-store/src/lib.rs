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
        let file = std::fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(path)?;
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
        if version != 1 {
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
            schema: 1,
            themes: count("SELECT count(*) FROM themes")?,
            rooms: count("SELECT count(*) FROM rooms")?,
            objects: count("SELECT count(*) FROM objects")?,
            soundtracks: count("SELECT count(*) FROM soundtracks")?,
            integrity,
        })
    }
    pub fn assign(&mut self, value: &Soundtrack) -> Result<()> {
        validate_soundtrack(value)?;
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
        if v.provider != "youtube" {
            return Err("Unexpected provider URL parameters".into());
        }
        let mut keys = HashSet::new();
        for (key, value) in u.query_pairs() {
            if !matches!(key.as_ref(), "v" | "list")
                || !keys.insert(key.to_string())
                || value.is_empty()
                || value.len() > 128
                || !value
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
            {
                return Err("Only public YouTube video/playlist IDs are accepted".into());
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
