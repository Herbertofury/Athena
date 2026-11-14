# Azure coverage and explicit gaps

Reviewed 2026-11-08. This pack provides partial conceptual coverage and original practice. No complete examination coverage or practical readiness is claimed. The public [source register](../research/azure-sources.json) records the scope supported by each official reference; the [objective gap map](../research/azure-objective-gap-map.json) records lesson-level boundaries.

## Version confidence

The official AZ-900 guide reviewed identifies skills measured as of July 20, 2026: cloud concepts 25–30%, Azure architecture and services 35–40%, and Azure management and governance 30–35%. These percentages describe the exam, not this workshop's coverage or score weighting.

AZ-104 current-version verification is incomplete. The opened official study guide displayed October 26, 2023 while other official listing evidence indicated April 17, 2026. The certification page's last-updated date does not independently resolve a conflicting study-guide effective date. Do not represent either date as a fully verified current blueprint. Mapping below uses stable domain names and should be rechecked against consistent official material before exam planning.

## Lesson mapping and remaining work

- **Hierarchy:** selected architecture/resource-management concepts; AZ-104 identities/governance enrichment. Resource moves, deletion, subscription administration and live dependency discovery remain unperformed.
- **Access:** selected identity/access/security concepts; identities/governance enrichment. Real Entra groups, role assignments, managed identities, conditional access and effective data access remain untested.
- **Governance:** selected management/governance concepts; identities/governance enrichment. Policy deployment, effects beyond the bounded rules, exemptions and remediation remain unperformed.
- **Storage:** selected storage concepts; implement/manage storage enrichment. The model compares only LRS, ZRS and RA-GZRS and is not a full option catalog. Account support, regional availability, transfers, authentication, object protections and failover remain untested.
- **Network:** selected networking concepts; virtual networking enrichment. Peering, gateways, load balancing, private endpoint configuration, DNS, real NSG behavior and troubleshooting remain unperformed. Equal-prefix route ties are intentionally unresolved.
- **Compute:** selected compute concepts; deploy/manage compute enrichment. Images, disks, VM/VMSS deployment, App Service, containers, autoscale configuration and representative load tests remain unperformed.
- **Monitoring:** selected monitoring tools; monitor/maintain resources enrichment. Workspaces, diagnostic routing, queries, alert delivery and instrumentation remain untested.
- **Recovery:** selected resilience concepts with broader administration enrichment; monitor/maintain resources domain. Backup and Site Recovery deployment, restore, failover, consistency and measured RTO remain unperformed.
- **Cost:** selected cost-management concepts; identities/governance enrichment. Live billing, pricing, purchases, reservations and savings validation remain unperformed. A budget is not a hard consumption cap.
- **Capstone:** cross-domain synthesis with explicit evidence gaps. It is not a complete architecture review or a readiness assessment.

## Other omissions

This pack does not exhaust cloud concepts, pricing models, all Azure service families, migration tools, governance products, compliance offerings or every objective bullet. It contains no licensed exam questions and makes no prediction of examination success. Thirty original checks test the supplied teaching content only; they are not a psychometrically validated assessment.

A next-stage practical plan would need an authorized isolated Azure environment, spending controls, scoped access, specific acceptance criteria and cleanup review. This document proposes no provisioning and records no real Azure execution. Never convert the fixed synthetic receipts into claims about a tenant, subscription or workload.
