# Benchmark input contract

Use JSON schema version 1 with label, source_revision, kind (`measured` or `synthetic`), condition, environment_id, workload_sha256 and a normalization object containing name, version and excluded_fields. Record the environment's detailed hardware/OS/toolchain and raw trace location in the experiment record. environment_id must refer to the same actual environment for both files, not merely use matching text.

Each sample requires a unique pair_id, positive finite elapsed_ms, status `complete`, a SHA-256 of the normalized complete result, result_count and a warnings list. At least five matched pairs are required by this helper; that minimum does not establish statistical confidence or representativeness.

The comparator rejects different workloads, conditions, environments, normalization contracts, result hashes, counts or warning lists. It reports median timing, a sample p95 and paired ratios, including regressions. It does not certify that a supplied hash is truthful, that excluded fields are nonsemantic, or that memory/security/UI budgets passed. Review the actual evidence.

[The baseline fixture](../tests/fixtures/synthetic-baseline.json) and [candidate fixture](../tests/fixtures/synthetic-candidate.json) are synthetic demonstrations only. Their intentional 2× ratio is not a performance claim for any application.

## Mutable discovery is part of the workload

A file hash alone may not identify the complete input state when background discovery, remote metadata or an ownership index can change the result. Record those generations and retain both full outputs when a hash changes. Compare the exact changed fields before attributing the difference to an optimization. Do not normalize away richer evidence, warnings or ownership reasons merely to restore equality.

For a steady-state comparison, establish the same settled discovery snapshot on both sides and label it as such. For first-use behavior, include discovery in both timed operations and compare against the appropriate complete reference. Keep process-cold, disk-cache-cold, discovery-cold and warm reuse distinct. A settled baseline does not establish cold-start performance. Measure readiness inside the application rather than including unrelated automation transport/wait time.

## Reject contradictory wire records

The comparator and worker-sweep CLIs use the existing strict Atlas receipt decoder. Duplicate JSON object keys at any depth (including equivalent escaped spellings), non-finite constants and overflowing floating-point literals are rejected before comparison. Unknown finite fields remain available; they are not silently stripped or treated as measured evidence. Direct Python dictionary callers cannot recover keys already discarded by an earlier permissive decoder.

[Wire-format regression evidence](../experiments/benchmark-wire-lab/README.md) retains an actual prior CLI false acceptance of contradictory synthetic status fields and the repaired rejection. Valid benchmark output is unchanged. This is an evidence-integrity repair, not an application performance improvement or a guarantee that supplied measurements are truthful.
