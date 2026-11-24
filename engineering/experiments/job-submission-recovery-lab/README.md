# Recover unconfirmed local job submissions

October 30, 2026. This repairs the actual app's six enqueue actions. Previously, a stalled fetch or receipt body could leave its action button disabled indefinitely. Seven controlled-UI checks reproduced the missing completion boundary before the repair.

## Actual implementation

All six forms/buttons now reuse one fixed `/api/jobs` submitter, rather than six independent request/read paths. A cooperative 15-second deadline covers headers and the complete receipt body. The body is bounded to 4 KiB and 8,192 stream chunks, with strict UTF-8 and the fixed single-ID receipt shape checked before success. No provider or arbitrary URL is accepted. Existing job construction, Host/Origin/request-marker protections, queue behavior and durable writes remain unchanged.

The receipt's decimal integer token is retained as a string, including SQLite IDs above JavaScript's exact-number range. Duplicate/extra fields, unknown shapes, noncanonical numbers and out-of-range IDs are rejected as unconfirmed. This decoder covers only the local server's fixed receipt protocol; it is not a general JSON parser. Overview serialization is a separate concern, not a claim established by this change.

A failed or timed-out receipt does **not** establish that the server rejected or cancelled the job. The UI restores its control and directs the user to check Overview before resubmitting. It never retries the POST automatically and never displays raw transport diagnostics or response content. Existing results stay visible. Browser timers remain cooperative, not hard real-time guarantees.

## Evidence

- Seven actual-UI-source fixtures failed before the repair: six stalled actions and a stalled receipt body. They now pass without dropping assertions.
- Seven additional helper tests cover exact large IDs, ambiguous/invalid receipts, byte/chunk bounds, fixed request destination/options, safe errors and no implicit retries.
- [Actual loopback transport receipt](http-receipt.json): the Rust queue accepted a generated high-ID job before an owned proxy withheld the remainder of its receipt. The real JavaScript helper reported unconfirmed after about 15 seconds. The proxy observed exactly one POST for that call; independent SQLite inspection found the accepted job. The normal receipt also preserved ID `9007199254740993` exactly.
- The existing queue deduplicated the two explicit requests into one job in this run. The no-retry assertion uses the independent proxy request count, not that deduplicated job count. The job completed, existing snapshots stayed byte-identical and the original fixture database was unchanged.
- The final harness also passed under Python optimization. Public receipt IDs are strings; the first diagnostic receipt's numeric row IDs remain in retained local evidence rather than being silently rewritten.
- [Verification summary](verification.json): 133 Rust unit tests, nine integration tests, all-target Clippy, 258 Node checks and 237 Python checks both normally and optimized. Native browser control/keyboard/layout acceptance is still unavailable and is not inferred from controlled DOM tests.

## Reproduction

Build the pinned, locked app. From this directory, run `python verify_http.py --source-db INACTIVE_PUBLIC_FIXTURE.sqlite --binary ../../apps/atlas-lab/target/debug/atlas-lab --output NEW_DIRECTORY`. The source must contain the existing schema and only terminal jobs. The script copies it, inserts an explicitly generated terminal high-ID row, and starts only its owned localhost app/proxy. It submits the fixed bounded identifier experiment twice explicitly; no provider collection, credentials or external requests occur. Output directories, raw logs and database copies are retained.

This is a recovery and exact-receipt correctness change, not a performance promotion or general autonomous self-modification. Application/database state is not reset and no failed evidence or backup is deleted.
