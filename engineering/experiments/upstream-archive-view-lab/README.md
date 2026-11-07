# Inspect saved upstream evidence

October 30, 2026. The actual local app now reads saved RustSec, HLS.js and serde_json response snapshots through the existing archive inspector. This is an offline inspection feature, not a fresh release check or an API grant.

## Reuse and implementation

The shared server archive route reuses SnapshotStore's bounded upstream read and existing source validator. It reads generation and payload together, rejects invalid generations or mismatched repository data, and returns the same kind/identity/hash contract as project and version archives. The existing raw getter remains available, with its size bounds preserved.

Only the three already implemented fixed source IDs are accepted: `rustsec`, `hls` and `serde-json`. The shared JavaScript verifier checks complete bytes, namespace, identity, generation, hash, UTF-8 and bounds. The selector allows the full ten-character serde-json ID rather than truncating it. Downloads use a GitHub-upstream filename derived from the verified record, even if the current selector has changed. Original JSON and future fields remain untouched; markup and URLs stay inert.

The existing selection state machine retains last-good data on failure and cancellation. No request reservation, cooldown, interrupted-request flag, collection attempt or worker job is changed by inspection. No source assets execute or download. Saved metadata is not proof of current upstream availability, signature validity, security clearance or preferred dependency version.

## Evidence

Four new feature checks failed on the prior implementation and pass after the extension. The tests cover all fixed sources, unknown-source rejection, namespace/source mismatch, the selector's complete input and the download label. Existing project/version and lifecycle tests remain.

[Actual loopback receipt](http-receipt.json) retains 52 checks on three dated public snapshots, plus generated large-generation, pending-budget and corruption cases. All source bytes and hashes match. Inspection works with an intentionally pending/cooldown budget without clearing it. Mismatched-repository, malformed and oversized records fail explicitly; the actual JavaScript selection retains its previous verified source. Original rows, attempt history, budgets, jobs and the original database remain unchanged. Corruption is appended only to a new owned fixture copy.

A separate repeat of the existing version-archive harness passed 71 checks and its five-record JavaScript readback. Full regression passed 140 Rust unit tests, nine integration tests, all-target Clippy, 267 Node tests and 237 Python checks both normally and optimized. [Source identities and summary](verification.json) distinguish these from browser acceptance.

The audio laboratory copies the shared selection module, so its content-addressed assets were rebuilt and checked. Audio content, manual-load behavior and autoplay-off policy are unchanged. Earlier assets and failed evidence are retained.

## Reproduction and open gates

From this directory, run `python verify_http.py --source-db INACTIVE_UPSTREAM_FIXTURE.sqlite --binary ../../apps/atlas-lab/target/debug/atlas-lab --output NEW_DIRECTORY` after building the pinned app. The source must contain the existing schemas, all three saved sources and only terminal jobs. It is copied, not edited. The test performs no provider requests and retains its databases and receipts. The final harness also passed with Python optimization enabled.

Native browser layout, focus/keyboard use, download dialog behavior, input/scroll latency and memory remain unverified while the browser runtime is unavailable. No full-provider content coverage, authenticated-platform support, performance win or other-project recommendation follows.
