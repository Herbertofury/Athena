BEGIN;
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
         COMMIT;
