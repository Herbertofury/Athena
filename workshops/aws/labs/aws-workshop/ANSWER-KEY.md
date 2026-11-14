# Worked answers and reasoning

These answers refer to the bundled synthetic fixture. Paper variations are reasoning exercises, not CLI options. No AWS actions were executed.

## 1. Identity

Base result: `decision=approval_required`, `matching_allows=[reader]`, `matching_denies=[]`, `missing_approvals=[owner]`. The write deny does not match a read request. Supplying owner approval changes this toy decision to allow. Adding an exact read/orders deny changes it to deny regardless of that approval. Removing all allows also denies; an approval is not a grant.

Missing AWS evidence includes applicable identity/resource policies, principal type, organizations controls, permissions boundaries, session policies and conditions. Real IAM evaluation cannot be inferred from this toy list.

## 2. Network

`route_path=[client, edge, app, db]`, `permitted_path=null`, `reachable=false`; `routed_but_not_allowed=[[app, db]]`. Add the last allow edge and the same path becomes permitted. Remove edge → app from routes and both paths disappear, even if all allows remain. Reverse direction and there is no path in the fixture.

A real connection requires far more: actual routes and destination selection, security-group/NACL behavior, ports, application listener/health, DNS and return-path checks. The graph has neither stateful connection tracking nor stateless ACL ordering, and models no NAT gateway mode.

## 3. Storage

`feasible=[S3-shaped]`, `nearest=[S3-shaped]`, `ambiguous=false`, `recommendation=null`. EBS-shaped and EFS-shaped each miss both `independent_objects` and `object_api` in this declared matrix.

For `shared_files,nfs`, EFS-shaped is the only feasible option. For `object_api,block_device`, none is feasible: EBS-shaped misses object_api and S3-shaped misses block_device, tying at one missing requirement each. EFS-shaped misses both. A nearest partial match is not a sufficient design.

The S3-shaped candidate is specifically the foundational object API pattern. This is not an exhaustive assertion about newer S3 products. Actual storage selection also needs consistency/access behavior, throughput/latency, resilience, lifecycle, encryption/key recovery and cost requirements.

## 4. Compute

`feasible=[function-shaped, managed-container-shaped]`, `nearest` is the same, `ambiguous=true`, `recommendation=null`. VM-shaped misses both original requirements.

Adding long_lived_process leaves managed-container-shaped feasible in this matrix. That describes these selected configurations, not every current function/workflow offering. Both the function-shaped and managed-container-shaped candidates also declare container_image; packaging alone does not resolve their tie. Requiring host_control alone selects VM-shaped here and brings guest operating-system/capacity responsibilities into the discussion.

Useful next evidence includes a representative workload benchmark, invocation/workflow duration and state needs, supported runtimes/integrations, cold-start tolerance, concurrency and cost at realistic traffic. Serverless does not remove application, data or security responsibilities. Container orchestration is a separate choice from compute capacity.

## 5. Queues

Delivery trace:

1. order-1 attempt 1: `applied`; 1,200 cents committed; no acknowledgment; pending.
2. order-1 attempt 2: `duplicate_suppressed`; no new amount; acknowledgment received; terminal.
3. order-2 attempt 1: `handler_failed`; no amount; pending.
4. order-2 attempt 2: `handler_failed`; no amount; pending.
5. order-2 attempt 3: `handler_failed`; no amount; dead-lettered.

Totals: `total_cents=1200`, `applied=[order-1]`, `acknowledged=[order-1]`, `dead_letter=[order-2]`, `pending=[]`; attempts are order-1: 2, order-2: 3.

With threshold one and one successful delivery whose acknowledgment is lost, order-1 is **both applied and dead-lettered**. That is not a contradiction: business effect and delivery acknowledgment are different facts. The model assumes effect and deduplication record commit atomically. A real external payment could succeed while a local record fails, so a naive retry could duplicate the effect. Use appropriate business keys, transactional patterns or provider idempotency mechanisms and verify their failure behavior. This exercise is not an exactly-once service guarantee or an SQS receive-count implementation.

## 6. Databases

`feasible=[multi-az-cluster-shaped, read-replica-shaped]`, `ambiguous=true`. The single-instance-shaped and multi-az-instance-shaped options each miss read_scaling. Add standby_failover and only multi-az-cluster-shaped satisfies all three declared capabilities.

RDS Multi-AZ **DB instance** has a standby that does not serve reads. Multi-AZ **DB cluster** has readable standby instances. A selected conventional read-serving replica design can scale reads, but not every engine/replica mode does; engine-specific mounted/standby variants exist. Do not generalize fixture labels into universal provider guarantees. Read-after-write correctness may require writer routing, application consistency handling or another verified mechanism. Availability, freshness and read throughput are distinct design goals.

