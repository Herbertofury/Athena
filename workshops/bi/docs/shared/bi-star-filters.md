# Declare grain and trace relationship filters

Use a small star model to reason about unique keys, fact grain and intersecting filters.

**Study time:** about 45 minutes, including prediction, execution and reflection.

## Learning goals

- Specify the meaning of one fact row before selecting relationships.
- Validate unique dimension keys and report unmatched fact keys.
- Trace two dimension filters into their shared fact table.

## Learn

Before selecting a chart, finish this sentence: one row records one specific event at this level of detail. Our synthetic facts contain order lines, not whole orders, monthly targets or stock balances. Quantity and line revenue belong to that grain. An order-level shipping charge repeated on every line would be overcounted by an ordinary sum, even if every relationship were technically valid. Grain is a business definition, not a property inferred safely from a column name.

Separate descriptive entities from the recorded observations. Product has one row per product key and attributes such as category. Region has one row per region key. The Sales facts refer to those keys and retain their line-level quantities and amounts. A category label is not automatically a unique product identifier. Two products may share a category or color without being duplicates of the same entity.

The teaching diagram uses a single-direction path from each dimension into Sales. Relationships describe how filters propagate; they are not instructions to materialize one permanently joined table. If a category selection admits two product keys, only facts with those keys remain eligible. A simultaneous region selection further restricts those facts. Draw arrows and list surviving line identifiers before calculating the aggregate so the result can be checked without trusting a black box.

Validate key quality locally before trusting the model. A duplicated Product key can cause a conventional SQL join to multiply facts, and a missing lookup key can cause an inner join to drop a sale. Neither defect should be hidden by a pleasing total. The exercise rejects the duplicate-key fixture and reports unmatched references. Those are explicit classroom validation rules, not a claim that semantic model relationships enforce source integrity.

There are legitimate complex models, but adding a second direction to every relationship is not a universal repair. It can make the route of a filter harder to explain. This introductory model excludes ambiguous paths, many-to-many bridges and engine-generated blank members. When an example needs those features, describe the missing requirement rather than quietly broadening the toy evaluator and calling it Power BI.

Your evidence should make the selected rows inspectable. Retain the declared grain, dimension-key checks, relationship sketch, chosen filters and resulting fact identifiers. A correct sum without a trace is harder to diagnose when a fixture changes. A local join or set-intersection test is useful evidence of your reasoning, but the actual Power BI model and its relationship configuration remain uncreated and untested.

## Worked example

The model receipt contains six facts, three products, two regions and 365 dates. Its controlled duplicate-key and orphan-fact cases are rejected. The companion context receipt reports Hardware at 9000 cents and North plus Hardware at 3000, keeping only F2. The North-only 7000 subtotal is shown in the access receipt and can also be derived from the facts; do not add independent totals to calculate an intersection.

```text
# Power BI, M and DAX remain unexecuted.
# Local Python teaching model only; vendor code below is illustrative and unexecuted.
python3 labs/bi-workshop/run_lab.py model
// Conceptual DAX measure, not executed here.
// Revenue = SUM(Sales[RevenueCents])
// Predict the rows retained by Product[Category] and Region[Name].
// A real model must configure and validate the relationship paths.
```

Only fixed Python wrapper commands are runnable instructions. Commented M/DAX snippets are illustrative and unexecuted. This pack does not run Power BI or implement its engines.

## Practice safely

1. Write the order-line grain and name one amount that would violate it.
2. Draw Product and Region as unique-key dimensions pointing toward Sales.
3. Run python3 labs/bi-workshop/run_lab.py model and inspect its synthetic duplicate-key and orphan checks.
4. List the lines surviving category and region filters before calculating their sum.
5. Explain the duplicate-lookup failure without silently deleting evidence.
6. Record the excluded relationship complexities and actual-vendor validation still needed.

## Evidence to keep

- A declared grain and labelled one-way relationship diagram.
- Unique-key and unmatched-reference results including a negative fixture.
- A row-level trace for the category/region intersection.

## Original check 1

What does the declared grain explain?

A. The preferred chart color
B. The workspace password policy
C. The file extension
D. The business meaning of one fact row

<details><summary>Answer and reasoning</summary>

D. The business meaning of one fact row

Grain identifies the event and level of detail represented by a record; it determines which aggregations make sense.

</details>

## Original check 2

Hardware and North filters both reach Sales. Which rows qualify in this simple model?

A. Rows satisfying both filters
B. Rows satisfying either filter alone
C. Every row twice
D. Only rows without product keys

<details><summary>Answer and reasoning</summary>

A. Rows satisfying both filters

Independent dimension restrictions intersect at the facts. Adding separately filtered totals would double-count or include ineligible rows.

</details>

## Original check 3

A lookup key is duplicated. What is the sound teaching response?

A. Assume relationships repair it
B. Flag the key-quality failure before accepting the result
C. Hide the duplicate in the chart
D. Count the extra join rows as new sales

<details><summary>Answer and reasoning</summary>

B. Flag the key-quality failure before accepting the result

A unique-key dimension is a declared assumption. A violated assumption should produce visible evidence, not an unexplained total.

</details>

Supplemental checks are practice, not additional XP or a separate spaced-review schedule.

## Limits

This is a simple star-filter teaching model, not Power BI relationship execution, bidirectional filtering, many-to-many support or referential-integrity enforcement.

## Official references

- https://learn.microsoft.com/en-us/power-bi/guidance/star-schema
- https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-relationships-understand
