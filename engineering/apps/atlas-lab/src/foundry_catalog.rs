//! Local-only catalog parity. Original SQL projections and upserts, isolated namespace.
use super::{Error, FoundryStore};
use rusqlite::{Connection, OptionalExtension, TransactionBehavior, params};
use serde::Serialize;
use serde_json::Value;
pub const MAX_CATALOG_BYTES: usize = 16 * 1024 * 1024;
const TABLES: &[(&str, &str)] = &[
    (
        "foundry_catalog_metadata",
        r#"CREATE TABLE foundry_catalog_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT"#,
    ),
    (
        "foundry_catalog_theme_packages",
        r#"CREATE TABLE foundry_catalog_theme_packages (
           id TEXT PRIMARY KEY, name TEXT NOT NULL, package_version TEXT NOT NULL, approved INTEGER NOT NULL,
           world_name TEXT NOT NULL, material_language TEXT NOT NULL, motion TEXT NOT NULL, raw_json TEXT NOT NULL
         ) STRICT"#,
    ),
    (
        "foundry_catalog_rooms",
        r#"CREATE TABLE foundry_catalog_rooms (
           id TEXT PRIMARY KEY, theme_id TEXT NOT NULL, district_id TEXT NOT NULL, name TEXT NOT NULL,
           lineage TEXT NOT NULL, raw_json TEXT NOT NULL
         ) STRICT"#,
    ),
    (
        "foundry_catalog_ecology_objects",
        r#"CREATE TABLE foundry_catalog_ecology_objects (
           id TEXT PRIMARY KEY, theme_id TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL,
           material TEXT NOT NULL, shape TEXT NOT NULL, affordances_json TEXT NOT NULL, behavior_json TEXT NOT NULL, raw_json TEXT NOT NULL
         ) STRICT"#,
    ),
    (
        "foundry_catalog_artist_worlds",
        r#"CREATE TABLE foundry_catalog_artist_worlds (
           id TEXT PRIMARY KEY, artist_id TEXT NOT NULL, name TEXT NOT NULL, variant TEXT NOT NULL,
           description TEXT NOT NULL, palette TEXT NOT NULL, material_language TEXT NOT NULL,
           shape_language TEXT NOT NULL, lighting TEXT NOT NULL, ui_language TEXT NOT NULL,
           mascot TEXT NOT NULL, guardrail TEXT NOT NULL, raw_json TEXT NOT NULL
         ) STRICT"#,
    ),
    (
        "foundry_catalog_artist_districts",
        r#"CREATE TABLE foundry_catalog_artist_districts (
           id TEXT PRIMARY KEY, artist_id TEXT NOT NULL, name TEXT NOT NULL, thesis TEXT NOT NULL,
           environment_weather TEXT NOT NULL, best_use_mode TEXT NOT NULL, raw_json TEXT NOT NULL
         ) STRICT"#,
    ),
    (
        "foundry_catalog_artist_weather",
        r#"CREATE TABLE foundry_catalog_artist_weather (
           id TEXT PRIMARY KEY, artist_id TEXT NOT NULL, name TEXT NOT NULL, intensity TEXT NOT NULL,
           behavior TEXT NOT NULL, routing TEXT NOT NULL, guardrails TEXT NOT NULL, raw_json TEXT NOT NULL
         ) STRICT"#,
    ),
    (
        "foundry_catalog_music_routes",
        r#"CREATE TABLE foundry_catalog_music_routes (
           id TEXT PRIMARY KEY, artist_id TEXT NOT NULL, label TEXT NOT NULL, routing TEXT NOT NULL,
           spotify_uri TEXT NOT NULL, url TEXT NOT NULL, status TEXT NOT NULL, notes TEXT NOT NULL, raw_json TEXT NOT NULL
         ) STRICT"#,
    ),
];
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

