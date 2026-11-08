# Match an incident question to the right operational evidence

Use CloudWatch, CloudTrail and AWS Config as complementary evidence sources.

## Learning goals

- Choose telemetry, actor/activity or configuration evidence for a stated question.
- Separate temporal correlation from a supported causal claim.
- Explain recording coverage and retention as explicit design decisions.

## Learn

An incident begins with a question, not a dashboard collection. Users report slow receipt processing after a configuration change. You need to establish whether the symptom is real, when it started, what changed and who or what performed the change. Those questions call for different evidence. A metric can show a latency increase without identifying the actor. An activity record can identify a request without proving its effect on application performance. Keep the questions separate before combining the timeline.

Amazon CloudWatch supports operational visibility through metrics, logs, alarms and dashboards. Useful evidence depends on appropriate instrumentation, dimensions, collection and retention. A graph labeled latency needs a defined measurement point and aggregation interval; an average can hide a small population of very slow requests. An alarm threshold is an operational choice, not a guarantee that every user-visible failure will trigger it. The lesson classifies fictional evidence and does not configure agents, dashboards, alarm actions or workload telemetry.

AWS CloudTrail provides records of AWS activity that can help answer actor, action and time questions. Recording scope matters: management-event history and configured trails or other recording choices are not a promise that every application operation and data event is present by default. A missing record can mean missing coverage, retention or an incorrect search, not necessarily that no action occurred. State the source and scope whenever an audit conclusion depends on the absence of an event.

AWS Config tracks recorded resource configuration, relationships and rule evaluations. It can help compare before-and-after resource state, while CloudTrail helps explain an API activity and CloudWatch helps show the symptom. A rule’s compliant result means something specific about that rule and recording scope. It is not blanket regulatory compliance or proof that the application is secure. Combining these sources is often useful precisely because none independently answers every operational and governance question.

The local fixture includes four synthetic evidence items. One is classified as CloudWatch-shaped telemetry, one as CloudTrail-shaped activity, one as AWS-Config-shaped configuration, and one remains unclassified. Preserve the unknown rather than forcing it into the closest familiar category. The fixture has no timestamps, so a timeline cannot be derived from it. Record timestamps and ordering as missing evidence, then write a paper hypothesis: a configuration change might be related to a symptom. To support causation, a real investigation would need additional context, dependency checks and appropriately controlled validation.

Run the operations command and keep the classification reasons. No AWS logs are queried and no real audit history is accessed. The exercise does not establish recording coverage, retention, incident response readiness or regulatory compliance. Your evidence should include an owner and retention question for each required source, plus one unresolved diagnostic question. A useful incident handoff makes uncertainty visible so the next person can test it, rather than turning coincident timestamps into a confident but unsupported root-cause statement.

## Worked example

The receipt classifies e1 as CloudWatch, e2 as CloudTrail, e3 as AWS_Config and e4 as unclassified. Treat those as local labels for synthetic records. The fixture contains no timestamps or event ordering. A timeline and any causal claim require additional evidence.

```sh
# Local synthetic model only; no AWS calls or configuration.
python3 labs/aws-workshop/run_lab.py operations
```

Run from the workshop directory. Local Python only; no AWS credentials, calls, network or real configuration.

## Practice safely

1. Write separate symptom, actor/action and configuration questions.
2. Predict the source category for each synthetic record.
3. Run python3 labs/aws-workshop/run_lab.py operations.
4. Retain the unclassified record and explain its uncertainty.
5. Record timestamps and event ordering as missing evidence; write only a paper incident hypothesis.
6. Record real-source coverage, retention and ownership questions.

## Evidence to keep

- A question-to-evidence-source ledger.
- The four local classifications, including the unknown.
- A paper incident hypothesis with explicit timestamp, coverage and retention gaps.

## Original check 1

Which evidence most directly addresses an AWS actor/action question?

A. Only a latency average
B. Relevant CloudTrail activity records
C. Only an object size
D. A synthetic price table

<details><summary>Answer and reasoning</summary>

B. Relevant CloudTrail activity records

CloudTrail activity evidence addresses who or what performed AWS actions, subject to recording scope and retention.

</details>

## Original check 2

A Config rule reports compliant. What is warranted?

A. All regulations are satisfied
B. All application bugs are fixed
C. The recorded resource satisfied that rule under its evaluated scope
D. Every data event was audited

<details><summary>Answer and reasoning</summary>

C. The recorded resource satisfied that rule under its evaluated scope

A rule result has bounded meaning and must not be inflated into universal compliance or security assurance.

</details>

## Original check 3

A configuration change precedes a latency spike. What follows immediately?

A. The change is certainly the only cause
B. All unrelated dependencies can be ignored
C. A rollback has already succeeded
D. There is a hypothesis to investigate, not proven causation

<details><summary>Answer and reasoning</summary>

D. There is a hypothesis to investigate, not proven causation

Temporal association is evidence for investigation but cannot alone identify cause or establish a successful remedy.

</details>

## Limits

No CloudWatch, CloudTrail or Config API, telemetry collection, real log search, alarm action or compliance assessment occurs. Local classification is not AWS recording evidence.

## Official references

- https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html
- https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-user-guide.html
- https://docs.aws.amazon.com/config/latest/developerguide/WhatIsConfig.html
