# Separate directory identity from resource authorization

Reason about Microsoft Entra identities, Azure RBAC scopes and data-plane permissions independently.

## Learning goals

- Separate authentication, directory roles and Azure RBAC.
- Describe a least-privilege assignment using principal, role and scope.
- Identify control-plane and data-plane validation gaps.

## Learn

A successful sign-in establishes an identity context, not unlimited authority over Azure resources. Microsoft Entra ID manages identities and authentication for users and workloads. Azure role-based access control assigns permissions to principals at a resource-management scope. Administrators must connect those concepts without collapsing them. A user who can manage directory objects is not necessarily entitled to change an application server, and a subscription operator is not necessarily entitled to administer the directory that authenticates its users.

An Azure role assignment connects a security principal, role definition and scope. The principal might be a user, group, service principal or managed identity. Scope determines where the assignment applies, including inherited coverage below that point. Start with the task, then identify the narrowest suitable permissions and scope. Assigning a broad role because it makes an error disappear hides the original diagnosis and can create unrelated authority that persists after the immediate work is finished.

Control-plane permissions manage resources; data-plane permissions operate on service data. Their separation varies by service and authentication method, so a resource-management role name alone does not answer whether someone can read a blob. A managed identity avoids distributing an application secret for supported authentication flows, but it still needs appropriate authorization. Removing a stored password from code is a credential-handling improvement, not proof that the workload has minimal permissions or that every dependent service accepts that identity.

For a fictional analyst, distinguish reading a storage account configuration from downloading report contents. Put each requested operation in a ledger with its intended principal and scope. The local model matches explicit synthetic role assignments against requests. It does not implement every Azure RBAC behavior, deny assignment, conditional assignment, directory control or service-specific access mechanism. Read allowed as a model verdict only. A real access review would inspect effective assignments and test authorized operations in the intended environment.

Access also has a lifecycle. A temporary project role needs an owner, a reason, a review date and a removal decision. Group-based assignment can simplify administration, but group membership itself becomes a controlled input that needs review. Privileged access workflows and authentication requirements address different risks from role scope. Do not claim that multifactor authentication makes an excessive role acceptable, or that narrowing a role compensates for an untrusted sign-in. Each control should answer a specific threat or operational requirement.

Run the access command with no credentials and retain its decisions and matching assignment identifiers. Explain one matching request and one nonmatching request using only the fixed data. Then propose a narrower assignment on paper, without modifying a real directory or resource. Your evidence is a permission rationale plus a bounded matching result. Administrative implementation goes beyond the selected AZ-900 concepts, and the model cannot establish that access has been provisioned, revoked or safely validated in Azure.

## Worked example

Create a two-column ledger headed manage configuration and read report data. Classify the fictional analyst operations before opening the receipt. For every returned decision, connect matching_assignment_ids to the provided assignment scope and action; an empty match must not be repaired by inventing an inherited Owner role. In the paper alternative, the analyst only needs reports in one container. Propose a suitable data-access role at the intended narrow scope and list the service-specific access checks still required. This proposal is not executed by the fixed command.

```sh
# Offline synthetic model only; no Azure operations.
python3 labs/azure-workshop/run_lab.py access
```

Run from the workshop directory. Local Python only; no Azure credentials, calls, network or real configuration.

## Practice safely

1. Read the fixed access fixture and write your prediction before running anything.
2. Draw the decision boundary and list the Azure conditions this local model omits.
3. From the workshop directory run python3 labs/azure-workshop/run_lab.py access.
4. Compare the receipt with your prediction and retain disagreements rather than editing evidence.
5. Work the alternative in the example on paper only; label it unexecuted.
6. Save the receipt and the three evidence items, with a list of unperformed real Azure validations.

## Evidence to keep

- A principal/operation/scope ledger separating directory and resource authority.
- A receipt interpretation tied to matching_assignment_ids.
- A narrower paper access proposal and an explicit list of absent service checks.

## Original check 1

Which elements define an Azure role assignment?

A. Password, region and invoice
B. Tenant logo, policy name and budget
C. Subscription name alone
D. Principal, role definition and scope

<details><summary>Answer and reasoning</summary>

D. Principal, role definition and scope

The assignment binds who receives which permissions at which resource scope.

</details>

## Original check 2

A workload uses managed identity. What still needs review?

A. Its resource permissions and supported authentication path
B. Only its display color
C. Nothing because identity implies authorization
D. Whether it can share its password

<details><summary>Answer and reasoning</summary>

A. Its resource permissions and supported authentication path

Managed identity changes credential management, not the need for appropriate permissions.

</details>

## Original check 3

Why separate reading configuration from reading stored reports?

A. Data has no access controls
B. Control-plane and data-plane permissions can differ
C. Directory roles always grant both
D. Any Reader role grants every blob

<details><summary>Answer and reasoning</summary>

B. Control-plane and data-plane permissions can differ

Resource-management permissions alone do not establish data access for every service.

</details>

## Limits

No sign-in, token acquisition, role assignment or access revocation occurs. Simplified assignment matching omits full RBAC evaluation, deny assignments, conditions and service authentication behavior.

## Official references

- https://learn.microsoft.com/en-us/azure/role-based-access-control/rbac-and-directory-admin-roles
- https://learn.microsoft.com/en-us/azure/role-based-access-control/overview
