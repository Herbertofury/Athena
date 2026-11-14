# Independent native Foundry store (implementation candidate)

Standalone path-backed SQLite persistence. No dependency on Athena's Engineering experiments, Tauri AppHandle, browser session, network client, provider grant or artist catalog. `catalog.json` is the already reviewed Athena native catalog (17 themes, 34 rooms, 85 objects); legacy source remains untouched. SQL concepts derive from preserved MIT Feature Foundry `src-tauri/src/database.rs`; this is a narrow new implementation, not byte-identical schema compatibility.

## Commands

```
cargo test
cargo run -- init /explicit/new/athena-foundry.sqlite3
cargo run -- status /explicit/existing/athena-foundry.sqlite3
cargo run -- assign /explicit/existing/athena-foundry.sqlite3 < assignment.json
cargo run -- read /explicit/existing/athena-foundry.sqlite3 frutiger-aero frutiger-aero:room:aqua-atrium
```

`init` refuses an existing file. A failed initialization can leave a newly created empty database; it is never silently deleted or overwritten. `open` never creates a file or migrates unknown schema. Relationships use composite foreign keys. Writes are transactional, use bound parameters, and preserve the last committed soundtrack on error. Connections set a bounded busy timeout, foreign keys, and synchronous EXTRA without changing an existing journal mode. These settings are not proof of power-loss safety.

Assignments contain `theme_id`, `room_id`, `provider`, `url`, `label`. URLs are public provider bookmarks only. No network calls occur. Queries are rejected except public YouTube Music `v`/`list` identifiers; duplicate keys, unknown keys, credential parameters and fragments are rejected. Do not claim complete provider parity.

## Boundaries

No legacy import, arbitrary history payload, layout backup store, UI/service adapter, desktop installation or artist metadata migration is implemented. No credentials, tokens or user records were ingested. Linux Rust compilation, nine tests, formatting and strict all-target Clippy passed with Rust 1.99.1; see VALIDATION.md. Desktop Windows acceptance and full Athena CI remain required. Source retirement is not justified by this module.
