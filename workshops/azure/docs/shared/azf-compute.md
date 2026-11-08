# Size capacity without promising application availability

Use demand arithmetic, scaling limits and operational responsibility to review compute choices.

## Learning goals

- Compare VM and managed application responsibilities.
- Compute required instances and expose maximum-capacity shortfalls.
- Separate capacity from application health and resilience.

## Learn

Choosing compute begins with workload behavior and operational responsibility. A virtual machine gives control over an operating system and its configuration, while managed application platforms reduce some infrastructure management work. Containers package an application with dependencies but do not erase responsibility for application security, image maintenance or service configuration. The right choice depends on runtime needs, deployment model, integration constraints and the team's ability to operate the workload. A familiar service name is not a substitute for those requirements.

Virtual Machine Scale Sets help manage groups of virtual machines, with orchestration and scaling capabilities that require deliberate configuration. Scaling is not simply multiplying an instance count. Images, networking, health evaluation, instance initialization and application state all affect whether additional instances can serve requests. A scale-out decision may be correct while new instances take time to become useful. Document the startup delay and the signal that indicates readiness rather than assuming a provisioned machine immediately contributes full productive capacity.

A first capacity estimate divides forecast demand by measured safe capacity per instance and rounds upward. That estimate depends on what was measured: request mix, response-time target, database behavior and background tasks can change the result. Maximum instance settings constrain the requested capacity. A budget, quota or regional limit can constrain it further, but those are separate mechanisms. Recording the gap between required and configured capacity is more informative than claiming that the presence of autoscale guarantees demand will be met.

Autoscale rules need appropriate signals, thresholds, time windows and cooldown behavior. CPU utilization can be useful for one workload while queue length or request pressure may be more relevant for another. Aggressive rules can oscillate or react to noise; slow rules may leave users waiting through a sustained surge. A bounded arithmetic model does not predict those dynamics. It can expose a capacity ceiling, but it cannot tell you whether a real scaling policy reacts in time or whether the application remains healthy.

The reporting fixture requires eight instances under its simplified demand assumption. Four current instances leave a shortfall of four, while the configured maximum permits only six. The model therefore reports insufficient capacity even after capping the scale target. This is a review finding, not a request to increase a quota or spend money. A team should investigate demand shaping, per-instance performance, architecture constraints and financial authorization before deciding whether a larger fleet is appropriate. Availability also requires attention to failure domains and dependencies.

Run the compute command and independently reproduce its rounding and ceiling comparison. Then propose a paper-only response to the shortfall with at least two options and their risks. Increasing the maximum is one option, not the only answer. State what measurements would distinguish the options. This administrative reasoning extends beyond foundational service recognition. No VM is created, no scale rule is configured and no load test is run; the receipt demonstrates arithmetic on supplied values rather than validated Azure application capacity.

## Worked example

The receipt reports required_instances 8, shortfall 4, capped_instances 6 and capacity_sufficient false. Distinguish the current shortfall from the smaller remaining deficit after reaching the configured ceiling. A paper alternative increases measured per-instance throughput through application optimization; another raises the ceiling after authorization and quota review. Compare evidence needed for each rather than assuming either succeeds. The fixed run does not benchmark optimization, alter a scale set or charge for additional instances.

```sh
# Offline synthetic model only; no Azure operations.
python3 labs/azure-workshop/run_lab.py compute
```

Run from the workshop directory. Local Python only; no Azure credentials, calls, network or real configuration.

## Practice safely

1. Read the fixed compute fixture and write your prediction before running anything.
2. Draw the decision boundary and list the Azure conditions this local model omits.
3. From the workshop directory run python3 labs/azure-workshop/run_lab.py compute.
4. Compare the receipt with your prediction and retain disagreements rather than editing evidence.
5. Work the alternative in the example on paper only; label it unexecuted.
6. Save the receipt and the three evidence items, with a list of unperformed real Azure validations.

## Evidence to keep

- An independently calculated required count, current shortfall and capped deficit.
- A decision record comparing optimization with a higher ceiling.
- A list of unperformed health, load, quota and scaling-delay validations.

## Original check 1

Demand requires eight instances but the ceiling is six. What is justified?

A. Autoscale guarantees eight anyway
B. The workload is proven highly available
C. The budget automatically approves more instances
D. The configured ceiling cannot satisfy the modeled demand

<details><summary>Answer and reasoning</summary>

D. The configured ceiling cannot satisfy the modeled demand

A maximum of six leaves a modeled capacity deficit when eight are required.

</details>

## Original check 2

What does a new VM instance count fail to prove?

A. That the application is initialized and serving healthy requests
B. That a count can be recorded
C. That scaling has a configured ceiling
D. That demand can be estimated

<details><summary>Answer and reasoning</summary>

A. That the application is initialized and serving healthy requests

Provisioned infrastructure and useful application readiness are different states.

</details>

## Original check 3

Which input most strengthens capacity planning?

A. The longest service name
B. Measured safe throughput under a representative workload
C. The cheapest region label alone
D. A universal instance count for all apps

<details><summary>Answer and reasoning</summary>

B. Measured safe throughput under a representative workload

Capacity estimates depend on workload and performance evidence.

</details>

## Limits

No compute deployment, autoscale, quota request, benchmark or health probe occurs. Deterministic arithmetic omits startup delay, noisy signals, dependency bottlenecks and real service limits.

## Official references

- https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/compute-decision-tree
- https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/overview
