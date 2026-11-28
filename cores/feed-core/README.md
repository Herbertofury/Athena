# feed-core

Portable feed contracts and deterministic processing, with zero JavaScript runtime
dependencies. The browser build exposes `FeedCore`; Node can use
`require('./feed-core.js')`. The Python collector lives in [python/](python/).
The public feature name belongs to each consumer; INTA calls it **News**.

## Browser/Node API

| API | Behavior |
| --- | --- |
| `normalizeItem(raw, source?)` | Returns a normalized item or `null` when its title, source ID or HTTP(S) link is missing. Rejects active schemes and credential-bearing links. |
| `canonicalUrl(url)` / `deduplicateItems(items)` | Removes only known tracking query fields and fragment identifiers. Dedupe is exact URL identity, preserves source attribution and richer metadata, and does not merge unrelated equal headlines. |
| `normalizePreferences(raw, sources?)` | Validates typed settings, source overrides, layouts, ticker choices, presets, custom feeds, saved article snapshots, bundles and collections. Unknown script/credential fields are excluded. |
| `sourceEnabled(source, prefs)` / `resolveSourceSelection(sources, prefs)` | Explicit enable/disable wins over catalog defaults. Unknown or temporarily absent source overrides survive export/import. The latter returns a `Set` of selected IDs. |
| `filterItems(items, options)` | Combines query tokens, selected sources, categories, include/exclude keywords, restricted regex, read/saved status and image presence. Accepts source metadata as a `Map` or plain object. |
| `rankItems(items, options)` | Stable newest, oldest, source or explicit lexical-relevance ranking. The relevance score uses query matches, supplied source weights and age; it is not AI, semantic similarity or an objective credibility score. |
| `clusterStories(items, options)` | Bounded lexical title grouping within a configurable publication window. Returns labeled groups and preserves every report and source; it does not establish that similar headlines describe the same event. |
| `rankItemsSemantic(items, {query, embedder?, signal?, timeoutMs?, maxItems?})` | Optional asynchronous embedding adapter with cosine ranking, vector validation, cancellation and deadline. No provider is configured by default; unavailable or invalid embeddings return an explicitly labeled lexical fallback. |
| `normalizeFeedRecipe(raw)` / `normalizeDashboard(raw)` | Shared typed persistence schemas used by the generation and visual editor cores. |
| `freshness(digest, {now?, maxAgeMs?, offline?})` | Distinguishes current, stale, unknown, future-clock and offline state. Uses observed successful fetch times where present; a new build timestamp cannot hide an older failed source refresh. |
| `mergeDigests(previous, incoming)` | Merges an archive without deleting old records on a partial fetch. Hosts that intentionally use rotating managed snapshots can replace those snapshots while retaining bookmarked records separately. |
| `parseImportedFeed(text, {sourceId?, baseUrl?, feedUrl?, DOMParser?})` | Parses JSON Feed 1/1.1 or RSS/Atom text. XML uses the host parser, rejects DTD/entity declarations, performs no network requests and namespaces supplied entry IDs by source. `baseUrl` resolves links; only declared feed metadata or explicit `feedUrl` establishes a refresh endpoint. |
| `exportFeed(items, {format?, title?, url?, feedUrl?, generatedAt?})` | Serializes JSON Feed, RSS or Atom. Atom requires explicit `generatedAt` for its required update time. Missing original publication dates stay missing. |
| `exportFeedResult(items, options)` | Returns the same content plus `format`, `inputItems`, `exportedItems`, `omittedItems` and warnings. Atom omits entries with neither a real source publication nor update instant; hosts must display the omission notice. |
| `exportPreferences(prefs)` / `importPreferences(json, sources?)` | Portable versioned JSON. Unsupported versions and files above 8 MiB are rejected before changing host state; no partial import. |

An item carries `id`, `sourceId`, `sourceIds`, `title`, `url`, `date`,
`publishedAt`, `updatedAt`, `fetchedAt`, `summary`, `category`, `media`, `tags`
and `retained`. Existing INTA `date` and `media` records remain compatible. A
missing date is `''`; the fetch clock is never substituted for publication time.
`publishedAt` and `updatedAt` contain only timezone-aware source instants, while
`date` can preserve a date-only original. A date-only record never gains an invented
midnight timestamp. JSON Feed preserves its day under `_feed_core.date`; RSS uses
`dc:date`, with actual instants in `pubDate`/`dcterms:issued`. Atom retains only
entries with a real source publication or modification instant because each entry
requires `updated`; the feed generation time is used solely on the feed itself.
RSS and JSON retain untimed stories. The Python publication module follows the
same precision contract, with its own projection/omission receipt.
Publisher dates, feed retrieval time and snapshot generation time are different
facts and must remain separately labeled in the consumer.

Preference schema version 1 supports `view`, `sourceView`, `sort`, `density`,
`columns`, `cardStyle`, `showImages`, `showSummary`, `sourceOverrides`,
`followedSourceIds`, `readIds`, `savedIds`, `savedItems`, `customSources`,
`customItems`, `includeKeywords`, `excludeKeywords`, `includeRegex`,
`excludeRegex`, `ticker`, `presets`, `bundles`, `collections`, `feedRecipes`,
`dashboards`, `activeDashboardId` and `groupRelated`.
Presets store presentation/filter/source settings and omit private reading history,
saved snapshots, builder recipes, dashboards and other presets. Exported preferences are portable files;
automatic account/device synchronization requires a separate authenticated host
adapter and is not claimed by this core.

