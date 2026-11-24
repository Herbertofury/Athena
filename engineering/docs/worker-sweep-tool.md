# Worker-sweep screening tool

The [worker-sweep evaluator](../scripts/compare_worker_sweep.py) makes a 4/8/16/32/64 experiment harder to cherry-pick. It **does not run benchmarks, change application defaults, certify statistical significance or prove supplied measurements are truthful**.

Run `python scripts/compare_worker_sweep.py SWEEP.json`. Supply an object with:

- `schema`: integer 1.
- `baseline`: a complete [benchmark-contract](benchmark-format.md) record.
- `candidates`: exactly five objects, each containing `workers` and `benchmark`.
- `budgets`: positive finite absolute ceilings for `peak_memory_mb`, `peak_handles`, `ui_latency_ms` and `cancel_latency_ms`.
- `minimum_reduction_percent`: required median complete-result reduction, greater than zero and less than 100.
- `near_fastest_percent`: nonnegative tolerance up to 10 for preferring a smaller worker count near the fastest eligible median.

Every sample, including baseline samples, must contain the four additional resource observations as finite nonnegative numbers. Define the observation protocol before collecting them: memory and handles are run peaks; UI latency is the same declared per-run interaction statistic; cancellation latency comes from the same separate cancellation probe associated with that trial. A canceled workload is never passed off as a completed scan. Retain the probe traces and instrument overhead separately. Missing observations are errors, not zero.

## Gates and selection

The existing comparator first requires matching workloads, environments, conditions, normalization contracts, pair IDs, result hashes, counts and warnings. Candidate configurations must use one code revision so worker count is the intended independent variable. This cannot detect undeclared runtime/configuration differences: the experiment record must include those too.

A configuration is ineligible if it misses the declared complete-result improvement, regresses the sample completion p95, exceeds any absolute resource ceiling, or regresses a resource median. Among eligible configurations, the tool finds the fastest median, then suggests the smallest worker count within the declared near-fastest tolerance. No eligible configuration yields a null suggestion. The output always sets `accepted_in_application` to false.

These are deliberately conservative screening rules. They are not a universal optimization objective. If a product knowingly trades a little memory for much better latency, that needs an explicit separately reviewed policy rather than silently weakening this result. A single resource maximum above budget rejects the configuration even when its median looks good.

## Experiment quality still belongs to the investigator

Interleave or randomize configuration order, preserve cache/thermal/background-load conditions, repeat on representative storage and hardware, and retain unsuccessful trials. Five pairs are only the parser's minimum, not an assurance of statistical power. The p95 of a small sample is an order statistic, not a reliable production tail estimate. Validate cancellation, error ordering, thread/handle cleanup, supported input coverage and UI behavior in the actual installed build.

A sweep cannot isolate worker count if algorithms change between its candidates. Compare the old and new algorithm separately, then hold the new implementation fixed across the worker sweep. Do not select a default from a microbenchmark that excludes the real bottleneck.

## Tests

The tests manufacture synthetic records to exercise ties, near-fastest selection, output mismatch, missing counts, revision drift, resource regressions, tail regressions, invalid measurements and no-improvement cases. Synthetic timings are not application results. The tool only reads its JSON input and prints a review report.
