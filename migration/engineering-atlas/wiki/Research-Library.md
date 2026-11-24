[← Atlas home](https://github.com/Herbertofury/Engineering-Atlas/wiki/Home) · [Canonical source](https://github.com/Herbertofury/Engineering-Atlas/blob/main/docs/sources.md)

# Primary-source register

Updated through October 27, 2026. Entries retain their individual observed-version and review context; this is not a claim that every source was freshly rechecked today. These sources document behavior; they do not establish local performance wins.

## E01

[Electron performance](https://www.electronjs.org/docs/latest/tutorial/performance) · Current documentation

Main/renderer blocking and process-work guidance. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## E02

[Electron utilityProcess](https://www.electronjs.org/docs/latest/api/utility-process) · Current documentation

Node utility process and message ports. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## E03

[Electron 45 release](https://www.electronjs.org/blog/electron-45-0) · 45.0.0; published 2026-10-21

Release-specific startup and tracing changes. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## E04

[Electron breaking changes](https://www.electronjs.org/docs/latest/breaking-changes) · 45.0 section

Version-specific API migration. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## N01

[Node worker threads](https://nodejs.org/api/worker_threads.html) · Observed v26.12.1 documentation; separate from local v24 runtime

CPU workers, async IO and versioned profiling APIs. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## R01

[Rust DirEntry](https://doc.rust-lang.org/std/fs/struct.DirEntry.html) · Stable standard-library API

Windows metadata/type syscall behavior. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## R02

[Tokio filesystem](https://docs.rs/tokio/latest/tokio/fs/index.html) · Observed Tokio 1.53.1 documentation

Blocking implementation and batching guidance. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## R03

[Tokio spawn_blocking](https://docs.rs/tokio/latest/tokio/task/fn.spawn_blocking.html) · Observed Tokio 1.53.1 documentation

Blocking-pool bounds and scheduling. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## T01

[Tauri process model](https://v2.tauri.app/concept/process-model/) · Tauri v2 documentation

Core/webview process boundaries. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## W01

[Windows App SDK](https://learn.microsoft.com/en-us/windows/apps/windows-app-sdk/) · Current platform overview

Windows-native platform candidate. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## M01

[Fabric development setup](https://docs.fabricmc.net/develop/getting-started/setting-up) · Page selector 26.2; setup text references 26.1/JDK 25

Version-selector mismatch must be resolved for each target. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## M02

[NeoForge getting started](https://docs.neoforged.net/docs/gettingstarted/) · 26.1 documentation; JDK 25

Modern target setup, not older Forge compatibility. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## M03

[Forge 1.20.1 getting started](https://docs.minecraftforge.net/en/1.20.1/gettingstarted/) · Pinned 1.20.1 documentation

Historical compatibility lane. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## A01

[Khronos glTF registry](https://registry.khronos.org/glTF/) · glTF 2.0 registry

Asset-format specification entry point. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## A02

[Godot general optimization](https://docs.godotengine.org/en/stable/tutorials/performance/general_optimization.html) · Stable documentation

Separate load time, stalls and continuous throughput. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## SEC01

[OWASP ASVS](https://asvs.owasp.org/) · 5.0.0; published 2025-05-30

Versioned security requirements. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## G01

[GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages) · Current documentation

Static hosting boundary. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## G02

[GitHub Actions execution governance](https://docs.github.com/en/actions/how-tos/administer/control-workflow-execution) · Current documentation

Immutable action dependencies and policy. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## S01

[Steam authentication](https://partner.steamgames.com/doc/features/auth) · Current Steamworks documentation

OpenID identity and capability boundaries. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## ALG01

[Aho-Corasick match semantics](https://docs.rs/aho-corasick/latest/aho_corasick/enum.MatchKind.html) · Observed 1.1.5

Matching modes and overlapping behavior. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## ALG02

[Globset](https://docs.rs/globset/latest/globset/) · Current crate documentation

Compiled multi-glob matching and separator semantics. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## DB01

[SQLite query planner](https://sqlite.org/queryplanner.html) · Current official documentation

Indexes and query plans. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## DB02

[SQLite WAL](https://sqlite.org/wal.html) · Official page updated 2026-08-25

Concurrency, durability and fixed WAL-reset race. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## IO01

[Windows IO completion ports](https://learn.microsoft.com/en-us/windows/win32/fileio/i-o-completion-ports) · Current Win32 documentation

Completion queues and runnable-thread concurrency. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## R04

[Rayon ThreadPoolBuilder](https://docs.rs/rayon/latest/rayon/struct.ThreadPoolBuilder.html) · Observed Rayon 1.12.0

Explicit pool configuration and lifecycle. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## OBS01

[Perfetto Trace Processor](https://perfetto.dev/docs/analysis/trace-processor) · Current documentation

Programmatic trace analysis. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.



## ARCH01

[Rust zip archive reader](https://docs.rs/zip/latest/zip/read/struct.ZipArchive.html) · 9.1.2

Metadata reuse safety, extraction boundaries and reader APIs. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## ARCH02

[libzip reference and thread safety](https://libzip.org/documentation/libzip/) · 1.12.1

Independent archive objects, synchronization and member-name semantics. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## WATCH01

[Windows ReadDirectoryChangesW](https://learn.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-readdirectorychangesw) · Current Win32 documentation

Overflow detection, reconciliation and network buffer limits. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.


## JSON01

[orjson official repository](https://github.com/ijl/orjson) · 3.13.0 installed from PyPI

API constraints, performance claims and official Codeberg alternative. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## JSON02

[UltraJSON project status](https://github.com/ultrajson/ultrajson) · 6.0.0 installed from PyPI

Maintenance-only policy and migration recommendation. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## JSON03

[Python 3.12 JSON documentation](https://docs.python.org/3.12/library/json.html) · 3.12 docs; local interpreter 3.12.14

Decode hooks, default extensions and resource caution. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## JSON04

[simdjson official repository](https://github.com/simdjson/simdjson) · 5.0.5; released 2026-10-14

SIMD parsing candidate and benchmark methodology. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## JSON05

[yyjson official repository](https://github.com/ibireme/yyjson) · 0.13.0; released 2026-09-08

DOM benchmark scope and limitations. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## JSON06

[Sonic official repository](https://github.com/bytedance/sonic) · 1.15.4; released 2026-09-11

Configuration, first-hit compilation and memory caveats. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## PAPER01

[Wasure](https://arxiv.org/html/2602.05488v1) · v1; submitted 2026-02-05

Multidimensional Wasm benchmarking; not reproduced locally. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## PAPER02

[WarpL performance debugging paper](https://arxiv.org/html/2604.13693v1) · v1; ICSE 2026

Mutation-based diagnosis and bounded case evaluation; not reproduced locally. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## PAPER03

[Heavy-light incremental join maintenance](https://arxiv.org/html/2605.08397v1) · v1; submitted 2026-05-08

Theoretical join maintenance; no local performance reproduction. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## TOOL01

[Zig canonical Codeberg migration](https://ziglang.org/news/migrating-from-github-to-codeberg/) · Announcement 2025-11-26

Official canonical repository location. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## TOOL02

[Zig 0.17.0 release notes](https://ziglang.org/download/0.17.0/release-notes.html) · 0.17.0; released 2026-10-01

Build dependency tracking, incremental compilation and compatibility constraints. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.


## SIM01

[Bevy 0.20 release](https://bevy.org/news/bevy-0-20/) · 0.20.0; released 2026-10-08

Change summaries, schedule testing and rendering quality tradeoffs. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## SIM02

[Jolt Physics architecture](https://github.com/jrouwe/JoltPhysics/blob/master/Docs/Architecture.md) · 5.6.0 latest release observed; current master documentation

Determinism conditions and broad-phase query caveats. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## SIM03

[NVIDIA broad-phase collision detection chapter](https://developer.nvidia.com/gpugems/gpugems3/part-v-physics-simulation/chapter-32-broad-phase-collision-detection-cuda) · GPU Gems 3; historical algorithm background

Spatial subdivision and workload-dependent behavior. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.


## PAPER04

[RepoMod-Bench](https://arxiv.org/html/2602.22518v1) · v1; submitted 2026-02-26

Implementation-agnostic modernization tests; not reproduced locally. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## PAPER05

[Last Secure Code Benchmark](https://arxiv.org/html/2610.14766v1) · v1; submitted 2026-10-10

Separate functional/security evaluation; author results not reproduced. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## REVIEW01

[GitHub ReviewBench announcement](https://github.blog/ai-and-ml/github-copilot/reviewbench-an-open-benchmark-for-ai-code-review/) · Published 2026-10-05

Severity, precision/recall and judge-version caveats. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## SEC02

[SLSA 1.2 artifact verification](https://slsa.dev/spec/v1.2/verifying-artifacts) · Approved v1.2 specification

Trusted builder, signature, digest and expected parameters. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.


## N02

[Node 24 worker transfer semantics](https://nodejs.org/docs/latest-v24.x/api/worker_threads.html) · 24.22.1, matching local runtime

ArrayBuffer ownership, structured cloning and shared-memory distinction. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.


## DB03

[SQLite EXPLAIN QUERY PLAN](https://sqlite.org/eqp.html) · Current official documentation; local SQLite 3.53.1

Diagnostic plan interpretation and unstable text format. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## DB04

[SQLite ANALYZE guidance](https://sqlite.org/lang_analyze.html) · Current official documentation

Planner statistics, optimize guidance and potential regressions. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## CODE01

[orjson Codeberg repository](https://codeberg.org/ijl/orjson) · Head bd00937c5c46ab20eb5d7fe1cfc034b906c4578f; 3.13.0

Direct browser repository/README inspection; head matches GitHub observation. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## CODE02

[Zig canonical Codeberg repository](https://codeberg.org/ziglang/zig) · Master cb6f0c25f176dbebf0c6801170c360c2c1198524 observed 2026-10-26

Direct browser metadata/README inspection; no build or full source audit. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## R05

[Rust official installation](https://rust-lang.org/tools/install/) · Official installation; local compiler 1.99.1

Official Rust distribution and isolated toolchain setup. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## DB05

[rusqlite API](https://docs.rs/rusqlite/latest/rusqlite/) · 0.41.0 observed and pinned

Transactional Rust SQLite binding; selection is provisional. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## NET01

[reqwest blocking client configuration](https://docs.rs/reqwest/latest/reqwest/blocking/struct.ClientBuilder.html) · 0.13.5 observed and pinned

Timeout, HTTPS, redirect and TLS configuration for the bounded CLI adapter. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## COL01

[Modrinth API overview](https://docs.modrinth.com/api/) · v2.7.0/366f528 documentation observed

Public versus authenticated requests, canonical identifiers, User-Agent and provider rate limits. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## COL02

[Modrinth project operation](https://docs.modrinth.com/api/operations/getproject/) · Current v2 project operation

Single-project metadata endpoint and response fields. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## NET02

[Axum routing and state](https://docs.rs/axum/latest/axum/) · 0.8.9 observed

Rust HTTP routing and bounded local API implementation. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## R06

[Tokio runtime](https://docs.rs/tokio/latest/tokio/) · 1.54.1 observed and resolved

Async runtime with blocking work separated from executor threads. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## UI01

[Long Animation Frames working draft](https://www.w3.org/TR/long-animation-frames/) · W3C First Public Working Draft, 2026-04-28

Frame timing diagnostics; draft status and browser support limits. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## UI02

[CSS content visibility](https://web.dev/articles/content-visibility?hl=en) · Published 2020-08-05; Baseline support note 2025-09-15

Containment candidate; offscreen rendering and accessibility constraints. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## DB06

[SQLite synchronization modes](https://www.sqlite.org/pragma.html#pragma_synchronous) · Current official documentation

Read back configured durability and preserve commit boundaries. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## DB07

[SQLite blob/filesystem comparison](https://www.sqlite.org/fasterthanfs.html) · Historical measurements 2017; current caveats

Workload and cache limits; not a universal performance guarantee. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## ADP01

[Patreon v2 API](https://docs.patreon.com/) · Current v2 documentation; v1 retirement notice 2026-10-07

Posts scopes, pagination and access boundaries. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## ADP02

[Afdian developer API](https://guide.afdian.com/creator/developer) · Current official creator documentation

Order/supporter API is distinct from post-media access. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## ADP03

[YouTube IFrame player](https://developers.google.com/youtube/iframe_api_reference) · Current official player documentation

Playback events, owner restrictions and client identification. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## ADP04

[Bilibili open platform](https://openhome.bilibili.com/doc) · Official landing page; detailed endpoint review pending

Authorized account/video capabilities; dynamic documentation limitation. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## ADP05

[X API overview](https://docs.x.com/x-api/introduction) · Current v2 pay-per-use overview

API access and billing are separate from browser sessions. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## ADP06

[Discord message resource](https://docs.discord.com/developers/resources/message) · Current official message schema

Permissions, attachments, embeds and expiry. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## ADP07

[Steam Web API overview](https://partner.steamgames.com/doc/webapi_overview) · Current official documentation

Public data and authorized account capabilities. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## ADP08

[SteamDB FAQ](https://steamdb.info/faq/) · Current FAQ reviewed 2026-10-26

Explicit prohibition on automated scraping/crawling. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## ADP09

[CurseForge API](https://docs.curseforge.com/rest-api/) · Current official API documentation

API keys, project/file identity and pagination. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## ADP10

[Nexus GraphQL API](https://graphql.nexusmods.com/) · Experimental v2 documentation; live public query checked

Stable v1 alternative, public versus OAuth operations and typed identities. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

Documentation rechecked 2026-10-27: v2 remains experimental; media union pagination is separate from a cover image. Prior live query evidence is retained, not represented as a new live query in this recheck.

## EXT01

[yt-dlp release](https://github.com/yt-dlp/yt-dlp/releases/tag/2026.10.21) · 2026.10.21

Maintained video extractor candidate; not locally accepted. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## EXT02

[gallery-dl release](https://github.com/mikf/gallery-dl/releases/tag/v1.32.18) · 1.32.18; released 2026-10-25

Canonical development moved to Codeberg; gallery candidate. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## EXT03

[Crawlee release](https://github.com/apify/crawlee/releases/tag/v3.18.2) · 3.18.2; released 2026-09-29

Established orchestration candidate; recovery changes. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## EXT04

[Scrapy release](https://github.com/scrapy/scrapy/releases/tag/2.19.0) · 2.19.0; released 2026-09-10

Established crawler candidate; remote-control additions not enabled. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## EXT05

[Scrapy AutoThrottle](https://docs.scrapy.org/en/latest/topics/autothrottle.html) · 2.19.0 documentation

Bounded concurrency and error-aware throttling. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## EXT06

[Crawlee crawler families](https://crawlee.dev/js/docs/quick-start) · 3.18 documentation

Static parser and browser-rendering lanes. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## EXT07

[Nexus official Node SDK](https://github.com/Nexus-Mods/node-nexus-api) · Repository inspected; no latest release object

Official SDK candidate; GPL-3.0 repository metadata. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

Rechecked 2026-10-27 at c5eda4a46cafb5dc8000ed2a7986b22132625e2e (October 7 commit): package version 1.7.3 declares LGPL-3.0, but LICENSE.md contains GPLv3. The earlier repository metadata alone is insufficient to resolve this mismatch. Keep reuse unaccepted pending clarification; no SDK was executed. [Source review](https://github.com/Herbertofury/Engineering-Atlas/blob/main/research/2026-10-27-nexus-reuse-review.md).

## EXT08

[HLS.js playback library](https://github.com/video-dev/hls.js/tree/v1.7.3) · 1.7.3; pinned npm bundle integrity verified

Maintained HLS playback candidate with original license and browser integrity check. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## E82

[Public media parser reference revision](https://github.com/Herbertofury/Enderloom/blob/fc55c422f93480d75604203b288a837bb87ed623/src/provider-media.js) · fc55c422f93480d75604203b288a837bb87ed623

Pinned public implementation, tested unchanged before an isolated allocation-reuse experiment; not installed-target acceptance. Evidence: primary documented. Review after 7 days or before a version-sensitive decision.

## E83

[RustSec zstd context-reuse advisory](https://rustsec.org/advisories/RUSTSEC-2026-0391.html) · Issued 2026-10-26; fixed >=0.14.3

Context reset prevents abandoned stream data crossing reused contexts; applicability must include transitive wrappers. Evidence: primary documented. Review after 7 days or before a version-sensitive decision.

## E84

[HLS.js security policy and published advisory listing](https://github.com/video-dev/hls.js/security) · Observed 2026-10-26

No published advisories shown at review; absence is not a security guarantee. Evidence: primary documented. Review after 7 days or before a version-sensitive decision.

## E85

[SQLite 3.54.1 release log](https://www.sqlite.org/releaselog/3_54_1.html) · 3.54.1; released 2026-10-16

Matches the storage-lab runtime version; no performance claim from release metadata. Evidence: primary documented. Review after 7 days or before a version-sensitive decision.

## UI03

[CSS Box Sizing Level 4 draft](https://www.w3.org/TR/2026/WD-css-sizing-4-20260904/) · Working Draft, 2026-09-04

Remembered intrinsic size and overflow semantics; draft, not a performance result. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## UI04

[TanStack Virtual core 3.19.8 source repair](https://github.com/TanStack/virtual/commit/23430040447e24bcfdd9665bd6b6c67d8fefd0ea) · virtual-core 3.19.8; released 2026-10-26

End-of-scroll calculation includes scrollMargin; source diff and upstream regression inspected, not locally installed or benchmarked. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## UI05

[Chrome guidance on complex layout interactions](https://github.com/GoogleChrome/modern-web-guidance-src/blob/main/guides/performance/interactions-in-complex-layouts/guide.md) · Official source reviewed 2026-10-26

Self-contained layout-region boundaries; hypothesis basis, not evidence that a particular grouping is faster. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## COL03

[Modrinth multiple-project operation](https://docs.modrinth.com/api/operations/getprojects/) · Official operation reviewed and live-tested 2026-10-27

JSON-array project identities and typed multi-project response; local budgets are separate from provider limits. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## PAPER06

[WCXB multi-type extraction benchmark](https://arxiv.org/html/2605.21097v1) · Preprint v1, 2026-05-20; reviewed 2026-10-27

Main-text extraction across seven types; not complete-media, authenticated-session or playback acceptance. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## UI06

[Measure Memory API draft](https://wicg.github.io/performance-measure-memory/) · Draft Community Group Report, 2021-05-28; reviewed 2026-10-27

Cross-origin-isolated estimated memory measurements; not peak process memory and not a W3C Standard. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## JSON07

[serde_json RawValue checked API](https://docs.rs/serde_json/latest/serde_json/value/struct.RawValue.html) · 1.0.154; reviewed 2026-10-27

Checked byte forwarding avoids building a value tree; naive validation differs from Value, reproduced locally. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## JSON08

[Serde custom Deserialize visitor](https://serde.rs/impl-deserialize.html) · Official visitor model reviewed 2026-10-27

Streaming validation through deserialize_any; not a substitute for differential tests. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## MEM01

[Linux process status memory accounting](https://man7.org/linux/man-pages/man5/proc_pid_status.5.html) · Manual reviewed 2026-10-27

VmHWM reports resident high-water usage but is explicitly documented as inaccurate; qualify measurements. Evidence: primary documented. Review after 30 days or before a version-sensitive decision.

## HTML01

[parse5 and SAX parser upstream](https://github.com/inikulin/parse5/releases/tag/v8.0.1) · parse5 8.0.1 and SAX 8.0.0 installed from official npm; reviewed 2026-10-27

Spec-focused upstream parser used as a scoped image-token reference; only local fixtures are accepted here. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## HTML02

[htmlparser2 12.0.0 release](https://github.com/fb55/htmlparser2/releases/tag/v12.0.0) · 12.0.0; released 2026-03-20; reviewed 2026-10-27

Maintained callback parser; raw-text and context fixes do not imply universal spec conformance. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## HTML03

[WHATWG HTML parsing rules](https://html.spec.whatwg.org/multipage/parsing.html) · Living Standard updated 2026-10-26; reviewed 2026-10-27

Input CR normalization precedes tokenization; NULL treatment is context dependent, including attribute replacement. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.

## OBS02

[Node performance GC diagnostics](https://nodejs.org/docs/latest-v24.x/api/perf_hooks.html) · Node 24.22.1 observed and used

Passive GC detail observations and timings; instrumentation and shared heap are not per-parser peak memory. Evidence: primary documented. Review after 14 days or before a version-sensitive decision.


## LIVE01

[LiveWeb-IE paper](https://arxiv.org/html/2603.13773v1) · v1, submitted 2026-03-14; ICLR 2026

Live-site methodology, limitations and latency tradeoffs; not locally benchmarked Evidence: primary documented. Reviewed 2026-10-27.



## LIVE02

[LiveWeb-IE official dataset and terms](https://github.com/sbY99/LiveWeb-IE) · README observed 2026-10-27

Non-commercial research restriction; no dataset downloaded or executed Evidence: primary documented. Reviewed 2026-10-27.



## WAKE01

[Rust bounded synchronous channel](https://doc.rust-lang.org/std/sync/mpsc/fn.sync_channel.html) · Rust 1.99.1

Bounded capacity and nonblocking send; local queue experiment is separate evidence Evidence: primary documented. Reviewed 2026-10-27.



## WAKE02

[Rust nonblocking channel send](https://doc.rust-lang.org/std/sync/mpsc/struct.SyncSender.html#method.try_send) · Rust 1.99.1

Bounded capacity and nonblocking send; local queue experiment is separate evidence Evidence: primary documented. Reviewed 2026-10-27.



## BROTLI01

[Brotli Python package advisory](https://github.com/advisories/GHSA-9v8h-qqgm-4m35) · Reviewed advisory updated 2026-10-23

Exact dependency scope and safe error categories; not a full-system audit Evidence: primary documented. Reviewed 2026-10-27.



## CERTIFI01

[certifi compromised intermediate root advisory](https://github.com/advisories/GHSA-6q48-6c7w-9gw2) · Reviewed advisory updated 2026-10-26

Exact dependency scope and safe error categories; not a full-system audit Evidence: primary documented. Reviewed 2026-10-27.



## NET03

[reqwest safe error inspection](https://docs.rs/reqwest/0.13.5/reqwest/struct.Error.html) · 0.13.5

Request error category inspection without emitting attached URLs Evidence: primary documented. Reviewed 2026-10-27.



## ISOL01

[SQLite isolation and read snapshots](https://www.sqlite.org/isolation.html) · Official isolation documentation; checked 2026-10-27

Multiple queries need one read transaction for one response snapshot Evidence: primary documented. Reviewed 2026-10-27.



## ISOL02

[rusqlite transaction source](https://github.com/rusqlite/rusqlite/blob/a60e76b5e86ee60442213efe79758a6c2ca8cf3d/src/transaction.rs) · 0.41.0, exact registry and release tag commit

DEFERRED transaction and runtime nested-transaction checks; JSON validation is separate Evidence: primary documented. Reviewed 2026-10-27.



## UI07

[Event Timing API working draft](https://www.w3.org/TR/2026/WD-event-timing-20261013/) · W3C Working Draft 2026-10-13

Trusted event types, observation thresholds and timing boundaries; not a complete INP score Evidence: primary documented. Reviewed 2026-10-27.



## UI08

[MDN Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) · Living documentation reviewed 2026-10-27

Dedicated worker execution and messaging; startup and clone cost must be measured rather than assumed beneficial. Evidence: primary documented. Reviewed 2026-10-27.



## UI09

[MDN structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) · Living documentation reviewed 2026-10-27

Plain records clone; DOM, functions and class metadata do not have general lossless clone semantics. Evidence: primary documented. Reviewed 2026-10-27.



## COL04

[Modrinth multiple-version operation](https://docs.modrinth.com/api/operations/getversions/) · v2 official API reviewed 2026-10-27

Version files, hashes, dependencies and compatibility fields; metadata only is not file verification or authorization to execute attachments. Evidence: primary documented. Reviewed 2026-10-27.



## SIMD01

[simd-json released source](https://github.com/simd-lite/simd-json/tree/61d649d13fae83ac6d9f587863696be2741f5b8b) · 0.18.1 published source; registry artifact verified

Default runtime SIMD detection; destructive input parsing requires counted copying for retained source bytes. Reviewed 2026-10-27.



## SIMD02

[Upstream Unicode surrogate correction](https://github.com/simd-lite/simd-json/commit/ff8f5c8bb75dfc56803321c2f5a92656c7de842f) · Fix committed 2026-10-25; not in tested 0.18.1 release

Missing low surrogate must return an error, not U+0000; isolated backport evaluated without application promotion. Reviewed 2026-10-27.



## JSON09

[serde_json precise-float feature contract](https://github.com/serde-rs/json/blob/v1.0.154/Cargo.toml) · 1.0.154 pinned

float_roundtrip and arbitrary_precision address different contracts; a reference parser can itself be less accurate. Reviewed 2026-10-27.



## MEM02

[Rust GlobalAlloc contracts and measurement limits](https://doc.rust-lang.org/std/alloc/trait.GlobalAlloc.html) · Rust 1.99.1 documentation; matches local toolchain

Forward exact allocation contracts without panics or re-entrant allocation; optimizer-visible counts are observations, not correctness assumptions or total process memory. Reviewed 2026-10-27.



## SHA01

[RustCrypto SHA-2 release source](https://github.com/RustCrypto/hashes/tree/138dc5a05b93f8e49cda177fc6cfd7cc43673e5d/sha2) · sha2 0.11.1 registry source; source revision verified

SHA-256 for input and build fingerprints, not authentication or automatic trust. Reviewed 2026-10-27.



## AUDIT01

[cargo-audit official package](https://github.com/RustSec/rustsec/blob/main/cargo-audit/Cargo.toml) · 0.22.2 installed from crates.io with locked dependencies; binary scanning disabled

Dependency advisory matching only; no claim of complete code security or malware assessment. Reviewed 2026-10-27.



## WCXB01

[WCXB multi-type extraction preprint](https://arxiv.org/abs/2605.21097) · v1, submitted 2026-05-20; reviewed 2026-10-27

Static text-extraction benchmark; category, annotation and internal-consistency limits require independent review. Reviewed 2026-10-27.



## WCXB02

[WCXB source repository and declared license](https://github.com/Murrough-Foley/web-content-extraction-benchmark) · c039d5ee9f5a3a984a0e167e63aacd04e76e78a9

README inspected, including count mismatch with paper; no dataset download or executable run. Reviewed 2026-10-27.

## GQL01

[GraphQL response and execution errors](https://spec.graphql.org/September2025/#sec-Response-Format) · September 2025 specification, not a new October 2026 release

Execution can return partial data with errors. Retain both and distinguish request failure, partial execution and complete requested scope. Evidence: primary documented. Checked 2026-10-27; review after 90 days or before a version-sensitive decision.

## ZSTD01

[Zstandard upstream release](https://github.com/facebook/zstd/releases/tag/v1.5.7) · 1.5.7 released 2025-02-19; latest release endpoint observed 2026-10-27

Lossless codec candidate; release status does not establish faster application writes. Evidence: primary documented. Checked 2026-10-27; review after 30 days or before a version-sensitive decision.

## ZSTD02

[Rust Zstandard binding](https://docs.rs/zstd/0.14.3/zstd/) · 0.14.3, zstd-sys 2.1.2+zstd.1.5.7 in isolated lock

Bulk context reuse and bounded decompression evaluated in an isolated SQLite component. Evidence: primary documented. Checked 2026-10-27; review after 30 days or before a version-sensitive decision.

## LZ401

[lz4_flex Rust API](https://docs.rs/lz4_flex/0.14.0/lz4_flex/) · 0.14.0, default safe and checked features verified

Frame API recommended generally; isolated bounded database records deliberately evaluate block API. Evidence: primary documented. Checked 2026-10-27; review after 30 days or before a version-sensitive decision.

## LZ402

[lz4_flex invalid-offset advisory](https://github.com/PSeitz/lz4_flex/security/advisories/GHSA-vvp9-7p8x-rfvv) · Published 2026-03-14; affected <=0.11.5 and 0.12.0, patched 0.11.6/0.12.1

Older block decoders could leak uninitialized or reused-buffer content. Tested 0.14.0 is outside stated affected range; this is not a full security assurance. Evidence: primary documented. Checked 2026-10-27; review after 30 days or before a version-sensitive decision.

## LZ403

[lz4_flex changelog](https://github.com/PSeitz/lz4_flex/blob/1bffdcbbf906a234b913937cb2f57c0245915038/CHANGELOG.md) · 0.14.0 dated 2026-07-14; GitHub latest release object separately returned 0.13.1

Records alloc feature change, invalid-offset fixes and later short-dictionary fix; do not blindly use one latest endpoint. Evidence: primary documented. Checked 2026-10-27; review after 30 days or before a version-sensitive decision.

## BILI01

[Bilibili official external player documentation](https://player.bilibili.com/) · Current documented HTTPS external player and provider-selected BV1B7411m7LV example

Explicit autoplay=0; canonical video identity and player frame are distinct from verified playing or complete post collection. Evidence: primary documented. Checked 2026-10-27; review after 14 days or before a version-sensitive decision.

## TLS01

[RustSec rustls-ffi lifetime advisory](https://github.com/RustSec/advisory-db/blob/99670cfc0bc574433034b75876a4b791ccaa2efb/crates/rustls-ffi/RUSTSEC-2026-0413.md) · RUSTSEC-2026-0413; assigned October 27 for advisory dated October 26

Affected rustls-ffi 0.12.0–0.15.6; distinct package identity, not all rustls users. Evidence: primary documented. Checked 2026-10-27; review after 14 days or before a version-sensitive decision.


## NXT01

[RustSec nextest portable-recording advisory](https://github.com/RustSec/advisory-db/blob/99670cfc0bc574433034b75876a4b791ccaa2efb/crates/cargo-nextest/RUSTSEC-2026-0412.md) · RUSTSEC-2026-0412 assignment October 27; fixed in 0.9.150

Untrusted experimental rerun recordings can inject build arguments in affected releases; no prototype executed. Evidence: primary documented. Checked 2026-10-27; review after 14 days or before a version-sensitive decision.


## SEM01

[SemanticZip pilot](https://arxiv.org/html/2605.24541v1) · Preprint submitted 2026-05-23; newly reviewed, not newly released

Explicitly lossy semantic reconstruction; not eligible as byte-exact raw snapshot compression. Evidence: primary documented. Checked 2026-10-27; review after 90 days or before a version-sensitive decision.


## MTS01

[MTS-1 telemetry encoding](https://arxiv.org/html/2601.01602v1) · Preprint 2026-01-04; specialized synthetic telemetry

Thresholded delta rule requires a fidelity budget; generated probe is not an author-code reproduction. Evidence: primary documented. Checked 2026-10-27; review after 90 days or before a version-sensitive decision.


## GHR01

[GitHub REST API versioning](https://docs.github.com/en/rest/about-the-rest-api/api-versions) · 2026-03-10 supported; old default 2022-11-28 ends March 10, 2028.

Explicit request version and actual selected version are recorded separately. Primary documentation checked 2026-10-27; review after 14 days or before version-sensitive decisions.

## GHR02

[GitHub REST API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) · Anonymous public requests: 60/hour per originating IP.

Provider headers outrank a local budget; reset is epoch seconds and retry-after is duration. Primary documentation checked 2026-10-27; review after 14 days or before version-sensitive decisions.


## GUIFLOW01

[GUIFlow incremental inference](https://arxiv.org/html/2610.34959v1) · Preprint submitted 2026-10-26.

FLOPs ratios differ from wall-clock latency, and quality varies by model. Research only. Checked 2026-10-27; review after 30 days. [Scoped assessment](https://github.com/Herbertofury/Engineering-Atlas/blob/3af95c984d7fe9a50298a19604dfe4f96a400803/research/2026-10-27-inference-and-nvm-scope.md).

## FLINT01

[FlintKV durable NVM storage](https://arxiv.org/html/2607.02401v1) · Preprint submitted 2026-07-02; newly reviewed October 27.

Hardware-specific persistent-memory study, not a SQLite replacement result. Research only. Checked 2026-10-27; review after 30 days.


## Model-extraction count pressure · 2026-10-27

[Primary-paper screening and acceptance boundary](https://github.com/Herbertofury/Engineering-Atlas/blob/beb354be5dd5321ab7931270329dfd37023ff3be/research/2026-10-27-extraction-count-pressure.md): PAD01 remains an unreplicated research risk, not a ranking or target-project recommendation. The source register now contains 135 unique IDs. Schema validity, provenance and completeness require separate evidence. No inference service or author prototype was executed.
