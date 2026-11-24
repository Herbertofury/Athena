# Review a change before calling it a deployment

Compare desired state, identify risky changes and deliver an honest evidence packet.

## Learning goals

- Distinguish a local desired-state comparison from an executed change.
- Flag removals, replacements and increased exposure for review.
- Combine coverage, assumptions and unexecuted cloud work in a handoff.

## Learn

Infrastructure as code describes infrastructure in reviewable form, but a file is not the running environment. Desired configuration, observed state and the actions a tool proposes can differ. A disciplined workflow separates preparing a change, reviewing its consequences, authorizing execution and verifying the result. Each stage needs its own evidence.

CloudFormation change sets are one provider example of previewing proposed effects before execution. The documentation also warns that a preview does not guarantee a successful update. Our local exercise is simpler: it compares two invented JSON inventories. It never calls CloudFormation, Terraform, another provider API or an apply operation.

The invented resource schema has id, kind, size and public fields. New IDs are additions; missing IDs are removals. A changed kind is modeled as replacement; other changed fields are modifications. These rules belong only to the teaching schema. A real provider may replace a resource for entirely different property changes, so this report cannot predict its behavior.

The fixture removes reports storage, adds queue compute and changes web size while making it public. The report highlights possible data/service loss from removal and increased exposure from the public change. It does not decide those changes are authorized or safe. A valid syntax check cannot supply missing business intent, data-retention requirements or an approved audience.

Build an evidence packet for the fictional service: workload contract, responsibility owners, scope comparison, network assumptions, scaling and failure calculations, recovery timeline, actual local restore and cost estimate. For each item state whether it is a prediction, local execution or unexecuted cloud work. An impressive number of green tests cannot turn a simulation into a deployed system.

Before any real lab, define an authorized isolated environment, bounded spending, data classification, rollback or recovery method, verification criteria and cleanup. Do not run an apply, grant access or create resources as an extension of this pack. The module ends with a reviewable plan and local evidence, leaving real provisioning, IAM, networking, failover and billing verification explicitly unexecuted.

## Worked example

The change report is ordered by resource ID: add queue, remove reports, modify web fields public and size. It carries applied=false and warnings for reports removal and web exposure. Comparing an inventory to itself produces no changes. A reviewed plan is useful preparation, but it is not an executed deployment, a permission grant or a guarantee that a future provider operation succeeds.

## Practice safely

1. Predict the three changes and two risk notes from the fixture.
2. Run python3 labs/cloud-workshop/run_lab.py changes.
3. Explain why a kind-change replacement rule is only an invented schema rule.
4. Complete the cloud evidence worksheet and capstone review.
5. Write a short handoff with local commands, actual results, source links and limits.
6. List real-cloud provisioning, IAM, network, failover and billing labs as unexecuted.

## Evidence to keep

- A reviewed local diff and risk explanation.
- A complete evidence packet and capstone decision.
- A specific list of unexecuted provider-side work.

## Original check 1

What does applied=false mean in this exercise?

- The resources were deployed unsuccessfully
- Only a local comparison was produced; no changes were applied
- The public change was approved
- The provider confirmed a rollback

<details><summary>Answer and explanation</summary>

Only a local comparison was produced; no changes were applied. There is no apply function or provider connection in the pack.

</details>

## Original check 2

Why must removing the reports resource be reviewed?

- It always lowers risk
- A JSON file guarantees a backup
- It may interrupt service or lose retained data
- The cloud automatically knows the business requirement

<details><summary>Answer and explanation</summary>

It may interrupt service or lose retained data. A removal can have consequences beyond syntactic correctness; intent and recovery evidence are required.

</details>

## Original check 3

Which is the most accurate final handoff?

- Production cloud ready because local tests pass
- A promise of zero future charges
- A provider certification pass
- Precisely scoped local evidence, assumptions and a list of real-cloud labs still unexecuted

<details><summary>Answer and explanation</summary>

Precisely scoped local evidence, assumptions and a list of real-cloud labs still unexecuted. Honest boundaries let another person judge the work without confusing preparation with executed cloud practice.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

No IaC provider, plan API or apply operation is used. This is an invented diff schema, not a deployment preview guaranteed to match any real cloud or a complete cloud certification course.

## Official references

- [https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-changesets.html)

- [https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_planning_for_recovery_objective_defined_recovery.html](https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_planning_for_recovery_objective_defined_recovery.html)

