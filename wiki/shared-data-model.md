# Star schemas, relationships and DAX context

Build models that produce understandable measures.

## Learn

A star schema separates fact tables at a defined grain from descriptive dimensions. Relationships propagate filters. Ambiguous paths and unnecessary bidirectional filtering can produce unexpected results.

A calculated column is evaluated and stored according to model behavior; a measure is evaluated in query filter context. DAX row context and filter context are different, and CALCULATE can modify filter context.

Use a proper date table where required for time analysis. Verify totals with small examples because a total may evaluate a measure in a broader context rather than simply summing visible cells.

## Worked example

Revenue = SUMX(Sales, Sales[Quantity] * Sales[UnitPrice]) evaluates each sales row’s expression then sums it. A simple SUM of unit prices would answer a different question.

## Practice safely

1. Sketch Sales fact and Date/Product dimensions.
2. Define cardinality and filter direction.
3. Calculate revenue manually for four rows.
4. Compare a measure under two filters and explain the change.

## Check your understanding

What mainly determines a measure’s result in a report?

- Only the file name
- The number of dashboard colors
- Its expression and current filter context
- A fixed value stored for every row

<details><summary>Answer and explanation</summary>

Its expression and current filter context. Measures are evaluated in the query’s context.

</details>

## Further study

- https://learn.microsoft.com/en-us/power-bi/guidance/star-schema
- https://learn.microsoft.com/en-us/dax/dax-overview

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

