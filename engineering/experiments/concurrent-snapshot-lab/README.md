# Concurrent complete-snapshot regression

October 29, 2026. This extends the actual SnapshotStore integration tests without changing the storage implementation, timeouts, dependency pins or working databases.

Four separately opened connections start together and each commit sixteen distinct, explicitly generated project records. Every record contains whitespace, Unicode, null, an empty array and an unknown integer larger than the IEEE-754 exact range. Each writer then records a failed refresh. The same check runs on new DELETE-journal and WAL databases; opening the application store must preserve the chosen journal mode.

After every connection closes, the test reopens the database and checks all 64 generations against the exact original bytes and returned generation IDs, not merely a final projected object or a deduplicated set. Every snapshot must have exactly one successful collection attempt. The four failure attempts must reference no generation, the latest record must remain the last successful generation, and integrity/foreign-key checks must pass. Per-writer generation order is checked without requiring a particular cross-writer schedule.

[Twenty fresh-process runs](repetitions.json) passed, checking 2,560 complete committed payloads across both journal modes plus 160 retained failure attempts. The receipt preserves per-run output, binary/source hashes and elapsed time. Those elapsed times are diagnostic observations, not a performance comparison. The initial focused run and full Rust suite also passed. No production defect was found by this regression.

The fixtures are generated, not real provider requests. The standard integration-test fixture files are temporary; raw logs and receipts are retained. This is same-host thread contention, close/reopen and failure-retention evidence. It is not abrupt-process recovery, physical power-loss proof, a cross-host load test, browser persistence acceptance or a reason to migrate another project. Prior process-interruption evidence remains in the [separate storage experiment](../content-addressed-snapshot-lab/README.md).

Reproduce with `cargo +1.99.1 test --locked --manifest-path apps/atlas-lab/Cargo.toml --test persistence concurrent_snapshot_writers_preserve_complete_history_and_attempt_pairing`. The repository CI runs this integration test on Linux and Windows; individual publication checks must be verified for the exact commit before claiming those platform results.
