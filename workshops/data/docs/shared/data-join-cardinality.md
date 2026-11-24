# Prevent join fan-out from changing the metric

Expose a wrong total, reject a tempting DISTINCT patch and fix the grain.

**Study time:** about 45 minutes, with pauses for prediction and practice.

## You will learn to

- Predict one-to-many row multiplication.
- Explain why distinct numeric values are not distinct business records.
- Preaggregate detail rows before joining to a ticket-grain measure.

## Learn

A join combines matching records. When a ticket has several touches, joining its row to each touch repeats its ticket-level fields. This can be useful for an interaction-level question, but summing a repeated ticket measure answers a different question. Before joining, state the expected relationship and the grain of the resulting rows.

The naive left join expands seven cohort tickets to ten joined rows. T-001 appears twice and T-004 appears three times because of their interactions. Summing ticket work_minutes across those rows produces 225, not the correct 105. The SQL is valid; the metric is wrong because the grain changed.

COUNT(DISTINCT ticket_id) can recover the number of distinct tickets for that specific count, but it does not repair every repeated measure. SUM(DISTINCT work_minutes) is an especially tempting mistake. T-001 and T-006 legitimately both have 30 minutes. Distinct values collapses them into one 30, producing 75 and undercounting real observations.

The corrected query first groups touches to one row per ticket, with a touch count and touch-minute sum. Joining that result to tickets preserves the ticket grain. The report then has seven ticket rows, 105 observed ticket work minutes, seven touch rows and 55 touch minutes for the cohort. These are separate measures, not two totals that are required to equal each other.

Left joins preserve unmatched left records, but later filters can undo that intention. In the queue summary, the date condition is inside the join’s ON clause so Training remains present with zero matched tickets. COUNT(t.ticket_id) counts matches; COUNT(*) would count the placeholder row and misleadingly report one for an empty queue.

Treat cardinality as something to test, not a relationship icon to trust. Compare before/after row counts, distinct identifiers and known measure totals. Include repeated equal numeric values in a test so a DISTINCT shortcut cannot appear correct by accident. If a new source changes the relationship, revisit the metric definition before shipping a familiar-looking chart.

## Worked example

Naive: 10 rows and repeated work total 225. SUM(DISTINCT work_minutes): 75. Correct preaggregation: 7 ticket rows and 105 work minutes. Touches separately total 7 rows and 55 minutes. The fixture deliberately contains two real 30-minute ticket measurements, which exposes the incorrect distinct-value repair.

```sql
WITH per_ticket AS (
  SELECT ticket_id, COUNT(*) AS touches, SUM(minutes) AS touch_minutes
  FROM touches GROUP BY ticket_id
)
SELECT COUNT(*) AS ticket_rows, SUM(t.work_minutes) AS work_minutes
FROM tickets AS t LEFT JOIN per_ticket AS p ON p.ticket_id = t.ticket_id
WHERE t.opened_at >= :start AND t.opened_at < :end;
```

These snippets illustrate the lesson; complete executable statements are in the fixed queries folder.

## Practice safely

1. Predict how many rows T-001 and T-004 produce after the naive join.
2. Run python3 labs/data-workshop/run_lab.py joins.
3. Reconcile the 225, 75 and 105 totals by hand.
4. Explain why two legitimate 30-minute values must both remain.
5. Inspect groups.sql and explain why the date filter is in ON and the count uses ticket_id.
6. Keep a regression that detects both fan-out and the DISTINCT-value shortcut.

Use the [offline lab guide](../../labs/data-workshop/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

Why does the naive join inflate ticket work?

A. Multiple touches repeat the ticket-level measure
B. NULL always doubles data
C. The CSV reader changes 30 to 60
D. All joins are invalid

<details><summary>Answer and reasoning</summary>

A. Multiple touches repeat the ticket-level measure. The one-to-many relationship changes the result grain before aggregation.

</details>

### Check 2

Why is SUM(DISTINCT work_minutes) wrong here?

A. It retains every ticket identity
B. It removes one of two legitimate equal 30-minute measurements
C. It always gives 105
D. It only removes missing values

<details><summary>Answer and reasoning</summary>

B. It removes one of two legitimate equal 30-minute measurements. Distinct values are not distinct business records; equal measurements can belong to different tickets.

</details>

### Check 3

How does the corrected query preserve ticket grain?

A. By dropping tickets with no touches
B. By removing all keys
C. By grouping touches to one row per ticket before joining
D. By sorting the inflated total

<details><summary>Answer and reasoning</summary>

C. By grouping touches to one row per ticket before joining. Preaggregation makes the detail-side relationship at most one matching row per ticket.

</details>

## Evidence to keep

- A fan-out row-count prediction.
- Three explained totals and corrected query output.
- An empty-queue and repeated-value regression.

## Limits

The fixture demonstrates specific join/grain failures. It is not a complete dimensional model, relationship-direction tutorial or Power BI filter-context implementation.

## Official references

- https://www.sqlite.org/lang_select.html
- https://www.sqlite.org/lang_aggfunc.html
- https://learn.microsoft.com/en-us/power-bi/guidance/star-schema
