# Overview last-good preparation boundary

October 30, 2026. An actual application renderer defect was reproduced with generated malformed result data. This is not a report that a live provider returned that shape.

## Failure and repair

The previous renderer changed summary counts and its keyed-card cache while preparing rows. If a later row threw during preparation, the visible cards remained old but the metrics had already changed. Worse, an uncommitted earlier card entered the cache and could appear on the next successful refresh instead of that refresh's result. The existing refresh error message promised previous results were retained, but that promise did not cover these two mutations.

The repair prepares a new keyed map and metric values alongside the detached cards. Only after every row is prepared does it apply the existing node-reuse/reorder algorithm, commit the map and update metrics. Unchanged successful cards retain their node identity. Exact job-ID validation, full recorded-result details, the latest-50 display policy, polling deadline and failure reporting are unchanged. This boundary covers preparation failures; it is not a transaction or rollback guarantee for arbitrary native DOM failures during the final mutation phase.

## Retained evidence

Two new tests fail against the prior app and pass with the repair: unchanged last-good cards/metrics after a late error, and correct recovery without an uncommitted cache entry. Existing identity and timeout cases also pass.

The [baseline receipt](baseline-http.json) and [repaired receipt](repaired-http.json) use the actual Rust loopback server and its served JavaScript in the established controlled-DOM harness. Six jobs include retained public-fixture results plus synthetic large IDs. Two rows are deliberately altered only in a new owned database copy to produce a valid-JSON but malformed result shape. Three complete HTTP responses and served app bytes are retained with each private run; the public test script reproduces the fault.

The baseline retains cards but fails both metric retention and recovery. The repair passes all three. Source database, unrelated tables and final job rows are unchanged by reads, and SQLite integrity checks pass. Deliberate fixture writes are separate from application read behavior. No provider request, account grant, private content, autoplay, native game change or deployment to another project occurred.

## Reproduction and limits

Run `node --test tests/overview-last-good.test.mjs` from the repository root. For actual HTTP evidence, build the pinned lab and run `python experiments/overview-last-good-lab/verify_http.py --source-db INACTIVE_FIXTURE.sqlite --binary apps/atlas-lab/target/debug/atlas-lab --output NEW_DIRECTORY --expect-correct`. Use an inactive fixture with two to fifty jobs; it is copied before generated faults are applied. The source is not edited. The owned server uses the lab's fixed loopback port and is shut down after the test.

This is correctness evidence, not a speed or memory improvement. Native-browser focus, paint, scrolling and latency remain unverified because the credential-safe browser runtime is unavailable. Existing last-good and failure evidence is preserved; no acceptance threshold was weakened.
