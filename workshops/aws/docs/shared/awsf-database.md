# Separate relational failover, read scaling and access patterns

Compare database architectures against explicit requirements rather than a single availability label.

## Learning goals

- Distinguish RDS Multi-AZ DB instance and DB cluster standby behavior.
- Separate read-replica scaling from failover and recovery requirements.
- Explain why multiple feasible candidates require further evidence.

## Learn

Database selection begins with the questions the application must answer and the invariants it must preserve. A receipt service may require relational transactions, joined reports, predictable key-based lookups or a mixture of patterns. Amazon RDS provides managed relational database options, while Amazon DynamoDB provides managed key-value and document storage with its own modeling choices. Managed operation does not make access-pattern design optional. Nor does a familiar service name prove that a particular query, transaction or consistency requirement is satisfied.

Availability and read scaling are related but different goals. An RDS Multi-AZ DB instance deployment has a standby for failover that does not serve read traffic. An RDS Multi-AZ DB cluster has two readable standby instances. The words Multi-AZ alone therefore do not identify the read-serving behavior. State the exact deployment form in your recommendation. This avoids a common mistake in which a learner applies the single-standby rule to every Multi-AZ offering or expects read capacity from the wrong configuration.

Readable DB instance replicas use asynchronous replication and can help serve reads; engine and replica-mode exceptions require verification. Replication lag matters when a user expects to read a change immediately after writing it. A read replica is not automatically equivalent to the failover arrangement of another deployment type, and promotion behavior depends on the actual architecture. Ask separately about writer failure, read throughput, acceptable staleness and recovery from a mistaken update. One feature label should not be allowed to answer all four questions without evidence.

Conventional Aurora architecture separates replicated cluster storage from writer and reader compute. Storage redundancy does not imply that an appropriately sized reader is already running and ready to take over under every failure. DynamoDB also requires deliberate key and access-pattern design; it is not a drop-in relational JOIN engine. This lesson does not rank all database products. Instead, it practices identifying when a requirement calls for detailed engine-specific investigation rather than a generic claim that a managed database solves everything.

The fictional decision model evaluates a bounded set of declared capabilities. Its fixture leaves both a Multi-AZ-cluster-shaped candidate and a read-replica-shaped candidate feasible. That ambiguity is useful: the inputs have not fully expressed every deployment and operational requirement. Do not pick the first row merely because it appears first. Add a written question about failover behavior, lag, recovery, engine support or measured load, and explain how the answer could eliminate a candidate or require combining capabilities.

The executable command compares local records; it creates no RDS instance, Aurora cluster or DynamoDB table. It does not run SQL, measure replica lag or initiate failover. Keep the feasible candidate list and the unresolved requirement together in your evidence. A real recommendation requires current engine and Region support, authorized measurements, an operating plan and actual recovery testing. The model’s ambiguity flag is not a defect to hide; it is a signal that responsible architecture still needs more information.

## Worked example

The local fixture retains multi-az-cluster-shaped and read-replica-shaped candidates and reports ambiguity. This is a simplified capability comparison, not a claim that those real AWS deployments offer identical failover, consistency or operating behavior.

```sh
# Local synthetic model only; no AWS calls or configuration.
python3 labs/aws-workshop/run_lab.py database
```

Run from the workshop directory. Local Python only; no AWS credentials, calls, network or real configuration.

## Practice safely

1. List relational, read, recovery and failure requirements separately.
2. Predict why a single Multi-AZ label is insufficient.
3. Run python3 labs/aws-workshop/run_lab.py database.
4. Record both feasible candidates and the ambiguity flag.
5. Write a missing requirement that would change the decision.
6. Explain the instance-standby versus cluster-standby distinction.

## Evidence to keep

- A requirement ledger separating reads, writes, failure and recovery.
- Both local candidates and an explicit ambiguity statement.
- A correct RDS deployment distinction and one next investigation.

## Original check 1

Which statement correctly distinguishes RDS deployment forms?

A. Every Multi-AZ standby is unreadable
B. Every Multi-AZ deployment has the same read behavior
C. A read replica always has zero lag
D. A Multi-AZ DB instance standby is not readable; DB cluster standbys can serve reads

<details><summary>Answer and reasoning</summary>

D. A Multi-AZ DB instance standby is not readable; DB cluster standbys can serve reads

The deployment form matters: the single standby DB instance and the two readable DB cluster standbys must not be conflated.

</details>

## Original check 2

What issue deserves attention with asynchronous read replicas?

A. Readers may observe replication lag
B. All writes necessarily disappear
C. The replica is always the writer
D. Every query becomes a relational JOIN

<details><summary>Answer and reasoning</summary>

A. Readers may observe replication lag

Asynchronous replication can expose stale reads, so the application’s consistency expectations need explicit review.

</details>

## Original check 3

Two model candidates remain feasible. What is the best next step?

A. Choose the first alphabetically
B. Identify missing requirements and collect decision-changing evidence
C. Claim their production behavior is identical
D. Declare a real failover test complete

<details><summary>Answer and reasoning</summary>

B. Identify missing requirements and collect decision-changing evidence

A bounded comparison can leave multiple candidates because important engine, recovery and operational requirements remain unspecified.

</details>

## Limits

No database engine, query, transaction, replica, lag measurement, failover or restoration is executed. Candidate labels are teaching records, not deployable configurations or verified service equivalence.

## Official references

- https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html
- https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_ReadRepl.html
- https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.AuroraHighAvailability.html
- https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html
