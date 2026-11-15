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

## Use the preserved original-value capsule directly

Both commands accept explicit `--capsule` input, so extracting a raw value by hand is unnecessary:

```
python3 tools/foundry-recovery/music/convert.py preserved-capsule.json reviewed-contexts.json new-native-music.json --capsule
python3 tools/foundry-recovery/music/reconcile.py --source preserved-capsule.json --mapping reviewed-contexts.json --database standalone-native.sqlite3 --source-quiescent --capsule
```

The existing capsule validator checks every entry and its UTF-16 checksum before selecting only `ff.music-hub.v2`. The mapping's `sourceSha256` must describe the exact selected MusicHub string encoded as UTF-8, **not the surrounding capsule bytes**. Use the original reviewed mapping; do not silently rewrite its hash. Capsules are bounded at16MiB and the extracted music value retains its1MiB bound. An unpaired surrogate in the music value cannot become UTF-8 and is refused; unrelated original values, including surrogates, remain preserved in the capsule and are not exported to native music. Missing music, tampered entries, invalid mappings and existing outputs refuse without modifying source bytes. No browser reads or other capsule keys are imported. Raw-file mode remains the default.

## Resume a partially imported mapping without overwrites

`resume_plan.py` writes a **new private** `import-music-json` candidate containing only missing mapped records. It reuses the same verified source/mapping, standalone schema-15 capture, integrity checks, five-second query budget and quiescence requirement as reconciliation. Exact existing records are omitted; any differing mapped record refuses the entire plan, leaving no candidate. This is not automatic conflict resolution or a native database write.

```sh
python tools/foundry-recovery/music/resume_plan.py \
  --source /private/original-music.json --mapping /private/reviewed-mapping.json \
  --database /private/standalone-native.sqlite --source-quiescent \
  --destination /private/new-missing-only.json
```

Add `--capsule` for the already-supported reviewed original-value capsule input. Destination creation is exclusive; existing files and symlinks are never overwritten. The stdout receipt contains counts and source-snapshot/candidate hashes, not private labels/URLs. The candidate itself contains private mapped records and must not be published. Exit0 means prepared, exit2 means unavailable/conflicting; preserve any incomplete new output after an I/O error. All-identical input produces an empty import rather than repeating records.

The existing native importer remains **insert-only and all-or-nothing**. Applying a reviewed candidate is a separate explicit action, not performed by the planner. Recheck source freshness before that action. An assignment made after planning causes the existing importer to reject rather than overwrite it; regenerate the plan after review. No provider request, credential migration, source deletion or complete-app migration claim is made.

Verification: 30 local MusicHub tests pass, including five new planner tests for exact/missing/conflict, no-overwrite, source integrity, quiescence and sidecars. The 34-room actual native/bridge test now imports half, plans only the missing half, proves unchanged source DB during planning, verifies a stale candidate is rejected without partial writes, then imports the other half and verifies all rooms through fresh bridge reads. Hosted Windows/Linux checks remain separate from local results and are recorded on the associated PR.
