# Offline model contracts

## Common contract

`lab.py` exports pure bounded functions. They return newly constructed values without mutating inputs. Contract violations in values raise `ContractError`, a `ValueError` subclass, before producing a result. Calling a Python function with missing/unknown argument names uses Python's ordinary `TypeError`; the CLI and capstone validate exact case keys first and normalize that malformed-fixture condition to `ContractError`.

Every structured record has exactly the documented fields: missing and extra keys are rejected. Lists must be actual lists, with at most 100 entries; duplicates are rejected for identifiers, requirements, capabilities, approvals and graph edges. Empty lists are allowed only where stated below. Tokens contain 1–80 ASCII letters, digits, underscore, dot, colon or hyphen, and start with a letter or digit. No wildcards, URLs or paths are interpreted. Integers must be actual integers, not booleans or floats. Unless stated otherwise their range is 0–1,000,000. Text caveats/summaries are 1–300 characters. The string fields are synthetic labels, not personal data.

`run_lab.py` accepts exactly one of ten names or `--help`/`-h`. It reads only `fixtures/scenarios.json` beside itself, with a 65,536-byte limit. Duplicate JSON object keys, nonfinite JSON constants, malformed UTF-8/JSON, wrong root keys and wrong case keys fail closed. Data values are validated before computation. Successful output is JSON on stdout with exit code 0. Invalid arguments, malformed fixtures and filesystem read errors produce a JSON `input_contract` error on stdout and code 2. Unexpected programming errors are not hidden as successful receipts.

## 1. identity(request, rules, approvals)

Request: `{action, resource, required_approvals}`. Rules: list of `{id, effect, action, resource}`; effect is `allow` or `deny`. Approvals and required approvals are token lists. Rules and approval lists may be empty.

Only exact action/resource equality matches. A matching deny wins. With no matching allow the result is deny. Otherwise missing named approvals give `approval_required`; no missing approvals gives `allow`. Matched IDs and missing approvals are sorted. Approval names do not grant access independently.

This is a decision exercise, **not IAM syntax, policy parsing, authorization, permissions boundaries, SCPs or resource-policy evaluation**. AWS principal and policy-type nuances are not modeled. `actual_authorization` is always false. All data remains readable as a local fixture.

## 2. network(nodes, routes, allows, source, target)

Nodes are unique tokens. Each directed edge is a two-item list of known nodes; routes and allows may be empty. Source and target must exist. Breadth-first search returns a shortest route and a shortest route through the intersection of route/allow edges. Lexicographically sorted neighbors give deterministic ties. No path returns null. A node reaches itself with a zero-edge path. Cycles terminate using a visited set.

The route and allow graphs are **abstract prerequisites**, not route tables or packet filters. Real AWS needs destination matching, ports/protocols, interface/subnet configuration, security-group/NACL semantics, DNS, return paths and other checks. There is no NAT model and no assertion that all AWS NAT gateways are zonal. Same-node graph success is not an application connectivity test.

## 3–4, 6. decision_matrix(requirements, options)

Requirements are nonempty unique tokens. Nonempty options contain `{id, capabilities, caveats}`; capabilities/caveats may be empty. An option is feasible only if every required token is present. `unmet` lists missing requirements. `nearest` includes every candidate with the minimum missing-count, even if none is feasible. `ambiguous` means multiple nearest candidates, not an inferred AWS property. `recommendation` is always null.

Capabilities are **assertions of the fictional design**, not a verified provider catalog. No weighting, price, throughput, latency, engine compatibility or regional availability is inferred. Reordering inputs cannot turn a tie into a recommendation.

Storage's `S3-shaped` candidate means the foundational **object API pattern** only. It is not a claim that the evolving S3 portfolio has no file-access or specialized data offerings. EBS-shaped is block-device access; EFS-shaped is shared NFS-file access. Compute's function/container patterns make no hardcoded duration or quota claims, and do not collapse orchestration and compute capacity into one service. Database explicitly distinguishes RDS Multi-AZ DB **instance** standby (not read serving) from Multi-AZ DB **cluster** readable standbys; check actual engines, deployments and regions separately.

