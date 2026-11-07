# Inspect exact saved version objects

October 30, 2026. The actual local Rust app now exposes saved version objects alongside project response archives. It reuses SnapshotStore, the bounded archive verifier and the existing selection/cancellation state machine. No new adapter, parser dependency, provider request or authentication grant is introduced.

## Implementation

- `/api/version-archive/{id}` and the existing project route share one bounded database/read/response path. The version route uses the existing validated, size-bounded version snapshot reader. Both return a fixed archive-kind header, canonical ID, exact decimal generation and complete-payload SHA-256.
- The shared JavaScript verifier requires the expected namespace before accepting bytes. Eight-character project and version IDs cannot be silently substituted for each other. The original project loader remains a wrapper on its fixed route. The two-MiB byte bound, UTF-8/hash/length checks, deadline, cancellation and last-good retention remain.
- Collection offers an explicit project/version selector. The viewer displays the saved record's type, not whichever type is currently selected. Downloads include that type and preserve the verified bytes. URLs and markup remain inert; linked binaries are not fetched or executed.
- Changing type cancels pending work. Closing or cancelling the dialog also cancels a pending load, so a late response cannot reopen the dismissed viewer. Previous verified data remains available.

A version object is the complete individual object retained by the existing version collector, not the original whole batch-response envelope or the bytes of its linked files. This does not make provider metadata a file-safety certification.

## Retained failures and verification

Four initial reader checks failed because the feature/namespace contract was absent. A controlled actual-UI test additionally reproduced a late request surviving viewer closure. The new route and shared verifier were implemented, and the closing path was repaired rather than dropping that test. Original sources and failure output remain retained locally.

[Final real loopback receipt](http-receipt.json) has 71 checks, using three retained public version objects and two generated records sharing the same ID across different namespaces. It checks full bytes, large generation strings, compiled assets, missing/misbound/malformed/oversized data, Host isolation, no CORS grant, unchanged snapshot history and source-database identity. The actual JavaScript verifier also reads all five records through HTTP. The final runner passed with Python optimization enabled; its checks do not depend on `assert`.

The existing project-archive regression separately passed 73 HTTP checks and eight JavaScript read/recovery checks on three retained public projects plus generated cases. [Regression summary](verification.json) records 133 Rust unit tests, nine integration tests, all-target Clippy, 25 example tests, 244 Node tests and 237 Python tests both normally and with optimization. Four of the Node tests execute the actual UI source against controlled DOM/events, including exact download bytes and stale-response cancellation. These are fixtures, not native-browser acceptance.

The isolated audio page copies the shared selection module. Its content-addressed assets were rebuilt and tested after the module changed; audio source bytes, native-player policy and autoplay-off behavior are unchanged. Earlier served hashes and failed evidence remain retained.

## Reproduction and boundaries

Build the actual app with the pinned toolchain and locked dependencies, then run `verify_http.py --source-db INACTIVE_PUBLIC_FIXTURE.sqlite --binary ../../apps/atlas-lab/target/debug/atlas-lab --output NEW_DIRECTORY` from this experiment directory. The source must contain the existing queue/snapshot schema and only terminal jobs. It is copied, never edited. Source database/history/record counts, HTTP bytes and execution waits are bounded. No provider jobs are queued. Retain output directories, including failures.

Native browser rendering, keyboard/focus interaction, real download dialog behavior, input/scroll latency and browser memory remain unverified while the browser runtime is unavailable. No performance win, physical power-loss guarantee or recommendation for another project follows from this feature.
