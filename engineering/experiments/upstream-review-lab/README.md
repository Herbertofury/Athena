# Fixed public upstream checkpoints

Reviewed and tested October 27, 2026. Implemented in the Rust app and exercised with actual anonymous public responses; local browser interaction/visual QA is still unverified. This is a source-observation workflow, not autonomous code modification or a claim that newer versions are better.

## Reuse and boundary

The existing Atlas queue, snapshot transactions, safe failure messages and bounded JSON body reader are reused. The GitHub asset adapter in the existing repository inventory has a different purpose and language, so its download/search implementation was not copied into this research ledger. No new dependency, SDK, credential, API grant or executable was introduced.

Three compiled routes are allowed: RustSec/advisory-db latest commit, video-dev/hls.js latest stable release and serde-rs/json latest stable release. Arbitrary repositories, URLs and credential fields are rejected. HTTPS, redirect rejection, 10-second connect/30-second request timeouts and a 2 MiB body ceiling apply. Full original JSON is retained locally, including whitespace and unknown fields; public evidence contains receipt hashes/counts rather than copied release bodies.

## Actual public evidence

[CLI receipts](live-cli.json) contain four actual HTTP 200 responses: hls.js v1.7.3, RustSec commit 99670cfc0bc574433034b75876a4b791ccaa2efb, serde_json v1.0.154, then an unchanged hls.js observation. All selected the requested API version 2026-03-10. Stored byte counts and SHA-256 matched each receipt, and SQLite integrity was OK. This is not a registry inventory, package signature check or proof those upstreams changed since the previous research pass.

[Loopback HTTP receipt](http-verification.json) passed 32 checks on the final release binary. One additional real hls.js request flowed through the durable queue. The test then injected explicitly generated cooldown and interrupted-reservation states and restarted the server: both blocked further requests and preserved last-good snapshots. Origin/Host, unknown-source, extra-token-field and body-size guards remained enforced; four served UI files exactly matched local sources. Different binary hashes between CLI and HTTP runs reflect the subsequent embedded stylesheet update, not an unrecorded provider change.

[Saved-version regression](saved-runner-regression.json) passed all 47 checks, including complete output parity and cooperative cancellation. [Modrinth queue regression](modrinth-regression.json) records the actual shared-transport regression separately. No browser clicks, latency improvement or cross-project adoption is inferred from HTTP checks.

## Request and storage semantics

- A SQLite IMMEDIATE reservation occurs before each request; at most 30 requests per local database per hour. This is deliberately below GitHub's documented anonymous 60/hour limit, but other clients sharing the originating IP still consume its budget.
- Server reset epochs, remaining quota, retry durations and conservative increasing cooldowns persist across reopen. No retry loop, automatic credential escalation or parallel quota bypass exists. 403 can mean denial rather than rate exhaustion, so the message preserves that ambiguity.
- An interrupted reservation fails closed for manual reconciliation; there is no automatic clearing operation. Do not reset/copy databases to defeat provider restrictions. The test copied an existing ledger once for isolated validation, made one request, then used only offline fault states.
- Original snapshot and receipt commit atomically. Queue completion is separate, so a crash can leave a recoverable job and later append a duplicate observation. This is not exactly-once execution or power-loss certification.
- Comparisons distinguish first observation, unchanged bytes, raw metadata drift, revision change and invalid prior record. Metadata drift is not necessarily a release or code change.
- Identity validation rejects ambiguous known fields and mismatched source links. The selected sources use ordinary ASCII tags; generic arbitrary encoded tags are not claimed supported. Provider publication/committer time is distinct from local observation time.
- A selected API-version response header is recorded when present; its absence is not fabricated as verification. Non-200 responses do not replace saved data. Error bodies and credentials are not copied into public evidence.

## Reproduce

Build the app with its pinned toolchain and lockfile. `review-upstream DATABASE hls` makes a public request; use the same database for subsequent observations. `verify_http.py --binary PATH --seed-db DATABASE --output-dir NEW_DIRECTORY` makes one public request and then uses generated local failure states. It preserves outputs and refuses to overwrite an existing output directory. Do not run it during a provider cooldown or an active server on port 41379.

Unit tests cover source allowlists, duplicate fields, exact raw bytes and oversized/nonfinite JSON, source URL binding, reset epochs versus durations, backoff overflow, 30-request budget, interrupted reservations, transactional rollback, history retention and comparison states. Final offline suite totals are recorded in [verification](verification.json). These are correctness checks, not card, storage-throughput or durable-write performance measurements.

## Primary references

- [GitHub API versioning](https://docs.github.com/en/rest/about-the-rest-api/api-versions) [GHR01]. Explicit version selection avoids silently relying on the older default.
- [GitHub rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) [GHR02]. Limits are associated with the originating IP for anonymous public access; provider instructions remain authoritative.
- [Latest release endpoint](https://docs.github.com/en/rest/releases/releases#get-the-latest-release) and [commit list endpoint](https://docs.github.com/en/rest/commits/commits#list-commits).

No stack ranking, automatic upgrade, new platform-authentication coverage or recommendation for another project follows from this workflow.
