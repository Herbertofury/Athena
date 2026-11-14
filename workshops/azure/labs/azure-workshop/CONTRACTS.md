# Model contracts and deliberate limits

## Shared interface

`lab.run(command, data)` is the supported pure model entry point. It returns a fresh JSON-compatible dictionary or raises `ValueError`. It does not mutate its input. `run_lab.py` reads only `fixtures/<fixed-command>.json` adjacent to itself; success exits 0, invalid arguments/fixtures exit 2 with JSON. Missing/extra object fields are invalid. Duplicate record IDs and duplicate name lists are invalid. Bundled JSON object keys must be unique. Files above 100,000 bytes are rejected. No user-controlled path is accepted.

All lists contain at most 100 entries. Unless expressly optional, lists must be nonempty. Strings must contain non-whitespace text and be no longer than 160 characters. Integers exclude booleans, are at most 1,000,000, and default to a minimum of zero. Numeric samples/thresholds exclude booleans, negatives, NaN and infinity. These are teaching limits, not Azure limits.

Every success has `command`, `real_azure_executed: false`, and `model_limitations` (a text list). Error receipts also have `real_azure_executed: false`. Result fields below are additional.

## hierarchy

Input: `scopes`, a list of `{id,parent,kind}`. Exactly one root is a `management_group` with `parent:null`. Management groups may nest, subscriptions have management-group parents, resource groups have subscription parents, and resources have resource-group parents. The toy tree intentionally requires a management-group root even when a real administrator does not explicitly model one. Unknown parents, cycles and invalid parent kinds fail.

Output: `ancestors_by_scope`, mapping each ID to its immediate-parent-first ancestor list. Scope is identified through explicit parent references, never string-prefix matching. Does not model tenants, cross-tenant administration, deployment lifecycles, resource moves or resource-provider child resources.

## access

Input: `scopes` plus `assignments:[{id,principal,scope,actions}]` and `requests:[{id,principal,scope,action}]`. An empty assignment list is permitted. Only exact, case-sensitive action strings are supported; wildcards fail. A grant matches the same principal, exact action and requested scope or ancestor.

Output: `decisions:[{scope,action,allowed,matching_assignment_ids}]` in request order, with sorted assignment IDs. A false decision means this model found no matching supplied grant. It does not establish denial by Azure. Excludes group membership, deny assignments, conditions, PIM activation, built-in/custom role expansion, NotActions, DataActions, resource-provider behavior and token state. These omitted factors are essential to actual effective access.

## governance

Input: `scopes`, `resources:[{id,region,tags}]`, `locks:[{id,scope,level}]`, `operations:[{id,resource_id,operation,plane}]`, `allowed_regions`, `required_tags`. Resource IDs must exist in the tree. Tag lists contain tag names only, not values. Empty required tags, resource tag lists and lock lists are permitted. Levels: `CanNotDelete` or `ReadOnly`; operations: `read`, `write`, `delete`; planes: `control`, `data`.

Output: `policy_findings:[{resource_id,issue}]`, where issues are `region_not_allowed` or `missing_tag:<name>`, independently from `lock_decisions:[{resource_id,operation,blocked,lock_ids}]` in operation order. Inherited locks block control-plane deletes; ReadOnly additionally blocks modeled control-plane writes. Neither blocks modeled reads or data-plane operations. A false blocked result is not an authorization grant.

This is an audit-style comparison, not Azure Policy evaluation, enforcement, remediation or exemptions. Real locks can have provider-specific consequences, including operations implemented as POST. The toy read/write/delete classification does not predict them. Locks do not protect blob data from data-plane deletion.

## storage

Input: `requirements` (unique capability names), `options:[{id,capabilities}]` (capabilities may be empty).

Output: `comparisons:[{option,missing_requirements,meets_requirements}]` in option order and `matching_options`. Capability matching is set inclusion. Multiple matches are retained; none is arbitrarily ranked.

