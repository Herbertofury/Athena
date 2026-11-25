# Frontier engineering intelligence — November 24, 2026

This is the next dated expansion of Athena's existing engineering library, not a new competing database. 64 additional source records are indexed in the complete source register: 44 reviewed upstream documentation observations and 20 release/method observations. Some are new projects; some refresh or deepen existing candidates. In Athena's native Research workspace, open **Frontier source observations** to search these 64 records or filter by batch, with their exact upstream links, reviewed dates and caveats. The ledger works offline; following a source link requires network access. It does not change the October Explorer snapshot's 283 candidates or the comparison shortlist. No new candidate is accepted on documentation alone.

## Research map

| Research batch | Source observations | Primary focus |
| --- | ---: | --- |
| [Web acquisition and downloading](2026-11-24-frontier-web.md) | 12 | Firecrawl Local/CLI, Rust Spider, Crawlee, Crawl4AI, Ghost Downloader, browser and extraction architecture |
| [Native desktop and graphics](2026-11-24-frontier-desktop.md) | 11 | Zed/GPUI, Iced, Dioxus, Xilem, Parley, Vello, Wry, Servo, winit, Vulkan memory |
| [Retrieval and data architecture](2026-11-24-frontier-retrieval.md) | 11 | RAG-Anything, Docling, MinerU, USearch, search, Rust inference, columnar and storage abstractions |
| [Native performance and game systems](2026-11-24-frontier-performance.md) | 10 | Minecraft logic, rendering, SIMD, concurrent data structures, multi-pattern search and developer tooling |
| [Current release and compiler signals](2026-11-24-frontier-releases.md) | 20 | Rust 1.100, nightly parallel frontend, Node 26/27 alpha, native TypeScript, Sodium/VulkanMod, exact GitHub tags |

The [complete source index](../data/source-index.json) lists the five new frontier fragments. Every row has a primary URL, checked date, source identity or observed release, review interval and evidence level. Review release observations within seven days and always before relevant adoption; source documentation entries have a 14-day review interval. Verify package-channel freshness independently. Use the [existing experiment queue](../docs/research-test-queue.md) and [existing research method](../docs/research-method.md) when promoting a comparison; do not establish an independent backlog.

## Highest-value implementation order (editorial priorities, not benchmark rankings)

| Priority | Target workload | Compare and build next | No-loss acceptance |
| --- | --- | --- | --- |
| P1 | Every Rust repository / Athena build loop | Stable Rust 1.100 vs actual pin, then nightly frontend, cache collision improvements, native unused-dependency diagnostics; evaluate sampled PGO on shipped hot paths | Complete builds/tests and diagnostics, cold/incremental times, max RSS, reproducibility and runtime |
| P1 | Enderloom / Modhunter / GameSync shared transfers | Current exact internal code vs Ghost CLI/RPC, aria2 and native transfer path; reusable provider identity, cancellation/resume and atomic staging contracts | Hash/size and file identity, retry/recovery, portable data, total wall time, peak RSS, write/network bytes |
| P1 | Shared acquisition / Noxviola | Direct documented APIs and HTTP as controls; compare Rust Spider, Firecrawl Local, Crawl4AI and isolated rendering; incremental refresh rather than recrawl | Complete source/media records, authorized access, request budgets, latency tails, cold start |
| P1 | Athena knowledge and wiki | Incremental source-linked ingestion, lexical/hybrid retrieval, RAG-Anything and parsers, local GPU model candidates; evaluate USearch/Meilisearch versus existing retrieval | Gold-query source citation correctness, recall, stale/deleted-source behavior, memory, p99 and index costs |
| P1 | Large mod-library and CAS interfaces | Actual current UI baseline vs native rendering, virtualization, keyed updates and batch indexing; study Zed/GPUI, Iced, Xilem/Parley/Vello selectively | Real task parity, thumbnails and full collection results, input-to-paint tails, startup, idle CPU, data migration |
| P1 | Minecraft/AoA/Vulkan hybrid | Review Sodium/Lithium and VulkanMod exact game/loader target, compare eligible techniques, improve local native renderer where rights permit | Actual client/server worlds, frames/tick p99, saves, visual and mod compatibility |
| P2 | Cross-project organization | Compare common algorithms, use clone evidence and existing capability registry, extract only proven compatible shared components | Actual multi-host integration, feature preservation, no duplicate tracking or online dependency |
| P2 | JS/TS/Electron developer loop | Native TypeScript compiler, current supported Node/Electron, existing Vite/Oxc/Rolldown, and alpha only as isolated challenger | Diagnostics/declaration and full app parity, native addons, cache migration, startup and full build latency |

## Quality-first selection principle

Do not equate cheapest, safest-by-familiarity, oldest supported version, highest stars, or largest advertised benchmark with best. Start with the strongest technically credible candidates, including recent releases, nightly/preview, research systems, optimized native algorithms and hardware acceleration where they plausibly improve the actual experience. Compare premium candidates too when capabilities and performance warrant them; document any hardware, licensing, maintenance or service constraints. No authorization for purchases, paid API use or access-control changes is implied. Keep the strongest verified compatible result and repair newer candidates before falling back under the [shared fix-forward standard](../../guidance/WEB_ACQUISITION_FRONTIER.md). Quality and protected functionality remain fixed; speed is not achieved by doing less.

## Evidence limits and continuation

The four documentation batches contain source reviews, original synthesis and concrete evaluation designs; the fifth records dated versions and upstream-reported results. No local candidate benchmark, tool installation, dependency upgrade, shared library extraction, or application/runtime acceptance was performed. The two initial incorrect repository names for Sodium and VulkanMod were corrected using their official release repositories in the fifth batch. Other documentation requests for Khronos Vulkan Samples and Lance did not yield readable source in this pass and were excluded. Prior sources, measurements and historical release evidence are preserved.
