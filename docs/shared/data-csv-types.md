# Load CSV with explicit types and missing-value rules

Validate bounded text before inserting it into an in-memory database.

## Learning goals

- Treat CSV fields as text until explicitly converted.
- Distinguish missing work minutes from recorded zero.
- Explain what parser checks and database constraints each enforce.

## Learn

CSV is a transport format, not a schema. A field that looks numeric still arrives as text under the normal CSV reader. Quoting can place a comma inside a single field, so splitting each line on commas would break the summary “Screen, hinge.” Use a CSV parser and verify the exact header and number of columns before interpreting values.

The ticket contract maps an empty work_minutes field to Python None and then SQL NULL. A field containing 0 becomes the integer zero. Empty does not mean no work occurred; it means the value is missing in this dataset. The literal text NULL is rejected rather than quietly treated as missing. These are explicit ingestion choices, not universal CSV rules.

The loader accepts only bounded fixtures, exact headers, unique primary identifiers, fixed-width valid UTC timestamps, allowed status values and minute values from zero through 1440. It rejects an invalid row instead of silently dropping it. A discarded row would change counts and rates, so any future quarantine policy would need a visible rejection report and reconciliation.

Database constraints add another line of checking. STRICT tables enforce SQLite’s stricter storage types; primary keys, foreign keys and CHECK constraints express additional rules. STRICT does not mean every input string is rejected: SQLite can perform permitted lossless conversions. The Python parser separately enforces the text grammar and validates actual calendar dates.

Keep data values separate from SQL syntax by using bound parameters for inserts and filters. A quote in a label should remain data, not change a statement. Parameter binding does not validate business meaning or safely choose arbitrary table names; it addresses how values enter a statement. The pack uses fixed table and query names, with no external database target.

Every run builds a new in-memory SQLite database from the synthetic CSV files. It does not open an existing database or user spreadsheet. Work in a private pack copy when experimenting, preserve the original fixture and record any changed assumptions. A successful import demonstrates these local contracts only, not a general-purpose pipeline for unknown files or confidential records.

## Worked example

T-003 has recorded work_minutes=0; T-002 and T-005 are open with missing work values; T-009 is closed with missing work. Closing a ticket does not make its missing measurement zero. The quoted comma stays inside T-001’s summary. The loader’s accepted rows and the database’s keys must agree before aggregation begins.

```sql
INSERT INTO tickets
  (ticket_id, queue_id, opened_at, status, work_minutes, summary)
VALUES (?, ?, ?, ?, ?, ?);
-- Python supplies a separate tuple; None becomes SQL NULL.
```

## Practice safely

1. Inspect the exact tickets.csv header and quoted summary.
2. Find one recorded zero and one missing work value.
3. Read the data dictionary and predict which invalid fields are rejected.
4. Run the profile command and the local validation tests.
5. In a study copy, test an invalid minute value and explain the error without deleting the row silently.
6. Explain what parameter binding, parser validation and constraints each contribute.

## Evidence to keep

- A type/missingness map for the CSV columns.
- Executed parser/database checks.
- A rejected invalid example with its reason.

## Original check 1

How is an empty work_minutes field interpreted by this pack?

- As zero
- As the text NULL
- As proof no work occurred
- As a missing value, stored as SQL NULL

<details><summary>Answer and explanation</summary>

As a missing value, stored as SQL NULL. The ingestion contract distinguishes absence from a recorded numeric zero.

</details>

## Original check 2

Why use a CSV parser instead of splitting on commas?

- It correctly handles quoted commas inside a field
- It invents missing data
- It removes all schema validation needs
- It makes every value numeric

<details><summary>Answer and explanation</summary>

It correctly handles quoted commas inside a field. The supplied summary contains a quoted comma that belongs inside one field.

</details>

## Original check 3

What do bound SQL parameters do?

- Make the business question automatically correct
- Keep supplied values separate from SQL statement syntax
- Choose any table name safely
- Replace foreign-key checks

<details><summary>Answer and explanation</summary>

Keep supplied values separate from SQL statement syntax. Parameter binding controls value insertion; it does not define semantics or replace schema rules.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

The loader handles this small fixed schema only. It is not a public upload service, arbitrary-file sandbox or production ETL system.

## Official references

- [https://docs.python.org/3.12/library/csv.html](https://docs.python.org/3.12/library/csv.html)

- [Python 3.12 sqlite3: transactions, connection and backup APIs](https://docs.python.org/3.12/library/sqlite3.html)

- [https://www.sqlite.org/stricttables.html](https://www.sqlite.org/stricttables.html)

