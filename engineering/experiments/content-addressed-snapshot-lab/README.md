# Content-addressed complete snapshot experiment

Reviewed 2026-10-28. Isolated candidate, not an application migration. The application continues using SnapshotStore. No other project's recommendations or code change follows.

## Reuse and real baseline

The reference calls the actual SnapshotStore save and latest-read methods. Both lanes reuse the existing immutable ProjectRecord parser, request-identity validation and storage_connection contract: foreign keys enabled and synchronous EXTRA, without changing journal mode. Each generation and collection attempt still commits separately. The candidate retains full original JSON in a payload table; identical bytes share that row, while every observation remains a separate generation. Digest matches are checked against complete stored text, not trusted as equality on their own.

Five retained public Modrinth response generations include three project identities, a repeated unchanged response and a changed response. The second workload repeats this sequence sixteen times: 80 generated replay observations, not 80 independent real projects. Raw responses and databases remain private.

## Stabilization, not suppressed regression

The first candidate wrote its application_id marker every time it opened an existing database. Its read measurements regressed. A regression test reproduced a changed database-file digest after read-only reopen. The repair writes the format marker only on initial creation. The same test now passes; initial source and failed evidence remain retained. This removes an actual unnecessary durable header write, not merely a warm-cache timing difference.

Six candidate tests cover duplicate observations, changed payloads, injected hash/payload mismatch, attempt-insert rollback, incorrect identity, stored-payload corruption, rejection of an existing app database without byte changes, read-only reopen byte stability, and 1,000 generated changed/duplicate generations with recovery after rejected writes.

## Measurement contract and open gates

Seven alternating-order pairs per workload use new databases. Write time includes parsing, candidate hashing/equality checking, generation/attempt inserts and commit. Setup is separately reported. Latest-read timing includes reopen, parsing, candidate hash verification and exact comparison to the input. Complete history, provider/identity, attempt linkage, original bytes, SQLite integrity and foreign keys are checked outside the timer.

Both lanes retain their observation timestamps. Those wall-clock values are format-checked but are not required to be identical across separately timed databases. Reopen is not cold-cache. This is a single-connection storage-component comparison, not full collection-job/network/UI latency. Real-corpus peak memory, concurrent readers/writers, migration, broader crash recovery and physical power-loss behavior remain acceptance gates. EXTRA configuration is not proof of hardware durability.

The fixed harness accepts exactly five authorized public JSON files, at most 2 MiB each and 4 MiB total, and requires a new output directory. It never overwrites an existing evidence directory. It checks a cooperative 120-second budget; measured runs also use an external 150-second timeout. Partial JSONL samples and every database are retained. Database size is checked against 64 MiB after each sample. This is not a hard whole-process RSS limit.

Sources: SQLAPPID01, SQLROWID01, DB06 (SQLite synchronization contract). SQLite's [application identifier](https://www.sqlite.org/pragma.html#pragma_application_id) identifies a database file format. [WITHOUT ROWID guidance](https://www.sqlite.org/withoutrowid.html) warns that large rows may favor ordinary rowid tables; this experiment deliberately retains rowid payload storage and does not claim a measured comparison with WITHOUT ROWID.


## Retained measurements and decision

[Initial run](pass1-receipt.json), [repaired run](pass2-receipt.json), [independent repeat](pass3-receipt.json), [medians and exact source hashes](summary.json), and [verification](verification.json). All 84 samples passed complete payload/history, integrity and foreign-key checks. [Original implementation](initial-source/store.rs) preserves the rejected reopen behavior.

| Final repeat median | Actual SnapshotStore | Addressed candidate |
|---|---:|---:|
| Five retained generations: parse/write/commit | 12.255 ms | 12.694 ms |
| Five retained generations: reopen/latest/verify | 0.550 ms | 0.799 ms |
| Five retained generations: database bytes | 73,728 | 65,536 |
| Generated 80-observation replay: parse/write/commit | 206.544 ms | 176.666 ms |
| Generated replay: reopen/latest/verify | 0.578 ms | 0.650 ms |
| Generated replay: database bytes | 880,640 | 86,016 |

The repaired candidate's reopen cost fell substantially versus its initial implementation, and the replay write median improved versus the actual baseline in both repaired runs. It remains slower on the small real corpus and on latest-read medians. The approximately 90% space reduction belongs to the duplicate-heavy generated replay; the five retained real generations save about 11%. Neither is a universal workload estimate. No migration or default change is accepted. A real collection stream whose payload changes each refresh may receive little deduplication benefit.


## Process interruption checks

[Four retained runs](process-interruption.json) killed 48 newly created fixture processes after their first durable generation, at six requested delays while further commits were running. Both the actual SnapshotStore and addressed candidate reopened successfully. Every retained generation matched complete original bytes; attempts remained paired with generations; integrity and foreign-key checks passed. Candidate payload storage had no orphan or duplicated row. The exact instruction/transaction phase of each kill was not observed.

This is SIGKILL process-recovery evidence on Linux with SQLite 3.54.1, not a physical power-loss test, Windows recovery result or proof of every crash point. The second run uses strict duplicate-key/nonfinite/identity/completeness receipt validation, tested with and without Python optimization. All databases, original output and failures remain retained privately. The experimental format marker is local identification, not a globally registered ID or a security boundary.


## Memory accounting repair

[Retained runs and launcher control](memory-results.json) and [scoped medians](memory-summary.json) distinguish an initial launcher-inclusive measurement from four post-exec self-observation passes. Linux resource accounting survives exec, so a Python-launched child's wait4 maximum can be dominated by its earlier launcher footprint. A no-op control and the difference from the Rust process's self observations exposed that problem. Maxima are not additive: do not subtract the control and call the remainder application memory.

