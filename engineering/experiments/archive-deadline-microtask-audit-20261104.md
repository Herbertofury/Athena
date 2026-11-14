# Archive deadline microtask starvation audit

Status: isolated experiment; not qualified for integration. Existing draft PR candidate tested at commit `c8bd6c2660e8aad7fb543807821b82b2d5ba72cc`.

A synthetic non-network reader returned 250,000 immediately resolved empty chunks. On Node 24.22.1, with a 10 ms timeout, the existing candidate consumed all 250,001 reads in about 88 ms and rejected as an empty response rather than timing out. The stream's immediately resolved promises kept the event loop in microtasks, delaying the timer. This is a synthetic adversarial case; browser and production incidence are unverified.

An isolated modification checked the monotonic deadline once per 128 reads, yielding TimeoutError at approximately 10.9 ms in one run. The existing 16 focused tests passed against that modification. Eight alternating synthetic runs of 100,000 one-byte chunks retained the correct 100,000 bytes and SHA-256; timings were noisy (baseline 13–72 ms, candidate 14–28 ms) and do not establish a performance improvement. The modification is not part of application code; external cancellation delivery can still be delayed by event-loop starvation. Browser, real-stream, full-suite, stress and application acceptance remain outstanding. A robust solution should also examine cooperative task yielding and its responsiveness/throughput tradeoff.

Browser fixture attempt: local Chromium could not start because Unix socket creation returned EPERM, including on a separately reviewed retry. The app was not exercised in a browser. Failure logs and scripts are retained in the local experiment evidence; no deployed asset or loaded-harness identity was verified.

Reproduction of the starvation mechanism: import `loadSavedProject`, provide a fake reader whose `read` asynchronously returns 250,000 empty Uint8Array chunks followed by done, supply valid project headers, and call with `timeoutMs: 10`; record elapsed monotonic time and outcome. Never use this synthetic result alone to recommend a change to another project.
