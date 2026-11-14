# Baseline answer key and reasoning

All outputs described here are from local synthetic fixtures. They are not cloud evidence. Restore the baseline fixtures before comparing values. Every command emits `real_azure_executed:false`.

## hierarchy

`ancestors_by_scope.vm` is `["rg","sub","root"]`; `rg` has `["sub","root"]`, `sub` has `["root"]`, and root has `[]`. Parent references determine inheritance, not the spelling of IDs. A cyclic root or unknown parent causes a validation error, not a usable partial hierarchy. Real tenant topology and current scope IDs have not been fetched.

## access

The read request is allowed by supplied assignment `readers`; delete has no matching assignment and is false. Changing read's scope to `sub` fails to match an assignment at the descendant `rg`. Changing its principal also removes the match. `*` fails validation because the model supports only exact actions. No Azure denial is proven: group membership, deny assignments, PIM, conditions and role-definition expansion are examples of missing evidence.

## governance

There are two audit findings: `region_not_allowed` and `missing_tag:owner`. The first operation is a control-plane delete, blocked by inherited `rg-delete-lock`. The second is a data-plane delete, not blocked by this lock model. The receipt order follows fixture order; false blocked is not permission to delete.

A write under `CanNotDelete` is unblocked; under `ReadOnly` it is blocked in this simplified classification. Reads remain unblocked. Policy findings and lock decisions answer different questions. Azure Policy effects, assignment scopes, exemptions and provider-specific lock behavior require separate inspection.

## storage

LRS lacks `secondary_read` and `zone_resilience`; ZRS lacks `secondary_read`; RA-GZRS lacks neither. `matching_options` is `["RA-GZRS"]`. An equally capable fourth option stays alongside it, not below an invented ranking. An unsupported added requirement produces no matches.

This only matches supplied capability labels. Account/region availability and workload suitability are unverified. Geo-replication can be asynchronous, is not a backup strategy by itself, and does not grant authorization. A readable secondary is not an assurance that every latest primary write is present.

## network

`10.20.1.4` matches two /16 routes, `private-a` and `private-b`, more specifically than /0. Both remain candidates, with `ambiguous:true`. `203.0.113.8` selects `default`. Source types and Azure preferences were intentionally not supplied, so the model does not decide the tie.

The subnet selects `allow-web` at priority 100. The NIC selects `deny-web` at priority 100 before the later allow at 200. Combined `allowed` is false. Disabling the NIC deny match lets the 200 allow win, making both layers allow. Emptying the subnet rule list produces a conservative synthetic deny and null rule ID; real Azure default rules are not simulated.

No connections, packets, routes or effective NSGs were tested. Actual NSGs are stateful, so existing-connection behavior cannot be inferred from this static exercise. Real tests would need an authorized environment and an explicit new-versus-existing flow distinction.

## compute

Target per-instance capacity is 200 × 70/100 = 140 units. 1050/140 = 7.5, so the ceiling requires 8 instances. Current is 4, hence shortfall 4. Maximum is 6, hence capped instances 6 and `capacity_sufficient:false`. The shortfall is before the maximum cap, not a promise that four instances can be added.

Demand 560 requires 4; 561 requires 5. Zero demand retains the configured minimum 2. This arithmetic omits runtime scaling behavior, quota, startup delay and actual load distribution.

## monitoring

`complete-high`: mean 90, count 3/3, `breach` because 90 > 85. `gap`: mean 25 from two observed values, count 2/3, `insufficient_data`. Null is not zero. `boundary`: mean 85, count 3/3, `within_threshold` because equality does not meet a strict greater-than condition. All-null or empty observations yield null mean and insufficient data. Booleans, negative and nonfinite samples fail validation.

No Azure Monitor collection, KQL query, alert rule or action group ran. Window completeness and the strict threshold are local teaching rules, not universal alert behavior.

## recovery

Order is `["network","database","app"]`. The supplied point is 45 minutes old against a 30-minute RPO, so `rpo_met:false`. No missing dependencies or blocked components exist in the baseline.

Making network depend on missing vault yields `missing_dependencies:["vault"]`, no restore order, and blocked `["app","database","network"]`. Adding network → app instead creates a cycle and fails validation. RPO equality would satisfy this timestamp comparison. None of these outcomes proves backup integrity, successful restore, application consistency or RTO. An authorized restore test needs those checks and an observed recovery duration.

## cost

Platform: 12.3450 + 2.0050 = 14.3500, displayed `14.35`. Unallocated: `4.50`, from `storage-a`. Total: `18.85`; budget: `18.00`; `over_budget:true`. `budget_is_cap:false` is deliberate: a budget alone does not stop consumption.

With budget `"18.8499"`, displayed budget rounds to `18.85` while unrounded total 18.8500 is still greater, so `over_budget:true`. JSON numeric money is rejected; decimal strings are required to avoid binary float assumptions. Other inputs may produce independently rounded allocation sums that differ from rounded total; the model does not invent balancing cents. No prices or invoices are retrieved.

## capstone

Five baseline risks:

- `capacity_ceiling_below_demand`
- `telemetry_threshold_breach`
- `recovery_point_older_than_rpo`
- `synthetic_spend_exceeds_budget`
- `cost_allocation_tags_missing`

Missing evidence: `region_availability_review`, `restore_test`, `complete_telemetry_windows`. The role-assignment review label is already supplied, but is only a self-reported fixture string. Supplying all three required labels does not repair the telemetry gap. Fixing every synthetic risk does not authenticate any evidence or authorize deployment.

Example review recommendation: “The local model flags capacity, telemetry, recovery-point and allocation concerns. Gather current region availability evidence, an authorized restore-test result and complete telemetry before evaluating changes. These fixture results do not establish real Azure readiness.”

The conclusion is always `Review synthetic findings; no readiness or approval conclusion`.
