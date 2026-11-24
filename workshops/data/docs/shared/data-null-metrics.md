# Calculate counts and averages without erasing missingness

Use denominator-aware SQL to distinguish rows, observations and absence.

**Study time:** about 45 minutes, with pauses for prediction and practice.

## You will learn to

- Explain COUNT(*), COUNT(column), SUM and AVG on this dataset.
- Show why NULL and zero produce different evidence.
- Use a safe denominator and label a cohort rate accurately.

## Learn

An aggregate compresses records, so its definition must preserve what matters. COUNT(*) counts rows. COUNT(work_minutes) counts non-NULL measurements. Those answers differ in this cohort: seven tickets but only four observed work values. Reporting the average without its observation count would hide a major limitation of the data.

The observed values are 30, 0, 45 and 30 minutes. Their sum is 105 and their average is 26.25. The zero participates because it is a recorded value; the three NULLs do not. Replacing each NULL with zero would change the question and produce 15 minutes per ticket across all seven, an assumption the source does not justify.

Conditional aggregation counts records matching a definition. The query counts five closed snapshot statuses and divides by seven cohort tickets. Multiplying by 1.0 ensures a real-valued ratio rather than an unintended integer-style result. NULLIF protects an empty denominator; an undefined rate should remain absent rather than be presented as a meaningful zero.

The empty case is part of the contract. With no matching tickets, row and category counts are zero, while the work sum, observed mean and closed share remain NULL. A group with tickets but no observed work is also different from a group with a recorded total of zero. Keep those distinctions visible in a report or exported data dictionary.

An average alone does not describe a distribution, explain causation or measure resolution time. This dataset records a snapshot work measure, not a full time history. Differences between queues could reflect missing data, case mix or reporting practice. The tiny fictional sample cannot establish that one real team performs better than another.

Run the metrics command and reconcile each value to the four observed measurements and seven ticket rows. Then run the groups command to see Repair, Access, Setup and the empty Training queue. Compare each group’s ticket count, observed-value count and missingness before forming a conclusion. Evidence quality belongs beside the metric, not in a footnote that changes its meaning.

## Worked example

Main result: 7 tickets, 5 closed, 4 observed work values, 3 missing, 1 recorded zero, total observed work 105 and mean 26.25. Closed share is 5/7. Access has three tickets but only one observed work value, zero; Training has no cohort tickets and an undefined mean/rate. Those are not equivalent situations.

```sql
SELECT COUNT(*) AS tickets, COUNT(work_minutes) AS observed,
       SUM(work_minutes) AS observed_total, AVG(work_minutes) AS observed_mean
FROM tickets
WHERE opened_at >= :start AND opened_at < :end;
```

These snippets illustrate the lesson; complete executable statements are in the fixed queries folder.

## Practice safely

1. Hand-calculate the four observed values, total and mean.
2. Run python3 labs/data-workshop/run_lab.py metrics.
3. Explain why replacing missing work with zero changes the question.
4. Run python3 labs/data-workshop/run_lab.py groups and compare counts with observation counts.
5. State the expected empty-cohort rate and mean.
6. Write one accurate sentence with a metric and its missing-data caveat.

Use the [offline lab guide](../../labs/data-workshop/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

Why is COUNT(work_minutes) four while COUNT(*) is seven?

A. SQLite lost three rows
B. Three work values are NULL
C. Zero is excluded from COUNT(column)
D. Every closed ticket is excluded

<details><summary>Answer and reasoning</summary>

B. Three work values are NULL. COUNT(column) counts non-NULL values, including a recorded zero.

</details>

### Check 2

What is the mean of the observed work values?

A. 15
B. 105
C. 26.25
D. 0

<details><summary>Answer and reasoning</summary>

C. 26.25. The observed values sum to 105 across four measurements, giving 26.25.

</details>

### Check 3

What should an empty cohort’s closed share represent?

A. A guaranteed zero-percent service outcome
B. One hundred percent
C. The previous cohort’s result
D. An undefined rate, represented as NULL

<details><summary>Answer and reasoning</summary>

D. An undefined rate, represented as NULL. There is no denominator, so a meaningful rate cannot be computed for that population.

</details>

## Evidence to keep

- Hand reconciliation of counts and observed metrics.
- Empty and missingness interpretations.
- A caveated summary sentence.

## Limits

No imputation, causal inference, statistical significance or real performance judgment is supported. Work minutes are not resolution duration.

## Official references

- https://www.sqlite.org/lang_aggfunc.html
- https://www.sqlite.org/nulls.html
