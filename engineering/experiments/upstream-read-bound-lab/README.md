# Bound prior upstream payload copies

October 30, 2026. The actual SnapshotStore compared a prior upstream response by first copying the entire stored TEXT value into Rust, even when it exceeded the existing source payload budget. A separately exposed raw getter also returned oversized stored text. This pass repairs those boundaries without deleting history or changing provider requests.

## Implementation and retained behavior

The previous-record query now uses the archive path's existing four-MiB encoded-text ceiling before materializing a Rust String. Oversized prior TEXT is classified as `previous_record_invalid` without copying it; a newly validated response still commits with its receipt and attempt in the same transaction. The prior row remains intact. Wrong SQLite value types retain their existing failure behavior rather than becoming unchecked successes.

The raw upstream getter applies the same encoded-size guard and then the two-MiB UTF-8 payload limit. Four MiB at the SQL boundary is intentional: a valid UTF-8 payload can occupy more encoded bytes in a UTF-16 database. This is a size boundary, not a new claim that every small raw payload has been semantically validated. No timeout, request budget, parser dependency, schema, journal mode or credential policy changed.

## Reproduction and empirical scope

The probe reuses Atlas's existing requested-allocation counter and the actual store methods. It uses one complete retained public HLS release JSON record and constructed response metadata, not a fresh HTTP request. Three valid-prior controls and three generated five-MiB corrupted-prior cases run against fresh owned databases per implementation. Setup and independent full-byte readback are outside the measured save/compare/commit region in both lanes.

[Baseline raw receipt](baseline.json), [repaired raw receipt](repaired.json) and [paired comparison](comparison.json) retain all twelve samples. For the corrupted-prior case, peak requested Rust bytes above the starting live allocation fell from 5,248,554 to 14,150 in each pair. The valid-prior controls stayed at 23,571 in both implementations. SQLite's native allocations, file cache, process RSS, I/O and latency were not measured; this is not total app memory falling to 14 KiB.

Every old row and new payload was verified in full after reopen. Snapshot and attempt counts, integrity and receipt semantics remained equivalent. Per-run observation timestamps remain in the raw receipts and are format-checked rather than expected to match across separate runs. The fixture's response status is not a current provider-availability observation.

## Regression and limitations

Two raw-read budget checks failed before the repair and pass afterward. UTF-16 storage preserves the complete valid payload, including original whitespace and unknown integer spelling. Small and oversized BLOB corruption still fails without replacing prior rows or adding attempts. An initial UTF-16 fixture-construction assertion failed because the existing fixture ended with whitespace; its source/log were retained and the insertion corrected without dropping that test.

Full regression passed 138 Rust unit tests, nine integration tests, all-target Clippy, 262 Node tests and 237 Python tests normally and with optimization. Native browser acceptance is unrelated and remains open. These bounded corrupted-database cases do not establish universal crash recovery, remote exploitability or an overall performance ranking.

Reproduce using `cargo +1.99.1 run --locked --manifest-path apps/atlas-lab/Cargo.toml --example upstream_read_allocations -- RETAINED_PUBLIC_HLS.json NEW_DIRECTORY` from the repository root. Only use the known locally built example and retained public input. Each pass retains six newly created databases and a receipt. Never point it at a working database; it deliberately corrupts fixture history. The original source, binary and failed results remain available for rollback. No other project is changed or recommended for adoption.
