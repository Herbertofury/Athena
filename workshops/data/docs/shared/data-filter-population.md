# Filter a population and order it deliberately

Use explicit UTC boundaries and stable ordering to make a cohort reproducible.

**Study time:** about 45 minutes, with pauses for prediction and practice.

## You will learn to

- Express a half-open interval with bound values.
- Predict included boundary rows and excluded neighbors.
- Distinguish filtering from display ordering and row limiting.

## Learn

Filtering chooses which records belong in the analysis. The main query uses opened_at greater than or equal to the start and less than the end. This half-open interval includes the first instant and excludes the next period’s first instant, so adjacent periods can meet without counting their shared boundary twice.

The fixture deliberately tests both edges. T-001 opens exactly at November 1 midnight and is included. T-008 opens one second earlier and is excluded. T-007 opens exactly at November 3 midnight and is excluded from the main interval. Predicting these three rows is a small but powerful check of the intended population.

All stored timestamps are validated fixed-width UTC strings ending in Z. Under that narrow representation, lexical order matches chronological order. Do not extend that conclusion to mixed formats, offsets, unpadded dates or locale-dependent text. The parser rejects those forms; a real source would need a documented normalization and timezone policy.

ORDER BY controls how the selected rows are presented, not which rows satisfy the filter. The query orders by opened_at and ticket_id, making ties deterministic. Without an explicit order, do not build a report on whichever row order SQLite happens to return. LIMIT can restrict output, but it is not a random sample or a substitute for a population definition.

Read the statement in terms of the question: identify the table, select the opening interval, project the needed columns and order the result. The engine may execute it differently internally; the conceptual explanation is not a promise about a query plan. This exercise has tiny data and makes no performance benchmark claim.

Compare the seven selected identifiers with a hand-built list before calculating a rate. If counts disagree, investigate the boundary or source rule instead of adjusting the expected answer to match. A clear cohort extract is useful evidence for later aggregates and joins, because it lets another reader inspect exactly which tickets contributed.

## Worked example

The main ordered cohort is T-001, T-002, T-003, T-004, T-005, T-009, T-006. T-009 is before T-006 because its opening time is 11:00 versus 20:00 on November 2. The interval includes November 1 midnight and excludes November 3 midnight. Adjacent intervals therefore do not both include T-007.

```sql
SELECT ticket_id, opened_at, status, work_minutes
FROM tickets
WHERE opened_at >= :start AND opened_at < :end
ORDER BY opened_at, ticket_id;
```

These snippets illustrate the lesson; complete executable statements are in the fixed queries folder.

## Practice safely

1. Predict inclusion for T-001, T-007 and T-008.
2. Write the complete seven-ID cohort in the intended order.
3. Run python3 labs/data-workshop/run_lab.py filters.
4. Explain why the fixed UTC representation permits text comparison here.
5. Contrast ORDER BY, WHERE and LIMIT in ordinary language.
6. Record the exact interval and parameters with the output.

Use the [offline lab guide](../../labs/data-workshop/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

Which interval includes the start but excludes the end?

A. opened_at > start AND opened_at <= end
B. opened_at = end only
C. opened_at >= start AND opened_at < end
D. Any LIMIT clause

<details><summary>Answer and reasoning</summary>

C. opened_at >= start AND opened_at < end. The half-open interval prevents overlap at a shared adjacent-period boundary.

</details>

### Check 2

Does T-007 at exactly 2026-11-03T00:00:00Z belong in the main cohort?

A. Yes
B. Only if sorted first
C. Its status decides the timestamp boundary
D. No, it is exactly the excluded end

<details><summary>Answer and reasoning</summary>

D. No, it is exactly the excluded end. The main interval ends immediately before that timestamp.

</details>

### Check 3

Why specify ticket_id after opened_at in ORDER BY?

A. To make ties deterministic
B. To change the filter population
C. To prove random sampling
D. To remove NULL values

<details><summary>Answer and reasoning</summary>

A. To make ties deterministic. A stable tie-breaker makes repeated presentation and tests reproducible.

</details>

## Evidence to keep

- A predicted and executed boundary-sensitive cohort.
- Explicit UTC parameters and ordering.
- An explanation of representation limits.

## Limits

Only canonical UTC timestamps are supported. No local-time conversion, daylight-saving analysis, random sampling or performance optimization is demonstrated.

## Official references

- https://www.sqlite.org/lang_select.html
- https://www.sqlite.org/lang_datefunc.html
