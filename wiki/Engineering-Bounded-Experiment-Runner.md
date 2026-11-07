<!-- Athena managed engineering page. Original source and revision are retained in migration/engineering-atlas. -->
# Bounded Experiment Runner

[Atlas home](Engineering-Home) · [Implementation and retained evidence](https://github.com/Herbertofury/Engineering-Atlas/tree/f06dcb9c64b179252973f6f86d32791301e3e00f/experiments/bounded-runner-lab)

Reviewed 2026-10-27. Implemented and local HTTP-tested; visual browser interaction acceptance remains pending.

The local application's explicit run button queues a fixed comparison of linear and indexed identifier deduplication. It does not run arbitrary commands, download candidates, rewrite source, deploy itself or start automatically.

## Saved-record queue experiment · 2026-10-27

The local Experiments panel now compares the baseline and isolated fixed-field validator on one existing saved Modrinth version. It freezes a generation and exact payload hash, performs up to 20 measured pairs plus 10,000 generated stress variations, and retains raw partial samples within a cooperative 15-second budget. No provider fetch, arbitrary command, source rewrite or default-parser replacement occurs.

Source, validator, measurement-harness, compiler, target, profile, compiler-flag and dependency-lock fingerprints are recorded. These do not establish identical CPUs or host isolation. Missing or misbound snapshots fail explicitly. An early correctness failure enters stabilization even before a complete timing pair exists; cancellation never invents a pair. Existing evidence remains readable, and repair lineage checks the declared environment as well as baseline/workload identity.

The final local pass verified 47 new HTTP checks and all 23 existing workflow checks. The real saved-record run completed; a separately labeled generated cancellation fixture retained its partial sample and previous results. Source snapshots and collection-attempt counts were unchanged. Local checks passed 73 Rust unit tests, four persistence tests, four candidate-example tests, 48 Node tests and 53 Python tests. Exact served assets and backend harness identity were checked; native-browser visual/input QA remains pending. Missing process-memory and per-strategy cancellation evidence still block promotion.

[Verified implementation, raw receipts and limitations](https://github.com/Herbertofury/Engineering-Atlas/tree/dc6c3977acd1667324c07bcf7e5906f75450b73c/experiments/saved-version-runner-lab). CI and Pages passed for that exact commit. The dependency scan matched 185 locked packages against the recorded RustSec revision without known advisory matches or warnings; it is not a complete security guarantee.

## Earlier generated-identifier execution and integrity

- 2 warmups, 15 paired timing measurements and 10,000 run-specific differential stress cases on 6,000 generated identifiers.
- Cooperative 15-second budget; a current bounded operation may finish beyond the deadline.
- 23 HTTP/persistence checks passed: same-origin protection, unsupported commands, active-job deduplication, complete output parity, cancellation receipts, append-only journal, prior-success retention and SQLite integrity.
- Raw successful timings and cancelled partial evidence are retained in the linked commit.
- 51 Rust unit tests and 3 integration tests passed locally, with Clippy warnings denied. The broader 53 Python and 30 Node tests also passed.

## Promotion remains blocked

Peak memory and per-strategy cancellation evidence are not measured. The gate returns Incomplete. A completed execution does not mean an accepted candidate, and generated identifiers do not prove improvement in a target application.

This is a bounded experimentation engine, not general autonomous self-modification. No recommendation has been transferred to another project's wiki or TODO from this run.

## Queue scheduling repair · 2026-10-27

[Retained comparison and stabilization evidence](https://github.com/Herbertofury/Engineering-Atlas/tree/91ad3b47769e847a8be423300811f3aec6e09c89/experiments/queue-wakeup-lab) measures actual Atlas HTTP jobs, not another project's performance. A bounded enqueue notification replaces the unconditional sleep between jobs; idle recovery scans remain.

In the repaired 20-run comparison, median queued-to-claim time fell from 745.0 to 0.5 ms and request-to-complete from 1640.431 to 816.389 ms. Event times have millisecond resolution. Full results, 10,000 stress cases per job, reopened records and integrity checks were preserved. No memory, rendering or provider-throughput improvement is claimed.

Follow-up review caught provider pacing coupled to the removed sleep. The repair waits interruptibly for the normal provider slot, keeps long rate-limit cooldown failures explicit and leaves provider limits unchanged. The immediate-cooldown rejection is reproduced by a client-contract test. All 23 guard/cancellation checks passed again; the repaired Rust suite passed 54 unit and 3 integration tests.

An initial public collection run retained one unexplained first-request failure and two successes. A separate fresh retry completed all three projects with exact reopened results. Both receipts remain; the first failure's cause is not asserted. Previous source and binary are retained. No target-project recommendation or algorithm promotion follows.

## Consistent overview snapshots and isolated HTTP candidate · 2026-10-27

[Full HTTP and concurrent-writer evidence](https://github.com/Herbertofury/Engineering-Atlas/tree/0b18f0ea1e5ba084d45d11a200e6f779a098093d/experiments/overview-http-lab) now covers the previously isolated checked-raw serializer. Normal serve keeps the Value serializer; explicit serve-candidate uses a labeled test mode on a fresh/copied database.

A bounded writer stress test exposed different snapshots for the job list and its totals: 146/182 normal and 167/200 candidate responses were inconsistent before repair. Both paths now use one read transaction. The repeated test had zero inconsistencies in 200 normal and 200 candidate responses. Error paths release the transaction, and JSON/security checks are preserved.

Two 300-sample HTTP passes retained complete-output parity and all failed measurements. The larger 10/50-job histories replay real public records; they are not other-project evidence. The fast candidate still regressed a small-workload maximum, so it remains isolated. Approximate process memory observations, one-host timings and a correct response are not browser-paint, input-latency or universal no-loss acceptance.

The normal application receives the snapshot-correctness repair, not automatic serializer promotion. Original source, failed receipts and rollback copies remain retained.
