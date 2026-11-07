# Research Explorer expansion — October 27, 2026

**Snapshot date:** October 27, America/Denver. **Primary-source checks:** October 28 UTC. **Status:** research candidates and proposed tests; external observations and retained local measurements remain separate.

## Consolidated stack-layer extension — October 28, 2026 UTC

The current catalog has **215 candidates, 22 papers, 18 research fields, 20 stack layers and 125 evaluation tracks**. This pass adds **61 records**, updates **22 existing records**, and registers **201 further primary-source observations** while preserving the first sweep and earlier measurements. The catalog now references **364 source records**; the shared Atlas register contains **726 records**. These are observation counts, not claims that every URL is unique or every technical domain is covered.

The Explorer adds one stack-layer filter and a per-layer guide with reference choices, alternatives to compare, a watchlist and an adoption gate. The existing stack-selection page is generated from the same map. **No new topical wiki or guide page is created by this extension.** A tool that participates in several layers keeps one stable candidate ID. The test queue grows from 16 to **20 planned comparisons**, with full-output, compatibility, security, durability and UX gates. There are still **zero new candidate benchmarks or accepted cross-project migrations** in this pass.

The added practical coverage includes MV3/native messaging, portable contracts, collection virtualization, native UI, browser graphics/physics, game asset processing, version-specific mod loaders, dependency solvers, traversal/watchers, hashing/chunking, archives, verified transfer, atomicity/recovery proposals, signed updates, reproducible environments, record/replay and concurrency checking. Fifty newly checked public GitHub repositories bring the snapshot to **173 repository observations**; all 123 previous observations retain their timestamps and earlier errors remain visible.

### Findings that change the next comparison

