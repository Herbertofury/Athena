# Place resources inside an accountable lifecycle

Use Azure scopes to reason about ownership, inherited controls and deletion consequences.

## Learning goals

- Distinguish tenant, management group, subscription and resource group responsibilities.
- Trace inherited scope without treating a hierarchy as a complete access decision.
- Plan a resource lifecycle around dependencies and accountable owners.

## Learn

An Azure resource rarely exists in isolation. A reporting application needs an administrative home, a funding boundary, an identity directory and a plan for retirement. Azure Resource Manager organizes resources under resource groups and subscriptions, while management groups organize subscriptions for governance. Microsoft Entra tenants provide the directory context. These concepts answer different questions, so placing all four labels in one diagram is only useful when you explain what each boundary controls and who maintains it.

A subscription is an important management and billing boundary; a resource group collects resources managed together through a lifecycle. A resource belongs to one resource group at a time, but resources in different groups can still depend on each other. Grouping by a shared retirement schedule can be more useful than grouping every resource of the same type together. Naming a group “temporary” does not ensure it can be removed safely or that its contents are inexpensive.

Management groups provide an organizing scope above subscriptions. Governance assignments can apply down a scope hierarchy, but inherited context is not a complete authorization verdict. A directory role is not automatically a resource-management permission, and the same display name can conceal different principals. An administrator needs identifiers, scope and assignment details. The local hierarchy exercise deliberately reports ancestry rather than claiming that a list of ancestors proves a person can create, modify or delete a resource.

Consider a fictional reporting service whose application and data storage have different retention needs. Deleting the application group might be appropriate after a pilot, while deleting the data group could violate the retention plan. Record dependencies across those groups before approving retirement. Moving resources also deserves review because not every resource supports every move scenario, and resource identifiers or dependent configuration can matter. A tidy hierarchy is not evidence that a proposed move will succeed without disruption.

Write a lifecycle record with owner, business purpose, environment, funding contact, retention requirement and an explicit disposal decision. Tags can help maintain this record but are not automatically inherited from a resource group by its resources. Check the actual tagging mechanism rather than assuming a visual parent passes down every attribute. Separate a documented ownership convention from an enforced policy. The distinction matters when a resource appears without the expected metadata or when a subscription changes organizational responsibility.

Run the fixed local hierarchy command to inspect ancestry in invented scopes, then compare that receipt with your diagram. Its result is evidence about supplied relationships, not a live subscription inventory or directory discovery. On paper, remove one imagined application group and list dependencies that would require investigation before real deletion. No deletion is performed here. Broader lifecycle administration is enrichment beyond AZ-900 recognition-level concepts, and neither this exercise nor its completion establishes AZ-104 implementation readiness.

## Worked example

Build two ledgers for the fictional reporting service. The first records each scope and parent; the second records application-to-data dependencies that do not follow the parent tree. The command returns ancestors_by_scope for its fixed tree. Compare that actual tree with your prediction, without adding invented resource IDs to the receipt. In a separate paper alternative, the pilot ends but its reports must remain for a retention period. Recommend retiring only the application after dependency review and retaining the data owner and funding record. Label that proposal unexecuted.

```sh
# Offline synthetic model only; no Azure operations.
python3 labs/azure-workshop/run_lab.py hierarchy
```

Run from the workshop directory. Local Python only; no Azure credentials, calls, network or real configuration.

## Practice safely

1. Read the fixed hierarchy fixture and write your prediction before running anything.
2. Draw the decision boundary and list the Azure conditions this local model omits.
3. From the workshop directory run python3 labs/azure-workshop/run_lab.py hierarchy.
4. Compare the receipt with your prediction and retain disagreements rather than editing evidence.
5. Work the alternative in the example on paper only; label it unexecuted.
6. Save the receipt and the three evidence items, with a list of unperformed real Azure validations.

## Evidence to keep

- An annotated scope tree and a separate dependency graph.
- The observed ancestors_by_scope receipt with its scope limitations.
- A paper retirement plan identifying retained data and unperformed move/deletion checks.

## Original check 1

What does a resource group primarily help organize?

A. Resources managed together through a lifecycle
B. All identities in a tenant
C. Every organization on the internet
D. Only resources with identical prices

<details><summary>Answer and reasoning</summary>

A. Resources managed together through a lifecycle

Resource groups are management containers; identity directories and price groupings answer different questions.

</details>

## Original check 2

What does the ancestry receipt prove?

A. That deletion is approved
B. The relationships in the supplied synthetic hierarchy
C. That a principal has Owner access
D. That all Azure moves are supported

<details><summary>Answer and reasoning</summary>

B. The relationships in the supplied synthetic hierarchy

The model has no Azure inventory or authorization engine and evaluates only its provided tree.

</details>

## Original check 3

A resource has no cost-center tag although its group has one. What should you check?

A. Whether tags are always copied automatically
B. Whether deleting the subscription will fix it
C. Whether an explicit inheritance or tagging mechanism was configured
D. Whether the directory password expired

<details><summary>Answer and reasoning</summary>

C. Whether an explicit inheritance or tagging mechanism was configured

Resources do not automatically inherit resource-group tags; verify the actual policy or process.

</details>

## Limits

No tenant discovery, subscription enumeration, resource move or deletion occurs. The ancestry graph is not Resource Manager, RBAC evaluation or a dependency inventory.

## Official references

- https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/overview
- https://learn.microsoft.com/en-us/azure/azure-resource-manager/management/manage-resource-groups-portal
