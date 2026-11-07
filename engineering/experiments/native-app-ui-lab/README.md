# Native cloud application acceptance

Reviewed 2026-10-28. The actual compiled Rust app ran in the cloud desktop on loopback only, against a copied public-response database. This closes the prior executor/browser loopback boundary for local UI checks, without changing network or security settings.

The browser connected to the worker, displayed prior success and failure history, opened the saved Sodium response, and downloaded exactly the 12,840 stored bytes with the displayed SHA-256. A missing canonical ID produced an explicit error; Show last verified response reopened the unchanged prior response. All five original database snapshots remained identical.

The UI queued and completed the actual built-in identifier comparison: 15 timed pairs and 10,000 generated stress cases. Its acceptance gate remained Incomplete. Successful job execution is not promotion or autonomous self-modification.

The native app's RustSec checkpoint request failed to connect and was recorded as failed. This is not a successful live upstream check. The existing data remained available. No credentials, account data or remote access were added.

[Sanitized verification summary](summary.json). Raw downloaded public JSON, database copy and experiment results are retained privately. These interaction checks do not establish card visibility, input latency, browser peak memory or authenticated-provider coverage.

## Current native service regression, 2026-10-29

This is a separate HTTP-level verification of the freshly rebuilt Rust executable, not a new visual/browser acceptance pass. The previous working CLI binary is retained. The new binary SHA-256 is `411e2d680b64163464430af50148180c536b6e0c5fff43416b45aebdd2193344`.

The reusable [owned-service driver](check_current_http.py) passed 33 checks with an [empty queue fixture](current-http-empty-20261029.json) and 33 with [retained historical jobs](current-http-history-20261029.json). Both preserve the same five complete public snapshots and collection attempts. The historical case also preserves its prior successful and failed jobs and their events. The empty-queue source is a separately created fixture, not deletion from the original database. The historical pass ran with Python optimization enabled; explicit checks remain active.

Checks cover exact embedded asset bytes, baseline serializer selection, loopback Host/Origin/request-marker guards, content-security headers, job body limits and unknown-job rejection, full saved-archive bytes and identity headers, missing-archive recovery, a real queued built-in comparison, graceful shutdown and complete database readback. The bounded experiment completed but retained its **Incomplete** review decision because its memory evidence is still missing. Completing a job does not silently promote a strategy.

The [initial fixture assumption failed](current-http-initial-fixture-failure.json): the source already had historical jobs, so it was not an empty queue. The driver was repaired to retain and compare that history. All earlier output and databases remain preserved privately. Preliminary shutdown receipts remain explicitly incomplete until reopen checks pass.

To reproduce on Linux, build the fixed `apps/atlas-lab/target/release/atlas-lab` binary, then run `python3 experiments/native-app-ui-lab/check_current_http.py --source-db OWNED_CLOSED_PUBLIC_FIXTURE.sqlite --output NEW_DIRECTORY`. The driver refuses an existing output, pending jobs, journal files, oversized source databases and arbitrary binary overrides. Use at most 49 terminal jobs in this bounded fixture. It starts only its own loopback server, queues only the built-in comparison, makes no external provider request and stops its own process. Never point it at a live working database.

This does not verify browser rendering, scrolling/input latency, video playback, provider authentication or physical power-loss durability. Those evidence boundaries remain separate.

[Loaded native runner identity](current-http-build-identity.json) matches the checked runner source at revision `cd35fd5b93d83858c7d35c71110ff85ab0b4219a`. The actual queued result records 15 timing pairs and 10,000 stress cases; the review gate remains incomplete. This identity is for the native experiment, not a loaded browser harness.
