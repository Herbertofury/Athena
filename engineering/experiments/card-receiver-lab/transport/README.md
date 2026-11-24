# Complete worker transport stabilization

Measured 2026-10-28 in foreground cloud Chromium. All data is generated. The input stays 200 complete records at 8 or 64 KiB metadata each. Both lanes create a worker, clone the full input and run the same bounded complete validator. Clone returns the full object graph; transfer returns the full encoded records plus metadata, then decodes/parses them on the main thread. Exact returned JSON parity is checked after the timed request. No fields or validation are omitted.

Source ENCODE02: [WHATWG transferable objects](https://html.spec.whatwg.org/multipage/structured-data.html#transferable-objects), HTML Living Standard last updated October 26, reviewed October 28. Ownership transfer detaches the sending buffer. That semantic fact is not an end-to-end performance guarantee.

## Failure and actual implementation repair

The first v3 implementation independently encoded the complete records a second time after verification. Dense pass 1 regressed severely. V4 exposes the already-verified encoded buffer and transfers that exact buffer instead; it still performs full metadata, length and digest validation and full receiving-side decoding/parsing. The source retains the old clone and whole-validation modes. No production default changes.

Three alternating pairs per run, two passes per size and version, preserve 48 complete samples. Every parity and empty-frame scheduling gate passed. This is not a statistically conclusive distribution or a cold-cache claim.

| Version / workload | Clone / transfer request median, pass 1 | Clone / transfer request median, pass 2 |
|---|---:|---:|
| V3 / 8 KiB | 67.8 / 66.4 ms | 95.4 / 82.4 ms |
| V3 / 64 KiB | 217.6 / 475.0 ms | 282.2 / 258.8 ms |
| V4 / 8 KiB | 83.0 / 68.1 ms | 86.3 / 84.7 ms |
| V4 / 64 KiB | 190.1 / 231.7 ms | 269.3 / 181.1 ms |

The dense direction still changes across passes after repair. Removing duplicate work is real, but these results do not establish stable end-to-end superiority. V3 and V4 runs are separate observations, not randomized before/after causal proof. Keep every sample and regression; no transfer promotion follows. In v4, transport_encoding_ms is zero because the buffer was created inside validation; reused_verified_encoding explicitly identifies that path. This is not a claim that encoding disappeared from validation time.

Raw files prefixed transport- without v4 are v3; transport-v4 files are repaired v4. Both served-asset receipts retain seven exact SHA-256 comparisons. V4 loaded script: receiver.aebf818f344c3a92.js, harness atlas-complete-receiver-v4-reuse-encoding. Local tests passed: 130 Node, 84 Python. The actual worker handler fixture transfers a real ArrayBuffer via structuredClone, checks source detachment, verifies full received bytes and record parity. The validator envelope test rejects a bad digest and proves the original records are unchanged. These generated handler tests are distinct from the real browser measurements.

No card paint, INP, actual heap/RSS, provider-media coverage, durable-write or other-project claim. The earlier v2 cancellation/recovery test remains separately dated; transfer-specific cancellation is not claimed here. The next candidate should remove only redundant transport of data the receiver already owns, while still validating the complete dataset and binding the receipt to its exact request. That is a research hypothesis, not an accepted implementation.
