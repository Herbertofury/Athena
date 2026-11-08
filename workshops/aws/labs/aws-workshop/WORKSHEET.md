# Predict, inspect, defend

Use synthetic data only. No AWS account or resource is required. Run commands from the AWS workshop folder. Keep answers in your own notes; the CLI does not store your work.

For every exercise record **prediction → observed local result → explanation → missing AWS evidence**. A matching answer proves you understand a toy model, not that a deployed architecture is secure or reliable.

## 1. Identity: permission and approval are different questions

Run: `python3 labs/aws-workshop/run_lab.py identity`

A request wants `read` on `orders`. Rule `reader` allows exactly that pair. Rule `write-guard` denies `write` on `orders`. An owner approval is required but not supplied.

1. Predict the decision, matched deny IDs and missing approvals. Does an unrelated write deny block a read?
2. On paper, add owner approval. Then add a new explicit read-deny rule. Explain the decision after each change.
3. Remove all allow rules but keep approval. Can approval create permission?
4. Name two AWS policy contexts this exact-match model does not evaluate.

Success evidence: distinguish an absent approval from a deny, and distinguish either from a real IAM authorization decision.

## 2. Network: a route is only one prerequisite

Run: `python3 labs/aws-workshop/run_lab.py network`

Routes connect client → edge → app → db. Allows connect client → edge → app, with no app → db allow edge.

1. Predict both paths and the reachable flag.
2. On paper, add app → db to allows. Then remove edge → app from routes. Why does adding an allow edge not repair a missing route?
3. Reverse source and target. Does the directed graph imply return connectivity?
4. Identify three real checks the toy graph omits. Explain why a route path alone is not a successful application request.

Success evidence: state the exact missing prerequisite without claiming a VPC packet test happened.

## 3. Storage: choose by access pattern

Run: `python3 labs/aws-workshop/run_lab.py storage`

Requirements are `object_api` and `independent_objects`. The three fictional candidates expose object, block-device or shared-NFS capabilities.

1. Predict the feasible candidate and the unmet requirements for EBS-shaped.
2. On paper, replace requirements with `shared_files` and `nfs`. Which candidate fits the supplied matrix?
3. Require both `object_api` and `block_device`. Is there a feasible candidate? Which nearest candidates tie, and why is that not permission to choose either?
4. Explain why an object API design should not be treated as an attached disk. What availability, data-protection or performance evidence is still missing?

Success evidence: make a requirements-based comparison while leaving evolving service portfolios and unsupported capabilities outside the model.

## 4. Compute: preserve a legitimate tie

Run: `python3 labs/aws-workshop/run_lab.py compute`

The fixture asks for `event_triggered` and `no_host_management`. Both function-shaped and managed-container-shaped designs declare these capabilities.

1. Predict feasible IDs, ambiguity and recommendation.
2. On paper, add `long_lived_process` as a requirement. Which candidate remains feasible according to this particular matrix?
3. Instead require `host_control`. Which candidate fits and which operational responsibility returns?
4. Propose two discriminating measurements for the original tie: for example observed startup latency, workload duration, deployment/runtime constraints or cost at representative load. Avoid hardcoded universal runtime limits.

Success evidence: choose the next useful question instead of inventing a universal winner.

## 5. Queues: effect, acknowledgment and redrive

Run: `python3 labs/aws-workshop/run_lab.py queues`

Order-1 is worth 1,200 cents. Its first handler succeeds but acknowledgment is lost; its second delivery succeeds and acknowledges. Order-2 is worth 800 cents and fails three times. The attempt threshold is three.

1. Trace each delivery with ID, attempt, business effect, acknowledgment and resulting state.
2. Predict total cents, applied IDs, acknowledged IDs, dead-letter IDs and pending IDs.
3. On paper, set the threshold to one for a single successful delivery with a lost acknowledgment. Can one message appear in both applied and dead-letter sets?
4. Explain the atomicity assumption. What could happen if an external effect succeeds but the deduplication record is not committed?
5. Explain why redriving a dead-letter message requires checking the business effect, not merely counting handler failures.

Success evidence: no duplicate business addition in this model, with the limitations of that result explicitly stated.

