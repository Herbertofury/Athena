# Athena Engineering

![Athena Engineering: research, experiments and verified decisions](assets/atlas-banner.svg)

**Athena combines the learning academy with this evidence-led engineering library.** The internal `atlas-lab` crate, database format and historical experiment identifiers remain stable for compatibility. Pending drafts are preserved separately, not silently accepted. See the [migration inventory](https://github.com/Herbertofury/Athena/blob/main/migration/engineering-atlas/README.md).

**Build better software. Prove the improvement. Keep the evidence.**

A practical, evolving research library for desktop apps, web services, Minecraft mods, game tooling and asset pipelines. Foundation reviewed October 26; latest stack and methods expansion: **October 31, 2026**. This is a curated foundation, not a claim that every technology has been exhaustively benchmarked.

## Search and compare the research catalog

[Research Explorer](docs/explorer/index.html) provides field/type/evidence filters, source-backed 2026 candidates, dated GitHub popularity, scoped external benchmarks, retained Atlas measurements and a reproducible test queue. Compare a shortlist and export a test plan. Community reports have a reviewable GitHub submission path; no votes are fabricated.

**Current snapshot:** 283 candidates, 36 papers, 20 stack layers and 38 planned comparisons. The [October 31 research record](research/2026-10-31-stack-expansion.md) adds 68 candidates, 15 existing-entry refreshes and 164 primary-source observations.

[Complete catalog](docs/research-catalog.md) · [Ranking methodology](docs/research-explorer.md) · [Planned comparisons](docs/research-test-queue.md) · [Community reports](docs/research-community.md)

## Ranked choices and measured experiments

[Best choices and avoid guidance](docs/ranked-recommendations.md) · [2026 paper and Codeberg-linked watchlist](docs/paper-watchlist-2026.md) · [Measured JSON lab](experiments/json-lab/README.md)

## Start here

[Experiment evidence directory](docs/experiment-evidence.md) organizes real-source tests, generated workloads, failures, repairs and remaining acceptance gates.

| Need | Guide |
|---|---|
| Learn from an app with evidence | [Article tool inventory and bounded workflows](docs/app-study/README.md) |
| Choose a stack without hype | [Stack decision map](docs/stack-selection.md) |
| Reduce repeated algorithm/storage work | [Algorithms, storage and concurrency](docs/algorithms-storage-concurrency.md) |
| Make an application substantially faster | [Performance engineering](docs/performance.md) |
| Scan files, configs and archives safely and quickly | [File pipelines and worker tuning](docs/file-pipelines.md) |
| Index archives and detect changes correctly | [Archives and change tracking](docs/archive-and-change-tracking.md) |
| Build responsive desktop applications | [Desktop architecture](docs/desktop.md) |
| Build a web service and account integration | [Web and security](docs/web-security.md) |
| Build or extend a mod | [Mod development](docs/mods.md) |
| Build models, animation and game assets | [Game and asset pipelines](docs/game-assets.md) |
| Prove correctness and ship the tested build | [Testing and release](docs/testing-release.md) |
| Find the latest research and distinguish evidence | [Research method](docs/research-method.md) · [2026 review](research/2026-10-26.md) |

## The standard

A substantial improvement changes the actual end-to-end experience while retaining the required output and behavior. Caching, warm-up and perceived responsiveness can help, but they do not replace completing the work. Do not skip validation, hide warnings, lower fidelity or call stale results current to produce a better number.

“Best” is conditional on the workload, platform, security boundary, team and deployment constraints. A new version is a candidate, not a performance result. Keep stable production baselines and test experimental methods in isolated comparisons.

## Site adapters and real media

[Real public-media workbench](docs/media-lab/index.html) combines actual source snapshots, image-decode checks and explicit playback states. [Adapter laboratory](docs/adapters/README.md) tracks platform-specific access, reuse candidates, complete-media requirements and truthful evidence states. Paid/private fixtures stay private; source identity and playback are tested separately from metadata.

[Expanded site research](docs/adapters/coverage-catalog.md) covers **426 service/scope entries**, including paid creator sites, social networks, mod hosts and specialist indexes. [Six game-specific guides](docs/adapters/games/README.md) and the [second-round methods](docs/adapters/methods-round2.md) retain actual item/profile inspections, extraction boundaries, failures and operation-specific evidence. Signed-in fixtures cover Mod Collective, SubscribeStar and Patreon; actual public release downloads were also verified on Patreon and SimsFinds. WCIF creator pagination and Tumblr original/reblog attribution have dedicated browser receipts. Complete platform acceptance remains pending. [Dated methods record](research/2026-10-28-adapter-methods-round2.md).

[Executable site extraction lab](experiments/site-extraction-lab/README.md) provides eight offline parser families, nine actual fixture replays and 27 normalized records, with body hashes, image ordering, identity joins and missing-field behavior. Raw captures and downloaded mods are excluded from publication.

[Isolated parser experiment](experiments/adapter-parser-lab/README.md) retains full-output parity and a small-workload tail regression. It is not an accepted application upgrade.

## Browser card and storage experiments

[Card-density browser harness](docs/card-lab/index.html) tests initial rendering and keyed incremental updates with complete generated records. [Rust storage experiment](experiments/rust-storage-lab/README.md) retains transaction and durability boundaries. These are research workloads, not target-project acceptance.

## Executable R&D application

[Athena Lab](apps/atlas-lab/README.md) is the early Rust experiment and collection core: real algorithm comparisons, a failure-preserving SQLite journal and a bounded public metadata adapter. It is not yet a finished autonomous app or universal collector.

## Reusable tools

- `python3 scripts/check_research.py`: validate the source register, internal links and evidence metadata without network access.
- `python3 -m unittest discover -s tests -v`: run the checking-tool tests.
- `python3 scripts/compare_benchmarks.py BASELINE.json CANDIDATE.json`: compare paired complete results; reject mismatched workloads, environments, conditions or output hashes.
- [Worker-sweep evaluator](docs/worker-sweep-tool.md): compare all five worker limits with explicit resource/UX budgets; no automatic default changes.
- [Experiment template](templates/experiment.md) · [Decision record](templates/decision.md) · [Benchmark format](docs/benchmark-format.md).

The fixture data is **synthetic test data**, never evidence that a real application is faster. This repository contains no validated universal stack rankings or private project logs.

[Complete primary-source index](data/source-index.json) · [Research backlog](docs/roadmap.md) · [Contribution rules](CONTRIBUTING.md) · [Athena wiki](https://github.com/Herbertofury/Athena/wiki)

## October 31 community and social extraction expansion

[Round-three methods](docs/adapters/methods-round3.md) adds 77 deduplicated canonical scopes and 367 dated source/outcome records, expanding coverage to 426 scopes. Updated six game guides and an [other-games guide](docs/adapters/games/other-games.md) preserve actual item/profile/media/file observations. New offline [Discord](docs/adapters/discord.md) and [Bluesky](docs/adapters/bluesky.md) normalizers add defensive identity and media handling; Bluesky has actual public API replays. Public discovery, complete extraction, entitlement and native follow operations retain separate evidence.


## Competing apps and alternative workflows

[Comparison hub](COMPETITORS.md): relevant baselines, source-backed alternatives, existing research catalogs and concrete validation priorities. Candidate ideas are not claims of measured superiority.


## Preserved draft research

[November 3 frontier systems review](research/2026-11-03-frontier-systems.md) is reconciled from preserved Atlas draft #6, with its original dated primary-source observations. Its rankings and release statements are historical research, not a new latest-version check, dependency adoption or proven performance recommendation. Re-evaluate against Athena’s current requirements and exact shipped implementation before promotion.