When a managed catalog is supplied to `importPreferences`, imported custom source,
custom item and recipe IDs cannot impersonate its source IDs. A collision rejects
the complete import and leaves host state unchanged. Managed-source reading
snapshots and explicit source opt-outs remain valid. Hosts should also keep managed
metadata authoritative when combining older saved data with the catalog.

A source's publisher `url` and its actual `feedUrl` are separate. A file import
can have a known publisher homepage and no known refresh endpoint; normalization
preserves that empty endpoint. Hosts should offer an explicit endpoint editor
rather than trying to fetch a homepage as RSS.

The November 28, 2026 Athena reuse inventory found no implemented authenticated
account/preferences synchronization service in the capability registry or runtime
code. The existing [Projects workspace](../../docs/integration/PROJECT-BROWSER.md)
documents local persistence and portable JSON, while
[receipt recovery](../../scripts/receiver_receipt_storage.mjs) covers local atomic
readback. Neither is a remote identity or cross-device synchronization service.
The portable format is ready for an independently authenticated host adapter;
automatic cloud/device synchronization is not implied by sharing this schema.

## Restricted regular expressions

`compilePattern(pattern)` returns a case-insensitive predicate backed by a small
Thompson NFA. Supported syntax is literals, `.`, character classes/ranges,
`\d`, `\w`, `\s` and uppercase inverses, branch anchors `^`/`$`, alternation
`|`, and `?`, `*`, `+`, `{n}`, `{n,m}` and `{n,}` repetitions. Example:
`CVE-\d{4}-\d{4,7}`. Groups, backreferences, lookarounds, boundaries and Unicode
property escapes are rejected with an explicit error. Patterns exceeding 512
characters or 4096 expanded states, and finite repetitions above 1000, are also
rejected. Matching visits each state at most once per character rather than using
a backtracking regular-expression engine. Hosts must show these limits and leave
the previous valid filter active after an error.

## Ownership and constraints

- Source catalog quality choices and permitted endpoints are host policy inputs.
  The core does not silently enable a newly discovered unreviewed publisher.
- Callers render text as text, validate server-side acquisition permissions, and
  handle storage quota, browser CORS, credentials and explicit media loading.
- No learned model, embedding provider, paywall bypass, arbitrary JavaScript
  extraction, cloud account, paid API or hidden telemetry is added. The optional
  semantic ranking interface calls only a host-supplied `embedder(texts,{signal})`;
  the host owns model selection, privacy, cost and transport. Returned vectors must
  be finite, nonzero and equally sized, with at most 4096 dimensions. At most 500
  items are embedded per call; remaining results retain lexical order and the
  method reports `semantic-with-lexical-tail`. A provider failure or timeout reports
  `method: 'lexical'` with a reason. Cancellation rejects with `AbortError`.
- The original GameSync and GameSync Next source was inspected as a feature
  reference, left unchanged, and not copied into this independent implementation.
  Full extraction/studio/widget parity is tracked as consumer work, not asserted.

## Evidence

Run the commands in [Shared cores](../README.md). On Node 24.22.3 the initial
feed, ticker, extraction, generation and editor contract/lifecycle tests pass,
including DOM adapter fixtures. Computing dates and lexical scores
once per ranking reduced a complete 10,000-record fixture's median sort time
from a readable reference's 64.70 ms to 10.98 ms across 15 runs; p95 was
94.59 ms versus 15.35 ms, with every returned ID and order compared. The first
complete candidate call took 14.78 ms. This is synthetic module timing on one
environment, not whole-app cold-start or field performance, and the benchmark
prints fresh measurements rather than imposing a machine-dependent time gate.

Local Chromium acceptance was initially blocked because the browser binary was
absent and the official Playwright download returned network HTTP 403. Baseline
commit `576c80423a406baa7a509c6580490bfe94e81633` subsequently passed
[actual Chromium XML-import/ticker CI](https://github.com/Herbertofury/Athena/actions/runs/46172706371),
along with Node 24/26 and Python contracts. New extraction and widget changes
require their own exact-revision CI run; the baseline pass does not cover them.
The current source subsequently passed all 38 JavaScript and 19 Python fixtures,
plus the actual local Chromium 158 harness with inert resource checks, extraction,
XML imports and ticker lifecycle. The mounted widget tests use a DOM adapter;
complete application visual/native acceptance remains a consumer responsibility.

Primary references reviewed November 28, 2026:

- [JSON Feed 1.1](https://www.jsonfeed.org/version/1.1/) — stable item identity and distinct publication/update fields.
- [Atom RFC 4287](https://www.rfc-editor.org/rfc/rfc4287) — feed/entry metadata and date contracts.
- [RSS 2.0 specification](https://www.rssboard.org/rss-specification) — feed serialization and optional publication dates.
- [GameSync source reference](https://github.com/Herbertofury/Gamesync/blob/main/app/shared/ui/newsforge.js) and [typed GameSync Next studio](https://github.com/Herbertofury/GameSync-Next/blob/main/apps/extension-v2/src/ui/app/NewsForgeStudio.tsx) — behavior inventory, not a runtime acceptance claim.
