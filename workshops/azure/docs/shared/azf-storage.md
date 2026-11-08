# Choose durability without confusing it with permission

Compare storage redundancy, access and recovery as separate requirements.

## Learning goals

- Distinguish local, zonal and geographic redundancy.
- Separate account access from object authorization.
- Explain why replication does not replace recovery controls.

## Learn

A reporting archive has several independent requirements: retain bytes during failures, restrict readers, serve authorized requests and recover from mistakes. Azure Storage redundancy choices primarily address the durability and availability of replicated data across specified failure boundaries. They do not decide who should read the reports. Access mechanisms, network controls and recovery features answer other questions. Start with a requirement ledger so that a strong answer about one dimension does not conceal an unanswered question about another dimension.

Locally redundant storage keeps copies within a single physical location in the primary region. Zone-redundant storage distributes copies across availability zones in a supported primary region. Geo-redundant options add replication to a secondary region, with differences in primary-region zone protection and whether secondary reads are available. These labels are not a universal ranking. Supported account types, regions, services and required operations affect the choice. A requirement for secondary reads should be explicit rather than inferred from the word “geo.”

Geographic replication is asynchronous, so a secondary copy can lag behind the primary. A regional failure can therefore involve data loss relative to the latest accepted writes, depending on service state and recovery procedure. Redundancy also replicates legitimate changes and may replicate unwanted changes. An accidentally overwritten report is not necessarily recovered by selecting a more geographically distributed option. Versioning, soft delete, backup or other service-specific protections should be evaluated against the deletion and corruption scenarios the archive actually faces.

Authentication and authorization need a separate decision. Microsoft recommends Microsoft Entra authorization where supported; shared keys and delegated tokens have different handling and exposure risks. A network path to a storage endpoint does not itself grant data access. Conversely, an authorized identity can still fail because network access or name resolution is incorrect. Record the expected principal, operation, endpoint and access mechanism. Avoid copying credentials into a classroom example or treating an account management role as blanket permission to read every object.

The fixed model compares a short list of fictional option capabilities against required features. It selects RA-GZRS for its secondary-read and zone-resilience requirements, while listing missing capabilities for alternatives. That result is not a recommendation for every archive or a guarantee that RA-GZRS is available for the intended account and region. Real selection would include service support, consistency implications, costs, failover behavior and data residency constraints. Those validations remain outside this local exercise and must not be silently assumed.

Run the storage command and explain each missing requirement in ordinary language. Then consider a paper-only archive whose retrieval deadline tolerates waiting for recovery and whose budget is constrained. Reassess requirements before choosing an alternative; do not simply select the cheapest label. Preserve the executed receipt separately from that discussion. This administrative trade-off analysis enriches AZ-900 storage concepts but does not configure a storage account, validate access, measure replication lag or demonstrate readiness to operate a real Azure archive.

## Worked example

The actual fixture asks for secondary_read and zone_resilience. LRS misses both; ZRS misses secondary_read; matching_options contains RA-GZRS. Explain why satisfying those two model flags leaves permissions and accidental deletion unresolved. In the paper alternative, the owner removes the secondary-read requirement but still requires zone protection. ZRS becomes a candidate in the simplified comparison, not an automatically approved real deployment. Record that candidate and the region, service and recovery checks needed before selecting an actual account configuration.

```sh
# Offline synthetic model only; no Azure operations.
python3 labs/azure-workshop/run_lab.py storage
```

Run from the workshop directory. Local Python only; no Azure credentials, calls, network or real configuration.

## Practice safely

1. Read the fixed storage fixture and write your prediction before running anything.
2. Draw the decision boundary and list the Azure conditions this local model omits.
3. From the workshop directory run python3 labs/azure-workshop/run_lab.py storage.
4. Compare the receipt with your prediction and retain disagreements rather than editing evidence.
5. Work the alternative in the example on paper only; label it unexecuted.
6. Save the receipt and the three evidence items, with a list of unperformed real Azure validations.

## Evidence to keep

- A requirement ledger covering redundancy, access and recovery.
- An annotated matching_options and missing_requirements comparison.
- A paper alternative with explicit regional and service support gaps.

## Original check 1

What does geographic redundancy fail to guarantee?

A. Additional geographic copies
B. Recovery from every accidental overwrite
C. A distinction from local redundancy
D. A potential secondary recovery location

<details><summary>Answer and reasoning</summary>

B. Recovery from every accidental overwrite

Replication and recovery from unwanted changes are different requirements.

</details>

## Original check 2

Why does the fixed comparison select RA-GZRS?

A. It is always free
B. It automatically grants data access
C. It matches both supplied feature requirements
D. It is supported by every account type

<details><summary>Answer and reasoning</summary>

C. It matches both supplied feature requirements

The result follows the fixture flags, not universal availability or suitability.

</details>

## Original check 3

An authorized reader cannot reach the endpoint. What else matters?

A. Only the resource group name
B. Whether the budget is green
C. Whether replicas grant a password
D. Network path and name resolution

<details><summary>Answer and reasoning</summary>

D. Network path and name resolution

Authorization and connectivity are independent conditions for successful access.

</details>

## Limits

No storage account, redundancy change, object read or replication measurement occurs. The capability table is simplified; availability, pricing, failover behavior and authentication remain unverified for any real account.

## Official references

- https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy
- https://learn.microsoft.com/en-us/azure/storage/common/authorize-data-access
- https://learn.microsoft.com/en-us/azure/storage/common/storage-private-endpoints
