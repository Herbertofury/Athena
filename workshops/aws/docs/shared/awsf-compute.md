# Fit compute capacity to demand and failure assumptions

Compare EC2, scaling and event-driven compute through workload requirements.

## Learning goals

- Relate throughput demand to a stated per-worker capacity.
- Separate scaling policy from application health.
- Describe EC2 and Lambda tradeoffs without assuming universal performance.

## Learn

Compute selection begins with work, not a favorite service name. A receipt processor has an arrival rate, processing time, memory requirement, execution environment and acceptable delay. A steady service with specialized operating-system needs poses a different problem from a short event-triggered function. Amazon EC2 gives control over instances and their operating environment. AWS Lambda provides a managed function execution model with its own runtime, concurrency and execution constraints. Neither is automatically the cheapest or most reliable answer for every workload.

Capacity arithmetic is useful only when its assumptions are visible. Suppose each healthy worker can process a declared number of requests per interval under a representative workload. Divide demand by that capacity and round upward to estimate a minimum worker count. That calculation ignores warm-up, uneven distribution, contention and dependency limits unless you add them explicitly. Treat it as a planning model, not a benchmark. A capacity number copied from another application is a hypothesis requiring measurement.

EC2 Auto Scaling can change group capacity using configured policies and health information. Scaling does not repair every application failure: a newly launched instance may still have bad configuration, an unavailable dependency or a broken release. Health checks need to reflect useful service behavior, and deployment design needs to account for startup and replacement time. Increasing instance count can even increase load on a constrained database. Trace the entire request path before assuming that more compute removes the bottleneck.

Event-driven compute shifts some operational responsibilities but does not remove workload design. Retry behavior, duplicate events, downstream capacity and concurrent executions affect correctness and cost. A short function can still perform the same business action twice unless the application makes repetition safe. A concurrency limit can protect a dependency while increasing waiting time or rejection elsewhere. Document that tradeoff in user-facing terms, such as delayed receipts, rather than presenting a limit as an unqualified improvement.

The fictional capability exercise asks for event_triggered and no_host_management. Both function-shaped and managed-container-shaped records match, so the model reports ambiguity. These labels do not promise identical real event integration: orchestration and triggering must still be designed. Compare runtime needs, persistent-process behavior, workload measurements and operational responsibility to refine the decision. Any worker-count arithmetic from earlier in this lesson is a separate paper planning exercise, not an output of this capability command.

Run the local compute command and retain both feasible candidates and their caveats. No EC2 instance is launched, no Lambda function is invoked and no scaling policy is installed. The receipt cannot establish latency, provider limits, regional availability or production cost. Real selection would require authorized workload measurements and current service constraints. Your result should recommend what to measure next and explain which workload facts could change the choice, rather than declaring a winner from two matching capability labels.

## Worked example

event_triggered and no_host_management retain function-shaped and managed-container-shaped, leaving ambiguous true. vm-shaped lacks the declared pair. This is a requirement matcher, not a benchmark, autoscaler or promise that real services have identical integrations.

```sh
# Local synthetic model only; no AWS calls or configuration.
python3 labs/aws-workshop/run_lab.py compute
```

Run from the workshop directory. Local Python only; no AWS credentials, calls, network or real configuration.

## Practice safely

1. State workload units and acceptable waiting behavior.
2. Predict which candidates declare both required capabilities.
3. Run python3 labs/aws-workshop/run_lab.py compute.
4. Record both feasible candidates and the ambiguity flag.
5. Identify one runtime or integration requirement that could change the choice.
6. Keep optional worker arithmetic on paper and distinguish it from the executed matcher.

## Evidence to keep

- A capability requirement ledger with workload assumptions.
- Both feasible candidates and the unresolved choice.
- A service-selection question requiring real measurements.

## Original check 1

Why round a minimum worker calculation upward?

A. AWS always rounds every bill upward by instance
B. A fraction of a worker does not meet the stated whole-worker model
C. Rounding proves low latency
D. It removes the need for health checks

<details><summary>Answer and reasoning</summary>

B. A fraction of a worker does not meet the stated whole-worker model

The model allocates whole workers, so a fractional demand-to-capacity ratio needs the next whole count; this says nothing about actual billing.

</details>

## Original check 2

Which problem can remain after adding compute workers?

A. All workload constraints necessarily disappear
B. Duplicate events become impossible
C. A saturated downstream database
D. All deployment bugs are repaired

<details><summary>Answer and reasoning</summary>

C. A saturated downstream database

More workers can increase pressure on a shared dependency and do not inherently correct application defects.

</details>

## Original check 3

What is needed to turn hypothetical throughput into production evidence?

A. A service logo
B. Only a local arithmetic result
C. An assumed universal AWS quota
D. Representative measurements with documented workload and conditions

<details><summary>Answer and reasoning</summary>

D. Representative measurements with documented workload and conditions

Capacity planning requires actual workload evidence and current constraints, not universal values inferred from a classroom model.

</details>

## Limits

No EC2, Lambda, load balancer or Auto Scaling deployment occurs. The executable compares declared capabilities; capacity arithmetic is paper-only, and no real benchmark, quota, latency, cost or scaling behavior is measured.

## Official references

- https://docs.aws.amazon.com/decision-guides/latest/decision-guides/choosing-aws-compute-service.html
- https://docs.aws.amazon.com/decision-guides/latest/decision-guides/fargate-or-lambda.html
