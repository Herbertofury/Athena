# Queued public version collection

Verified 2026-10-27. This closes an actual workflow gap: the local Collection form can save version metadata into the same database read by the fixed saved-record experiment. It reuses the existing official Modrinth client, validation and snapshot transaction. It does not introduce a replacement scraper, credentials, file download or default-parser promotion.

## Contract

- `CollectModrinthVersions` accepts 1–20 unique canonical eight-character version IDs. Unknown fields, arbitrary URLs, slugs and excessive batches are rejected independently by the Rust queue.
- The existing transport retains its response limit, redirect rejection, provider pacing and cooldown. A single serial worker is unchanged.
- Complete raw version JSON is committed to SnapshotStore. The job holds a small receipt with exact string generation IDs, full-payload SHA-256/length and explicit missing identities. It does not round-trip provider numbers through a JSON Value or pretend this receipt is the complete record.
- Partial responses save successful versions and missing-ID attempts atomically, but mark the job failed/partial rather than complete. Failed refreshes retain previous snapshots and record a failure attempt. Failure text is sanitized.
- Snapshot persistence and queue finalization are separate transactions. A crash can repeat a public read and append another snapshot; this is not exactly-once collection. A later job cannot erase the earlier generation.
- Version files, hashes and dependency links remain metadata. No downloaded files or verified file hashes, playable media or authenticated provider coverage are implied.

## Evidence

[32 real HTTP checks](real-http-2026-10-27.json) used three public version IDs: Sodium g6ju16VJ, Iris Ag5S66CF and Lithium 1rb9wI5K. All succeeded through the local HTTP queue. Stored bytes matched receipt hashes and lengths. A refresh containing the deliberately missing 00000000 ID was explicitly partial, preserved the earlier generation and supplied the latest saved Sodium record to the fixed experiment. Complete output parity passed; its gate remained Incomplete.

[47 runner regression checks](runner-regression-2026-10-27.json) passed with the new binary, including cancellation, immutable prior results, build identity and security guards. Local suites passed: 75 Rust unit tests, 4 integration tests, 4 candidate-example tests, 49 Node tests and 53 Python tests; formatting/static checks and existing content-addressed asset checks passed.

The new persistence fixture includes an exact integer above 2^64, null, unknown fields and multiline changelog; raw bytes survive storage, partial refresh and failed refresh. Queue/input fixtures cover duplicate IDs, bounds and arbitrary request rejection.

Native-browser visual/input acceptance of the local app remains unverified. The collection form is implemented, served bytes are checked by regression tests, and backend/API behavior is real-tested; do not call that a browser interaction test. No speedup is asserted and no other project's recommendation or implementation changed.

## Reproduce

Build the official pinned Rust 1.99.1 application with its locked dependencies. Run `verify_http.py --binary PATH --output-dir NEW_DIRECTORY`. The helper starts/stops its own loopback process and makes two bounded official API collection requests. It retains its database and log locally. Run only with public-data network access permitted; no credentials are needed. Do not commit retained databases/provider text to the public repository.
