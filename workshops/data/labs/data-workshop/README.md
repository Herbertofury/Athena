# Safe local SQLite and CSV lab guide

## Start safely

Use a private study copy. All records, summaries, dates and queues are invented. Every command creates a fresh `:memory:` SQLite database, loads only the three bundled fixtures and closes its connection. There is no cloud database, email, account, credential or user-data source. No command takes a database path, URL or arbitrary SQL string.

Python and edited SQL run with normal local permissions, not in a security sandbox. Review your own edits and never paste untrusted SQL or Python. Do not change the connection target, add ATTACH statements, load extensions or point the exercises at existing databases. Schema and transaction changes affect only the new in-memory database. The export command owns its temporary directory and never replaces a personal file.

Use Python 3.10+ and SQLite 3.37+ with no third-party dependencies. Tested: Python 3.12.14, SQLite 3.53.1, Linux. If your runtime differs, check its version and treat it as unverified. Commands below start in the extracted pack directory. Substitute your platform’s Python 3 launcher if necessary.

## The analysis contract

The main population is tickets opened at or after **2026-11-01T00:00:00Z** and before **2026-11-03T00:00:00Z**. Status and work measurements are from an invented frozen snapshot labelled **2026-11-05T00:00:00Z**. A closed share means closed snapshot statuses within that opening cohort, not closures during the period.

The dates command alone uses the wider interval November 1 through November 4 UTC, ending exclusively at November 5. It prints its window explicitly. Read the [data dictionary and contracts](CONTRACTS.md) before interpreting counts or rates.

## 1. Profile and grain

```sh
python3 labs/data-workshop/run_lab.py profile
```

Expect 4 queues, 9 tickets and 9 touches. Tickets are one row per current-state ticket; touches are one row per interaction. Equal total counts do not imply a one-to-one relationship. Paper task: annotate each CSV’s identifier and grain, then find a ticket with multiple touches and one with none.

## 2. Boundary-sensitive filters

```sh
python3 labs/data-workshop/run_lab.py filters
```

Expect seven IDs in order: T-001, T-002, T-003, T-004, T-005, T-009, T-006. T-001 is exactly at the included start. T-007 is exactly at the excluded end. T-008 is one second before the start. The query uses bound timestamps, not concatenated SQL.

Paper task: predict both boundaries and the tie-breaking order. Study-copy variation: add an original test for a different valid interval using `lab.query`; do not overwrite baseline expected results just to match a change.

## 3. NULL-aware metrics

```sh
python3 labs/data-workshop/run_lab.py metrics
```

Expect 7 tickets, 5 closed statuses, 4 observed work values, 3 missing values and 1 recorded zero. The observed measurements are 30, 0, 45, 30: sum 105 and mean 26.25. Closed share is 5/7, about 71.4%.

Missing work is not zero. The fixture includes a closed ticket with missing work, so status cannot fill the measurement. Paper task: calculate the different 15-minute result obtained by incorrectly treating all missing values as zero, then explain why it answers a different question. Empty-cohort counts are zero; sum, mean and share remain SQL NULL.

## 4. Grouped summaries and empty categories

```sh
python3 labs/data-workshop/run_lab.py groups
```

Order is Access, Repair, Setup, Training. Access: 3 tickets, 2 closed, 1 observed work value, sum 0, mean 0. Repair: 3 tickets, 2 closed, 2 observed values, sum 60, mean 30. Setup: 1 ticket, 1 closed, 1 observed value, sum 45, mean 45. Training: 0 tickets, 0 closed, 0 observations; work sum, mean and closed share are NULL.

The date predicate is inside the LEFT JOIN’s ON clause. `COUNT(t.ticket_id)` counts matching tickets; `COUNT(*)` would count the unmatched placeholder row. Paper task: explain why an empty queue differs from a queue whose only observed value is zero.

## 5. Join fan-out and the wrong DISTINCT repair

```sh
python3 labs/data-workshop/run_lab.py joins
```

The deliberately naive join produces 10 rows and a repeated ticket-work total of 225. Distinct ticket count is 7, but `SUM(DISTINCT work_minutes)` is 75 because it collapses two legitimate equal 30-minute observations. The corrected query preaggregates touches per ticket: 7 ticket rows, work total 105, 7 touches and 55 touch minutes.

Ticket work and touch minutes are separate measurements; they are not required to reconcile to each other. Paper task: explain all three work totals, then show why fixing only the distinct ticket count cannot fix a sum.

## 6. Calendar and cumulative series

```sh
python3 labs/data-workshop/run_lab.py dates
```

This command uses the wider four-day interval. Daily opening counts are 3, 4, 1, 0; running counts are 3, 7, 8, 8. The calendar preserves November 4’s zero. T-007 adds the eighth ticket because November 3 is inside this interval.

The query uses a grouped daily common table expression, then an explicit running window frame. Its finite calendar covers November 1–4 only and requires midnight UTC boundaries. Intervals outside that coverage are rejected. Paper task: reconcile with a direct count using the same wider interval, not the seven-ticket main cohort.

## 7. Constraints and atomic batch failure

```sh
python3 labs/data-workshop/run_lab.py quality
```

The command verifies foreign-key enforcement, starts a transaction, inserts valid T-900, then attempts T-901 with nonexistent queue Q-Z. The expected foreign-key error triggers an explicit whole-batch rollback. Expect 9 rows before and after, T-900 absent, no foreign-key violations and integrity_check=`ok`.

This is an actual in-memory transaction, not a simulation, production migration or crash-durability test. Paper task: distinguish a failed statement from a verified rollback of the whole batch. Identify a plausible incorrect measurement that could still satisfy all schema constraints.

## 8. Actual local CSV export

```sh
python3 labs/data-workshop/run_lab.py export
```

A queue summary is written to and read from an owned temporary CSV. Expect 4 rows, matching text representation and temporary-directory cleanup. Training’s ticket count is the string `"0"`; its absent aggregates are empty fields. The export contract uses empty aggregate fields for SQL NULL. CSV does not preserve original SQL types automatically.

The temporary file is intentionally removed after verification; the command does not create a persistent user report. Paper task: specify how a recipient would distinguish zero, NULL and text without an attached dictionary.

## Practice without changing scope

Read the complete SQL in `queries/`. Each lesson’s snippet explains a part; the files are the executable statements. Make study-copy changes only, preserving `:memory:` and the fixed paths. Good extensions include a new status-specific count, a missingness rate with an explicit denominator or a regression for an equal-valued repeated measure. Add acceptance criteria before coding.

```sh
python3 -m unittest discover -s tests -v
```

The suite checks the distributed fixtures, real SQLite behavior, boundaries, rejected input, constraints, rollback, joins and export. It is not a learner grade or PL-300 readiness test. A deliberate fixture change can invalidate a baseline expectation; record the changed assumption rather than weakening tests to conceal a discrepancy.

Use the [worksheet](WORKSHEET.md) and [answer key](ANSWER-KEY.md). Keep Power BI-specific implementation and real-data analysis explicitly unexecuted.
