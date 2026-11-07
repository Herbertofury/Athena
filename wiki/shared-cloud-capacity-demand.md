# Calculate capacity without inventing elasticity

Use an explicit target and maximum to understand what scaling can and cannot solve.

## Learning goals

- Calculate replicas from demand and per-instance capacity with units.
- Distinguish a utilization target from a physical ceiling.
- Identify omitted startup, quota and dependency constraints.

## Learn

Elasticity is the ability to adjust resources as demand changes; it is not unlimited instant capacity. A scaling design needs a signal, a target, minimum and maximum capacity, and assumptions about how additional instances help. A service can add workers while its database, lock or external dependency remains the bottleneck.

AWS Auto Scaling offers target-tracking and other dynamic policies with service-specific behavior and bounds. We use an original, much simpler arithmetic model: identical replicas appear immediately, distribute work evenly and each have a fixed request-per-minute capacity. The model has no actual utilization metric, warm-up time, queue or cloud quota.

Write the units before the calculation. At 400 requests per minute per replica and a 50 percent target, the planning allowance is 200 requests per minute per replica. For demand 850, divide by 200 and round upward: five replicas are needed at the target. Rounding down would knowingly omit capacity from the planning calculation.

The configured maximum is four, so the local plan returns four and marks the target unmet. Their modeled physical capacity is 1600 requests per minute, but the 50 percent planning allowance is only 800. Both statements can be true: the physical ceiling is not exceeded while the desired headroom is missing. Do not label every target miss an observed outage.

A minimum can preserve baseline capacity during quiet periods; a maximum can limit expansion. Neither is a substitute for understanding cost, startup delay or graceful overload behavior. An apparently generous maximum can still be unreachable if quotas, placement constraints or a downstream service limit intervene. Those real constraints are not represented by the local integer calculation.

Predict changes before editing a study copy of the fixture. What happens at demand zero, exactly 800, just above 800 or far above physical capacity? Keep the original distribution tests unchanged so your modified scenario is not confused with a broken pack. Record your assumptions and explain why a load test against an authorized deployed service would be a separate, unexecuted activity.

## Worked example

The fixed command needs five replicas but plans four. It reports target capacity 800 rpm and physical capacity 1600 rpm for demand 850. target_met is false, physical_capacity_met is true, and capped_by_maximum is true. These are arithmetic outcomes, not provider telemetry or an actual autoscaling event.

## Practice safely

1. Calculate the planning allowance per replica and show the units.
2. Predict the needed and capped replica counts for the fixture.
3. Run python3 labs/cloud-workshop/run_lab.py scaling.
4. Explain how target_met can be false while physical_capacity_met is true.
5. In a private fixture copy, compare demand 0, 800, 801 and 1700, recording each prediction.
6. Name four real scaling constraints the model omits.

## Evidence to keep

- A unit-labelled capacity calculation.
- Baseline and modified synthetic predictions.
- A list of omitted constraints and an unexecuted load-test label.

## Original check 1

At 400 rpm per replica and a 50 percent target, what is the target allowance?

- 50 rpm
- 200 rpm
- 400 rpm
- 800 rpm

<details><summary>Answer and explanation</summary>

200 rpm. 400 multiplied by 0.50 gives 200 requests per minute of planned load per replica.

</details>

## Original check 2

Demand is 850 rpm and the target allowance is 200 rpm. How many replicas are needed before applying the maximum?

- Four
- Two
- Five
- Zero

<details><summary>Answer and explanation</summary>

Five. 850/200 is 4.25, which must be rounded up to meet the target.

</details>

## Original check 3

The target is missed but the modeled physical capacity is sufficient. What can you honestly claim?

- A real outage definitely occurred
- The maximum no longer matters
- The provider has created a fifth instance
- The modeled headroom target is unmet, not that a live outage was observed

<details><summary>Answer and explanation</summary>

The modeled headroom target is unmet, not that a live outage was observed. The model distinguishes planning headroom from physical capacity and does not observe or provision a live system.

</details>

Supplemental checks are session practice. They do not add XP or change the primary spaced-review schedule.

## Scope and limits

The model is instantaneous, linear and homogeneous. It does not emulate provider scaling algorithms, instance weights, startup time, quotas, latency, queueing or real load-test results.

## Official references

- [https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scale-based-on-demand.html](https://docs.aws.amazon.com/autoscaling/ec2/userguide/as-scale-based-on-demand.html)

- [https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-145.pdf)

