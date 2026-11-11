# WordPress collection evidence without false completeness

Checked November 11, 2026 UTC. [Adapter directory](README.md) · [Offline implementation](../../experiments/site-extraction-lab/wordpress_collection.py) · [Public capture receipt](../../experiments/site-extraction-lab/wordpress-collection-validation-2026-11-11.json)

## The missing layer

The existing [one-post parser](../../experiments/site-extraction-lab/extractors.py) already preserves a selected body, author join, featured image and ordered media projection. This addition reuses that parser unchanged and reconciles **multiple supplied REST responses**. It does not replace a provider SDK, scrape pages or add an application integration. Earlier WordPress/RSS results retain their original scope.

WordPress documents `page`, `per_page` (1–100), `X-WP-Total` and `X-WP-TotalPages` [WPC11001]. Those headers describe the queried collection, including filters. The posts route supports filters such as `include` and `author` [WPC11002]. A complete two-ID query is therefore different from a complete site collection.

## Actual public check

Four unauthenticated GET responses from the official [WordPress News REST endpoint](https://wordpress.org/news/wp-json/wp/v2/posts) were captured on November 11. Each used `per_page=1`, `orderby=id`, `order=asc` and `_embed=author,wp:featuredmedia`. No credentials, cookies, account creation, grant or media request was used.

| Capture scope | Pages supplied | Declared posts/pages | Result |
|---|---:|---:|---|
| Broad public posts collection | 1, 2 | 1,117 / 1,117 | Two posts retained; **1,115 missing pages**, not complete |
| Explicit `include=1,2` collection | 1, 2 | 2 / 2 | Both selected IDs covered; **complete history remains false** |

These are the same two historical posts, not four distinct posts or current-release observations. Embedded author IDs joined in all four responses. The recorded input hashes and normalized-body hashes match between scopes; query scope and declared coverage differ. No thumbnail/image decode, download or playback was attempted. A preliminary successful route probe was not retained byte-for-byte and is not included in the four-response replay evidence.

`capturedScopeCovered` requires consistent total headers, every expected page, matching unique-ID counts, no cross-page duplicate IDs, no conflicting snapshots and successful post normalization. It is evidence about the supplied captures, not authentication of the captures. `snapshotConsistency` remains `unproven`: matching totals and unique IDs cannot detect every equal-count replacement or edit between requests. `completeHistory` and `fullSupportAccepted` always remain false.

## Preserve failures instead of inferring an end

Each attempt keeps its status, input length/hash, requested page and outcome. A 401/403 is access denied; 429 is rate limited; 404 is unavailable; 304 lacks a representation in this standalone replay. Other non-200 responses remain failures, including 400. The upstream controller can return 400 for an out-of-range page [WPC11005], but an error alone is not evidence that every earlier page was collected.

An identical repeated page is recorded without duplicating its posts. A contradictory repeated page or post retains both source variants and blocks coverage. Missing headers leave missing-page counts unknown. A short or empty response is checked against declared counts rather than treated as automatic exhaustion. A successful later response does not remove an earlier failed attempt. Live requests here all succeeded; denial, rate-limit, conflicting snapshot and malformed-input cases are explicitly **synthetic tests**, not induced provider incidents.

The receipt shows a bounded sample of missing page numbers plus the full missing count. It never materializes an enormous missing-page list or follows a server-supplied link.

## Body, identity and media boundaries

Every successfully parsed post retains its original JSON object in memory. Missing, null, empty, rendered and protected content have separate states. The wrapper avoids the older parser's null-to-empty fallback without editing it. Its HTML projection may reserialize markup; the exact source field and the projected body have different meanings and hashes. An excerpt is never promoted to a missing body.

Numeric author identity must match the embedded author. Featured-media identity is separately checked; it never becomes an avatar. Malformed author/media joins remain failed normalizations with the original post retained. An embedded error placeholder is currently a failed normalization, not a successful empty relationship. WordPress's documented embedding can include placeholders and applies pagination limits to embedded collections [WPC11003]; this experiment does not establish complete comments or terms.

The `_fields` option can omit content and other relationships; `_embed` cannot repair fields that were excluded unless the relevant response fields are requested [WPC11004]. Supported queries retain their exact filter scope. Collection coverage does not imply complete fields or media. The existing body projection is not an HTML sanitizer or complete block/plugin renderer. Delivery, decoding, playback and complete-media acceptance are independent unattempted gates.

## Use the offline module

From `engineering/`, after satisfying the existing lab's `requirements.txt`:

```sh
python experiments/site-extraction-lab/wordpress_collection.py --manifest /your/captures/manifest.json --access public --output /your/results/receipt.json
python -m unittest discover -s tests -p test_wordpress_collection.py -v
```

The caller-created manifest is a JSON list of objects with `requestUrl`, numeric `status`, string-valued `headers` and `bodyFile`; relative body paths resolve beside the manifest. Optional `finalUrl` must identify the same request scope. The manifest is a trusted local instruction, not something to execute from an unreviewed remote source. The module reads local files but makes no HTTP requests.

Only HTTPS `/wp-json/wp/v2/posts` routes, optional simple installation prefixes and `context=view` are accepted. Query keys are explicitly allowlisted; offsets, method override, JSONP, envelopes, credential parameters, custom routes, array-style parameters and edit context are unsupported. Bare `_embed` without `=` is also unsupported; use `_embed=1` or a relation list. Query-order differences are normalized, but different filter values remain different scopes. This strict subset can reject a valid site; rejection is not evidence that the site is unsafe or unsupported by WordPress itself.

Limits are 256 captures, 8 MB per response, 32 MB aggregate response bytes, 64 JSON levels and 200,000 JSON nodes per response. These are parser admission limits, not a strict process-memory or execution-time sandbox. Full raw copies and HTML parsing add memory overhead.

The public receipt excludes raw JSON, body/title/author prose, request query values, response headers and local paths. Body hashes/counts, numeric identities and sanitized media/link references remain. URL hostnames and paths remain: path-carried tokens or private identifiers are not scrubbed. A query-scope hash is an identity checksum, not encryption or anonymity. `--access` records the caller's capture context and grants no permission or right to publish private data. Independently review all output before publication.

## Alternatives and adoption gate

- Reuse the original one-post extractor for one selected record. It is simpler and its previous receipts remain valid, but it cannot reconcile page coverage.
- A WordPress SDK or approved browser can collect inputs and handle transport; this module does neither. Authentication, retries, redirect policy, rate limiting and permission remain the transport's responsibilities.
- RSS is useful when that is the supported public route. Its observed feed window does not prove the same filtered REST scope or full site history.
- Discourse already has separate topic-stream research in Athena's wider corpus. Rebuilding that adapter would duplicate prior work; this contribution addresses WordPress's distinct page/count contract instead.

Before recommending this in a target app, compare that app's current implementation against the same complete workload and verify transport, access, content fields, media, rendering and interruption behavior. No such target comparison or performance claim is made here. See the [dated research record](../../research/2026-11-11-wordpress-collections.md).
