# Acceptance policy bound to repair lineage

Implemented and measured 2026-10-28 against baseline Atlas commit c643141a81921ea015f07a62a592999a3dea0200. This is an actual experiment-journal correctness repair, not a performance ranking or general autonomous self-modification claim.

## Original failure

The journal stored evidence and a decision but not the policy that produced it. A candidate exceeding a 1,024-byte memory requirement could be recorded as a failed experiment, then linked as a repair under a 4,096-byte budget without repairing its 2,048-byte use. The same baseline, workload and environment checks did not prevent changing acceptance requirements. The [original failing test log](baseline-failure.log) and [original source](baseline-lib.rs.txt) preserve that reproduction. It is generated evidence, not a production incident.

## Actual repair

Every new journal record stores a versioned exact GatePolicy snapshot. A linked repair must match all of its parent's policy fields as well as the previous baseline/workload/environment conditions. Changing minimum pairs, stress cases, required speedup or memory budget is rejected before insertion. A new independent experiment may use different requirements, but is not misrepresented as a comparable repair.

Policy counts are decimal strings; floating-point bits are hexadecimal strings with a human-readable value. This preserves large integers and even invalid/non-finite policy inputs without lossy browser JSON rounding or conversion to null. Invalid policy inputs still evaluate as incomplete. Snapshot replay refuses unsupported evaluator versions or inconsistent representations. Evaluation semantics must get a new evaluator version if changed in future.

SQLite migration only adds a nullable column to old journals, with a recheck under an immediate transaction if migration is needed. Existing row content is not rewritten. Legacy policies stay unknown rather than being inferred from today's defaults; they cannot serve as policy-equivalent repair parents. No record, failure or rollback is deleted. Reopening verifies the exact saved policy. The database is not tamper-proof against an owner manually editing it.

Both the real CLI and queued HTTP result expose the policy saved by the journal, including incomplete/cancelled runs. No acceptance threshold was relaxed. Missing memory and cancellation evidence still block eligibility; eligibility itself remains review-only, not deployment permission.

## Verification

- 102 Rust unit tests and eight integration tests passed, including the original reproduction, every policy field, exact non-finite bits/large values, physical legacy migration/reopen, unchanged legacy rows and same-policy repairs.
- Strict Clippy and formatting checks passed. All 138 Node and 86 Python tests passed; logs are retained separately. JavaScript checks also preserve the actual CLI/HTTP policy objects and generated maximum-integer/invalid-float identities.
- [Actual local HTTP receipt](http-receipt.json): all 55 checks passed using a retained public version record and a separately labeled generated cancellation augmentation. Prior journals survive unchanged, their policies remain null, and completed/cancelled HTTP policy objects exactly match their stored policy rows. Existing host/origin/body/command guards and full-output checks remain intact. The checker extends the prior saved-version runner rather than replacing it with weaker checks.
- [Actual CLI result](cli-result.json) stores and returns identical evidence, decision and policy. Its generated benchmark remains incomplete for promotion; no speed result is adopted from it.

Raw failures and before/after source identities remain available. These checks are not physical power-loss, native UI rendering, arbitrary-code attestation or target-project acceptance. Provider adapters, working browser card/media applications and other projects are unchanged.
