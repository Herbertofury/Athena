# Systems Workshop answer key

Use the stated assumptions. These are original teaching exercises, not official exam questions or instructions to change real systems.

## Inventory

Configured workers=20 is intended state; the rejection and effective workers=2 describe supplied runtime evidence. The database and receipts are durable-state concerns. A work order correctly recorded once and recovered after reopen is a user-outcome criterion. Verify the accepted runtime setting before designing a rollback. “The latest file says 20” is insufficient.

## Files

café plus a newline has five Python characters and six UTF-8 bytes. The stored size is six bytes. Read-back and copied-byte comparisons are true, and missing.txt is absent. The temporary directory is removed on normal completion.

Relative paths depend on their base. Equal file size does not establish equal content. No permissions, ACLs or symlink behavior were changed or verified. This exercise uses actual I/O but only for fixed invented content.

## Processes

- Normal: stdout READY, PONG, BYE; no stderr; exit 0; child reaped.
- Deliberate rejection: no stdout; fixed REQUEST_REJECTED message on stderr; exit 7; child reaped.
- Timeout: timeout observed; wrapper terminates and waits for its exact owned child. The termination code is platform-specific and should not be memorized as a universal value. In the preparation Linux run it was −9.

READY is a fixture protocol signal; PONG shows one successful request. Neither is a full installed-service health check. Keeping the created Popen handle prevents accidentally targeting an unrelated process by name or a stale PID. The child receives no arbitrary user command or inherited credential environment.

## Capacity

One GiB is 1,073,741,824 bytes.

B1 has 3 GiB available and needs 3.5 GiB including temporary peak and reserve. Shortfall: 0.5 GiB, or 536,870,912 bytes. File slots fit: 100 available for 20 planned.

B2 has 8 GiB available and needs 3 GiB, so bytes fit. File-slot shortfall: 20 − 5 = 15.

Real questions still include quotas, simultaneous writers, actual staging behavior, filesystem allocation and time/scope of measurement. Do not silently remove the reserve to produce a passing answer.

## Configuration

1. Dry run: unchanged at 2/20.
2. Boolean worker count: rejected; unchanged at 2/20.
3. Injected pre-replacement failure: candidate cleanup; unchanged at 2/20.
4. Valid replacement: active 4/40; last-good stores previous bytes.
5. Repeat: no-op; remains 4/40 without an unnecessary active-file rewrite.
6. Rollback: active logical settings return to 2/20.

The test exercises a specific interruption point. It does not emulate a sudden power loss, prove directory synchronization, test concurrent changes or create multi-file atomicity. A real operational check might submit one bounded synthetic job and verify the expected durable receipt under the accepted configuration.

## Dependencies

Two valid orders are inventory → validate → database → worker → report, and inventory → validate → worker → database → report. The supplied deterministic planner chooses the first. A cycle has no valid order without resolving the requirements.

Retry results:

- transient, transient, success; limit 3: complete at attempt 3.
- permanent, success: stop at attempt 1.
- uncertain, success: stop for outcome verification at attempt 1. Do not consume the later answer.
- transient, transient, success; limit 2: limit reached after 2 attempts.
- one transient outcome; limit 3: more evidence needed, not an invented success or a claimed exhausted limit.

A lost response from a payment, message send or work-item submission can hide a completed operation. Confirm outcome or use an appropriate authorized idempotency mechanism before repeating. The planner sends nothing and guarantees nothing about distributed delivery.

## Database

After step 1: stock 2, one receipt for job-001. Step 2 changes neither. Step 3 reports a payload conflict and preserves both. Step 4 rolls back the injected decrement, so stock remains 2 with one receipt. Reopened primary and backup show that same state; the backup integrity check is ok.

An ID reused with different content must not be treated as the same completed request. The test uses parameterized SQL and explicit transaction rollback. This is a narrow local pattern, not a complete exactly-once distributed protocol. Structural integrity alone does not validate stock/business meaning, so those rows are checked separately.

The backup is in the same temporary directory and failure domain. It is useful for this local backup/reopen experiment but does not protect against host loss, malicious deletion, a compromised account or loss of the underlying disk. No power failure or sustained concurrency was tested.

## Cumulative case

At point 1, retain several hypotheses: arrival rate, worker/dependency state, rejected configuration or storage pressure. A response proves a limited worker protocol, not throughput or job persistence.

At point 2, the rejected configuration and capacity error directly support investigating accepted state and staging headroom. B1 falls short under its explicit plan. Verify actual capacity and planned peak with the responsible owner in a real incident. Do not increase workers merely because the queue is long.

At point 3, job-001 has a completion receipt. Job-002 is not established as completed by the supplied fixture. In real work, missing collection, delayed data or a separate source may explain the gap; establish completeness and authoritative state. Do not treat a missing reply as proof that retrying is safe.

At point 4, avoid the broad proposed changes. Preserve evidence, test the narrow hypothesis, get appropriate authority and use a reversible change with an explicit success/rollback contract. Validation includes the original workflow and durable receipt, not just “process is running.”

Example handoff: “In this fictional case, imports are delayed while the worker still answers its probe. The accepted configuration remains workers=2, and the supplied staging plan is short by 0.5 GiB; job-002 has no completion receipt in the provided data. The owner should first verify actual capacity and effective settings, then review a bounded reversible option rather than deleting logs or restarting everything. Success requires one authorized synthetic job to complete exactly once with a durable receipt; failed validation or unexpected side effects should stop the change and trigger the documented rollback.”

This is a tabletop draft, not a message to send or authority to alter a real system.
