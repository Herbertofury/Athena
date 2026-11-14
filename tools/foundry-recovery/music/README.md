# Original MusicHub bookmark migration

This offline tool converts the explicitly supplied raw value of original `ff.music-hub.v2`, whose `MusicHub.ts` format is version/route/mappings and keys are `theme::district`. It never reads a browser, session storage, credentials or providers. Preserve the exact original capsule first. **Do not publish source values, mapping files, output or databases.** Output is exclusively created (owner-only mode on POSIX), never overwritten.

Supply a mapping JSON with exactly `sourceSha256` (SHA-256 of the source bytes) and `contexts`. Each original context key maps to `{ "themeId": "reviewed-native-theme", "roomId": "reviewed-native-room" }`. Every source mapping must have exactly one known destination, no duplicate destinations. Display names are not silently treated as room IDs.

```
python3 tools/foundry-recovery/music/convert.py original-music.json reviewed-contexts.json native-music.json
cargo build --locked --manifest-path crates/athena-foundry-store/Cargo.toml
# After explicitly choosing/initializing the target and upgrading its soundtrack schema:
crates/athena-foundry-store/target/debug/athena-foundry-store import-music-json selected.sqlite3 < native-music.json
```

Use `.exe` on Windows. The target must already exist with soundtrack schema 4–12. No automatic schema migration. Native validation checks provider URLs, bounded provenance, catalog foreign keys and source timestamps. Import is one transaction: an occupied destination, duplicate room, invalid row or failed write aborts the complete batch. There is no overwrite/replace option. Verify with `read-native DB THEME ROOM` afterward; this is bookmark metadata, not playback, account access, or authorization.

Provider, URL, label, status and optional sourceId are preserved; seconds-resolution source timestamp is retained rather than reset to import time. **Nonzero fractional milliseconds are refused**, because the current native store cannot preserve them. No truncation is guessed. Preserve those originals and reconcile a future precision-capable storage format. The original hub route is retained in the capsule, not imported into Athena navigation. This does not migrate Spotify session tokens, PKCE, MusicKit credentials, provider libraries, playback state or private assets, and does not establish full source retirement readiness.

Tests: `python3 -m unittest discover -s tools/foundry-recovery/music -v`; native atomicity and metadata checks run in normal `cargo test`.
