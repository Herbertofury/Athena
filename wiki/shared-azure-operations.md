# Operate Azure workloads

Connect compute, storage, networks, monitoring and recovery.

## Learn

Azure administration includes deploying and managing supported compute, storage accounts, virtual networks, identity and monitoring. A resource’s existence does not establish that its application is healthy.

Use managed identities where supported, choose storage redundancy from requirements, and restrict network exposure. NSGs, routes, private endpoints and DNS interact; diagnose the complete path.

Plan maintenance, backup and recovery. Azure Monitor can collect metrics and logs, but collection rules, retention, access and cost still need configuration.

## Worked example

A private endpoint exists but the application resolves the public address. Inspect private DNS linkage and resolution before changing firewall rules.

## Practice safely

1. Design a VM and storage deployment without creating resources.
2. List identity, network and monitoring requirements.
3. Write a private-endpoint DNS troubleshooting sequence.
4. Define evidence for a successful backup restore.

## Check your understanding

What is a useful first check when a private endpoint is configured but traffic uses a public address?

- Delete all security rules
- Inspect DNS resolution and private-zone linkage
- Increase VM size
- Disable TLS

<details><summary>Answer and explanation</summary>

Inspect DNS resolution and private-zone linkage. The client must resolve and route to the intended endpoint.

</details>

## Further study

- https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview
- https://learn.microsoft.com/en-us/azure/azure-monitor/overview

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

