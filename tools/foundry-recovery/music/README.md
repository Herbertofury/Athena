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

## Reconcile imported bookmarks without writing the database

Stop database writers and select a **standalone schema15 snapshot**, retaining all originals. Active WAL/SHM/journal sidecars are refused; prepare a separate backup first using the existing SQLite recovery tool. Do not delete sidecars to make this command pass.

```
python3 tools/foundry-recovery/music/reconcile.py --source original-music.json --mapping reviewed-contexts.json --database standalone-native.sqlite3 --source-quiescent
```

The command reuses the converter, captures bounded snapshot bytes with the existing recovery reader, and opens only an in-memory SQLite copy. It compares every mapped room's provider, URL, label, status, optional provenance and both timestamp fields. It prints **counts only**: exact, missing or different. Additional native rooms are not treated as errors; this verifies only the explicitly mapped original set. Zero mapped records is vacuous, not evidence of complete migration. Exit0 means all mapped records match;1 means differences/missing records;2 means verification could not complete. No automatic import, overwrite, upgrade, repair or provider request occurs.

Inputs are checked again after reading; changed inputs refuse a result. Database size is bounded by the shared64MiB capture limit, source/mapping by1MiB each, and SQLite execution by a five-second progress deadline. Checksums and quiescence assertions do not defeat malicious concurrent replacement or establish provenance/authenticity. Requires Python SQLite `deserialize` support. The report never certifies playback, credentials, original hub routing, unrelated application data or source-repository retirement.

Six synthetic CLI/unit regressions cover exact, missing/different, sidecars, quiescence, schema/corruption, changed capture and malformed input with byte-preservation checks. The all-room acceptance also calls reconciliation on the real Rust-created schema15 store. Hosted Windows/Linux tests qualify the exact compiled source; local existing-binary results alone are not that qualification.
