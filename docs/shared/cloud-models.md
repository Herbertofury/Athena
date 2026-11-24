# Cloud service models and responsibility

Know what the provider manages and what remains yours.

## Learn

IaaS exposes infrastructure primitives; PaaS manages more of the runtime platform; SaaS provides a complete application. The boundary varies by service, so inspect its actual responsibility model.

Cloud does not eliminate configuration, identity, data classification, backup or cost responsibility. Managed services reduce some operational tasks while introducing service limits and dependencies.

Public, private and hybrid deployment describe organizational arrangements, not a universal security ranking. Select architecture from requirements, data location, operations, latency and cost.

## Worked example

Moving from a VM database to a managed database may shift OS patching to the provider. You still control data access, schema, retention choices and many resilience settings.

## Practice safely

1. Compare a VM, managed database and hosted email service.
2. Create a provider/customer responsibility table.
3. Identify one operational benefit and one trade-off for each.
4. Do not create paid resources for this exercise.

## Check your understanding

Which responsibility usually remains with a cloud customer?

- Physical data-center access control
- Replacing provider disks
- The customer’s data-access configuration
- Provider building power supply

<details><summary>Answer and explanation</summary>

The customer’s data-access configuration. Customers still configure identities and access to their data and resources.

</details>

## Further study

- https://aws.amazon.com/compliance/shared-responsibility-model/
- https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

