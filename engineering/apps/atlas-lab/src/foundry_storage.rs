//! Isolated Foundry persistence candidate. No HTTP route, frontend bridge,
//! provider request, credentials or desktop integration.
//! Reuses Athena's connection contract; callers explicitly choose the database.
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use serde::{Deserialize, Serialize};
use serde_json::value::RawValue;
use std::{
    fmt,
    path::Path,
    time::{SystemTime, UNIX_EPOCH},
};

const SCHEMA: &str = "1";
pub const MAX_HISTORY_BYTES: usize = 65_536;
pub const MAX_HISTORY_PAGE: usize = 200;

// Version 1 owns these exact table definitions. A colliding, partial, or modified
// schema is never adopted or stamped as ours. Future changes need a migration.
const TABLES: [(&str, &str); 3] = [
    (
        "foundry_storage_metadata",
        "CREATE TABLE foundry_storage_metadata (
      key TEXT PRIMARY KEY, value TEXT NOT NULL
    ) STRICT",
    ),
    (
        "foundry_room_soundtracks",
        "CREATE TABLE foundry_room_soundtracks (
      theme_id TEXT NOT NULL, room_id TEXT NOT NULL, provider TEXT NOT NULL,
      url TEXT NOT NULL, label TEXT NOT NULL, status TEXT NOT NULL,
      source_id TEXT, updated_at INTEGER NOT NULL CHECK(updated_at >= 0),
      PRIMARY KEY(theme_id,room_id)
    ) STRICT",
    ),
    (
        "foundry_history",
        "CREATE TABLE foundry_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL, payload_json TEXT NOT NULL,
      created_at INTEGER NOT NULL CHECK(created_at >= 0)
    ) STRICT",
    ),
];