## 5. queues(messages, deliveries, max_attempts)

Messages: unique `{id, amount_cents}`. Deliveries: ordered `{id, handler_ok, ack_received}`, referring to declared messages; may be empty. Boolean fields must be booleans. A failed handler cannot acknowledge in this toy protocol. Max attempts is an integer 1–100.

A successful first handling atomically records an idempotency key and adds its amount. Redelivery of an applied key suppresses the second effect. Acknowledgment marks a message terminal. Unacknowledged delivery reaching the attempt threshold sends it to a dead-letter set. Subsequent scheduled deliveries to acknowledged/dead-letter IDs are reported `ignored_terminal` and do not increment attempts. Every scheduled delivery is validated, including ignored ones.

A message **may be applied and dead-lettered** if its effect committed but acknowledgment never arrived. Do not blindly replay financial side effects from a dead-letter queue. This model assumes atomic effect/deduplication persistence and a stable business key; a real consumer must establish that property. It does not implement visibility timeouts, retention, distributed races, FIFO, service receive-count/redrive exactness, persistence or real payment effects.

## 7. resilience(...)

Replicas contain unique `{id, domain}`; multiple replicas may share a domain. Failed domains are unique known domain names and may be empty. Required survivors is 1 through replica count. Restore minutes, backup age and RTO/RPO targets are bounded nonnegative integers.

All replicas in a failed domain are removed. Sufficient surviving count is independent of provided restore time ≤ RTO and backup age ≤ RPO. Equality meets a target; zero is allowed for given measurements/targets. A count does not establish throughput, quorum, routing, data consistency, health or failover. Backup age is the **given age of the recoverable point for this scenario**, not the age of a backup file or proof of restorability. A historical drill is not a future guarantee.

## 8. operations(evidence)

Evidence is a nonempty list of unique `{id, kind, summary}`. Fictional metric/log kinds map to CloudWatch, api_event to CloudTrail, configuration to AWS_Config; other valid kinds remain unclassified. Input text is preserved and output copied. This is selecting a likely source to investigate, not an exclusive taxonomy: services can forward records to each other. Categories and timestamp correlation do not establish causation or compliance. `real_aws_evidence` is false.

## 9. cost(lines, budget_cents)

Lines are unique `{id, quantity, unit_usd}`. Quantity and rate are unsigned decimal **strings** with up to nine integer and six fractional digits. Only fixed-point notation is accepted; booleans, floats, whitespace, exponents, signs, leading zero ambiguity, NaN and Infinity fail validation. Budget is an integer 0 through 10^18 cents.

With Decimal precision 40, each quantity × unit USD × 100 is rounded independently to integer cents using ROUND_HALF_UP, then summed. Example: two $0.005 extended lines become 1 + 1 = 2 cents, not one rounded aggregate cent. `threshold_reached` uses ≥; `over_budget_cents` cannot be negative. Currency is USD solely for the exercise. Tax, free tier, discounts and unlisted usage are excluded. The threshold is **not a spending cap** and neither quotes AWS prices nor triggers AWS Budget actions. Production billing has its own rounding/rating rules.

## 10. capstone(cases)

Cases must contain exactly the nine named model inputs. The capstone recomputes them, collects explicit issues and lists missing platform evidence. It never outputs a readiness score or certification claim. `deployment_approved` remains false even if hypothetical issues disappear. Its list is not an exhaustive threat model or architecture review.

## Verified conceptual references

The workshop source register reviewed official pages on 2026-11-08. Especially relevant:

- IAM evaluation: https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluation-logic.html
- Routes: https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Route_Tables.html
- Storage patterns: https://docs.aws.amazon.com/decision-guides/latest/decision-guides/choosing-aws-storage-service.html
- Compute patterns: https://docs.aws.amazon.com/decision-guides/latest/decision-guides/fargate-or-lambda.html
- Duplicate delivery: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html
- RDS deployment distinction: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.MultiAZ.html
- Recovery objectives: https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/disaster-recovery-dr-objectives.html

These support concepts only; Python results are not results from those services.
