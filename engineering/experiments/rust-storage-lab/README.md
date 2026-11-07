# Rust SQLite payload-density experiment

Measured October 26, 2026 on Linux x86_64, Rust 1.99.1 and bundled SQLite 3.54.1. Generated data, not a target project's baseline. [Raw samples](results-2026-10-26.json) and [harness](../../apps/atlas-lab/src/storage_lab.rs).

Both strategies insert the same 256 complete binary records in one transaction using DELETE journaling and synchronous FULL. The comparison changes only repeated SQL preparation versus reusing one prepared statement. Seven paired rounds alternate strategy order. Every database is reopened, every payload byte compared, and integrity checked. Creation/schema setup is outside the write timer; transaction begin, writes and commit are inside. Read timing includes query preparation and complete materialization.

| Payload per record | Prepare per record write+commit median | Prepare once write+commit median | Interpretation |
|---|---:|---:|---|
| 512 bytes | 2.823 ms | 2.315 ms | Preparation overhead is visible in this small-payload workload |
| 8 KiB | 7.430 ms | 7.276 ms | Small median difference; do not promote from this alone |
| 64 KiB | 30.971 ms | 30.200 ms | Payload/storage cost dominates this comparison |

All 42 complete readbacks matched. This does not establish real physical power-loss durability: the experiment runs on a virtualized filesystem with host caches. Reopening is not a cold-cache claim. No peak-memory, concurrent-reader/UI or production workload acceptance is included. The same commit boundary is retained, unlike misleading comparisons that batch acknowledgments or disable synchronization. No recommendation has been added to another project's wiki/TODO from this experiment.

SQLite's own filesystem comparison is historical and explicitly workload-dependent, not a universal “35% faster” guarantee: https://www.sqlite.org/fasterthanfs.html . Durability semantics: https://www.sqlite.org/pragma.html#pragma_synchronous .
