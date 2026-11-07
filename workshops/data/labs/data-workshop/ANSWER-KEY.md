# Data & SQL prediction key

## Grain and population

Queues: one description per queue. Tickets: one current-state ticket per identifier. Touches: one interaction per identifier. Nine tickets and nine touches do not imply one-to-one matching. Main cohort opens at or after November 1 midnight UTC and before November 3 midnight. Status is from the invented November 5 snapshot. There is no closure timestamp or SLA target.

## Input and boundary cases

T-001’s summary contains one quoted comma. T-003 has recorded zero work. T-002/T-005 have missing work while open; T-009 has missing work despite closed status. Empty work maps to NULL; literal NULL, negative values, malformed dates and duplicate keys are rejected.

T-001 is included at the start, T-007 excluded at the end and T-008 excluded just before the start. Ordered cohort: T-001, T-002, T-003, T-004, T-005, T-009, T-006. Canonical UTC text is chronologically sortable here; mixed formats/offsets are not supported by that shortcut.

## Metrics

Seven rows, five closed snapshot statuses, four observed work values, three missing and one recorded zero. Observed values 30, 0, 45, 30 sum to 105 and average 26.25. Replacing missing with zero gives 105/7 = 15, which assumes unobserved work was zero and changes the question. Closed share 5/7 ≈ 71.4% is not an in-period closure count.

Access has three tickets but only one observed value, zero. Repair has three tickets and two observations totaling 60. Setup has one observation of 45. Training has no cohort tickets: zero counts, but NULL sum/mean/rate. No observations differs from an observed zero.

## Join trap

T-001 repeats twice and T-004 three times. The naive left join has ten rows and sums ticket work as 30+30+0+45+45+45+30 = 225 (NULL contributions omitted). Distinct numeric values 30,0,45 sum to 75, dropping a legitimate second 30. Preaggregating touches retains seven ticket rows and correct ticket work 105, with seven touches totaling 55 minutes as a separate measure.

A left join’s unmatched placeholder row makes COUNT(*) misleading for an empty queue. Count the matched ticket key, and retain date conditions in ON when preserving every queue is intended.

## Dates and quality

Wider daily counts: 3,4,1,0; running totals: 3,7,8,8. T-007 belongs to this wider interval. November 4 is preserved by the known calendar. Real source completeness would need separate evidence before an absent activity record could be labelled zero.

The invalid queue reference rejects the second batch row. Explicit rollback also removes T-900, restoring nine tickets. Foreign-key checks are clear and integrity_check is ok. A wrong but allowed minute value could still pass every structural rule; those checks do not prove business truth.

## Export and capstone

Export has four rows and round-trips to the documented text values. Training’s count is "0" while absent aggregates are empty. Its owned temporary directory is removed. No persistent report, external database or Power BI asset is created.

For a per-queue missingness extension, decide whether the denominator is all cohort tickets and how zero-ticket queues appear. Preserve Training with a left join, count only matched ticket IDs, distinguish NULL work from unmatched rows and leave an undefined empty-group rate absent. Write tests before claiming a reliable result.

A strong final summary states the synthetic population, snapshot, denominator, observed count and gaps. It does not infer causation, resolution speed, real staff performance or PL-300 readiness.
