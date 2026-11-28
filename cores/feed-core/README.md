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
| `freshness(digest, {now?, maxAgeMs?, offline?})` | Distinguishes current, stale, unknown, future-clock and offline state. Uses observed successful fetch times where present; a new build timestamp cannot hide an older failed source refresh. |
| `mergeDigests(previous, incoming)` | Merges an archive without deleting old records on a partial fetch. Hosts that intentionally use rotating managed snapshots can replace those snapshots while retaining bookmarked records separately. |
| `parseImportedFeed(text, {sourceId?, baseUrl?, DOMParser?})` | Parses JSON Feed 1/1.1 or RSS/Atom text. XML uses the host parser, rejects DTD/entity declarations, performs no network requests and namespaces supplied entry IDs by source. |
| `exportFeed(items, {format?, title?, url?, feedUrl?, generatedAt?})` | Serializes JSON Feed, RSS or Atom. Atom requires explicit `generatedAt` for its required update time. Missing original publication dates stay missing. |
| `exportPreferences(prefs)` / `importPreferences(json, sources?)` | Portable versioned JSON. Unsupported versions and files above 8 MiB are rejected before changing host state; no partial import. |

An item carries `id`, `sourceId`, `sourceIds`, `title`, `url`, `date`,
`publishedAt`, `updatedAt`, `fetchedAt`, `summary`, `category`, `media`, `tags`
and `retained`. Existing INTA `date` and `media` records remain compatible. A
missing date is `''`; the fetch clock is never substituted for publication time.
Publisher dates, feed retrieval time and snapshot generation time are different
facts and must remain separately labeled in the consumer.

Preference schema version 1 supports `view`, `sourceView`, `sort`, `density`,
`columns`, `cardStyle`, `showImages`, `showSummary`, `sourceOverrides`,
`followedSourceIds`, `readIds`, `savedIds`, `savedItems`, `customSources`,
`customItems`, `includeKeywords`, `excludeKeywords`, `includeRegex`,
`excludeRegex`, `ticker`, `presets`, `bundles` and `collections`.
Presets store presentation/filter/source settings and omit private reading history,
saved snapshots and other presets. Exported preferences are portable files;
automatic account/device synchronization requires a separate authenticated host
adapter and is not claimed by this core.

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
- No learned recommendation model, semantic clustering, paywall bypass, arbitrary
  JavaScript extraction, cloud account, paid API or hidden telemetry is added.
- The original GameSync and GameSync Next source was inspected as a feature
  reference, left unchanged, and not copied into this independent implementation.
  Full extraction/studio/widget parity is tracked as consumer work, not asserted.

## Evidence

Run the commands in [Shared cores](../README.md). On Node 24.22.3 the initial
15 JavaScript contract/lifecycle tests passed. Computing dates and lexical scores
once per ranking reduced a complete 10,000-record fixture's median sort time
from a readable reference's 64.70 ms to 10.98 ms across 15 runs; p95 was
94.59 ms versus 15.35 ms, with every returned ID and order compared. The first
complete candidate call took 14.78 ms. This is synthetic module timing on one
environment, not whole-app cold-start or field performance, and the benchmark
prints fresh measurements rather than imposing a machine-dependent time gate.

Local Chromium acceptance was initially blocked because the browser binary was
absent and the official Playwright download returned network HTTP 403. The
browser harness remains an explicit required consumer/CI check; Node lifecycle
fixtures are not described as rendered-browser proof.

Primary references reviewed November 28, 2026:

- [JSON Feed 1.1](https://www.jsonfeed.org/version/1.1/) — stable item identity and distinct publication/update fields.
- [Atom RFC 4287](https://www.rfc-editor.org/rfc/rfc4287) — feed/entry metadata and date contracts.
- [RSS 2.0 specification](https://www.rssboard.org/rss-specification) — feed serialization and optional publication dates.
- [GameSync source reference](https://github.com/Herbertofury/Gamesync/blob/main/app/shared/ui/newsforge.js) and [typed GameSync Next studio](https://github.com/Herbertofury/GameSync-Next/blob/main/apps/extension-v2/src/ui/app/NewsForgeStudio.tsx) — behavior inventory, not a runtime acceptance claim.
