# Search results need a consistent derived index

Checked 2026-11-11. This is a **local synthetic correctness experiment**, not an app upgrade, performance comparison, database repair utility, or release acceptance. The [executable lab](../experiments/fts-consistency-lab/README.md) tests SQLite FTS5 external-content postings against complete canonical rows.

## Why this fills a practical gap

Athena's [catalog](research-catalog.md) and [test queue](research-test-queue.md) already propose an authoritative SQLite/FTS5 control with backfill, update/delete, and recovery tests. The inspected main revision `44384b809c80e03adbd62f8be9617d01e6ad9922` has no executable FTS5 consistency drill. The November 11 Unicode/input draft addresses discovery normalization and composition events; this experiment addresses persisted postings and transaction boundaries instead. It does not compare Tantivy or semantic search.

## A successful row count can hide broken search

Our fixture put one `gold` document in the canonical table before creating its external-content FTS index. A non-MATCH count returned **1**, while a MATCH query returned **0**. SQLite's general integrity check and FTS's internal check both passed; the external-content check failed with `SQLITE_CORRUPT_VTAB`. Creating maintenance triggers only made the next inserted document searchable. Explicit rebuilding made both documents searchable and retained their complete canonical metadata. These are observations of the retained fixture, not an allegation about Athena's current application.

