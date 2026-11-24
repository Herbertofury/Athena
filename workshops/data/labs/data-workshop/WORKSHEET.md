# Data & SQL evidence worksheet

Study label: __________ Date: __________ Python / SQLite / OS: __________

For every item mark **predicted**, **executed locally**, or **unexecuted**. Use synthetic data only. Distinguish running a supplied query from writing and explaining your own.

## 1. Question, population and grain

Write the question with snapshot, opening interval, numerator, denominator and unit. State what one row means in queues, tickets and touches. Why do equal total table counts not establish a one-to-one relationship? What prevents you from calculating resolution time or closures during the reporting period?

## 2. Types and ingestion

Identify the quoted comma, a recorded zero, an open ticket with missing work and a closed ticket with missing work. Explain how CSV text becomes typed values. Predict results for missing/extra header columns, duplicate keys, work value NULL, work value -1 and an invalid calendar date. Which validation occurs before database loading, and which occurs during it?

## 3. Cohort boundary

Predict T-001, T-007 and T-008 inclusion. Write all seven main IDs in order. Explain the exclusive end and fixed UTC representation. Preserve actual filter output or label the list as a paper prediction.

## 4. Aggregation

Calculate row count, observed count, missing count, zero count, observed sum, mean and closed share. Then calculate the different mean obtained by imputing missing work as zero. Why is that an unsupported change to the question? Compare Access’s recorded zero with Training’s absent aggregates.

## 5. Relationship check

Count how many joined rows T-001 and T-004 generate. Reconcile totals 225, 75 and 105. Explain why distinct values are not distinct tickets. Show how preaggregating touches restores ticket grain. Why should touch minutes and ticket work not automatically be forced equal?

## 6. Time series

Predict daily and running counts for November 1–4. Explain the wider interval, T-007’s inclusion and the zero day. Name a source-collection failure that could make an apparent zero misleading in real data. State why local timezone and daylight-saving work remain outside scope.

## 7. Quality evidence

Record foreign-key setting, before/after ticket counts, T-900 absence, violation list and integrity result. Explain why the expected invalid insert is evidence of a working check. Distinguish a statement error, explicit batch rollback and a crash-durability test.

## 8. Reproducible handoff

Run the export and record four rows, text round-trip result and temporary cleanup. Describe the NULL-to-empty convention. Write one accurate paragraph about the cohort with observed-value count and missingness. Avoid real-world performance claims from this synthetic sample.

## Capstone

Create a study-copy extension such as a per-queue missing-work rate. Before writing SQL, specify its numerator, denominator, empty-group result, source grain, interval and order. Add one test that exposes a plausible mistake: equal-valued measures, a boundary timestamp, an empty queue or a NULL observation.

Deliver your query plus a short report containing:

1. Question, synthetic provenance, snapshot and population.
2. Grain/relationship sketch and type rules.
3. Query file, exact command, runtime versions and actual output.
4. Row-count and measure reconciliation.
5. Missingness, empty-result and join-cardinality checks.
6. A supported finding, an unresolved question and no unsupported causal claim.
7. What you wrote yourself, what supplied code you ran and what remains unexecuted.
8. Explicit statement that Power BI, Power Query, DAX, refresh, publishing and security workflows were not executed and this is not full PL-300 coverage.

A passing supplied suite is finite implementation evidence, not a learner grade or certification assessment.