impl FoundryStore {
    /// Atomically upsert caller-supplied catalog documents. Never removes omitted IDs.
    /// This does not import an original user database or contact a music provider.
    pub fn seed_catalog(&mut self, packages_json: &str, artists_json: &str) -> Result<(), String> {
        if packages_json.len() > MAX_CATALOG_BYTES || artists_json.len() > MAX_CATALOG_BYTES {
            return Err("Catalog exceeds 16 MiB per document".into());
        }
        let transaction = self
            .connection
            .transaction_with_behavior(TransactionBehavior::Immediate)
            .map_err(|e| e.to_string())?;
        initialize_schema(&transaction).map_err(|e| e.to_string())?;
        let packages: Value = serde_json::from_str(packages_json)
            .map_err(|error| format!("Embedded V33 catalog is invalid: {error}"))?;
        for package in packages
            .as_array()
            .ok_or("Embedded V33 catalog must be an array")?
        {
            let id = text_field(package, "id")?;
            let world_name = package
                .get("worlds")
                .and_then(Value::as_array)
                .and_then(|rows| rows.first())
                .and_then(|row| row.get("name"))
                .and_then(Value::as_str)
                .unwrap_or(id);
            transaction.execute(
            "INSERT INTO foundry_catalog_theme_packages(id,name,package_version,approved,world_name,material_language,motion,raw_json) VALUES(?1,?2,?3,?4,?5,?6,?7,?8)
             ON CONFLICT(id) DO UPDATE SET name=excluded.name,package_version=excluded.package_version,approved=excluded.approved,world_name=excluded.world_name,material_language=excluded.material_language,motion=excluded.motion,raw_json=excluded.raw_json",
            params![id, text_field(package,"name")?, text_field(package,"packageVersion")?, package.get("approved").and_then(Value::as_bool).unwrap_or(false), world_name, text_field(package,"materialLanguage")?, text_field(package,"motion")?, package.to_string()]
        ).map_err(|error| format!("Unable to seed theme package {id}: {error}"))?;
            for room in package
                .get("rooms")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
            {
                transaction.execute(
                "INSERT INTO foundry_catalog_rooms(id,theme_id,district_id,name,lineage,raw_json) VALUES(?1,?2,?3,?4,'v33-runtime',?5)
                 ON CONFLICT(id) DO UPDATE SET theme_id=excluded.theme_id,district_id=excluded.district_id,name=excluded.name,lineage=excluded.lineage,raw_json=excluded.raw_json",
                params![text_field(room,"id")?, id, text_field(room,"districtId")?, text_field(room,"name")?, room.to_string()]
            ).map_err(|error| format!("Unable to seed room: {error}"))?;
            }
            for object in package
                .get("objects")
                .and_then(Value::as_array)
                .into_iter()
                .flatten()
            {
                transaction.execute(
                "INSERT INTO foundry_catalog_ecology_objects(id,theme_id,name,role,material,shape,affordances_json,behavior_json,raw_json) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9)
                 ON CONFLICT(id) DO UPDATE SET theme_id=excluded.theme_id,name=excluded.name,role=excluded.role,material=excluded.material,shape=excluded.shape,affordances_json=excluded.affordances_json,behavior_json=excluded.behavior_json,raw_json=excluded.raw_json",
                params![text_field(object,"id")?, id, text_field(object,"name")?, text_field(object,"role")?, text_field(object,"material")?, text_field(object,"shape")?, object.get("affordances").unwrap_or(&Value::Null).to_string(), object.get("behavior").unwrap_or(&Value::Null).to_string(), object.to_string()]
            ).map_err(|error| format!("Unable to seed ecology object: {error}"))?;
            }
        }

        let artist_database: Value = serde_json::from_str(artists_json)
            .map_err(|error| format!("Embedded artist-world catalog is invalid: {error}"))?;
        for world in array_field(&artist_database, "worlds")? {
            transaction.execute(
            "INSERT INTO foundry_catalog_artist_worlds(id,artist_id,name,variant,description,palette,material_language,shape_language,lighting,ui_language,mascot,guardrail,raw_json) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13)
             ON CONFLICT(id) DO UPDATE SET artist_id=excluded.artist_id,name=excluded.name,variant=excluded.variant,description=excluded.description,palette=excluded.palette,material_language=excluded.material_language,shape_language=excluded.shape_language,lighting=excluded.lighting,ui_language=excluded.ui_language,mascot=excluded.mascot,guardrail=excluded.guardrail,raw_json=excluded.raw_json",
            params![text_field(world,"world_id")?,text_field(world,"artist_id")?,text_field(world,"world_name")?,text_field(world,"variant")?,text_field(world,"world_thesis")?,text_field(world,"palette")?,text_field(world,"material_language")?,text_field(world,"shape_language")?,text_field(world,"lighting")?,text_field(world,"ui_language")?,text_field(world,"mascot_buddy")?,text_field(world,"do_not_reduce_to")?,world.to_string()]
        ).map_err(|error| format!("Unable to seed artist world: {error}"))?;
        }
        for district in array_field(&artist_database, "districts")? {
            transaction.execute(
            "INSERT INTO foundry_catalog_artist_districts(id,artist_id,name,thesis,environment_weather,best_use_mode,raw_json) VALUES(?1,?2,?3,?4,?5,?6,?7)
             ON CONFLICT(id) DO UPDATE SET artist_id=excluded.artist_id,name=excluded.name,thesis=excluded.thesis,environment_weather=excluded.environment_weather,best_use_mode=excluded.best_use_mode,raw_json=excluded.raw_json",
            params![text_field(district,"district_id")?,text_field(district,"artist_id")?,text_field(district,"district")?,text_field(district,"thesis")?,text_field(district,"environment_weather")?,text_field(district,"best_use_mode")?,district.to_string()]
        ).map_err(|error| format!("Unable to seed artist district: {error}"))?;
        }
        for weather in array_field(&artist_database, "weather")? {
            transaction.execute(
            "INSERT INTO foundry_catalog_artist_weather(id,artist_id,name,intensity,behavior,routing,guardrails,raw_json) VALUES(?1,?2,?3,?4,?5,?6,?7,?8)
             ON CONFLICT(id) DO UPDATE SET artist_id=excluded.artist_id,name=excluded.name,intensity=excluded.intensity,behavior=excluded.behavior,routing=excluded.routing,guardrails=excluded.guardrails,raw_json=excluded.raw_json",
            params![text_field(weather,"weather_id")?,text_field(weather,"artist_id")?,text_field(weather,"weather_state")?,text_field(weather,"intensity")?,text_field(weather,"behavior")?,text_field(weather,"triggers_routing")?,text_field(weather,"performance_accessibility_guardrails")?,weather.to_string()]
        ).map_err(|error| format!("Unable to seed artist weather: {error}"))?;
        }
        for route in array_field(&artist_database, "music_routes")? {
            transaction.execute(
            "INSERT INTO foundry_catalog_music_routes(id,artist_id,label,routing,spotify_uri,url,status,notes,raw_json) VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9)
             ON CONFLICT(id) DO UPDATE SET artist_id=excluded.artist_id,label=excluded.label,routing=excluded.routing,spotify_uri=excluded.spotify_uri,url=excluded.url,status=excluded.status,notes=excluded.notes,raw_json=excluded.raw_json",
            params![text_field(route,"playlist_id")?,text_field(route,"artist_id")?,text_field(route,"playlist")?,text_field(route,"suggested_routing")?,text_field(route,"spotify_uri")?,text_field(route,"open_in_spotify")?,text_field(route,"approval_status")?,text_field(route,"curator_notes")?,route.to_string()]
        ).map_err(|error| format!("Unable to seed music route: {error}"))?;
        }

        transaction.commit().map_err(|e| e.to_string())
    }
    pub fn catalog_summary(&self) -> Result<CatalogSummary, String> {
        let transaction = self
            .connection
            .unchecked_transaction()
            .map_err(|e| e.to_string())?;
        verify_schema(&transaction).map_err(|e| e.to_string())?;
        let connection = &transaction;
        let integrity = connection
            .query_row("PRAGMA integrity_check", [], |row| row.get::<_, String>(0))
            .map_err(|error| error.to_string())?;
        Ok(CatalogSummary {
            schema_version: 1,
            sqlite_version: rusqlite::version().to_owned(),
            durable_themes: scalar(
                connection,
                "SELECT COUNT(*) FROM foundry_catalog_theme_packages",
            )?,
            durable_rooms: scalar(connection, "SELECT COUNT(*) FROM foundry_catalog_rooms")?,
            durable_objects: scalar(
                connection,
                "SELECT COUNT(*) FROM foundry_catalog_ecology_objects",
            )?,
            artist_worlds: scalar(
                connection,
                "SELECT COUNT(*) FROM foundry_catalog_artist_worlds",
            )?,
            artist_districts: scalar(
                connection,
                "SELECT COUNT(*) FROM foundry_catalog_artist_districts",
            )?,
            artist_music_routes: scalar(
                connection,
                "SELECT COUNT(*) FROM foundry_catalog_music_routes",
            )?,
            room_soundtrack_assignments: scalar(
                connection,
                "SELECT COUNT(*) FROM foundry_room_soundtracks",
            )?,
            integrity,
        })
    }

