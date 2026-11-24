# Web acquisition frontier: initial evidence and benchmark queue

Reviewed November 24, 2026. Sources: upstream documentation and official GitHub releases/latest metadata. The tags are repository-level observations, not guaranteed latest package or hosted service versions. No binaries installed or benchmarks executed.

| Candidate | Observed latest GitHub release | First comparison |
| --- | --- | --- |
| [XiaoYouChR/Ghost-Downloader-3](https://github.com/XiaoYouChR/Ghost-Downloader-3) | [v4.5.11](https://github.com/XiaoYouChR/Ghost-Downloader-3/releases/tag/v4.5.11) (2026-11-20) | Adaptive chunking, resume, ghd CLI, aria2-compatible RPC; GPLv3 source. Verify desktop/service prerequisites and portability. |
| [firecrawl/firecrawl](https://github.com/firecrawl/firecrawl) | [v2.11.0](https://github.com/firecrawl/firecrawl/releases/tag/v2.11.0) (2026-06-19) | Firecrawl Local Rust CLI, local document extraction and localhost v2 API. Repository/server, local crate, SDK and hosted service have different version channels. Review component licenses. |
| [unclecode/crawl4ai](https://github.com/unclecode/crawl4ai) | [v0.9.6](https://github.com/unclecode/crawl4ai/releases/tag/v0.9.6) (2026-11-20) | Self-hosted extraction/crawling; compare completeness, resources and local operation. |
| [apify/crawlee](https://github.com/apify/crawlee) | [v3.18.2](https://github.com/apify/crawlee/releases/tag/v3.18.2) (2026-09-29) | JS/TS crawling; queues, persistence, HTTP and browser routing. |
| [scrapy/scrapy](https://github.com/scrapy/scrapy) | [2.20.0](https://github.com/scrapy/scrapy/releases/tag/2.20.0) (2026-11-06) | Python crawling baseline. |
| [microsoft/playwright](https://github.com/microsoft/playwright) | [v1.65.1](https://github.com/microsoft/playwright/releases/tag/v1.65.1) (2026-11-13) | Isolated browser automation; validate compatible browser binaries. |
| [seanmonstar/reqwest](https://github.com/seanmonstar/reqwest) | [v0.13.5](https://github.com/seanmonstar/reqwest/releases/tag/v0.13.5) (2026-09-08) | Native Rust HTTP client. |
| [curl/curl](https://github.com/curl/curl) | [curl-8_23_0](https://github.com/curl/curl/releases/tag/curl-8_23_0) (2026-10-14) | Transfer CLI/library, platform protocol coverage. |
| [aria2/aria2](https://github.com/aria2/aria2) | [release-1.37.0](https://github.com/aria2/aria2/releases/tag/release-1.37.0) (2023-11-15) | Multi-protocol CLI/RPC baseline. Older release does not establish abandonment. |
| [rclone/rclone](https://github.com/rclone/rclone) | [v1.76.0](https://github.com/rclone/rclone/releases/tag/v1.76.0) (2026-11-06) | Authorized storage transfers; compare streaming, checksums and sync semantics. |
| [dgtlmoon/changedetection.io](https://github.com/dgtlmoon/changedetection.io) | [0.70.4](https://github.com/dgtlmoon/changedetection.io/releases/tag/0.70.4) (2026-11-19) | Change monitoring, semantic diff and refresh. |
| [renovatebot/renovate](https://github.com/renovatebot/renovate) | [44.261.1](https://github.com/renovatebot/renovate/releases/tag/44.261.1) (2026-11-24) | Dependency discovery and reviewed upgrade grouping. |

## Starting baselines

- [Ghost Downloader 3 documentation](https://github.com/XiaoYouChR/Ghost-Downloader-3/blob/main/README.md) documents `ghd probe/add/tasks/pause/start/wait`, adaptive chunking, resume and aria2-compatible RPC. Verify the installed backend requirements and [GPLv3 license](https://github.com/XiaoYouChR/Ghost-Downloader-3/blob/main/LICENSE) before integration. Compare its CLI/RPC with aria2 and native streaming transfers.
- [Firecrawl Local documentation](https://github.com/firecrawl/firecrawl/blob/main/apps/local/README.md) documents a Rust local binary, scrape/crawl/map commands, localhost v2 API, local document parsing and headless rendering. Local and cloud features differ. Use `FIRECRAWL_CLOUD=off` for an authorized local-only comparison. Track the local crate, server, SDK and cloud channels independently. Review applicable licensing.

## Prioritized experiments

1. Native HTTP versus Python/Node HTTP for official API metadata, conditional refresh and complete downloads.
2. Firecrawl Local versus Crawl4AI versus direct HTML extraction; compare complete output and rendering costs.
3. Ghost Downloader 3 versus aria2 versus native transfer; compare hash-verified completion, interrupted download recovery, disk writes, cancellation and project-local state.
4. Scrapy/Crawlee versus native scheduling; compare incremental updates, deduplication, bounded concurrency and change detection.
5. Playwright isolated browser workflow for authorized JavaScript-dependent sources; verify browser/driver compatibility.
6. Reuse verified provider adapter contracts across relevant repositories. Record exact versions, rights, supported targets and measured results before promoting recommendations.

The [shared standard](../../guidance/WEB_ACQUISITION_FRONTIER.md) and [candidate catalog](../../guidance/registry/web-acquisition-watch.json) govern follow-through. Current results are discovery signals, not performance rankings.
