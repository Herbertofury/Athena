# Order jobs and bound retries

Model dependencies explicitly and keep repeated work from multiplying harm.

**Study time:** about 45 minutes, with pauses for prediction and practice.

## You will learn to

- Distinguish ordering from successful prerequisite completion.
- Detect a dependency cycle before starting work.
- Explain bounded retries, idempotency and uncertain outcomes.

## Learn

A dependency says that one task needs a condition from another. “After” can describe order without guaranteeing success. Cedar Queue’s report needs validated configuration and a usable database, not merely proof that a launch command was issued. Name the actual prerequisite state and the evidence required to mark it satisfied.

A directed acyclic graph can represent tasks and prerequisites. A topological ordering places every prerequisite before its dependent task. More than one valid order can exist when tasks are independent. A cycle such as A needs B and B needs A has no valid completion order and should be found before the work begins.

Planning an order does not execute the work. A scheduler also needs to handle failed prerequisites, cancellation, timeouts and completion receipts. Our dependency command deliberately computes only a plan and detects a cycle. It does not install a scheduler, launch background jobs or modify cron, Task Scheduler or systemd timers.

Retries help with failures that are plausibly temporary. They do not repair malformed input or missing authority. Bound the attempt count and total time, and use delay/backoff appropriate to the real service rather than hammering it. A real implementation must consider rate limits and coordinated retry storms; the paper model does not sleep or make network requests.

An uncertain outcome is different from a known failure. If a request may have completed but its reply was lost, repeating it can duplicate a payment, message or work item. Use an idempotency mechanism or check an authoritative completion record before deciding to repeat. Never treat a timeout as proof that a consequential operation did nothing.

For the toy retry planner, outcomes are fixed labels: transient, permanent, uncertain or success. Only transient may advance to another bounded attempt. Permanent stops; uncertain stops for verification; success stops as complete. The model teaches decision boundaries, not actual distributed exactly-once delivery. Later, the database exercise uses a unique job ID to show one narrow local deduplication pattern.

## Worked example

The supplied graph orders inventory before validate, validate before database and worker, and both database and worker before report. Database and worker may appear in either order. A separate cycle fixture is rejected. The sequence transient, transient, success completes on attempt 3 if the limit permits. The sequence uncertain, success must stop at the first entry for verification; it must not consume the later success merely because the answer key says it exists.

## Practice safely

1. Draw the dependency graph and produce one valid order.
2. Run python3 labs/systems-workshop/offline_lab.py dependencies.
3. Confirm every prerequisite appears before its dependent task.
4. Explain why the cycle is rejected rather than broken arbitrarily.
5. Predict transient, permanent, uncertain and exhausted retry outcomes.
6. Name an operation that must not be blindly repeated after a lost response.

Use the [offline lab guide](../../labs/systems-workshop/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

Two independent tasks appear in different valid topological orders. What follows?

A. One order must be malicious
B. Dependencies are irrelevant
C. They must always execute simultaneously
D. Both can be valid if all dependency constraints hold

<details><summary>Answer and reasoning</summary>

D. Both can be valid if all dependency constraints hold. A dependency graph often permits several valid linear orders.

</details>

### Check 2

A result is uncertain after a timeout. What is the safe next decision for a consequential operation?

A. Verify the outcome or use an authorized idempotency mechanism before retrying
B. Repeat indefinitely
C. Assume it failed
D. Erase the completion record

<details><summary>Answer and reasoning</summary>

A. Verify the outcome or use an authorized idempotency mechanism before retrying. Uncertainty does not prove non-execution. Blind retries can duplicate side effects.

</details>

### Check 3

A prerequisite task fails. What does an ordering-only plan guarantee?

A. That every dependent task is safe
B. Only an order, not successful readiness or failure propagation
C. Automatic recovery
D. A valid business result

<details><summary>Answer and reasoning</summary>

B. Only an order, not successful readiness or failure propagation. Execution gates and failure handling require more than a topological sort.

</details>

## Evidence to keep

- A valid dependency order and cycle result.
- Four bounded retry decisions with explanations.
- An uncertain-outcome rule connected to a concrete side effect.

## Limits

No scheduler, network retry, delay timing, distributed exactly-once guarantee or real background task is implemented.

## Official references

- https://docs.python.org/3.12/library/graphlib.html
- https://docs.python.org/3.12/library/subprocess.html
- https://www.sqlite.org/lang_transaction.html
