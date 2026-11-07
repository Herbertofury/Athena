# Cloud cost and lifecycle discipline

Estimate, tag, monitor and remove disposable resources.

## Learn

Cloud cost depends on resource size, duration, requests, storage, transfer and service-specific pricing. A free tier is a conditional allowance, not permission to assume a lab is free.

Use budgets and alerts, but understand they may not be hard spending caps. Tag resources by purpose and owner. Prefer local or simulated labs until you deliberately approve a paid environment.

Cleanup is part of the lab: inventory resources, delete only disposable items, verify deletion and check for retained disks, snapshots, addresses and logs. Preserve work before removing resources.

## Worked example

Stopping a VM may stop compute charges while disks or reserved addresses continue billing. The resource lifecycle must be checked service by service.

## Practice safely

1. Use a provider pricing calculator without deploying.
2. Estimate a small service for a month.
3. List costs not included in VM hourly price.
4. Write a cleanup checklist and a maximum spending decision.

## Check your understanding

Which assumption is unsafe?

- Storage may continue billing after compute stops
- A budget alert always prevents overspending
- Costs depend on usage
- Unused resources need review

<details><summary>Answer and explanation</summary>

A budget alert always prevents overspending. Alerts and enforced limits are different mechanisms.

</details>

## Further study

- https://aws.amazon.com/aws-cost-management/
- https://learn.microsoft.com/en-us/azure/cost-management-billing/

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

