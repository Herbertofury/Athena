# Actual worker phase timelines

Measured 2026-10-28, isolated harness atlas-complete-receiver-v7-phase-timeline. [Source HRCLK01](https://www.w3.org/TR/2026/WD-hr-time-3-20260901/) is a W3C Working Draft, not a final standard or performance result. Communicating contexts align performance timestamps with timeOrigin; exposed precision still applies. Never compare these anchors across isolated sessions/browser restarts.

The implementation records request start, module ready, worker receive, validation start/end, response-send start, main receive and main decode/binding completion. Non-finite, missing or reversed anchors preserve diagnostics and refuse phase attribution rather than clamping negative numbers. Existing full-record validation, request identity, cancellation and last-good rules remain unchanged. These phases are intervals containing scheduling and transport overhead, not pure CPU/network measurements. In particular, module startup is not just download time, and the pre-validation interval can include accessing/deserializing the incoming message.

The phase span ends at decode/binding, before worker termination and promise continuation; it is not identical to the outer request timer. The retained request-minus-phase differences range from a tiny -0.000049 ms numerical/clock-resolution discrepancy to 3.400049 ms. Neither is silently clamped or relabeled as measured algorithm work.

Four real foreground runs retain 24 complete samples: dense receipt twice, dense transfer once and smaller receipt once. All parity, calibration and phase monotonicity checks passed. [Raw phase medians](summary.json) are independent column medians; do not add them and expect the median total.

- Dense receipt pass 1: clone/receipt request medians 178.6/153.6 ms; response-delivery medians 43.9/0.2 ms. Module-ready medians were 81.9/63.4 ms.
- Dense receipt repeat: request medians 167.2/132.7 ms. This is limited repeated observation, not a universal ranking.
- Dense transfer: request medians 210.7/228.3 ms; clone delivery was 45.5 ms, transferred delivery 0.8 ms but main-thread decode/binding was 38.2 ms. Transport choice moves work; it does not erase the need to materialize complete records.
- Smaller receipt: request medians 60.8/72.6 ms, with module-ready medians 41.7/57.1 ms. Startup variation remains visible rather than attributing all latency to the algorithm.

These observations motivate isolating worker lifecycle costs and validation-only result ownership in future comparisons, not adopting them blindly. No physical paint, INP, actual heap/RSS, source-media coverage or target-project acceptance is established.

Actual first-worker cancellation preserved the prior completed 13,688-byte download exactly (SHA-256 7ed07a0613184f87145b5886a9aa67cc16edfd831d872afab9fc36c339c8e881); a fresh run recovered with six additional complete, valid phase samples. Failed and recovered receipts are retained. Nine served assets matched their SHA-256 values; the loaded script was receiver.0f51a70e310cff02.js. Generated phase tests cover invalid/reversed/coarsened clocks, separately from real browser runs. The implementation commit passed Linux/Windows CI. No working application default, adapter or other project changed.
