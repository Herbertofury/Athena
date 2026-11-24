# Native Foundry workspace recovery
This incremental native Athena change backs up every visited room layout, not only the active room. Restore validates the entire document before updating anything, replaces included rooms, retains other current rooms, and restores the active selection. The active layout wins over any stale same-room map entry.

Exports include only the reviewed layout schema: theme/room IDs, time, normalized object positions and pinned state. Unknown fields are stripped. Imports are bounded to 1 MB, IDs validated against the existing neutral catalog, and malformed or unsupported backups leave state unchanged. Pending reads cannot overwrite newer imports, edits or unmounts. Corrupt saved envelopes stay recovery-held even after import: the imported draft can be inspected/exported, but cannot silently replace unknown or partially corrupt original data. Manual recovery remains necessary.

Verification: 20 focused Foundry tests and full npm test passed locally before publication. Added hosted browser coverage for full-workspace download, validated restore, reload persistence and unsupported-version rejection. Hosted outcome must be read from the exact commit's CI.

Scope: browser-host storage only; host reports write failures. Export is an explicit backup, not a claim of native database durability. This does not port original 3D rendering, mascots, artist worlds, SQLite/Tauri or provider authorization. Source repositories and existing historical artifacts remain untouched. No new artist, image, private provenance or provider data is included.
