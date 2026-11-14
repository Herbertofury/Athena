# Foundry local persistence API

This implementation adds local persistence routes to Athena's Rust loopback server. It does not add a desktop shell, provider login/playback, user-state migration, world reconstruction, or frontend wiring. Windows and macOS snapshot persistence remain unsupported. Catalog, soundtrack metadata and history use the explicitly selected Athena database in isolated `foundry_*` tables.

## Start

`atlas-lab serve-athena DATABASE PUBLIC_DIRECTORY [--foundry-snapshot-dir EXISTING_ABSOLUTE_PRIVATE_DIRECTORY]`

The optional snapshot directory must already exist, belong to the effective user, have no group/other permissions, and have no symlink path components. Invalid explicit configuration fails startup rather than silently falling back. Without the flag, the server works but snapshot routes return 503. On unsupported operating systems these routes return 501. No HTTP request chooses a database, directory, or filename.

The server still binds only `127.0.0.1:41379`, verifies exact Host, and requires `Origin: http://127.0.0.1:41379` plus `x-atlas-request: local-ui` for writes. It preserves immutable verified runtime assets, CSP and nosniff. Foundry requests share four admission slots with existing database work; a slot is retained inside blocking operations even when a client disconnects. The general request-body limit stays 4096 bytes.

## Routes

All routes start with `/api/foundry`.

- GET `/capabilities`: version, fixed catalog source hashes, truthful unsupported and unconfigured capabilities. Availability is configuration, not a promise that every future filesystem operation succeeds.
- GET `/catalog`: original catalog summary/counts and SQLite integrity result. Startup seeds only the compiled original theme and artist documents. No HTTP seed operation exists.
- GET `/music-routes?artistId=ID`: optional bounded artist ID; returns original route metadata, not playable/provider-verified media.
- GET `/soundtrack?themeId=ID&roomId=ID`: stored assignment or 404. POST `/soundtrack`: `{themeId,roomId,provider,url,label,status,sourceId}`. `sourceId` is nullable/optional. Validates supported exact HTTPS provider host, no URL credentials, and bounded fields. A write does not contact a provider and does not implicitly add history, matching the original command.
- GET `/history?afterId=0&limit=100`: ascending bounded pagination, 1–200 items. IDs return as decimal `idText` strings; `payloadJson` preserves exact input string. POST `/history`: `{eventType,payloadJson}`. Payload must be valid JSON at most 65536 UTF-8 bytes. The JSON envelope has a route-only 512 KiB body limit to accommodate escaped strings. Unknown input fields are rejected.
- GET `/snapshot`: exact raw UTF-8 JSON, `application/json`, `x-foundry-sha256`, and `x-foundry-bytes`. Missing fixed file is 404; stored JSON `null` is 200 with body `null`. Malformed or unsafe files are failures, not absence.
- POST `/snapshot`: raw `application/json`, not an envelope. The route-only body limit is 16777216 bytes. The exact validated bytes replace `living-world-snapshot.json` atomically. Returns `{committed:true,filename,bytes,sha256,directory_synced,warning}`. If directory sync fails after rename, this is still a successful committed write with `directory_synced:false` and an explicit warning. Do not blindly retry it. Precommit invalid JSON/UTF-8 is 400; unsupported media type 415; oversized body 413; filesystem failures 500.

Storage schema incompatibility returns 503; invalid validated storage input is 400; unknown JSON fields can be rejected by the JSON extractor with 422. Other I/O/database errors are sanitized 500 responses. Admission saturation returns 429. Extractor errors preserve framework status/body shapes. Never treat an unknown outcome or transport error as proof a write did not commit.

## Source and limits

The fixed catalogs come from Feature-Foundry source `e1ba080b5c7590f1c844a6ed13b3a471709920b9`. Their exact compiled hashes are returned by capabilities. Original static catalog data is not user state; reseeding uses the reviewed original upsert semantics and does not remove omitted IDs.

Snapshots use descriptor-relative Linux operations, fixed filenames, exclusive private staging, advisory locking, file sync and atomic rename. This assumes cooperating writers in an owner-private directory, not defense against malicious same-user or privileged writers. Abrupt termination can leave staging files; no automatic cleanup or power-loss certification is claimed. The implementation does not automatically import an original Foundry user database.
