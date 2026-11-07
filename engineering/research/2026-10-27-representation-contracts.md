# Compression research: match the fidelity contract first

Reviewed October 27, 2026; these are older papers newly reviewed, not releases from today. Sources [SEM01], [MTS01]. Neither research prototype was installed or executed; no paid model calls were made.

## SemanticZip — May 23, 2026

The [paper](https://arxiv.org/html/2605.24541v1) explicitly studies lossy semantic reconstruction and calls its five-case study a pilot, not a universal benchmark. It is ineligible for byte-exact raw snapshot storage. This requirement mismatch does not establish that it is useless for separate approximate-context tasks. No local model-based reproduction is claimed.

## MTS-1 — January 4, 2026

The [paper](https://arxiv.org/html/2601.01602v1) studies specialized synthetic telemetry and thresholded deltas, reporting storage-size comparisons. Reconstruction/state and schema constraints differ from arbitrary raw JSON; positive thresholds suppress small changes.

An [independent exact-arithmetic probe](../experiments/representation-contract-lab/README.md) retains five generated cases: three lose numeric equality under positive thresholds, while larger-change and zero-threshold controls preserve it. This tests the stated rule, not the author's software or performance. It does not rule out every lossless delta configuration.

## Scoped decision

For exact retained records, evaluate deterministic byte-preserving codecs under the same persistence contract. [Atlas's measured codec lane](../experiments/compressed-snapshot-lab/README.md) retains complete bytes but still finds space/latency tradeoffs, not a universal winner. Approximate summaries and thresholded telemetry need a separately approved loss budget and independent source retention; they cannot quietly replace required raw evidence. No target-project recommendation follows.
