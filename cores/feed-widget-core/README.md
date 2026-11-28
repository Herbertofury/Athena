# feed-widget-core

A browser UI for news, source discovery, personal dashboards and feed creation.
It owns the complete presentation layer so compatible apps can consume one
maintained implementation. It has no framework or production package dependency.
The package is private and `UNLICENSED`; no third-party application source was
copied into this implementation.

The public name in a consuming product is its choice. The default is **News**.
Data acquisition, catalog quality policy and hosted delivery remain host
responsibilities. This core is not an always-running news server.

## Load and mount

Load `feed-core.js`, `ticker-core.js` and `feed-widget-core.js`, plus
`feed-widget-core.css`. To include website extraction and dashboards, load
`content-extraction-core.js`, `feed-generation-core.js` and
`visual-editor-core.js` before creating the reader. All are plain scripts with
UMD exports; no network import or build service is required at runtime.

```js
const reader = FeedWidgetCore.createReader({
  storageNamespace: 'my-project:news',
  title: 'News',
  route: '#news',
  groups: {reporting: 'Reporting', advisory: 'Advisories'},
  helpers: {
    digestUrl: './news-digest.json',
    catalogUrl: './news-sources.json',
    healthUrl: './news-refresh-state.json'
  }
});

const stop = reader.mount(document.querySelector('#reader'), {
  catalog: {schemaVersion: 1, sources: sourceCatalog, briefing: []},
  digest: publishedDigest
});
// Call stop() or reader.dispose() when leaving the mounted surface.
```

The existing `{news, newsDigest}` data names are also accepted for compatible
consumers. `catalog.sources` contains source IDs, names, HTTPS publisher URLs,
category, description, `managed`, `defaultEnabled` and optional recommendation
metadata. Items and digest health follow `feed-core` schema version 1.

### Configuration

| Option | Purpose |
| --- | --- |
| `storageNamespace` | Isolates preferences, retained snapshots and reader settings. The default is `feed-reader`; apps should supply their own namespace. |
| `title`, `description`, `eyebrow`, `route` | Product-facing labels and the route used by the Home strip. |
| `groups` | Maps the host's category IDs to readable labels. |
| `editorialSourceIds` | Identifies static editorial selections that must not count as automatically checked feeds. Digest rows with `origin: 'editorial'` already have this behavior. |
| `defaultWidgets` | Optional first dashboard's widget definitions. An unconfigured reader starts with a latest-headlines widget. |
| `publicUrl` | Publisher identity for exported feeds. No product URL is embedded in the shared source. |
| `remoteBaseUrl` | Optional public catalog/digest/health base for a bundled local reader. A file-hosted reader without endpoints makes no background requests. |
| `legacyFollowKey` | Optional host-owned storage key to migrate prior saved-source selections. |
| `feedCore`, `tickerCore`, `contentExtractionCore`, `feedGenerationCore`, `visualEditorCore` | Explicit dependency injection; by default the corresponding UMD global is used. |
| `helpers` | Defaults for the integration helpers below. Individual render/mount calls can supply an override. |

Helpers are `icon(name)`, `logo(source)`, `notify(message)`,
`download(filename, text, mimeType)`, and `digestUrl`, `catalogUrl`, `healthUrl`.
The icon/logo outputs are trusted host markup; never pass publisher HTML through
those hooks. Publisher titles, summaries, source descriptions and extraction
results are escaped as text. A native host can implement `download` using its
file-save mechanism; the browser fallback creates a normal Blob download.

### Lifecycle API

| Method | Behavior |
| --- | --- |
| `mount(element, data, helpers?)` | Renders and binds a reader; returns its disposer. |
| `render(data, helpers?)`, `bind(container)` | Separate rendering and binding for existing host routers. |
| `renderHomeTicker(data, helpers?)`, `bindHomeTicker(container)` | Produces the same configured strip for a homepage. |
| `refresh(manual?)` | Checks the configured public snapshot, catalog and health documents. It does not scrape managed publishers in the client. |
| `dispose()` | Releases handlers, animation controllers, timers and pending snapshot requests. |

One reader instance owns one mounted News or Home surface at a time. Call
`dispose()` when replacing it. The host owns surrounding navigation, headings
outside the reader, native lifecycle and source catalog policy.

## Implemented behavior

- Gallery, compact gallery, list, masonry, magazine, carousel, imageboard,
  slideshow, social feed and ticker reading views use the same selected items.
- Source galleries and lists support search, categories, recommendations, saved
  sources, enable/disable and health filters. Explicit source choices override
  evolving catalog defaults. Reference-only sources are labeled and not offered
  a live-feed toggle.
- Saved story snapshots, read/unread state, keyword filters, restricted regular
  expressions, ordering, source bundles and exact story collections persist
  locally. Saving a preset does not erase source ownership or reading history.
