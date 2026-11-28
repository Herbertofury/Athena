# Feed collection

`feed_collector.py` is the standard-library Python adapter for `feed-core`. A product supplies exact publisher policies and decides where to publish the resulting snapshot. The engine does not know any application, publisher, cloud account or framework.

## Integration

```python
from pathlib import Path
from feed_collector import Source, refresh, public_refresh_state

policies = (Source(
    id="publisher",
    feed="https://publisher.example/feed.xml",
    hosts=frozenset({"publisher.example"}),
    discovery_url="https://publisher.example/",
),)

snapshot = refresh(
    Path("digest.json"),
    sources=policies,
    state_path=Path("collector-state.json"),
    report_path=Path("collection-report.json"),
    discovery=True,
)
```

The example uses Python's `pathlib` and this module's `Source` and `refresh` APIs. The example domain is a placeholder, not a working news source.

Pass `state_path` to activate conditional HTTP requests and adaptive scheduling. Store that file durably between workers. Its validators refer only to successfully parsed representations. `public_refresh_state(state, policies)` removes validators, endpoint choices and internal counters before a product publishes health to its readers. Do not confuse the snapshot assembly time, source attempt time, successful source check, and article publication date.

An internal representation version prevents an old conditional cache from skipping newly required normalization. On a parser representation upgrade, each due source is fetched without old validators once; later requests resume conditional operation. For example, version 2 obtains actual source timestamps rather than deriving them from legacy date-only snapshots.

`refresh` without a state path retains the original one-shot API for smaller consumers. This mode does not provide durable adaptive scheduling. `fetch` returns the legacy body/final-URL pair; `fetch_response` also returns HTTP status and cache validators.

## Behavior

- Parse RSS 2, Atom, RSS 1/RDF and JSON Feed 1/1.1. Keep only safe URLs, bounded plain-text titles, publisher dates and permitted media references. A missing article date is never replaced with the current time.
- Preserve timezone-aware publisher timestamps as additive UTC `publishedAt` and `updatedAt` fields. A timezone-naive or date-only value remains day precision. An Atom `updated` or JSON Feed `date_modified` value never becomes a claimed publication time. Previously saved date-only records remain valid and are not assigned an invented midnight.
- Run at most four source requests concurrently. Reject unapproved origins, credential-bearing URLs, private IP endpoints, unsupported media types, XML entity declarations, oversized bodies and invalid feed roots.
- Send `If-None-Match` and `If-Modified-Since` only when the corresponding prior article representation exists. A valid 304 records a real successful check and retains the article bytes.
- Decrease polling frequency for unchanged feeds, up to each policy's maximum. Honor bounded `Retry-After`; back off after failures and continue periodic recovery probes after quarantine. No retry loop sleeps inside a worker.
- Preserve last-good source items on parse errors, empty extraction after prior content, transport failure and future-only output. A total-source outage leaves the digest byte-for-byte unchanged while writing health and a failure receipt.
- Recover renamed endpoints from explicit `rel=alternate` feed links on a configured publisher page. Every candidate must stay within the exact approved host policy and pass the parser before its URL is persisted. No arbitrary crawling or inferred publisher replacement occurs.
- Emit atomically with bounded JSON sizes. Canonical article URLs deduplicate cross-source syndication. A no-op run does not advance the digest timestamp. Explicit editorial seeds retain their editorial origin and never receive a live-check timestamp.

Source policies also carry media-host/path restrictions, alternate feed URLs, per-source intervals, and product-defined promotional exclusions. A directory entry alone is not proof that a publisher offers a parseable feed.

## Bounds and limits

The current live snapshot budget is 16 accepted articles per source, at most 100 configured sources and 600 total articles. Fetching is a current-window collector, not an unlimited historical archive. The collector refuses an over-budget digest rather than silently dropping a whole publisher. Default request size is 1 MiB; individual trusted policies can grant a larger bounded feed budget. Socket requests use a 7-second timeout and each source receives a 16-second work budget. XML, HTML and JSON are untrusted; no fetched text is executed and no media bodies are downloaded.

Endpoint recovery is limited to reviewed publishers. Admitting new publisher identities or unreviewed extraction code remains a product policy decision. This module does not provide authenticated sync, newsletter inbox access, a JavaScript-rendering scraper, semantic embeddings, hosted scheduling, notifications, or a guarantee that a hosting provider will execute every scheduled job. Consumers own deployment and observable freshness alarms.

## Feed publication

`feed_publication.py` produces deterministic RSS 2, Atom, JSON Feed 1.1 and OPML 2 without fetching, writing files or reading the clock. The caller passes the real digest timestamp and chooses public hosting paths:

```python
from feed_publication import publish_feeds

feeds = publish_feeds(
    snapshot,
    source_catalog,
    title="News",
    description="Current headlines from the selected publishers.",
    home_url="https://reader.example/#news",
    feed_urls={
        "rss": "https://reader.example/news.xml",
        "atom": "https://reader.example/news.atom",
        "json": "https://reader.example/news.json",
    },
)
# Publish feeds["rss"], feeds["atom"], feeds["json"], feeds["opml"].
# Retain feeds["report"] alongside the build receipt.
```

The example invokes this package's `publish_feeds` function; the example domain is a placeholder. `source_catalog` can be a source list or a dictionary containing `sources`. Each source supplies `id`, `name`, and its public `url`; managed subscriptions also supply `feed`, `managed: true`, and their default-enabled policy.

RSS and JSON include date-only legacy records. RSS uses Dublin Core `date` for the known day and omits `pubDate` when no publication instant is known. Exact RSS publication instants are retained in `dcterms:issued` alongside the standard seconds-precision `pubDate`; modification instants use `dcterms:modified`. JSON's optional `date_published` and `date_modified` are emitted only when those source instants exist. Its documented `_feed_core` extension retains the original day, source identity, and bounded media references. The collector understands these extensions, allowing exact round trips without invented dates.

Atom requires an `updated` timestamp on each entry. Items lacking any genuine timezone-aware source timestamp are therefore **omitted from Atom**, retained in RSS/JSON, and counted in `report.atomOmittedWithoutTimestamp`. A genuine modification instant can satisfy Atom's `updated` requirement without adding `published`. The aggregate feed's update time describes the supplied snapshot; it is never copied onto articles. This difference is deliberate and must remain visible in consumer publication receipts.

OPML lists only managed, default-enabled feed endpoints; publisher reference pages are not exported as subscriptions. URLs must be public HTTPS without credentials. Text is escaped by the serializers, output is bounded to 600 articles and 4 MiB per document, and duplicate or inconsistent identities/dates cause rejection. These are metadata feeds linking to publishers, not full-article republication.

Format references: [RSS 2.0](https://www.rssboard.org/rss-specification), [Atom RFC 4287](https://www.rfc-editor.org/rfc/rfc4287.html), [JSON Feed 1.1](https://www.jsonfeed.org/version/1.1/), [OPML 2.0](https://2005.opml.org/spec2.html), and [Dublin Core terms](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/).

## Tests

```sh
python3 -m unittest discover -s cores/feed-core/python -p 'test_*.py'
```

Python's standard `unittest` runner exercises conditional reuse, no-op freshness, outage retention, throttling, malformed/empty feeds, quarantine recovery, bounded discovery, supported feed formats, future dates and poisoned cache state. The fixtures make no network requests. Live source availability is separate product acceptance evidence.
