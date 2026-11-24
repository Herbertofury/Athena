# Complete received project JSON: coverage and measured storage cost

2026-10-28. Atlas baseline: `0be145135e150cbde6a64fcaf655d51a4ef60f0f`.

## Implementation, reused rather than replaced

The optional `collect-modrinth-raw ID_OR_SLUG OUTPUT.sqlite` CLI uses the existing official public client, URL rules, request identity binding, two-MiB response budget, redirect/timeout/rate-limit handling and SnapshotStore. The current projection and queued collection workflow remain unchanged.

An opaque `ProjectRecord` owns the already validated typed projection plus the complete original UTF-8 response. Its fields are private, it has no unchecked/deserializing constructor or mutable accessors, and the store rebinds the current request before writing. This avoids a redundant whole-response parse without skipping the validation needed to construct the record. Readback reparses persisted data and binds the requested canonical ID, so a corrupt/misbound database row is not trusted.

A separate provider namespace in the existing snapshot table stores the original response exactly, including outer whitespace, unknown fields, large number spelling, and absent/null/empty distinctions. Existing projection rows are not migrated or overwritten. Snapshot and attempt insertion remain one transaction with the existing synchronous FULL setting. Failures retain the previous generation. URLs and markup are data only; no linked files or media are fetched or executed.

The [official project schema](https://docs.modrinth.com/api/operations/getproject/) contains considerably more metadata than the intentionally small typed projection. Unknown fields are retained, not semantically certified. A parsed envelope is not proof of account authorization, content ownership or every field's meaning.

## Explicit coverage status

- Implemented: optional single-project CLI, immutable record envelope, exact local storage/readback and compact hash/generation receipt.
- Fixture-tested: request mismatch, malformed/oversized data, unknown/large-number/null preservation, atomic rollback, corrupt stored identity, reopened failure preservation, invalid CLI input before any database/transport.
- Retained real public data tested: Sodium, Iris and Lithium responses already legitimately collected in the earlier public study. No new provider requests in this pass.
- Not verified here: a fresh network execution of the new CLI coordinator, queued UI integration, authenticated collection, linked-media completeness, native rendering, peak memory or power-loss durability.

## Complete-data evidence and cost

Each retained response has 29 top-level fields absent from the existing projection, including license, loaders/game versions/environment, categories and source/support links. All earlier typed fields remain equal. Every raw snapshot was byte-equal to its input, and all three reopened stores retained that exact payload after an explicit failed refresh.

Full response sizes were 12,840 / 7,267 / 6,200 bytes; the corresponding serialized projections were 11,401 / 5,845 / 4,830 bytes. The extra data is not free: after 16 stored generations, complete/projection database sizes were 225,280/212,992; 147,456/114,688; and 147,456/98,304 bytes. This is logical local file size, not total filesystem allocation.

The final executable used four retained warmup pairs and twelve measured alternating-order pairs per response. Complete-path median write-plus-commit costs were approximately 1.772 / 1.922 / 1.676 ms, compared with projection-path 2.305 / 1.815 / 1.554 ms. Results are mixed and output coverage differs, so these are cost observations, not a fair speed ranking or a no-loss performance promotion. Earlier observations remain in `receipts/` and `summary.json`; the final bounded-reader, source-hashed harness results are in [receipts-final](receipts-final/) and [final summary](final-summary.json). Every final receipt records harness, adapter, snapshot-store and input hashes.

Ninety-one Rust unit tests and five persistence integration tests pass. The additional parser/store tests include exact large-number bytes and rollback after an injected attempt-write failure. Clippy with warnings denied and formatting pass. The initially malformed harness build is retained locally; it was corrected before measurement. Original third-party response bodies and test databases remain local, not republished in Atlas.

## Reproduce and limits

Use pinned Rust 1.99.1 and locked dependencies. Build the `project_raw_lab` release example, then pass a legitimately retained public response and a fresh output directory. Existing directories are rejected instead of overwritten; reads are bounded, measurements have a 30-second loop budget, raw receipts preserve warmups and order, and verification is outside timed sections. The optional collection CLI performs a real public request when explicitly invoked; the measurement example does not.

This advances response completeness in Atlas, not a universal storage/stack decision or any other project's recommendation. Keep the light projection for its existing contract, and keep the raw path explicitly scoped until its UI and live-network gates are verified.
