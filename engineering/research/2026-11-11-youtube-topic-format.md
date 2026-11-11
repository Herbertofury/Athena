# YouTube topic XML must not become empty RSS success

Checked November 11, 2026. Exact baseline: Athena draft #43 at `7ba88d30229f3073c9aa738f087b9199ffae16ae`. This contribution changes only the existing offline RSS parser's input gate and supporting evidence. No target app, active release, runtime, dependency or account changed.

## Decision and existing implementation

The existing YouTube adapter already separates video identity, thumbnails and official-player playback. The shared site-extraction lab has an RSS normalizer, but it searched `./channel/item` under any XML root. Consequently valid unrelated XML became `[]`: a false successful parse, indistinguishable from a recognized empty RSS channel. No new parser library or duplicate provider client is needed to repair that boundary.

Earlier draft #5 concerns RSS titles; #14 concerns publication dates. Neither is included here, and neither supplies this envelope gate. The changes share a file and need conflict-aware integration later. No integration is performed by this draft.

## Official route and actual evidence

The official push-notification guide documents `https://www.youtube.com/xml/feeds/videos.xml?channel_id=CHANNEL_ID` as a topic URL. Its Atom notification examples do not promise that a direct GET is a current uploads feed. The official channel-ID guide supplies the historical GoogleDevelopers example used here. Its legacy v2 discussion is not a current supported route. [YTG11001] [YTG11002]

Exactly one anonymous bounded GET of that documented topic was made on November 11, with a descriptive research User-Agent, thirty-second timeout, automatic redirects disabled and a one-MiB-plus-one read bound. It completed with HTTP 200, no redirect and 463 bytes, SHA-256 `f43e820f3c928fae60e93e1feeb5cb36d2c852849a760e85dd929471faefd6be`. The Atom root had zero entries, no feed/channel ID and a self link without the selected channel query. Its subscription descriptor therefore cannot validate current channel binding or entry mappings. [YTG11004]

The response's Last-Modified header says March 3, 2020. That is a representation timestamp, not proof that the channel or its videos have not changed. The November 11 capture time records this observation. These dates must not be interchanged. The local raw response is not published; the sanitized [receipt](../experiments/youtube-topic-gate-lab/public-validation-2026-11-11.json) retains transport headers, input hash and structural observations only.

No alternative feed endpoint, hub subscription, callback, credentials, watch-page scraping, account data, media download or polling was attempted. This is not an ongoing content cache. The policies and a successful HTTP response do not authorize arbitrary scraping or reuse of linked material. [YTG11005]

## Measured baseline and bounded repair

The same exact bytes produce `[]` under the baseline and an explicit `ExtractionError` under the candidate. [Before](../experiments/youtube-topic-gate-lab/before.json) and [after](../experiments/youtube-topic-gate-lab/after.json) retain separate implementation hashes. Neither outcome is collection acceptance: zero entries here do not mean zero channel videos.

The repair requires an unnamespaced `rss` root with one direct core `channel`, and core `item` elements directly under that channel. It preserves recognized empty RSS channels, existing field output, opaque foreign-namespace extension subtrees (including unqualified payloads) and existing version handling, including versionless fixtures and 0.91/0.92 values. The RSS specification documents that core structure and namespace distinction; the gate does not certify full schema/version conformance. [YTG11003]

The new tests use explicitly synthetic fixtures for malformed roots, duplicate/nested channel placement, misplaced items and compatibility. They do not pretend to be YouTube entries. Existing DTD/entity rejection and malformed-XML behavior are unchanged. The experiment is offline and reuses the established extractor, without new transport or runtime wiring.

## Rejected alternatives and remaining gates

- Accept any parseable XML and return an empty list: hides unsupported formats and can erase discovery failures.
- Treat HTTP 200 or zero entries as successful channel collection: unsupported by this actual response.
- Add a full Atom/YouTube collector from a zero-entry descriptor: real entry identity, bodies, media and completeness remain untested.
- Fetch an alternate endpoint or scrape watch pages after this narrow result: outside this bounded investigation and unnecessary to fix the demonstrated parser defect.
- Add a version gate or strict full RSS validator: would create unrelated compatibility changes; this patch only establishes a recognizable core envelope.

No performance, live playback, media decode, full-channel history, authenticated visibility or target-project comparison was performed. No target recommendation follows. Hosted CI and draft status must be read at the published exact commit, not inferred from local tests or a clean mergeability label.

## Retained failures and reproduction

The initial full engineering suite ran 988 tests with two failures: historical WordPress and Bluesky receipts pinned the whole shared extractor's pre-change hash. The other 986 tests passed. These failures are retained; old receipt identities are not silently relabeled. The reconciliation uses exact original captures and compares complete normalized outputs before sanitized projections. Original receipt content is preserved with additive provenance; no new provider capture or expanded acceptance is implied.

Independent review also caught six extension-payload regressions in the initial gate: descendant scans treated unqualified nodes inside foreign extensions as RSS core. The correction stops traversal at foreign-namespace boundaries and preserves the original record output. Initial failing evidence remains retained.

See the [experiment and offline replay tool](../experiments/youtube-topic-gate-lab/README.md). Sources YTG11001 through YTG11005 are registered in the additive [source fragment](../data/sources.d/youtube-topic-gate-20261111.json). Original source entries and prior evidence remain preserved.

## Final local outcome

Final source passed 996 engineering Python tests, 420 engineering Node tests, root
build/tests and all seven generated-asset checks. Independent review reproduced
the actual before/after comparison, extension compatibility and both historical
provider comparisons. The seven retained captures match complete normalized
outputs; original receipt fields remain intact. Research checks pass with 135
existing stale-source notices. No browser/Rust, hosted-CI or target acceptance
claim follows from these local checks.