- The opt-in related-headline control uses `feed-core`'s lexical grouping.
  Publication time and headline word overlap are signals; this is not a semantic
  model or verification of the stories' claims. Every article remains present.
- Eighteen card treatments and eleven strip treatments share the host palette by
  default. Strip controls include speed, direction, label, badge shape, accent,
  optional headline color, font size, optional images, date display and hover
  pausing. Reduced-motion settings, focus and hidden-page state are honored by
  `ticker-core`; duplicate segments are inert and removed on disposal.
- Dashboards contain independently filtered and sized view widgets. Users can
  add/edit/delete them, change layouts and source sets, and reorder with drag
  handles or explicit Move earlier / Move later buttons. The shared
  `visual-editor-core` owns normalization and order updates.
- RSS, Atom and JSON Feed content can be pasted or imported. Public feed fetching
  works where the publisher permits browser CORS. JSON Feed, RSS and Atom export
  retain original publication dates; the export clock is not substituted for a
  missing publication date.
- Website generation accepts fetched, pasted or imported HTML. Users can discover
  advertised feeds, choose listing or article extraction, edit CSS selectors,
  preview records and diagnostics, save a local generated feed and export/import
  its recipe. Source scripts and resources are not executed by the inert
  extraction parser. A changed page that fails its saved count/date constraints
  retains the previous good items on refresh.
- Portable preference exports include local feeds, saved story metadata,
  dashboards, source bundles, collections, settings and recipes. They are files,
  not an authenticated synchronization service.

## Freshness, network and offline rules

The hosted collector's `generatedAt` is a snapshot timestamp, never proof that
every source succeeded. Per-source `lastSuccessfulCheckAt`, `attemptedAt`,
`nextAttemptAt` and health override retained digest status. An optional public
health-state map can show failures even when an all-failed collector run keeps
the prior digest unchanged. Unknown dates remain visibly unknown.

The reader checks its three public JSON resources on launch, when connectivity
returns, when it becomes visible and at a five-minute interval while its surface
is mounted. A minimum one-minute interval avoids duplicate requests. Automatic
checking can be disabled. Each batch is bounded by a timeout and a 3 MB response
limit, omits credentials and keeps the last good snapshot on a failed validation
or request. An active reader can defer a new snapshot behind a Show updates
control; manual Refresh applies a validated snapshot immediately.

Catalog and successful snapshot caches retain their true timestamps. Bookmarked
metadata is kept independently of the rolling publisher snapshot. The host must
bundle/offline-cache the core scripts, CSS and a useful initial digest. Enabling
publisher imagery is separate from basic reading; images are off by default.
Storage quota failure is visible and in-session reading remains available.

Custom feed and generated-page refresh uses public HTTPS and browser CORS. Local
imports do not create a hosted subscription, schedule, webhook or credential.
Automatic managed-source collection is supplied by the consuming app's hosted
worker. No paywall bypass, session scraping, hidden proxy, external font service,
analytics service or paid AI provider is introduced by this UI.

## Styling and accessibility

The stylesheet uses the host's `--surface`, `--text`, `--muted`, `--line`,
`--line-soft`, `--accent`, `--subtle`, `--hover`, `--sidebar` and `--focus` tokens,
with standalone dark defaults. Optional card/ticker treatments affect the reader
only. Controls have visible focus, labels and pressed/selected state. Layouts
reflow to a single column and retain text content when images cannot load.
Slideshow autoplay is off initially. Accessible movement controls accompany
pointer drag editing.

Runtime validation is necessary before making a whole-product accessibility or
native-device compatibility claim. The shared renderer does not prove a WebView
host's file chooser, export bridge, back navigation or lifecycle.

## Verification and limits

From the repository root, after `npm ci --ignore-scripts`:

```sh
node --test cores/feed-widget-core/tests/*.test.cjs
```

The five mounted DOM contract checks cover source/read/save persistence,
preset isolation, rejected pattern retention, dashboard order and editing,
actual inert selector extraction/discovery/save/export, and ticker clone
cleanup. They use linkedom and explicitly accommodate its textarea form-value
behavior. They are **not** a rendered-browser, animation smoothness, CSS or
native WebView acceptance claim. The consuming INTA repository adds
`tests/browser_news.py` for real Playwright interaction, keyboard/drag behavior,
responsive overflow, untrusted resource isolation and exports.

Original GameSync and GameSync Next implementations were inspected read-only as
feature references. This independent implementation covers the behaviors listed
above; it does not claim full parity with their complete studios. Remaining
host/integration work includes authenticated cross-device synchronization,
notification delivery, hosted user-defined publishing/webhooks/schedules, richer
media/audio controls, and a configured semantic embedding provider. Exact-date,
source-health and security constraints remain active even where those features
are later added.
