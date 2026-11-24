# Metrics, logs, traces and SLOs

Measure user-visible behavior and diagnose causes.

## Learn

Metrics summarize measurements over time, logs record events and traces connect work across components. All can be incomplete or misleading if timestamps, labels or sampling are wrong.

A service-level indicator measures behavior, such as successful request fraction or latency. An SLO sets a target over a window. Alert on actionable symptoms, and use detailed telemetry to find causes.

Percentiles reveal tail behavior that averages can hide. Compare before and after under controlled workload and correctness requirements. Never treat a synthetic benchmark as proof of production improvement.

## Worked example

Mean latency falls while p99 rises because a small fraction of requests now wait on a lock. Averages alone conceal the degraded user experience.

## Practice safely

1. Create ten fictitious latency samples with one outlier.
2. Compute mean and compare it with the slowest values.
3. Define a useful SLI and alert for a small API.
4. Explain what logs would distinguish timeout from authorization failure.

## Check your understanding

Why inspect tail latency?

- It reveals slow experiences hidden by averages
- It always equals the mean
- It replaces correctness tests
- It proves a service is secure

<details><summary>Answer and explanation</summary>

It reveals slow experiences hidden by averages. A small fraction of very slow requests can materially affect users.

</details>

## Further study

- https://sre.google/sre-book/service-level-objectives/

**Depth:** Introductory teaching with a concept check; this is not evidence of full-domain mastery.