Baseline compares LRS, ZRS and RA-GZRS for zone resilience and secondary reads. Replication is not backup; asynchronous geographic replication does not guarantee zero data loss or immediate consistency. Capabilities are supplied claims, not a service catalog. This model does not verify account type, tier, region availability, failover behavior, authorization, public access, private endpoints, encryption or pricing. Secondary-read capability is not a permission grant.

## network

Input: `routes:[{id,prefix,next_hop}]`, `destinations` (IP literals), `nsg_cases:[{id,layers:[{id,rules:[{id,priority,matches,action}]}]}]`. Prefixes must be canonical networks (host bits fail). Route next hops are labels only. Layers must be nonempty; rule lists may be empty. Each layer's priorities are unique integers 100–4096. Actions are `allow`/`deny`; matches must be actual booleans.

Output: `routes:[{destination,selected_route_ids,ambiguous}]`, listing all longest-prefix candidate IDs in sorted order. Equal-prefix ties remain explicitly ambiguous because route source/preference evidence is not supplied. No candidates means no matching supplied route, not proof that Azure has no route. IPv4/IPv6 do not cross-match.

`nsg_cases:[{id,allowed,layer_decisions:[{layer,allowed,rule_id}]}]` uses the lowest-numbered matching rule in each layer. All layers must allow. No matching rule gives a conservative synthetic deny with null `rule_id`. This is NOT Azure's actual built-in default-rule table. `matches` is a fixture fact, not a packet evaluator.

No route-source precedence, preferred/system/service-endpoint route exceptions, NIC/subnet effective route retrieval, service tags, application security groups, NAT, direction ordering or DNS resolution is simulated. No socket is opened. NSGs are stateful in Azure; existing connections can survive rule changes. This local model does not track connections and is not evidence of live new-flow or existing-flow behavior. A private endpoint alone neither grants data authorization nor necessarily disables public access.

## compute

Input: nonnegative integer `demand`, positive integer `capacity_per_instance`, positive `target_utilization_percent` at most 100, and integer `min_instances`, `max_instances`, `current_instances`. Minimum/current cannot exceed maximum.

`required_instances = max(min_instances, ceil(demand*100/(capacity_per_instance*target_utilization_percent)))`. Integer arithmetic avoids floating-point ceiling mistakes. `shortfall=max(0,required-current)` is the number needed beyond current instances before applying the max. `capped_instances=min(required,max)`. `capacity_sufficient` compares capped vs required.

This steady-state capacity arithmetic is not an autoscale engine, load test, quota verification, SLA calculation or availability-zone design. No cooldown, warm-up, utilization distribution, scale history or Azure resource limit is modeled.

## monitoring

Input: `windows:[{id,samples,expected_count,threshold}]`. Samples may be empty or include null, but cannot outnumber positive `expected_count`. Each supplied number is finite and nonnegative. Null and absent samples are missing, not zero.

Output windows include `id,status,observed_count,expected_count,mean`. Mean is null with no observations; otherwise it averages only observations. Any missing expected observation yields `insufficient_data`, regardless of the observed mean. Complete windows are `breach` only when mean is strictly greater than threshold, otherwise `within_threshold`.

Windows are synthetic fixed arrays without timestamps. No KQL, collection, ingestion delay, metric aggregation choice, alert evaluation frequency, dimension splitting, action group or notification is executed. The strict threshold and completeness rule are workshop choices, not all Azure alert semantics.

## recovery

Input: `components:[{id,depends_on}]`, `recovery_point_age_minutes`, `rpo_minutes`. Empty dependency lists allowed. Cycles fail even when a separate dependency is missing. Unknown dependencies are reported rather than invented.

Output: `restore_order` topologically ordered by alphabetically sorted eligible batches; `missing_dependencies` sorted unknown IDs; `blocked_components` sorted components that cannot be scheduled; `rpo_met` iff supplied recovery-point age is at most RPO. Independent schedulable components remain in the plan when others are blocked.