## 6. Databases: availability and read scaling are different requirements

Run: `python3 labs/aws-workshop/run_lab.py database`

Requirements are `relational` and `read_scaling`. Candidates describe a single instance, a Multi-AZ DB instance, a selected read-serving replica design, and a Multi-AZ DB cluster design.

1. Predict feasible IDs. Why is the Multi-AZ DB instance-shaped option not feasible for these requirements?
2. On paper, add `standby_failover`. Which supplied candidate remains feasible?
3. Explain why “all Multi-AZ standbys cannot serve reads” is incorrect. Explain why “every kind of RDS replica serves reads” is also too broad.
4. For a reader that may lag, what does read-after-write correctness require the application/design to decide?

Success evidence: state deployment type precisely and avoid equating read scaling, failover and data consistency.

## 7. Resilience: count domains and compare measured evidence

Run: `python3 labs/aws-workshop/run_lab.py resilience`

App-1 and app-2 share zone-a; app-3 is in zone-b. Zone-a fails. Two survivors are required. Given restore time is 45 minutes, recoverable-point age is 20 minutes, target RTO is 60 and target RPO is 15.

1. Predict survivors and all three boolean results. Which targets pass and which fail?
2. Move app-2 to zone-b on paper. Does survivor count improve? Does that fix the RPO miss?
3. Set given restore time to 60 and recoverable-point age to 15. How does equality behave?
4. Name dependencies a real restore drill must exercise beyond replica count. Explain why “we have three replicas” is insufficient evidence.

Success evidence: distinguish failure-domain placement, availability, restoration time and recoverable data age.

## 8. Operations: find evidence without inventing causation

Run: `python3 labs/aws-workshop/run_lab.py operations`

The fixture contains e1 (latency metric), e2 (deployment API action), e3 (configuration change) and e4 (customer timeout report).

1. Predict the four source categories and explain the unclassified item.
2. Which item gives a symptom? Which gives actor/action context? Which helps reconstruct resource configuration?
3. Does a change preceding a spike prove it caused the spike? Write an alternative hypothesis and a next investigation step.
4. Explain what evidence collection, retention and source coverage must be established in a real workload.

Success evidence: classify the fictional records while labeling causal conclusions unverified.

## 9. Cost: exact arithmetic, incomplete estimate

Run: `python3 labs/aws-workshop/run_lab.py cost`

All rates are invented: 100 compute-hours at $0.12, 50 GB-month at $0.02, 10 transfer-GB at $0.09. The comparison budget is $13.00.

1. Calculate each line in cents, total, threshold flag and over-budget cents.
2. On paper, add 50 more compute-hours at the same rate. How much does the estimate increase? Does the threshold stop usage?
3. Two separate extended lines are each $0.005. Under the contract's line-rounding rule, what total is produced? Why must a financial model state its rounding policy?
4. List four omitted cost drivers or billing adjustments. Which current pricing and quantity evidence would turn this into a useful real estimate?

Success evidence: exact synthetic arithmetic without presenting it as an AWS quote or cap.

## 10. Capstone: an evidence bundle, not a score

Run: `python3 labs/aws-workshop/run_lab.py capstone`

1. Predict the eight issue labels, then reconcile them against the nine model results.
2. Write a short design-review note using the six Well-Architected pillars. For each pillar provide: one proposed decision, a rejected alternative, a required measurement/test and a residual risk.
3. Choose two highest-priority next investigations and justify their order using impact and uncertainty, not just issue count.
4. Explain why resolving every synthetic issue would still not justify `deployment_approved: true`.

Suggested review frame:

- Operational excellence: who owns the queue redrive runbook and its audit trail?
- Security: who approves access, and what actual policy evaluation evidence is needed?
- Reliability: how will restore/dependency behavior and corrupt-data recovery be tested?
- Performance efficiency: which representative benchmark resolves the compute/database tie?
- Cost optimization: which unlisted usage and current rates materially change the estimate?
- Sustainability: which measured idle capacity or unnecessary processing can be reduced without harming recovery targets?

Success evidence: a defensible next-step plan with named uncertainties. Completion is not an exam-readiness or production-readiness claim.
