# Athena AWS foundation: objective map and teaching facts

Reviewed 2026-11-08. Source numbers refer to aws-source-register.md. “Maps to” means a lesson addresses part of an official task, not that it covers the task completely or demonstrates exam readiness. Ten lessons should use synthetic scenarios only. No account setup, deployment, credentials or live billing required. CLF explicitly excludes architecture design, implementation, troubleshooting and performance testing from target-candidate tasks; the architecture/debugging exercises here are SAA-oriented enrichment, not CLF implementation requirements.

## Official objective source pages

All eight pages were opened and reviewed on 2026-11-08. These are supplementary objective references beyond the 25-entry core register.

- CLF domain 1: https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain1.html
- CLF domain 2: https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain2.html
- CLF domain 3: https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain3.html
- CLF domain 4: https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02-domain4.html
- SAA domain 1: https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03-domain1.html
- SAA domain 2: https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03-domain2.html
- SAA domain 3: https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03-domain3.html
- SAA domain 4: https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03-domain4.html

## Ten-lesson map, facts, and evidence exercises

### 1. Identity and responsibility

Facts: Service choice shifts operational responsibility; it does not remove customer responsibility for data and permissions. Start from least privilege and distinguish authentication from authorization. Applicable explicit deny overrides allow. Permissions boundaries and organization controls constrain grants rather than replace an access grant. Same-account resource policies and role-session nuance prevent a universal simplistic policy equation. Sources 5–6.

Exercise: Given a fictional principal, action, resource and three policy snippets, explain a denied request and propose the narrowest permission correction without deleting the protective deny. Compare EC2 guest OS patching with managed service responsibilities.

Map: CLF 2.1 (responsibility), 2.3 (identity/access); SAA 1.1 (secure resource access). Partial extension to CLF 2.2 and SAA 1.3 only if data controls are explicitly taught. Gaps: federation, cross-account trust, root-only actions, MFA implementation, KMS key policies, organization strategy.

### 2. Trace the network path

Facts: Routes choose targets; security groups and NACLs filter different scopes. Security groups are stateful; NACLs stateless and ordered. Return traffic must be considered for NACLs. Private-subnet outbound internet access can use public NAT plus internet gateway. A private NAT gateway is not an internet NAT gateway. Native IPv6 outbound-only traffic has an egress-only internet gateway option. Sources 7–9.

Exercise: Trace request and response through a fictional route table, resource rules and subnet ACL, locating one missing route and one blocked return port. Do not suggest globally open ingress as a repair.

Map: CLF 3.5 (network services); SAA 1.2 (workload security), 3.4 (network performance), 4.4 (network cost, only if egress/topology costs are evaluated). Gaps: DNS/Route 53 policies, CIDR design, VPC endpoints, hybrid VPN/Direct Connect, PrivateLink, load balancers, CloudFront/Global Accelerator.

### 3. Choose storage by access pattern

Facts: EBS offers block storage, EFS shared file storage, and foundational S3 usage is object storage. Match interface, sharing, latency, durability, retention and retrieval requirements before price. Lifecycle/archive choices must respect access frequency and restoration needs. Storage redundancy and backups answer different failure cases. Source 12; backup caveat 20.

Exercise: Choose storage for VM boot/database blocks, shared Linux files and immutable uploaded assets; reject an attractive but incompatible alternative. Use synthetic prices and identify retrieval/request/transfer omissions.

Map: CLF 3.6 (storage); SAA 3.1 (storage performance), 4.1 (storage cost), 1.3 (data protection if controls included). Gaps: FSx, Storage Gateway, DataSync, detailed class constraints, key management and hybrid migration.

### 4. Choose compute and scaling

Facts: EC2 supplies virtual servers with more host-management responsibility; ECS orchestrates containers; Fargate runs containers on managed compute; Lambda fits event/function execution. Container orchestration and compute capacity are different layers. Serverless removes server management, not application responsibility. Sources 10–11.

Exercise: Compare a legacy OS-dependent app, a persistent container service and a bursty file-processing function. State scaling signal, durable state location, failure behavior and operational burden for each.

Map: CLF 3.3 (compute); SAA 2.1 (loosely coupled architecture), 3.2 (elastic compute), 4.2 (compute costs). Gaps: EKS, Batch/EMR, precise instance sizing, load balancer variants, quotas, purchase commitments and benchmarking.

### 5. Decouple and handle duplicates

Facts: SQS buffers work for consumers; SNS fans out publications; EventBridge routes matching events. They can be combined. Standard SQS may redeliver, so make application effects idempotent. A consumer crash after committing its effect but before acknowledging is a useful duplicate-processing scenario. Sources 13–14. The crash scenario is a teaching inference from the duplicate-delivery requirement.

Exercise: Model an order event delivered twice; demonstrate that a stable business key plus durable deduplication/conditional state transition prevents a second effect. Discuss retries, visibility and dead-letter handling without promising exactly-once business processing.

Map: CLF 3.8 (integration-service subset); SAA 2.1 and 3.2. Gaps: Step Functions, API Gateway, detailed FIFO semantics, streaming/data ingestion, retention/throughput quotas and consumer implementation.

### 6. Separate database goals

Facts: RDS Multi-AZ DB instance has a failover standby that does not serve reads. Multi-AZ DB cluster has two readable standby instances. Readable DB-instance replicas primarily scale reads with asynchronous replication; Db2 standby-mode and Oracle mounted-mode replica exceptions do not serve read workloads. Conventional Aurora separates shared replicated cluster storage from writer/reader compute. DynamoDB is managed key-value/document storage with access-pattern design, not a relational JOIN substitute. Sources 15–18.

