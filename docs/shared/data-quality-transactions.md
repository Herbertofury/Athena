# Use constraints and rollback to protect the dataset

Reject a broken relationship and verify that a partial import does not remain.

## Learning goals

- Verify foreign-key enforcement on the actual connection.
- Observe a real in-memory transaction rollback.
- Separate structural consistency from truth and business validity.

## Learn

Data quality has several layers. A unique identifier can prevent duplicate keys; a foreign key can require a referenced queue to exist; a CHECK constraint can reject an invalid status or minute range. These are useful structural rules, but they do not prove that a report describes reality or that its measurement definition is appropriate.

SQLite foreign-key enforcement must be enabled and checked for the connection rather than assumed from a schema declaration. The lab sets PRAGMA foreign_keys=ON before loading and verifies the returned setting. It also uses STRICT tables, while the parser handles the tighter source-text rules. Each layer has an explicit purpose and an observable test.

The quality exercise starts a transaction and inserts a valid synthetic ticket T-900. It then attempts T-901 referencing nonexistent queue Q-Z. That foreign-key failure is expected. The handler explicitly rolls back the transaction, removing the earlier valid insert as well. The database returns to nine tickets, and T-900 is absent.

A failed statement and a rolled-back batch are not automatically the same event. Error handling must decide and verify the intended transaction outcome. The pack uses explicit BEGIN, COMMIT and ROLLBACK on its owned in-memory database so the boundary is visible. Do not infer behavior for another driver mode or database engine without checking its documentation.

The command also checks for foreign-key violations and runs an integrity check. An empty violation list and an “ok” result are useful local evidence, not proof of complete business quality. A plausible but wrongly recorded work value can satisfy every schema constraint. Missingness, coverage, reconciliation and stakeholder definitions still need review.

All mutations occur in a fresh private in-memory database created for this run. No existing database or external service is opened. The exercise is deliberately safe for practicing failure and recovery, but it is not a crash-durability or concurrent-writer test. Preserve the expected failure in your evidence rather than hiding it to make every step look successful.

## Worked example

Before: nine tickets. After a valid insert followed by an invalid queue reference and explicit rollback: nine tickets again, T-900 absent, no foreign-key violations and integrity_check=ok. The invalid batch being rejected is the successful outcome. It proves the bounded rollback behavior actually executed here, not that the source data is true.

```sql
BEGIN;
-- Insert a valid synthetic row using bound values.
-- Attempt another row referencing missing queue Q-Z: expected failure.
ROLLBACK;
-- The Python handler performs the rollback and verifies the original count.
```

## Practice safely

1. Predict whether T-900 should remain after the intended rollback.
2. Run python3 labs/data-workshop/run_lab.py quality.
3. Verify the before/after counts, missing batch row and enforcement flag.
4. Explain why an error in one statement is not sufficient evidence of full-batch rollback.
5. Give a plausible wrong value that could still pass the schema.
6. Label this as actual local transactional behavior, not production durability.

## Evidence to keep

- Actual rollback output and before/after reconciliation.
- Verified enforcement and integrity results.
- A distinction between structural and business quality.

## Original check 1

Why does the lab check PRAGMA foreign_keys?

- Enforcement must be enabled and verified for the connection
- A schema declaration alone is enough in every SQLite connection
- It counts NULL values
- It deploys a server

<details><summary>Answer and explanation</summary>

Enforcement must be enabled and verified for the connection. The lab verifies that the actual connection enforces the declared relationship.

</details>

## Original check 2

After the second insert fails and the whole batch is rolled back, should T-900 remain?

- Yes, because it was valid
- Only if sorted first
- It becomes a NULL row
- No, the transaction rollback removes the batch’s earlier insert too

<details><summary>Answer and explanation</summary>

No, the transaction rollback removes the batch’s earlier insert too. The intended atomic batch returns to the pre-transaction state.

</details>

## Original check 3

What does integrity_check=ok fail to prove?

- All business facts and measurement definitions are correct
- The check ran
- The local database passed that structural check
- A result was returned

<details><summary>Answer and explanation</summary>

All business facts and measurement definitions are correct. Structural database checks cannot establish the truth or suitability of business data.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

This is an owned in-memory transaction, not a live database migration, crash recovery, concurrency test or proof that business facts are correct.

## Official references

- [https://www.sqlite.org/foreignkeys.html](https://www.sqlite.org/foreignkeys.html)

- [SQLite: transaction control and rollback](https://www.sqlite.org/lang_transaction.html)

- [https://www.sqlite.org/stricttables.html](https://www.sqlite.org/stricttables.html)