No restore occurs, no backup is inspected, and no RTO or application-consistency claim follows. A dependency plan plus an acceptable timestamp is insufficient evidence of recoverability. Recovery testing is required separately.

## cost

Input: `resources:[{id,team,amount}]`, `budget`. Team null means missing allocation tag; `[unallocated]` is reserved. Money uses decimal STRINGS, finite/nonnegative, at most 1,000,000 with at most four fractional places, text length at most 24. Numbers/booleans are rejected.

Output: `allocations` by sorted team; `missing_tag_resource_ids`; `total`; `budget`; `over_budget`; `budget_is_cap:false`. Decimal amounts are summed before half-up rounding to two places for display. Comparison to the budget uses unrounded totals. Independently rounded allocations can differ from rounded total in other fixtures; no balancing adjustment is invented.

Amounts are synthetic units denominated consistently within this exercise, not real Azure prices, an exchange-rate calculation or invoice. Excludes tax, discounts, reservations, shared-cost redistribution, chargeback authority and actual billing tags. Budgets can alert; a budget itself is not a spending cap and does not stop consumption.

## capstone

Input: nested `compute`, `monitoring`, `recovery`, `cost` inputs plus `evidence` (possibly empty unique names). Outputs `risks`, `missing_evidence`, `conclusion`. Risks surface capacity ceiling, complete-window threshold breach, old recovery point, blocked restore dependencies, budget overspend and missing allocation tags. Required evidence names are `restore_test`, `role_assignment_review`, `region_availability_review`; incomplete telemetry adds `complete_telemetry_windows`.

The evidence names are self-reported labels, not authenticated proof. Empty risks or missing-evidence lists must never be interpreted as approval, production readiness, security compliance or successful Azure testing. The conclusion always explicitly refuses such an inference.

## Official conceptual references

The accompanying research register reviewed these official pages on 2026-11-08. References support the concepts, not an assertion that these simplified functions implement Azure behavior. Read the exclusions above before using a receipt.

- **hierarchy**: [Azure Resource Manager overview](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/overview); [Manage Azure resource groups](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/manage-resource-groups-portal).

- **access**: [What is Azure RBAC?](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview); [Azure roles and Microsoft Entra roles](https://learn.microsoft.com/en-us/azure/role-based-access-control/rbac-and-directory-admin-roles).

- **governance**: [Lock Azure resources](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources); [Azure Policy overview](https://learn.microsoft.com/en-us/azure/governance/policy/overview).

- **storage**: [Azure Storage redundancy](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy); [Authorize access to Azure Storage](https://learn.microsoft.com/en-us/azure/storage/common/authorize-data-access); [Use private endpoints for Azure Storage](https://learn.microsoft.com/en-us/azure/storage/common/storage-private-endpoints).

- **network**: [Virtual network traffic routing](https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-udr-overview); [Network security groups](https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview); [Azure private endpoint DNS configuration](https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-dns).

- **compute**: [Choose an Azure compute service](https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/compute-decision-tree); [Virtual Machine Scale Sets overview](https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/overview).

- **monitoring**: [Azure Monitor overview](https://learn.microsoft.com/en-us/azure/azure-monitor/fundamentals/overview); [Azure Monitor activity log](https://learn.microsoft.com/en-us/azure/azure-monitor/fundamentals/activity-log); [Diagnostic settings in Azure Monitor](https://learn.microsoft.com/en-us/azure/azure-monitor/data-collection/diagnostic-settings).

- **recovery**: [Azure Backup overview](https://learn.microsoft.com/en-us/azure/backup/backup-overview); [About Azure Site Recovery](https://learn.microsoft.com/en-us/azure/site-recovery/site-recovery-overview).

- **cost**: [Create and manage Azure budgets](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets); [Use tags to organize Azure resources](https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/tag-resources).
