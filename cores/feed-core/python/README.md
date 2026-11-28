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

`refresh` without a state path retains the original one-shot API for smaller consumers. This mode does not provide durable adaptive scheduling. `fetch` returns the legacy body/final-URL pair; `fetch_response` also returns HTTP status and cache validators.

## Behavior

- Parse RSS 2, Atom, RSS 1/RDF and JSON Feed 1/1.1. Keep only safe URLs, bounded plain-text titles, publisher dates and permitted media references. A missing article date is never replaced with the current time.
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

## Tests

```sh
python3 -m unittest discover -s cores/feed-core/python -p 'test_*.py'
```

Python's standard `unittest` runner exercises conditional reuse, no-op freshness, outage retention, throttling, malformed/empty feeds, quarantine recovery, bounded discovery, supported feed formats, future dates and poisoned cache state. The fixtures make no network requests. Live source availability is separate product acceptance evidence.