| Area | Source observation and consequence | Primary sources |
|---|---|---|
| Native Windows UI | Stable Windows App SDK notes list 2.6.4 on October 27. Include shutdown, lifecycle, virtualized control and native-feature behavior in the complete desktop slice. | [ST027](../docs/sources.md#st027), [ST028](../docs/sources.md#st028) |
| Cross-host plugins | WASI 0.3 is current, but the Node jco shim is experimental and many language toolchains still target 0.2. Pin host, toolchain, interface and release together. | [ST077](../docs/sources.md#st077), [ST078](../docs/sources.md#st078) |
| Game export and managed plugins | Godot 4 C# web export remains unsupported in reviewed stable docs. Native AOT has dynamic-loading/code-generation limits. Reject those configurations when the required contract depends on those features. | [ST070](../docs/sources.md#st070), [ST073](../docs/sources.md#st073) |
| Browser graphics | Three.js still labels WebGPURenderer experimental and requires migration of custom shader and post-processing paths. Fallback availability alone is not feature parity. | [ST011](../docs/sources.md#st011), [ST012](../docs/sources.md#st012) |
| Validation throughput | Zod 4.6 distinguishes boolean validation from complete parse diagnostics; JSON Schema conversion has experimental/unsupported cases. Compare only matched output and error contracts. | [ST019](../docs/sources.md#st019), [ST020](../docs/sources.md#st020) |
| Inventory completeness | `ignore` defaults are not automatically a complete inventory contract. Disable unwanted hidden/ignore filtering; release metadata also disagreed with the API/manifest version. | [ST082](../docs/sources.md#st082), [ST083](../docs/sources.md#st083), [ST084](../docs/sources.md#st084) |
| Peer blob transfer | iroh-blobs' current README explicitly withholds production-quality status. Keep the new line on the watchlist and test verified HTTP/range behavior first. | [ST113](../docs/sources.md#st113), [ST114](../docs/sources.md#st114) |
| Update trust | tough's current API overview and delegation-related security advisories do not align cleanly. Conformance tests for delegation, thresholds and trusted metadata are required before acceptance. | [ST141](../docs/sources.md#st141), [ST142](../docs/sources.md#st142), [ST143](../docs/sources.md#st143) |
| Updater channels | Velopack stable 1.2.161 and 1.3 prerelease documentation must stay separate. Do not attribute preview signing/recovery capabilities to a stable binary. | [ST145](../docs/sources.md#st145), [ST147](../docs/sources.md#st147) |
| Native fuzzing | Current AFL++ stable licensing is AGPL-3.0-or-later with individual Apache-2.0 files, and release/dev versions differ. Inspect the actual intended tag and integration. | [ST199](../docs/sources.md#st199), [ST200](../docs/sources.md#st200) |

### Deferred leads and evidence limits

- jwalk's opened README marks it unmaintained. It was excluded from the active comparison list; the suggested replacement was not silently promoted without review.
- The author-listed 2026 content-defined-chunking paper has verified metadata, but its body could not be retrieved and the linked code README still names the 2024 predecessor. It remains a deferred lead, with no imported numbers or version-matched-artifact claim.
- Zstandard's retrieved release index and development changelog disagreed. The catalog gives no inferred latest stable release. notify's stable and release-candidate channels and date precision remain separate.
- Blender's official source/exporter repositories opened, but release pages did not; no exact latest Blender version is asserted. The multilayer ReSTIR abstract and venue metadata opened, but the full PDF exceeded retrieval limits and no code link was established. Neural texture ES is an author testbed/method, not relabeled as a peer-reviewed paper.
- A library API version, release publication time, paper revision, venue year and date of checking remain different fields. Missing dates and unavailable artifacts are not fabricated.
- Conditional layer roles are editorial synthesis. Complementary tools such as a solver, a renderer and an update verifier never share a measured ranking merely because they appear in one application stack.

Deferred/source-conflict evidence: [ST129](../docs/sources.md#st129) · [ST113](../docs/sources.md#st113) · [ST114](../docs/sources.md#st114) · [ST130](../docs/sources.md#st130) · [ST131](../docs/sources.md#st131) · [ST084](../docs/sources.md#st084) · [ST101](../docs/sources.md#st101) · [ST102](../docs/sources.md#st102) · [ST121](../docs/sources.md#st121) · [ST120](../docs/sources.md#st120).

[Open the stack-layer map](../docs/stack-selection.md#stack-layer-comparison-map) · [Search the Explorer](https://herbertofury.github.io/Engineering-Atlas/explorer/) · [Review all 20 plans](../docs/research-test-queue.md)

## Initial sweep outcome

The first Explorer expansion contains **154 catalog entries across 18 fields**, including **19 papers**. It combines a broad review of languages, runtimes, build systems, application frameworks, data and storage, inference, agents, evaluation, testing, graphics and supply-chain tools. It includes **16 planned comparison cohorts**, not 16 completed benchmarks.

Three parallel research passes produced 133 candidate records. Duplicate Wasmtime, Playwright and WASI entries were merged without discarding distinct sources or constraints. A focused paper pass added 13 records. Three parser baselines connect the existing JSON experiment; eight complete model/harness configurations expose publisher-reported results.

[Search and compare the catalog](https://herbertofury.github.io/Engineering-Atlas/explorer/) · [Complete records](../docs/research-catalog.md) · [Ranking contract](../docs/research-explorer.md) · [Planned test queue](../docs/research-test-queue.md)

## Current signals that change a decision

These are dated primary-source observations, not comparative wins. An announcement date, an artifact release, a paper revision and a source-check date can differ.

| Candidate | Observed signal | Primary evidence |
|---|---|---|
| TypeScript 7 native compiler | TypeScript 7.0 was announced 2026-07-08 as the native compiler release. | [RX050](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) |
| Python / CPython | Python 3.15.0 launched 2026-10-09; its page now points to a newer patch release. | [RX048](https://www.python.org/downloads/release/python-3150/) |
| Zig | Official 0.17.0 announcement is dated 2026-10-02; do not infer the binary publication timestamp. | [RX046](https://ziglang.org/news/0.17.0-released/) |
| Tauri | Tauri 2.12 adds a webview permission request handler and changes supported platform/toolchain requirements. | [RX081](https://v2.tauri.app/blog/tauri-2.12/) |
| Electron | Electron 45 released 2026-10-21 with updated Chromium, V8, Node.js, and preload behavior. | [RX082](https://www.electronjs.org/blog/electron-45-0) |
| DuckDB | DuckDB 2.0.0 LTS was announced on 2026-10-21 with asynchronous I/O and other major features. | [RX094](https://duckdb.org/2026/10/21/announcing-duckdb-200) |
| Polars | Polars 2.1 was announced on 2026-10-27; out-of-core group-by and recursive CTE support are documented. | [RX095](https://pola.rs/posts/polars-2-1-changelog/) |
| PostgreSQL | Official release page announces PostgreSQL 19 RC1 dated 2026-10-15; do not treat it as GA. | [RX093](https://www.postgresql.org/docs/release/) |
| Dagger | Official 2026-10-23 announcement introduces Dagger 1.0 beta. | [RX130](https://dagger.io/blog/dagger-10-beta/) |
| OpenTelemetry Collector and OTTL | OTTL v1 was announced on 2026-10-27; stable traces, metrics, and logs support begins with contrib v0.164.0. | [RX108](https://opentelemetry.io/blog/2026/ottl-v1/) |
| FlashAttention-4 | 2026 paper; authors target asymmetric scaling on Blackwell. | [RX008](https://arxiv.org/abs/2603.05451) |
| DFlash | The ICML 2026 camera-ready paper was revised May 28, 2026. | [RX010](https://arxiv.org/abs/2602.06036) |
| GEPA reflective prompt optimization | Published in the ICLR 2026 proceedings. | [RX017](https://proceedings.iclr.cc/paper_files/paper/2026/hash/0e9e708b6f48e14fd0ac29e167413f76-Abstract-Conference.html) |
| SWE-Skills-Bench: Do Agent Skills Actually Help in Real-World Software Engineering? | v2 published 2026-10-27; use the revised 98-skill protocol and current ControllableModel artifact. | [RX146](https://arxiv.org/html/2603.15401v2) · [RX147](https://github.com/ControllableModel/SWE-Skills-Bench) |
| ProgramBench | Official leaderboard snapshot was updated October 22, 2026. | [RX042](https://programbench.com/) |
| WASI 0.3 and Component Model async | WASI 0.3.0 ratification was announced 2026-06-11. | [RX086](https://bytecodealliance.org/articles/WASI-0.3) · [RX087](https://wasi.dev/releases) |

## Evidence design decisions

**Popularity is a discovery signal.** Real GitHub API snapshots preserve observed counts, canonical repository URLs, archive state and license metadata. API errors are retained; unknown counts never become zero. A redirected React repository was resolved through the official API instead of inventing missing metadata. Counts can change after the observation.

**Community reporting is operationally separate.** A public issue form captures the candidate, exact track, version and experience. Approved reports are bound to the current issue-body hash and a verified maintainer, then deduplicated by stable account ID. The static ranking needs a complete refresh and a reviewed data/build update. It starts with zero reports, not seeded praise.

**External scores belong to full configurations.** The two imported cohorts are SWE-Bench Pro V2 Full and ProgramBench. Their task sets, scoring definitions and budget constraints remain separate. The imported eight observations are a documented subset; they do not stand for complete source coverage or an Atlas-run result.

**Local results come from retained raw data.** The builder imports 27 observations from the existing October 26 JSON experiment and checks medians, workload hashes, raw sample counts and the immutable evidence hash. It does not rerun the benchmark, erase semantic disqualifiers, or promote a microbenchmark to target acceptance.

**Year precision stays honest.** Some 2026 venue papers publish only a year or month in the reviewed material. Those records carry a supported publication year and a null exact date. Year filtering includes them; exact-date ordering does not invent January 1.

## Source corrections and unresolved limits

- The opened Zig announcement says October 2; earlier Atlas material describes an October 1 release timestamp. This pass records the announcement date without rewriting the historical artifact claim.
- PostgreSQL 19 RC1, Dagger 1.0 beta, Godot 4.8 beta and other preview channels stay explicitly distinguished from stable lanes.
- The Python 3.15.0 page is a major-release milestone and says it has been superseded; it is not labeled the latest patch.
- SWE-Skills-Bench v2 is the October 27 revision with 98 skills. Older snippets described the preceding 49-skill study.
- Restate’s opened shared-log article is dated 2025 despite a misleading 2026 search-index signal.
- Some dynamically rendered leaderboards do not expose their numeric rows in the opened source. Unsupported Terminal-Bench numbers were excluded.
- Source and artifact availability do not establish an applicable license, build reproducibility or maintained support. Those remain pre-run checks.
- Incr reports shell corner-case differences; hS describes cgroup permission requirements; graphics prototypes have UV-mapping or hardware constraints. Their proposed tests preserve these disqualifiers.

## Review and conflict boundary

The user reserved Site Adapters for another agent. The initial contribution added an isolated Explorer and four research pages; the stack-layer extension maintains those existing pages in place. It does not modify adapter pages, adapter fixtures, collection code, media behavior or existing experiment implementations. Shared README/source-register changes are merged with the latest upstream records, preserving the other contributor’s additions.

Validation covers source/structure checks, catalog and score integrity, deterministic builds, refresh failure behavior, ranking/export logic, and browser interaction. These checks validate the contribution, not the performance of catalog candidates. See the retained validation record for the exact executed checks and remaining limits.

## Source IDs used by the catalog

Each link below points to the dated primary-source register. Full per-entry source URLs, check dates and publication precision are in the catalog.

### AI systems

[RX001](../docs/sources.md#rx001) · [RX002](../docs/sources.md#rx002) · [RX003](../docs/sources.md#rx003) · [RX004](../docs/sources.md#rx004) · [RX005](../docs/sources.md#rx005) · [RX006](../docs/sources.md#rx006) · [RX007](../docs/sources.md#rx007) · [RX008](../docs/sources.md#rx008) · [RX009](../docs/sources.md#rx009) · [RX010](../docs/sources.md#rx010) · [RX033](../docs/sources.md#rx033) · [RX034](../docs/sources.md#rx034) · [RX035](../docs/sources.md#rx035) · [RX036](../docs/sources.md#rx036) · [RX037](../docs/sources.md#rx037) · [RX038](../docs/sources.md#rx038) · [RX039](../docs/sources.md#rx039) · [RX040](../docs/sources.md#rx040)

### AI agents

[RX011](../docs/sources.md#rx011) · [RX012](../docs/sources.md#rx012) · [RX013](../docs/sources.md#rx013) · [RX014](../docs/sources.md#rx014) · [RX015](../docs/sources.md#rx015) · [RX016](../docs/sources.md#rx016)

### AI evaluation & methods

[RX017](../docs/sources.md#rx017) · [RX018](../docs/sources.md#rx018) · [RX019](../docs/sources.md#rx019) · [RX020](../docs/sources.md#rx020) · [RX021](../docs/sources.md#rx021) · [RX022](../docs/sources.md#rx022) · [RX023](../docs/sources.md#rx023) · [RX024](../docs/sources.md#rx024) · [RX025](../docs/sources.md#rx025) · [RX026](../docs/sources.md#rx026) · [RX027](../docs/sources.md#rx027) · [RX031](../docs/sources.md#rx031) · [RX041](../docs/sources.md#rx041) · [RX042](../docs/sources.md#rx042) · [RX043](../docs/sources.md#rx043) · [RX146](../docs/sources.md#rx146) · [RX147](../docs/sources.md#rx147) · [RX148](../docs/sources.md#rx148) · [RX149](../docs/sources.md#rx149) · [RX150](../docs/sources.md#rx150) · [RX151](../docs/sources.md#rx151)

### Retrieval & search

[RX028](../docs/sources.md#rx028) · [RX029](../docs/sources.md#rx029) · [RX030](../docs/sources.md#rx030) · [RX032](../docs/sources.md#rx032) · [RX099](../docs/sources.md#rx099) · [RX100](../docs/sources.md#rx100) · [RX101](../docs/sources.md#rx101) · [RX102](../docs/sources.md#rx102)

### Languages & runtimes

[RX044](../docs/sources.md#rx044) · [RX045](../docs/sources.md#rx045) · [RX046](../docs/sources.md#rx046) · [RX047](../docs/sources.md#rx047) · [RX048](../docs/sources.md#rx048) · [RX049](../docs/sources.md#rx049) · [RX050](../docs/sources.md#rx050) · [RX051](../docs/sources.md#rx051) · [RX052](../docs/sources.md#rx052) · [RX053](../docs/sources.md#rx053) · [RX054](../docs/sources.md#rx054) · [RX055](../docs/sources.md#rx055) · [RX056](../docs/sources.md#rx056) · [RX057](../docs/sources.md#rx057) · [RX058](../docs/sources.md#rx058) · [RX085](../docs/sources.md#rx085)

### Compilers & build tools

[RX059](../docs/sources.md#rx059) · [RX060](../docs/sources.md#rx060) · [RX061](../docs/sources.md#rx061) · [RX062](../docs/sources.md#rx062) · [RX064](../docs/sources.md#rx064) · [RX065](../docs/sources.md#rx065) · [RX129](../docs/sources.md#rx129) · [RX130](../docs/sources.md#rx130)

### Web & API stacks

[RX068](../docs/sources.md#rx068) · [RX069](../docs/sources.md#rx069) · [RX070](../docs/sources.md#rx070) · [RX071](../docs/sources.md#rx071) · [RX072](../docs/sources.md#rx072) · [RX073](../docs/sources.md#rx073) · [RX074](../docs/sources.md#rx074) · [RX075](../docs/sources.md#rx075) · [RX076](../docs/sources.md#rx076) · [RX077](../docs/sources.md#rx077) · [RX078](../docs/sources.md#rx078) · [RX079](../docs/sources.md#rx079) · [RX080](../docs/sources.md#rx080)

### Desktop & game engines

[RX081](../docs/sources.md#rx081) · [RX082](../docs/sources.md#rx082) · [RX083](../docs/sources.md#rx083) · [RX084](../docs/sources.md#rx084) · [RX160](../docs/sources.md#rx160) · [RX161](../docs/sources.md#rx161) · [RX162](../docs/sources.md#rx162) · [RX163](../docs/sources.md#rx163) · [RX164](../docs/sources.md#rx164) · [RX165](../docs/sources.md#rx165) · [RX166](../docs/sources.md#rx166)

### WebAssembly & sandboxes

[RX086](../docs/sources.md#rx086) · [RX087](../docs/sources.md#rx087) · [RX088](../docs/sources.md#rx088) · [RX089](../docs/sources.md#rx089) · [RX113](../docs/sources.md#rx113) · [RX114](../docs/sources.md#rx114) · [RX138](../docs/sources.md#rx138) · [RX139](../docs/sources.md#rx139) · [RX140](../docs/sources.md#rx140) · [RX141](../docs/sources.md#rx141) · [RX143](../docs/sources.md#rx143) · [RX144](../docs/sources.md#rx144) · [RX145](../docs/sources.md#rx145)

### Storage & databases

[RX092](../docs/sources.md#rx092) · [RX093](../docs/sources.md#rx093) · [RX103](../docs/sources.md#rx103) · [RX104](../docs/sources.md#rx104)

### Analytics & data formats

[RX094](../docs/sources.md#rx094) · [RX095](../docs/sources.md#rx095) · [RX096](../docs/sources.md#rx096) · [RX097](../docs/sources.md#rx097) · [RX098](../docs/sources.md#rx098) · [RX131](../docs/sources.md#rx131) · [RX132](../docs/sources.md#rx132)

### Durable workflows

[RX105](../docs/sources.md#rx105) · [RX106](../docs/sources.md#rx106) · [RX107](../docs/sources.md#rx107)

### Profiling & observability

[RX108](../docs/sources.md#rx108) · [RX109](../docs/sources.md#rx109) · [RX110](../docs/sources.md#rx110) · [RX111](../docs/sources.md#rx111) · [RX112](../docs/sources.md#rx112)

### Testing & verification

[RX063](../docs/sources.md#rx063) · [RX065](../docs/sources.md#rx065) · [RX066](../docs/sources.md#rx066) · [RX067](../docs/sources.md#rx067) · [RX090](../docs/sources.md#rx090) · [RX091](../docs/sources.md#rx091) · [RX115](../docs/sources.md#rx115) · [RX116](../docs/sources.md#rx116) · [RX117](../docs/sources.md#rx117) · [RX118](../docs/sources.md#rx118) · [RX119](../docs/sources.md#rx119) · [RX120](../docs/sources.md#rx120) · [RX121](../docs/sources.md#rx121) · [RX122](../docs/sources.md#rx122)

### Software supply chain

[RX123](../docs/sources.md#rx123) · [RX124](../docs/sources.md#rx124) · [RX125](../docs/sources.md#rx125) · [RX126](../docs/sources.md#rx126) · [RX127](../docs/sources.md#rx127) · [RX128](../docs/sources.md#rx128)

### Systems research

[RX133](../docs/sources.md#rx133) · [RX134](../docs/sources.md#rx134) · [RX142](../docs/sources.md#rx142) · [RX152](../docs/sources.md#rx152) · [RX153](../docs/sources.md#rx153) · [RX154](../docs/sources.md#rx154) · [RX155](../docs/sources.md#rx155) · [RX156](../docs/sources.md#rx156) · [RX157](../docs/sources.md#rx157) · [RX158](../docs/sources.md#rx158) · [RX159](../docs/sources.md#rx159)

### Serialization

[RX135](../docs/sources.md#rx135) · [RX136](../docs/sources.md#rx136) · [RX137](../docs/sources.md#rx137)

### Evaluated configurations

[RX020](../docs/sources.md#rx020) · [RX042](../docs/sources.md#rx042)

### Catalog and community governance

[GHS01](../docs/sources.md#ghs01) · [GHS02](../docs/sources.md#ghs02) · [GHS03](../docs/sources.md#ghs03) · [GHS04](../docs/sources.md#ghs04) · [GHS05](../docs/sources.md#ghs05) · [GHS06](../docs/sources.md#ghs06) · [GHS07](../docs/sources.md#ghs07) · [GHS08](../docs/sources.md#ghs08)

## Source IDs added by the stack-layer extension

All observations below were checked against public primary material. Existing source IDs and historical observations remain intact.

### Browser, portable UI and validation

[ST001](../docs/sources.md#st001) · [ST002](../docs/sources.md#st002) · [ST003](../docs/sources.md#st003) · [ST004](../docs/sources.md#st004) · [ST005](../docs/sources.md#st005) · [ST006](../docs/sources.md#st006) · [ST007](../docs/sources.md#st007) · [ST008](../docs/sources.md#st008) · [ST009](../docs/sources.md#st009) · [ST010](../docs/sources.md#st010) · [ST011](../docs/sources.md#st011) · [ST012](../docs/sources.md#st012) · [ST013](../docs/sources.md#st013) · [ST014](../docs/sources.md#st014) · [ST015](../docs/sources.md#st015) · [ST016](../docs/sources.md#st016) · [ST017](../docs/sources.md#st017) · [ST018](../docs/sources.md#st018) · [ST019](../docs/sources.md#st019) · [ST020](../docs/sources.md#st020) · [ST021](../docs/sources.md#st021) · [ST022](../docs/sources.md#st022) · [ST023](../docs/sources.md#st023) · [ST024](../docs/sources.md#st024) · [ST025](../docs/sources.md#st025)


### Native UI, engines, mod compatibility and assets

[ST026](../docs/sources.md#st026) · [ST027](../docs/sources.md#st027) · [ST028](../docs/sources.md#st028) · [ST029](../docs/sources.md#st029) · [ST030](../docs/sources.md#st030) · [ST031](../docs/sources.md#st031) · [ST032](../docs/sources.md#st032) · [ST033](../docs/sources.md#st033) · [ST034](../docs/sources.md#st034) · [ST035](../docs/sources.md#st035) · [ST036](../docs/sources.md#st036) · [ST037](../docs/sources.md#st037) · [ST038](../docs/sources.md#st038) · [ST039](../docs/sources.md#st039) · [ST040](../docs/sources.md#st040) · [ST041](../docs/sources.md#st041) · [ST042](../docs/sources.md#st042) · [ST043](../docs/sources.md#st043) · [ST044](../docs/sources.md#st044) · [ST045](../docs/sources.md#st045) · [ST046](../docs/sources.md#st046) · [ST047](../docs/sources.md#st047) · [ST048](../docs/sources.md#st048) · [ST049](../docs/sources.md#st049) · [ST050](../docs/sources.md#st050)

[ST051](../docs/sources.md#st051) · [ST052](../docs/sources.md#st052) · [ST053](../docs/sources.md#st053) · [ST054](../docs/sources.md#st054) · [ST055](../docs/sources.md#st055) · [ST056](../docs/sources.md#st056) · [ST057](../docs/sources.md#st057) · [ST058](../docs/sources.md#st058) · [ST059](../docs/sources.md#st059) · [ST060](../docs/sources.md#st060) · [ST061](../docs/sources.md#st061) · [ST062](../docs/sources.md#st062) · [ST063](../docs/sources.md#st063) · [ST064](../docs/sources.md#st064) · [ST065](../docs/sources.md#st065) · [ST066](../docs/sources.md#st066) · [ST067](../docs/sources.md#st067) · [ST068](../docs/sources.md#st068) · [ST069](../docs/sources.md#st069) · [ST070](../docs/sources.md#st070) · [ST071](../docs/sources.md#st071) · [ST072](../docs/sources.md#st072) · [ST073](../docs/sources.md#st073) · [ST074](../docs/sources.md#st074) · [ST075](../docs/sources.md#st075)

[ST076](../docs/sources.md#st076) · [ST077](../docs/sources.md#st077) · [ST078](../docs/sources.md#st078)


### Files, storage, transfer and recovery

[ST079](../docs/sources.md#st079) · [ST080](../docs/sources.md#st080) · [ST081](../docs/sources.md#st081) · [ST082](../docs/sources.md#st082) · [ST083](../docs/sources.md#st083) · [ST084](../docs/sources.md#st084) · [ST085](../docs/sources.md#st085) · [ST086](../docs/sources.md#st086) · [ST087](../docs/sources.md#st087) · [ST088](../docs/sources.md#st088) · [ST089](../docs/sources.md#st089) · [ST090](../docs/sources.md#st090) · [ST091](../docs/sources.md#st091) · [ST092](../docs/sources.md#st092) · [ST093](../docs/sources.md#st093) · [ST094](../docs/sources.md#st094) · [ST095](../docs/sources.md#st095) · [ST096](../docs/sources.md#st096) · [ST097](../docs/sources.md#st097) · [ST098](../docs/sources.md#st098) · [ST099](../docs/sources.md#st099) · [ST100](../docs/sources.md#st100) · [ST101](../docs/sources.md#st101) · [ST102](../docs/sources.md#st102) · [ST103](../docs/sources.md#st103)

[ST104](../docs/sources.md#st104) · [ST105](../docs/sources.md#st105) · [ST106](../docs/sources.md#st106) · [ST107](../docs/sources.md#st107) · [ST108](../docs/sources.md#st108) · [ST109](../docs/sources.md#st109) · [ST110](../docs/sources.md#st110) · [ST111](../docs/sources.md#st111) · [ST112](../docs/sources.md#st112) · [ST113](../docs/sources.md#st113) · [ST114](../docs/sources.md#st114) · [ST115](../docs/sources.md#st115) · [ST116](../docs/sources.md#st116) · [ST117](../docs/sources.md#st117) · [ST118](../docs/sources.md#st118) · [ST119](../docs/sources.md#st119) · [ST120](../docs/sources.md#st120) · [ST121](../docs/sources.md#st121) · [ST122](../docs/sources.md#st122) · [ST123](../docs/sources.md#st123) · [ST124](../docs/sources.md#st124) · [ST125](../docs/sources.md#st125) · [ST126](../docs/sources.md#st126) · [ST127](../docs/sources.md#st127) · [ST128](../docs/sources.md#st128)

[ST129](../docs/sources.md#st129) · [ST130](../docs/sources.md#st130) · [ST131](../docs/sources.md#st131)


### Solving, distribution, reproducibility and diagnostics

[ST132](../docs/sources.md#st132) · [ST133](../docs/sources.md#st133) · [ST134](../docs/sources.md#st134) · [ST135](../docs/sources.md#st135) · [ST136](../docs/sources.md#st136) · [ST137](../docs/sources.md#st137) · [ST138](../docs/sources.md#st138) · [ST139](../docs/sources.md#st139) · [ST140](../docs/sources.md#st140) · [ST141](../docs/sources.md#st141) · [ST142](../docs/sources.md#st142) · [ST143](../docs/sources.md#st143) · [ST144](../docs/sources.md#st144) · [ST145](../docs/sources.md#st145) · [ST146](../docs/sources.md#st146) · [ST147](../docs/sources.md#st147) · [ST148](../docs/sources.md#st148) · [ST149](../docs/sources.md#st149) · [ST150](../docs/sources.md#st150) · [ST151](../docs/sources.md#st151) · [ST152](../docs/sources.md#st152) · [ST153](../docs/sources.md#st153) · [ST154](../docs/sources.md#st154) · [ST155](../docs/sources.md#st155) · [ST156](../docs/sources.md#st156)

[ST157](../docs/sources.md#st157) · [ST158](../docs/sources.md#st158) · [ST159](../docs/sources.md#st159) · [ST160](../docs/sources.md#st160) · [ST161](../docs/sources.md#st161) · [ST162](../docs/sources.md#st162) · [ST163](../docs/sources.md#st163) · [ST164](../docs/sources.md#st164) · [ST165](../docs/sources.md#st165) · [ST166](../docs/sources.md#st166) · [ST167](../docs/sources.md#st167) · [ST168](../docs/sources.md#st168) · [ST169](../docs/sources.md#st169) · [ST170](../docs/sources.md#st170) · [ST171](../docs/sources.md#st171) · [ST172](../docs/sources.md#st172) · [ST173](../docs/sources.md#st173) · [ST174](../docs/sources.md#st174) · [ST175](../docs/sources.md#st175) · [ST176](../docs/sources.md#st176) · [ST177](../docs/sources.md#st177) · [ST178](../docs/sources.md#st178) · [ST179](../docs/sources.md#st179) · [ST180](../docs/sources.md#st180) · [ST181](../docs/sources.md#st181)

[ST182](../docs/sources.md#st182) · [ST183](../docs/sources.md#st183) · [ST184](../docs/sources.md#st184) · [ST185](../docs/sources.md#st185) · [ST186](../docs/sources.md#st186) · [ST187](../docs/sources.md#st187) · [ST188](../docs/sources.md#st188) · [ST189](../docs/sources.md#st189) · [ST190](../docs/sources.md#st190) · [ST191](../docs/sources.md#st191) · [ST192](../docs/sources.md#st192) · [ST193](../docs/sources.md#st193) · [ST194](../docs/sources.md#st194) · [ST195](../docs/sources.md#st195) · [ST196](../docs/sources.md#st196) · [ST197](../docs/sources.md#st197) · [ST198](../docs/sources.md#st198) · [ST199](../docs/sources.md#st199) · [ST200](../docs/sources.md#st200) · [ST201](../docs/sources.md#st201)
