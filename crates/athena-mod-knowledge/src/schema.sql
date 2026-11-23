PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS games(id TEXT PRIMARY KEY CHECK(length(id)>0), name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sources(
 id TEXT PRIMARY KEY CHECK(length(id)>0), policy_url TEXT NOT NULL,
 can_retain INTEGER NOT NULL CHECK(can_retain IN(0,1)),
 can_publish INTEGER NOT NULL CHECK(can_publish IN(0,1)),
 policy_revision TEXT NOT NULL CHECK(length(policy_revision)>0)
);
CREATE TABLE IF NOT EXISTS entities(
 id TEXT PRIMARY KEY CHECK(length(id)>0), game_id TEXT NOT NULL REFERENCES games(id),
 kind TEXT NOT NULL CHECK(kind IN('creator','mod','release','tool','guide','warning')), name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS observations(
 id TEXT PRIMARY KEY CHECK(length(id)>0), entity_id TEXT NOT NULL REFERENCES entities(id),
 source_id TEXT NOT NULL REFERENCES sources(id), source_url TEXT NOT NULL,
 predicate TEXT NOT NULL CHECK(length(predicate)>0), value TEXT NOT NULL,
 observed_unix INTEGER NOT NULL CHECK(observed_unix>=0),
 applicable_build TEXT NOT NULL, mod_version TEXT NOT NULL, completeness TEXT NOT NULL CHECK(completeness IN('complete','partial','unknown')),
 policy_revision TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS observations_entity_time ON observations(entity_id,observed_unix DESC,id);
CREATE TABLE IF NOT EXISTS refresh_attempts(
 id INTEGER PRIMARY KEY, source_id TEXT NOT NULL REFERENCES sources(id),
 attempted_unix INTEGER NOT NULL CHECK(attempted_unix>=0),
 outcome TEXT NOT NULL CHECK(outcome IN('success','failed','rate_limited','policy_blocked')),
 detail TEXT NOT NULL
);
PRAGMA user_version=1;
