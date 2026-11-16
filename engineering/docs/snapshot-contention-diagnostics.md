# Snapshot contention diagnostics

This is diagnostic instrumentation, not a contention fix or root-cause claim.

## Retained observation

Athena #238 engineering run `43746612473`, first attempt, Linux job
`132911195937`, failed the existing four-writer snapshot regression with
`DatabaseBusy` (extended code 5). The aggregate suite took 65.88 seconds;
that duration does not establish an individual busy-handler timeout violation.
An unchanged-head failed-job rerun passed. Windows passed the same head.
The original failure and rerun remain linked in PR #238 comments.

## What changes

An opt-in write method reports monotonic per-stage elapsed microseconds, success,
SQLite extended error codes and whether the connection returned to autocommit.
The normal method and diagnosed method share identical SQL and transaction mode.
Errors are returned unchanged. There is no automatic retry, serialized writer
queue, increased timeout, reduced synchronous setting or weakened correctness
assertion. Reports contain no payloads, request identifiers or database paths.

The original generated four-writer regression still requires all 64 exact
payloads, 68 attempt records, one-to-one successful pairing, integrity and foreign
keys, in both DELETE and WAL modes. Reports identify its synthetic writer and
observation. Instrumentation itself can affect scheduling, so this is not an exact
reproduction of the earlier uninstrumented failure. Reports are buffered per writer
and printed after its loop or on error, not between successful transactions. A separate held-writer regression verifies a Busy result rolls back
without orphan records; only after releasing the blocker does a new explicit call
succeed. One additional isolated invocation compares the same stress workload
with its normal parallel-suite context. A failed first invocation remains a failed
job; the isolated run cannot turn it green.

On panic, the test can retain only its own generated fixture family in the
explicit CI evidence directory. Each of four files is capped at 16 MiB; evidence
may be incomplete if copying fails or reaches that cap and is not a certified
recoverable backup. No production or owner database is collected. CI artifacts
expire after 14 days. Hosted logs retain stage diagnostics. Scheduling, fsync
latency and starvation remain hypotheses, not established explanations.

Local formatting and documentation checks are available. Full current-source
compilation and Windows/Linux execution require hosted CI because the development
workspace is full. No old binary is used to claim current-source acceptance.
