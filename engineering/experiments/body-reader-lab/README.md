# Bounded body-buffer allocation candidate

Evaluated 2026-10-29. The working reader receives only the checked-budget correctness repair below; its allocation strategy is unchanged. This isolated experiment retains complete bytes and rejection behavior while examining avoidable buffer growth.

## Reuse and design

The baseline mirrors Atlas's existing `Vec::new` plus bounded `Read::read_to_end` path. The isolated baseline initially added checked limit arithmetic for experiment bounds; production callers currently supply 2 MiB. The HTTP fixture compiles the actual `apps/atlas-lab/src/public_http.rs` as its baseline, without widening that module's visibility.

The first candidate reserves the advertised length. That avoids repeated allocation for honest lengths but immediately allocates 2 MiB even for an empty stream with an overstated hint. The adaptive candidate first reads a bounded stack prefix, returns empty without allocating when no bytes arrive, and caps its initial length-based reservation at 64 KiB. It still reads through EOF or error and enforces the same byte ceiling. A header is a reservation hint, not permission to omit data or ignore transport errors.

## Measured allocation scope

The six allocation receipts cover five retained public Modrinth generations plus an explicitly generated empty input. Four fragment sizes, four hint modes and three lanes give 288 samples. All returned bytes match. The existing Rust allocation counter is reused; native allocations, RSS, network cost and timing are not measured here.

For the 12,840-byte retained input fragmented into 4,096-byte pieces with an accurate hint, baseline growth requested 32,736 bytes across one allocation and nine reallocations. Both reservation candidates requested 12,840 bytes in one allocation with no reallocations. These are component requested-byte counts, not total app memory or speed.

The misleading-hint control remains important: for that same input advertised as 2 MiB, the first candidate retains 2 MiB and the adaptive candidate 65,536 bytes, versus the baseline's 16,384 bytes. On an empty stream with that hint, adaptive and baseline allocate zero while the first candidate allocates 2 MiB. The adaptive repair bounds the problem but does not eliminate every memory regression. **Neither candidate is accepted into the working collector.**

## Actual HTTP boundary and retained failures

Five separate fixture runs provide 60 loopback HTTP checks through the existing reqwest version’s blocking transport. Each compares the actual baseline reader with the adaptive candidate for known-length and chunked complete responses, truncated and stalled bodies, wrong content type and oversize declarations. Complete bodies match byte-for-byte; rejected cases retain the same safe error category. This is real local transport with retained public payload bytes, not a new live-provider request or authentication test.

The first HTTP fixture produced a chunked baseline failure. It closed a connection without consuming its request. The repaired fixture drains and bounds the request headers before sending/closing its response. The earlier failure and source are retained privately rather than hidden as a candidate success. Compilation failures and their repairs are retained too.

Three regression tests cover a 160-case size/limit/hint matrix, interrupted initial reads and rejection before reads for impossible budgets. These tests run in CI. No timeout, TLS, proxy, access-control, validation or last-good storage policy was relaxed. The fixture's no-proxy client applies only to its owned loopback server.

## Reproduce

Build the `body_reader_allocations` and `body_reader_http` examples in `apps/atlas-lab` with the locked Rust 1.99.1 toolchain. Each accepts one local retained-public input path. Run the allocation example against an empty file only as a labeled synthetic control; the HTTP example requires a nonempty body. Both print bounded JSON receipts. Run `cargo test --locked --example body_reader_allocations` for regression checks.

[Summary and receipt index](summary.json). This remains Atlas research, with no recommendation to another project and no general no-loss performance claim.

## Actual budget-overflow repair

A release-mode loopback regression test then found a separate boundary defect in the working shared reader: adding one to `u64::MAX` wrapped to zero, allowing success with an empty body. The targeted test failed before the change. Checked addition now rejects that impossible budget before reading; the regression passes in debug and release builds. Current production callers use 2 MiB, so this is a latent boundary repair, not evidence of a current provider outage or lost stored snapshots. The buffering candidates are still not promoted.
