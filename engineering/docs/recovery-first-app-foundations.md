# Recovery-first foundations for local apps and mod tooling

Reviewed **2026-11-11**. This is a cross-cutting architecture and acceptance guide, not a framework ranking or a claim that Athena's active application has adopted these patterns. The accompanying [SQLite recovery drill](../experiments/sqlite-recovery-drill/README.md) is an executable synthetic example; other recommendations are design synthesis requiring target-specific acceptance.

## What this adds to Athena

The existing [stack map](stack-selection.md), [performance guide](performance.md), [storage guide](algorithms-storage-concurrency.md) and [research queue](research-test-queue.md) already cover many technologies. The missing connective tissue is a recovery contract: what exactly survives a cancelled import, interrupted schema change or failed restore, and how do we prove it without hiding a partial result?

This guide joins those concerns around one representative journey: select a mod or asset corpus, validate it, import complete metadata, show usable results, preserve the previous state, and recover after interruption. It does not authorize changes in another application.

## 1. Establish ownership before choosing the stack

For each operation, record its input identity, schema/version, permitted destinations, complete output contract, owner, resource budget and terminal states. A practical local design separates:

- **Presentation:** navigation, focus, previews and cancellable views. It does not own authoritative persistence or unrestricted filesystem access.
- **Application service:** validates commands, assigns operation/generation IDs, admits work, reconciles retries and publishes results only to the still-current owner.
- **Domain core:** deterministic parsing, dependency decisions and validation with explicit inputs and outputs. Keep IO and UI details outside when the extra boundary earns its cost.
- **Platform adapters:** files, databases, network, game loaders and process execution. Each owns its capability and lifecycle rules.

This is a modularity proposal, not an instruction to introduce microservices. Prefer a local module or process when the deployment is local. A service is justified by a concrete multi-user, operational or isolation need, not by the fashion of distributing everything.

**Acceptance artifact:** one end-to-end trace plus a state-transition diagram or table connecting UI request, admitted job, verified output, commit receipt and view publication. Include stale-generation refusal and restart reconciliation.

## 2. Bound total work, not just thread count

