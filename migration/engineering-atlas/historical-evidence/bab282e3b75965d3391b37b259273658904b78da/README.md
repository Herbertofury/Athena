# Lossless compressed snapshot component

Measured 2026-10-27. Sources [ZSTD01], [ZSTD02], [DB06]. Isolated Rust/SQLite component, **not the current SnapshotStore implementation**, an app migration or a comparison against another project's baseline. The core application's dependencies and schema remain unchanged.

## Workload and fixed requirements

Six retained real public Modrinth JSON responses (three projects and three versions) total 30,763 bytes. The density case replays them 32 times into 192 records / 984,416 bytes; it is explicitly generated, not 192 independent real posts. Provider text and databases stay local; public results contain complete-input hashes, sizes and timing samples.

The uncompressed reference and Zstandard level-3 candidates use the same BLOB table, metadata/checksum columns, prepared insert, one transaction, DELETE journal and synchronous FULL. Each database is new. Encoding/copying and SHA-256 are inside the encode timer; transaction begin/inserts/commit are inside the commit timer. End-to-end write includes both. Read measurement includes reopen, full query/materialization, decoding and SHA verification. Every payload is then compared byte-for-byte with its original; rollback and SQLite integrity are checked separately. All 112 retained samples passed those checks.

## Real implementation improvement, retained tradeoffs

The first candidate recreated compression/decompression contexts for every record. The revised candidate reuses a context within each batch while retaining separate frames and the same level, limits, checksums and outputs. Context creation remains inside the measured interval, not hidden as warm-up. All three strategies are then remeasured together in rotating/reversed order, seven rounds per scope. Initial and repeat measurements remain separate.

| Scope / final repeat median | Raw BLOB | Zstd per record | Zstd reused contexts |
|---|---:|---:|---:|
| Six real records: encode + checksum ms | 0.0371 | 0.4955 | 0.3311 |
| Six real records: encode + commit ms | 1.9070 | 3.2350 | 3.7107 |
| Six real records: reopen/read/decode/hash ms | 0.1697 | 0.3997 | 0.2933 |
| Generated 192 records: encode + checksum ms | 1.1004 | 22.9693 | 12.2123 |
| Generated 192 records: encode + commit ms | 6.6583 | 28.0606 | 16.3978 |
| Generated 192 records: reopen/read/decode/hash ms | 3.8541 | 12.6705 | 5.6683 |

Both compressed variants produce the same payload sizes. The six-record database shrinks from 45,056 to 28,672 bytes (36.4%); the replay database shrinks from 1,187,840 to 663,552 (44.1%). Individual payload bytes fall from 30,763 to 16,136. Context reuse improves median codec/read work versus per-record contexts in both final runs, but the small-workload repeat's overall write median regresses versus that candidate. **Raw storage is faster across the final end-to-end medians. No default change is justified.** These observations do not rank every compression level or storage design.

[Initial samples](initial-per-record-2026-10-27.json) · [three-strategy run](reused-contexts-2026-10-27.json) · [repeat](reused-contexts-repeat-2026-10-27.json) · [build, budgets and audit](verification-2026-10-27.json) · [retained first implementation](initial-source/main.rs).

## Correctness, limits and reproduction

Three tests include exact large integers/null/text, checksum/length mismatch, all truncations of a test frame, corruption, expansion bounds and 10,000 generated context-reuse cases with recovery after rejected frames. They are fixtures, not production crash or hardware-fault testing. The decoder checks expected output length/hash and caps each result; precise native-library memory peaks remain unmeasured.

Use pinned Rust 1.99.1 and `cargo test --locked`, then `cargo build --locked --release`. Pass a JSON array containing exactly six authorized public-record file paths and a **new** output directory. Inputs are bounded before allocation; max 2 MiB per record, 4 MiB per workload, 256 records, cooperative 120 seconds. Record hashes are retained, not raw text in public receipts. No network is used by the benchmark. No existing database or backup is overwritten/deleted.

SQLite 3.54.1 and bundled Zstd 1.5.7 were actually reported by the binary; Rust binding is pinned 0.14.3 with default features disabled. Upstream Zstd 1.5.7 was released February 19, 2025, not today. Advisory database refresh failed; cached commit 3279c999 was checked without ignores and found no known matches. That is not a fresh or complete security guarantee.

Reopen is not cold-cache; FULL on a virtualized filesystem is not proof of physical power-loss durability. SQL/file sync cost varies across rounds. No UI/input latency, peak-memory, concurrent-reader, migration or target-project acceptance follows. Keep this lane isolated; do not add these findings as another project's recommendation without its own baseline comparison.
