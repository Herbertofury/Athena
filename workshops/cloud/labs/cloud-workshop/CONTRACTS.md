# Offline model contracts

The functions in `lab.py` are original teaching models. They do not reproduce vendor APIs. They return new results, leave supplied inputs unchanged and raise `ValueError` for input outside their stated bounds. Exact error wording is not part of the contract. All numeric input described as integer requires an exact Python `int`, excluding booleans.

## Scope

`scope_contains(scope, resource)` accepts two invented paths of 1–200 characters, with 1–8 slash-separated segments. A segment starts with a lowercase ASCII letter followed by at most 31 lowercase letters, digits or hyphens. Empty, dot, leading/trailing-slash and uppercase segments are invalid. Containment requires the complete scope segment sequence to be the resource’s initial sequence. Equality counts as containment. It is not string-prefix matching or effective authorization.

## Connection gates

`connection_checks(route_present, network_allows, service_listening, identity_allows)` accepts exact booleans. It returns the assumptions, `all_assumed_gates_pass` and the failed assumption names in that parameter order. It does not check reality, send traffic or infer an order of diagnosis from timing.

## Replica planning

`replica_plan(demand_rpm, capacity_rpm, target_percent, minimum, maximum)` accepts demand 0–1,000,000 rpm; capacity 1–1,000,000 rpm per replica; target 1–100 percent; minimum and maximum 0–1000 replicas with minimum ≤ maximum.

Needed-at-target is the ceiling of demand × 100 / (capacity × target_percent). Planned replicas clamp that count to the minimum and maximum. The return includes needed/planned counts, target capacity, physical capacity, whether each meets demand and whether the maximum capped the needed count. Comparisons use integer cross-multiplication; displayed target capacity can be a float. A zero-demand/zero-replica plan meets both arithmetic capacity checks. No warm-up, queue, dependency, instance weights, quota, availability or performance prediction is included.

## Failure scenario

`failure_report(placements, failed_zones, demand_rpm, capacity_rpm, target_percent)` accepts 1–1000 placement strings matching `zone-a` through `zone-z`. Each list entry is one replica. Failed zones must be a list of zones present in placements; repeated failure names have the same effect as one occurrence. Demand, capacity and target have the replica-planning bounds. Remove all replicas in failed zones, then compute before/after target capacity and remaining physical capacity checks. The return includes sorted unique represented/failed zone lists. No probabilities, SLA, failover or correlated dependencies are modeled.

## Recovery timeline

`recovery_report(last_recoverable_minute, incident_minute, restored_minute, rpo_target_minutes, rto_target_minutes)` accepts integers 0–1,000,000 with recovery point ≤ incident ≤ restoration. Data gap = incident minus recoverable point. Downtime = restoration minus incident. Meeting an objective includes equality. It reports each interval, target and comparison. The inputs are synthetic timestamps relative to one fixed origin, not date parsing or measurement of cloud events.

## Cost arithmetic

`cost_estimate(...)` accepts eight integer values 0–1,000,000: replicas, hours, compute_credits_per_replica_hour, storage_gib_months, storage_credits_per_gib_month, egress_gib, egress_credits_per_gib, budget_credits. The three components are replicas × hours × compute rate, storage usage × storage rate and egress usage × egress rate. Total is their exact integer sum. `within_budget` includes equality; `difference_from_budget` is total minus budget, so negative means below budget. Rates are fictional credits, not currency. Storage usage is an already aggregated GiB-month quantity, not inferred from compute runtime. No taxes, tiered rates, requests, discounts, commitments or provider billing behavior are modeled.

## Inventory change report

`plan_changes(before, after)` accepts lists of at most 100 resources. Each resource has exactly `id`, `kind`, `size`, `public`. ID is a lowercase-letter-led identifier of at most 32 ASCII lowercase letters, digits or hyphens; duplicates within either list are invalid. Kind is `compute` or `storage`; size is integer 1–1000; public is exact boolean. Size is an abstract schema quantity, not a portable cloud SKU.

IDs sort lexically. Missing old ID means add; missing new ID means remove. For retained IDs, changed fields sort lexically. Kind changes are modeled as replace; otherwise changes mean modify. Unchanged entries produce no change. All removals receive a risk note; replacements receive a risk note; new public resources or false-to-true public changes receive exposure notes. Risk notes are prompts, not an exhaustive risk assessment. Result always has `applied: false`; there is no apply function.

## Actual local restore

`restore_roundtrip()` has no inputs. It creates an owned temporary directory, writes fixed synthetic report bytes, makes an earlier copy, changes the source and writes the copy to a separate restore file. SHA-256 checks the backup/restored bytes against the original digest. It reports those checks, current-source difference, byte counts and cleanup after the context closes. It does not return a reusable path, inspect user files or simulate cloud storage semantics.

## Fixed wrapper

`run_lab.py` accepts only scope, network, scaling, failure, recovery, cost, changes or restore. The fixture file path is fixed; reads are capped at 32768 bytes. The restore command needs no fixture. No arbitrary path, URL, credential or provider is accepted. JSON stdout identifies local model versus actual local file exercise and always marks real-cloud execution false. Unexpected programming errors remain visible rather than being disguised as provider success.
