# Test failure scope and recovery objectives independently

Distinguish surviving resources, sufficient capacity, data freshness and restoration time.

## Learning goals

- Calculate RTO and RPO comparisons with explicit units.
- Separate surviving instances from adequate service capacity.
- Explain why replication is not a universal backup substitute.

## Learn

A reliable architecture names the failures it intends to tolerate. Losing one process, one Availability Zone and an entire Region are different scenarios with different dependencies and recovery costs. Spreading workers across zones may reduce one failure concentration, but it does not prove that the remaining workers, database, routing and credentials can serve the workload. Draw the failure boundary explicitly. Otherwise an availability claim can quietly slide from one small incident to a much larger disaster without supporting evidence.

Recovery time objective, or RTO, describes the acceptable restoration interval. Recovery point objective, or RPO, describes the acceptable age of recovered data. They measure different harms: being unavailable and losing recent work. A service can restore quickly from an old backup, meeting its time target while missing its data target. Conversely, a recent recoverable point can preserve data while a slow restore exceeds the tolerated outage. Report both comparisons separately instead of using one green indicator for recovery.

Survival is also different from capacity. If one worker remains after a zone failure but the application needs two equivalent workers to meet demand, the system has surviving infrastructure without sufficient modeled capacity. Actual capacity is more complicated than a count: workers may have different sizes, warm-up periods or dependency bottlenecks. The exercise intentionally uses an equivalent-worker assumption. State it when interpreting the result so a count comparison is not mistaken for a production load test.

Replication is valuable for availability, but it can reproduce an accidental deletion or corruption. A recoverable history, backup or point-in-time mechanism addresses a different failure mode. Those mechanisms still need access, retained encryption keys, compatible software and a restoration procedure. A backup job reporting success does not prove that the application can use restored data. A meaningful drill checks integrity and dependencies as well as elapsed time, and records the point from which business work can resume.

In the local scenario, app-3 survives the selected zone failure, but the fixture reports insufficient remaining capacity. A 45-minute restoration interval is within a 60-minute RTO; a 20-minute backup age exceeds a 15-minute RPO. Predict all three conclusions before execution. The mixed outcome is the lesson: a successful time comparison does not cancel the capacity shortfall or the missed data objective. Write the consequence of each miss in terms of delayed or lost fictional receipts.

Run the resilience model and preserve its units, thresholds and outcome reasons. No real outage, backup, failover or restore is performed. The fixed numbers are scenario assumptions rather than observed AWS recovery times. A real recovery claim would need an authorized drill with timestamps, integrity checks, dependency validation and measured service behavior under the chosen failure. Your handoff should state which target needs a better design and which evidence remains hypothetical, even when one part of the local result passes.

## Worked example

One survivor, app-3, does not meet the model’s capacity requirement. Restoration takes 45 of the allowed 60 minutes, while recoverable data is 20 minutes old against a 15-minute allowance. RTO meets; RPO misses; capacity remains insufficient.

```sh
# Local synthetic model only; no AWS calls or configuration.
python3 labs/aws-workshop/run_lab.py resilience
```

Run from the workshop directory. Local Python only; no AWS credentials, calls, network or real configuration.

## Practice safely

1. Draw the selected failure boundary and affected dependencies.
2. Predict the survivor set and capacity outcome.
3. Run python3 labs/aws-workshop/run_lab.py resilience.
4. Compare 45≤60 for RTO and 20>15 for RPO.
5. Explain why the three outcomes must remain separate.
6. Specify an authorized restore drill and integrity evidence still needed.

## Evidence to keep

- A failure-boundary and dependency sketch.
- Separate survivor/capacity, RTO and RPO conclusions.
- A proposed real restore drill clearly labeled unexecuted.

## Original check 1

Restoration is fast enough but the restored data is too old. Which conclusion fits?

A. Both targets necessarily meet
B. Only availability percentage matters
C. RTO meets while RPO misses
D. RPO measures worker count

<details><summary>Answer and reasoning</summary>

C. RTO meets while RPO misses

Restoration duration and recoverable-data age are independent comparisons with separate business consequences.

</details>

## Original check 2

One worker survives but two equivalent workers are required. What follows?

A. Survival proves full service performance
B. The backup is necessarily corrupt
C. The Region was restored
D. The modeled capacity requirement is not met

<details><summary>Answer and reasoning</summary>

D. The modeled capacity requirement is not met

A nonempty survivor set does not establish enough capacity; the conclusion remains bounded by the equivalent-worker assumption.

</details>

## Original check 3

Why is replication not always a backup replacement?

A. It can propagate unwanted deletion or corruption
B. It always prevents any outage
C. Backups never need testing
D. RTO and RPO become identical

<details><summary>Answer and reasoning</summary>

A. It can propagate unwanted deletion or corruption

Availability replicas may copy mistakes, so recovery history and tested restoration address additional failure modes.

</details>

## Limits

No AWS failure injection, backup, restore, failover or load test occurs. All times and capacities are fixture assumptions; objectives are not measured production guarantees.

## Official references

- https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/disaster-recovery-dr-objectives.html
- https://docs.aws.amazon.com/wellarchitected/latest/framework/rel_planning_for_recovery_disaster_recovery.html