    pub fn list_music_routes(&self, artist_id: Option<String>) -> Result<Vec<MusicRoute>, String> {
        let transaction = self
            .connection
            .unchecked_transaction()
            .map_err(|e| e.to_string())?;
        verify_schema(&transaction).map_err(|e| e.to_string())?;
        let connection = &transaction;
        let sql = if artist_id.is_some() {
            "SELECT id,artist_id,label,routing,spotify_uri,url,status,notes FROM foundry_catalog_music_routes WHERE artist_id=?1 ORDER BY id"
        } else {
            "SELECT id,artist_id,label,routing,spotify_uri,url,status,notes FROM foundry_catalog_music_routes ORDER BY artist_id,id"
        };
        let mut statement = connection.prepare(sql).map_err(|error| error.to_string())?;
        let map_row = |row: &rusqlite::Row<'_>| -> rusqlite::Result<MusicRoute> {
            Ok(MusicRoute {
                id: row.get(0)?,
                artist_id: row.get(1)?,
                label: row.get(2)?,
                routing: row.get(3)?,
                spotify_uri: row.get(4)?,
                url: row.get(5)?,
                status: row.get(6)?,
                notes: row.get(7)?,
            })
        };
        let rows = if let Some(id) = artist_id {
            statement
                .query_map([id], map_row)
                .map_err(|error| error.to_string())?
                .collect::<Result<Vec<_>, _>>()
        } else {
            statement
                .query_map([], map_row)
                .map_err(|error| error.to_string())?
                .collect::<Result<Vec<_>, _>>()
        };
        rows.map_err(|error| error.to_string())
    }
}
fn text_field<'a>(value: &'a Value, field: &str) -> Result<&'a str, String> {
    value
        .get(field)
        .and_then(Value::as_str)
        .ok_or_else(|| format!("Required field {field} is missing"))
}

