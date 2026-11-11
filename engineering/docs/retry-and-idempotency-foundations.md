# Know what a retry can repeat

November 11, 2026. Original design synthesis plus a [synthetic executable lab](../experiments/retry-boundary-lab/README.md). No production queue, external service, mod or target project is changed. This is not a performance ranking or an exactly-once delivery claim.

## The decision before choosing a queue

An application can lose the reply after work has already committed. Treat “no confirmed reply” as an uncertain outcome, not proof that nothing happened. HTTP's idempotency definition concerns the intended effect of repetitions, not identical response bytes or absence of diagnostic logs. A non-idempotent operation is not made safe by trying again with a fresh random key. [RFC 9110 §9.2.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2) (RB26001).

First identify the durable boundary. Is the effect a row change in one database, a file replacement, a notification, a remote API mutation, or several of these? Name who can answer whether it happened. Then select an identity, replay and reconciliation contract for that boundary. A spinner, disabled button, process mutex or in-memory cache cannot supply durable knowledge after restart.

The existing [job submission experiment](../experiments/job-submission-recovery-lab/README.md) correctly treats a missing local enqueue receipt as unconfirmed and avoids an automatic POST retry. Existing [version collection](../experiments/version-collection-queue-lab/README.md) and [upstream review](../experiments/upstream-review-lab/README.md) explicitly separate snapshot persistence from job completion. Those are evidence of their particular contracts, not defects this research claims to repair. Open draft [#7](https://github.com/Herbertofury/Athena/pull/7) tests actual Queue transaction rollback/storage faults. Our lab instead isolates operation identity and delivery across two independent database commits.

## Three boundaries, three different guarantees

| Boundary | Contract this design can offer | What remains outside it |
|---|---|---|
| One producer transaction | Effect, immutable operation receipt and outbox row become visible together | External delivery has not occurred |
| Producer to receiver | A pending event remains available for another explicit delivery attempt | A missing acknowledgement cannot prove receiver non-execution |
| One receiver transaction | Effect and deduplication receipt commit together; matching identity returns the stored receipt | External effects beyond this receiver transaction, ledger loss and eventual delivery |

The [transactional outbox reference](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html) describes persisting the business update and event in one transaction, then delivering separately, with duplicate handling at the consumer (RB26003). The lab uses this separation without adopting its cloud services or translating broker-level claims into application-level guarantees.

“At least once” also requires a live retry mechanism and assumptions about storage and eventual connectivity. This lab attempts delivery once per call. A pending row is replayable; it is not a promise that a scheduler will eventually deliver it.

## Define identity as part of the API

- **Operation versus attempt:** generate one operation key for one intended action, persist it before the first attempt, and preserve it for retries. A deliberate second identical action needs a different key.
- **Authenticated scope:** bind keys to the authorized principal and operation namespace. The synthetic `scope` field is only data, not authentication. Letting a caller freely select another tenant's scope would defeat this boundary.
- **Shared namespace and receiver:** independent producers must coordinate operation identity within the same logical receiver. Two producers using identical scope/key/payload intentionally collapse here. Retrying an unknown delivery against a different receiver ledger can execute the effect again; a failover name alone is not shared deduplication state.
- **Payload meaning:** same scope/key with different request content is an explicit conflict. The lab compares stored canonical bytes, not just a digest. Its fixed schema defines exact UTF-8 bytes, integer range and version; it is not a generic JSON equivalence algorithm. Unicode normalization, defaults, field omission, timestamps, amounts and resource identifiers require domain-specific decisions.
- **Stable response:** the lab stores the original receipt and replays its exact bytes, including the original effect identifier. This is a deliberately stronger test contract than generic HTTP idempotency.
- **Retention:** record how long an old key remains recognized and what happens afterward. Backups must include deduplication state and its identity namespace. Restoring effects without receipts can make an old operation look new.

AWS's [idempotent API design discussion](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/) describes caller-supplied intent, atomic recording, parameter mismatch and late-arrival retention choices (RB26002). Retention is a product contract, not a universal timeout. As one concrete counterexample to assuming all providers behave alike, [Stripe's current documentation](https://docs.stripe.com/api/idempotent_requests) separates API v1 stored-response behavior from API v2 retry behavior; v1 can treat a reused pruned key as a new request (RB26008). No Stripe request or payment is made in this experiment, and its rules are not projected onto other APIs.

Do not use private personal data as operation keys. IDs and receipt hashes are not authentication, authorization or integrity signatures. A malicious actor able to forge a correctly shaped receipt is outside this lab's trust boundary.

## A crash matrix, not a success-path demo

The [lab](../experiments/retry-boundary-lab/README.md) deliberately retains both safe and unsafe controls:

| Interruption | Observed generated state | Required interpretation |
|---|---|---|
| Producer exits after effect/outbox/receipt writes but before commit | None of those rows are committed after reopen | Retry may create the operation |
| Producer exits after commit but before returning | One effect, one receipt, one pending event | Same key returns the stored receipt |
| Receiver exits before its commit | Pending producer event, no receiver effect | Explicit retry can execute the receiver transaction |
| Receiver commits, delivery reply is lost | Pending producer event and a committed receiver effect | Unknown delivery, not safe to use a new key |
| Deduplicating receiver sees the same operation again | Original receiver receipt and one receiver effect | Producer may acknowledge this matching receipt |
| Non-deduplicating control receives the replay | Two receiver effects | An outbox alone does not prevent duplicates |
| Producer exits before acknowledgement commit | Receiver committed, producer still pending | Retry must preserve operation identity |
| Producer exits after acknowledgement commit | Event is acknowledged | A subsequent dispatch finds no pending event |
| New receiver fixture contains effects but omits its receipt ledger | Replay produces another effect | Partial recovery can destroy retry safety |

The fixture uses SQLite rollback journaling, `synchronous=FULL`, explicit `BEGIN IMMEDIATE`, and separate connections. SQLite [isolation](https://www.sqlite.org/isolation.html) serializes writers, while [transaction control](https://www.sqlite.org/lang_transaction.html) specifies that lock acquisition can return `SQLITE_BUSY` (RB26004–RB26005). The cross-process contention test observes an uncommitted writer, verifies the second attempt is busy without implicit retry, then replays the committed receipt. This does not measure throughput or establish that a busy wait always finishes in a hard time bound.

The [Python binding](https://docs.python.org/3.12/library/sqlite3.html) is set to explicit SQL transaction control and existing-file `mode=rw` (RB26007). Tests are pinned by recorded source hashes and runtime versions, not by assuming that a documentation version is the installed engine.

`os._exit` bypasses normal child cleanup at declared boundaries. It is more specific than an orderly reopen and less comprehensive than an operating-system crash or power interruption. SQLite's [atomic-commit documentation](https://www.sqlite.org/atomiccommit.html) states its storage and filesystem assumptions (RB26006). No test here validates a particular disk controller, filesystem, network share or power-loss guarantee.

## Failure handling is part of the architecture

1. **Preserve ambiguity.** Keep `pending`, `committed locally`, `acknowledged by receiver` and `reconciliation needed` separate. Show a useful lookup or recovery action instead of calling an uncertain operation “failed safely.”
2. **Do not hold a producer transaction during an external wait.** Durable state and receiver acknowledgement belong to different transactions here. Adding an HTTP call inside a SQLite transaction would not make the remote commit atomic with it.
3. **Bound attempts and overload separately.** A retry policy needs a budget, deadline, backoff and concurrency admission, not an unbounded loop. The lab has no automatic loop and retains every synthetic row. It therefore does not provide production storage/backlog quotas.
4. **Do not reinterpret cancellation.** Cancellation before delivery can leave an untouched receiver. Cancellation after receiver commit cannot undo its effect. Compensation, if available, is another authorized operation with its own identity and uncertainty.
5. **Preserve failures and conflicts.** A changed payload under an old key, an invalid acknowledgement or an already-stored different acknowledgement leaves the operation unresolved. Do not overwrite a receipt to make retry appear successful.
6. **Plan restore together.** Receiver receipts, producer receipts, pending events and effect history participate in the logical recovery model. Restoring independent databases to different moments requires reconciliation. The lab's incomplete-copy control changes only a fresh fixture, preserving the original.

## Alternatives and when this approach is inappropriate

- A naturally idempotent operation, such as setting a resource to an explicitly versioned desired state, can be simpler than a receipt ledger. Verify its concurrency/precondition rules; “set” alone does not settle competing writers.
- If the effect and required history fit in one local transaction, keep them there. Do not introduce a network service or workflow engine merely to imitate this two-boundary example.
- If a third-party mutation offers no reliable idempotency or lookup contract, a local outbox cannot add one. Stop automatic replay at uncertainty and reconcile through the provider's supported mechanism.
- Strict global/per-resource order, long-running workflows, leases, cancellation of queued work, human approval, retention and multi-tenant abuse control need a larger state machine than this lab. Compare it with the target's current implementation before choosing a library or orchestrator.
- File-system changes, emails, payments, game saves and remote APIs do not join a SQLite transaction merely because the code runs in one function. Each needs its own commit and authorization analysis.

## Before recommending this to a real app or mod tool

Record the exact target baseline, operation semantics, provider API version, retention horizon, backup/restore scope, authentication boundary and allowed retry policy. Then inject loss before and after each real durable boundary, preserve complete output and audit history, measure bounded resource use and user recovery, and exercise that target's actual supported platforms. Include stale/reordered attempts, restart/version skew, exhausted storage, inaccessible receiver and permanently rejected commands. All of those target acceptance states remain **not run** here.

See the [dated research record](../research/2026-11-11-retry-boundary-foundations.md) and [complete source register](../data/source-index.json). Newness, test count and a synthetic success do not establish suitability elsewhere.
