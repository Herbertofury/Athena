# Offline candidate: explicit index lifecycle and last-good persistence

**Isolated R&D; no production Athena behavior changed.** Implements the missing
update lifecycle noted in #186. Reuses its compatible matcher rather than replacing
it again. Preparing a validated snapshot creates an exportable draft; committing
first calls an atomic persistence adapter and only then swaps the in-memory index.
A rejected write leaves both the prior index and draft available. Rollback means
explicitly committing a previously retained export, not silently discarding history.

Run `node research/offline-index-lifecycle-2026-11-15/test.cjs` with preinstalled Node.
No dependencies, models, services or network APIs used. Tests use the actual 98-lesson
Athena corpus. The added `quasar recovery` phrase is an **explicit synthetic local
edit**, not acquired external knowledge; quota failure is injected, not a real disk
exhaustion. All eleven tests pass locally, including:

- Initial full-corpus ingestion, immutable prepared input and defensive result copies.
- Duplicate/malformed/oversized input and failed persistence leave exact last-good bytes.
- New local evidence becomes searchable only after commit.
- A new Node process reopens an actual temporary disk snapshot and retrieves the edit.
- Explicit rollback restores prior exact bytes/results; code-looking content stays data.

`evidence.json` retains hashes, assertions and rejected-operation diagnostics.
Dedicated Windows/Linux CI records platform receipts; its status is separate from
local verification. The temporary test files are created solely by this test and
removed afterward. No user backups or repository source data are deleted.

## Deliberate limits

The 4 MiB serialized limit is explicit and rejects rather than truncates. It is an
R&D resource budget, not an app requirement. The file adapter uses temporary-write
plus rename: tested for single-writer process/reopen behavior, **not fsync-backed
power-loss durability**. Concurrent writers, forced termination mid-write, Windows
filesystem edge cases and large-corpus memory/latency need further acceptance.
Historical exports are caller-managed; this is not an unbounded history store.
Corrupt persisted data throws rather than silently resetting. Recovery UI, native
integration, automatic discovery, scheduling and model training are not implemented.
