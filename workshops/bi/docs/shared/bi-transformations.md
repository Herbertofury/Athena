# Trace transformations before discussing query folding

Make types, rejects and intermediate results explicit, then distinguish local pushdown from verified folding.

**Study time:** about 45 minutes, including prediction, execution and reflection.

## Learning goals

- Build a transformation ledger that reconciles accepted and rejected rows.
- Distinguish append, merge and unpivot by their effect on row grain.
- Explain why equal SQL results do not establish Power Query folding.

## Learn

A fictional shop sends order lines with quantities stored as text and inconsistent whitespace around region names. Start with the business meaning of a line, the units of each value and the allowed range of each field. A successful parse is not the same as valid business data: negative units may parse correctly but violate this fixture contract. Preserve a way to trace the raw value and an explicit rejection reason so a reviewer can distinguish correction from accidental data loss. This receipt retains an input index, reason and an independent raw_record copy for the bounded six-field string fixture. F7 keeps its ID and malformed quantity. Unsupported schemas, non-string objects and fields longer than 256 characters are not copied; this is not a general ingestion interface.

Write a transformation ledger with input count, operation, output count and assumptions for every stage. Trimming whitespace should not change the number of rows. Filtering a date range should change that number predictably. A join may unexpectedly multiply rows when its lookup key is duplicated. Check these expectations at the point of transformation instead of waiting until a chart looks surprising. Silent replacement of a malformed amount with zero makes a tidy table at the expense of a trustworthy total.

Appending combines compatible sets of records, while merging adds information matched by keys. Unpivoting turns repeated month columns into records with a month attribute and a value. Those operations solve different problems. For example, a planning grid with one category and two monthly columns becomes two category-month observations after unpivoting. Its grain is not an order line, so it must not be appended into the sales facts merely because both tables contain monetary numbers.

Power Query can translate supported transformations into source operations through query folding. A separate paper analogy compares retrieving rows before filtering with filtering at a source before retrieval. This lab implements neither SQL plan. Even an independently run SQL comparison would establish only its own result, not which M expressions a connector can fold. The transform receipt makes the narrower claim of local cleaning and validation.

Avoid a performance claim based on tiny teaching data. Startup, caching and measurement noise can dominate timings, and this command records no folding benchmark. Keep hypothetical transfer counts on paper rather than calling them observations. In a real deployment, source capabilities, expression shape, privacy and query diagnostics need direct inspection. The planned transformation order is a hypothesis to test, not a certificate of vendor behavior.

The safe exercise uses invented records and a local transformation trace. No database account, connector setup, remote query, credential, Power Query editor or M runtime is required. If a supplied bounded model is run, keep its observed result separate from the prediction made on paper. The final explanation should name one rejected record, one preserved invariant and one product-specific question still unanswered.

## Worked example

The transform receipt accepts F1–F6, rejects F7 because quantity is many, and reconciles six valid plus one rejected row to seven received. Accepted revenue totals 16000 cents. The SQL pushdown and unpivot discussions are optional paper analogies only; the CLI performs no SQL pushdown, merge or unpivot.

```text
# Power BI, M and DAX remain unexecuted.
# Local Python teaching model only; vendor code below is illustrative and unexecuted.
python3 labs/bi-workshop/run_lab.py transform
// Illustrative M idea only; not runnable or validated in this workshop.
// Keep an explicit rejection ledger before calculating accepted revenue.
// Table.SelectRows(TypedSales, each [Year] = 2026)
// A source-specific folding claim requires actual Power Query evidence.
```

Only fixed Python wrapper commands are runnable instructions. Commented M/DAX snippets are illustrative and unexecuted. This pack does not run Power BI or implement its engines.

## Practice safely

1. Declare the raw order-line grain and the units of every numeric field.
2. Predict which malformed quantity should be rejected and why.
3. Run python3 labs/bi-workshop/run_lab.py transform and inspect the local ledger without editing real business data.
4. Reconcile received, accepted and rejected counts and the 16000-cent accepted total.
5. Explain a separate append, merge and unpivot use case in ordinary language.
6. Label actual local observations separately from untested Power Query behavior.

## Evidence to keep

- A count-reconciled transformation ledger and one explicit rejection reason.
- The observed six-row accepted total; optional pushdown reasoning clearly marked as paper-only.
- A statement that Power Query folding remains unverified.

## Original check 1

A quantity cannot be parsed. What preserves the strongest audit trail?

A. Keep the raw value in a reject ledger with a reason
B. Replace it silently with zero
C. Delete the entire input without recording counts
D. Treat parsing failure as a successful sale

<details><summary>Answer and reasoning</summary>

A. Keep the raw value in a reject ledger with a reason

A reject ledger preserves what was received and why it was excluded, allowing counts to reconcile without inventing a valid value.

</details>

## Original check 2

Two local plans produce the same total. What follows?

A. Power Query definitely folded every step
B. They agree for the checked fixture
C. All connectors support the same M operations
D. Their production runtimes will match

<details><summary>Answer and reasoning</summary>

B. They agree for the checked fixture

Equality on a bounded dataset is local correctness evidence, not proof about a separate vendor engine or performance.

</details>

## Original check 3

What happens when a category-by-month grid is unpivoted?

A. It becomes order-line sales automatically
B. All months are added into one date
C. Monthly columns become category-month records
D. Every source key becomes unique automatically

<details><summary>Answer and reasoning</summary>

C. Monthly columns become category-month records

Unpivot changes the representation and grain. It does not establish equivalence to a transaction fact table.

</details>

Supplemental checks are practice, not additional XP or a separate spaced-review schedule.

## Limits

The CLI performs fixed local cleaning and validation only. Pushdown and unpivot are paper analogies; no SQL plan, M execution, connector folding or performance test is run.

## Official references

- https://learn.microsoft.com/en-us/power-query/query-folding-basics
