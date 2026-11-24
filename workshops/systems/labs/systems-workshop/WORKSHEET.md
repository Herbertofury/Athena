# Systems Workshop evidence journal

All Cedar Queue facts are fictional. Keep real people, credentials, customer data and company details out of this worksheet. Work in a new personal copy rather than editing the source exercise.

## Evidence labels

- **Observed:** a result you actually measured by running a supplied local command.
- **Simulated:** a fictional fact or tabletop decision.
- **Assumed:** a premise not yet verified.
- **Not tested:** a behavior or requirement with no executed evidence.

For each exercise record: date; Python/platform if executed; command; prediction; actual result or paper answer; difference from prediction; what is proven; what remains untested.

## 1. Inventory and change contract

Describe Cedar Queue in four layers:

- Configuration: intended settings and where they are represented.
- Runtime: effective settings, process response and current work state.
- Durable data: jobs, stock and completion receipts.
- User outcome: a work order recorded once and still present after reopen.

The proposed workers value is 20, the supported fixture range is 1–8, and the effective value remains 2 after rejection. What is known, what is merely intended, and what next observation would challenge your conclusion?

Write a change contract: owner, allowed target, purpose, before-state, candidate cause, discriminating test, stop condition, rollback, success criteria and adjacent negative test.

## 2. Files

For the string café followed by a newline, predict characters and UTF-8 bytes. Then record file size, read-back equality, copy equality and expected missing-file result.

Explain:

- Why does a relative path need a base directory?
- Why do equal sizes not prove equal contents?
- Why is this not a permission-enforcement or symlink test?

## 3. Owned child process

Before running process, predict each case:

- Normal: output sequence, error output and exit status.
- Deliberate rejection: message and status.
- Timeout: expected deadline observation and cleanup.

Afterward, distinguish launch, READY, PONG, BYE and reaped status. Which are real observations? Which are only conventions of this fixture? Why must cleanup never search for unrelated processes with a matching name?

Do not assume the exact forced-termination numeric status is portable across operating systems. The important contract is timeout observed, owned child no longer running, and result recorded.

## 4. Capacity

Case B1: total 10 GiB; used 7 GiB; final output 1 GiB; temporary peak 1.5 GiB; operating reserve 1 GiB; free file slots 100; expected files 20.

Case B2: total 10 GiB; used 2 GiB; final output 1 GiB; temporary peak 1 GiB; reserve 1 GiB; free file slots 5; expected files 20.

For each compute available bytes, total planned requirement, byte shortfall and file-slot shortfall. State two unmodeled real-world constraints. Do not “fix” a shortfall by deleting files or erasing an assumption.

## 5. Configuration transition record

Start with workers=2 and queue_limit=20. Desired state is workers=4 and queue_limit=40.

For each step record the active logical configuration and whether active bytes should change:

1. Dry run of the desired state.
2. Candidate workers=true.
3. Valid candidate with failure injected after staging but before replacement.
4. Successful valid replacement.
5. Reapply the identical desired state.
6. Roll back to the stored last-good settings.

What does this demonstrate about idempotence? What does it not prove about power loss, concurrent writers or a multi-file migration? Write one operational check beyond file validity.

## 6. Dependencies and retries

Tasks: inventory has no prerequisite; validate needs inventory; database and worker each need validate; report needs both database and worker.

Draw the graph or describe its edges. Give two valid linear orders. Explain why A needs B and B needs A is invalid without changing the requirements.

Predict decisions for:

- transient, transient, success with maximum 3 attempts.
- permanent, success with maximum 3.
- uncertain, success with maximum 3.
- transient, transient, success with maximum 2.
- one supplied transient outcome with maximum 3 and no further evidence.

Give an example of a consequential operation where a lost response does not authorize a blind retry. No real request is sent in this exercise.

## 7. Durable work

Start with stock 3 and no receipts. Predict stock and receipts after:

1. Apply job-001 with payload replace filter.
2. Repeat the identical ID/payload.
3. Reuse job-001 with a different payload.
4. Apply job-002 but inject an exception after the stock decrement, before receipt/commit.
5. Close and reopen the primary database.
6. Open and query the backup.

Explain why a unique ID without payload comparison can hide a conflicting request. State which failure domains the same-directory backup does not cover. Distinguish a structural integrity check from checking the business invariant.

## 8. Cumulative incident: four decision points

Everything below is simulated. Do not execute an operational fix.

### Point 1: the queue grows

An operator says the import queue is growing after “changing workers to 20.” The worker answers the fixture’s READY/PONG protocol. No job-duration distribution or arrival rate is supplied.

List observations, unknowns and three hypotheses. Do not conclude that 20 workers are active or that more workers would help.

### Point 2: validation speaks

A log says the workers=20 candidate was rejected and workers=2 remained active. The import error says insufficient planned staging capacity. Use capacity case B1.

Which hypothesis now has direct support? What evidence would challenge it? Does process readiness eliminate the capacity concern?

### Point 3: started is not finished

The supplied complete fixture has accepted and started events for job-001 and job-002, but only job-001 has a durable receipt. In a real environment you do not yet know whether collection is complete.

Report the two jobs’ status without inventing a completion or accusing a component of data loss. State what additional source would be needed in a real incident. Explain why retrying job-002 must consider uncertain outcome and idempotency.

### Point 4: propose a reversible next step

A colleague proposes deleting all logs, increasing workers and restarting everything. The actual owner has not approved any of those changes.

Write a safer paper plan: preserve evidence; verify capacity and accepted configuration; ask the authorized owner to review a bounded capacity/configuration option; define rollback; repeat one synthetic work order and its durable receipt check after a permitted fix. Keep cause, action and validation separate.

Draft a four-sentence handoff: symptom/impact; strongest evidence and uncertainty; proposed bounded action with authority; success and rollback criteria.

## Self-review rubric

Score each item 0 (missing), 1 (partly explained), or 2 (clear and supported). This is a study rubric, not a certification score.

1. Configuration, runtime, durable data and user outcome are distinct.
2. File reasoning distinguishes names, encoding, bytes and metadata.
3. Process reasoning includes protocol and exact owned-child cleanup.
4. Capacity calculations include units, temporary peak and reserve.
5. Config rejection preserves last good state; atomicity limits are clear.
6. Dependency order and failure gates are not confused.
7. Retries stop on permanent/uncertain outcomes and respect limits.
8. Database deduplication, conflict and rollback preserve the invariant.
9. Incident conclusions do not exceed the supplied evidence.
10. Every result is labeled observed, simulated, assumed or not tested.

Revisit every 0 or 1. A 20/20 self-rating does not prove job readiness, complete A+/RHCSA coverage or an official exam pass probability. Repeat without hints later; real VM administration remains a separate next step.
