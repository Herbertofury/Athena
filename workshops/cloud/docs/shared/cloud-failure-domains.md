# Check the capacity that survives a failure

Place replicas across invented zones and calculate whether the remaining capacity is useful.

**Study time:** about 45 minutes, with pauses for prediction and practice.

## You will learn to

- Explain a failure domain without assuming complete independence.
- Calculate surviving capacity rather than counting zones alone.
- Separate a capacity check from an availability or SLA claim.

## Learn

A failure domain is a boundary within which one event can affect several components. Two processes on one host share a host failure. Several hosts in one location can share a power or network dependency. Separating replicas can reduce some shared risks, but the meaningful boundary depends on the system and the failure being considered.

AWS describes Availability Zones as isolated infrastructure groupings within a Region. Its guidance makes continued operation conditional on correct application architecture. A multi-zone label is therefore not a guarantee that your workload survives a zone loss. Application placement, dependencies, remaining capacity and recovery behavior still matter.

Our baseline has four identical replicas: two in invented zone-a and two in zone-b. Losing zone-a leaves two replicas. Each supports 400 rpm physically, but at the 50 percent target the survivors offer only 400 rpm of planning allowance. The workload demand is 500 rpm, so it had enough target capacity before the failure but not afterward.

An alternative places three replicas in each zone. Losing one zone leaves three and 600 rpm of target capacity, enough for the same assumed demand. The comparison demonstrates headroom arithmetic, not that buying two replicas is always the right solution. Other architectures might reduce demand, improve per-instance capacity or accept a different service objective.

Do not multiply imagined availability percentages and present the result as a measured guarantee. Dependencies can be correlated: a shared database, configuration rollout, identity service or client route can affect replicas in several zones. The local model removes only the named zone’s replicas and assumes all other components work. It has no measured failure rates or durations.

State the failure scenario precisely and ask what still needs testing. A zone-loss capacity calculation does not validate traffic redirection, health checks, data consistency, session handling or recovery from a regional event. Those require separately authorized real-environment exercises and explicit success criteria. In this pack every such cloud exercise remains unexecuted.

## Worked example

Baseline: four replicas supply 800 rpm at the target; after losing zone-a, two supply 400, below demand 500. Alternative: six supply 1200; after the same loss, three supply 600 and meet the modeled target. Neither case measures user-visible availability or proves that failover would happen.

## Practice safely

1. Mark shared dependencies in a sketch of the report service.
2. Predict surviving replica counts and target capacity for both placements.
3. Run python3 labs/cloud-workshop/run_lab.py failure.
4. Explain why two represented zones are insufficient evidence by themselves.
5. Write one additional failure scenario that the model cannot answer.
6. Label actual failover, consistency and recovery testing unexecuted.

Use the [offline lab guide](../../labs/cloud-workshop/README.md) for commands and paper alternatives.

## Three original checks

### Check 1

Four replicas are split two per zone. One zone fails. How many remain in the model?

A. Two
B. Four
C. Three
D. None necessarily

<details><summary>Answer and reasoning</summary>

A. Two. The named failed zone loses its two replicas, leaving two under the explicit assumptions.

</details>

### Check 2

Why does the six-replica alternative meet the 500 rpm target after a zone loss?

A. It has a cloud label
B. Three survivors each provide 200 rpm of target allowance
C. It proves all dependencies are independent
D. It eliminates the need for recovery planning

<details><summary>Answer and reasoning</summary>

B. Three survivors each provide 200 rpm of target allowance. Three times 200 equals 600 rpm, above the assumed demand. That is a capacity result only.

</details>

### Check 3

Which claim would overstate the exercise?

A. The baseline has insufficient target headroom after the modeled loss
B. The alternative has 600 rpm of surviving target capacity
C. The exercise proves the production SLA and actual failover
D. Real dependency behavior remains untested

<details><summary>Answer and reasoning</summary>

C. The exercise proves the production SLA and actual failover. No production service, measured failure rate, SLA calculation or actual failover was exercised.

</details>

## Evidence to keep

- Two before/after capacity calculations.
- A dependency sketch and one omitted failure scenario.
- A clear separation of model output from availability evidence.

## Limits

Invented zones have no provider identity. No failure is induced. Correlated failures, routing, data consistency, health checks and real availability are not modeled or verified.

## Official references

- https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/availability-zones.html
