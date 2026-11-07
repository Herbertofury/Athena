# Cloud prediction key

## Models and responsibilities

IaaS, PaaS and SaaS describe capability/control boundaries. Private, community, public and hybrid are deployment categories. Public cloud does not authorize public data. Service-specific responsibilities vary, but data audience, identities, configuration choices and recovery expectations still need owners. A provider-run host cannot decide the workshop’s intended readers.

## Scope and network

Narrow academy/dev contains only academy/dev/reports. Broad academy contains all three fixture resources. Segment dev-tools differs from dev; substring similarity is not parenthood. This says nothing by itself about effective IAM permissions.

The baseline network model fails service_listening. The second fails identity_allows. No packets or live policy checks were performed. Opening broader traffic would not establish a running service or intended application authorization.

## Storage

Report documents suggest object-style access; a VM disk suggests block access; an application requiring a shared filesystem suggests file access. These are initial interface matches, not universal service selections. Exact consistency, permission, latency and integration requirements still need checking. An unwanted overwrite can be stored durably, so durability alone is not a tested recovery plan.

## Scaling

400 rpm × 50% = 200 rpm of target allowance per replica. Ceiling(850/200) = 5 needed. Maximum 4 yields 800 target capacity and 1600 physical capacity. Target is unmet, physical capacity is met and the plan is capped. At demand 0 the configured minimum still plans 2; at 800 it needs/plans 4; at 801 it needs 5/plans 4; at 1700 it needs 9/plans 4 and misses both target and physical capacity. These are model results, not observed latency or autoscaling events.

## Zone loss

Baseline four replicas yield target capacity 800; losing zone-a leaves two and 400, below demand 500. Alternative six yield 1200; losing zone-a leaves three and 600, enough at the target. A shared database or faulty common deployment could affect both zones. The exercise provides no SLA or real failover evidence.

## Recovery

Data gap is 600−580 = 20 minutes. Downtime is 650−600 = 50 minutes. RPO 15 is missed; RTO 60 is met. Moving the recovery point to 590 changes only the data gap, now 10, which meets RPO. This does not change downtime.

The local restore verifies fixed earlier bytes against SHA-256, writes them to a fresh restore file and confirms its temporary directory was removed. Current source intentionally differs. It does not validate an application, database consistency, cloud key access, regional recovery or a production timeline.

## Cost

Always-on compute is 3×720×5 = 10800 fictional credits; storage is 100×2 = 200; transfer is 50×3 = 150; total 11150, 1150 above budget. Scheduled compute is 3×160×5 = 2400; plus 350 gives 2750, 7250 below. Doubling only transfer adds 150 to each total. Storage and transfer do not disappear when only compute hours change. Rates are invented; alerts can arrive after additional usage/charges have accrued.

## Change report

ID order: add queue; remove reports; modify web fields public and size. Risk notes cover possible data/service loss from reports removal and increased web exposure. No change is applied. A change in kind is modeled as replacement only by this invented schema. Real provider replacement behavior can differ.

## Capstone quality

A strong review connects requirements to assumptions, records exact local commands/results, distinguishes actual local file operations from arithmetic models and names the cloud work still unexecuted. It does not promise real uptime, savings, least privilege, restoration success or exam readiness from these bounded exercises.