## 7. Resilience

`survivors=[app-3]`, `capacity_count_sufficient=false` because 1 < 2. `restore_within_rto=true` because 45 ≤ 60. `backup_within_rpo=false` because 20 > 15.

Moving app-2 to zone-b gives two surviving replicas and meets the count requirement; it leaves the recoverable-point age unchanged, so the RPO still misses. With restore=60 and age=15, both comparisons pass by equality. These comparisons use supplied scenario measurements and do not perform a restore.

A real drill must include routing, permissions, keys, dependencies, data consistency/correctness, restore duration, available capacity, monitoring and service acceptance checks. Multiple copies in one failure domain do not create independent failure protection. Replication alone may copy corruption or deletions.

## 8. Operations

- CloudWatch: e1, the fictional latency metric.
- CloudTrail: e2, the fictional API activity record.
- AWS_Config: e3, the fictional configuration-change record.
- unclassified: e4, the customer report. It is preserved, not discarded.

E1 is a symptom, e2 gives actor/action context, e3 helps explain configuration state. Time correlation does not prove cause. Increased traffic, an unrelated downstream failure or a bad deployment are competing hypotheses; compare telemetry and changes, inspect traces/logs, and test a bounded hypothesis before concluding. Collection coverage, instrumentation, retention and access must be verified. Real records may also be exported between these services, so these buckets are not exclusive provenance guarantees.

## 9. Cost

- compute-hours: 100 × $0.12 = $12.00 = 1,200 cents.
- storage-gb-month: 50 × $0.02 = $1.00 = 100 cents.
- transfer-gb: 10 × $0.09 = $0.90 = 90 cents.
- Total: **1,390 cents ($13.90)**.
- Budget: 1,300 cents; `threshold_reached=true`, `over_budget_cents=90`, `spending_cap=false`.

Another 50 compute-hours adds 600 cents and raises the estimate to 1,990 cents. The comparison stops nothing. Real AWS Budgets may notify or invoke configured actions, but delays/overshoot mean a threshold is not a guaranteed hard cap.

Two $0.005 lines each round half-up to one cent, totaling two cents. Rounding only their combined $0.010 would give one cent; the chosen policy matters. Neither policy is asserted to be AWS billing behavior.

Potential omissions: requests, logs, backups, idle fixed charges, inter-region/data-transfer paths, tax, discounts, free tier and licenses. Obtain actual usage units, service/region/engine choices, current published rates and billing rules before estimating real spend.

## 10. Capstone

The exact ordered issue list is:

1. identity_not_allowed
2. network_path_blocked
3. compute_tradeoff_unresolved
4. database_tradeoff_unresolved
5. queue_redrive_review_needed
6. capacity_count_sufficient_failed
7. backup_within_rpo_failed
8. budget_threshold_reached

Storage has one feasible option in the given matrix; that is not an endorsement for a full workload. Restore time meets its given target while backup age and capacity count do not. `deployment_approved=false` remains unconditional.

A worked review note:

- **Operational excellence:** Assign a redrive owner and reconciliation runbook. Reject blind replay. Test a committed-effect/lost-ack scenario. Residual risk: an external side effect may not share a transaction with local deduplication.
- **Security:** Require owner approval plus the actual least-privilege policy evaluation. Reject approval-as-permission. Validate applicable principal, identity/resource and limiting policies. Residual risk: a policy or data classification assumption may be incomplete.
- **Reliability:** Spread capacity across required failure domains and improve restorable-point freshness. Reject replica count as proof of recovery. Run a restore/dependency drill against RTO/RPO. Residual risk: correlated dependencies or corruption can defeat nominal redundancy.
- **Performance efficiency:** Benchmark both feasible compute patterns and the candidate reader designs. Reject a universal serverless or database winner. Measure latency, throughput, concurrency and read freshness. Residual risk: benchmark traffic may miss production bursts.
- **Cost optimization:** Include requests, logs, backup and transfer details with current rates. Reject the $13.00 alert threshold as a cap. Reconcile quantities and expected charges. Residual risk: demand spikes or omitted charge categories.
- **Sustainability:** Measure idle capacity and duplicate work, then reduce avoidable use within recovery targets. Reject unmeasured downsizing. Compare utilization and work completed before/after. Residual risk: insufficient failover capacity.

One defensible investigation order is (1) access and network prerequisites, since the intended path is currently not permitted, then (2) restoration/data-age and failure-domain evidence, because data loss and inability to recover are high-impact uncertainties. Different workload priorities can justify another order if explicitly stated.

Outstanding platform evidence includes actual policy evaluation, bidirectional connectivity tests, representative benchmarks, a restore drill, current regional pricing, and a security/compliance review. The issue list is not exhaustive and no local receipt establishes certification readiness or production approval.
