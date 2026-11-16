# Snapshot writer admission candidate

## Observed failure

[Athena post-merge run 43806778544](https://github.com/Herbertofury/Athena/actions/runs/43806778544), November 16, 2026, failed the generated concurrent snapshot persistence test. The captured run used SQLite 3.54.1 and DELETE journaling. A writer's deferred BEGIN succeeded in 6 microseconds; its first INSERT then returned extended result code 5 after 5,004,609 microseconds. Another writer completed all 16 observations while that writer waited. This is evidence of lock contention and compatible with writer starvation, not proof of a SQLite defect. It is not the distinct BUSY_SNAPSHOT extended code or an immediate timeout bypass. Autocommit was restored on failure. The failure artifact remains attached to that run.

## Change and limits

SnapshotStore writers in the same process and referring to the same file identity now enter a FIFO admission queue before opening their transaction. An RAII permit covers rollback/commit and releases on error or unwind. Independent database files and private memory databases have independent gates. Unix file identity uses metadata-only device/inode values; other platforms use canonical paths. It deliberately does not open independent database file descriptors, whose close can invalidate SQLite POSIX locks. No new dependency or journal-mode migration is introduced.

Admission uses a five-second eligibility deadline (scheduler delays can postpone return) and allows up to 256 waiting writers. Queue-full and timeout failures occur before SQL begins and remain explicit SQLITE_BUSY errors. This is a separate admission budget, not a five-second end-to-end operation deadline; SQLite's existing five-second external-lock timeout remains. No SQL statement or transaction is automatically retried. Existing payload validation, snapshot/receipt atomicity, synchronization EXTRA and failure history are preserved.

This is not cross-process FIFO arbitration. Other SQLite clients, other storage components, readers, or external writers can still cause a surfaced busy error. Non-Unix hard-link or case aliases need not share a gate. Alias matching does not make SQLite hard-link database use safe. Windows CI and slow-storage validation are still required; a fast local synthetic stress pass does not reproduce the original host's timing or establish production throughput.

## Local verification

Rust 1.99.1, Linux, offline pinned dependencies. Run from repository root:

```sh
cargo test --locked --manifest-path engineering/apps/atlas-lab/Cargo.toml
cargo clippy --locked --manifest-path engineering/apps/atlas-lab/Cargo.toml --all-targets -- -D warnings
```

Unit checks cover FIFO re-entry, timeout-ticket removal, unwind release, queue capacity, same-file identity and independent memory/file stores. The existing persistence test retains all 64 exact payloads and one matching success receipt each, plus four failed attempts, reopen parity and SQLite integrity checks in both DELETE and WAL modes. The held external writer test still checks that a busy failure leaves no partial snapshot.

Original-candidate local Rust tests (190 tests plus the subprocess helper), all-target clippy and 20 consecutive persistence stress iterations passed. The Unix subprocess lock regression confirms that identity lookup preserves an active SQLite lock against a separate process. The research checker and all 460 Python tests passed. CI on Windows and slow storage is still required before claiming hosted qualification; no general cross-process fairness or production acceptance is claimed here.
