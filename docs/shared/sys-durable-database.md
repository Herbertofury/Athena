# Keep a work record through failure and reopen

Use a real temporary SQLite database to test transactions, deduplication and a backup.

## Learning goals

- Verify a multi-step invariant across rollback and reopen.
- Use a unique request ID without claiming distributed exactly-once behavior.
- Open and query a backup instead of trusting that a file exists.

## Learn

Durable state must survive an ordinary process close and reopen, not merely remain in a Python variable. A database helps organize data and enforce constraints. The exact guarantee depends on its transaction mode, journal, storage and failure model. This experiment tests normal close/reopen and a deliberately rolled-back transaction; it does not simulate a sudden power failure.

A transaction groups changes under a commit decision. Suppose completing one repair job both inserts a job receipt and decreases a stock counter. The intended invariant is that either both changes happen or neither does. If one statement fails, explicitly roll back the transaction in the application’s error path. Different database errors and conflict modes can have different automatic effects, so do not assume every error rolls everything back.

Use a unique job identifier and parameterized statements. The identifier can help recognize a repeated local request. Before skipping a duplicate, compare the relevant payload: reusing the same identifier for a different job should be a conflict, not silently accepted as success. Keeping data separate from SQL syntax is a basic correctness and safety practice.

The lab creates stock=3 and processes job-001, reducing stock to 2 and recording one receipt. Repeating the same ID and payload returns already-applied without another decrement. Reusing that ID with different content is rejected. An injected failure after decrement but before commit rolls back, leaving stock=2 and only one receipt.

A backup requires an application-appropriate method and validation. The lab uses SQLite’s backup interface to a separate file within the same temporary directory, closes it, reopens it and checks the logical rows plus an integrity check. This is preferable to pretending that casually copying one live database file always captures a consistent state.

The backup’s location is deliberately not an independent failure domain; it disappears with the rest of the disposable lab. The test establishes a functioning local backup/reopen path for synthetic data, not resilience against disk loss, account takeover, ransomware or region failure. Real plans also need protected independent copies, access to recovery keys and dependency-aware restoration.

## Worked example

Expected final state after the original job, duplicate retry, conflicting retry and injected rollback is stock=2 with exactly one receipt for job-001. Reopening the primary database and its backup should show that same state. The result “integrity_check=ok” adds a structural check but does not prove that every business rule is correct. The lesson therefore checks the stock/receipt invariant separately and records the SQLite runtime version used.

## Practice safely

1. Predict stock and receipt count after every step.
2. Run python3 labs/systems-workshop/offline_lab.py database.
3. Compare original success, duplicate no-op, payload conflict and rollback behavior.
4. Check the reopened primary and backup independently.
5. Explain the difference between this local unique-ID receipt and a complete distributed exactly-once system.
6. Name two recovery failures not covered by a backup in the same temporary directory.

## Evidence to keep

- Actual transaction, duplicate and conflict receipts.
- Primary and backup results after reopen.
- Explicit limits on failure domains and power-loss guarantees.

## Original check 1

A stock decrement happens, then an error occurs before commit and the code rolls back. What should this lab observe?

- The pre-transaction stock and receipt state
- A permanent decrement without a receipt
- A duplicated receipt
- Automatic repair of every database

<details><summary>Answer and explanation</summary>

The pre-transaction stock and receipt state. The explicit rollback should preserve the tested transaction invariant.

</details>

## Original check 2

The same job ID arrives with a different payload. What should the lab do?

- Treat it as the same successful request without checking
- Apply it twice
- Delete all earlier receipts
- Report a conflict instead of silently accepting it

<details><summary>Answer and explanation</summary>

Report a conflict instead of silently accepting it. Deduplication must not hide a changed request under a reused identifier.

</details>

## Original check 3

A backup file was created. What stronger evidence does this lab collect?

- It is reopened and its data/integrity are checked
- Its filename looks right
- The computer stays on
- Its icon changed

<details><summary>Answer and explanation</summary>

It is reopened and its data/integrity are checked. A recoverable backup should be usable and contain the expected state, not merely exist.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

No production database, concurrency/load test, remote replication, physical disk failure or real disaster recovery is exercised.

## Official references

- [Python 3.12 sqlite3: transactions, connection and backup APIs](https://docs.python.org/3.12/library/sqlite3.html)

- [SQLite: transaction control and rollback](https://www.sqlite.org/lang_transaction.html)

- [SQLite: backup API and snapshot copying](https://www.sqlite.org/backup.html)

