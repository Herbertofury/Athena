# Predict, inspect, explain

Keep a separate note if desired; the program never saves answers. For each exercise, record **prediction → observed receipt → explanation → unexecuted platform evidence**. No automatic score is assigned.

## 1. Transform: error policy is part of the metric

Before running `transform`, calculate the six amounts from quantity × unit cents. Predict what should happen to F7 with quantity `many`. Would replacing its value with zero be truthful? Explain the difference between rejecting a row and silently hiding it.

Inspect F7's rejection ledger: use `row_index`, `reason` and `raw_record` to identify the original ID and malformed quantity. Why should this evidence remain unchanged if a working row is edited later? Inspect the receipt. Which raw fields were normalized and which were not? Why can numeric string `2` be accepted while Python boolean `True` is rejected despite being integer-like in Python? What would a duplicate F1 mean if the first occurrence were malformed? State the chosen policy and one production alternative that would need stakeholder approval.

Evidence still required: source-specific type handling, real query steps and folding inspection.

## 2. Model: count keys before trusting sums

Sketch Product → Fact, Region → Fact and Date → Fact, with one-to-many cardinality and single dimension-to-fact direction. State the fact grain. Predict the count of each dimension, including the date dimension.

Run `model`. Explain why adding a second P1 row could inflate totals in a naïve join, and why removing P1 from the dimension creates orphans without changing the raw fact amounts. Does rejecting orphans here prove a particular Power BI engine response? Explain why it does not.

Evidence still required: real relationship settings, ambiguous paths and handling of unmatched keys.

## 3. Context: write the row set

Predict the selected F-IDs and total for Hardware, then North + Hardware. Starting from North + Hardware, compare replacing North with South against keeping both North and South constraints on the same region column. Separately predict a single region filter whose allowed values are `{North, South}`.

Run `context`. Why is F1's 2000-cent row amount different from the overall 16000-cent aggregate? What cannot you conclude about DAX context transition from this Python comparison?

Evidence still required: actual measure expressions and their evaluation under real visual/slicer context.

## 4. Dates: coverage is not activity

Predict whether each calendar passes: all 365 dates; the full year without January 2; only January and February. Is the third calendar contiguous? Is that sufficient here?

Calculate January/February totals and YTD at January 2, February 1 and February 2, noting inclusive cutoffs. Calculate February minus January and growth as a fraction of January. Why must March's absence of rows not automatically be described as zero sales?

Run `dates`. The Jan/Feb failure prints a long missing-date list on purpose: inspect its first and last missing dates, not just the Boolean result.

Evidence still required: actual date-table/calendar configuration, relationships and time-intelligence results.

## 5. Report: denominator before decoration

For Supply, Hardware and Service, predict each share of all 16000 cents. If a visual selects only Hardware, explain two defensible denominators and the question each answers. Would showing “100%” without labeling scope be misleading?

Run `report`. Explain why a plan with all three fields declared can still have terrible alt text, an awkward reading order or ambiguous units. Propose a useful alt description for the category comparison, a justified reading order and an explicit unit label.

Evidence still required: rendered keyboard navigation, focus order, assistive technology behavior and contrast checks.

## 6. Refresh: separate stale from unavailable

Draw two axes: data freshness and source availability. Put the invented F1–F4 copied snapshot and F1–F6 source-required read on those axes, with the source both online and offline. Predict all four results.

Run `refresh`. How large is the snapshot's gap from the later source? Why is a successful stale read not proof that the source is online? Why does a failed source-required read say nothing about whether yesterday's copied data existed?

Evidence still required: actual storage-mode semantics, refresh history, source behavior and failure handling. Direct Lake framing/fallback is outside this exercise.

## 7. Access: a classifier is not a boundary

Under this explicitly hypothetical policy, predict a North-assigned Viewer, that Viewer with Build, Member/Contributor/Admin, a Viewer assigned both region roles, and a Viewer with no assigned region role.

Run `access`. Why does unioning two roles widen the selected rows? Explain why printing a denied decision does not prevent reading `raw_fixture()` from the source file. Name an actual effective-access test you would require before allowing sensitive data into a real deployment.

Evidence still required: authorized test identities, actual workspace/item roles and relevant sharing/export/embedded scenarios. Do not enter real identities or credentials into this program.

## 8. Capstone: construct an evidence ledger

Predict total accepted rows, rejected rows, model counts, monthly totals and grand total. Reconcile at least two independent partitions (region and category, or month and category).

Run `capstone`. Write three claims supported by these local receipts, three claims they cannot support and a concrete next validation for each unsupported claim. Explain why a passing unit-test suite cannot establish exam readiness or production security.

Finish by distinguishing a numerical mismatch, a mistaken assumption and a missing platform test. These need different remedies: correct arithmetic/code, clarify scope, or collect additional evidence.
