# Azure identity and governance

Organize scope, policy and role assignments deliberately.

## Learn

Azure resources belong to resource groups and subscriptions, with management groups above subscriptions for governance. Scope affects inheritance of role assignments and policies.

Microsoft Entra ID provides identity capabilities; Azure RBAC authorizes resource operations. Azure Policy evaluates resource compliance and can audit or enforce selected properties. These are related but not interchangeable.

Use tags, budgets, locks and policies deliberately. A lock is not a backup or a substitute for access control. Administrative access should be time-bound and least-privileged where supported.

## Worked example

A policy can require a resource tag while RBAC determines who may create the resource. Passing a policy check does not grant permission to deploy.

## Practice safely

1. Draw a management-group/subscription/resource-group hierarchy.
2. Assign fictional Reader and Contributor roles at appropriate scopes.
3. Define an audit policy requirement.
4. Explain the distinction between identity, authorization and compliance.

## Check your understanding

What is Azure Policy primarily used to evaluate?

- Resource compliance with configured rules
- Only user passwords
- CPU instruction ordering
- Every application’s business authorization

<details><summary>Answer and explanation</summary>

Resource compliance with configured rules. Policy governs resource properties and compliance; RBAC addresses access to resource operations.

</details>

## Further study

- https://learn.microsoft.com/en-us/azure/governance/policy/overview
- https://learn.microsoft.com/en-us/azure/role-based-access-control/overview

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

