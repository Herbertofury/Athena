# FTS5 external-content consistency foundation

Date: 2026-11-11

## Decision and gap

Turn Athena's existing planned FTS5 consistency/backfill/rebuild acceptance question into an executable local correctness drill. Main `44384b809c80e03adbd62f8be9617d01e6ad9922` and open drafts through #38 were inspected first. This does not duplicate Unicode-input, general SQLite recovery, conditional edits, file ingestion, ZIP inspection, or process-pipe work. Main/integrated release and earlier drafts are unchanged. Initial preparation was local-only. Any subsequent draft publication and exact remote verification are recorded separately in the pull request; no merge or deployment is authorized by this research.

## Primary documented

- [FT26001](https://www.sqlite.org/fts5.html): external-content indexing, query strings, integrity checking, and rebuilding.
- [FT26002](https://www.sqlite.org/lang_createtrigger.html): trigger event/OLD/NEW semantics and UPDATE OF caveat.
- [FT26003](https://www.sqlite.org/lang_transaction.html): explicit transactions, writer serialization, commit/rollback behavior.
- [FT26004](https://www.sqlite.org/isolation.html): independent connections and WAL read snapshots.
- [FT26005](https://docs.python.org/3.12/library/sqlite3.html): explicit autocommit selection, connection state and progress-handler cancellation; rendered Python 3.12.16.
- [FT26006](https://www.sqlite.org/lang_conflict.html): REPLACE delete-trigger conditions.
- [FT26007](https://www.sqlite.org/releaselog/3_53_1.html): exact observed SQLite 3.53.1 source ID. This is not a build attestation or a recommendation to upgrade.

All seven links were opened on the checked date. Official rolling docs are distinguished from the installed Python 3.12.14/SQLite 3.53.1 execution. Source summaries are original and brief. No third-party implementation was copied into the fixture.

## Predeclared hypothesis and controls

A canonical-row/trigger-backed index can keep inserts, edits and deletions consistent when both are committed together; an external-content check plus rollback-protected rebuild can detect and repair **postings drift** for these fixtures. The controls intentionally omit backfill, remove a trigger, use REPLACE with recursive triggers disabled, abort writes/rebuilds, interrupt SQLite, and exit an owned process across COMMIT. Pass requires preserved full metadata, expected old/new results, distinct failure codes and no silently partial success.

The [lab](../experiments/fts-consistency-lab/README.md) records nine scenarios with 34 named checks. The 26 initial regression tests additionally exercise orphan detection, exact identity, FTS syntax versus SQL parameters, bounds, contention and 120 deterministic mutation steps against an ASCII-token oracle. Initial evidence is retained. See the final [validation summary](../experiments/fts-consistency-lab/validation-summary.json) for current counts and aggregate checks.

## Measured interpretation

A non-MATCH count, general integrity check and internal FTS integrity check all passed while an old canonical row was absent from MATCH results. The external-content check rejected that state. Trigger installation did not backfill it. Rebuild restored the fixture's missing postings without changing canonical rows. A missing update trigger also produced an old-term hit resolving to a new title, showing that a complete metadata join alone is insufficient.

Write/rebuild fault rollback, actual SQLite interruption, independent-connection snapshots, and before/after-commit process exit reproduced their declared outcomes. The child-exit cohort uses fresh post-exit parent connections. The demo records environment, complete outputs and source hashes, not invented timing, peak memory, or broad durability claims.

## Rejected shortcuts and remaining gates

Reject row-count equality as an index oracle, internal-only checking as external consistency proof, join success as freshness proof, blind retry/rebuild as an automatic repair policy, REPLACE as a universal UPSERT substitute, and SQL binding as a literal FTS-language policy. Rebuild does not restore missing triggers. A passing check is point-in-time evidence.

This record reports local validation. Hosted checks for any later published commit must be verified separately and must not be inferred from these results. Aggregate checks retain the main branch's known cross-root documentation-link error without fixing or waiving it. No source-index entry from another draft is overwritten: future authorized integration must union all fragment entries. No performance comparison, corrupt-database repair, power-loss test, cross-platform acceptance, migration, or target project recommendation is made.
