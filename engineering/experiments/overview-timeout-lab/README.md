# Overview poll recovery deadline

October 29, 2026. Baseline UI from Atlas `a22124db0c020abc93e3a6876df83837cc80311c` (the preceding archive-reader change did not alter app.js).

The actual overview refresh used an in-flight flag to prevent overlapping polls, but neither its fetch nor response-body read had a deadline. A stalled read could therefore leave the flag set and suppress every subsequent poll until reload. Old results remained visible without a timely connection failure message.

The existing refresh now creates a per-request AbortController and a 15-second timer spanning both response headers and JSON body consumption. Its finally block clears the timer and in-flight flag. The normal next poll can then retry this read-only request; previous rendered results stay in place on failure. No job submission is automatically retried, and no POST timeout or ambiguous-submission behavior is changed. Timers remain subject to browser event-loop scheduling/background throttling, not a hard real-time guarantee.

Tests execute the actual app.js in a minimal Node VM DOM fixture, replacing only its imports and browser environment. Controlled-clock checks cover stalled fetch, stalled response body, no overlapping polls, subsequent polling, retained last-good display and HTTP-error timer cleanup. Baseline fails both deadline checks; the repaired script passes all three tests. This is script-level evidence, not browser paint/input/scroll or loaded-window acceptance. The first test fixture forgot to initialize the last-good jobs node; that harness error and the corrected baseline failures were retained privately rather than hidden.

Run `node --test tests/overview-timeout.test.mjs` from the repository root. No package or credential is added. The change is recovery hardening, not a speed claim or a recommendation for another project.

Final checks: 214 Node tests and 227 Python tests in normal and optimized mode passed. The rebuilt binary passed 73 local HTTP checks, including exact served app.js, and eight archive-reader checks. An initial HTTP check correctly rejected the old app.js because the build was still pending; that receipt is retained. [Final HTTP receipt](http-receipt.json) and [verification](verification.json).
