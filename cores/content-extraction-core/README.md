# content-extraction-core

Application-independent extraction from HTML text that the host has already
obtained. This module does not fetch pages or run publisher JavaScript. It exposes
`ContentExtractionCore` in browsers and CommonJS exports in Node. Load `feed-core`
first; Node consumers provide a standards-compatible `DOMParser` adapter.

## API

```js
const discovered = ContentExtractionCore.discoverFeeds(html, {
  baseUrl: 'https://publisher.example/news/', DOMParser
});
const article = ContentExtractionCore.extractArticle(html, {
  baseUrl: 'https://publisher.example/story', DOMParser
});
const listing = ContentExtractionCore.extractListing(html, {
  sourceId: 'publisher', sourceName: 'Publisher',
  selectors: { item: '.story', title: 'h2', link: 'a', date: 'time',
    image: 'img', summary: '.summary', author: '.byline' }
}, { baseUrl: 'https://publisher.example/news/', DOMParser });
```

`discoverFeeds` returns deduplicated `{url,type,title}` records for declared
`rel=alternate` RSS, Atom and JSON Feed links. It respects the supplied page URL,
ignores an untrusted `<base>` element, rejects active schemes and credential-bearing
URLs, and never probes discovered destinations itself.

`extractArticle` returns plain strings and safe media URLs: title, canonical URL,
publication date, modification date, summary, body text, author, images, tags,
declared feeds, field provenance and diagnostics. It reads bounded JSON-LD article
records, Open Graph metadata and ordinary article markup in that order. An update
date never becomes the publication date. Missing dates remain empty. Script,
style, hidden, navigation, frame and form text is excluded from body extraction.

`extractListing` returns `{items,stats,diagnostics}`. Items use `FeedCore` records.
`stats` distinguishes matched, processed, extracted, skipped, undated, duplicate
and limited rows; diagnostics use `{level,code,message}` with an optional field or
row. Cross-origin article links are disabled by default and can be permitted by an
explicit `allowCrossOrigin` recipe setting. Media URLs may use a separate image
host; returning a URL does not load that resource.

## Inert parsing and bounds

Only a fixed empty document is parsed with `DOMParser`. Supplied HTML is placed in
a detached template's content, which stays outside any browsing context. No nodes
are inserted into a live document or returned for the caller to insert. This
also avoids the resource-loading behavior possible with a bare HTML parser
document. The caller receives data, never trusted HTML. This is an extraction
library, not a general HTML sanitizer.

Input is limited to 4 MiB of JavaScript string length and 50,000 elements. Listings
process at most 500 selected rows; selectors are limited to 512 characters.
`:scope` or `:self` selects the current item for a field. Other selectors use the
host DOM selector engine; malformed selectors produce errors. `:has()` is excluded
to keep expensive relational selectors out of unattended extraction recipes.
JSON-LD processing is bounded by block size, count, depth and visited records.

A client-rendered page with no useful downloaded HTML cannot be reconstructed by
this core. Authentication, CORS, acquisition permissions, robots policy, browser
rendering and provider-specific extraction remain host responsibilities. Existing
portfolio web acquisition/extraction candidates remain in the shared capability
registry; this module adds an inert client-side contract rather than replacing
those transport systems.

## Verification and primary references

```sh
npm ci --ignore-scripts
node --test cores/content-extraction-core/tests/*.test.cjs
node cores/browser-check.cjs
```

The Node suite uses the repository's pinned development-only `linkedom` adapter
and checks actual selector/metadata behavior. The browser harness separately tests
the platform DOM implementation and inert resource behavior; DOM fixtures alone
are not rendered browser proof.

- [WHATWG alternate link and feed discovery](https://html.spec.whatwg.org/multipage/links.html#link-type-alternate)
- [HTML template content](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/template)
- [DOMParser HTML inertness and resource caveats](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString)
- [Schema.org NewsArticle](https://schema.org/NewsArticle)
- [Article structured data fields](https://developers.google.com/search/docs/appearance/structured-data/article)

These private source files are `UNLICENSED` pending an explicit owner licensing decision.
