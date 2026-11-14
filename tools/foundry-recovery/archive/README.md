# Private original archive metadata query

Local-only read access to explicitly selected **prepared standalone rollback-journal** Feature Foundry SQLite archives. This is not a native migration, lossless archive, public catalog publisher or live-database snapshot. Keep the original archive authoritative.

Source contract: reviewed original `src-tauri/src/database.rs`, schema version 1, ordinary `artist_worlds`, `artist_districts`, `artist_weather`, `music_routes`, and `history` tables. Source table names and schemas are encoded statically, without original artist content. This implementation does not import source repository assets or open user databases automatically.

Requires Python 3.11+ with SQLite, and a filesystem providing exclusive creation and POSIX mode 0600. Tests verified Linux only; ACL privacy on other platforms is not established. No packages, network service, credentials, or extension loading are needed.

## Counts only (default)

```sh
python3 tools/foundry-recovery/archive/query.py --source /private/prepared.sqlite
```

Returns only static schema/projection identifiers and bounded row counts. No record values, source paths, source hashes or SQLite exception details are printed. A selection is optional for counts, for example `--table history`. Duplicate selections are refused.

## Explicit private export

```sh
python3 tools/foundry-recovery/archive/query.py \
  --source /private/prepared.sqlite \
  --table artist_worlds --table music_routes --table history \
  --private-export --destination /private/new-projection.json
```

The destination must be new, its parent must already exist, and every value-export table must be explicitly selected. The output is exclusively created with mode 0600, never overwritten. Source/sidecar destination aliases are refused. No raw values or output paths appear in the success receipt.

Projection allowlist:

- `artist_worlds`: id, artist_id, name, variant
- `artist_districts`: id, artist_id, name, best_use_mode
- `artist_weather`: id, artist_id, name, intensity
- `music_routes`: id, artist_id, label, status
- `history`: id, event_type, created_at

`raw_json`, `payload_json`, URL and Spotify URI columns, notes, routing and other unlisted descriptions are never projected. **This is not sanitization or proof of nonsensitive content.** Any identifier, label, mode, event type or timestamp can itself contain private information or secrets. Only select data you are authorized to inspect. The output remains private and must not be uploaded, committed, shared or used as a public fixture without a separate review and authorization. Arbitrary text is not classified or scrubbed.

## Safety and limits

- Explicit file only, no discovery. Reject symlinks (including ancestors), nonregular files, WAL header mode, or any `-wal`, `-shm`, `-journal` sidecar. Never delete sidecars or change journal mode.
- Open via SQLite `mode=ro&immutable=1`, `query_only=ON`, `trusted_schema=OFF`, extension loading disabled. Static allowlisted SQL identifiers only. Views, virtual tables, hidden/generated fields, missing/extra columns and mismatched declared types are refused for selected tables; metadata must match the reviewed schema1 contract.
- Source bytes, inode/stat and SHA256 are checked before/after inspection and after output creation. Detected changes refuse or withdraw this operation's output. No source bytes are written. **Use a quiescent prepared backup**: hash checks do not prove a coherent live snapshot or detect an adversary changing and restoring identical bytes between checks.
- Maximum source64MiB,1000 rows per selected table,4096 UTF-8 bytes per projected value,2MiB accumulated projected-value budget,4MiB final JSON. SQLite SQL/column/record/cache limits and a progress budget further bound work. Larger archives require a separately reviewed workflow, not automatic limit expansion.
- Failed export never overwrites an existing file. The CLI uses deliberately generic errors to avoid leaking private paths/SQLite values. Check source preparation, exact schema, bounds and destination. Record corruption/decoder failures are refusals, not partial-success claims.

Synthetic tests (no actual artist records or user databases):

```sh
python3 -m unittest discover -s tools/foundry-recovery/archive -p 'test_*.py' -v
```
