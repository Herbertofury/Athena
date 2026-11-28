# feed-generation-core

Reusable website-to-feed recipes with regression validation and portable RSS,
Atom and JSON Feed output. Load `feed-core`, then `content-extraction-core`, then
this module. The browser global is `FeedGenerationCore`; CommonJS resolves the
same neighboring core sources. There are no third-party runtime dependencies.

```js
const recipe = FeedGenerationCore.normalizeRecipe({
  sourceId: 'publisher', sourceName: 'Publisher news',
  baseUrl: 'https://publisher.example/news/',
  selectors: { item: 'article', title: 'h2', link: 'a[href]',
    date: 'time[datetime]', image: 'img', summary: 'p' },
  minimumItems: 1, maxDropRatio: 0.6, requireDates: false
});
const result = FeedGenerationCore.generate(downloadedHtml, recipe, {
  DOMParser, baseline: lastSuccessfulBaseline
});
if (result.validation.ok) {
  const rss = FeedGenerationCore.exportGenerated(result, { format: 'rss' });
  const baseline = FeedGenerationCore.createBaseline(result);
  // The host can now publish the feed and save this successful baseline.
}
```

## Contracts

`normalizeRecipe` returns version 1 data with `sourceId`, `sourceName`, `baseUrl`,
`category`, `mode`, the six selector fields, `limit`, `minimumItems`, `maxDropRatio`,
`requireDates` and `allowCrossOrigin`. Only `listing` and `article` modes are
accepted. In article mode, structured metadata extraction produces one item;
listing mode applies the selectors. Empty optional selectors disable that field.
Empty required item/title/link selectors produce an explicit extraction error.

`generate(html,recipe,options)` returns
`{schemaVersion,source,items,recipe,diagnostics,stats,validation}`. Source and item
records are ordinary `FeedCore` data. `validation` contains `ok`, `errors`,
`warnings` and `counts`; it rejects no-result selector changes, item counts below
the configured minimum, large decreases from a known good baseline, and missing
dates when the recipe requires them. Lost date coverage is also reported.

`createBaseline(result)` stores item count, dated-item count and canonical URLs.
`validateRegression(result,baseline,recipe)` can be run independently by a hosted
worker. Hosts must retain the previous published feed and baseline when it fails.
Validation is evidence of extractor consistency, not a factual-content review.
A real editorial change can legitimately reduce a listing; update the recipe or
baseline after reviewing such a change.

`exportGenerated(result,options)` delegates correct escaping and serialization to
`FeedCore.exportFeed` and rejects a failed result by default, including a prior
baseline failure. An explicit `allowInvalid:true` is available for a host's
reviewed manual export; it must not be used to silently bypass unattended gates.
Atom export requires a known `generatedAt` for its mandatory feed update timestamp
and omits entries lacking real source publication/update times. Use
`FeedCore.exportFeedResult` when a host needs the explicit omission count and warning;
RSS and JSON preserve date-only and undated entries. No midnight or generation
timestamp is invented for an article. Output is a string; no remote
publication, webhook or notification happens implicitly.

`exportRecipe` and `importRecipe` exchange versioned JSON under the
`feed-extraction-recipe` format. Imports are limited to 64 KiB. `FeedCore`
preferences retain these recipes under `feedRecipes`; appearance presets exclude
them so applying a theme cannot erase a builder workspace.

## Host responsibilities

The core is deterministic for a given HTML document and recipe. A host owns
scheduled acquisition, authorization, network restrictions, secret handling,
conditional requests, storage and publication. A pasted HTML document is a
snapshot; it does not become automatically refreshed without an approved worker
or a permitted browser fetch. No claim of arbitrary website support or automatic
selector repair is made. The separate Python collector currently processes
supported feed formats; a host must explicitly integrate HTML recipe acquisition
before advertising unattended website-to-feed refresh.

## Verify

```sh
npm ci --ignore-scripts
node --test cores/feed-generation-core/tests/*.test.cjs
```

Tests cover all three output formats, original-date preservation, source identity,
recipe/settings roundtrips and refusal to publish a regressed extraction. The
underlying feed format references are linked in [feed-core](../feed-core/README.md).
These private source files are `UNLICENSED` pending an explicit owner licensing decision.
