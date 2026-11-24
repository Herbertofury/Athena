# Request ordering in the body-timeout test fixture

October 29, 2026. The [audio-page CI run](https://github.com/Herbertofury/Engineering-Atlas/actions/runs/40962810457) passed its frontend and Windows jobs but failed the Ubuntu Rust unit suite before the body reader was reached. The existing timeout test's request send returned UnexpectedMessage. The original failure and raw job log are retained, not replaced with a green retry.

## Diagnosis and repair

The fixture accepted a TCP connection and immediately wrote a response, without reading the request. Hyper 1.12.0 explicitly rejects unsolicited bytes on an idle client connection. [HYPERIDLE01] This ordering defect is consistent with the observed send-stage error; the exact intermittent failure did **not** reproduce in 40 local original-test processes, so no deterministic local reproduction or universal flake-elimination claim is made.

The fixture now consumes a complete request-header terminator before responding. The read is bounded to eight KiB and has a socket timeout. Deterministic tests cover fragmented valid headers, premature EOF, and the exact read budget. The original 200-ms client timeout, 500-ms incomplete-body hold, response length, read limit and exact safe-timeout assertion remain unchanged. Production diagnostic code is byte-identical before the test module. No tests are skipped, serialized in CI, or relaxed; no application timeout or dependency is changed.

Forty fresh-process repaired runs passed. Raw before/after outcomes are retained in [repetition evidence](repetitions.json); these are functional checks, not a performance comparison. Full suite and follow-up CI status are recorded separately. A passing rerun alone would not establish the diagnosis, and this repair does not close browser playback or input/scroll acceptance for the audio prototype.
