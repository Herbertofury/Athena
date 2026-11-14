# Original MusicHub bookmark migration

This offline tool converts the explicitly supplied raw value of original `ff.music-hub.v2`, whose `MusicHub.ts` format is version/route/mappings and keys are `theme::district`. It never reads a browser, session storage, credentials or providers. Preserve the exact original capsule first. **Do not publish source values, mapping files, output or databases.** Output is exclusively created (owner-only mode on POSIX), never overwritten.

Both source and mapping inputs are capped at 1,000,000 bytes before parsing; oversized input is refused before any output file is created.

Supply a mapping JSON with exactly `sourceSha256` (SHA-256 of the source bytes) and `contexts`. Each original context key maps to `{ "themeId": "reviewed-native-theme", "roomId": "reviewed-native-room" }`. Every source mapping must have exactly one known destination, no duplicate destinations. Display names are not silently treated as room IDs.

```
python3 tools/foundry-recovery/music/convert.py original-music.json reviewed-contexts.json native-music.json
cargo build --locked --manifest-path crates/athena-foundry-store/Cargo.toml
# After explicitly choosing the target and upgrading through schema14:
crates/athena-foundry-store/target/debug/athena-foundry-store upgrade-music-precision selected.sqlite3
crates/athena-foundry-store/target/debug/athena-foundry-store import-music-json selected.sqlite3 < native-music.json
```

Use `.exe` on Windows. Converter output version2 requires explicit schema15 (`upgrade-music-precision`, after `upgrade-blend-modes`). Existing version1 seconds-only imports remain supported on schemas4–15. No automatic schema migration. Native validation checks provider URLs, bounded provenance, catalog foreign keys and both timestamp fields. Import is one transaction: an occupied destination, duplicate room, invalid row or failed write aborts the complete batch. There is no overwrite/replace option. Verify with `read-native DB THEME ROOM` afterward; this is bookmark metadata, not playback, account access, or authorization.

Provider, URL, label, status and optional sourceId are preserved. Original UTC milliseconds are represented exactly by `updated_at_ms`, with compatible whole seconds in `updated_at`; inconsistent values, future/negative time and unsupported precision are refused. Conversion uses integer arithmetic. Migrated existing rows retain unknown precision as NULL rather than inventing a fractional value. Intentional later bookmark edits clear original precision together with replacing the timestamp. Versioned reads include stored precision, so same-second changes invalidate stale writer tokens. Pre-schema15 binaries refuse the new database rather than truncate timestamps.

The original hub route is retained in the capsule, not imported into Athena navigation. This does not migrate Spotify session tokens, PKCE, MusicKit credentials, provider libraries, playback state or private assets, and does not establish full source retirement readiness. Preserve original capsules and backups.

Tests: `python3 -m unittest discover -s tools/foundry-recovery/music -v`; native migration, atomicity, metadata precision and conflict checks run in normal `cargo test`.
