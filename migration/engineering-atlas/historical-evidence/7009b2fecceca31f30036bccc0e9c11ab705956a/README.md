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

## Complete-validation encoding refinement

The second isolated implementation replaces one dataset-sized JSON string with per-record serialization into a single bounded UTF-8 buffer. It checks both consumed code units and exact final byte length before the same SHA-256 validation. It never samples, omits fields or trusts a supplied digest. Source ENCODE01: [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/#dom-textencoder-encodeinto), reviewed October 28; documented semantics, not a speed guarantee.

Two fresh Node process passes retain 72 full validations in [pass 1](complete-pass-1.json) and [pass 2](complete-pass-2.json). These compare two complete validators, unlike the earlier structural-only control:

| Workload | Whole / bounded median, pass 1 | Whole / bounded median, pass 2 |
|---|---:|---:|
| 1 × 64 bytes | 0.410 / 0.325 ms | 0.165 / 0.232 ms |
| 200 × 8 KiB | 8.318 / 6.465 ms | 7.339 / 5.186 ms |
| 200 × 64 KiB | 95.687 / 75.054 ms | 71.091 / 55.306 ms |

The large-case median improves about 22% in both passes. Small-case direction changes, and the first 8 KiB candidate maximum regresses (23.129 versus 15.210 ms). Keep those regressions. This is an algorithm/allocation-shape change, not a cache setting; actual heap/RSS remains unmeasured. The encoder is scoped to already-validated JSON records, not arbitrary objects with getters, callable toJSON hooks or non-JSON values. Three new test functions include 1,024 generated Unicode cases, escape/order parity, under/oversized destinations and retained receiver corruptions. All 126 Node tests pass. Run compare-complete.mjs with either fixed pass filename in a fresh copied directory; existing receipts cannot be overwritten. The browser harness remains unchanged until browser responsiveness, worker, cancellation and memory gates are tested.
