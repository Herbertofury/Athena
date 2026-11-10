# Foundry write admission candidate (2026-11-10)

## Problem and scope

The unchanged synthetic four-writer, twelve-writes-per-writer test failed on
Windows at BEGIN IMMEDIATE while another first attempt on the same source passed.
The retained baseline is draft #25 head
`2280329d04d8b83ea6b3430eb7d006a77fda29d5`; its failed Windows receipt remains in
`repair-windows-push.log` in the external evidence bundle. A later pass does not
supersede that failure. The hypothesis is that process-local FIFO admission
prevents an already active writer from repeatedly overtaking waiting Foundry
writers. Linux tests cannot establish Windows acceptance or power-loss safety.

## Contract

- FoundryStore itself admits schema initialization, soundtrack assignment with
  optional atomic history, native history, and catalog seeding. Direct callers
  and HTTP callers therefore share the same coordination.
- Each canonical existing database path has one process-local gate. The
  connection is opened before canonicalization so a new file has a stable key.
  Relative and symlink aliases converge. Private memory/temporary databases get
  independent gates. Registry values are weak references; dead entries are pruned
  on subsequent disk-store lookup. Unrelated databases do not serialize writes.
- A gate permits one writer and at most 64 pending writers. FIFO order is defined
  by enqueueing under its mutex, not OS thread-start time. New writers cannot
  overtake enqueued writers. Queue-full and timed-out callers receive SQLITE_BUSY;
  timed-out tickets remove themselves. Poisoned coordination fails closed.
- The configured default stays five seconds and synchronous=EXTRA. A write uses
  the current numeric busy timeout, including zero for an immediate attempt.
  One deadline covers admission and SQLite busy callbacks during configuration,
  BEGIN, statements, and COMMIT. The callback only requests sleeps up to the
  remaining budget (at most one millisecond each); OS scheduling can overshoot.
  This is not a deadline on transaction execution, filesystem synchronization or
  an otherwise uncontended commit. There is no replay of a transaction or write.
- A scoped SQLite busy handler replaces the numeric timeout during the operation.
  The handler fails closed without an active thread-local deadline; nested write
  scopes on one thread are rejected. Foundry does not expose arbitrary custom
  busy handlers. The original numeric timeout is restored after transaction
  cleanup and before releasing admission, on success, failure, and unwinding.
- A successful COMMIT remains a success even if timeout restoration fails. That
  connection is then disabled for future writes. A transaction left active after
  cleanup likewise disables future writes. No durable success is reported as a
  safe-to-retry failure merely because restoring connection configuration failed.

## Limits and rejected alternatives

This is not cross-process admission and does not coordinate other Athena modules,
raw SQLite connections, hard-link aliases, or file replacement/rename while open.
Such contenders remain subject to SQLite locking and the same bounded wait.
Do not replace or alias a live database with hard links. A prolonged transaction
can legitimately cause queued writers to time out. Readers remain independent.

Increasing the timeout, retrying failed writes, reducing the original stress, or
serializing only the HTTP layer were rejected: they would conceal starvation,
change failure/latency behavior, or leave direct callers unprotected. A scoped
deadline callback avoids giving each SQL statement another full timeout after the
queue has already consumed its budget.

## Verification

The original rollback and four-by-twelve stress tests are retained without
weakening. Added synthetic tests cover FIFO/no overtaking, bounded queue rejection,
expired-ticket removal, release on unwind, poison rejection, canonical aliases,
weak registry lifecycle, independent database and memory isolation, deadline
callback behavior, and timeout restoration/atomic rollback on unwind and error.
Actual focused-run output is saved separately under `fifo-*` in the external
evidence bundle, including failed development compiles. Exact final aggregate
and Windows CI results must be checked before acceptance.
