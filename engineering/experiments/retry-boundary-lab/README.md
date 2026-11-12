# Retry boundaries across two durable stores

November 11, 2026. Original, standard-library Python experiment using generated SQLite files. The [architecture guide](../../docs/retry-and-idempotency-foundations.md) explains the decision and primary sources. This lab is not imported by Athena's runtime and has no network, provider, payment, email, game or production database connection.

## Question and predefined invariants

What can be retried after a process disappears between committing an effect and acknowledging it?

1. A producer's effect, operation receipt and pending outbox row must commit together or not appear.
2. Matching scope/key/payload must replay its exact receipt. A different payload under that identity must conflict without replacing earlier state.
3. A receiver's effect and deduplication receipt must commit together. A lost reply leaves the producer uncertain; it does not undo the receiver.
4. An acknowledgement must be canonical, bounded and bind the same scope, key and payload digest. It must not overwrite a different stored acknowledgement.
5. An outbox without receiver deduplication must reproduce duplicate effects after an ambiguous delivery.
6. A fresh partial-copy control that omits receipt state must reproduce duplicate effects while preserving the complete original fixture.

`retry_boundary.py` implements only those small contracts. Effects are rows with generated task names and units, not real-world actions. Receipt payloads are exact canonical UTF-8 JSON bytes. Request equality uses complete stored bytes; SHA-256 in the acknowledgement is a binding field, not a signature or proof of authenticity.

## Reproduce without using existing data

From the `engineering` directory:

```sh
python3 -m unittest discover -s tests -p 'test_retry_boundary.py' -v
python3 experiments/retry-boundary-lab/run_demo.py --output /tmp/athena-retry-demo-NEW
```

Choose a fresh output path. The driver refuses an existing directory and creates every input database itself. It never opens a supplied working database. Tests create and retain separate `athena-synthetic-retry-*` directories, complete logical `final-state.json` records and child exit logs. No fixture, last-good result or failed evidence is removed. Filesystem paths are for trusted owned test directories; hostile paths, symlink races and concurrent fixture creation are outside this contract.

The standalone module's existing-database calls use `mode=rw` and validate a fixture application ID, schema version and role. They are research functions, not an import surface for arbitrary files. There is no command-line arbitrary query or database mutation endpoint.

## Evidence

- [Initial focused run](retry-tests-initial.log): 35/35 passed on Linux, Python 3.12.14, SQLite 3.53.1.
- [Reviewed final focused run](retry-tests-final.log): 38/38 passed, including two negative controls suggested by independent review: shared identities across independent producers, and replay against a different receiver ledger. One additional test verifies that unexpected child-exit diagnostics are saved before the runner rejects them.
- [Four complete demonstration scenarios](demo-receipt.json): full logical rows and lossless BLOB hex before/after recovery, runtime information, child exit results and source SHA-256 identities. A replay with receiver deduplication leaves one receiver effect. The deliberately naive receiver and omitted-ledger controls each produce two effects.
- [Validation summary](validation-summary.json) distinguishes focused, aggregate and unrun acceptance. The [research record](../../research/2026-11-11-retry-boundary-foundations.md) retains integration and CI limits.

The tests cover producer and receiver `os._exit(91)` before/after commit, acknowledgement interruption, exception/cancellation boundaries, parameter and canonical-encoding refusal, exact repeated receipts, distinct-intent keys, Unicode byte bounds, invalid acknowledgements, unchanged original data, real cross-process writer contention and a deterministic interleaving of two dispatchers reading the same event.

Independent adversarial review additionally ran eight concurrent dispatchers: one succeeded and seven returned `SQLITE_BUSY`; an explicit retry left one receiver effect. That is a safety observation, not an automatic liveness guarantee or throughput measurement. The test helper was changed from pipe selectors to an owned-file readiness signal to avoid assuming POSIX pipe-select support. Only Linux has actually run; no Windows acceptance is claimed.

## Deliberate limits

- **One logical receiver and identity namespace.** Independent producers using identical scope/key/payload collapse to one receiver effect. Retry against a different deduplication ledger can execute again. Receipt validation does not authenticate a receiver; routing and authenticated tenant binding remain external requirements.
- **No eventual-delivery promise.** `dispatch_one` makes one explicit attempt, not a scheduler. Lock errors propagate and pending state remains. The optional SQLite busy wait is bounded as a configuration value, not a hard wall-clock deadline.
- **No global ordering.** Oldest-pending selection in a single call is not a concurrent ordering protocol, lease or fairness guarantee. The generated effects do not depend on global ordering. Production poison-event handling and per-resource sequencing remain unimplemented.
- **No retention/expiry policy.** Rows are intentionally retained. The incomplete-copy control does not simulate elapsed-time expiry, delete an original receipt or establish an adequate retention horizon. Backlog bytes, ledger growth and quotas are not bounded by this reference.
- **No physical durability certification.** Rollback journal, `synchronous=FULL` and a child-process exit test are recorded. Disk-full, torn writes, power loss, OS crash, network filesystems and clock anomalies are not injected. No WAL-mode result is implied.
- **No real external transaction.** Two independent local databases model separate commit boundaries. There is no HTTP parsing, timeout, TLS, broker, authentication or remote-service test. Callbacks insert synthetic faults only; a nontransactional real-world effect cannot be made atomic by putting it in a callback.
- **No target recommendation.** The actual Athena queue, active release drafts, Foundry and other projects remain unchanged. No benchmark, platform ranking, production acceptance, merge or deployment follows from these tests.

`deduplicate=False` is a deliberately unsafe receiver-only comparison control, not a supported production mode. It exists to make a failed architectural assumption visible.
