<!-- Athena managed engineering page. Original source and revision are retained in migration/engineering-atlas. -->
[← Atlas home](https://github.com/Herbertofury/Athena/wiki/Engineering-Home) · [Canonical source](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/algorithms-storage-concurrency.md)

# Algorithms, storage and concurrency: reduce the actual work

**Research pass: 2026-10-26. Methods below are candidates, not measured wins in an application.**

## Choose an algorithm that preserves the exact question

| Observed repeated work | Candidate | Semantic trap to test |
|---|---|---|
| Compare every filename with every owner prefix | Build a per-scan prefix index | Preserve ambiguous owners, delimiters, case and exclusions |
| Search many literal strings through the same bytes | Multi-pattern automaton | Overlapping, leftmost-first and longest-match modes are not interchangeable |
| Match many glob rules against each path | Compile a glob set once | Separator handling and rule priority must match the reference |
| Repeated database scans/sorts | Appropriate compound/covering indexes | Verify the query plan, collation, ordering and write cost |
| Dispatch one tiny blocking operation per async task | Bounded batches | Preserve cancellation latency and per-item errors |
| Many concurrent IO requests | Platform-appropriate completion or bounded worker design | Runnable threads, queued requests and memory budgets are different limits |

Aho-Corasick's documented match modes can return different matches; its Standard mode supports overlapping searches while leftmost modes do not. A faster mode that loses possible owners is not an equivalent improvement. [ALG01](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/sources.md#alg01)

Globset supports matching a path against a compiled group of globs. Its literal-separator setting changes whether wildcards cross directories. Preserve the existing rule semantics before benchmarking it. [ALG02](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/sources.md#alg02)

## A runnable reference/index example

[owner_prefix_index.py](https://github.com/Herbertofury/Athena/blob/main/engineering/examples/owner_prefix_index.py) compares a simple all-owner reference with an immutable trie for a narrowly defined, case-sensitive delimited-prefix contract. It returns **all** matching owner IDs. The tests include ambiguous prefixes, unsupported input and 2,000 deterministic generated comparisons.

This is an original teaching example, not a complete mod/config owner resolver and not a real application speedup claim. It does not inspect metadata, aliases or archive contents. Use it only when its exact contract fits; otherwise extend the reference and equivalence tests first.

## Concurrency is a resource budget

Rayon supports explicitly configured pools. Prefer a local pool when the subsystem needs its own limit; do not globally alter unrelated workloads merely to test a setting. Lifecycle and nested work need their own tests. [R04](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/sources.md#r04)

Windows IOCP associates asynchronous completions with a thread pool and limits runnable completion-processing threads. That is not the same as a blanket “64 workers is fastest” claim. A high queue depth can still consume memory and increase tail latency. [IO01](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/sources.md#io01)

Run the [worker sweep](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/file-pipelines.md) with equivalent full results. Increase concurrency only where the measured bottleneck benefits. A faster median that causes input stalls or a large memory spike may lose the decision.

## Storage correctness before throughput

SQLite's planner needs suitable indexes; inspect actual plans rather than assuming the database will fix repeated full scans. Include index-build/update overhead in the whole workflow. [DB01](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/sources.md#db01)

Before changing database concurrency, review the [canonical storage-safety section](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/algorithms-storage-concurrency.md#storage-correctness-before-throughput), including its current-version checks and durability contract.

## Trace the whole causal path

Perfetto Trace Processor supports programmatic trace analysis. Use correlated operation IDs and timestamps to connect UI requests, queue wait, native work and completion. Keep raw traces private until sanitized; a trace tool is not a speedup by itself. [OBS01](https://github.com/Herbertofury/Athena/blob/main/engineering/docs/sources.md#obs01)

## SIMD parsing stabilization evidence · 2026-10-27

[The isolated Rust parser lab](https://github.com/Herbertofury/Athena/blob/main/engineering/experiments/rust-json-parser-lab/README.md) compares complete Values from six public responses with input-copy costs included. The tested released candidate accepted malformed high-surrogate escapes. A narrow backport of the recent official decoder fix removed 1,024 single-escape and eight boundary-pair discrepancies. All 65,536 single-escape cases and 32 boundary pairs are retained in the protocol.

Float differences also required checking the reference: the candidate was closer to the exact decimal in all 484 observed mismatches. A separately labeled precise-float reference eliminated those differences; the original failures remain available. Large-integer behavior still differs. Final candidate medians won on three inputs and lost on three, with no peak-memory or end-to-end acceptance result.

No application dependency changed, and no other project received a recommendation. Prefer the proven contract over a universal fastest-parser label. This backport covers one decoder, not all newer upstream fixes, unsafe-code paths or platform tests. The candidate remains isolated.

### Requested-allocation follow-up

A separate instrumented binary measured 108 complete-output pairs across the same six public responses and three build configurations. The SIMD path required about 1.9–2.6× the peak requested Rust bytes when retaining the original input. Materialized results held equal requested bytes, and post-drop requested-live deltas returned to zero. The Unicode backport and precise-float reference did not change these observed allocation counts.

This is not whole-process RAM or physical peak usage: native allocations, stack, allocator overhead, fragmentation, cached pages and internal realloc overlap are excluded. No speed inference is made from the instrumented binary. [Raw counts, source and measurement contract](https://github.com/Herbertofury/Athena/blob/main/engineering/experiments/rust-json-parser-lab/README.md#requested-allocation-follow-up). The result strengthens the case for a scoped decision, not a universal SIMD replacement.

## Lossless snapshot compression · 2026-10-27

[Isolated Rust/SQLite component and 112 retained samples](https://github.com/Herbertofury/Engineering-Atlas/tree/7d74b122b550993d7be7905f3ff1091a56337497/experiments/compressed-snapshot-lab) compare raw BLOB storage, per-record Zstd and reused codec contexts. Six real public records retain all bytes; a separate 32× replay is explicitly generated. All use identical DELETE/FULL commit boundaries, reopened byte/hash checks, rollback and integrity checks.

Compression reduces the small database from 45,056 to 28,672 bytes (36.4%), but raw storage is faster across final end-to-end medians. Reusing codec contexts reduces compression/read overhead without changing frames or checks, yet one small-workload repeat regresses overall write time versus per-record compression. This is a space/CPU tradeoff, not a universal win. Keep the app storage unchanged; no migration or other-project recommendation follows.

Native-library peak memory, UI latency, physical power-loss durability and actual SnapshotStore integration remain unverified. Fresh advisory fetch failed; a named cached database had no known matches, not a fresh security guarantee. CI checks and full build provenance are linked with the study.

### LZ4 safe block follow-up

[Two additional four-strategy runs](https://github.com/Herbertofury/Engineering-Atlas/tree/fc10171a6b6857cfdee68ff49941abad163c751b/experiments/compressed-snapshot-lab) retain 112 further complete byte/rollback/integrity samples. Official lz4_flex 0.14.0 runs with safe-encode, safe-decode and checked-decode enabled, bounded zero-filled output and exact length/hash validation. The older invalid-offset advisory and patched-version history were reviewed; vulnerable versions were not executed.

LZ4 saves less space than Zstd (six-record database 32,768 versus 28,672 bytes; raw 45,056), but has the lowest compressed write median in both new runs. Raw still wins write+commit. The replay read median only beats raw in the first run, not the repeat, so it is not a stable read-speed claim. These are isolated component tradeoffs, not a current SnapshotStore or other-project adoption result. All prior measurements and source revisions remain available.

## Representation eligibility · 2026-10-27

[A dated paper screen](https://github.com/Herbertofury/Engineering-Atlas/blob/d2bb61459aa5e22375f2f1347cb54946fb688c4b/research/2026-10-27-representation-contracts.md) separates lossy semantic reconstruction and thresholded telemetry from byte-exact storage. Five independently written rational cases test a fidelity boundary, not author code or performance. No research prototype was executed and no candidate was promoted. Required raw evidence cannot be silently replaced with an approximate representation.
