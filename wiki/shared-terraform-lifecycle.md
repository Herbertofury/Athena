# Terraform modules, drift and recovery

Manage change without hiding unexpected differences.

## Learn

A module is a collection of configuration with inputs and outputs. Good module boundaries model useful concepts, not every single resource wrapped without benefit.

Drift is a difference between configuration expectations and actual infrastructure. Investigate whether it reflects an emergency repair, a competing controller or an unintended change before forcing reconciliation.

Import connects existing resources to configuration/state workflows; it does not magically infer a complete safe design. State operations are consequential. Back up and understand state before moving or removing bindings.

## Worked example

An operator changes a firewall manually during an incident. The next plan shows drift. Determine whether the change is still required and update the intended configuration rather than blindly reverting it.

## Practice safely

1. Create two small local modules with explicit outputs.
2. Write a change-review checklist.
3. Describe a drift scenario and an ownership policy.
4. Do not practice state surgery against production.

## Check your understanding

What should happen before reconciling unexpected drift?

- Blindly apply
- Delete the state file
- Ignore all future plans
- Understand the cause and intended state

<details><summary>Answer and explanation</summary>

Understand the cause and intended state. A plan reports differences; humans or policy must determine which state is correct.

</details>

## Further study

- https://developer.hashicorp.com/terraform/language/modules
- https://developer.hashicorp.com/terraform/cli/import

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

