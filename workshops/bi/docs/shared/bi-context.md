# Separate stored row values from filter-context measures

Predict aggregate changes and same-column filter replacement without claiming to emulate DAX.

**Study time:** about 45 minutes, including prediction, execution and reflection.

## Learning goals

- Choose a row-derived value or query-time aggregate for a stated need.
- Explain replacement versus intersection for a simple same-column filter.
- Recognize that totals and ratios must answer the stated business question.

## Learn

A value attached to one line and a total over selected lines answer different questions. The first might be quantity multiplied by unit price; the second might be revenue for the currently selected period and category. In the Import-oriented teaching case, calculated columns are stored refresh-time results, while measures are evaluated for query context. Changing a region selection should change the selected aggregate, not rewrite the historical line amount.

Make the visible population explicit before applying an arithmetic formula. A report total is a calculation over a context, not necessarily the sum of the numbers currently visible in a screenshot. The same measure definition can produce different answers under different selections. The fixed context command filters a collection and aggregates it. It does not execute a semantic-model query or reproduce the complete DAX type system.

CALCULATE evaluates an expression under changed filter context. For the narrow same-column case here, a new region filter replaces the previous region filter by default, while KEEPFILTERS preserves intersection. Represent that difference with labelled selected-key sets rather than a magic function called a DAX engine. Existing filters on other relevant columns still matter; replacing region does not mean removing every restriction from the model.

Row context and filter context are different concepts. A current row gives a row expression a place to obtain its field values. Context transition can turn row context into a filter context; a model-measure call in row context has automatic transition behavior. We explain that distinction but do not implement general transition, expanded tables, auto-exist or relationship modifiers. A toy dictionary of filters must not be presented as sufficient to reproduce those semantics.

Ratios require an explicit denominator and aggregation level. Revenue divided by units answers average realized revenue per unit, whereas averaging line unit prices weights every line equally. Both are mathematically possible and can disagree without either arithmetic operation being broken. Ask which population and weighting the business question requires. Also distinguish no matching rows from a measured zero: this workshop may use None for empty results, which is a local convention rather than universal DAX BLANK behavior.

Record predictions before running any supplied conceptual model. Then compare observed selected rows and aggregates with the prediction, not merely with a green test status. Illustrative formulas are reading material, not vendor-validated code. The most valuable outcome is an explanation of why a result changed, what context was preserved and where the model deliberately stops.

## Worked example

The context receipt shows Hardware 9000 cents and North plus Hardware 3000. Replace North with South while preserving Hardware: 6000. Keep both North and South restrictions on that same region column: empty/None. F1 row amount is 2000, while the overall aggregate is 16000. These are Python filtering results, not DAX execution.

```text
# Power BI, M and DAX remain unexecuted.
# Local Python teaching model only; vendor code below is illustrative and unexecuted.
python3 labs/bi-workshop/run_lab.py context
// Illustrative DAX only; no engine execution or compatibility test.
// Revenue = SUM(Sales[RevenueCents])
// South Revenue = CALCULATE([Revenue], Region[Name] = "South")
// South Intersection = CALCULATE([Revenue], KEEPFILTERS(Region[Name] = "South"))
```

Only fixed Python wrapper commands are runnable instructions. Commented M/DAX snippets are illustrative and unexecuted. This pack does not run Power BI or implement its engines.

## Practice safely

1. Classify line revenue and selected revenue as row-derived or query-time values.
2. Predict the facts surviving Hardware and then North plus Hardware.
3. Run python3 labs/bi-workshop/run_lab.py context and compare replacement of North by South with intersection on the same region column.
4. As an optional paper extension, explain why revenue divided by units need not equal an unweighted mean of line prices.
5. Write an explicit convention for an empty local result without calling it full BLANK semantics.
6. Name two DAX behaviors that the conceptual exercise does not implement.

## Evidence to keep

- F1 row amount 2000 versus total 16000, with the context trace.
- Replacement and intersection predictions with empty-result conventions.
- A ratio explanation naming population, weighting and omitted DAX behaviors.

## Original check 1

A report region selection changes. Which expectation fits the teaching case?

A. Every historical unit price is rewritten
B. The file becomes a deployed semantic model
C. A selected aggregate changes while stored line amounts remain fixed
D. Calculated columns must all become measures

<details><summary>Answer and reasoning</summary>

C. A selected aggregate changes while stored line amounts remain fixed

A query selection changes the evaluated population, not the source line facts in this Import-oriented example.

</details>

## Original check 2

What does a new same-column filter normally do inside CALCULATE without KEEPFILTERS?

A. Always intersect with the old value
B. Erase all filters everywhere
C. Modify source rows permanently
D. Replace that existing column restriction

<details><summary>Answer and reasoning</summary>

D. Replace that existing column restriction

The example concerns replacement on the same filtered column. KEEPFILTERS changes the combination to intersection; other context is not automatically erased.

</details>

## Original check 3

Which expression answers revenue per unit over the whole selected population?

A. Total revenue divided by total units
B. Unweighted average of line prices in every case
C. Sum of product identifiers
D. Maximum unit price minus number of lines

<details><summary>Answer and reasoning</summary>

A. Total revenue divided by total units

The numerator and denominator use the same population and weight by units. A mean of line prices instead weights each line equally.

</details>

Supplemental checks are practice, not additional XP or a separate spaced-review schedule.

## Limits

Illustrative DAX is unexecuted. The bounded model is not a parser or emulator and excludes general context transition, expanded tables, auto-exist and full BLANK semantics.

## Official references

- https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-calculations-options
- https://learn.microsoft.com/en-us/dax/calculate-function-dax
