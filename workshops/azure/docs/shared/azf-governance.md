# Distinguish compliant configuration from deletion protection

Treat Azure Policy, resource locks and role permissions as different decision mechanisms.

## Learning goals

- Contrast policy evaluation with authorization and locks.
- Explain why compliance findings require remediation decisions.
- Assess a lock without assuming it protects all data operations.

## Learn

A team can be authorized to create a resource yet propose a configuration that violates organizational standards. Azure Policy helps evaluate resource state and enforce selected organizational requirements. Azure RBAC answers who can perform actions, while Policy addresses properties and compliance requirements. Resource locks provide another layer for restricting selected management operations. These mechanisms overlap operationally but should not be treated as interchangeable labels for security. Each has its own scope, effect and exceptions that administrators must understand.

Policy definitions describe evaluation logic and an effect; assignments apply policy at a scope. An audit effect records noncompliance rather than blocking the action as a deny effect can. A compliance finding therefore needs interpretation before anyone claims prevention. An existing noncompliant resource may require deliberate remediation, depending on the policy effect and configuration. A dashboard with green or red counts also needs evaluation timing and scope context. It is not a substitute for reading what the assignment actually checks.

Resource locks address accidental changes at the management plane. CanNotDelete permits reading and modifying a resource while restricting deletion; ReadOnly restricts changes more broadly and can affect operations that look like reads but use management requests with other semantics. Locks do not universally protect service data-plane operations. A storage lock should not be described as an immutable backup or a guarantee that no blob can be deleted. Service data protection and recovery controls require their own assessment.

In the fictional service, the governance model reports policy findings separately from lock decisions. Keep those output lists separate in your review. A resource can have a missing required tag and still be protected from a modeled delete operation. Conversely, an apparently compliant resource can remain deletable if the relevant lock is absent. The exercise demonstrates why a single “secure” flag hides useful distinctions. It does not deploy a policy, invoke a remediation task or calculate actual Azure compliance.

An administrator should record the intent behind each control: prevent new configurations, detect existing drift, restrict accidental management deletion or constrain a principal. Select the mechanism that serves that intent and document exceptions. If an emergency change requires removing a lock, that is a consequential change to be authorized and audited, not a routine troubleshooting shortcut. If tags are mandatory for billing, record how newly created and existing resources receive them rather than assuming audit alone supplies missing metadata.

Run the governance command and explain each issue and blocked operation using the fixed teaching rules. Next, work a paper scenario in which a required tag is repaired but a deletion lock remains. State which concern is resolved and which restriction persists. The command does not perform that repair. Preserve both the original receipt and the separate proposal. Policy implementation and lock administration here are enrichment beyond AZ-900 overview concepts; real assignments, exemptions, remediation permissions and service behavior remain untested.

## Worked example

Prepare a review table with one row for configuration compliance and another for accidental management deletion. Place policy_findings in the first row and lock_decisions in the second. A missing tag is evidence about the modeled requirement, not evidence that the resource is publicly accessible. A blocked delete says nothing about whether a report can be overwritten through its data API. On paper, add the missing ownership metadata and predict which modeled finding would disappear; keep that prediction separate from the unchanged fixed receipt.

```sh
# Offline synthetic model only; no Azure operations.
python3 labs/azure-workshop/run_lab.py governance
```

Run from the workshop directory. Local Python only; no Azure credentials, calls, network or real configuration.

## Practice safely

1. Read the fixed governance fixture and write your prediction before running anything.
2. Draw the decision boundary and list the Azure conditions this local model omits.
3. From the workshop directory run python3 labs/azure-workshop/run_lab.py governance.
4. Compare the receipt with your prediction and retain disagreements rather than editing evidence.
5. Work the alternative in the example on paper only; label it unexecuted.
6. Save the receipt and the three evidence items, with a list of unperformed real Azure validations.

## Evidence to keep

- A control-intent matrix for RBAC, Policy and locks.
- Separate annotations for policy_findings and lock_decisions.
- A paper remediation proposal that preserves unrelated restrictions.

## Original check 1

An audit policy finds a missing tag. What is justified?

A. The resource creation was necessarily blocked
B. The missing tag was automatically repaired
C. The evaluated resource is noncompliant with that rule
D. All resource access was revoked

<details><summary>Answer and reasoning</summary>

C. The evaluated resource is noncompliant with that rule

Audit detects noncompliance; it does not inherently deny or remediate.

</details>

## Original check 2

What does a management lock fail to guarantee?

A. Restriction of selected management operations
B. A distinct purpose from role assignment
C. A possible obstacle to authorized maintenance
D. Protection against every data-plane deletion

<details><summary>Answer and reasoning</summary>

D. Protection against every data-plane deletion

Locks apply to the management plane, while service data protections need separate review.

</details>

## Original check 3

Why retain policy and lock results separately?

A. They answer different control questions
B. Only lock results can be evidence
C. Policy results replace all permissions
D. Both are the same authorization engine

<details><summary>Answer and reasoning</summary>

A. They answer different control questions

Compliance requirements and restrictions on management changes are distinct.

</details>

## Limits

No Azure Policy evaluation, assignment, exemption, remediation or resource lock change occurs. The toy rules do not model every policy effect or lock/service interaction.

## Official references

- https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/lock-resources
- https://learn.microsoft.com/en-us/azure/governance/policy/overview
- https://learn.microsoft.com/en-us/azure/governance/policy/how-to/get-compliance-data
- https://learn.microsoft.com/en-us/azure/governance/policy/how-to/remediate-resources
