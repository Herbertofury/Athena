# Assign responsibility and limit the scope

Identify retained duties and compare a narrow resource scope with a broad one.

**Study time:** about 45 minutes, with pauses for prediction and practice.

## You will learn to

- Name customer duties that do not disappear in a managed service.
- Explain hierarchy and inherited scope without treating vendors as identical.
- Detect a misleading string-prefix scope match in a local model.

## Learn

Shared responsibility is a division of work, not an escape from accountability. AWS describes responsibility for underlying infrastructure separately from customer-controlled components. Microsoft’s matrix likewise keeps data, identities and configuration decisions with the customer while management of operating systems and other layers changes by service model. Read the specific service boundary rather than memorizing one diagram as universal law.

For our report service, someone must decide who can read reports, remove departing staff, review configuration and verify recovery. A provider can operate a physical host without knowing whether a particular colleague should see a particular report. Make an owner-and-evidence list: task, accountable owner, how completion is checked and when that check happens.

Resource hierarchies help organize ownership and policy. Google Cloud uses organizations, optional folders and projects; Azure documents management-group, subscription, resource-group and resource scopes. Inherited scope can make a single assignment affect many descendants. These are examples, not interchangeable identifier formats or proof that all policy evaluation rules are the same.

The offline scope exercise uses invented paths such as academy/dev/reports. It compares whole path segments. A scope of academy/dev includes that report resource but not academy/dev-tools/reports. A careless text-prefix test would confuse those siblings. This is a small programming model of containment, not an IAM simulator that determines effective cloud permissions.

Scope is only one part of authorization. A real decision also depends on the principal, operation, role or policy, conditions and provider-specific interactions. The exercise creates no role assignment and holds no identity credential. Broadening academy/dev to academy merely shows which invented resources fall under a larger boundary; it does not grant anyone access.

Least privilege needs a concrete task. If a study role only needs development reports, explain why production reports are outside the task rather than selecting a broad role for convenience. Also plan how legitimate access is reviewed and removed. A narrow diagram with no lifecycle owner is incomplete, while a broad inherited assignment can make a small mistake affect more resources.

## Worked example

The narrow scope academy/dev matches one fixture resource. The broad scope academy matches all three: development reports, production reports and development-tool reports. The similar-looking dev-tools segment is not a child of dev. The result reveals containment only. It does not establish actual read permission, evaluate deny policies or authenticate any user.

## Practice safely

1. Assign owners for data access, guest-OS patches in IaaS, service configuration and restore verification.
2. Read one provider’s current responsibility guidance and note where the boundary depends on service choice.
3. Predict the narrow and broad scope results.
4. Run python3 labs/cloud-workshop/run_lab.py scope.
5. Explain why dev-tools is not inside dev in the invented model.
6. Record what a real authorization test would still need, without creating credentials or grants.

Use the [offline lab guide](../../labs/cloud-workshop/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

A provider maintains physical hosts. Who still decides which staff may read workshop reports?

A. No one
B. Every internet user
C. Only the hardware manufacturer
D. The customer’s authorized data/access owners

<details><summary>Answer and reasoning</summary>

D. The customer’s authorized data/access owners. Infrastructure operation does not determine the customer’s intended data audience.

</details>

### Check 2

Does academy/dev contain academy/dev-tools/reports in the local model?

A. No, because containment compares complete path segments
B. Yes, because the text begins similarly
C. Only when a credit card is entered
D. It proves a provider has denied access

<details><summary>Answer and reasoning</summary>

A. No, because containment compares complete path segments. The segment dev-tools is distinct from dev; a string-prefix shortcut would be misleading.

</details>

### Check 3

What does the scope exercise prove?

A. Effective Azure, AWS and Google IAM are identical
B. Only containment under the invented path contract
C. A real role was assigned
D. All inherited policies are safe

<details><summary>Answer and reasoning</summary>

B. Only containment under the invented path contract. It is a bounded local model with no authentication, provider policy evaluation or external changes.

</details>

## Evidence to keep

- A responsibility-owner checklist.
- Predicted and executed segment-containment results.
- A list of omitted real IAM factors.

## Limits

No credentials, roles, policies or permissions are created. The path model does not reproduce any provider’s IAM evaluator or resource identifier grammar.

## Official references

- https://aws.amazon.com/compliance/shared-responsibility-model/
- https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility
- https://docs.cloud.google.com/resource-manager/docs/cloud-platform-resource-hierarchy
- https://learn.microsoft.com/en-us/azure/role-based-access-control/scope-overview
