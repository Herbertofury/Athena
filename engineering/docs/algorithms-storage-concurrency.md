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

Aho-Corasick's documented match modes can return different matches; its Standard mode supports overlapping searches while leftmost modes do not. A faster mode that loses possible owners is not an equivalent improvement. [ALG01](sources.md#alg01)

Globset supports matching a path against a compiled group of globs. Its literal-separator setting changes whether wildcards cross directories. Preserve the existing rule semantics before benchmarking it. [ALG02](sources.md#alg02)

## A runnable reference/index example

[owner_prefix_index.py](../examples/owner_prefix_index.py) compares a simple all-owner reference with an immutable trie for a narrowly defined, case-sensitive delimited-prefix contract. It returns **all** matching owner IDs. The tests include ambiguous prefixes, unsupported input and 2,000 deterministic generated comparisons.

This is an original teaching example, not a complete mod/config owner resolver and not a real application speedup claim. It does not inspect metadata, aliases or archive contents. Use it only when its exact contract fits; otherwise extend the reference and equivalence tests first.

## Concurrency is a resource budget

Rayon supports explicitly configured pools. Prefer a local pool when the subsystem needs its own limit; do not globally alter unrelated workloads merely to test a setting. Lifecycle and nested work need their own tests. [R04](sources.md#r04)

Windows IOCP associates asynchronous completions with a thread pool and limits runnable completion-processing threads. That is not the same as a blanket “64 workers is fastest” claim. A high queue depth can still consume memory and increase tail latency. [IO01](sources.md#io01)

Run the [worker sweep](file-pipelines.md) with equivalent full results. Increase concurrency only where the measured bottleneck benefits. A faster median that causes input stalls or a large memory spike may lose the decision.

## Storage correctness before throughput

SQLite's planner needs suitable indexes; inspect actual plans rather than assuming the database will fix repeated full scans. Include index-build/update overhead in the whole workflow. [DB01](sources.md#db01)

WAL permits reader/writer overlap but still has one writer at a time and same-host constraints. Do not weaken durability to improve a number. The official page documents a rare WAL-reset race fixed in 3.51.3+ and selected backports; verify the actually linked version before changing write/checkpoint concurrency. This is a review requirement, not a claim that a particular app is affected. [DB02](sources.md#db02)

## Trace the whole causal path

Perfetto Trace Processor supports programmatic trace analysis. Use correlated operation IDs and timestamps to connect UI requests, queue wait, native work and completion. Keep raw traces private until sanitized; a trace tool is not a speedup by itself. [OBS01](sources.md#obs01)

## SIMD parsing stabilization evidence · 2026-10-27

[The isolated Rust parser lab](../experiments/rust-json-parser-lab/README.md)
compares complete Values from six public responses with input-copy costs included.
The tested released candidate accepted malformed high-surrogate escapes. A narrow
backport of the recent official decoder fix removed 1,024 single-escape and eight
boundary-pair discrepancies. Float differences required checking the reference:
the candidate was closer to the exact decimal in all 484 observed mismatches;
a separately labeled precise-float reference eliminated them. Remaining large
integer semantics and mixed speed results block promotion. No application
dependency changed. An upstream headline or a repaired bug is not blanket
acceptance; preserve failed evidence and remeasure the full contract.

A separate requested-allocation experiment found the SIMD path used about
1.9–2.6× the peak requested Rust bytes on those six real responses when preserving
the input buffer. The materialized result's held bytes were equal. This is not
RSS, native memory or physical peak usage; the full counter scope and raw results
are in the same parser study. Instrumented counters are not pooled with timings.
