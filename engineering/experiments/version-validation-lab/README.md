# Complete version validation without a full Value tree

2026-10-27. Sources: COL04, JSON07, JSON08, MEM02. **Isolated candidate; the
application's default version parser and dependencies are unchanged.**

## Actual baseline and implementation change

This compares Atlas's existing `modrinth_versions::parse_version` against a new
implementation on three previously collected real public version responses.
It is not a generated-only benchmark or a comparison to an unrelated library.
The baseline source commit and exact file hashes are in the provenance receipt.

The first candidate retained a HashMap of raw field references and was slower on
two of the three initial medians. That source, harness and raw results remain.
The revised implementation uses fixed field identifiers/slots for the known
metadata instead of allocating/hashing every top-level and file-field key.

The existing checked JSON visitor still traverses every value, including unknown
fields, before shape validation. Original JSON bytes, unknown fields, null/absent
states, large-integer spellings and identity bindings remain in the result.
Unknown fields are not removed from the payload; their unnecessary object-tree
materialization is removed. RawValue alone is not used as a substitute for strict
number/Unicode/depth validation. The inherited finite-number/depth contract is
not a claim to accept every arbitrary-precision JSON number.

Duplicate identity fields still fail. Other duplicated known fields retain the
baseline's last-value behavior. Required compatibility, files, hashes, primary-file
count and dependency-object checks remain. Error wording is not byte-identical;
failure acceptance is compared and fixture payloads are not echoed in field errors.

## Protocol and final real-response observations

24 alternating-order pairs, 100 parses per sample; four warmup pairs retained but
excluded from summaries. Every timed iteration compares the full original payload
and both binding IDs. The comparison cost is inside both timers. A repeated pass
reverses response order. Bounded input is 256 KiB with a cooperative 30-second run
budget; partial timing evidence is retained rather than declared complete.

| Real public version | Bytes | Baseline median µs | Candidate median µs | Repeat baseline / candidate µs |
|---|---:|---:|---:|---:|
| Iris Ag5S66CF | 962 | 7.212 | 3.880 | 7.360 / 4.965 |
| Sodium g6ju16VJ | 1,894 | 6.903 | 4.962 | 9.816 / 5.301 |
| Lithium 1rb9wI5K | 1,600 | 6.793 | 4.296 | 7.171 / 4.135 |

Final/repeat medians improved about 1.4–1.9×. The candidate won 108 of 120 measured
pairs, not every pair. These are averages of 100 parse-and-compare operations,
not individual-request p95/p99 or a whole-app speedup. Absolute savings are a few
microseconds on these small records; network and storage costs can dominate.
Host load was not isolated and exploratory/final runs are not pooled.

## Allocation and durable data checks

A separate instrumented binary reuses the scoped System-allocation counter from
the Rust parser study. It makes no timing claim. Baseline → candidate peak
requested Rust bytes were 6,150 → 1,232; 7,272 → 3,110; and 6,686 → 2,478 in the
same response order. Allocation calls fell from 68/60/60 to 13 per parse.
Held result bytes were equal, all 18 allocation pairs matched completely, and
post-drop requested-live deltas returned to zero.

These are not RSS, stack, native memory, allocator-overhead or physical-peak
measurements. Input data and a preflight identity read are outside each delta.
Instrumentation and uninstrumented timings remain separate.

Each candidate result was saved through the existing atomic SnapshotStore path,
closed, reopened and compared byte-for-byte. Recording a failed refresh retained
the last good version. SQLite integrity_check returned ok. The three single
configured durable writes took approximately 1.10–1.55 ms; there is no paired
storage-throughput win or hardware power-loss claim. The existing store revalidates
through the default parser, so this is persistence compatibility, not replacement
of the entire collection pipeline.

## Correctness and supplemental density tests

- 63 Rust library tests, four persistence integration tests and four explicit
  candidate-example tests passed, plus clippy and formatting checks.
- 10,000 deterministic full-payload stress cases compare acceptance and exact output.
- Additional cases cover missing fields, wrong types, file metadata, duplicate
  semantics, escaped identifiers, large integers, invalid Unicode/UTF-8, depth
  boundaries, oversize input and error-message payload leakage.
- Adding a generated 64 KiB or 128 KiB field to a retained public response also
  preserved complete data. Those fixtures are explicitly generated augmentations,
  not additional real-source or target-project acceptance evidence. Raw supplemental
  timings and allocation counters are separate.

## Reproduce and limits

Run `cargo test --locked --example version_validation_lab` in apps/atlas-lab.
The repository's Rust CI now runs that target explicitly on Linux and Windows.
Build the `version_validation_lab` and `version_validation_allocations` examples
in release mode. Pass an authorized local public version response; the timing
example optionally accepts a NEW SQLite output path and refuses to overwrite one.
Full provider text and databases remain local. Published evidence contains only
identities, hashes, metrics and generated source fixtures.

The candidate remains outside the collector's default path. No HTTP/UI/network
speedup, exhaustive provider coverage, formal correctness proof, whole-process
memory acceptance or recommendation to another project is implied. Review the
initial slower candidate, raw repeats and remaining gates before any promotion.
