# Portable upgrade-copy acceptance · 2026-11-15

The portable launcher now exposes a user-selected upgrade to a **new** database,
not mutation of the old path. This closes the manual thirteen-command setup gap
for existing native schema checkpoints without touching held runtime assets.

## Verification

- Current native executable generated populated synthetic checkpoints at every
  schema 2–15. Each upgraded copy reached schema15, preserved the exported
  workspace semantically, and left original bytes unchanged. These are current
  writer compatibility tests, not historical release tests.
- Separately, the retained `filters` historical source checkpoint previously
  rebuilt in [historical acceptance](../native-historical-writers-2026-11-15/README.md)
  wrote a synthetic schema11 workspace. Its exact previously recorded source
  hashes and binary hash were rechecked. The new copy reached schema15 with
  identical workspace semantics and unchanged source. Linux only; no Windows
  historical writer or original distributed release identity is claimed.
- Tests cover explicit CLI selection, existing/racing destinations, corrupt
  sources, source aliases, source changes during upgrading, timeout cleanup,
  and old-runtime WAL refusal before SQLite opens the captured source.
- An initial test used the nonexistent command `export-backup`; this failed before
  comparison and caused subsequent subcases to encounter the retained output.
  Corrected to the published `load-backup` command; failed local log retained.
  No application behavior was weakened to pass that harness.

## Limits

The source must be stopped. Hash checks detect sampled changes, not a continuous
lock or live-backup protocol. The shared Python SQLite WAL gate remains required.
The copy is explicitly selected later; nothing is installed, restored or switched
silently. Private owner databases were not used. This does not certify source
repositories safe to delete or cover all original application capabilities.