A bounded Tokio channel limits buffered **messages**, not their combined byte size. A pipeline accepting a few huge archives can still exhaust memory. Reserve separate limits for inputs, queued bytes, active parsing, expanded archives, result buffers and retained history. Apply backpressure before allocating or reading ahead. [AF26001](https://docs.rs/tokio/latest/tokio/sync/mpsc/fn.channel.html)

Tokio's blocking pool can grow to a large configured limit; CPU-heavy blocking work needs explicit concurrency control. Aborting a started `spawn_blocking` task does not stop its closure, and a shutdown timeout stops waiting rather than cancelling it. Design cooperative cancellation, or a separate process when enforceable termination is required. Neither option makes an already-started external side effect disappear. [AF26002](https://docs.rs/tokio/latest/tokio/task/fn.spawn_blocking.html)

Use an absolute monotonic deadline within one process for admission, queue wait, execution and cleanup accounting. Re-budget across processes rather than assuming their monotonic clock epochs match. The application decides whether cancellation means no new work, no publication, or rollback before commit; expose that distinction to callers.

Retries are separate attempts under the same operation identity. A timeout does not prove the remote operation failed to happen. Retry only a permitted, safely repeatable operation, with a bounded policy; backoff and jitter do not make a non-idempotent action safe. [AF26003](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/)

**Failure fixtures:** over-capacity input; slow consumer; cancellation while queued, parsing and committing; duplicate submission; stale view; vanished worker; unknown commit outcome. Reconcile accepted = completed + failed + cancelled + explicitly pending. Do not declare zero pending merely because a queue is empty.

## 3. Make backup and restore separate, verifiable operations

For SQLite, use a database-aware backup operation rather than copying only the main file from a running WAL database. Committed pages may still live in its WAL. The official documentation also describes platform and concurrency limits; WAL is not a universal default or a network-filesystem solution. [AF26004](https://www.sqlite.org/wal.html)

The Online Backup API can copy incrementally while other clients operate. External changes between steps can restart the backup; therefore do not promise that an unconstrained incremental run represents the exact instant the button was clicked. Record the copied generation/manifest and state the consistency policy. A successful finish cleanup call alone is not the same as a completed copy; verify that copying reached completion. [AF26005](https://www.sqlite.org/c3ref/backup_finish.html)

A useful staged protocol, to implement and test for the target:

1. Create a unique candidate within a trusted destination boundary. Never use the existing last-good backup as scratch space.
2. Copy with explicit cancellation/time/resource policy. Preserve failed-stage diagnostics without presenting the stage as a valid backup.
3. Close and reopen the candidate. Check application identity and supported schema, structural integrity, foreign keys, expected objects, complete logical records and domain invariants.
4. Save a manifest identifying tool/runtime versions, schema, committed generation, validation results, content digest and limitations. A digest detects changes; it is not an authorization or authenticity proof by itself.
5. Publish only through the platform's tested safe-file protocol. Distinguish file flush, directory-entry persistence and a successful API return. Do not infer power-loss survival from a clean reopen.
6. Restore first into a **new isolated database** and exercise real reads. Replacing active state is a distinct, authorized operation requiring closed connections, rollback material and platform-specific race/durability checks.

SQLite's `integrity_check` does not validate foreign-key relationships; run `foreign_key_check` separately. Neither check proves that an application payload belongs to the right item or that every required record was copied. The lab deliberately demonstrates all three gaps. [AF26006](https://www.sqlite.org/pragma.html)

**Alternative:** `VACUUM INTO` makes a compact logically equivalent copy and can remove free-page remnants. It is not incremental, and implicit rowids can change without explicit integer primary keys. Use it only when those semantics and its resource costs fit; retain incomplete outputs as failures after interruption. No benchmark here ranks it against the backup API. [AF26007](https://www.sqlite.org/lang_vacuum.html)

## 4. Treat migration as a versioned recovery protocol

Pin the accepted application identity and supported schema range. Refuse a database written by a newer application unless a reviewed compatibility contract exists. A version marker without shape/content checks is insufficient.

For a simple migration, acquire the write transaction, revalidate the starting version under that ownership, make schema and data changes, validate invariants, update the version and commit as one unit. SQLite admits only one writer; transaction errors can leave a transaction active, so inspect and clean up deliberately. Do not silently replay the entire mutation because COMMIT was busy or the response disappeared. [AF26008](https://www.sqlite.org/lang_transaction.html)

For complex table rebuilds, follow SQLite's documented schema-change procedure, accounting for indexes, triggers, views and foreign keys. Do not improvise a writable-schema shortcut. The lab's ADD COLUMN migration is intentionally much narrower than arbitrary schema conversion. [AF26009](https://www.sqlite.org/lang_altertable.html)

Python's backup wrapper exposes incremental page copying and progress callbacks. Its transaction-control modes need explicit attention, especially when composing helpers; the lab uses individual SQL statements inside an explicit migration transaction, not `executescript` as an assumed atomic batch. Runtime versions are recorded separately from the documentation version. [AF26010](https://docs.python.org/3.12/library/sqlite3.html)

**Crash matrix:** after transaction acquisition; after DDL; after data transform; before commit; after commit but before reply; during candidate backup; during final publication. Preserve old-or-new invariants, not merely absence of exceptions. Process exit, OS crash, disk-full, IO errors and power loss are different failure models.

## 5. Treat imported data and privileged commands as hostile boundaries

A read-only database connection is not a complete hostile-file sandbox. SQLite recommends defensive configuration, reduced limits, restricted schema trust, authorizers and progress interruption according to threat model. Application-defined functions and extension loading require particular care. For untrusted imports, budget CPU/memory, parse in an appropriately isolated process, and move only validated data into the trusted store. The synthetic lab does not implement this security envelope. [AF26011](https://sqlite.org/security.html)

For Electron, preserve context isolation and process sandboxing, keep Node integration away from remote content, validate IPC senders and constrain navigation and external URL opening. An IPC command should represent a narrow operation, not expose arbitrary shell commands or paths to renderer content. [AF26012](https://www.electronjs.org/docs/latest/tutorial/security)

For Tauri, scope permissions to specific windows/webviews and inspect the union when several capabilities apply. These controls limit frontend exposure; they do not constrain malicious Rust code or repair incorrect command scope checks. Do not label a native plugin sandboxed solely because the frontend has a capability file. [AF26013](https://v2.tauri.app/security/capabilities/)

**Gate:** test cross-window commands, oversized messages, stale handles, path traversal and link substitution, unauthorized network access, untrusted preview content, revoked permissions and secret/log leakage. Keep unsupported capabilities explicitly unavailable.

## 6. Evaluate complete outcomes and reproducible release evidence

Before optimization, specify correct record counts, payload equality, errors/warnings, order where meaningful, stable focus/selection and durable completion. Measure input-to-usable and input-to-verified completion separately, along with p95/p99 only when sample size and workload justify those statistics. Report queue wait, IO, parse, transfer, render, commit, memory and CPU, preserving cold and warm cohorts.

Keyboard access, visible focus and perceivable status changes remain correctness gates, not optional performance tradeoffs. Use WCAG's testable criteria plus actual assistive-technology and target-platform checks; a static check is not a conformance claim. [AF26014](https://www.w3.org/TR/2024/REC-WCAG22-20241212/)

Record exact source commit, locked dependencies, compiler/runtime, build flags, tested artifact hashes and CI attempt. Provenance and supply-chain levels describe particular guarantees; do not promote a signed artifact into proof of runtime correctness or a claimed SLSA level without its requirements. [AF26015](https://slsa.dev/spec/v1.2/)

**Adoption decision:** retain the actual application's baseline and compare a complete vertical slice under unchanged security/durability/feature requirements. Reject a candidate if it loses data, cancellation ownership or accessibility even when its isolated hot path is faster. This guide and lab provide reusable acceptance criteria, not permission to migrate existing apps.

## Measured here, and still unmeasured

The [20-test drill](../experiments/sqlite-recovery-drill/README.md) and its retained log exercise generated SQLite fixtures on one Linux/Python/SQLite combination. They establish the reported component behaviors only. No production restore, real user corpus, hostile-filesystem boundary, installed desktop shell, cross-platform result, disk-fault simulator, hardware power-loss test or comparative speedup has been established. Those remain explicit target gates.
