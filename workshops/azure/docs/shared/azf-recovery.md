# Plan a restore around data loss and dependencies

Separate backup copies, disaster recovery and proof that a restored application works.

## Learning goals

- Distinguish RPO from RTO and successful restore evidence.
- Order recovery by dependencies and expose missing prerequisites.
- Explain why a stored backup is not a completed recovery test.

## Learn

Recovery planning begins with business tolerances rather than a product selection. Recovery point objective describes the acceptable amount of data loss measured in time; recovery time objective describes how long restoring service may take. A backup schedule can contribute to meeting those objectives, but it does not prove either one. Restore duration, application dependencies, access requirements and validation all matter. Ask what the business must be able to do after recovery, not merely whether a backup file or recovery point exists.

Azure Backup protects supported workloads through service-specific backup and restore capabilities. Azure Site Recovery supports disaster-recovery replication and orchestration for supported machines and scenarios. They are related but not interchangeable. A replicated workload can support continuity after an infrastructure failure, while recovering an earlier version after unwanted changes may require a suitable retained recovery point. Choose protections by failure scenario and supported workload rather than assuming any service with “recovery” in its name covers every outage, corruption or deletion.

Restore ordering exposes dependencies. A database may require network connectivity before it can be reached, and an application may require the database before its own health checks can pass. Identity, name resolution, certificates and external services can add further prerequisites. Draw a dependency graph and identify what must be ready before each component is useful. A valid topological order is planning evidence only; it does not measure startup duration or establish that the restored components communicate correctly with each other.

A recovery point older than the allowed data-loss interval misses the modeled RPO even if a restore command would otherwise succeed. That mismatch deserves a clear finding rather than a reassuring statement that backups exist. Conversely, meeting a freshness requirement says nothing about restore duration, application consistency or completeness of the selected data. Keep freshness, restorability and service validation as separate acceptance conditions. A real exercise would compare restored data with expected business records and document any reconciliation work needed before reopening service.

The fictional graph orders network before database before application and reports no missing dependencies in its supplied set. Its recovery-point age still exceeds the target, so rpo_met is false. Do not add an invented successful restore or a measured recovery time to this receipt. The model never creates backup copies or boots a recovered workload. Its useful finding is that a seemingly orderly plan can still violate the business data-loss requirement, leaving a concrete issue for the owner to resolve.

Run the recovery command and preserve both the dependency order and the failed freshness check. Then create a paper acceptance checklist for a future authorized restore test: identify the recovery point, validate representative records, confirm application behavior and measure service restoration time. No test is scheduled or executed here. Recovery administration is enrichment beyond selected foundational concepts. This workshop cannot establish an actual RPO, RTO, backup immutability guarantee, disaster-recovery capability or permission to perform failover in a real environment.

## Worked example

The fixed receipt returns restore_order [network, database, app], missing_dependencies [] and rpo_met false. Explain why a complete dependency list does not rescue the failed freshness requirement. In the paper alternative, a newer recovery point would satisfy the age condition, but restoration and business validation would still be unperformed. Prepare acceptance criteria for a representative report, its database records and application access without inventing a measured recovery time or claiming a restore succeeded.

```sh
# Offline synthetic model only; no Azure operations.
python3 labs/azure-workshop/run_lab.py recovery
```

Run from the workshop directory. Local Python only; no Azure credentials, calls, network or real configuration.

## Practice safely

1. Read the fixed recovery fixture and write your prediction before running anything.
2. Draw the decision boundary and list the Azure conditions this local model omits.
3. From the workshop directory run python3 labs/azure-workshop/run_lab.py recovery.
4. Compare the receipt with your prediction and retain disagreements rather than editing evidence.
5. Work the alternative in the example on paper only; label it unexecuted.
6. Save the receipt and the three evidence items, with a list of unperformed real Azure validations.

## Evidence to keep

- A dependency graph matching the fixed restore_order.
- A retained failed RPO finding without an invented RTO.
- A paper restore-acceptance checklist covering data and application behavior.

## Original check 1

Which statement best describes RPO?

A. The number of administrator accounts
B. The acceptable data-loss interval
C. The guaranteed uptime of a replica
D. The length of every restore command

<details><summary>Answer and reasoning</summary>

B. The acceptable data-loss interval

RPO concerns tolerated data loss, while RTO concerns restoration time.

</details>

## Original check 2

A recovery point is fresh enough. What remains unproven?

A. That its age can be compared
B. That an objective can be recorded
C. That restoration completes and the application works
D. That a plan can list dependencies

<details><summary>Answer and reasoning</summary>

C. That restoration completes and the application works

Freshness alone does not prove restorability, timing or application correctness.

</details>

## Original check 3

Why restore network before database in this fixture?

A. Every Azure database always has this exact graph
B. The model measured the fastest order
C. Application authentication is unnecessary
D. The supplied dependency graph requires that order

<details><summary>Answer and reasoning</summary>

D. The supplied dependency graph requires that order

The ordering is derived from the fictional graph and is not a universal service sequence.

</details>

## Limits

No backup, replication, failover or restore occurs. The dependency model does not simulate Azure Backup or Site Recovery, application consistency or recovery duration.

## Official references

- https://learn.microsoft.com/en-us/azure/backup/backup-overview
- https://learn.microsoft.com/en-us/azure/site-recovery/site-recovery-overview
