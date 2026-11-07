# HashiCorp Terraform Associate

**Blueprint:** 004; Terraform 1.12

**Reviewed:** 2026-11-07

**Verification:** Official current credential page and objectives read

**Coverage:** Introductory lessons + guided lab roadmap; not a complete exam-preparation course

## Ordered study path

1. [Terraform configuration, plan and state](shared-terraform-workflow)
2. [Terraform modules, drift and recovery](shared-terraform-lifecycle)
3. [Authentication, authorization and accounting](shared-identity)
4. [Cloud cost and lifecycle discipline](shared-cost)
5. [Shell pipelines and safe automation](shared-shell-data)

## Domain roadmap

These are paraphrased domain headings, not an exhaustive official-objective transcript. Every row remains a roadmap until detailed instruction and assessment are verified.

- [ ] IaC rationale: add/verify detailed subobjective mapping, deeper instruction, worked scenarios and practical evidence.
- [ ] Providers and Terraform basics: add/verify detailed subobjective mapping, deeper instruction, worked scenarios and practical evidence.
- [ ] Initialize, validate, plan and apply: add/verify detailed subobjective mapping, deeper instruction, worked scenarios and practical evidence.
- [ ] Configuration language: add/verify detailed subobjective mapping, deeper instruction, worked scenarios and practical evidence.
- [ ] Reusable modules: add/verify detailed subobjective mapping, deeper instruction, worked scenarios and practical evidence.
- [ ] State and locking: add/verify detailed subobjective mapping, deeper instruction, worked scenarios and practical evidence.
- [ ] Imports, drift and operations: add/verify detailed subobjective mapping, deeper instruction, worked scenarios and practical evidence.
- [ ] HCP Terraform collaboration and governance: add/verify detailed subobjective mapping, deeper instruction, worked scenarios and practical evidence.

## Guided capstone

### Version a local infrastructure workflow

1. Use labs/terraform/main.tf in a disposable directory with Terraform 1.12-compatible tooling.
2. Run terraform fmt -check, init, validate and plan; inspect every proposed change.
3. Apply only this local terraform_data resource, inspect output and local state, then rerun plan to observe no changes.
4. Change the input, review and apply the plan, then destroy the local resource and verify the resulting state.
5. Never commit state or substitute real cloud providers without a separate cost/access review.

### Acceptance evidence

- Exact Terraform version and command output.
- A no-change plan after convergence.
- Cleanup evidence and an explanation of state versus provider lock files.

## Version and booking notes

- One-hour multiple-choice exam; credential expires after two years. Do not silently teach the older 003 blueprint.
- Local-only or simulated labs should be labeled; cloud apply operations can incur charges and require user authorization.

**Price status:** Plus local taxes and fees; no free retake

## Official sources

- [Current exam version, objectives and price](https://developer.hashicorp.com/certifications/terraform-associate)
