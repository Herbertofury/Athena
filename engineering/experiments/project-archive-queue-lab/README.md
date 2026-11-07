# Queued complete project-response archival

2026-10-28. Baseline CLI capability: `c610c81bc0c947f7f1d979e67a5da6eb1f888df3`.

## Reused workflow, not a replacement collector

The Collection panel adds an explicit complete-response form. `CollectModrinthRaw` accepts one existing project ID/slug, reusing browser input interpretation and independent Rust validation. Unknown job fields, arbitrary URLs, paths and accidental batches are rejected. Legacy projection and version workflows remain unchanged.

The existing serial worker retains provider pacing and cancellation checks before the fixed public request. It calls the same immutable project envelope and snapshot store used by the CLI. A small job receipt contains canonical identity, string generation, source hash/length and coordinator source identity; it is not a replacement for the original JSON. Full bytes stay in the local database without crossing the UI's ordinary JSON-number conversion path. No extra raw-data HTTP endpoint, credentials, download client or remote listener is introduced.

Failures are sanitized and recorded without overwriting last-good snapshots. Snapshot commit and queue finalization are separate transactions, as in the established version lane: a crash can repeat a public read and append another generation. This is not exactly-once collection. Older binaries cannot be assumed to understand new pending job variants; do not treat keeping old source as an automatic compatible downgrade of a live queue.

## Evidence

[Actual queue/coordinator integration](retained-workflow.json) uses three previously collected public responses with a fixture-supplied fetch closure, not new provider requests. Three jobs completed and three generated failed refreshes were finalized. Every archived response reopened byte-identically; all earlier typed fields remained equal; failed refreshes retained the successful payload. The UI-facing job results were 468–469 bytes. Raw source data and SQLite files remain local, not published.

[45 actual loopback HTTP checks](http-receipt.json) passed against the compiled application and those already-terminal fixture jobs. Four served UI assets matched exact local source bytes. Host/Origin/request-marker guards, no-store/nosniff/CSP behavior, malformed/oversized requests, unknown fields and invalid identities were checked. Negative tests did not add provider jobs, and the owned process was stopped afterward. This validates real HTTP/assets/security behavior, not a fresh successful provider call or a native-browser click.

Local regressions: 95 Rust unit tests, five persistence integration tests, 96 Node tests and 74 Python tests; formatting, Clippy and existing card/media asset checks pass. New tests cover request fencing, compact receipt boundaries, full byte retention, safe failure text, queue identity/deduplication and rejection of accidental batch truncation. Source/harness hashes are retained in the integration receipts.

## Coverage labels and remaining gates

- Implemented: collection form, fixed job variant, worker wiring, coordinator, complete local snapshots and bounded result receipts.
- Fixture/retained-public-data tested: full queue/coordinator path, failed refresh and exact reopen.
- Real local HTTP tested: compiled served assets, terminal-result display contract and negative security controls.
- Not verified: fresh successful provider execution through the new worker branch; native-browser form interaction; linked-media completeness; authenticated/private collection; peak memory; process crash/power-loss recovery.

This is workflow and data-completeness work, not a speed claim or recommendation to any other project. The original projection remains available. No account session or persistent access was created.

## Reproduce safely

Build the pinned Rust 1.99.1 binary and `project_archive_queue_lab` example with locked dependencies. Give the example a fresh directory and one to four legitimately retained public response files. It supplies data to the actual coordinator without network access and leaves only terminal jobs. The HTTP verifier accepts that database, refuses active jobs or an occupied port, serves only the existing loopback address and issues read/negative requests, never an accepted collection request. Retain databases/logs privately; publish receipts and hashes rather than third-party response bodies.
