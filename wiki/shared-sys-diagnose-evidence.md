# Resolve a systems incident from layered evidence

Connect configuration, capacity, process and durable data without shotgun changes.

## Learning goals

- Choose a discriminating test from conflicting observations.
- Separate queue delay, process health and storage correctness.
- Write an operational handoff with tested scope and remaining gaps.

## Learn

A growing queue is a symptom. Work may be arriving faster than it can be processed, workers may be stopped, a dependency may be unavailable, or a change may have been rejected. Start with the useful workflow and the measurement window. A queue length without arrival and completion context does not establish a root cause.

Correlate evidence by stable job or event identifiers and explicit timestamps. Separate a request being accepted, work beginning and a durable completion receipt. A logged “started” event is not a completed job. A success counter can also be wrong if retries are counted twice. Reconcile the data contract before optimizing the number.

Metrics summarize, logs describe events and a direct controlled test can check a hypothesis. A high average latency can hide a few extreme outliers or a broad slowdown. A percentile from a tiny sample is still only a description of that sample, not a reliable promise about future traffic. The fixture uses counts and exact identities rather than claiming performance from a benchmark.

Change one relevant thing at a time when possible, preserving the before-state and a rollback path. Restarting every component can erase useful evidence, interrupt healthy work and make the actual cause harder to identify. A targeted correction must be followed by the original user workflow and an adjacent negative case.

Cedar’s cumulative case deliberately mixes clues: an invalid proposed configuration, a healthy pipe-protocol check, a staging-space shortfall and a started-but-not-committed job. These facts have different scopes. A valid process response does not remove the storage shortage; a rejected config does not prove that all old settings are wrong. The answer should preserve each boundary.

Finish with a short handoff: symptom and impact, verified cause or leading hypothesis, observations, action taken in the lab, validation, rollback status and open questions. Label executed temporary-system checks separately from synthetic incident facts. A completed worksheet is useful evidence of reasoning, not a claim of administrator certification or permission to make production changes.

## Worked example

The fictional import fails when staging needs 3.5 GiB but only 3 GiB is available. Its error names insufficient planned capacity; the worker is ready and the last good configuration remains active. The best-supported next action is to review the staging requirement and approved capacity options, not increase workers or disable validation. A separate started event has no matching durable receipt, so the report must not mark that job completed. Real follow-up would require the authorized owner and actual storage evidence.

## Practice safely

1. Read the cumulative case and separate observation, assumption and hypothesis.
2. Run python3 labs/systems-workshop/offline_lab.py incident.
3. Identify the missing completion receipt without treating every absent log as failure proof.
4. Choose one non-destructive observation that would challenge the proposed cause.
5. Write a recovery validation and a stop condition.
6. Complete the worksheet rubric and record the next hands-on skills that still need an authorized VM.

## Evidence to keep

- An evidence-to-hypothesis map for the cumulative case.
- A reconciled job status without invented completions.
- A concise handoff with scope and remaining tests.

## Original check 1

A process answers PING while an import reports insufficient staging capacity. What follows?

- The import must have succeeded
- The process response does not resolve the separate capacity failure
- The database is definitely corrupt
- Increasing workers is guaranteed to help

<details><summary>Answer and explanation</summary>

The process response does not resolve the separate capacity failure. Each observation establishes a limited property. Process readiness and storage headroom are separate.

</details>

## Original check 2

A job has a started event but no completion receipt in the supplied complete fixture. How should its status be reported?

- Completed because it started
- Deleted from history
- Not established as completed; investigate its outcome
- Always failed in every real system

<details><summary>Answer and explanation</summary>

Not established as completed; investigate its outcome. A start is not a durable completion. In a real system also consider collection completeness and delays.

</details>

## Original check 3

Which handoff is strongest?

- Restarted everything, probably fine
- A tool list with no observations
- A guarantee that the incident can never recur
- The tested scope, evidence, result, rollback status and remaining uncertainty

<details><summary>Answer and explanation</summary>

The tested scope, evidence, result, rollback status and remaining uncertainty. A useful handoff helps the next person reproduce the reasoning and understand limits.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

This is a synthetic troubleshooting case supported by bounded local exercises, not a diagnosis or repair of a live machine.

## Official references

- [Python 3.12 logging: event records and configured destinations](https://docs.python.org/3.12/library/logging.html)

- [Microsoft Win32 SERVICE_STATUS: service states](https://learn.microsoft.com/en-us/windows/win32/api/winsvc/ns-winsvc-service_status)

- [Python 3.12 sqlite3: transactions, connection and backup APIs](https://docs.python.org/3.12/library/sqlite3.html)