The relevant documented distinction is short: external-content non-MATCH reads can bypass postings; triggers do not backfill old rows; FTS integrity checking compares external content only with `rank=1`; rebuild regenerates postings from content. [FT26001](https://www.sqlite.org/fts5.html#external_content_table_pitfalls)

## Keep the canonical record and its postings together

The fixture schema stores exact external keys, title, body, and opaque metadata text in `documents`. Search indexes only title and body. Search results resolve every hit to the complete canonical row in **one SQL statement**, retaining metadata and warnings byte-for-byte as UTF-8 text. Metadata is deliberately opaque, despite the historical `metadata_json` field name; no JSON validation or normalization is claimed.

Insert, update, and delete triggers maintain postings inside the same write transaction. Update/delete maintenance supplies the old indexed values explicitly, then update inserts the new values. All updates are covered rather than a potentially mistyped `UPDATE OF` subset. SQLite documents OLD/NEW trigger values and row-level execution; unknown `UPDATE OF` columns can be silently ignored. [FT26002](https://www.sqlite.org/lang_createtrigger.html)

The supported write helper uses `INSERT ... ON CONFLICT DO UPDATE`, not `INSERT OR REPLACE`. In our explicit `recursive_triggers=OFF` negative control, REPLACE left an old-term hit pointing at the replacement row's new title. The documented REPLACE delete-trigger condition explains why the operations are not interchangeable. [FT26006](https://www.sqlite.org/lang_conflict.html)

Tests cover inserts, metadata-only edits, indexed-text edits, rowid changes, deletions, rollback, write contention, and 120 deterministic mutation steps checked against an independent ASCII-token oracle. The oracle is a deliberately small test language, not a Unicode tokenizer implementation.

## Detect drift without pretending every failure means corruption

`audit()` retains three distinct results: general SQLite integrity, internal FTS integrity, and external-content consistency. An error includes its SQLite code/name. A busy writer or interruption is an unavailable check, not proof of index drift. Each diagnostic takes its own write transaction, so the combined report is **not one atomic audit** if another writer changes data between diagnostics. The isolated demo has no concurrent writer during its audits.

Search joins cannot repair or fully detect drift. The stale-term fixture returned the **current title for an obsolete matching term**. A left join catches orphan postings rather than hiding them, but neither join shape detects missing postings. Search does not silently run a complete audit before every query. A successful audit is evidence about that check's snapshot, not ongoing health or a guarantee that maintenance triggers still exist.

## Rebuilding is a bounded research operation, not an automatic remedy

The lab's rebuild runs inside `BEGIN IMMEDIATE`, regenerates postings, runs the external-content check, confirms canonical rows did not change, and commits. On an injected failure after rebuilding but before commit, both original canonical rows and the **original inconsistent postings state** were restored. A real progress-handler interruption during a 500-row rebuild produced `SQLITE_INTERRUPT`; after clearing the handler and rolling back if necessary, no partial rebuilt postings became the committed result. A later explicit rebuild passed.

The lab does not automatically retry a failed operation. It does not fix missing triggers, repair corrupt canonical content, validate an arbitrary schema, migrate tokenizers, or recover storage failures. A one-time rebuild can repair current postings while leaving the cause of future drift unchanged. The full-row comparison materializes this small fixture; it is not a bounded-memory production rebuild strategy. [FT26003](https://www.sqlite.org/lang_transaction.html) [FT26005](https://docs.python.org/3.12/library/sqlite3.html)

## Separate transaction visibility from process and power loss

A WAL reader retained matching old rows and old postings across another connection's committed edit. After ending its transaction, its next query saw matching new rows and new postings. This exercises snapshot visibility, not a recommendation to keep long read transactions open or evidence about checkpoint pressure. [FT26004](https://www.sqlite.org/isolation.html)

Two finite owned child processes exited abruptly using `os._exit(71)`, one before COMMIT and one after. A fresh connection subsequently saw the complete old state or complete new state respectively, including postings. Both children reported the new state inside their own connection before exiting. This tests a process-exit boundary on the recorded local filesystem; it does not simulate power loss, kernel failure, torn writes, disk-full recovery, network filesystems, or an acknowledged durability guarantee.

## Search language and identity are separate contracts

The lab's public search helper treats input as one tokenized phrase: it doubles embedded double quotes, surrounds the phrase with quotes, and separately binds the SQL parameter. The negative control binds `red OR blue` safely as SQL but still invokes FTS boolean syntax; the literal-phrase helper searches for the token sequence instead. Phrase quoting does **not** mean exact byte matching. [FT26001](https://www.sqlite.org/fts5.html#fts5_strings)

Exact external-key lookup uses binary text equality. `Mod-A:01` and `mod-a:01` are different fixture identities even when discovery finds both. The pinned tokenizer is `unicode61 remove_diacritics 0`; this is a declared fixture policy, not current Unicode normalization or a universal localization choice. Empty/NUL/invalid-UTF-8 and oversized queries are refused. Punctuation-only phrases can return an empty result. The 256-byte query bound and 1–100 result bound limit inputs/returned rows, **not total query CPU or memory**. Overflow returns an explicit error rather than a truncated success. No ranking, paging, authorization, or tenant isolation is implemented.

## Evidence and adoption gates

- Runtime: Python 3.12.14, SQLite 3.53.1, Linux. The reported SQLite source ID matches the official 3.53.1 release page, not a reproducible-build attestation. [FT26007](https://www.sqlite.org/releaselog/3_53_1.html)
- Current Python docs render 3.12.16; SQLite docs are rolling. Only the exercised APIs are locally evaluated. No upgrade or latest-version claim follows.
- Nine retained scenarios and 34 named checks, plus focused regression tests, are in the [receipt](../experiments/fts-consistency-lab/demo-result.json). Complete initial/after rows, errors, child output, compile options, and source hashes are retained.
- Run the target's actual storage path, data size, schema, tokenizer, identifier rules, supported OS and SQLite build before adopting any design. Test trigger migrations, shared writers, repair lock budgets, cancelled operations, metadata fidelity, and backup restoration separately.
- Compare complete-result latency, relevance, memory, database/WAL growth, and update cost against the actual baseline only after correctness. This experiment supplies no such measurements and no target recommendation.
- Rebuild is unsuitable where canonical data is untrusted/damaged or the writer lock and total work are unacceptable; a separate offline rebuilt database or generation-based search service would require its own swap, snapshot, and recovery tests.
