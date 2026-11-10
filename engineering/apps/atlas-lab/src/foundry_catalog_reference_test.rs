// Test-only reference extracted verbatim from preserved original database.rs; only app/constant inputs adapted.
use rusqlite::{params, Connection};
use serde_json::Value;
pub fn seed(connection: &mut Connection, packages_json: &str, artists_json: &str)->Result<(),String>{
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
    transaction.execute("INSERT INTO metadata(key,value) VALUES('schema_version',?1) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [1.to_string()]).map_err(|error| error.to_string())?;
    transaction.execute("INSERT INTO metadata(key,value) VALUES('v33_source_sha256','83aac630afa4e6522d28452bb6a7c0ebe183eee6812b89b6d742662876af06ec') ON CONFLICT(key) DO NOTHING", []).map_err(|error| error.to_string())?;
    transaction.execute("INSERT INTO metadata(key,value) VALUES('artist_worlds_json_sha256','9865ef491c5baeec39702a0a6724df1bf9c9a29ed062a30e6bb6af270dd6b00a') ON CONFLICT(key) DO NOTHING", []).map_err(|error| error.to_string())?;

    let packages: Value = serde_json::from_str(packages_json).map_err(|error| format!("Embedded V33 catalog is invalid: {error}"))?;
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

    let artist_database: Value = serde_json::from_str(artists_json).map_err(|error| format!("Embedded artist-world catalog is invalid: {error}"))?;
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

transaction.commit().map_err(|e|e.to_string())
}
fn text_field<'a>(value: &'a Value, field: &str) -> Result<&'a str, String> {
    value.get(field).and_then(Value::as_str).ok_or_else(|| format!("Required field {field} is missing"))
}

fn array_field<'a>(value: &'a Value, field: &str) -> Result<&'a Vec<Value>, String> {
    value.get(field).and_then(Value::as_array).ok_or_else(|| format!("Required array {field} is missing"))
}

