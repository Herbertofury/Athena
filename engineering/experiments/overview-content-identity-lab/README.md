# Overview content-identity candidate, not promoted

October 30, 2026. Baseline: `591f6c85eb28ea63d0dcb251eb4de2f2d362b5a3`. The default application's implementation is unchanged by this experiment.

## Reproduced correctness defect

Overview's keyed reuse compares only job ID, state and attempt. Restarting the same local address against another database can yield identical keys with different recorded results. A still-open viewer then retains the earlier database's result. No source is fetched and no working database is replaced by this test: two new inactive copies receive distinct generated markers and are served sequentially by two actual lab processes. Other retained public fixture jobs remain in the responses.

Two new tests fail against the baseline: replacement output stays stale, and a malformed replacement is skipped rather than failing with last-good retention. Both candidate implementations fix these cases. Complete served JS and responses, process logs, original source, failed tests and owned databases are retained privately. Public HTTP receipts identify the binary, served code and harness hashes. The same six cards remain available and unchanged results retain node identity.

## Candidates and rejection

The first candidate serializes all displayed job fields as a cache signature. It passes correctness but is rejected for additional cost: on the generated near-two-MiB single-result case, repeated rendering including input parsing had observed p95 31.67 ms versus baseline 16.14 ms. These are 24 alternating-order pairs in a controlled DOM, not browser frame or input measurements. Raw samples are retained in `string-signature-cost.json`; the rejected source is retained too.

The second candidate compares parsed values iteratively, including property order because complete recorded JSON is shown in that order. It avoids complete repeated serialization. It passes the restart check and 1,000 generated replacement updates compared against freshly rendered complete output. It still adds comparison and object-retention cost. In its separate run, observed repeated/parse p95 was 2.67 versus 0.52 ms for the retained fixture, 6.87 versus 2.60 ms for generated fifty-by-eight-KiB records, and 5.78 versus 4.44 ms for the near-two-MiB case. Do not compare the two separate timing runs as a stable ranking. No predeclared performance threshold or native acceptance exists, so **neither candidate is promoted**.

The values come from parsed JSON responses, which the app does not mutate. Cyclic objects, arbitrary JavaScript proxies and externally mutated previous response objects are outside this protocol. Memory/RSS, native focus/scroll/input behavior and worst-case wide/deep data remain open gates. Full result text, warnings, exact ID handling, latest-fifty policy and preparation-failure retention are required. Clearing all cards every poll was rejected because it discards node identity and open details.

## Reproduction

Run `node --test tests/overview-content-identity.test.mjs`. These tests intentionally load the isolated structural candidate, not the default app. Existing tests continue to check the default app.

`verify_http.py` takes `--source-db`, `--binary`, `--output` and optional `--expect-correct`. The source must be inactive, at most 32 MiB and have one to fifty jobs. It is copied before any generated marker write. The fixed loopback port must be unowned; each owned process is stopped before the next begins. Source hashes, job rows and SQLite integrity are checked. This is not physical-power-loss durability evidence.

To build a candidate, use a separate owned checkout at the baseline revision, substitute `candidate-app.js` for `apps/atlas-lab/ui/app.js`, and build the existing pinned lab. It uses the original app's module routes, not standalone hosting of this directory. Do not overwrite a running or shared checkout. Restore the baseline and verify its source/binary identity before returning to normal testing.

`measure.mjs BEFORE_APP AFTER_APP RETAINED_HTTP_JSON NEW_OUTPUT_JSON` runs the actual renderer with the existing controlled-DOM harness. All timed operations complete before measurement stops. Generated cases are explicitly labeled; they do not replace native browser validation. No broader performance, provider playback, security clearance or other-project recommendation is made.
