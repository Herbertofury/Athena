# Databases, transactions and durable data

Model data and protect correctness under failure.

## Learn

A relational database organizes data into tables with keys and constraints. Transactions group operations with defined atomicity and isolation properties. The exact guarantees depend on the database and configuration.

Indexes improve selected reads while adding write and storage cost. Parameterized queries separate data from query syntax. Never build SQL by concatenating untrusted input.

Durability is not established by a successful in-memory test. Exercise restart, backup and restore, migration and failure paths. Preserve last-good data and verify the result before replacing it.

## Worked example

Transferring a balance between two accounts requires both updates to succeed together. Independent updates can leave money duplicated or missing if the second step fails.

## Practice safely

1. Create a disposable SQLite database with two related tables.
2. Add a foreign key and a unique constraint.
3. Run a transaction that deliberately rolls back.
4. Verify data after closing and reopening the database.

## Check your understanding

Why use parameterized SQL?

- It guarantees every query is fast
- It removes the need for permissions
- It automatically creates backups
- It keeps input data separate from SQL syntax

<details><summary>Answer and explanation</summary>

It keeps input data separate from SQL syntax. Parameters reduce injection risk by avoiding unsafe construction of query syntax from input.

</details>

## Further study

- https://www.sqlite.org/lang_transaction.html
- https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

