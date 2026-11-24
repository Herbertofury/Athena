# Compact addresses and integer observation references

Evaluated 2026-10-29. Isolated experiment; the working application store is unchanged. Sources: SQLINT01, SQLFK01.

## Diagnose before replacing

Read-only page accounting traced the previous all-unique candidate's 28,672-byte overhead to its extra snapshot table and hash index. The new candidate reuses that implementation, including full-byte collision checks, immutable records, per-generation transactions, attempt history and the existing EXTRA synchronization contract. It changes the combined layout: 32-byte binary SHA-256 keys identify payloads; a declared INTEGER PRIMARY KEY identifies each payload row; snapshots reference that integer.

[SQLite documents](https://sqlite.org/rowidtable.html) the special relationship between INTEGER PRIMARY KEY and rowid. The foreign key references the declared column, with [per-connection enforcement](https://sqlite.org/foreignkeys.html) preserved. This is a combined layout test, not an independent speed claim for either binary hashes or integer references alone.

The new format has a different local application marker. Cross-format tests reject each other's closed fixture databases without changing their bytes. Wrong key types/lengths, collisions, tampering, rollback after a forced attempt failure, 1,000 changed/duplicate generations and read-only reopen remain tested. No migration path or production adoption is supplied.

## Same work, three lanes

[Three retained passes](compact-summary.json) contain 324 timed samples: actual SnapshotStore, prior addressed candidate and compact candidate, each with five retained public generations, an 80-observation duplicate replay and an 80-observation all-unique generated control. All six lane orders appear twice per workload. Every observation is separately committed. Full payloads, histories, attempts, provider identity, digest contents, orphan counts, integrity and foreign keys are verified.

| Database bytes | Actual store | Text-hash candidate | Compact candidate |
|---|---:|---:|---:|
| Five retained generations | 73,728 | 65,536 | 65,536 |
| Generated duplicate replay | 880,640 | 86,016 | 81,920 |
| Generated all-unique replay | 880,640 | 909,312 | 897,024 |

The compact layout reduces the all-unique candidate overhead by 12,288 bytes, but remains about 1.86% larger than the actual store. [Page accounting](compact-layout-pages.json) attributes the observed reduction to 4,096 fewer snapshot bytes and 8,192 fewer hash-index bytes in that fixture. The inspection uses its separately recorded SQLite reader version; timing uses the pinned Rust/bundled SQLite build.

Write timing is mixed. For all-unique data, compact medians were 247.191, 247.921 and 352.420 ms versus actual-store medians of 244.859, 234.102 and 315.982 ms. Latest-read timing also has regressions. Duplicate-heavy write medians improve relative to the actual store in these passes, but that does not establish a general benefit. The first receipt predates added compiler/library metadata; its source identity is retained, and the two later receipts record the additional compiler/library fields.

## Recovery and memory checks

The shared fixed-binary probe and strict receipt validator now accept the explicit compact lane; unknown lanes and mismatched identities remain rejected. Default addressed behavior is rechecked. Each candidate-to-baseline comparison used twelve interrupted processes and eight fresh memory children: 24 interruptions and 16 memory children total. Every retained committed history passed verification. These are Linux process-kill tests, not physical power-loss certification.

For 1,001 generated observations of one retained public response, compact files were 237,568 bytes versus 303,104 for the prior candidate and 13,139,968 for the actual store. Those are highly duplicate-heavy fixtures. Separate self-RSS observations remain in the receipts; adjacent runs and page-granular accounting do not establish an independent memory-performance ranking.

## Scoped ranking

- For these duplicate-heavy storage footprints: compact, then prior addressed, then actual store.
- For all-unique footprint: actual store, then compact, then prior addressed.
- For universal latency, memory or application adoption: no winner accepted. Preserve the working store and compare the required real workload before migration.

Build/run `compact_addressed_lab` with the same five-input manifest and a new output directory. The shared crash and memory runners accept `--candidate compact`; omitting it preserves the prior addressed lane. All original artifacts and source backups remain retained. No other project's wiki or TODO is changed by this study.
