# Complete-data receiver stabilization lane

Checked 2026-10-28 against Atlas source commit `f54cd77dd51303149732f8d136f82b4bbe914f0b`. This is an isolated candidate, not a deployed browser-harness replacement or another project's recommendation.

## Reproduced defect

The existing generated-card receiver validates identity, metadata length/prefix, digest shape and a byte-count range. It does not establish that the entire metadata tail is unchanged, that the digest matches the received records or that the byte count is exact. The [retained baseline](baseline.mjs) preserves that behavior (only its relative import changes). All three generated corruptions in [raw results](results.json) pass the baseline and are refused by the candidate. The damaged fixtures and both outcomes are retained.

## Candidate and tradeoff

[Verified receiver](verified-receiver.mjs) reuses the baseline structural checks, validates the complete deterministic metadata suffix, rejects undisplayed extra fields in this closed generated schema, then independently reserializes, encodes and hashes all received records. It returns the exact original object without mutation. This closed-schema policy is not appropriate for arbitrary provider responses and must not be copied into adapters.

The experiment runs four alternating paired rounds for three workloads, 24 validations total, with full pre/post serialized parity. Node-only medians in this run:

| Generated workload | Existing structural check | Complete candidate |
|---|---:|---:|
| 1 × 64 bytes | 0.0295 ms | 0.410 ms |
| 200 × 8 KiB | 0.106 ms | 8.733 ms |
| 200 × 64 KiB | 0.676 ms | 235.755 ms |

These are different amounts of validation work, not a speed competition with equivalent correctness. The added cost is material at high density, so the candidate is NOT promoted. Keep the existing source and failed evidence. Next acceptance gates are reducing complete validation overhead without weakening it, actual worker/message integration, cancellation/interruption and last-good-data tests, and foreground browser input/visibility/memory measurements. No browser rendering, provider, storage, peak-memory or target-project performance claim follows from this Node experiment.

Three dedicated test functions also check a damaged tail with a matching recomputed digest, exact valid-record preservation and extra-field rejection. Local full suites: 123 Node tests and 82 Python tests passed. Run `node experiments/card-receiver-lab/run.mjs` from the repository root to reproduce; its 60-second cooperative budget bounds this fixed workload, not a hard operating-system resource cap. The runner refuses to overwrite an existing results file; use a separate copied experiment directory for another run. Existing production assets, adapter work and other projects remain unchanged.
