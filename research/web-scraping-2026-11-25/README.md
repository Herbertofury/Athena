# Web scraping review and implementation evidence

Reviewed November 25, 2026. This record extends Athena’s existing acquisition research and keeps upstream capabilities separate from verified local behavior.

## Source coverage

Direct X access returned HTTP 403. Initial indexed attributed copies agreed on all ten names. During final review, the live teapawt mirror displayed the complete attributed post, and its individual status page matched the exact requested status ID2125396894784561159 and all ten GitHub links: https://teapawt.org/Lucy_love_AI/status/2125396894784561159. Technical claims were checked against primary project sources.

All 10 named upstream repositories were inspected through primary project documentation and selected implementation files. [Requested post](https://x.com/Lucy_love_AI/status/2125396894784561159).

## Repository decisions

### 1. firecrawl/firecrawl

Scrape, crawl, map and extraction platform; optional Rust Firecrawl Local executable.

**Documented capabilities:** Local scrape/crawl/map and Firecrawl v2 localhost API; Static HTTP with optional Chrome rendering; Local PDF and Office parsing; Shared native HTML cleaning code.

**Adoption decision:** Evaluate the native Local adapter for Athena/document acquisition and compatible Rust workers, retaining the host's durable queue, exact identities, complete results and provenance.

**Material limits:**

- Local jobs live in memory and expire one hour after starting
- Default local crawl limit is 100; do not mistake this for exhaustive completion
- Local skips JSON and summary formats with warnings and ignores browser actions
- Blocked local single-page requests may fall back to cloud; FIRECRAWL_CLOUD=off explicitly disables cloud handoff
- No benchmark here establishes performance in our hosts

**Primary evidence:** [Source](https://github.com/firecrawl/firecrawl) · [Source](https://github.com/firecrawl/firecrawl/blob/main/apps/local/README.md) (blob `a5374b1003efa753bc526fae3231c5a0b23801b4`)

### 2. unclecode/crawl4ai

Async Python web extraction and browser orchestration.

**Documented capabilities:** CSS, XPath and regex extraction without an LLM; Markdown with headings, links, tables and citation references; Reusable sessions and browser pooling; Cached responses and memory-adaptive arun_many dispatcher; BFS, DFS, best-first traversal and resume state; Media, srcset, iframe and metadata extraction.

**Adoption decision:** Candidate Athena extraction worker using deterministic schemas, pooled browser resources and complete recorded responses. Preserve original HTML alongside parsed results.

**Material limits:**

- AdaptiveCrawler may stop when it judges a query answered; this is unsuitable as the completion condition for exhaustive catalogs
- Hosted cloud and local library have different setup and cost models
- Current source describes v0.9.6 dated 2026-11-20; do not assume older APIs
- Do not adopt source performance claims as measured host results

**Primary evidence:** [Source](https://github.com/unclecode/crawl4ai) · [Source](https://github.com/unclecode/crawl4ai)

### 3. browser-use/browser-use

Agent-driven interactive browser workflows.

**Documented capabilities:** Current 1.0.8 architecture runs Python against raw CDP in a persistent REPL using Pydantic AI; Supports explicit local browser selection; Agent output can be used to discover repeatable extraction steps.

**Adoption decision:** Optional final escalation for extraction requiring actual interactions. Turn repeatable routes into deterministic adapters once understood.

**Material limits:**

- Current browser and model defaults are cloud-backed
- Version pinning is needed because the 1.x interface differs materially from older examples
- Agent planning is not the default low-latency path for metadata, RSS or simple HTTP catalogs
- No feedback or telemetry message was sent during this review

**Primary evidence:** [Source](https://github.com/browser-use/browser-use)

### 4. apify/crawlee

TypeScript crawler orchestration across HTTP and browser transports.

**Documented capabilities:** Persistent request queues; Configurable retries, session lifecycle and storage; AutoscaledPool considers CPU, memory and event-loop pressure; Experimental AdaptivePlaywrightCrawler can switch to HTTP-only extraction.

**Adoption decision:** Reuse queue/transport/parser separation and resource-aware scheduling in compatible Node/TypeScript workers. Keep all discovered work queued while controlling simultaneous work.

**Material limits:**

- AdaptivePlaywrightCrawler is explicitly experimental and constrains its handler interface
- Concurrency limits must not become catalog/result limits
- Old guessed source path packages/core/src/autoscaling/autoscaled_pool.ts returned 404; authoritative API documentation was used instead

**Primary evidence:** [Source](https://github.com/apify/crawlee) · [Source](https://crawlee.dev/js/api/core/class/AutoscaledPool) · [Source](https://crawlee.dev/js/api/playwright-crawler/class/AdaptivePlaywrightCrawler)

### 5. scrapy/scrapy

Python request scheduling, middleware, extraction and resumable crawls.

**Documented capabilities:** JOBDIR persists queued/seen requests and spider state; Per-slot AutoThrottle derives target delay from observed latency and target concurrency; Throttle decreases are smoothed and increases are immediate; Fast non-200 responses cannot reduce throttle delay.

**Adoption decision:** Transfer per-origin fairness, retry classification, durable request state and error-aware delay behavior to host acquisition layers without introducing an unnecessary replacement framework.

**Material limits:**

- A JOBDIR is owned by one run and must not be shared between spiders/jobs
- Documented resume uses clean shutdown
- JavaScript rendering remains a separate transport concern

**Primary evidence:** [Source](https://docs.scrapy.org/en/latest/topics/autothrottle.html) · [Source](https://docs.scrapy.org/en/latest/topics/jobs.html) · [Source](https://github.com/scrapy/scrapy/blob/master/scrapy/extensions/throttle.py) (blob `44876ebcc1742bd50d8f7ccf3e4fc482b698b9f7`)

### 6. microsoft/markitdown

Document-to-Markdown conversion after acquisition.

**Documented capabilities:** HTML, PDF, Office, text formats and other converters; Optional per-format dependency groups and plugins; Injected requests_session support; convert_stream accepts already fetched content.

**Adoption decision:** Use Athena's validated fetch path once, preserve original bytes and metadata, then dispatch conversion by content type. Supply seekable spooled streams for large inputs.

**Material limits:**

- convert_response collects the body in BytesIO
- convert_stream buffers an entire nonseekable stream
- Markdown is not a high-fidelity source-artifact replacement
- Image captioning and speech transcription can depend on hosted services
- It is not crawl orchestration

**Primary evidence:** [Source](https://github.com/microsoft/markitdown) · [Source](https://github.com/microsoft/markitdown) · [Source](https://github.com/microsoft/markitdown/blob/main/packages/markitdown/src/markitdown/_markitdown.py) (blob `53ba8b1afd0225f40a12038a73512f3a8b52d56d`)

### 7. D4Vinci/Scrapling

HTTP/browser sessions, parser and crawling framework.

**Documented capabilities:** Async fetchers and persistent sessions; CSS/XPath and similarity-based element relocation; Streaming spider output and pause/resume; Per-domain throttling with Retry-After; Recorded-response development replay; Existing-response parser integration with Scrapy.

**Adoption decision:** Candidate parsing/adapter layer for changing markup, with fixture replay and validation of recovered fields. Reuse already fetched responses.

**Material limits:**

- A similarity match is not proof of field identity or correctness
- Preserve required fields, pagination and type checks before accepting selector recovery
- Upstream universal access/bypass marketing was not verified and is not an acceptance claim

**Primary evidence:** [Source](https://github.com/D4Vinci/Scrapling)

### 8. Genymobile/scrcpy

Android screen mirroring and input control.

**Documented capabilities:** USB/TCP-IP device screen/control; Audio forwarding and recording; Virtual display and physical input simulation.

**Adoption decision:** Keep separate for an explicitly requested Android-only extraction workflow. Do not add it to ordinary web acquisition dependencies.

**Material limits:**

- Not a web crawler, HTML parser or structured extraction engine
- Requires an Android device and applicable device permissions

**Primary evidence:** [Source](https://github.com/Genymobile/scrcpy)

### 9. alirezamika/autoscraper

Example-driven learned DOM extraction rules.

**Documented capabilities:** Build reusable rules from requested sample values; Supply existing HTML instead of fetching; Save/load learned rules as JSON; Exact/similar result modes.

**Adoption decision:** Use as adapter-authoring assistance with pre-fetched HTML and multiple recorded page variants. Keep the host's network/cancellation/error policies.

**Material limits:**

- Source _fetch_html uses direct requests.get with no default timeout/status check
- request_args.pop('headers') mutates the caller's dictionary
- Learned rules rely on class/style attributes and structural/positional traversal
- No-maintenance claims are not justified

**Primary evidence:** [Source](https://github.com/alirezamika/autoscraper) · [Source](https://github.com/alirezamika/autoscraper/blob/master/autoscraper/auto_scraper.py) (blob `73f90a662473cb75566d534743f3e3550b11b8f6`)

### 10. lwthiker/curl-impersonate

Browser-compatible TLS/HTTP handshakes through modified curl/libcurl.

**Documented capabilities:** Browser TLS extension and cipher configuration; HTTP/2 handshake configuration; CLI and libcurl integration.

**Adoption decision:** Keep transport compatibility optional behind the host acquisition contract. Compare maintained descendants such as lexiforest/curl_cffi before selecting a package.

**Material limits:**

- Inspected original profile table includes Chrome 116/Firefox 117 and older profiles
- Does not execute application JavaScript
- Handshake emulation is not every browser behavior and does not guarantee access

**Primary evidence:** [Source](https://github.com/lwthiker/curl-impersonate) · [Source](https://github.com/lexiforest/curl_cffi)

## Existing stack and intended routing

Keep the already evaluated provider APIs, RSS, Playwright, native reqwest/curl, Ghost Downloader, aria2, rclone and change-monitoring paths. The new upstream set adds targeted alternatives; no library is a universal replacement for those specialized routes. Athena remains the shared research and evidence home. Each application retains its own configuration, data, request policy and portable operation.

Recommended transport order for compatible authorized sources: provider API/feed, ordinary pooled HTTP, a separately selected compatible HTTP adapter, isolated pooled headless rendering, then interactive agent work when the task actually needs interaction. Preserve the raw response and provenance; validate structured results before replacing last-good data.

Shared request identity must include response-affecting headers and request policy. A caller with independent cancellation must keep its own cancellation semantics. Each fetch consumer needs a separately readable body. A retired request must never remove or overwrite a newer owner’s state. All discovered work remains available while concurrency limits schedule simultaneous work.

Document conversion should consume bytes already fetched. MarkItDown can use a seekable spool; AutoScraper and Scrapling can accept existing HTML. This avoids fetching one page again for every parser. Browser/model/cloud adapters remain explicit choices rather than hidden default dependencies.

## Athena implementation and measured evidence

- The actual upstream collector now validates the entire catalog before I/O and uses four configurable workers. There is no application cap on watched repository count. Output ordering is deterministic.
- Discovery follows all available GitHub Search pages. Provider truncation, repeated results, malformed pages and failed later pages remain explicit partial outcomes with counts; prior pages survive a later failure. GitHub’s 1,000-result search window is a provider boundary, not successful exhaustive completion.
- [Collector tests](../../guidance/tests/test_web_acquisition_watch.py) cover concurrent completion ordering, invalid input before I/O, failures, more than 40 repositories, multi-page results and incomplete coverage.
- [Reproducible real loopback HTTP benchmark](benchmark_collector.py) and [raw results](collector-benchmark.json): 32 releases plus three discovery calls, five interleaved repetitions, identical complete outputs, 35 requests and 5,803 body bytes in both variants. Median 560.96 ms before and 148.30 ms after (3.78×). This is a controlled local collector measurement, not live-GitHub or whole-app performance.

## Replay and operation

```bash
python3 -m unittest discover -s guidance/tests -p test_web_acquisition_watch.py -v
python3 research/web-scraping-2026-11-25/benchmark_collector.py --output /tmp/athena-collector-benchmark.json
python3 guidance/tools/web_acquisition_watch.py --workers 4 --output /tmp/athena-upstream-report.json
```

Output paths must be new. Live collection uses the existing authenticated GitHub CLI route. `--workers 1` retains a serial mode for restricted providers or non-thread-safe injected transports. The report is evidence of observed metadata, not package installation, extraction completeness on unrelated sites, or a production performance ranking.

## Current integration boundary

Companion implementation evidence and publication identities are recorded in `implementation-receipt.json` in this directory. Native Windows/Opera/MO2 workflows require their own acceptance. Source changes and portable runtime tests do not claim those native releases have shipped.

## Primary source register

Registered source IDs: SCRP25001, SCRP25002, SCRP25003, SCRP25004, SCRP25005, SCRP25006, SCRP25007, SCRP25008, SCRP25009, SCRP25010, SCRP25011, SCRP25012. The [structured source analysis](source-analysis.json) retains all ten dispositions and code-level evidence. [Release observations](release-observations.json) distinguish repository release tags from independent package channels.

## Published source and preserved research

| Consumer | Review branch | Verified scope |
|---|---|---|
| Gamesync | [PR7](https://github.com/Herbertofury/Gamesync/pull/7) | 16 request-identity/response/ownership tests; overlap requests 30→20 with every delivered item preserved |
| GameSync-Next | [PR56](https://github.com/Herbertofury/GameSync-Next/pull/56) | 23 tests and strict TypeScript; identical request/body benchmark contract |
| Enderloom | [PR97](https://github.com/Herbertofury/Enderloom/pull/97) | 14 new lifecycle cases, existing provider/media suites and hosted platform checks; complete response hashes preserved |
| Modhunter | [PR75](https://github.com/Herbertofury/Modhunter/pull/75) | 242 core tests, strict Clippy and four live provider/cache reads; public Rust API preserved |

Athena now exposes 392 research candidates and 69 comparison plans in its actual Research Explorer and generated runtime. The additive reconciliation preserves all 283 current candidates, 105 missing prior candidates, all prior source observations and layer memberships, and adds four candidates to cover all ten reviewed repositories exactly once. Forty-one divergent prior reviews remain dated history. The source register contains 2,796 observations across 45 files. Current Engine Foundry and application policies remain intact. See [the preservation receipt](athena-research-reconciliation.json).

The public-preview runtime package passed 13 workspace contracts against its actual assembled files, plus 14 packaging guardrail tests and exact file/hash/ZIP verification. The complete profile still correctly stops on the pre-existing missing Foundry index bundle. See [package evidence](athena-runtime-package-verification.json).

The private Gamesync and GameSync-Next hosted jobs did not reach checkout: GitHub explicitly reports a payment/spending-limit account gate. This is not a failing test assertion. Enderloom changed-path lifecycle checks passed on Windows, macOS and Linux. [Exact runs and observations](hosted-ci-review.json). Source branches are not merged or installed releases.
