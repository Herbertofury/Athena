# Ordered complete-record storage comparison

Measured 2026-10-28, Linux x86_64, Rust 1.99.1, SQLite 3.54.1 (rusqlite 0.41.0), redb 4.4.0. **No candidate promoted.** This is an isolated ordered-key/value replay, not a replacement for Atlas's relational snapshot store or evidence for another project.

## Contract and outcome

Reuse the existing prepared-once SQLite insertion strategy. Each transaction stores 256 complete payloads under ascending unique integer keys. Public-source replay repeats retained Sodium/Iris/Lithium Modrinth JSON without projecting away fields; the separately generated density workload uses 64 KiB per row. Setup and input construction are outside write timing. Transaction begin, all inserts and commit are inside it. Commit time is also reported separately, not added twice. All reads materialize and compare every key and byte after an explicitly aborted overwrite and new insert. Integrity checks run afterward.

The original 64 MiB per-file budget failed on generated redb standard insertion with SIGXFSZ. Its 18 preceding samples and all raw outputs are retained. A separately labeled 128 MiB diagnostic completed 32 samples; it does not satisfy or erase the original budget. Native syscall tracing was denied, not bypassed. Geometric growth is visible in upstream source, but the exact failed syscall was not observed. Final file size does not measure transient maximum size.

Four rounds rotate four lanes. Diagnostic medians in milliseconds:

| Replay | Strategy | Transaction + commit | Commit subset | Full read |
|---|---|---:|---:|---:|
| Public-source | SQLite DELETE/FULL | 9.256 | 4.550 | 2.215 |
| Public-source | SQLite DELETE/EXTRA | 7.686 | 5.320 | 2.163 |
| Public-source | redb insert/Immediate | 11.327 | 5.799 | 2.462 |
| Public-source | redb cursor/Immediate | 12.997 | 5.495 | 2.276 |
| Generated 64 KiB | SQLite DELETE/FULL | 62.451 | 25.978 | 25.102 |
| Generated 64 KiB | SQLite DELETE/EXTRA | 40.328 | 17.127 | 19.374 |
| Generated 64 KiB | redb insert/Immediate | 139.445 | 39.689 | 54.753 |
| Generated 64 KiB | redb cursor/Immediate | 185.576 | 52.866 | 24.079 |

All 32 diagnostic readbacks/rollback/integrity checks passed. A separate in-memory regression verifies that duplicate and descending cursor keys are rejected without replacing prior values, and subsequent valid insertion still works. Standard insert supports replacement; cursor insertion does not. The experiment uses unique preordered input, so it does not hide sorting cost or claim identical general APIs.

## Interpretation and limits

The new cursor algorithm did not outperform standard insertion here, despite upstream's scoped performance claim. SQLite's EXTRA lane appearing faster than FULL is not proof that extra synchronization speeds storage: four small, noisy rounds on a virtual filesystem do not establish that causal conclusion. No universal database ranking follows.

DELETE/FULL is retained as the existing experimental baseline, not mislabeled equivalent durability: SQLite documents potential last-transaction loss after power failure in this mode. DELETE/EXTRA is a separate durability candidate. redb uses Immediate. No physical power-loss equivalence was tested. Both use nominal 8 MiB cache settings, restored on SQLite reopen; those are not equal total-memory budgets. Reopening does not establish cold OS caches. No peak-memory, UI, concurrent access, relational-constraint, migration or crash-recovery acceptance is claimed.

Each process has 512 MiB address-space, 8 CPU-second and 12 wall-second limits; the pass has a 120-second budget. Failed databases and raw evidence remain retained outside the public repository. Sources and lock are pinned; no existing app or dependency was changed.

## Evidence and sources

- [Original incomplete pass](evidence/budget64.json), [separate diagnostic](evidence/diagnostic128.json), [failure](evidence/failure.json), [raw process outputs](evidence/wire-output.json).
- [Harness](src/main.rs), [cursor correctness regression](tests/cursor.rs), pinned Cargo manifest and lock beside this file.
- Existing source register: RX104, ST123, ST124. Exact release: https://github.com/cberner/redb/releases/tag/v4.4.0 (published 2026-10-13, reviewed 2026-10-28).
- Cursor semantics: https://github.com/cberner/redb/blob/v4.4.0/src/table.rs . Growth implementation: https://github.com/cberner/redb/blob/v4.4.0/src/tree_store/page_store/page_manager.rs .
- SQLite durability and connection-local cache: https://www.sqlite.org/pragma.html#pragma_synchronous and https://www.sqlite.org/pragma.html#pragma_cache_size .

First harness compilation missed the ReadableDatabase trait import; the first regression compilation missed ReadableTableMetadata. Both were repaired, with failed compiler logs retained privately. Final focused Rust regression and strict Clippy passed. Dependency audit against RustSec commit 40f5be6fb12ed93fc591bf4ab23b7d793b3f2239 reported no matches or warnings; this is not a safety guarantee.

## Reproduction

Build the pinned harness with `cargo build --release --locked --manifest-path experiments/ordered-kv-lab/Cargo.toml`. Run `python3 experiments/ordered-kv-lab/run.py --inputs PUBLIC_RESPONSE_DIRECTORY --output NEW_DIRECTORY --file-budget-mib 64`. The input directory must contain AANobbMI.json, YL57xq9U.json and gvQqBUqZ.json. Compare their SHA-256 values to the retained receipts; newly fetched responses are a new workload, not an exact reproduction. Use 128 only for a separately labeled diagnostic. The runner retains process outputs before rejecting failed receipts, refuses an existing output directory and never deletes databases. The published runner adds configurable paths/budget and binary-change checking; the raw measured runs used equivalent fixed-path scripts retained privately.

The published argument-based runner was exercised separately: [32-sample repeat](evidence/published-runner128.json), [raw outputs](evidence/published-runner-wire.json). It also passed complete readback, rollback and integrity checks. The table above continues to use the first diagnostic rather than selecting faster retry timings.

## Receipt acceptance repair, 2026-10-28

The first runner used Python assertions for sample identity and correctness flags. [Exact extracted baseline checks](evidence/receipt-guard/baseline-results.json) show these disappear under optimized execution; schema, expected payload length and engine versions were also unbound even without optimization. These are synthetic malformed receipts, not evidence that the real Rust harness produced incorrect records. The original script and all earlier measurements remain retained.

The runner now reuses Atlas's strict duplicate/non-finite JSON decoder and an explicit [fixed receipt gate](receipt_gate.py). It checks exact schema and fields, pinned versions, lane/workload, integer counts and timings, complete expected payload bytes, file budget and true correctness flags. Unknown fields cannot overwrite parent round attribution. It bounds input reads and checks input fingerprints after each process. This does not establish executable trust or eliminate adversarial filesystem races.

[Verification](evidence/receipt-guard/verification.json): 46 malformed cases rejected in normal and optimized Python, all 82 historical samples revalidated without editing them, and [32 fresh real Rust executions under the optimized runner](evidence/receipt-guard/optimized-run.json) passed. The [raw outputs](evidence/receipt-guard/wire-output.json) remain available. All 93 Python tests passed. No new performance ranking is drawn from this verification pass; the original 64 MiB failure is still a failure. The 128 MiB run remains diagnostic only.

[PYASSERT01](https://docs.python.org/3/reference/simple_stmts.html#the-assert-statement) documents why acceptance must not depend on debug assertions. This repair changes executable validation rather than disabling optimization or asking callers to avoid it.
