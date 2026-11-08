# Choose storage by interface, access pattern and recovery need

Distinguish object, block and shared-file requirements before comparing lifecycle and recovery tradeoffs.

## Learning goals

- Distinguish foundational object, block and shared-file access patterns.
- Reject a candidate that lacks a required interface.
- Separate capability matching from proven recoverability and real pricing.

## Learn

Storage selection starts with how the application reads and writes, not with a familiar product logo. Uploaded receipt assets can be independent objects addressed through an object API. A virtual machine boot volume needs block-device behavior. A group of compatible clients may need a shared filesystem. These are different interfaces and operating assumptions. An attractive price or durability statement cannot compensate for an interface the application does not support. Write the access pattern before looking at candidate services.

Foundational Amazon S3 object usage, Amazon EBS block storage and Amazon EFS shared file storage illustrate these distinctions. The workshop uses S3-shaped, EBS-shaped and EFS-shaped teaching records rather than full product descriptions. Current service portfolios and specialized offerings are broader than this introduction; do not infer that every AWS product fits a single immutable category. The comparison concerns the declared foundational capabilities only. Real selection still needs attachment, client, Region, performance and access-control details.

A capability ledger makes rejection useful rather than arbitrary. Our fixture requires object_api and independent_objects. The S3-shaped record declares both; the block and shared-file records do not. That is sufficient for a local match, but not for a final service recommendation. A real application may also require access latency, maximum object behavior, retention, encryption, concurrency or migration compatibility. Missing requirements can change a decision, so preserve them explicitly instead of claiming that two matched labels capture the workload.

Lifecycle decisions address retention and movement over time. Keeping every object indefinitely can increase retained storage and preserve data beyond its intended use. Expiring data too quickly can remove a needed recovery window. Different storage classes and access patterns can introduce retrieval and timing considerations. This exercise uses no real prices, transitions or retrieval measurements. Describe what must be checked rather than assuming that the lowest headline storage rate produces the lowest complete cost or meets the application response target.

Storage redundancy and recoverable history address different failures. Replication can preserve availability during some infrastructure failures while also copying an accidental deletion or corruption. A backup or version history may help recover an earlier state, but only when retention, access and the restore procedure are adequate. Verify expected content, not just the existence of a restored filename. This is a paper recovery discussion: the capability matcher does not create object versions, perform restoration or validate any provider durability claim.

Run the storage command to inspect the feasible and rejected candidates. Retain the requirements and missing-capability reasons so another learner can reproduce the decision. No S3 bucket, EBS volume or EFS filesystem is created or accessed. A real recommendation would require authorized service configuration review, workload measurements, current cost analysis and a restore exercise. Your conclusion should say that one teaching record meets two declared interface requirements, then identify the most important unanswered question before deployment.

## Worked example

Requirements object_api and independent_objects retain only S3-shaped. EBS-shaped and EFS-shaped are rejected because their declared capabilities do not meet this fixture. The result is a local interface match, not an S3 deployment or restore test.

```sh
# Local synthetic model only; no AWS calls or configuration.
python3 labs/aws-workshop/run_lab.py storage
```

Run from the workshop directory. Local Python only; no AWS credentials, calls, network or real configuration.

## Practice safely

1. Write the object API and independent-object requirements.
2. Predict why block and shared-file candidates will not match.
3. Run python3 labs/aws-workshop/run_lab.py storage.
4. Inspect feasible candidates and each missing-capability reason.
5. Write a lifecycle-versus-recovery tradeoff without inventing a price.
6. Record one performance, access or restoration check still needed.

## Evidence to keep

- A required-interface ledger.
- The feasible candidate and rejected-candidate reasons.
- A retention/recovery tradeoff and real-service validation checklist.

## Original check 1

Why does S3-shaped remain feasible in this fixture?

A. It is guaranteed to be cheapest
B. A real bucket was tested
C. It declares both required object capabilities
D. All storage interfaces are identical

<details><summary>Answer and reasoning</summary>

C. It declares both required object capabilities

The local match compares declared requirements with declared capabilities, not price or actual service behavior.

</details>

## Original check 2

What is stronger recovery evidence than seeing a filename return?

A. Changing the resource label
B. Assuming every replica is a backup
C. Reading only the cost subtotal
D. Verifying expected recovered content

<details><summary>Answer and reasoning</summary>

D. Verifying expected recovered content

Recovery needs content integrity and usability checks, which this capability exercise does not execute.

</details>

## Original check 3

What should follow a two-capability local match?

A. Review missing performance, access, retention and recovery requirements
B. Deploy without review
C. Treat all quotas as unlimited
D. Claim an AWS restore succeeded

<details><summary>Answer and reasoning</summary>

A. Review missing performance, access, retention and recovery requirements

A narrow interface match is useful but leaves substantial service-specific and operational requirements unresolved.

</details>

## Limits

No S3, EBS or EFS configuration, transfer, lifecycle transition, access check, version history, durability measurement or restore occurs. Candidate labels are not complete AWS product descriptions.

## Official references

- https://docs.aws.amazon.com/decision-guides/latest/decision-guides/choosing-aws-storage-service.html
- https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_planning_for_recovery_disaster_recovery.html
