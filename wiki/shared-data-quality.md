# Data cleaning and reproducible transformations

Make data types, nulls, keys and transformation steps explicit.

## Learn

Data analysis starts with understanding provenance, grain and quality. A row may represent an order, a line item or a daily summary. Mixing grains can double-count measures.

Power Query transforms data through recorded steps. Set data types deliberately, handle nulls, remove duplicates only with a justified key, and preserve the source. Folding can push supported work to a source, but not every step folds.

Validate row counts, key uniqueness, null rates and reconciled totals before building visuals. A beautiful report with incorrect joins is still wrong.

## Worked example

Joining orders to multiple line items and then summing order totals duplicates the order amount. Model or aggregate at the appropriate grain.

## Practice safely

1. Create a small fictitious orders and order-lines dataset.
2. Identify keys and grain.
3. Write three quality checks.
4. Compare a naive join total with a correctly aggregated total.

## Check your understanding

What should you identify before combining tables?

- Only their colors
- Grain and keys
- The final chart animation
- A password hash

<details><summary>Answer and explanation</summary>

Grain and keys. Grain and key relationships determine whether joins and aggregations are valid.

</details>

## Further study

- https://learn.microsoft.com/en-us/power-query/power-query-what-is-power-query

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