#[derive(Debug)]
pub enum Error {
    Invalid(&'static str),
    Database(rusqlite::Error),
    UnsupportedSchema,
    Clock,
}
impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Invalid(message) => write!(f, "{message}"),
            Self::Database(error) => write!(f, "Foundry storage error: {error}"),
            Self::UnsupportedSchema => write!(f, "Unsupported Foundry storage schema"),
            Self::Clock => write!(
                f,
                "System clock cannot represent a nonnegative SQLite timestamp"
            ),
        }
    }
}
impl std::error::Error for Error {}
impl From<rusqlite::Error> for Error {
    fn from(value: rusqlite::Error) -> Self {
        Self::Database(value)
    }
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RoomSoundtrackInput {
    pub theme_id: String,
    pub room_id: String,
    pub provider: String,
    pub url: String,
    pub label: String,
    pub status: String,
    pub source_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct RoomSoundtrack {
    #[serde(flatten)]
    pub assignment: RoomSoundtrackInput,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEvent {
    // IDs remain decimal strings across a future browser JSON boundary.
    pub id_text: String,
    pub event_type: String,
    pub payload_json: String,
    pub created_at: i64,
}

pub struct FoundryStore {
    connection: Connection,
}
impl FoundryStore {
    pub fn open(path: &Path) -> Result<Self, Error> {
        let mut connection = Connection::open(path)?;
        crate::storage_connection::configure(&connection)?;
        let tx = connection.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let existing: i64 = tx.query_row(
            "SELECT count(*) FROM sqlite_schema WHERE name IN (?1,?2,?3)",
            params![TABLES[0].0, TABLES[1].0, TABLES[2].0],
            |row| row.get(0),
        )?;
        if existing == 0 {
            for (_, definition) in TABLES {
                tx.execute_batch(definition)?;
            }
            tx.execute(
                "INSERT INTO foundry_storage_metadata(key,value) VALUES('schema_version',?1)",
                [SCHEMA],
            )?;
        }
        verify_schema(&tx)?;
        let version: Option<String> = tx
            .query_row(
                "SELECT value FROM foundry_storage_metadata WHERE key='schema_version'",
                [],
                |row| row.get(0),
            )
            .optional()?;
        if version.as_deref() != Some(SCHEMA) {
            return Err(Error::UnsupportedSchema);
        }
        tx.commit()?;
        Ok(Self { connection })
    }

    /// Original command semantics: replace this room's mapping; no implicit audit event.
    pub fn assign_room_soundtrack(
        &mut self,
        input: RoomSoundtrackInput,
    ) -> Result<RoomSoundtrack, Error> {
        self.assign(input, false)
    }

    /// Optional extension: mapping and audit event commit together, or neither does.
    pub fn assign_with_history(
        &mut self,
        input: RoomSoundtrackInput,
    ) -> Result<RoomSoundtrack, Error> {
        self.assign(input, true)
    }

    fn assign(
        &mut self,
        mut input: RoomSoundtrackInput,
        audit: bool,
    ) -> Result<RoomSoundtrack, Error> {
        validate_assignment(&mut input)?;
        let updated_at = now()?;
        let result = RoomSoundtrack {
            assignment: input,
            updated_at,
        };
        let a = &result.assignment;
        let payload = if audit {
            Some(
                serde_json::to_string(&result)
                    .map_err(|_| Error::Invalid("Assignment serialization failed"))?,
            )
        } else {
            None
        };
        let tx = self
            .connection
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        tx.execute(
            "INSERT INTO foundry_room_soundtracks(theme_id,room_id,provider,url,label,status,source_id,updated_at)
             VALUES(?1,?2,?3,?4,?5,?6,?7,?8)
             ON CONFLICT(theme_id,room_id) DO UPDATE SET provider=excluded.provider,url=excluded.url,
             label=excluded.label,status=excluded.status,source_id=excluded.source_id,updated_at=excluded.updated_at",
            params![a.theme_id,a.room_id,a.provider,a.url,a.label,a.status,a.source_id,result.updated_at]
        )?;
        if let Some(payload) = payload {
            insert_history(&tx, "room_soundtrack_assigned", &payload, updated_at)?;
        }
        tx.commit()?;
        Ok(result)
    }

    pub fn room_soundtrack(
        &self,
        theme_id: &str,
        room_id: &str,
    ) -> Result<Option<RoomSoundtrack>, Error> {
        text(theme_id, 128, "Invalid theme ID")?;
        text(room_id, 256, "Invalid room ID")?;
        Ok(self.connection.query_row(
            "SELECT theme_id,room_id,provider,url,label,status,source_id,updated_at FROM foundry_room_soundtracks WHERE theme_id=?1 AND room_id=?2",
            params![theme_id,room_id],
            |row| Ok(RoomSoundtrack { assignment: RoomSoundtrackInput {
                theme_id:row.get(0)?,room_id:row.get(1)?,provider:row.get(2)?,url:row.get(3)?,
                label:row.get(4)?,status:row.get(5)?,source_id:row.get(6)?
            },updated_at:row.get(7)? })
        ).optional()?)
    }

    /// Retains the caller's exact validated JSON bytes, including unknown fields,
    /// formatting, Unicode, and integers wider than a browser's safe integer range.
    pub fn record_native_history(
        &mut self,
        event_type: &str,
        payload_json: &str,
    ) -> Result<HistoryEvent, Error> {
        text(event_type, 128, "Invalid history event type")?;
        if payload_json.len() > MAX_HISTORY_BYTES {
            return Err(Error::Invalid("History payload exceeds 64 KiB"));
        }
        serde_json::from_str::<Box<RawValue>>(payload_json)
            .map_err(|_| Error::Invalid("History payload is not valid JSON"))?;
        let created_at = now()?;
        let tx = self
            .connection
            .transaction_with_behavior(TransactionBehavior::Immediate)?;
        let id = insert_history(&tx, event_type, payload_json, created_at)?;
        tx.commit()?;
        Ok(HistoryEvent {
            id_text: id.to_string(),
            event_type: event_type.into(),
            payload_json: payload_json.into(),
            created_at,
        })
    }

    pub fn history_after(&self, after_id: i64, limit: usize) -> Result<Vec<HistoryEvent>, Error> {
        if after_id < 0 || !(1..=MAX_HISTORY_PAGE).contains(&limit) {
            return Err(Error::Invalid("Invalid bounded history page"));
        }
        let mut statement = self.connection.prepare("SELECT id,event_type,payload_json,created_at FROM foundry_history WHERE id>?1 ORDER BY id LIMIT ?2")?;
        let records = statement
            .query_map(params![after_id, limit as i64], |row| {
                Ok(HistoryEvent {
                    id_text: row.get::<_, i64>(0)?.to_string(),
                    event_type: row.get(1)?,
                    payload_json: row.get(2)?,
                    created_at: row.get(3)?,
                })
            })?
            .collect::<Result<Vec<_>, _>>()?;
        Ok(records)
    }
}

fn verify_schema(c: &Connection) -> Result<(), Error> {
    // Definitions contain no quoted literals; whitespace/case normalization does
    // not erase the constraints, STRICT flag, keys, types, or AUTOINCREMENT.
    let normalized = |sql: &str| {
        sql.trim_end_matches(';')
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ")
            .to_ascii_lowercase()
    };
    for (name, expected) in TABLES {
        let actual: Option<String> = c
            .query_row(
                "SELECT sql FROM sqlite_schema WHERE name=?1 AND type='table'",
                [name],
                |row| row.get(0),
            )
            .optional()?;
        if actual.as_deref().map(normalized) != Some(normalized(expected)) {
            return Err(Error::UnsupportedSchema);
        }
        let extras: i64 = c.query_row(
            "SELECT count(*) FROM sqlite_schema WHERE tbl_name=?1 AND type IN ('trigger','index') AND sql IS NOT NULL", [name], |row| row.get(0)
        )?;
        if extras != 0 {
            return Err(Error::UnsupportedSchema);
        }
    }
    Ok(())
}

fn insert_history(c: &Connection, event_type: &str, payload: &str, at: i64) -> Result<i64, Error> {
    c.execute(
        "INSERT INTO foundry_history(event_type,payload_json,created_at) VALUES(?1,?2,?3)",
        params![event_type, payload, at],
    )?;
    Ok(c.last_insert_rowid())
}
fn now() -> Result<i64, Error> {
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|_| Error::Clock)?
        .as_secs();
    i64::try_from(secs).map_err(|_| Error::Clock)
}
fn text(value: &str, max: usize, reason: &'static str) -> Result<(), Error> {
    if value.trim().is_empty() || value.len() > max || value.chars().any(char::is_control) {
        return Err(Error::Invalid(reason));
    }
    Ok(())
}
fn validate_assignment(a: &mut RoomSoundtrackInput) -> Result<(), Error> {
    text(&a.theme_id, 128, "Invalid theme ID")?;
    text(&a.room_id, 256, "Invalid room ID")?;
    text(&a.label, 512, "Invalid soundtrack label")?;
    text(&a.status, 64, "Invalid soundtrack status")?;
    if let Some(id) = &a.source_id {
        text(id, 256, "Invalid source ID")?;
    }
    text(&a.url, 2048, "Invalid soundtrack URL")?;
    let url = reqwest::Url::parse(&a.url).map_err(|_| Error::Invalid("Invalid soundtrack URL"))?;
    let host = url
        .host_str()
        .ok_or(Error::Invalid("Soundtrack URL has no host"))?;
    let permitted = match a.provider.as_str() {
        "spotify" => host == "open.spotify.com",
        "apple" => host == "music.apple.com",
        "deezer" => matches!(host, "deezer.com" | "www.deezer.com"),
        "soundcloud" => matches!(host, "soundcloud.com" | "www.soundcloud.com"),
        "tidal" => matches!(host, "tidal.com" | "listen.tidal.com"),
        "youtube" => host == "music.youtube.com",
        _ => false,
    };
    if !permitted
        || url.scheme() != "https"
        || !url.username().is_empty()
        || url.password().is_some()
        || url.port_or_known_default() != Some(443)
    {
        return Err(Error::Invalid(
            "URL must use HTTPS on the selected provider's exact host without username or password",
        ));
    }
    let canonical = url.to_string();
    text(
        &canonical,
        2048,
        "Canonical soundtrack URL exceeds the supported bound",
    )?;
    a.url = canonical;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    fn path(name: &str) -> std::path::PathBuf {
        let root = std::env::temp_dir().join(format!(
            "athena-foundry-{name}-{}-{}",
            std::process::id(),
            SystemTime::now()
                .duration_since(UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        std::fs::create_dir(&root).unwrap();
        root.join("synthetic.sqlite")
    }
    fn input() -> RoomSoundtrackInput {
        RoomSoundtrackInput {
            theme_id: "synthetic.theme".into(),
            room_id: "synthetic.room".into(),
            provider: "spotify".into(),
            url: "https://open.spotify.com/playlist/synthetic".into(),
            label: "Synthetic room soundtrack 雪".into(),
            status: "unverified-fixture".into(),
            source_id: Some("fixture.route".into()),
        }
    }
    const RAW: &str = " \n{\"unknown\":18446744073709551617,\"zero\":-0,\"markup\":\"<script>inert</script> 雪\",\"duplicate\":1,\"duplicate\":2} \n";

    #[test]
    fn colliding_history_without_metadata_is_not_adopted_or_stamped() {
        let p = path("collision");
        let c = Connection::open(&p).unwrap();
        c.execute_batch("CREATE TABLE foundry_history(id INTEGER,event_type TEXT,payload_json TEXT,created_at INTEGER); INSERT INTO foundry_history VALUES(NULL,'legacy','{}',0);").unwrap();
        drop(c);
        assert!(matches!(
            FoundryStore::open(&p),
            Err(Error::UnsupportedSchema)
        ));
        let c = Connection::open(&p).unwrap();
        assert_eq!(
            c.query_row("SELECT count(*) FROM foundry_history", [], |r| r
                .get::<_, i64>(0))
                .unwrap(),
            1
        );
        assert_eq!(c.query_row("SELECT count(*) FROM sqlite_schema WHERE name IN ('foundry_storage_metadata','foundry_room_soundtracks')",[],|r|r.get::<_,i64>(0)).unwrap(),0);
    }
    #[test]
    fn version_one_does_not_authorize_changed_tables_indexes_or_triggers() {
        for alteration in [
            "ALTER TABLE foundry_history RENAME TO preserved_history; CREATE TABLE foundry_history(id INTEGER,event_type TEXT,payload_json TEXT,created_at INTEGER);",
            "CREATE INDEX unexpected_foundry_index ON foundry_history(event_type);",
            "CREATE TRIGGER unexpected_foundry_trigger AFTER INSERT ON foundry_history BEGIN UPDATE foundry_history SET id=NULL WHERE rowid=NEW.rowid; END;",
            "DELETE FROM foundry_storage_metadata WHERE key='schema_version';",
        ] {
            let p = path("shape");
            let mut s = FoundryStore::open(&p).unwrap();
            s.record_native_history("preserved", "{}").unwrap();
            drop(s);
            let c = Connection::open(&p).unwrap();
            c.execute_batch(alteration).unwrap();
            let before=c.query_row("SELECT group_concat(name||'='||coalesce(sql,''),'|') FROM (SELECT * FROM sqlite_schema ORDER BY name)",[],|r|r.get::<_,String>(0)).unwrap();
            drop(c);
            assert!(
                matches!(FoundryStore::open(&p), Err(Error::UnsupportedSchema)),
                "{alteration}"
            );
            let c = Connection::open(&p).unwrap();
            let after=c.query_row("SELECT group_concat(name||'='||coalesce(sql,''),'|') FROM (SELECT * FROM sqlite_schema ORDER BY name)",[],|r|r.get::<_,String>(0)).unwrap();
            assert_eq!(before, after);
        }
    }
    #[test]
    fn url_limit_applies_after_percent_encoding_without_replacing_last_good() {
        let mut s = FoundryStore::open(&path("encoded-url")).unwrap();
        let good = s.assign_room_soundtrack(input()).unwrap();
        let mut a = input();
        a.url = format!("https://open.spotify.com/{}", "é".repeat(400));
        assert!(a.url.len() < 2048);
        assert!(reqwest::Url::parse(&a.url).unwrap().as_str().len() > 2048);
        assert!(s.assign_room_soundtrack(a).is_err());
        assert_eq!(
            s.room_soundtrack("synthetic.theme", "synthetic.room")
                .unwrap(),
            Some(good)
        );
        let mut a = input();
        let prefix = "https://open.spotify.com/";
        a.url = format!("{prefix}{}", "x".repeat(2048 - prefix.len()));
        assert_eq!(
            s.assign_room_soundtrack(a).unwrap().assignment.url.len(),
            2048
        );
    }

    #[test]
    fn assignment_roundtrip_upsert_and_missing_room() {
        let p = path("assignment");
        let mut s = FoundryStore::open(&p).unwrap();
        assert_eq!(
            s.room_soundtrack("synthetic.theme", "missing").unwrap(),
            None
        );
        let first = s.assign_room_soundtrack(input()).unwrap();
        assert_eq!(
            s.room_soundtrack("synthetic.theme", "synthetic.room")
                .unwrap(),
            Some(first)
        );
        let mut changed = input();
        changed.label = "Changed 雪".into();
        changed.source_id = None;
        let second = s.assign_room_soundtrack(changed).unwrap();
        drop(s);
        let s = FoundryStore::open(&p).unwrap();
        assert_eq!(
            s.room_soundtrack("synthetic.theme", "synthetic.room")
                .unwrap(),
            Some(second)
        );
        assert!(s.history_after(0, 200).unwrap().is_empty());
        assert_eq!(
            s.connection
                .query_row("SELECT count(*) FROM foundry_room_soundtracks", [], |r| r
                    .get::<_, i64>(
                    0
                ))
                .unwrap(),
            1
        );
    }
    #[test]
    fn six_original_providers_are_supported_without_contacting_them() {
        let mut s = FoundryStore::open(&path("providers")).unwrap();
        for (provider, host) in [
            ("spotify", "open.spotify.com"),
            ("apple", "music.apple.com"),
            ("deezer", "www.deezer.com"),
            ("soundcloud", "soundcloud.com"),
            ("tidal", "listen.tidal.com"),
            ("youtube", "music.youtube.com"),
        ] {
            let mut a = input();
            a.provider = provider.into();
            a.url = format!("https://{host}/synthetic");
            assert_eq!(s.assign_room_soundtrack(a.clone()).unwrap().assignment, a);
        }
    }
    #[test]
    fn invalid_urls_and_fields_preserve_last_good_assignment() {
        let mut s = FoundryStore::open(&path("reject")).unwrap();
        let good = s.assign_room_soundtrack(input()).unwrap();
        for url in [
            "http://open.spotify.com/x",
            "https://open.spotify.com.evil.invalid/x",
            "https://user:password@open.spotify.com/x",
            "https://open.spotify.com:8443/x",
            "file:///fixture",
            "https://music.apple.com/x",
            "https://127.0.0.1/x",
        ] {
            let mut a = input();
            a.url = url.into();
            assert!(s.assign_room_soundtrack(a).is_err(), "{url}");
        }
        let mut variants = Vec::new();
        let mut a = input();
        a.label = " ".into();
        variants.push(a);
        let mut a = input();
        a.status = "x".repeat(65);
        variants.push(a);
        let mut a = input();
        a.room_id = "control\n".into();
        variants.push(a);
        let mut a = input();
        a.provider = "unknown".into();
        variants.push(a);
        let mut a = input();
        a.source_id = Some("x".repeat(257));
        variants.push(a);
        for a in variants {
            assert!(s.assign_room_soundtrack(a).is_err());
        }
        assert_eq!(
            s.room_soundtrack("synthetic.theme", "synthetic.room")
                .unwrap(),
            Some(good)
        );
    }
    #[test]
    fn raw_history_preserves_exact_bytes_and_append_order() {
        let p = path("history");
        let mut s = FoundryStore::open(&p).unwrap();
        let a = s.record_native_history("synthetic.event", RAW).unwrap();
        let b = s
            .record_native_history("synthetic.event", "[1,true,null]")
            .unwrap();
        drop(s);
        let s = FoundryStore::open(&p).unwrap();
        assert_eq!(s.history_after(0, 1).unwrap(), vec![a.clone()]);
        assert_eq!(
            s.history_after(a.id_text.parse().unwrap(), 200).unwrap(),
            vec![b]
        );
        assert_eq!(a.payload_json.as_bytes(), RAW.as_bytes());
    }
    #[test]
    fn history_rejects_invalid_oversized_and_unbounded_queries_without_write() {
        let mut s = FoundryStore::open(&path("history-reject")).unwrap();
        for raw in [
            "".to_string(),
            "{invalid}".into(),
            "{} trailing".into(),
            format!("\"{}\"", "x".repeat(MAX_HISTORY_BYTES)),
        ] {
            assert!(s.record_native_history("synthetic", &raw).is_err());
        }
        for event in ["", "  ", "bad\n"] {
            assert!(s.record_native_history(event, "{}").is_err());
        }
        assert!(s.history_after(-1, 1).is_err());
        assert!(s.history_after(0, 0).is_err());
        assert!(s.history_after(0, MAX_HISTORY_PAGE + 1).is_err());
        assert!(s.history_after(0, 1).unwrap().is_empty());
    }
    #[test]
    fn exact_history_size_boundary_is_accepted() {
        let mut s = FoundryStore::open(&path("history-limit")).unwrap();
        let raw = format!("\"{}\"", "x".repeat(MAX_HISTORY_BYTES - 2));
        assert_eq!(
            s.record_native_history("synthetic", &raw)
                .unwrap()
                .payload_json
                .len(),
            MAX_HISTORY_BYTES
        );
    }
    #[test]
    fn atomic_assignment_and_history_rollback_together() {
        let mut s = FoundryStore::open(&path("atomic")).unwrap();
        let good = s.assign_with_history(input()).unwrap();
        let before = s.history_after(0, 200).unwrap();
        assert_eq!(before.len(), 1);
        assert_eq!(
            serde_json::from_str::<RoomSoundtrack>(&before[0].payload_json).unwrap(),
            good
        );
        s.connection.execute_batch("CREATE TRIGGER fail_history BEFORE INSERT ON foundry_history BEGIN SELECT RAISE(ABORT,'synthetic history failure'); END;").unwrap();
        let mut a = input();
        a.label = "Should rollback".into();
        assert!(s.assign_with_history(a).is_err());
        assert_eq!(
            s.room_soundtrack("synthetic.theme", "synthetic.room")
                .unwrap(),
            Some(good)
        );
        assert_eq!(s.history_after(0, 200).unwrap(), before);
    }
    #[test]
    fn unrelated_tables_and_existing_wal_mode_are_preserved() {
        let p = path("coexist");
        let c = Connection::open(&p).unwrap();
        c.execute_batch("PRAGMA journal_mode=WAL;CREATE TABLE history(x BLOB);INSERT INTO history VALUES(x'00ff01');CREATE TABLE snapshots(x TEXT);INSERT INTO snapshots VALUES('keep');").unwrap();
        drop(c);
        let mut s = FoundryStore::open(&p).unwrap();
        s.assign_with_history(input()).unwrap();
        assert_eq!(
            s.connection
                .query_row("PRAGMA journal_mode", [], |r| r.get::<_, String>(0))
                .unwrap(),
            "wal"
        );
        assert_eq!(
            s.connection
                .query_row("PRAGMA synchronous", [], |r| r.get::<_, i64>(0))
                .unwrap(),
            3
        );
        assert_eq!(
            s.connection
                .query_row("SELECT x FROM history", [], |r| r.get::<_, Vec<u8>>(0))
                .unwrap(),
            vec![0, 255, 1]
        );
        assert_eq!(
            s.connection
                .query_row("SELECT x FROM snapshots", [], |r| r.get::<_, String>(0))
                .unwrap(),
            "keep"
        );
    }
    #[test]
    fn schema_version_is_not_silently_overwritten() {
        let p = path("version");
        let c = Connection::open(&p).unwrap();
        c.execute_batch("CREATE TABLE foundry_storage_metadata(key TEXT PRIMARY KEY,value TEXT);INSERT INTO foundry_storage_metadata VALUES('schema_version','99');").unwrap();
        drop(c);
        assert!(matches!(
            FoundryStore::open(&p),
            Err(Error::UnsupportedSchema)
        ));
        let c = Connection::open(&p).unwrap();
        assert_eq!(
            c.query_row(
                "SELECT value FROM foundry_storage_metadata WHERE key='schema_version'",
                [],
                |r| r.get::<_, String>(0)
            )
            .unwrap(),
            "99"
        );
        assert_eq!(
            c.query_row(
                "SELECT count(*) FROM sqlite_master WHERE name='foundry_history'",
                [],
                |r| r.get::<_, i64>(0)
            )
            .unwrap(),
            0
        );
    }
    #[test]
    fn sql_shaped_identifiers_are_data_and_ids_are_safe_decimal_strings() {
        let mut s = FoundryStore::open(&path("bound-data")).unwrap();
        let mut a = input();
        a.room_id = "'; DROP TABLE foundry_history; --".into();
        let saved = s.assign_room_soundtrack(a.clone()).unwrap();
        assert_eq!(
            s.room_soundtrack(&a.theme_id, &a.room_id).unwrap(),
            Some(saved)
        );
        s.connection.execute("INSERT INTO foundry_history(id,event_type,payload_json,created_at) VALUES(?1,'fixture','{}',0)",[9_007_199_254_740_992_i64]).unwrap();
        let event = s.record_native_history("fixture", RAW).unwrap();
        assert_eq!(event.id_text, "9007199254740993");
        assert!(
            serde_json::to_string(&event)
                .unwrap()
                .contains("\"idText\":\"9007199254740993\"")
        );
    }
    #[test]
    fn four_writers_preserve_every_atomic_event_and_composite_room_key() {
        let p = path("writers");
        let stores = (0..4)
            .map(|_| FoundryStore::open(&p).unwrap())
            .collect::<Vec<_>>();
        let barrier = std::sync::Arc::new(std::sync::Barrier::new(4));
        let threads = stores
            .into_iter()
            .enumerate()
            .map(|(i, mut store)| {
                let barrier = barrier.clone();
                std::thread::spawn(move || {
                    barrier.wait();
                    for iteration in 0..12 {
                        let mut a = input();
                        a.theme_id = format!("synthetic.theme.{i}");
                        a.label = format!("synthetic update {iteration}");
                        store.assign_with_history(a).unwrap();
                    }
                })
            })
            .collect::<Vec<_>>();
        for worker in threads {
            worker.join().unwrap();
        }
        let store = FoundryStore::open(&p).unwrap();
        let events = store.history_after(0, 200).unwrap();
        assert_eq!(events.len(), 48);
        for (i, event) in events.iter().enumerate() {
            assert_eq!(event.id_text, (i + 1).to_string());
        }
        for i in 0..4 {
            assert_eq!(
                store
                    .room_soundtrack(&format!("synthetic.theme.{i}"), "synthetic.room")
                    .unwrap()
                    .unwrap()
                    .assignment
                    .label,
                "synthetic update 11"
            );
        }
        assert_eq!(
            store
                .connection
                .query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))
                .unwrap(),
            "ok"
        );
    }
    #[test]
    fn independent_process_reopen_retains_exact_committed_state() {
        let p = path("process");
        let status = std::process::Command::new(std::env::current_exe().unwrap())
            .args([
                "--exact",
                "foundry_storage::tests::subprocess_writer",
                "--nocapture",
            ])
            .env("ATHENA_FOUNDRY_SYNTHETIC_TEST_DB", &p)
            .status()
            .unwrap();
        assert!(status.success());
        let s = FoundryStore::open(&p).unwrap();
        assert_eq!(
            s.room_soundtrack("synthetic.theme", "synthetic.room")
                .unwrap()
                .unwrap()
                .assignment,
            input()
        );
        assert_eq!(s.history_after(0, 200).unwrap()[1].payload_json, RAW);
        assert_eq!(
            s.connection
                .query_row("PRAGMA integrity_check", [], |r| r.get::<_, String>(0))
                .unwrap(),
            "ok"
        );
    }
    #[test]
    fn subprocess_writer() {
        let Ok(p) = std::env::var("ATHENA_FOUNDRY_SYNTHETIC_TEST_DB") else {
            return;
        };
        let mut s = FoundryStore::open(Path::new(&p)).unwrap();
        s.assign_with_history(input()).unwrap();
        s.record_native_history("synthetic.process", RAW).unwrap();
    }
}

#[path = "foundry_catalog.rs"]
mod catalog;
pub use catalog::{CatalogSummary, MAX_CATALOG_BYTES, MusicRoute};
