# Complete-record pagination foundations

Date: 2026-11-11

## Gap and decision

Main `44384b809c80e03adbd62f8be9617d01e6ad9922` and open drafts through #40 were inspected. Existing bounded-query, storage, FTS, and UI work does not test multi-request completeness under intervening mutations. This contribution adds only a separate [synthetic SQLite lab](../experiments/pagination-snapshot-lab/README.md), guide and source fragment. It does not modify active integrated-release or UI/mod files.

The hypothesis is narrow: capturing complete records in one committed generation can preserve a fixed page traversal despite later live-row edits, with an explicit total order, matching continuation contract and no silent fallback on retirement. This is not a hypothesis that snapshot copying is faster or universally preferable.

## Primary documented

- [PG26001](https://www.sqlite.org/rowvalue.html): row comparisons and scrolling-window queries; applicable tuple semantics, not a cross-request snapshot guarantee.
- [PG26002](https://www.sqlite.org/lang_select.html): ORDER BY ties, collation and LIMIT boundaries.
- [PG26003](https://www.sqlite.org/isolation.html): committed-state visibility and transaction snapshots.
- [PG26004](https://www.sqlite.org/wal.html): reader snapshots and checkpoint tradeoffs. No checkpoint-performance experiment was run here.
- [PG26005](https://docs.python.org/3.12/library/json.html): decoder duplicate-name/non-finite behavior and parsing limits. The current 3.12 page renders 3.12.16; runtime is 3.12.14.
- [PG26006](https://www.sqlite.org/lang_transaction.html): explicit transaction boundaries and one writer.

All six sources were opened on 2026-11-11. SQLite documentation is rolling; execution was Linux, Python 3.12.14, SQLite 3.53.1. Source ID and compile options are retained as reported runtime metadata, not reproducible-build provenance.

## Measured evidence

Nine scenarios and 19 named checks retain complete original and returned rows. Live OFFSET controls repeated/omitted records after insertion/deletion. Live keyset controls still repeated/omitted records moved across the sort boundary. A maximum-ID control preserved IDs but mixed payload versions. A sort-value-only boundary skipped a tied unseen record.

The generation lane preserved complete original rows through edits, deletions and additions; unchanged cursor replay returned identical pages. Failed captures did not commit partial generations. Retirement rejected the old continuation rather than selecting a newer generation. A deliberate coherent cursor edit successfully skipped records, preserving evidence that the cursor is **not authenticated**.

The final focused suite covers every page size 1–25 over 51 tied rows, a deterministic 80-row mutation schedule, exact UTF-8 budgets, storage generation limits, ownership/rollback, malformed cursor cases, independent database binding, fresh-connection resume, and an in-flight retirement snapshot race. See [validation](../experiments/pagination-snapshot-lab/validation-summary.json) and [independent review](../experiments/pagination-snapshot-lab/review-summary.json) for exact current counts. Initial receipts remain retained locally.

## Scope and rejected shortcuts

Reject a cursor as proof of snapshot consistency, an ID high-water mark as proof of payload version, successful per-page queries as proof of a complete export, and JSON validation as cursor authentication. A caller must preserve the complete page chain; `complete=true` is not a delivery acknowledgement. Snapshots do not authorize disclosure of historical records. Database copies preserve identity; no restore epoch is implemented. The API is trusted fixture code, not a malicious-schema/file security boundary.

Materialization and prefix validation have costs. No comparative latency, peak RSS, end-to-end UX, disk bound, retention/garbage collection, crash recovery or target adoption is demonstrated. Whole-target evidence is required before recommending transfer. The main branch's inherited cross-root link failure is retained without weakening its validator. Hosted CI, if publication is authorized, must be checked for that exact commit separately. Concurrent source-index fragments must be unioned at integration.