fn array_field<'a>(value: &'a Value, field: &str) -> Result<&'a Vec<Value>, String> {
    value
        .get(field)
        .and_then(Value::as_array)
        .ok_or_else(|| format!("Required array {field} is missing"))
}

fn scalar(connection: &Connection, sql: &str) -> Result<i64, String> {
    connection
        .query_row(sql, [], |row| row.get(0))
        .map_err(|error| format!("Catalog query failed: {error}"))
}

fn initialize_schema(c: &Connection) -> Result<(), Error> {
    let mut existing = 0;
    for (name, _) in TABLES {
        existing += c.query_row(
            "SELECT count(*) FROM sqlite_schema WHERE name=?1",
            [name],
            |r| r.get::<_, i64>(0),
        )?;
    }
    if existing == 0 {
        for (_, sql) in TABLES {
            c.execute_batch(sql)?;
        }
        c.execute(
            "INSERT INTO foundry_catalog_metadata VALUES('schema_version','1')",
            [],
        )?;
    }
    verify_schema(c)
}
fn verify_schema(c: &Connection) -> Result<(), Error> {
    let normalize = |s: &str| {
        s.split_whitespace()
            .collect::<Vec<_>>()
            .join(" ")
            .to_ascii_lowercase()
    };
    for (name, expected) in TABLES {
        let actual: Option<String> = c
            .query_row(
                "SELECT sql FROM sqlite_schema WHERE name=?1 AND type='table'",
                [name],
                |r| r.get(0),
            )
            .optional()?;
        if actual.as_deref().map(normalize) != Some(normalize(expected)) {
            return Err(Error::UnsupportedSchema);
        }
        let extras: i64 = c.query_row("SELECT count(*) FROM sqlite_schema WHERE tbl_name=?1 AND type IN ('trigger','index') AND sql IS NOT NULL", [name], |r|r.get(0))?;
        if extras != 0 {
            return Err(Error::UnsupportedSchema);
        }
    }
    let version: Option<String> = c
        .query_row(
            "SELECT value FROM foundry_catalog_metadata WHERE key='schema_version'",
            [],
            |r| r.get(0),
        )
        .optional()?;
    if version.as_deref() != Some("1") {
        return Err(Error::UnsupportedSchema);
    }
    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    fn store() -> FoundryStore {
        let mut connection = Connection::open_in_memory().unwrap();
        crate::storage_connection::configure(&connection).unwrap();
        let tx = connection.transaction().unwrap();
        for (_, sql) in super::super::TABLES {
            tx.execute_batch(sql).unwrap();
        }
        tx.execute(
            "INSERT INTO foundry_storage_metadata VALUES('schema_version','1')",
            [],
        )
        .unwrap();
        tx.commit().unwrap();
        FoundryStore { connection }
    }
    fn packages() -> String {
        json!([{"id":"synthetic.theme", "name":"Synthetic 雪", "packageVersion":"1", "materialLanguage":"paper", "motion":"gentle", "rooms":[{"id":"room", "districtId":"district", "name":"Room"}], "objects":[{"id":"object", "name":"Object", "role":"test", "material":"paper", "shape":"box"}]}]).to_string()
    }
    fn artists() -> Value {
        json!({"worlds":[{"world_id":"world", "artist_id":"artist.a", "world_name":"World", "variant":"v", "world_thesis":"t", "palette":"p", "material_language":"m", "shape_language":"s", "lighting":"l", "ui_language":"u", "mascot_buddy":"b", "do_not_reduce_to":"g"}], "districts":[{"district_id":"district", "artist_id":"artist.a", "district":"D", "thesis":"T", "environment_weather":"W", "best_use_mode":"B"}], "weather":[{"weather_id":"weather", "artist_id":"artist.a", "weather_state":"W", "intensity":"I", "behavior":"B", "triggers_routing":"R", "performance_accessibility_guardrails":"G"}], "music_routes":[route("z","artist.b"),route("b","artist.a"),route("a","artist.a")]})
    }
    fn route(id: &str, artist: &str) -> Value {
        json!({"playlist_id":id,"artist_id":artist,"playlist":"Synthetic route","suggested_routing":"room","spotify_uri":"spotify:playlist:synthetic","open_in_spotify":"https://open.spotify.com/playlist/synthetic","approval_status":"unverified-fixture","curator_notes":"Synthetic only"})
    }
    #[test]
    fn catalog_matches_original_sql_for_every_persisted_column() {
        let mut s = store();
        let mut original = Connection::open_in_memory().unwrap();
        let p = packages();
        let a = artists().to_string();
        original_reference::seed(&mut original, &p, &a).unwrap();
        s.seed_catalog(&p, &a).unwrap();
        let mut changed = artists();
        changed["music_routes"][0]["curator_notes"] = json!("changed 雪");
        original_reference::seed(&mut original, "[]", &changed.to_string()).unwrap();
        s.seed_catalog("[]", &changed.to_string()).unwrap();
        for name in [
            "theme_packages",
            "rooms",
            "ecology_objects",
            "artist_worlds",
            "artist_districts",
            "artist_weather",
            "music_routes",
        ] {
            fn rows(c: &Connection, name: &str) -> Vec<Vec<rusqlite::types::Value>> {
                let mut stmt = c
                    .prepare(&format!("SELECT * FROM {name} ORDER BY id"))
                    .unwrap();
                let count = stmt.column_count();
                stmt.query_map([], |r| (0..count).map(|i| r.get(i)).collect())
                    .unwrap()
                    .collect::<Result<Vec<_>, _>>()
                    .unwrap()
            }
            assert_eq!(
                rows(&original, name),
                rows(&s.connection, &format!("foundry_catalog_{name}")),
                "{name}"
            );
        }
    }
    mod original_reference {
        include!("foundry_catalog_reference_test.rs");
    }
    #[test]
    fn catalog_seeds_every_projection_and_original_defaults() {
        let mut s = store();
        s.seed_catalog(&packages(), &artists().to_string()).unwrap();
        let v = s.catalog_summary().unwrap();
        assert_eq!(
            (
                v.durable_themes,
                v.durable_rooms,
                v.durable_objects,
                v.artist_worlds,
                v.artist_districts,
                v.artist_music_routes,
                v.room_soundtrack_assignments
            ),
            (1, 1, 1, 1, 1, 3, 0)
        );
        assert_eq!(v.integrity, "ok");
        assert_eq!(v.schema_version, 1);
        assert_eq!(
            s.connection
                .query_row(
                    "SELECT approved,world_name FROM foundry_catalog_theme_packages",
                    [],
                    |r| Ok((r.get::<_, i64>(0)?, r.get::<_, String>(1)?))
                )
                .unwrap(),
            (0, "synthetic.theme".into())
        );
        assert_eq!(
            s.connection
                .query_row(
                    "SELECT affordances_json,behavior_json FROM foundry_catalog_ecology_objects",
                    [],
                    |r| Ok((r.get::<_, String>(0)?, r.get::<_, String>(1)?))
                )
                .unwrap(),
            ("null".into(), "null".into())
        );
        assert_eq!(
            s.connection
                .query_row("SELECT lineage FROM foundry_catalog_rooms", [], |r| r
                    .get::<_, String>(0))
                .unwrap(),
            "v33-runtime"
        );
        assert_eq!(
            s.connection
                .query_row(
                    "SELECT count(*) FROM foundry_catalog_artist_weather",
                    [],
                    |r| r.get::<_, i64>(0)
                )
                .unwrap(),
            1
        );
    }
    #[test]
    fn catalog_routes_use_original_filter_and_order() {
        let mut s = store();
        s.seed_catalog(&packages(), &artists().to_string()).unwrap();
        assert_eq!(
            s.list_music_routes(None)
                .unwrap()
                .iter()
                .map(|r| r.id.as_str())
                .collect::<Vec<_>>(),
            vec!["a", "b", "z"]
        );
        assert_eq!(
            s.list_music_routes(Some("artist.a".into())).unwrap().len(),
            2
        );
        for id in ["", "ARTIST.A", "' OR 1=1 --", "missing"] {
            assert!(s.list_music_routes(Some(id.into())).unwrap().is_empty());
        }
        let row = &s.list_music_routes(Some("artist.b".into())).unwrap()[0];
        assert_eq!(row.status, "unverified-fixture");
        assert_eq!(row.spotify_uri, "spotify:playlist:synthetic");
    }
    #[test]
    fn catalog_upserts_retain_omitted_rows_and_last_duplicate_wins() {
        let mut s = store();
        s.seed_catalog(&packages(), &artists().to_string()).unwrap();
        let mut a = artists();
        let mut r = route("a", "artist.c");
        r["playlist"] = json!("Changed");
        a["music_routes"] = json!([route("a", "artist.a"), r]);
        s.seed_catalog("[]", &a.to_string()).unwrap();
        assert_eq!(s.catalog_summary().unwrap().durable_themes, 1);
        assert_eq!(s.list_music_routes(None).unwrap().len(), 3);
        assert_eq!(
            s.list_music_routes(Some("artist.c".into())).unwrap()[0].label,
            "Changed"
        );
    }
    #[test]
    fn catalog_invalid_documents_roll_back_schema_and_all_rows() {
        for (p, a) in [
            ("{}".to_string(), artists().to_string()),
            (packages(), "{}".into()),
            (packages(), "{".into()),
        ] {
            let mut s = store();
            assert!(s.seed_catalog(&p, &a).is_err());
            assert_eq!(
                s.connection
                    .query_row(
                        "SELECT count(*) FROM sqlite_schema WHERE name LIKE 'foundry_catalog_%'",
                        [],
                        |r| r.get::<_, i64>(0)
                    )
                    .unwrap(),
                0
            );
        }
        let mut s = store();
        s.seed_catalog(&packages(), &artists().to_string()).unwrap();
        let mut a = artists();
        a["music_routes"][2]
            .as_object_mut()
            .unwrap()
            .remove("curator_notes");
        let p = packages().replace("Synthetic 雪", "Changed");
        assert!(s.seed_catalog(&p, &a.to_string()).is_err());
        assert_eq!(
            s.connection
                .query_row("SELECT name FROM foundry_catalog_theme_packages", [], |r| r
                    .get::<_, String>(0))
                .unwrap(),
            "Synthetic 雪"
        );
        assert!(
            s.seed_catalog(&" ".repeat(MAX_CATALOG_BYTES + 1), &artists().to_string())
                .is_err()
        );
    }
    #[test]
    fn catalog_never_creates_or_changes_original_namespace_tables() {
        for existing in [false, true] {
            let mut s = store();
            if existing {
                s.connection.execute_batch("CREATE TABLE theme_packages(value TEXT); INSERT INTO theme_packages VALUES('preserve')").unwrap();
            }
            s.seed_catalog(&packages(), &artists().to_string()).unwrap();
            let count: i64 = s.connection.query_row("SELECT count(*) FROM sqlite_schema WHERE name IN ('metadata','theme_packages','rooms','ecology_objects','artist_worlds','artist_districts','artist_weather','music_routes')", [], |r|r.get(0)).unwrap();
            assert_eq!(count, i64::from(existing));
            if existing {
                assert_eq!(
                    s.connection
                        .query_row("SELECT value FROM theme_packages", [], |r| r
                            .get::<_, String>(0))
                        .unwrap(),
                    "preserve"
                );
            }
        }
    }
    #[test]
    fn catalog_collision_is_never_adopted() {
        let mut s = store();
        s.connection.execute_batch("CREATE TABLE foundry_catalog_music_routes(id TEXT); INSERT INTO foundry_catalog_music_routes VALUES('preserve')").unwrap();
        assert!(s.seed_catalog(&packages(), &artists().to_string()).is_err());
        assert_eq!(
            s.connection
                .query_row("SELECT id FROM foundry_catalog_music_routes", [], |r| {
                    r.get::<_, String>(0)
                })
                .unwrap(),
            "preserve"
        );
        assert_eq!(
            s.connection
                .query_row(
                    "SELECT count(*) FROM sqlite_schema WHERE name='foundry_catalog_metadata'",
                    [],
                    |r| r.get::<_, i64>(0)
                )
                .unwrap(),
            0
        );
    }
    #[test]
    fn catalog_mutated_ownership_fails_closed_for_reads_and_writes() {
        for sql in [
            "DELETE FROM foundry_catalog_metadata",
            "UPDATE foundry_catalog_metadata SET value='2'",
            "CREATE INDEX unexpected ON foundry_catalog_music_routes(artist_id)",
            "CREATE TRIGGER unexpected AFTER INSERT ON foundry_catalog_rooms BEGIN SELECT 1; END",
            "ALTER TABLE foundry_catalog_artist_weather ADD COLUMN unwanted TEXT",
        ] {
            let mut s = store();
            s.seed_catalog(&packages(), &artists().to_string()).unwrap();
            s.connection.execute_batch(sql).unwrap();
            assert!(s.seed_catalog("[]", &artists().to_string()).is_err());
            assert!(s.catalog_summary().is_err());
            assert!(s.list_music_routes(None).is_err());
        }
    }
    #[test]
    fn catalog_operations_preserve_history_assignments_and_unrelated_tables() {
        let mut s = store();
        s.record_native_history("synthetic", " {\"x\":1} ").unwrap();
        s.connection.execute_batch("CREATE TABLE unrelated(value TEXT); INSERT INTO unrelated VALUES('preserve'); INSERT INTO foundry_room_soundtracks VALUES('t','r','spotify','https://open.spotify.com/playlist/synthetic','fixture','unverified',NULL,0)").unwrap();
        s.seed_catalog(&packages(), &artists().to_string()).unwrap();
        assert_eq!(s.catalog_summary().unwrap().room_soundtrack_assignments, 1);
        assert_eq!(
            s.history_after(0, 10).unwrap()[0].payload_json,
            " {\"x\":1} "
        );
        assert_eq!(
            s.connection
                .query_row("SELECT value FROM unrelated", [], |r| r.get::<_, String>(0))
                .unwrap(),
            "preserve"
        );
    }
    #[test]
    fn catalog_reopens_without_reseeding() {
        let path = std::env::temp_dir().join(format!(
            "foundry-catalog-synthetic-{}-{}.sqlite",
            std::process::id(),
            super::super::now().unwrap()
        ));
        let mut s = FoundryStore::open(&path).unwrap();
        s.seed_catalog(&packages(), &artists().to_string()).unwrap();
        drop(s);
        let s = FoundryStore::open(&path).unwrap();
        assert_eq!(s.list_music_routes(None).unwrap().len(), 3);
        assert_eq!(s.catalog_summary().unwrap().integrity, "ok");
    }
}
