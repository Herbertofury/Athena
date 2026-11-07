# Build a complete time series with an explicit window

Use a calendar to preserve zero-event days and a window function for a running total.

**Study time:** about 45 minutes, with pauses for prediction and practice.

## You will learn to

- Distinguish an absent date from a verified zero count.
- Keep daily and main-cohort windows clearly labelled.
- Use a deterministic cumulative window over grouped daily data.

## Learn

A time series can hide days with no records. Grouping only ticket rows produces dates that exist in the data; it does not prove anything about dates that are absent. A calendar provides the expected reporting dates. A left join can then preserve each date and count its matching tickets, including zero when the source coverage is known.

The dates exercise intentionally uses a wider interval than the main metrics: November 1 through November 4 UTC, ending exclusively at November 5 midnight. Its calendar contains exactly those four days. The main cohort still ends at November 3 midnight. A total can differ legitimately when the population changes, so print the interval beside the output.

Daily opening counts are 3, 4, 1 and 0. The November 3 ticket is included in this wider series but excluded from the main cohort. November 4 remains present because it is in the calendar even though no ticket opens that day. In real data, a zero is credible only if ingestion coverage is known; an outage in collection is not automatically zero activity.

The query first produces one row per day, then applies a running SUM ordered by day with an explicit ROWS frame from the beginning through the current row. The cumulative counts are 3, 7, 8 and 8. The window calculation retains daily rows, unlike a final aggregate that would collapse the entire series to one total.

This pack uses validated UTC timestamps and UTC-midnight boundaries. It does not convert a local business day, handle daylight-saving changes or align regional calendars. Those are requirements to define before analyzing a real organization’s daily activity. The fixed calendar rejects intervals outside its coverage rather than quietly returning an incomplete series.

Check the first day, final exclusive boundary, zero day and final cumulative total. Compare the series total with a direct count using the same wider interval, not with the narrower seven-ticket metric. A correct reconciliation uses the same population and unit on both sides. Labeling those choices makes a small chart or table easier to interpret without inventing a trend from four synthetic days.

## Worked example

The wider dates output has November 1: 3, November 2: 4, November 3: 1, November 4: 0; running totals 3, 7, 8, 8. The eight-ticket series is consistent with the seven-ticket main cohort because T-007 is added by the wider window. Neither output is a real demand forecast.

```sql
SELECT day, opened_tickets,
       SUM(opened_tickets) OVER (
         ORDER BY day ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_opened_tickets
FROM daily
ORDER BY day;
-- daily is the calendar-based common table expression in dates.sql.
```

These snippets illustrate the lesson; complete executable statements are in the fixed queries folder.

## Practice safely

1. Predict all four daily counts and cumulative totals.
2. Run python3 labs/data-workshop/run_lab.py dates.
3. Explain why its total is eight while the main cohort has seven.
4. Distinguish no rows, unknown source coverage and a verified zero day.
5. Inspect the explicit window frame and ordering.
6. Record UTC and calendar coverage as limits, not hidden assumptions.

Use the [offline lab guide](../../labs/data-workshop/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

Why does November 4 appear with zero tickets?

A. The query invents a ticket
B. NULL always means zero activity
C. The main cohort includes every future day
D. The calendar preserves the date and no ticket matches it

<details><summary>Answer and reasoning</summary>

D. The calendar preserves the date and no ticket matches it. The known calendar date survives the left join; zero is meaningful under the fixture’s complete synthetic coverage.

</details>

### Check 2

Why does the dates command total eight rather than seven?

A. It uses a wider interval that includes T-007
B. A join bug necessarily occurred
C. The average was rounded
D. The snapshot changed during execution

<details><summary>Answer and reasoning</summary>

A. It uses a wider interval that includes T-007. The daily exercise ends at November 5, while the main cohort ends at November 3.

</details>

### Check 3

What does the running window SUM preserve?

A. Only one final row
B. One output row per day with a cumulative value
C. A random row order
D. A causal forecast

<details><summary>Answer and reasoning</summary>

B. One output row per day with a cumulative value. A window function calculates across related rows while retaining the daily result rows.

</details>

## Evidence to keep

- A calendar-based series and cumulative reconciliation.
- Clearly labelled differing windows.
- A source-coverage and timezone caveat.

## Limits

Only the four-day synthetic UTC calendar is supported. No local-time, daylight-saving, forecasting or real ingestion-completeness assessment is performed.

## Official references

- https://www.sqlite.org/lang_datefunc.html
- https://www.sqlite.org/lang_select.html
