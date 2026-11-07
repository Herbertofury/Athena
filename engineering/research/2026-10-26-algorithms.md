# Algorithms and storage review · 2026-10-26

**Status: primary-documented methods and locally tested example semantics, not production performance acceptance.**

The next useful question is often not “how many more workers?” but “why is the same search, parse or lookup being repeated?” The [algorithm guide](../docs/algorithms-storage-concurrency.md) evaluates per-scan indexing, multi-pattern matching, batched IO, query plans and bounded pools.

## Decisions to test

- If owner matching dominates, compare the complete reference resolver with an indexed implementation. Preserve every ambiguous match and fallback rule.
- If IO dominates, measure bytes, opens, metadata calls and queue delay before changing the scheduler.
- If persistence dominates, inspect transaction/checkpoint structure and query plans without relaxing durability.
- If the UI stalls while native work runs, correlate the request/response path and serialization, rather than assuming native CPU is the only cause.

## Concrete deliverable

The new [prefix-index example](../examples/owner_prefix_index.py) has a deliberately narrow contract and a slow reference. Tests preserve exact, delimited, ambiguous and case-sensitive results across 2,000 generated cases. This demonstrates a correctness-first optimization method. It does not establish a speedup for any real application.

## Source basis

[ALG01](../docs/sources.md#alg01), [ALG02](../docs/sources.md#alg02), [DB01](../docs/sources.md#db01), [DB02](../docs/sources.md#db02), [IO01](../docs/sources.md#io01), [R04](../docs/sources.md#r04), [OBS01](../docs/sources.md#obs01).

Higher worker counts remain experimental until the equivalent-result, latency, memory, IO and responsiveness matrix passes on the actual workload. None of the above is a blanket dependency-upgrade instruction.
