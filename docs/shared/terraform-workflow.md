# Terraform configuration, plan and state

Understand desired state and review changes before applying.

## Learn

Terraform configuration declares resources and relationships. Providers implement API interactions. Initialization installs required provider/module dependencies and configures the backend; planning compares configuration, state and observed infrastructure.

State records resource bindings and attributes. It can contain sensitive values even if outputs are marked sensitive. Protect access, encryption and locking where supported; never commit real state or credentials to a public repository.

Review plans for creates, updates and destroys. Pin appropriate provider versions, commit dependency lock files for providers, and design modules with clear inputs/outputs. A successful plan is not proof that apply will succeed under changing remote conditions.

## Worked example

Changing a resource attribute may force replacement. A review must inspect the plan’s replacement action and data-loss implications rather than assuming every edit is an in-place update.

## Practice safely

1. Write a local, no-cloud configuration using a built-in terraform_data resource.
2. Run fmt, init, validate and plan only if Terraform is available.
3. Inspect the plan without creating paid resources.
4. Explain why state and lock files serve different purposes.

## Check your understanding

Which file may contain sensitive infrastructure attributes?

- Only README.md
- Only a license file
- Terraform state
- A CSS stylesheet by definition

<details><summary>Answer and explanation</summary>

Terraform state. State can store values returned by providers, including sensitive material.

</details>

## Further study

- https://developer.hashicorp.com/terraform/language/state
- https://developer.hashicorp.com/terraform/cli/run

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

