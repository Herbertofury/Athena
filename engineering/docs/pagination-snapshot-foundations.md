# Pagination is also a data-version contract

Checked 2026-11-11. The [local lab](../experiments/pagination-snapshot-lab/README.md) compares real SQLite queries over invented catalog records. It supplies correctness evidence, not a performance ranking, a production API, or an accepted change to Athena's runtime.

## The gap

Existing Athena work tests single-query budgets, storage snapshots, FTS consistency, and UI/input behavior. The inspected corpus and open drafts through #40 did not contain an executable multi-page traversal contract covering intervening insertions, deletions, sort changes, complete payload preservation, and continuation retirement. This experiment is independent of the active UI/mod work.

A page can be a valid query result while a sequence of pages is an invalid export. Decide whether the operation is a changing live feed or a traversal of one fixed dataset before choosing its cursor.

## What the negative controls actually did

The [retained receipt](../experiments/pagination-snapshot-lab/demo-result.json) contains the full initial rows and every returned page:

- An insertion before an OFFSET boundary caused an already-seen record to appear again.
- Deleting an already-seen record shifted the OFFSET boundary past an unseen record.
- Live keyset pagination still repeated a record moved after the boundary and omitted one moved before it. A cursor is not a frozen dataset.
- Restricting rows to a maximum ID preserved the ID set but returned an edited payload for a later page. A high-water ID is not a content version.
- Continuing from only the sort value skipped an unseen tie. The fixture's `(sort_value, id)` pair retained a total order.

These are deliberately selected mutation schedules, not claims that OFFSET is always wrong or that every live keyset query duplicates rows. With a stable dataset, matching order and boundary, both approaches can produce a correct traversal. SQLite documents lexicographic row-value comparisons and scrolling queries; it does not make a row-value cursor into a cross-request snapshot. [PG26001](https://www.sqlite.org/rowvalue.html)

SQLite leaves ordering among equal complete ORDER BY values undefined. The fixture uses bounded non-null integers and unique IDs, avoiding that ambiguity. Nulls, text collations, localized order, descending/mixed-direction order and floating-point keys would need their own contract. [PG26002](https://www.sqlite.org/lang_select.html#orderby)

## The generation-pinned fixture

`capture()` starts one write transaction, selects the requested bucket, applies row and UTF-8 payload-byte acceptance limits, and copies **all record fields** into a generation. It verifies the copy before commit. An injected post-copy failure and an oversized capture each left zero published generation rows. Another writer was refused while capture owned the writer transaction. [PG26006](https://www.sqlite.org/lang_transaction.html)

A generation is immutable **through the provided API**, not protected from arbitrary SQL or a malicious database writer. Later live-table mutations do not rewrite it. Paging reads the generation header and rows in one short read transaction, ordered by `(sort_value, id)`, and never joins frozen IDs back to current live payloads. Every page retains the original payload text, including unknown fields and warnings. The payload is opaque, not validated JSON.

The test suite traverses a tied 51-row corpus with every page size from 1 through 25. A separate deterministic schedule mutates live records between every page of an 80-row captured corpus. Complete original records remain equal in the tested generation traversal. Replaying the same cursor yields the same page while the generation remains available.

Separate connections see complete committed states; a WAL read transaction keeps its prior snapshot across other commits. This lab does not claim that returning a page synchronizes it with a subsequent edit. [PG26003](https://www.sqlite.org/isolation.html)

## Cursor checks are not authorization

The JSON cursor binds format version, freshly created database identity, generation, exact bucket, order version, page size, last tuple and prefix count. Decode rejects duplicate/unknown fields, invalid types including booleans as integers, non-finite numbers, invalid text and overlong wire input. Python's JSON decoder otherwise accepts repeated names and non-finite values by default. [PG26005](https://docs.python.org/3.12/library/json.html)

**The cursor is readable and unsigned.** The negative security control coherently edits its boundary and prefix count and successfully skips rows. Structural checks and an existing boundary do not authenticate a cursor. `complete=true` describes reaching the generation's end under the declared continuation; it does not prove the caller received, retained or processed every earlier row. Complete-output claims here require traversal from the first page with unchanged issued cursors, no lost page, and a final count/content comparison.

Database UUIDs distinguish independently created fixture databases. A copied/restored database retains that identity; the lab does not solve restored-generation aliasing or prove current provenance. The demo deliberately substitutes distinct public fixed IDs for exact replay, while normal fixture creation generates UUID4 values. Neither form is a credential.

This is not an access-control system. A production service still needs current authorization on each request, tenant/query scoping, a deliberate cursor-authentication or server-side continuation design, retention policy, and transport handling. Historical snapshot contents must not be treated as historical permission to disclose them. No credentials, persistent external grants or signing keys are created here.

## Retirement must stay explicit

`retire()` marks a generation unavailable. A later request fails with `GenerationUnavailable`; it never silently falls forward to a newer generation. The caller can explicitly start a new traversal. Previously emitted pages remain partial historical output if continuation fails; a consumer must not label that partial export complete.

Retirement is checked against the page's read snapshot. In the controlled WAL race, retirement committed after the page had pinned its snapshot, so the in-flight page finished from that snapshot and the next request was refused. This is not immediate revocation, secure deletion, or proof that data already returned can be withdrawn. Retired rows remain stored and continue to consume the generation limit. No garbage collection is implemented.

## Costs and alternatives

The fixture limits each generation to at most 1,000 rows and 1 MiB of payload bytes, each payload to 4,096 UTF-8 bytes, the database to eight stored generations, cursors to 1,024 bytes, and page sizes to 1–25. Limits reject the whole capture rather than committing a truncated success. Payload bytes exclude headers, keys, indexes and SQLite/WAL allocation. The live table itself has no total row/storage limit. These are application fixture limits, not process RSS, disk, CPU or deadline guarantees.

Capture materializes records in Python and holds a writer transaction. Each continuation additionally counts the prefix to check sequence coherence, which can scan earlier entries. Do not infer an asymptotic keyset speedup for this implementation from a vendor example, or hide the copy/index/retention costs. No timing or peak-memory comparison was performed.

Alternatives depend on the required semantics:

- A live feed may intentionally permit change, provided the UI/export contract says so.
- A single long read transaction can hold a database snapshot, but connection lifetime and failure/continuation semantics matter. SQLite documents that long WAL readers can impede checkpoint progress. This experiment does not measure that cost. [PG26004](https://www.sqlite.org/wal.html)
- A complete small result fetched at once avoids continuation state but needs its own total-result limits.
- Versioned records or a server-maintained continuation may avoid repeated full snapshots, but require separate retention, authorization, crash and migration tests.

Before any target adoption, replay its actual baseline and workload, preserve every field, define freshness versus completeness, and measure whole-operation latency, memory, storage and write interference. No application or mod recommendation follows from this finite correctness drill.
