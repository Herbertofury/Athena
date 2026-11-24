use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{fs, path::PathBuf, time::{SystemTime, UNIX_EPOCH}};
use tauri::{AppHandle, Manager};
use url::Url;

const SCHEMA_VERSION: i64 = 1;
const V33_PACKAGES: &str = include_str!("../../src/data/theme-world-packages.json");
const ARTIST_WORLDS: &str = include_str!("../../src/data/artist-worlds-v4.0.1.json");

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogSummary {
    pub schema_version: i64,
    pub sqlite_version: String,
    pub durable_themes: i64,
    pub durable_rooms: i64,
    pub durable_objects: i64,
    pub artist_worlds: i64,
    pub artist_districts: i64,
    pub artist_music_routes: i64,
    pub room_soundtrack_assignments: i64,
    pub integrity: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MusicRoute {
    pub id: String,
    pub artist_id: String,
    pub label: String,
    pub routing: String,
    pub spotify_uri: String,
    pub url: String,
    pub status: String,
    pub notes: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RoomSoundtrackInput {
    pub theme_id: String,
    pub room_id: String,
    pub provider: String,
    pub url: String,
    pub label: String,
    pub status: String,
    pub source_id: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RoomSoundtrack {
    pub theme_id: String,
    pub room_id: String,
    pub provider: String,
    pub url: String,
    pub label: String,
    pub status: String,
    pub source_id: Option<String>,
    pub updated_at: i64,
}

fn database_path(app: &AppHandle) -> Result<PathBuf, String> {
    let directory = app.path().app_data_dir().map_err(|error| format!("Unable to resolve application data directory: {error}"))?;
    fs::create_dir_all(&directory).map_err(|error| format!("Unable to create application data directory: {error}"))?;
    Ok(directory.join("feature-foundry.sqlite3"))
}

fn connect(app: &AppHandle) -> Result<Connection, String> {
    let connection = Connection::open(database_path(app)?).map_err(|error| format!("Unable to open Feature Foundry database: {error}"))?;
    connection.pragma_update(None, "foreign_keys", "ON").map_err(|error| format!("Unable to enable foreign keys: {error}"))?;
    connection.pragma_update(None, "journal_mode", "WAL").map_err(|error| format!("Unable to enable WAL persistence: {error}"))?;
    connection.pragma_update(None, "synchronous", "NORMAL").map_err(|error| format!("Unable to set SQLite durability mode: {error}"))?;
    Ok(connection)
}

pub fn initialize(app: &AppHandle) -> Result<(), String> {
    let mut connection = connect(app)?;
    connection.execute_batch(
        "BEGIN;
         CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
         CREATE TABLE IF NOT EXISTS theme_packages (
           id TEXT PRIMARY KEY, name TEXT NOT NULL, package_version TEXT NOT NULL, approved INTEGER NOT NULL,
           world_name TEXT NOT NULL, material_language TEXT NOT NULL, motion TEXT NOT NULL, raw_json TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS rooms (
           id TEXT PRIMARY KEY, theme_id TEXT NOT NULL, district_id TEXT NOT NULL, name TEXT NOT NULL,
           lineage TEXT NOT NULL, raw_json TEXT NOT NULL
         );
         CREATE INDEX IF NOT EXISTS rooms_theme_idx ON rooms(theme_id);
         CREATE TABLE IF NOT EXISTS ecology_objects (
           id TEXT PRIMARY KEY, theme_id TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL,
           material TEXT NOT NULL, shape TEXT NOT NULL, affordances_json TEXT NOT NULL, behavior_json TEXT NOT NULL, raw_json TEXT NOT NULL
         );
         CREATE INDEX IF NOT EXISTS ecology_objects_theme_idx ON ecology_objects(theme_id);
         CREATE TABLE IF NOT EXISTS artist_worlds (
           id TEXT PRIMARY KEY, artist_id TEXT NOT NULL, name TEXT NOT NULL, variant TEXT NOT NULL,
           description TEXT NOT NULL, palette TEXT NOT NULL, material_language TEXT NOT NULL,
           shape_language TEXT NOT NULL, lighting TEXT NOT NULL, ui_language TEXT NOT NULL,
           mascot TEXT NOT NULL, guardrail TEXT NOT NULL, raw_json TEXT NOT NULL
         );
         CREATE INDEX IF NOT EXISTS artist_worlds_artist_idx ON artist_worlds(artist_id);
         CREATE TABLE IF NOT EXISTS artist_districts (
           id TEXT PRIMARY KEY, artist_id TEXT NOT NULL, name TEXT NOT NULL, thesis TEXT NOT NULL,
           environment_weather TEXT NOT NULL, best_use_mode TEXT NOT NULL, raw_json TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS artist_weather (
           id TEXT PRIMARY KEY, artist_id TEXT NOT NULL, name TEXT NOT NULL, intensity TEXT NOT NULL,
           behavior TEXT NOT NULL, routing TEXT NOT NULL, guardrails TEXT NOT NULL, raw_json TEXT NOT NULL
         );
         CREATE TABLE IF NOT EXISTS music_routes (
           id TEXT PRIMARY KEY, artist_id TEXT NOT NULL, label TEXT NOT NULL, routing TEXT NOT NULL,
           spotify_uri TEXT NOT NULL, url TEXT NOT NULL, status TEXT NOT NULL, notes TEXT NOT NULL, raw_json TEXT NOT NULL
         );
         CREATE INDEX IF NOT EXISTS music_routes_artist_idx ON music_routes(artist_id);
         CREATE TABLE IF NOT EXISTS room_soundtracks (
           theme_id TEXT NOT NULL, room_id TEXT NOT NULL, provider TEXT NOT NULL, url TEXT NOT NULL,
           label TEXT NOT NULL, status TEXT NOT NULL, source_id TEXT, updated_at INTEGER NOT NULL,
           PRIMARY KEY(theme_id, room_id)
         );
         CREATE TABLE IF NOT EXISTS history (
           id INTEGER PRIMARY KEY AUTOINCREMENT, event_type TEXT NOT NULL, payload_json TEXT NOT NULL, created_at INTEGER NOT NULL
         );
         COMMIT;"
    ).map_err(|error| format!("Unable to initialize Feature Foundry schema: {error}"))?;

    let transaction = connection.transaction().map_err(|error| format!("Unable to start catalog transaction: {error}"))?;
    transaction.execute("INSERT INTO metadata(key,value) VALUES('schema_version',?1) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [SCHEMA_VERSION.to_string()]).map_err(|error| error.to_string())?;
    transaction.execute("INSERT INTO metadata(key,value) VALUES('v33_source_sha256','83aac630afa4e6522d28452bb6a7c0ebe183eee6812b89b6d742662876af06ec') ON CONFLICT(key) DO NOTHING", []).map_err(|error| error.to_string())?;
    transaction.execute("INSERT INTO metadata(key,value) VALUES('artist_worlds_json_sha256','9865ef491c5baeec39702a0a6724df1bf9c9a29ed062a30e6bb6af270dd6b00a') ON CONFLICT(key) DO NOTHING", []).map_err(|error| error.to_string())?;

    let packages: Value = serde_json::from_str(V33_PACKAGES).map_err(|error| format!("Embedded V33 catalog is invalid: {error}"))?;
    for package in packages.as_array().ok_or("Embedded V33 catalog must be an array")? {
        let id = text_field(package, "id")?;
        let world_name = package.get("worlds").and_then(Value::as_array).and_then(|rows| rows.first()).and_then(|row| row.get("name")).and_then(Value::as_str).unwrap_or(id);
        transaction.execute(
            "INSERT INTO theme_packages(id,name,package_version,approved,world_name,material_language,motion,raw_json) VALUES(?1,?2,?3,?4,?5,?6,?7,?8)
             ON CONFLICT(id) DO UPDATE SET name=excluded.name,package_version=excluded.package_version,approved=excluded.approved,world_name=excluded.world_name,material_language=excluded.material_language,motion=excluded.motion,raw_json=excluded.raw_json",
            params![id, text_field(package,"name")?, text_field(package,"packageVersion")?, package.get("approved").and_then(Value::as_bool).unwrap_or(false), world_name, text_field(package,"materialLanguage")?, text_field(package,"motion")?, package.to_string()]
        ).map_err(|error| format!("Unable to seed theme package {id}: {error}"))?;
        for room in package.get("rooms").and_then(Value::as_array).into_iter().flatten() {
            transaction.execute(
                "INSERT INTO rooms(id,theme_id,district_id,name,lineage,raw_json) VALUES(?1,?2,?3,?4,'v33-runtime',?5)
                 ON CONFLICT(id) DO UPDATE SET theme_id=excluded.theme_id,district_id=excluded.district_id,name=excluded.name,lineage=excluded.lineage,raw_json=excluded.raw_json",
                params![text_field(room,"id")?, id, text_field(room,"districtId")?, text_field(room,"name")?, room.to_string()]
            ).map_err(|error| format!("Unable to seed room: {error}"))?;
        }
        for object in package.get("objects").and_then(Value::as_array).into_iter().flatten() {
            transaction.execute(
                "INSERT INTO ecology_objects(id,theme_id,name,role,material,shape,affordances_json,behavior_json,raw_json) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9)
                 ON CONFLICT(id) DO UPDATE SET theme_id=excluded.theme_id,name=excluded.name,role=excluded.role,material=excluded.material,shape=excluded.shape,affordances_json=excluded.affordances_json,behavior_json=excluded.behavior_json,raw_json=excluded.raw_json",
                params![text_field(object,"id")?, id, text_field(object,"name")?, text_field(object,"role")?, text_field(object,"material")?, text_field(object,"shape")?, object.get("affordances").unwrap_or(&Value::Null).to_string(), object.get("behavior").unwrap_or(&Value::Null).to_string(), object.to_string()]
            ).map_err(|error| format!("Unable to seed ecology object: {error}"))?;
        }
    }

    let artist_database: Value = serde_json::from_str(ARTIST_WORLDS).map_err(|error| format!("Embedded artist-world catalog is invalid: {error}"))?;
    for world in array_field(&artist_database, "worlds")? {
        transaction.execute(
            "INSERT INTO artist_worlds(id,artist_id,name,variant,description,palette,material_language,shape_language,lighting,ui_language,mascot,guardrail,raw_json) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)
             ON CONFLICT(id) DO UPDATE SET artist_id=excluded.artist_id,name=excluded.name,variant=excluded.variant,description=excluded.description,palette=excluded.palette,material_language=excluded.material_language,shape_language=excluded.shape_language,lighting=excluded.lighting,ui_language=excluded.ui_language,mascot=excluded.mascot,guardrail=excluded.guardrail,raw_json=excluded.raw_json",
            params![text_field(world,"world_id")?,text_field(world,"artist_id")?,text_field(world,"world_name")?,text_field(world,"variant")?,text_field(world,"world_thesis")?,text_field(world,"palette")?,text_field(world,"material_language")?,text_field(world,"shape_language")?,text_field(world,"lighting")?,text_field(world,"ui_language")?,text_field(world,"mascot_buddy")?,text_field(world,"do_not_reduce_to")?,world.to_string()]
        ).map_err(|error| format!("Unable to seed artist world: {error}"))?;
    }
    for district in array_field(&artist_database, "districts")? {
        transaction.execute(
            "INSERT INTO artist_districts(id,artist_id,name,thesis,environment_weather,best_use_mode,raw_json) VALUES(?1,?2,?3,?4,?5,?6,?7)
             ON CONFLICT(id) DO UPDATE SET artist_id=excluded.artist_id,name=excluded.name,thesis=excluded.thesis,environment_weather=excluded.environment_weather,best_use_mode=excluded.best_use_mode,raw_json=excluded.raw_json",
            params![text_field(district,"district_id")?,text_field(district,"artist_id")?,text_field(district,"district")?,text_field(district,"thesis")?,text_field(district,"environment_weather")?,text_field(district,"best_use_mode")?,district.to_string()]
        ).map_err(|error| format!("Unable to seed artist district: {error}"))?;
    }
    for weather in array_field(&artist_database, "weather")? {
        transaction.execute(
            "INSERT INTO artist_weather(id,artist_id,name,intensity,behavior,routing,guardrails,raw_json) VALUES(?1,?2,?3,?4,?5,?6,?7,?8)
             ON CONFLICT(id) DO UPDATE SET artist_id=excluded.artist_id,name=excluded.name,intensity=excluded.intensity,behavior=excluded.behavior,routing=excluded.routing,guardrails=excluded.guardrails,raw_json=excluded.raw_json",
            params![text_field(weather,"weather_id")?,text_field(weather,"artist_id")?,text_field(weather,"weather_state")?,text_field(weather,"intensity")?,text_field(weather,"behavior")?,text_field(weather,"triggers_routing")?,text_field(weather,"performance_accessibility_guardrails")?,weather.to_string()]
        ).map_err(|error| format!("Unable to seed artist weather: {error}"))?;
    }
    for route in array_field(&artist_database, "music_routes")? {
        transaction.execute(
            "INSERT INTO music_routes(id,artist_id,label,routing,spotify_uri,url,status,notes,raw_json) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9)
             ON CONFLICT(id) DO UPDATE SET artist_id=excluded.artist_id,label=excluded.label,routing=excluded.routing,spotify_uri=excluded.spotify_uri,url=excluded.url,status=excluded.status,notes=excluded.notes,raw_json=excluded.raw_json",
            params![text_field(route,"playlist_id")?,text_field(route,"artist_id")?,text_field(route,"playlist")?,text_field(route,"suggested_routing")?,text_field(route,"spotify_uri")?,text_field(route,"open_in_spotify")?,text_field(route,"approval_status")?,text_field(route,"curator_notes")?,route.to_string()]
        ).map_err(|error| format!("Unable to seed music route: {error}"))?;
    }
    transaction.commit().map_err(|error| format!("Unable to commit embedded catalogs: {error}"))?;
    Ok(())
}

fn text_field<'a>(value: &'a Value, field: &str) -> Result<&'a str, String> {
    value.get(field).and_then(Value::as_str).ok_or_else(|| format!("Required field {field} is missing"))
}

fn array_field<'a>(value: &'a Value, field: &str) -> Result<&'a Vec<Value>, String> {
    value.get(field).and_then(Value::as_array).ok_or_else(|| format!("Required array {field} is missing"))
}

fn scalar(connection: &Connection, sql: &str) -> Result<i64, String> {
    connection.query_row(sql, [], |row| row.get(0)).map_err(|error| format!("Catalog query failed: {error}"))
}

#[tauri::command]
pub fn catalog_summary(app: AppHandle) -> Result<CatalogSummary, String> {
    let connection = connect(&app)?;
    let integrity = connection.query_row("PRAGMA integrity_check", [], |row| row.get::<_, String>(0)).map_err(|error| error.to_string())?;
    Ok(CatalogSummary {
        schema_version: SCHEMA_VERSION,
        sqlite_version: rusqlite::version().to_owned(),
        durable_themes: scalar(&connection, "SELECT COUNT(*) FROM theme_packages")?,
        durable_rooms: scalar(&connection, "SELECT COUNT(*) FROM rooms")?,
        durable_objects: scalar(&connection, "SELECT COUNT(*) FROM ecology_objects")?,
        artist_worlds: scalar(&connection, "SELECT COUNT(*) FROM artist_worlds")?,
        artist_districts: scalar(&connection, "SELECT COUNT(*) FROM artist_districts")?,
        artist_music_routes: scalar(&connection, "SELECT COUNT(*) FROM music_routes")?,
        room_soundtrack_assignments: scalar(&connection, "SELECT COUNT(*) FROM room_soundtracks")?,
        integrity,
    })
}

#[tauri::command]
pub fn list_music_routes(app: AppHandle, artist_id: Option<String>) -> Result<Vec<MusicRoute>, String> {
    let connection = connect(&app)?;
    let sql = if artist_id.is_some() {
        "SELECT id,artist_id,label,routing,spotify_uri,url,status,notes FROM music_routes WHERE artist_id=?1 ORDER BY id"
    } else {
        "SELECT id,artist_id,label,routing,spotify_uri,url,status,notes FROM music_routes ORDER BY artist_id,id"
    };
    let mut statement = connection.prepare(sql).map_err(|error| error.to_string())?;
    let map_row = |row: &rusqlite::Row<'_>| -> rusqlite::Result<MusicRoute> { Ok(MusicRoute { id: row.get(0)?, artist_id: row.get(1)?, label: row.get(2)?, routing: row.get(3)?, spotify_uri: row.get(4)?, url: row.get(5)?, status: row.get(6)?, notes: row.get(7)? }) };
    let rows = if let Some(id) = artist_id { statement.query_map([id], map_row).map_err(|error| error.to_string())?.collect::<Result<Vec<_>, _>>() } else { statement.query_map([], map_row).map_err(|error| error.to_string())?.collect::<Result<Vec<_>, _>>() };
    rows.map_err(|error| error.to_string())
}

fn allowed_provider_host(provider: &str, host: &str) -> bool {
    match provider {
        "spotify" => host == "open.spotify.com",
        "apple" => host == "music.apple.com",
        "deezer" => host == "deezer.com" || host == "www.deezer.com",
        "soundcloud" => host == "soundcloud.com" || host == "www.soundcloud.com",
        "tidal" => host == "tidal.com" || host == "listen.tidal.com",
        "youtube" => host == "music.youtube.com",
        _ => false,
    }
}

#[tauri::command]
pub fn assign_room_soundtrack(app: AppHandle, assignment: RoomSoundtrackInput) -> Result<RoomSoundtrack, String> {
    if assignment.theme_id.trim().is_empty() || assignment.room_id.trim().is_empty() || assignment.label.trim().is_empty() {
        return Err("Theme, room and soundtrack label are required".to_owned());
    }
    let parsed = Url::parse(&assignment.url).map_err(|_| "Soundtrack URL is invalid".to_owned())?;
    let host = parsed.host_str().ok_or("Soundtrack URL has no provider host")?;
    if parsed.scheme() != "https" || !allowed_provider_host(&assignment.provider, host) {
        return Err(format!("{} is not an allowed {} provider URL", assignment.url, assignment.provider));
    }
    let updated_at = SystemTime::now().duration_since(UNIX_EPOCH).map_err(|error| error.to_string())?.as_secs() as i64;
    let connection = connect(&app)?;
    connection.execute(
        "INSERT INTO room_soundtracks(theme_id,room_id,provider,url,label,status,source_id,updated_at) VALUES(?1,?2,?3,?4,?5,?6,?7,?8)
         ON CONFLICT(theme_id,room_id) DO UPDATE SET provider=excluded.provider,url=excluded.url,label=excluded.label,status=excluded.status,source_id=excluded.source_id,updated_at=excluded.updated_at",
        params![assignment.theme_id,assignment.room_id,assignment.provider,parsed.as_str(),assignment.label,assignment.status,assignment.source_id,updated_at]
    ).map_err(|error| format!("Unable to save room soundtrack: {error}"))?;
    Ok(RoomSoundtrack { theme_id: assignment.theme_id, room_id: assignment.room_id, provider: assignment.provider, url: parsed.to_string(), label: assignment.label, status: assignment.status, source_id: assignment.source_id, updated_at })
}

#[tauri::command]
pub fn room_soundtrack(app: AppHandle, theme_id: String, room_id: String) -> Result<Option<RoomSoundtrack>, String> {
    let connection = connect(&app)?;
    connection.query_row(
        "SELECT theme_id,room_id,provider,url,label,status,source_id,updated_at FROM room_soundtracks WHERE theme_id=?1 AND room_id=?2",
        params![theme_id, room_id],
        |row| Ok(RoomSoundtrack { theme_id: row.get(0)?, room_id: row.get(1)?, provider: row.get(2)?, url: row.get(3)?, label: row.get(4)?, status: row.get(5)?, source_id: row.get(6)?, updated_at: row.get(7)? })
    ).optional().map_err(|error| format!("Unable to read room soundtrack: {error}"))
}

#[tauri::command]
pub fn record_native_history(app: AppHandle, event_type: String, payload_json: String) -> Result<i64, String> {
    serde_json::from_str::<Value>(&payload_json).map_err(|error| format!("History payload is not valid JSON: {error}"))?;
    let created_at = SystemTime::now().duration_since(UNIX_EPOCH).map_err(|error| error.to_string())?.as_secs() as i64;
    let connection = connect(&app)?;
    connection.execute("INSERT INTO history(event_type,payload_json,created_at) VALUES(?1,?2,?3)", params![event_type,payload_json,created_at]).map_err(|error| format!("Unable to record history: {error}"))?;
    Ok(connection.last_insert_rowid())
}
