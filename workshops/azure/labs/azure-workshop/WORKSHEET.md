# Practice worksheet

Use only the bundled synthetic fixtures. Predict first, run the named command, then explain the receipt in your own words. Record a model limitation with every answer. Optional changes mean editing your local copy of that command's synthetic JSON fixture; restore the baseline before running regression tests. Never paste account information, real tokens, addresses of private infrastructure, invoices or other private operational data into a fixture.

For each challenge, record: your prediction, the observed key/value, why the model produced it, and what real evidence would still be needed. Do not treat a green test as Azure approval.

## 1. Scope inheritance (`hierarchy`)

Trace `vm` to the root without using identifier string prefixes. List its immediate parent and the two remaining ancestors. Explain why a grant at `rg` may affect `vm` while one at `vm` cannot grant an action on `sub`.

Local challenge: point `root.parent` at `vm`. Predict whether a partial hierarchy will be returned or validation will fail. Restore the fixture; then point `vm.parent` at an unknown ID. Distinguish cycle from orphan conceptually.

Evidence gap: what actual tenant and subscription information would be needed before using this hierarchy for an administrative review?

## 2. Exact-action grants (`access`)

Compare the two request receipts and identify the matching assignment. Why does read not imply delete? Why is `allowed:false` narrower than a claim that Azure denies access?

Local challenge: change the read request's scope to `sub`, then restore it and change its principal to `other`. Predict both outcomes. Try an assignment action `*` and explain why this model rejects it rather than pretending to expand a role.

Evidence gap: name three omitted identity or authorization factors that can change actual effective access.

## 3. Governance versus locks (`governance`)

Count region/tag findings separately from lock decisions. Identify which modeled delete is blocked and why the other is not. Does an empty finding list imply permission to perform an operation?

Local challenge: change the first operation to `write` with `CanNotDelete`; then change the lock to `ReadOnly`. Predict each receipt. Restore all changes. Explain why a lock should not be advertised as blob-data protection.

Evidence gap: what provider-specific operation semantics and actual policy assignment evidence remain unexamined?

## 4. Storage requirements (`storage`)

List each option's missing requirements. Which option satisfies the supplied capability requirements? Why is that not a universal recommendation?

Local challenge: add a fourth synthetic option with the same capabilities as RA-GZRS. Should the result select one winner? Add requirement `archive_immediate_read`; explain the absence of a match without inventing a compatible service.

Evidence gap: describe the distinction between geographic replication, backup, and authorization. Which current availability details must be checked separately?

## 5. Routes and NSG layers (`network`)

For `10.20.1.4`, identify the longest-prefix candidates and explain `ambiguous:true`. For `203.0.113.8`, identify the fallback route. A next-hop label is not a reachability test.

For the NSG case, identify each layer's selected rule. Explain why one layer's allow is insufficient. Why does the later NIC allow not win?

Local challenge: set the NIC deny rule's `matches` to false. Then empty the subnet rules list. Predict each outcome and label the no-match deny as a teaching simplification, not an Azure default-rule claim.

Evidence gap: explain why these receipts cannot prove an existing connection stops after a rule change. What missing route-source information prevents resolution of equal-prefix candidates?

## 6. Capacity and ceilings (`compute`)

Calculate effective per-instance target capacity, required instances, capped instances and current-instance shortfall. Show the ceiling operation explicitly. Is the configured maximum sufficient?

Local challenge: set demand to 560, then 561. Explain the step change. Set demand to zero and explain why the minimum still matters. Do not claim an autoscale action occurred.

Evidence gap: what load-test, quota, warm-up and reliability information is absent from this arithmetic?

## 7. Telemetry completeness (`monitoring`)

Compare the complete-high, gap and boundary windows. Explain why the gap's available-sample average is not a healthy status, and why the boundary is not a breach under this exercise's strict threshold.

Local challenge: set a window's samples to `[null,null,null]`, then `[]`. Predict its mean and status. Try a boolean or negative sample and explain why validation fails.

Evidence gap: identify two collection or alert configuration facts the array cannot establish.

## 8. Restore sequencing (`recovery`)

Draw the dependency chain and list the restore order. Compare the supplied recovery-point age with the RPO. Does the age comparison prove that the backup can be restored?

Local challenge: make network depend on missing `vault`. Predict missing dependencies, blocked components and restore order. Restore the original and make network depend on app; explain the cycle failure.

Evidence gap: list concrete evidence needed for a real restore exercise, including application validation and elapsed time rather than just backup timestamps.

## 9. Decimal allocation (`cost`)

Sum the platform amounts before rounding, then include unallocated cost. Compare total with budget. Identify the missing tag resource. Explain why the budget does not cap consumption.

Local challenge: set budget to `"18.8499"`. Predict the displayed budget and `over_budget` independently. Why can display rounding hide a strict comparison boundary? Try a JSON number instead of a decimal string and predict validation.

Evidence gap: which invoice, price, discount and allocation decisions remain unverified?

## 10. Integrated review (`capstone`)

Group the five risks into capacity, telemetry, recovery and cost concerns. List the three missing-evidence labels. Draft a short review recommendation that asks for evidence without declaring readiness or authorizing any action.

Local challenge: supply all three required evidence labels. Explain why the missing telemetry evidence remains. Fix the synthetic inputs so no risks remain, then explain why the conclusion must still refuse production approval.

Final reflection: Which of your conclusions are arithmetic facts? Which rely on fixture claims? Which can only be established in an authorized real Azure environment? Keep these categories distinct in any portfolio or certification study notes.
