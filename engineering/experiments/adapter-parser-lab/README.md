# Attribute-parser allocation experiment · 2026-10-26

**Status: incomplete / stabilization lane, not a target recommendation.**

This experiment reuses an existing public parser rather than replacing it with a reduced collector. Source E82 pins the reference revision. The isolated candidate removes repeated attribute-name escaping and RegExp object construction with a bounded 64-entry map. This is a small allocation-reuse optimization, not evidence of a substantial end-to-end improvement. V8 may already reuse compiled regexp internals; no recompilation claim is made.

## Measured scope

Node 24.22.1, Linux x64; four generated Nexus-shaped HTML workloads, nine randomized paired rounds each, two warmups per strategy. Full parser timing only; output serialization and equality checks occur outside the timer. All 72 outputs matched in full, with 6/64/256/1024 gallery entries respectively. An additional 10,000 attribute differential checks passed, including more distinct names than the map capacity. Both unchanged upstream regression scripts passed before timing; these are offline fixtures, not live authenticated coverage.

| Gallery entries | Baseline median ms | Candidate median ms | Baseline max ms | Candidate max ms |
|---:|---:|---:|---:|---:|
| 6 | 0.906 | 0.703 | 1.838 | 3.705 |
| 64 | 4.408 | 3.826 | 8.587 | 5.278 |
| 256 | 16.633 | 12.519 | 31.264 | 22.898 |
| 1024 | 59.872 | 54.174 | 90.687 | 82.320 |

The six-image candidate maximum regressed despite its lower median. Nine samples are insufficient to estimate a stable tail distribution or attribute that observation to a root cause. Retain both the result and baseline; repeat independent-process runs and measure allocations before interpreting the tail. Do not discard outliers merely to improve the ranking.

## Reproduction and retained evidence

- [Exact measured harness](benchmark.cjs), [raw results](generated-results-2026-10-26.json), [isolated candidate patch](candidate.patch).
- Place the harness alongside directories named `enderloom-media` and `enderloom-media-candidate`, each containing the pinned public source files under their original paths: `src/provider-media.js`, `src/site-adapters.js`, `src/provider-fastlane.js`, `src/curseforge-fastlane.js`, and `scripts/provider-media-qa.js`.
- Apply the patch only in the candidate copy (`patch -p1 < candidate.patch` from that copy). Run each existing regression with Node, then run the harness with filesystem-read access to those copies. No network, credentials or live pages are required.
- The raw receipt records source and harness SHA-256 values, generated input/output hashes, every timed sample and parity result. No third-party implementation is redistributed here beyond the minimal patch context.

## Limits and next gate

Generated HTML preserves known baseline semantics, including quirks; it is not an HTML conformance suite. No network collection, image decode, video playback, process-cold latency, peak memory, cancellation or installed-target acceptance was measured. The public reference revision is not proof of the current installed application. No changes or recommendations were made to another project's code, wiki or TODO. Future evaluation must include permitted real-page fixtures, memory/tail stress and the actual target's requirements before any transfer.
