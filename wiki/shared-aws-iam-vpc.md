# AWS IAM and VPC boundaries

Apply least privilege and trace traffic through the network.

## Learn

IAM evaluates identity and resource policies with other controls such as organization policies, boundaries and session policies. An explicit applicable deny generally overrides an allow. Do not model all AWS permissions as one flat role list.

A VPC has subnets, route tables and connectivity components. Security groups are stateful controls on supported resources; network ACLs are stateless subnet-level controls. Routing and authorization must both permit the intended traffic.

Prefer temporary credentials and workload roles to embedded long-lived keys. Verify endpoint policies, DNS and service-specific access as part of the complete request path.

## Worked example

A database in a private subnet needs no public inbound path. An application’s security group can be a more precise permitted source than a broad internet CIDR, where the service supports it.

## Practice safely

1. Create a paper-only IAM policy for reading one fictitious bucket prefix.
2. Identify excessive wildcards.
3. Trace an application-to-database request through routes and controls.
4. Use the built-in policy simulator as a simplified exercise, not an AWS emulator.

## Check your understanding

Which AWS control is stateful?

- A network ACL
- Every route table
- A DNS A record
- A security group

<details><summary>Answer and explanation</summary>

A security group. Security groups track permitted connection state; network ACLs require corresponding directional rules.

</details>

## Further study

- https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html
- https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

