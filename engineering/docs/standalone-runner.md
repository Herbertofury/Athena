# One bounded offline runner for standalone and unified use

`atlas-lab dedup-lab OUTPUT.sqlite` now uses the same built-in bounded
`experiment_runner` as the unified queued experiment instead of maintaining a
separate older timing loop. No network, model, arbitrary command or external
candidate is needed. The workload remains explicitly generated identifiers, not a
real project corpus or evidence of general autonomous intelligence.

The command retains the existing top-level `experiment_id`, `evidence`, `decision`,
`acceptance_policy` and `limitations` fields, and adds `run` with complete raw runner
output: warmups, measured trials, stress/correctness counters, reason, completion,
elapsed time and first failure. A cancelled/budget-exhausted/failed run is retained
and reported as incomplete rather than promoted. CLI process cancellation remains
separate from cooperative runner cancellation; forced process termination before
commit cannot promise a persisted result.

The existing evidence row and full run record commit in one transaction. A failed
raw-output insert rolls back both. Records are append-only through this API and
older evidence rows are not rewritten or given invented raw results. The payload
limit is 2 MiB. Stored policy decisions must agree with the runner evidence. This
is local evidence retention, not tamper-proof storage against an owner editing
SQLite directly.

```sh
atlas-lab dedup-lab /private/evidence.sqlite
atlas-lab show-experiment /private/evidence.sqlite 1
```

`show-experiment` opens an existing journal read-only, requests a bounded stored
payload, and returns `{experiment_id, run}`. Missing files, legacy records without
raw output and unsupported/oversized data fail rather than create/migrate a file.
Read-only SQLite is not a sandbox for arbitrary untrusted databases or hostile
concurrent filesystem changes. Existing private journal handling still applies.

Peak memory remains unmeasured and blocks candidate review eligibility. Generated
workload results do not justify changes to any other application's implementation,
recommendations or TODO. No production promotion, source rewriting or deployment
occurs. Hardware/timing noise and runtime budgets remain explicit limitations.

Validation includes actual native CLI execution and read-only retrieval on both
hosted operating systems, retained cancelled/synthetic failed records, transactional
failure rollback and oversized/missing/legacy refusal. The synthetic failure is a
test receipt, not a claim that a real built-in experiment failed. Formatting and
the research structure checker passed locally; a full local Rust rebuild was not
possible with the workspace full. Exact-source hosted compilation/tests are the
acceptance evidence, not a retained older local binary.

The 2 MiB checks are retention/returned-payload budgets. Serialization occurs
before the retained-size check, and SQLite can perform additional internal work
when evaluating its length expression. They are not complete memory/CPU limits
for arbitrary caller-created RunOutput objects, malicious databases or views.
