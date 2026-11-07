<!-- Athena managed engineering page. Original source and revision are retained in migration/engineering-atlas. -->
# Storage durability and receipt integrity

Reviewed October 28, 2026. A project-neutral guide to measured storage choices, explicit contracts and trustworthy experiment receipts. This is not a universal database ranking or permission to migrate another application.

## Start with the required contract

- Preserve every required byte, key, warning and relationship, not merely row counts.
- Compare transaction boundaries and acknowledged-write durability before comparing timings.
- Reopening a database does not prove cold OS caches or physical power-loss survival.
- Keep memory, temporary file growth and retained database size separate.
- A key/value replay cannot establish relational snapshot-store equivalence.

## Scoped findings

| Study | Verified result | Decision |
|---|---|---|
| [Prepared SQLite insertion](https://github.com/Herbertofury/Engineering-Atlas/tree/b66e2f0b2a559504d284fd9ac85dc2f924c0f137/experiments/rust-storage-lab) | Complete generated payloads, equal transaction boundaries | Preparation overhead is workload-dependent; no target-project recommendation |
| [SQLite versus redb ordered insertion](https://github.com/Herbertofury/Engineering-Atlas/tree/b66e2f0b2a559504d284fd9ac85dc2f924c0f137/experiments/ordered-kv-lab) | Full public-source replay and generated density cases; rollback and readback checks | Sorted cursor did not win here; redb remains isolated |
| [Actual connection contract](https://github.com/Herbertofury/Engineering-Atlas/tree/0c72b9953e1fe2e957608a4bcef1dc0f95710b04/experiments/sqlite-contract-lab) | Three failing baseline regressions repaired; 108 unit, eight integration and 55 HTTP checks | Applied to Atlas stores only; not a speed or physical durability claim |
| [Optimized-interpreter receipt repair](https://github.com/Herbertofury/Engineering-Atlas/tree/b66e2f0b2a559504d284fd9ac85dc2f924c0f137/experiments/ordered-kv-lab/evidence/receipt-guard) | 46 malformed cases rejected in normal and optimized Python; 82 historical samples revalidated; 32 fresh Rust processes through the optimized runner | Explicit acceptance checks replace debug assertions |

## Preserve the failure, not just the fastest retry

The first ordered-KV run hit its 64 MiB per-file budget during dense redb insertion. That incomplete pass and its 18 successful preceding samples remain evidence. Runs with 128 MiB are distinct diagnostics, not a repair that satisfies the old limit. Final file size does not establish maximum transient size. Upstream growth code suggests an explanation, but the attempted syscall trace was denied and the exact failing syscall was not observed.

The cursor API also rejects duplicate or out-of-order insertion rather than replacing values like ordinary insert. A focused regression verifies rejection without losing prior values. Its preordered, unique-key contract must not be generalized to arbitrary ingestion.

## Durability is a requirement, not a benchmark shortcut

[SQLite documentation](https://www.sqlite.org/pragma.html#pragma_synchronous) distinguishes DELETE/FULL from DELETE/EXTRA. Atlas's actual snapshot, job and experiment stores now request EXTRA and verify synchronization, foreign keys and journal mode. Existing safe modes and records are retained. Unsafe modes and configuration inside an active transaction fail closed. Temporary/in-memory fixtures remain explicitly ephemeral.

The historical FULL benchmark is unchanged. EXTRA's occasionally faster measured median does not prove that more synchronization improves speed. Virtualized storage, few rounds and scheduling noise limit that inference.

## Receipts must survive optimized execution

[Python documents](https://docs.python.org/3/reference/simple_stmts.html#the-assert-statement) that optimization removes assert statements. The old runner therefore lost identity and correctness checks under optimization. Synthetic malformed receipts also exposed missing schema, payload-size and version bindings.

The new gate uses Atlas's existing duplicate-key/non-finite decoder and explicit errors for wrong fields, schema, versions, identity, counts, bytes, timing relationships or correctness flags. Unexpected fields cannot replace parent round attribution. This validates a fixed measurement protocol, not trust in an arbitrary executable.

## Reproduce and evaluate responsibly

1. Use pinned manifests, lockfiles and source identities.
2. Verify the retained public-input hashes; a refreshed API response is a different workload.
3. Use a new output directory and a fixed budget; preserve failed output and databases.
4. Check complete data and rollback before interpreting timings.
5. Re-run against an actual target's current implementation before placing a recommendation in that target's wiki or TODO.

[Evidence index](Engineering-Experiment-Evidence) · [Algorithms and storage](Engineering-Algorithms-and-Storage) · [Research method](Engineering-Research-Method)
