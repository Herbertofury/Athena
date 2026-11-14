CREATE TABLE IF NOT EXISTS themes(id TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS rooms(theme_id TEXT NOT NULL REFERENCES themes(id), id TEXT NOT NULL, name TEXT NOT NULL, PRIMARY KEY(theme_id,id));
CREATE TABLE IF NOT EXISTS objects(theme_id TEXT NOT NULL REFERENCES themes(id), id TEXT NOT NULL, name TEXT NOT NULL, shape TEXT NOT NULL, role TEXT NOT NULL, PRIMARY KEY(theme_id,id));
CREATE TABLE IF NOT EXISTS soundtracks(theme_id TEXT NOT NULL, room_id TEXT NOT NULL, provider TEXT NOT NULL, url TEXT NOT NULL, label TEXT NOT NULL, PRIMARY KEY(theme_id,room_id), FOREIGN KEY(theme_id,room_id) REFERENCES rooms(theme_id,id));
CREATE TABLE IF NOT EXISTS workspace_backup(singleton INTEGER PRIMARY KEY CHECK(singleton=1), json TEXT NOT NULL);
PRAGMA user_version=2;
