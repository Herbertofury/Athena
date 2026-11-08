# Define time periods before comparing results

Use a complete calendar, explicit date roles and clear aggregation rules for reliable comparisons.

**Study time:** about 45 minutes, including prediction, execution and reflection.

## Learning goals

- Validate a calendar separately from dates present in transactions.
- Distinguish order-date and ship-date questions.
- Explain partial-period comparisons and semi-additive stock measures.

## Learn

A transaction table answers when recorded events occurred. It does not necessarily contain every date that a report should display or compare. A calendar supplies the missing structure: years, months and an uninterrupted set of dates across the chosen span. Our synthetic calendar covers the complete year 2026, including dates with no orders. A missing event is not evidence that the date itself should disappear from the analytical model.

Validate dates as data rather than as attractive labels. Check uniqueness, absence of blanks, continuity and complete years for the classic-style example. Current Microsoft guidance distinguishes classic and calendar-based time intelligence, so do not universalize a date-table marking rule across every feature. No date table is actually configured in Power BI here; our local calendar establishes a teaching invariant and leaves vendor configuration pending.

Compare like periods using a stated cutoff. January against January is different from January through the fifteenth against a complete prior January. If data arrives late, the report end date and the source completeness date can differ. Write both when necessary. A YearMonth key avoids grouping January from several years into one unlabeled bucket, and a business timezone should be chosen before timestamps are converted to reporting dates.

An order can have several dates with legitimate meanings. Order date measures demand timing; ship date measures fulfillment timing. A date selection cannot answer both questions accidentally. Draw distinct roles and identify the intended path for each calculation. This optional paper extension draws conceptual paths only. The fixture has no ship-date field and the CLI computes no role-playing date result; no active/inactive relationship or USERELATIONSHIP behavior is tested.

Some values should not be summed across time. Daily revenue can normally be added across the selected dates in this fixture, but end-of-day stock is a snapshot. Adding two consecutive stock balances counts the same inventory repeatedly. In this optional paper extension, a closing-balance rule needs a chosen date and a policy for missing observations. The CLI has no stock fixture or closing-stock calculation. Last known balance and balance exactly on the selected date are different questions, and neither should be silently substituted for the other.

Keep the evidence compact but decisive: calendar count, minimum and maximum dates, duplicate and gap checks and period definitions. Any date-role diagram or hypothetical totals are optional paper evidence, not this command’s output. A hand calculation is an expected answer until an actual local run is captured. A passing local check demonstrates this synthetic calendar and arithmetic, not execution of DAX time-intelligence functions or successful model configuration.

## Worked example

The dates receipt validates 365 dates in 2026, detects a deleted January 2, and rejects a contiguous 59-day January/February list as incomplete for its full-year contract. January is 6000 cents; February is 10000; growth is 4000/6000, or two thirds. YTD totals are 6000 at January 2, 14000 at February 1 and 16000 at February 2. Date-role and stock discussions are paper-only extensions, not command outputs.

```text
# Power BI, M and DAX remain unexecuted.
# Local Python teaching model only; vendor code below is illustrative and unexecuted.
python3 labs/bi-workshop/run_lab.py dates
// Illustrative DAX reading only; unexecuted.
// Revenue = SUM(Sales[RevenueCents])
// A prior-period calculation needs a deliberate date table and date role.
// Do not replace time-intelligence validation with a Python date loop.
```

Only fixed Python wrapper commands are runnable instructions. Commented M/DAX snippets are illustrative and unexecuted. This pack does not run Power BI or implement its engines.

## Practice safely

1. State the complete calendar range and predict its row count.
2. Run python3 labs/bi-workshop/run_lab.py dates; inspect the full-year, deleted-date and incomplete-year cases.
3. Define the January/February comparison, calculate 4000/6000 growth and inspect the three YTD cutoffs.
4. As a paper-only extension, contrast order-date and ship-date questions; the fixture has no ship-date calculation.
5. As a paper-only extension, choose a closing-stock rule; the CLI does not compute stock snapshots.
6. List the real date-model and time-intelligence validation that remains unperformed.

## Evidence to keep

- Calendar integrity results and a named date-role diagram.
- January/February and YTD arithmetic with explicit cutoffs and denominator.
- A closing-balance policy and pending vendor-validation statement.

## Original check 1

Why include dates without sales in the teaching calendar?

A. Every missing date is a hidden sale
B. The analytical time structure is separate from observed events
C. It guarantees exam readiness
D. It removes the need for a date role

<details><summary>Answer and reasoning</summary>

B. The analytical time structure is separate from observed events

An uninterrupted calendar can represent periods consistently even when no transactions occur on some dates.

</details>

## Original check 2

What makes a year-over-year comparison potentially misleading?

A. Comparing complete equal months
B. Stating the cutoff date
C. Comparing a partial current period with an unexplained full prior period
D. Naming the denominator

<details><summary>Answer and reasoning</summary>

C. Comparing a partial current period with an unexplained full prior period

Different observation windows can dominate the apparent change. Declare and align periods before interpreting growth.

</details>

## Original check 3

Stock balances are 10 on Monday and 12 on Tuesday. Under a Tuesday closing rule, what is closing stock?

A. 22
B. 2
C. The number of calendar dates
D. 12

<details><summary>Answer and reasoning</summary>

D. 12

A stock balance is a snapshot. Summing balances across dates double-counts inventory instead of reporting the closing position.

</details>

Supplemental checks are practice, not additional XP or a separate spaced-review schedule.

## Limits

No Power BI date-table settings, DAX time intelligence, USERELATIONSHIP or calendar-based feature behavior is executed. The snapshot rule is fixture-specific.

## Official references

- https://learn.microsoft.com/en-us/power-bi/guidance/model-date-tables
- https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-relationships-understand