The implementation reuses Atlas's existing Linux status/smaps_rollup observer rather than inventing another memory API. It now samples before input, with the connection retained after 1,001 writes, and after connection drop. The full original response and all 1,001 committed observations are independently verified for every process. The final four-pair medians for retained rollup RSS are 5,869,568 bytes for the actual store and 4,106,240 for the addressed candidate. This is a duplicate-heavy generated replay of one public response, not the five-generation corpus, a live collector or universal RAM saving.

VmHWM is approximate kernel status accounting; rollup is a separate instantaneous observation, not peak memory. Shared mappings, allocator behavior and measurement overhead remain included. The original wait4 values and no-op controls are retained but rejected as isolated backend-memory evidence. Sources: MEM01, PROCMEM01, LNXWAIT01, LNXRSS01, PYWAIT01. No new runtime dependency or unsafe native wrapper was needed.


The final memory runner additionally fingerprints complete files with bounded streaming reads rather than allocating the whole executable in the Python launcher. It accepts only the fixed locally built probe. Earlier launcher-inclusive measurements remain unchanged. CPU/wall limits, full input hashing and post-write verification remain active; no cache-warming shortcut or field omission was introduced.

### Reproduction

From the repository root, build with `cargo +1.99.1 build --release --locked --manifest-path apps/atlas-lab/Cargo.toml --example addressed_snapshot_lab --example addressed_snapshot_crash_probe`. Run the storage example with a five-path public-input manifest and a new directory. For Linux recovery/memory checks, run `python3 experiments/content-addressed-snapshot-lab/crash_run.py` or `memory_run.py` with `--binary apps/atlas-lab/target/release/examples/addressed_snapshot_crash_probe --input PUBLIC_RESPONSE.json --output NEW_DIRECTORY`. Both runners retain evidence and refuse an existing output directory. Do not point experiments at a working application database.

Raw memory receipts: [launcher-inclusive preliminary](memory-pass1.json), [self-observer pass](memory-pass2.json), [identity-bound repeat](memory-pass3.json), [streaming-fingerprint pass](memory-pass4.json), and [final compiled-source repeat](memory-pass5.json).


## All-unique negative control, 2026-10-29

The harness now adds an explicit all-unique control rather than assuming the duplicate-heavy result applies to changing data. It inserts a labeled generated observation field into each complete public response, preserving all original wire content, including unknown large numeric values. The five retained generations and the 80-observation duplicate replay are rerun alongside 80 unique generated payloads. Workload digests, exact full history, payload addresses and orphan counts are checked. Each lane still commits every observation separately.

[Three passes, 126 samples](unique-control-summary.json) all passed complete-data parity and integrity checks. With all-unique data the candidate database is **909,312 bytes versus 880,640 bytes**, about **3.3% larger**. Its roughly 90% reduction still occurs only in duplicate-heavy replay. This negative control rejects a general space-saving claim.

All-unique write medians in milliseconds (baseline / candidate): 220.607 / 220.299, 278.796 / 290.168, and 237.630 / 238.436. Duplicate-replay write medians: 213.701 / 217.780, 241.195 / 294.070, and 303.691 / 301.037. Timing direction is inconsistent and shared-host variation is substantial. Earlier faster replay observations remain valid historical measurements, but **a repeatable write-speed improvement is not established**. No production migration or other-project recommendation follows.

Receipts use schema version 2 and identify each workload separately; grouping by replay factor alone would incorrectly combine duplicate and unique controls. Setup now includes exclusive creation of each new fixture file. Do not pool these setup timings with version 1. Original receipts, partial-output protection and databases remain retained. Two new harness tests check bounds/reserved fields and exact original-content preservation. The experiment remains isolated from the working application store.

## Remove the comparison copy, 2026-10-29

The stabilization lane now compares SQLite's borrowed text bytes while the row is alive instead of allocating a complete owned String solely for equality. The digest, byte limit, full-byte equality, per-observation commit, history and rollback checks remain. Wrong SQLite value types and oversized values are explicitly rejected. This changes only the experimental store.

[Allocation and full-store evidence](borrowed-summary.json) reuses Atlas's existing requested-allocation counter. Across five retained public generations, seven alternating pairs and 50 comparisons per lane, the old comparison requested one Rust allocation of the entire 6,200–12,840-byte payload per comparison. The borrowed comparison requested zero Rust allocations in this isolated step, with exact byte equality. This does **not** mean zero allocations for SQLite, saving a snapshot or the whole application. Native SQLite allocations and RSS are outside this counter.

Three additional full-store passes retain 126 samples and complete history/integrity parity. Write timing remains workload- and run-dependent, particularly for all-unique payloads. The comparison-copy removal is directly measured; a general latency improvement or production migration is still not established. Database size remains governed by payload uniqueness. Prior owned-comparison sources/binary and all prior results are retained for rollback and comparison.

The revised candidate also passed [12 fresh process interruptions](borrowed-interruptions.json) and [eight fresh-child memory checks](borrowed-memory.json), each with complete committed history verified. The separately retained Rust self observations remain distinct from launcher-inclusive wait4 peaks. These checks establish no physical power-loss guarantee or independent memory-speed ranking. [Verification](borrowed-verification.json).


## Compact reference layout

[Binary addresses and integer payload references](compact-layout.md) reuse this candidate in a separate format and reduce its measured metadata overhead. The 324-sample comparison retains all-unique and read/write regressions, plus separate recovery/memory checks. The actual store remains the default.
