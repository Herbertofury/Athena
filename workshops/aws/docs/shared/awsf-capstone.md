# Defend an AWS-shaped design with evidence and unresolved risks

Assemble a bounded architecture review across six pillars without declaring deployment or exam readiness.

## Learning goals

- Connect each architectural decision to a requirement and evidence item.
- Review tradeoffs using the six Well-Architected pillars.
- Produce an honest handoff that separates local results from unexecuted AWS work.

## Learn

The capstone concerns a fictional upload-and-receipt service with no customer data. Uploads arrive, queued work is processed, results are stored and operators investigate failures. Begin with the data classification, expected arrival pattern, permitted readers, acceptable delay and recovery objectives. These requirements should explain the design. Starting with a diagram full of AWS logos and retrofitting a justification later encourages accidental complexity and makes it difficult to tell whether each component solves a real problem.

Use the six AWS Well-Architected pillars as review questions: operational excellence, security, reliability, performance efficiency, cost optimization and sustainability. For each, record a decision, an alternative you rejected, evidence you have and a remaining risk. The pillars are not independent scoring boxes. Extra redundancy can improve resilience while increasing idle capacity and cost; shorter retention can reduce storage while weakening investigation. A useful review explains the tradeoff and its owner instead of claiming that every dimension was maximized.

The previous lessons supply different kinds of evidence. Identity work highlights a missing approval owner rather than granting real access. Network work separates an available route from a missing policy edge. Storage and compute selection compare declared capabilities, while the database comparison leaves an unresolved choice. Queue processing demonstrates a bounded duplicate-safe ledger. Recovery separates a sufficient restoration time from a missed data objective and insufficient surviving capacity. Preserve these failures and ambiguities rather than hiding them to make the capstone look complete.

Operational and cost evidence complete the handoff but do not erase its gaps. The event classifier leaves an unknown record for investigation. The synthetic cost ledger exceeds its budget and explicitly does not enforce a spending cap. Assign a next question and responsible role to each unresolved result. A good architecture review can conclude that the design is not ready for deployment. That is a substantive outcome when the reasons and next actions are clear, not a failed exercise to bypass.

Run the capstone command to aggregate the fixed local receipts and inspect its deployment_approved value. It remains false because this workshop is not a real implementation or an approval authority. Attach your six-pillar review and trace every claim back to an observed receipt, a paper prediction or an official concept reference. Keep those evidence types distinct. If you did not run a command, say so; a predicted answer can demonstrate reasoning but cannot stand in for an executed result.

The official CLF-C02 and SAA-C03 guides provide a partial learning map, not an exam-readiness score. The guide revisions published October 29, 2026 describe approximately a one-month lead before corresponding exam changes; no exact effective date is established here. This workshop is mapped to the guides reviewed November 8, 2026 and leaves substantial objectives uncovered. AWS APIs, consoles, deployments, service engines, recovery drills and pricing validation remain unexecuted. Finish with a prioritized learning and validation plan rather than a certification or production-readiness claim.

## Worked example

The aggregate receipt preserves the missing identity owner, blocked policy path, ambiguous candidate choices, duplicate-safe 1200-cent ledger, mixed recovery outcomes, unknown operational event and synthetic cost overage. real_aws_executed and deployment_approved remain false.

```sh
# Local synthetic model only; no AWS calls or configuration.
python3 labs/aws-workshop/run_lab.py capstone
```

Run from the workshop directory. Local Python only; no AWS credentials, calls, network or real configuration.

## Practice safely

1. Write a concise workload contract and data classification.
2. Predict which earlier outcomes block a confident handoff.
3. Run python3 labs/aws-workshop/run_lab.py capstone.
4. Write one decision, alternative, evidence and risk for each pillar.
5. Prioritize missing owners, policy review, capacity, recovery and cost questions.
6. Compare the dated partial objective map and label all AWS execution unperformed.

## Evidence to keep

- A six-pillar decision/alternative/evidence/risk review.
- An aggregate receipt preserving failures and ambiguities.
- A dated objective-gap map and prioritized unexecuted-validation plan.

## Original check 1

What is the strongest capstone handoff?

A. Only a diagram of service logos
B. A claim that every AWS objective is complete
C. A fabricated deployment success
D. Requirements, evidence, unresolved risks and prioritized next checks

<details><summary>Answer and reasoning</summary>

D. Requirements, evidence, unresolved risks and prioritized next checks

A defensible handoff connects decisions to evidence and makes limitations actionable rather than hiding uncertainty.

</details>

## Original check 2

What does October 29, 2026 represent in the guide discussion?

A. A guide revision publication date, not a verified exact exam-effective date
B. A guaranteed universal exam transition date
C. The date this workshop deployed AWS
D. A permanent freeze of service features

<details><summary>Answer and reasoning</summary>

A. A guide revision publication date, not a verified exact exam-effective date

AWS describes an approximate lead time, so publication and exact exam effect must not be conflated.

</details>

## Original check 3

Why is deployment_approved false in the aggregate receipt?

A. Every arithmetic operation failed
B. Local teaching evidence is not deployment validation or authorization
C. AWS has no recovery features
D. A completion badge grants permission

<details><summary>Answer and reasoning</summary>

B. Local teaching evidence is not deployment validation or authorization

No real AWS environment or deployment checks were executed, and the model cannot authorize a deployment.

</details>

## Limits

No AWS deployment, account configuration, full Well-Architected review, exam-readiness assessment or production approval occurs. Local model completion does not establish service behavior or complete objective coverage.

## Official references

- https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html
- https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html
- https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html
- https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/clf-02-revisions.html
- https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/saa-03-revisions.html
