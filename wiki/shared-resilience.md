# Availability, backup, RTO and RPO

Design recovery from explicit business requirements.

## Learn

Availability is about service access over time. Redundancy can reduce selected failure risks, but correlated failures, bad deployments and data corruption can affect replicas together.

RTO is the target time to restore service after disruption. RPO is the target maximum data-loss interval. A backup schedule that runs daily cannot automatically satisfy a five-minute RPO.

Test restores, not just backup creation. Keep independent copies and control access. Recovery architecture should include dependencies such as identity, DNS, secrets and network access.

## Worked example

A service needs a one-hour RTO and a fifteen-minute RPO. Daily snapshots alone are insufficient for the data-loss target; the design needs a more frequent protected recovery mechanism and measured restoration.

## Practice safely

1. Define RTO and RPO for a fictional shop.
2. List its dependencies in recovery order.
3. Write a restore test using disposable data.
4. Measure a local file restore and document what it does not prove.

## Check your understanding

A fifteen-minute RPO primarily limits what?

- CPU utilization
- Password length
- Number of regions
- Maximum target data-loss interval

<details><summary>Answer and explanation</summary>

Maximum target data-loss interval. RPO concerns how far back recovered data may be relative to the disruption.

</details>

## Further study

- https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