Exercise: Given read pressure, AZ failure and relational transaction requirements, choose a pattern for each need and explicitly state what it does not solve. An architecture may need both availability and read scaling.

Map: CLF 3.4 (databases); SAA 2.2 (availability), 3.3 (database performance), 4.3 (database cost only if compared). Gaps: caching, RDS Proxy, detailed Aurora configurations, migration/DMS/SCT, DynamoDB keys/indexes/consistency, capacity and engine restrictions. Do not teach “all Multi-AZ standbys cannot read.”

### 7. Plan recovery and prove it

Facts: AZ-level resilience and multi-Region recovery cover different failure scopes. RTO is an acceptable restoration-time target; RPO limits the age of recovered data. Replication can propagate mistakes, so it is not a universal backup replacement. Actual recoverability requires restore testing and dependency validation. Sources 19–20; global infrastructure objective page CLF 3.2.

Alternate paper-only research scenario (not the CLI fixture): Synthetic outage 14:00, last restorable point 13:50, service restored 14:25: observed 10-minute data gap and 25-minute restoration interval. Compare with RPO 5 minutes/RTO 30 minutes: RPO misses, RTO meets. Specify evidence needed before asserting production capability.

Map: CLF 3.2 (global infrastructure), 3.6 (backup subset); SAA 2.2 (availability/recovery), 1.3 (data recovery). Gaps: pilot-light/warm-standby/active-active implementation, cross-Region dependencies, quotas, routing failover, encryption-key recovery and actual drills.

### 8. Pick the operational evidence

Facts: CloudWatch answers health/performance through telemetry; CloudTrail records AWS actor/action activity; Config tracks recorded resource configuration and rule evaluation. These complement one another. Logging must have suitable coverage, retention, access controls and cost assumptions. Sources 21–23.

Exercise: For a latency spike after a security-group change, identify which evidence establishes symptom, actor/action and before/after configuration. Avoid claiming a timestamp correlation alone proves causation.

Map: CLF 2.2 (governance/logging); SAA 2.2 (visibility/metrics), 3.2 (scaling signals). CLF 3.1 only partially if access methods and repeatable operations are taught. Gaps: deployment/IaC, trace analysis, instrumentation, incident response implementation and service-specific recording coverage.

### 9. Model cost and governance

Facts: Use explicitly synthetic rates, quantities and arithmetic, not a pricing quotation. Total cost needs compute, storage, requests, transfer, logs, backups and relevant fixed charges. Budgets can notify and trigger configured actions but delays permit overshoot; they are not a hard spending cap. Cost ownership, allocation tags and organization billing are governance concepts, not proof of permission to spend. Source 24 and CLF domain 4/SAA domain 4 guides.

Alternate paper-only research scenario (not the CLI fixture): At invented rates, 100 compute-hours × $0.04 + 50 GB-month × $0.02 + 20 transfer-GB × $0.10 = $7 before omitted charges. Label all values synthetic. Model an alert arriving after additional usage and explain why it cannot guarantee a ceiling.

Map: CLF 1.4 (economics subset), 4.1 (pricing models subset), 4.2 (cost tools); SAA 4.1–4.4 only to the extent each service family's cost drivers are actually analyzed. Gaps: support options CLF 4.3, commitment economics, detailed data transfer tariffs, RI/Savings Plans coverage/utilization, licensing, billing reports and real estimates.

### 10. Defend a six-pillar architecture

Facts: Six pillars are operational excellence, security, reliability, performance efficiency, cost optimization and sustainability. A design review balances requirements and tradeoffs; selecting a named service is insufficient. Source 25.

Exercise: Assemble a fictional upload-processing service with a data classification, traffic pattern, recovery targets and synthetic cost ceiling. For each pillar record one decision, rejected alternative, evidence/test and residual risk. Include queue duplicate handling, access boundaries, recovery of corrupted data, telemetry ownership and reducing unused capacity.

Map: CLF 1.2 directly; CLF 1.1 partially through elasticity/availability benefits. SAA 1.1–1.3, 2.1–2.2, 3.1–3.4 and 4.1–4.4 are integrative partial mappings only when corresponding decisions are examined. Not mapped to SAA 3.5 merely because files/events exist: ingestion/transformation deserves dedicated coverage.

## Explicit uncovered objectives

Whole-task or major omissions: CLF 1.3 (migration/CAF), 2.4 (security service/resource breadth), 3.7 (AI/ML and analytics), 4.3 (support/resources). CLF 3.1 and 3.8 have substantial uncovered content beyond the narrow operations/integration examples. SAA 3.5 (ingestion/transformation) is uncovered. Every other mapped task still has significant uncovered subskills listed above. No practice-score threshold or completion badge should claim readiness for either exam.

## Currency checks and claims to avoid

- November 8 is only ten days after October 29 guide publications. AWS describes approximately a one-month lead, not an exact transition date. Say “mapped to the official guide reviewed November 8, 2026”; do not assert every change is already live in exams.
- Current CLF 4.3 examples include Basic Support, Business Support+, Enterprise Support and Unified Operations. Do not copy old Developer/Business/Enterprise On-Ramp plan comparisons, fees or response-time promises without current plan-page verification. This research does not verify plan eligibility or pricing.
- Quotas, free tier, supported Regions/engines, instance families, runtime limits, tariffs and SLA percentages require current service-specific verification. No hard-coded “always free,” “unlimited,” “zero data loss,” “instant failover” or “guaranteed bill cap” claims.
- Newly visible names/features in current pages are cautions against stale absolutes, not an instruction to broaden this foundation into an unverified survey. Detailed new-feature training remains outside scope.
- Athena here names the user's learning product. Do not confuse it with Amazon Athena, the AWS analytics service, whose exam coverage is part of the explicitly uncovered analytics/ingestion objectives.
