# Development & automation

Write, inspect, test and deliver software and workflows.

[Browse in Athena](https://herbertofury.github.io/Athena/#software?family=development) · [Catalog](Software-Catalog) · [Method](Software-Methodology)

185 applications. Reviewed 2026-11-16; individual records identify inherited research.

## Analytical databases

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fanalytical-databases)

### ClickHouse

Column-oriented SQL database for analytical queries, with a local command mode and server deployments.

- **Platforms:** Linux, macOS, FreeBSD. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Official README lists Linux, macOS and FreeBSD installation; this record does not infer native Windows support from WSL or containers.
- **Pricing details:** Open-source self-managed engine has no product license fee; managed cloud and infrastructure incur separate costs.
- **Pick for:** You need a columnar analytical engine that can grow from local investigation to a server.
- **Compare when:** Choose DuckDB for embedded single-process analytics or a transactional database for frequent row updates.
- **Strengths:** Fits repeated aggregation over structured analytical data; Local mode can explore data before operating a server
- **Limitations:** Operational tuning and storage design matter at scale; Transactional application workloads need separate evaluation
- **Maintenance:** active — Official release v26.9.28.166-stable is dated 2026-11-14; installation and performance were not independently tested. ([evidence](https://github.com/ClickHouse/ClickHouse/releases/tag/v26.9.28.166-stable))
- [Official project](https://clickhouse.com/) · [Official installation / downloads](https://github.com/ClickHouse/ClickHouse#how-to-install-linux-macos-freebsd) · [Repository](https://github.com/ClickHouse/ClickHouse)
- **Sources:** [Official product overview](https://clickhouse.com/) (2026-11-15; identity, features, pricing); [Official project documentation](https://raw.githubusercontent.com/ClickHouse/ClickHouse/master/README.md) (2026-11-15; identity, features, downloads, platforms); [Official licensing terms](https://raw.githubusercontent.com/ClickHouse/ClickHouse/master/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://github.com/ClickHouse/ClickHouse#how-to-install-linux-macos-freebsd) (2026-11-15; downloads); [Official dated release](https://github.com/ClickHouse/ClickHouse/releases/tag/v26.9.28.166-stable) (2026-11-15; maintenance, downloads)
### DuckDB

In-process SQL analytics engine with a CLI and bindings for querying local and remote data files.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Analyze CSV or Parquet datasets with SQL on a personal computer.
- **Compare when:** It is designed for analytical workloads; multi-process write coordination and memory-intensive queries require planning.
- **Strengths:** Files can be queried without first operating a separate database server.
- **Limitations:** It is designed for analytical workloads; multi-process write coordination and memory-intensive queries require planning.
- **Maintenance:** active — An upstream release was observed dated 2026-10-21. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/duckdb/duckdb/releases/tag/v2.0.0))
- [Official project](https://duckdb.org/) · [Official installation / downloads](https://duckdb.org/docs/installation) · [Repository](https://github.com/duckdb/duckdb)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/duckdb/duckdb/HEAD/README.md) (2026-11-14; downloads, features, identity); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/duckdb/duckdb/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://duckdb.org/docs/installation) (2026-11-14; downloads); [Official documentation: Official CLI and library distribution choices for Windows, macOS and Linux.](https://duckdb.org/docs/installation/) (2026-11-14; platforms, downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/duckdb/duckdb/releases/download/v2.0.0/duckdb-cli-linux-amd64-musl.tar.gz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/duckdb/duckdb/releases/tag/v2.0.0) (2026-11-14; downloads, maintenance)
### QuestDB

Time-series SQL database with timestamp-aware queries, ingestion protocols and a browser console.

- **Platforms:** Linux, macOS, Web. **License:** Apache-2.0 core; Enterprise features have separate terms. **Pricing model:** freemium.
- **Compatibility details:** README documents Docker deployment and native Apple Silicon Homebrew packages; Intel Macs use Docker. Linux host requirements apply to container deployment.
- **Pricing details:** Open-source deployment is free; Enterprise capabilities and managed operations are separate.
- **Pick for:** Data is primarily timestamped events and requires time-series SQL queries.
- **Compare when:** Choose ClickHouse for broader columnar workloads or DuckDB for local embedded analysis.
- **Strengths:** Time-oriented query operators suit event and telemetry analysis; SQL access connects existing query tools
- **Limitations:** Enterprise automatic storage tiering is distinct from open-source manual conversion; Host architecture and ingestion protocol support must match the workload
- **Maintenance:** active — Official release 10.2.0 is dated 2026-11-10; installation and performance were not independently tested. ([evidence](https://github.com/questdb/questdb/releases/tag/10.2.0))
- [Official project](https://questdb.com/) · [Official installation / downloads](https://github.com/questdb/questdb#get-started) · [Repository](https://github.com/questdb/questdb)
- **Sources:** [Official product overview](https://questdb.com/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/questdb/questdb/master/README.md) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/questdb/questdb/master/LICENSE.txt) (2026-11-15; license); [Official download or installation entry point](https://github.com/questdb/questdb#get-started) (2026-11-15; downloads); [Official dated release](https://github.com/questdb/questdb/releases/tag/10.2.0) (2026-11-15; maintenance, downloads)

## API mocking

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fapi-mocking)

### Mockoon

Desktop application and CLI for designing local mock API servers with controlled responses.

- **Platforms:** Windows, macOS, Linux. **License:** MIT for the public application and CLI; Pro has separate terms. **Pricing model:** freemium.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Develop a client while its real backend is unavailable or unstable.
- **Compare when:** Mock definitions must track the real API; collaboration and managed deployment features are part of Mockoon Pro.
- **Strengths:** A GUI can model unavailable APIs and reproduce errors without relying on the real service.
- **Limitations:** Mock definitions must track the real API; collaboration and managed deployment features are part of Mockoon Pro.
- **Maintenance:** active — An upstream release was observed dated 2026-10-29. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/mockoon/mockoon/releases/tag/v9.10.0))
- [Official project](https://mockoon.com/) · [Official installation / downloads](https://mockoon.com/download/) · [Repository](https://github.com/mockoon/mockoon)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/mockoon/mockoon/blob/main/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://github.com/mockoon/mockoon/blob/main/LICENSE.md) (2026-11-14; license); [Official downloads or installation instructions](https://mockoon.com/download/) (2026-11-14; downloads); [Official documentation: Paid Team and Enterprise Pro plans extend the free local application and CLI.](https://mockoon.com/pricing/) (2026-11-14; pricing); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/mockoon/mockoon/releases/download/v9.10.0/mockoon-9.10.0.amd64.deb) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/mockoon/mockoon/releases/tag/v9.10.0) (2026-11-14; downloads, maintenance)
### WireMock

HTTP service simulator with request matching, response templating and record/replay functionality.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** The standalone server is a Java JAR; a supported Java runtime is required on each operating system.
- **Pricing details:** The reviewed upstream source is distributed at no charge and includes a documented build/install route. This does not establish free prebuilt binaries for every platform.
- **Pick for:** Reproduce backend responses and failure cases in automated integration tests.
- **Compare when:** The standalone server requires a compatible Java runtime; WireMock Cloud is a separate commercial offering.
- **Strengths:** Programmable stubs and deliberate faults make API integration tests reproducible.
- **Limitations:** The standalone server requires a compatible Java runtime; WireMock Cloud is a separate commercial offering.
- **Maintenance:** active — An upstream release was observed dated 2025-11-14. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/wiremock/wiremock/releases/tag/3.13.2))
- [Official project](https://wiremock.org/) · [Official installation / downloads](https://wiremock.org/docs/download-and-installation/) · [Repository](https://github.com/wiremock/wiremock)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/wiremock/wiremock/blob/master/README.md) (2026-11-14; downloads, features, identity); [Official license text or upstream licensing metadata](https://github.com/wiremock/wiremock/blob/master/LICENSE.txt) (2026-11-14; license); [Official downloads or installation instructions](https://wiremock.org/docs/download-and-installation/) (2026-11-14; downloads, features); [Official documentation: The standalone JAR runs using the required Java runtime; host compatibility depends on that runtime.](https://wiremock.org/docs/standalone/java-jar/) (2026-11-14; platforms, downloads); [Public upstream source distribution; binary packaging is separate](https://github.com/wiremock/wiremock/archive/HEAD.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/wiremock/wiremock/releases/tag/3.13.2) (2026-11-14; downloads, maintenance)

## API testing

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fapi-testing)

### Bruno

API client that stores collections as local text files suited to version control and collaborative review.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** freemium.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Keep API collections alongside a repository and review changes through Git.
- **Compare when:** Some collaboration and advanced features are offered in paid editions.
- **Strengths:** Plain-text collections make API changes reviewable through ordinary version control.
- **Limitations:** Some collaboration and advanced features are offered in paid editions.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-12. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/usebruno/bruno))
- [Official project](https://www.usebruno.com/) · [Official installation / downloads](https://github.com/usebruno/bruno/releases) · [Repository](https://github.com/usebruno/bruno)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/usebruno/bruno) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/usebruno/bruno/HEAD/readme.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://www.usebruno.com/) (2026-11-14; identity, features); [Official release inspected: v4.3.0](https://github.com/usebruno/bruno/releases/tag/v4.3.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/usebruno/bruno/releases/download/v4.3.0/bruno_4.3.0_x64_mac.dmg) (2026-11-14; downloads, pricing); [Official source: A free Open Source edition and paid Pro/Ultimate plans are listed.](https://www.usebruno.com/pricing) (2026-11-14; pricing)
### Hoppscotch

API development interface for HTTP requests and related protocols, available as hosted and self-hosted software.

- **Platforms:** Windows, macOS, Linux, Web. **License:** MIT. **Pricing model:** freemium.
- **Pick for:** Test APIs in a browser-based workspace or controlled self-hosted instance.
- **Compare when:** Browser networking restrictions may require an agent or proxy for local targets.
- **Strengths:** Hosted, desktop, and self-hosted clients support different deployment preferences.
- **Limitations:** Browser networking restrictions may require an agent or proxy for local targets.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-05. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/hoppscotch/hoppscotch))
- [Official project](https://hoppscotch.io/) · [Official installation / downloads](https://hoppscotch.io/) · [Repository](https://github.com/hoppscotch/hoppscotch)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/hoppscotch/hoppscotch) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/hoppscotch/hoppscotch/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official official documentation](https://hoppscotch.io/) (2026-11-14; identity, features); [Official release inspected: 2026.10.1](https://github.com/hoppscotch/hoppscotch/releases/tag/2026.10.1) (2026-11-14; downloads, maintenance); [Official source: Free use and paid organizational features/support are offered.](https://hoppscotch.com/pricing) (2026-11-14; pricing)
### Hurl

Runs HTTP requests and assertions from text files, including chained requests and extracted values.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Version and run repeatable API checks in a repository.
- **Compare when:** It focuses on HTTP and command-line workflows; interactive API exploration may be more convenient in a GUI client.
- **Strengths:** Request files can be reviewed alongside source code and executed in CI without a GUI collection format.
- **Limitations:** It focuses on HTTP and command-line workflows; interactive API exploration may be more convenient in a GUI client.
- **Maintenance:** active — An upstream release was observed dated 2026-10-28. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/Orange-OpenSource/hurl/releases/tag/8.1.0))
- [Official project](https://hurl.dev/) · [Official installation / downloads](https://github.com/Orange-OpenSource/hurl/releases) · [Repository](https://github.com/Orange-OpenSource/hurl)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/Orange-OpenSource/hurl/blob/master/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://github.com/Orange-OpenSource/hurl/blob/master/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/Orange-OpenSource/hurl/releases) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/Orange-OpenSource/hurl/releases/download/8.1.0/hurl-8.1.0-aarch64-apple-darwin.tar.gz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/Orange-OpenSource/hurl/releases/tag/8.1.0) (2026-11-14; downloads, maintenance)
### Insomnia

Desktop API design and testing client supporting request collections, authentication, and API specifications.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** freemium.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Develop and test HTTP APIs through an integrated desktop client.
- **Compare when:** Storage, account, and collaboration choices vary by product plan.
- **Strengths:** Collections and protocol support place related API experiments in one workspace.
- **Limitations:** Storage, account, and collaboration choices vary by product plan.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/Kong/insomnia))
- [Official project](https://insomnia.rest/) · [Official installation / downloads](https://github.com/Kong/insomnia/releases) · [Repository](https://github.com/Kong/insomnia)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/Kong/insomnia) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/Kong/insomnia/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://insomnia.rest/) (2026-11-14; identity, features); [Official release inspected: core@13.4.0](https://github.com/Kong/insomnia/releases/tag/core%4013.4.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/Kong/insomnia/releases/download/core%4013.4.0/Insomnia.Core-13.4.0.exe) (2026-11-15; downloads, pricing); [Official source: Free Essentials and local Scratch Pad use alongside paid Pro/Enterprise plans.](https://insomnia.rest/pricing) (2026-11-14; pricing)

## Command benchmarking

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fbenchmarking-tools)

### Hyperfine

Command-line benchmarking tool with repeated runs, warmups, statistical summaries, and export formats.

- **Platforms:** Windows, macOS, Linux. **License:** MIT or Apache-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Compare reproducible command workloads with recorded run variability.
- **Compare when:** A command benchmark does not establish full application or user-experience performance.
- **Strengths:** Repeated samples and explicit warmups make command comparisons more reproducible.
- **Limitations:** A command benchmark does not establish full application or user-experience performance.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-01. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/sharkdp/hyperfine))
- [Official project](https://github.com/sharkdp/hyperfine) · [Official installation / downloads](https://github.com/sharkdp/hyperfine/releases) · [Repository](https://github.com/sharkdp/hyperfine)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/sharkdp/hyperfine) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/sharkdp/hyperfine/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms, license); [Official release inspected: v2.0.0](https://github.com/sharkdp/hyperfine/releases/tag/v2.0.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/sharkdp/hyperfine/releases/download/v2.0.0/hyperfine-v2.0.0-x86_64-pc-windows-msvc.zip) (2026-11-14; downloads, pricing)

## Binary editors

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fbinary-editors)

### 010 Editor

Hex and text editor with programmable binary templates, scripts and structured file inspection.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary commercial EULA. **Pricing model:** paid.
- **Compatibility details:** Official downloads provide Windows, macOS Intel/ARM and Linux builds with version-specific OS requirements.
- **Pricing details:** Commercial software with a 30-day trial; home/academic and commercial licenses differ. Exact current prices are linked rather than frozen.
- **Pick for:** Binary formats need reusable parsing templates and automated edits.
- **Compare when:** Use HxD for occasional simple Windows edits or Hex Fiend for a focused macOS workflow.
- **Strengths:** Templates expose file structures instead of just bytes; Scripts can automate repeated binary transformations
- **Limitations:** Paid license follows a limited trial; Templates and raw-disk operations require format expertise and care
- **Maintenance:** unverified — Official product and installation material reviewed; a recent dated release was not established for this product scope.
- [Official project](https://www.sweetscape.com/010editor/) · [Official installation / downloads](https://www.sweetscape.com/download/010editor/)
- **Sources:** [Official product overview](https://www.sweetscape.com/010editor/) (2026-11-15; identity, features, pricing); [Official licensing terms](https://www.sweetscape.com/download/010editor/) (2026-11-15; license, platforms, downloads)
### Hex Fiend

macOS hex editor with binary comparison, large-file editing, data inspectors and templates.

- **Platforms:** macOS. **License:** BSD-2-Clause. **Pricing model:** free.
- **Compatibility details:** Official project lists macOS and gives the minimum supported release for its current binary.
- **Pricing details:** Official binaries and source are publicly available without a product fee.
- **Pick for:** You want a focused native macOS tool to inspect and compare binary files.
- **Compare when:** Choose 010 Editor when shared cross-platform template workflows are essential.
- **Strengths:** Handles binary editing in a focused macOS interface; File changes can be inspected through a structure template or a diff
- **Limitations:** Only macOS is supported; Specialized format templates still need authoring or review
- **Maintenance:** unverified — Official release v2.18.1 is dated 2025-03-16; installation and performance were not independently tested. ([evidence](https://github.com/HexFiend/HexFiend/releases/tag/v2.18.1))
- [Official project](https://hexfiend.com/) · [Official installation / downloads](https://github.com/HexFiend/HexFiend/releases) · [Repository](https://github.com/HexFiend/HexFiend)
- **Sources:** [Official product overview](https://hexfiend.com/) (2026-11-15; identity, features, platforms, pricing); [Official project documentation](https://raw.githubusercontent.com/HexFiend/HexFiend/master/README.md) (2026-11-15; identity, features, downloads); [Official licensing terms](https://raw.githubusercontent.com/HexFiend/HexFiend/master/License.txt) (2026-11-15; license); [Official download or installation entry point](https://github.com/HexFiend/HexFiend/releases) (2026-11-15; downloads); [Official dated release](https://github.com/HexFiend/HexFiend/releases/tag/v2.18.1) (2026-11-15; maintenance, downloads)
### HxD

Windows hex editor with file, memory and disk views plus search and checksum tools.

- **Platforms:** Windows. **License:** Proprietary freeware license; redistribution restrictions apply. **Pricing model:** free.
- **Compatibility details:** Windows desktop application with installable and portable packages; current OS compatibility should be checked against the download documentation.
- **Pricing details:** Official license explicitly permits free private and commercial use; selling or modifying redistributed packages is restricted.
- **Pick for:** You want a no-cost Windows hex editor for file inspection and occasional low-level work.
- **Compare when:** Choose 010 Editor for template-driven binary parsing or ImHex for a broader analysis workbench.
- **Strengths:** Combines everyday binary editing with low-level Windows inspection; A portable distribution is available
- **Limitations:** Disk and memory editing can modify live data; Current maintenance could not be established beyond the older public release listing
- **Maintenance:** unverified — Official product and installation material reviewed; a recent dated release was not established for this product scope.
- [Official project](https://mh-nexus.de/en/hxd/) · [Official installation / downloads](https://mh-nexus.de/en/downloads.php?product=HxD20)
- **Sources:** [Official product overview](https://mh-nexus.de/en/hxd/) (2026-11-15; identity, features, platforms); [Official licensing terms](https://mh-nexus.de/en/hxd/license.php) (2026-11-15; license, pricing); [Official download or installation entry point](https://mh-nexus.de/en/downloads.php?product=HxD20) (2026-11-15; downloads)
### ImHex

Hex editor with a pattern language, data visualization, and binary-analysis features.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Describe and inspect structured binary formats visually.
- **Compare when:** Editing binary files directly can corrupt them; use copies for experiments.
- **Strengths:** A pattern language connects byte-level data with its higher-level structure.
- **Limitations:** Editing binary files directly can corrupt them; use copies for experiments.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-10-09. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/WerWolv/ImHex))
- [Official project](https://imhex.werwolv.net/) · [Official installation / downloads](https://github.com/WerWolv/ImHex/releases) · [Repository](https://github.com/WerWolv/ImHex)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/WerWolv/ImHex) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/WerWolv/ImHex/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://imhex.werwolv.net/) (2026-11-14; identity, features); [Official release inspected: v1.38.1](https://github.com/WerWolv/ImHex/releases/tag/v1.38.1) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/WerWolv/ImHex/releases/download/v1.38.1/imhex-1.38.1-Windows-x86_64.msi) (2026-11-14; downloads, pricing)

## Browser testing

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fbrowser-testing)

### Cypress

Browser test runner with an interactive application for authoring and debugging end-to-end and component tests.

- **Platforms:** Windows, macOS, Linux. **License:** MIT for the public test runner; hosted services have separate terms. **Pricing model:** freemium.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Develop and debug browser tests while watching application behavior.
- **Compare when:** Its browser execution model differs from WebDriver; optional Cypress Cloud features have separate commercial plans.
- **Strengths:** The visible runner keeps application state near the failing command during test development.
- **Limitations:** Its browser execution model differs from WebDriver; optional Cypress Cloud features have separate commercial plans.
- **Maintenance:** active — An upstream release was observed dated 2026-11-10. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/cypress-io/cypress/releases/tag/v16.3.0))
- [Official project](https://github.com/cypress-io/cypress) · [Official installation / downloads](https://github.com/cypress-io/cypress#installing) · [Repository](https://github.com/cypress-io/cypress)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/cypress-io/cypress/blob/develop/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://github.com/cypress-io/cypress/blob/develop/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/cypress-io/cypress#installing) (2026-11-14; downloads); [Official documentation: The MIT-licensed Cypress App is free on Windows, macOS and Linux; optional Cloud products have separate plans.](https://docs.cypress.io/app/faq) (2026-11-14; pricing, platforms, license, features); [Official documentation: Hosted Cloud capabilities and commercial plans are distinct from the local test runner.](https://www.cypress.io/pricing) (2026-11-14; pricing); [Public upstream app/package distribution: unauthenticated availability checked](https://registry.npmjs.org/cypress/-/cypress-16.3.0.tgz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/cypress-io/cypress/releases/tag/v16.3.0) (2026-11-14; downloads, maintenance)
### Playwright

Automates Chromium, Firefox and WebKit with isolated test contexts, assertions and replayable traces.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Supported Windows, macOS and Linux versions are explicitly listed in the installation guide; browser binaries and OS dependencies are separate installs.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Verify web application flows in several browser engines.
- **Compare when:** Browser downloads and system dependencies are separate from the test package; engine emulation does not replace testing actual mobile devices.
- **Strengths:** Browser isolation and trace inspection help reproduce interface failures across engines.
- **Limitations:** Browser downloads and system dependencies are separate from the test package; engine emulation does not replace testing actual mobile devices.
- **Maintenance:** active — An upstream release was observed dated 2026-11-13. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/microsoft/playwright/releases/tag/v1.65.1))
- [Official project](https://github.com/microsoft/playwright) · [Official installation / downloads](https://github.com/microsoft/playwright#install) · [Repository](https://github.com/microsoft/playwright)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/microsoft/playwright/blob/main/README.md) (2026-11-14; downloads, features, identity, platforms); [Official license text or upstream licensing metadata](https://github.com/microsoft/playwright/blob/main/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/microsoft/playwright#install) (2026-11-14; downloads); [Official documentation: Browser test installation and supported Windows, macOS and Linux hosts.](https://github.com/microsoft/playwright) (2026-11-14; platforms, downloads); [Official documentation: Official supported Windows, macOS and Linux system requirements and browser installation instructions.](https://playwright.dev/docs/intro) (2026-11-14; platforms, downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://registry.npmjs.org/@playwright/test/-/test-1.65.1.tgz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/microsoft/playwright/releases/tag/v1.65.1) (2026-11-14; downloads, maintenance)
### Puppeteer

JavaScript browser automation for Chrome and Firefox through DevTools Protocol or WebDriver BiDi.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Generate browser-rendered PDFs or automate repeatable web interactions.
- **Compare when:** It is a library rather than a complete assertion/test-management suite; compatible browser binaries and Node.js are required.
- **Strengths:** A direct browser API suits scripted rendering, extraction and browser-assisted developer tools.
- **Limitations:** It is a library rather than a complete assertion/test-management suite; compatible browser binaries and Node.js are required.
- **Maintenance:** active — An upstream release was observed dated 2026-11-10. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/puppeteer/puppeteer/releases/tag/browsers-v3.2.7))
- [Official project](https://github.com/puppeteer/puppeteer) · [Official installation / downloads](https://github.com/puppeteer/puppeteer#installation) · [Repository](https://github.com/puppeteer/puppeteer)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/puppeteer/puppeteer/blob/main/README.md) (2026-11-14; downloads, features, identity); [Official license text or upstream licensing metadata](https://github.com/puppeteer/puppeteer/blob/main/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/puppeteer/puppeteer#installation) (2026-11-14; downloads); [Official documentation: Supported host requirements for browser automation on Windows, macOS and Linux.](https://pptr.dev/next/guides/system-requirements) (2026-11-14; platforms); [Public upstream app/package distribution: unauthenticated availability checked](https://registry.npmjs.org/puppeteer/-/puppeteer-25.17.0.tgz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/puppeteer/puppeteer/releases/tag/browsers-v3.2.7) (2026-11-14; downloads, maintenance)

## Compiler and build caching

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fbuild-caching)

### ccache

Compiler wrapper that reuses cached compilation results when equivalent work repeats.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0-or-later. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Reduce repeated C/C++ compilation work across local builds.
- **Compare when:** Cache effectiveness depends on compiler flags and repeated inputs; unsupported options can prevent caching and cache misses add overhead.
- **Strengths:** Repeated builds can reuse eligible object files instead of recompiling them.
- **Limitations:** Cache effectiveness depends on compiler flags and repeated inputs; unsupported options can prevent caching and cache misses add overhead.
- **Maintenance:** active — An upstream release was observed dated 2026-11-08. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/ccache/ccache/releases/tag/v4.14.3))
- [Official project](https://ccache.dev/) · [Official installation / downloads](https://ccache.dev/download.html) · [Repository](https://github.com/ccache/ccache)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/ccache/ccache/HEAD/README.md) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/ccache/ccache/HEAD/LICENSE.adoc) (2026-11-14; license); [Official downloads or installation instructions](https://ccache.dev/download.html) (2026-11-14; downloads); [Official documentation: Documented compiler, language and host combinations; cache effectiveness depends on cacheable compilation inputs.](https://ccache.dev/platform-compiler-language-support.html) (2026-11-14; platforms, features); [Official documentation: Free compiler-cache utility distributed under GPL-3.0-or-later.](https://ccache.dev/) (2026-11-14; pricing, license, features); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/ccache/ccache/releases/download/v4.14.3/ccache-4.14.3-windows-x86_64.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/ccache/ccache/releases/tag/v4.14.3) (2026-11-14; downloads, maintenance)
### sccache

Compiler cache for Rust and native languages with local, remote and distributed compilation options.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Share eligible Rust or C/C++ compilation results between builds.
- **Compare when:** Remote services need credentials and may cost money; cacheability and distributed support vary by compiler and build flags.
- **Strengths:** The same wrapper can reuse compilation results locally and across CI workers.
- **Limitations:** Remote services need credentials and may cost money; cacheability and distributed support vary by compiler and build flags.
- **Maintenance:** active — An upstream release was observed dated 2026-10-24. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/mozilla/sccache/releases/tag/v0.19.0))
- [Official project](https://github.com/mozilla/sccache) · [Official installation / downloads](https://github.com/mozilla/sccache/releases) · [Repository](https://github.com/mozilla/sccache)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/mozilla/sccache/HEAD/README.md) (2026-11-14; downloads, features, identity, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/mozilla/sccache/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/mozilla/sccache/releases) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/mozilla/sccache/releases/download/v0.19.0/sccache-v0.19.0-x86_64-pc-windows-msvc.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/mozilla/sccache/releases/tag/v0.19.0) (2026-11-14; downloads, maintenance)

## Build systems

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fbuild-systems)

### Bazel

Multi-language build and test system using explicit targets, dependency analysis and caching.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Official README states Windows, macOS and Linux host support.
- **Pricing details:** Public binaries and source are free; remote execution and cache infrastructure are separate.
- **Pick for:** A multi-language codebase needs a shared build graph and caching strategy.
- **Compare when:** Choose CMake or Meson for conventional native projects where their ecosystem fits better.
- **Strengths:** Explicit build graph can serve large mixed-language repositories; Shared rules support reproducible build environments when configured correctly
- **Limitations:** Rule and toolchain setup is substantial; Hermeticity depends on declared inputs and correct toolchain configuration
- **Maintenance:** active — Official release 9.3.2 is dated 2026-11-05; installation and performance were not independently tested. ([evidence](https://github.com/bazelbuild/bazel/releases/tag/9.3.2))
- [Official project](https://bazel.build/) · [Official installation / downloads](https://bazel.build/install) · [Repository](https://github.com/bazelbuild/bazel)
- **Sources:** [Official product overview](https://bazel.build/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/bazelbuild/bazel/master/README.md) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/bazelbuild/bazel/master/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://bazel.build/install) (2026-11-15; downloads); [Official dated release](https://github.com/bazelbuild/bazel/releases/tag/9.3.2) (2026-11-15; maintenance, downloads)
### Buck2

Multi-language build system with an incremental computation engine, explicit targets and remote execution support.

- **Platforms:** Windows, macOS, Linux. **License:** MIT OR Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Official installation guide covers Windows, macOS and Linux; source builds need the documented Rust toolchain.
- **Pricing details:** Public source and release binaries are free under dual licenses; remote execution infrastructure is separate.
- **Pick for:** A large repository needs explicit cross-language dependencies and a custom build platform.
- **Compare when:** Benchmark a representative build against Bazel or existing tooling before migrating.
- **Strengths:** One graph can coordinate builds across language boundaries; Pinned releases can align developer and CI tool versions
- **Limitations:** Rule and toolchain migration requires engineering work; Latest-tag binaries move frequently; pin a reviewed version for reproducible use
- **Maintenance:** unverified — Official product and installation material reviewed; a recent dated release was not established for this product scope.
- [Official project](https://buck2.build/) · [Official installation / downloads](https://buck2.build/docs/getting_started/install/) · [Repository](https://github.com/meta/buck2)
- **Sources:** [Official product overview](https://buck2.build/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/facebook/buck2/main/README.md) (2026-11-15; identity, features, downloads, pricing); [Official licensing terms](https://raw.githubusercontent.com/facebook/buck2/main/LICENSE-APACHE) (2026-11-15; license); [Documented deployment and platform scope](https://buck2.build/docs/getting_started/install/) (2026-11-15; platforms, downloads)
### CMake

Build-system generator with toolchain configuration, testing and packaging utilities.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** BSD-3-Clause. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Build a native project across compiler and operating-system combinations.
- **Compare when:** CMake does not provide the compiler itself, and project-specific dependency discovery still needs configuration.
- **Strengths:** A shared project description can target different compilers and native build tools.
- **Limitations:** CMake does not provide the compiler itself, and project-specific dependency discovery still needs configuration.
- **Maintenance:** active — An upstream release was observed dated 2026-11-12. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/Kitware/CMake/releases/tag/v4.5.0))
- [Official project](https://cmake.org/) · [Official installation / downloads](https://cmake.org/download/) · [Repository](https://github.com/Kitware/CMake)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/Kitware/CMake/HEAD/README.rst) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/Kitware/CMake/HEAD/LICENSE.rst) (2026-11-14; license); [Official downloads or installation instructions](https://cmake.org/download/) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/Kitware/CMake/releases/download/v4.5.0/cmake-4.5.0-windows-x86_64.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/Kitware/CMake/releases/tag/v4.5.0) (2026-11-14; downloads, maintenance)
### Meson

Build configuration system with declarative project files, dependency discovery and integrated testing.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Define a native build and test workflow in concise project files.
- **Compare when:** A supported Python runtime, compiler and chosen backend are required; existing CMake projects need deliberate migration.
- **Strengths:** Its project language and out-of-source builds help organize native application builds.
- **Limitations:** A supported Python runtime, compiler and chosen backend are required; existing CMake projects need deliberate migration.
- **Maintenance:** active — An upstream release was observed dated 2026-09-22. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/mesonbuild/meson/releases/tag/1.12.1))
- [Official project](https://mesonbuild.com/) · [Official installation / downloads](https://mesonbuild.com/Getting-meson.html) · [Repository](https://github.com/mesonbuild/meson)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/mesonbuild/meson/HEAD/README.md) (2026-11-14; downloads, features, identity); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/mesonbuild/meson/HEAD/COPYING) (2026-11-14; license); [Official downloads or installation instructions](https://mesonbuild.com/Getting-meson.html) (2026-11-14; downloads); [Official documentation: Meson is distributed under Apache License 2.0.](https://mesonbuild.com/legal.html) (2026-11-14; license); [Official documentation: Windows, macOS and Linux are supported for build configuration.](https://mesonbuild.com/SimpleStart.html) (2026-11-14; platforms, features); [Public upstream app/package distribution: unauthenticated availability checked](https://files.pythonhosted.org/packages/57/99/36cd25f9598eef70db97577440a70a360af505f6f01c2338a18d1556079c/meson-1.12.1-py3-none-any.whl) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/mesonbuild/meson/releases/tag/1.12.1) (2026-11-14; downloads, maintenance)
### Ninja

Small build executor commonly used as the backend for generated native-code build graphs.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Execute a generated native build graph incrementally.
- **Compare when:** Build files are normally generated by another tool; Ninja does not replace compiler discovery or project configuration.
- **Strengths:** A focused executor works well behind generators such as CMake and Meson.
- **Limitations:** Build files are normally generated by another tool; Ninja does not replace compiler discovery or project configuration.
- **Maintenance:** active — An upstream release was observed dated 2025-11-20. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/ninja-build/ninja/releases/tag/v1.13.2))
- [Official project](https://ninja-build.org/) · [Official installation / downloads](https://github.com/ninja-build/ninja/releases) · [Repository](https://github.com/ninja-build/ninja)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/ninja-build/ninja/HEAD/README.md) (2026-11-14; downloads, features, identity, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/ninja-build/ninja/HEAD/COPYING) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/ninja-build/ninja/releases) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/ninja-build/ninja/releases/download/v1.13.2/ninja-win.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/ninja-build/ninja/releases/tag/v1.13.2) (2026-11-14; downloads, maintenance)
### SCons

Build automation tool that expresses dependency and construction rules as Python programs.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Official README documents Windows, macOS, Linux and other POSIX hosts; supported Python is required.
- **Pricing details:** Public Python package and source are free under MIT.
- **Pick for:** Your build needs programmable Python rules and custom construction steps.
- **Compare when:** Compare Meson for a more constrained build definition or Bazel for shared remote execution.
- **Strengths:** General Python logic can express specialized build steps; Built-in scanners cover common native languages
- **Limitations:** Build scripts require Python knowledge; Performance and caching depend on project design rather than language alone
- **Maintenance:** active — Official release 4.11.1 is dated 2026-08-27; installation and performance were not independently tested. ([evidence](https://github.com/SCons/scons/releases/tag/4.11.1))
- [Official project](https://scons.org/) · [Official installation / downloads](https://scons.org/pages/download.html) · [Repository](https://github.com/SCons/scons)
- **Sources:** [Official product overview](https://scons.org/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/SCons/scons/master/README.rst) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/SCons/scons/master/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://scons.org/pages/download.html) (2026-11-15; downloads); [Official dated release](https://github.com/SCons/scons/releases/tag/4.11.1) (2026-11-15; maintenance, downloads)

## Business intelligence and data reports

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fbusiness-intelligence)

### Apache Superset

SQL-oriented analytics application with chart builders, dashboards and a dataset semantic layer.

- **Platforms:** Web. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Server-hosted browser application; follow the current administrative deployment requirements.
- **Pricing details:** Apache source and public packages have no product fee; infrastructure and commercial hosting are separate.
- **Pick for:** An analytics team needs self-hosted dashboards and direct SQL exploration.
- **Compare when:** Compare Metabase when simpler visual questions matter more than detailed chart configuration.
- **Strengths:** Rich visualization choices work with many SQL data sources; Dataset definitions can centralize shared analytical logic
- **Limitations:** Production deployment and database drivers need administration; Permissions do not replace controls in the underlying database
- **Maintenance:** active — Official release 6.1.0 is dated 2026-05-13; installation and performance were not independently tested. ([evidence](https://github.com/apache/superset/releases/tag/6.1.0))
- [Official project](https://superset.apache.org/) · [Official installation / downloads](https://superset.apache.org/admin-docs/) · [Repository](https://github.com/apache/superset)
- **Sources:** [Official product overview](https://superset.apache.org/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/apache/superset/master/README.md) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/apache/superset/master/LICENSE.txt) (2026-11-15; license); [Official download or installation entry point](https://superset.apache.org/admin-docs/) (2026-11-15; downloads); [Official dated release](https://github.com/apache/superset/releases/tag/6.1.0) (2026-11-15; maintenance, downloads)
### Evidence Core

Code-based framework for analytical reports and data applications built with SQL, Markdown and reusable components.

- **Platforms:** Windows, macOS, Linux, Web. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** Local CLI supports Windows x64, macOS Intel/Apple Silicon, and Linux x64/ARM64; deployed reports are accessed through a browser.
- **Pricing details:** Open-source code and a public installation route are documented. A separate explicit pricing statement for the current distribution was not established in this review.
- **Pick for:** You want analytical reports in reviewable source files and can maintain a local or hosted deployment.
- **Compare when:** Compare Metabase or Superset for a browser-oriented BI authoring workflow and verify any Studio-only requirements.
- **Strengths:** Report definitions can be versioned and reviewed with the rest of a project; Connects explanatory narrative with analytical queries and reusable metrics
- **Limitations:** Evidence Studio hosting, agent and governance features are separate from the MIT framework; Existing projects need to distinguish current Core syntax and deployment from the previous framework
- **Maintenance:** active — The official August 26, 2026 announcement introduces Evidence Core and distinguishes it from hosted Evidence Studio. The older repository package release is not used as evidence for this newer CLI. ([evidence](https://evidence.dev/blog/evidence-core))
- [Official project](https://evidence.dev/) · [Official installation / downloads](https://docs.evidence.dev/cli) · [Repository](https://github.com/evidence-dev/evidence)
- **Sources:** [Official project documentation](https://github.com/evidence-dev/evidence/blob/main/README.md) (2026-11-16; identity, features, platforms, downloads); [Official application and dependency licensing](https://github.com/evidence-dev/evidence/blob/main/LICENSE) (2026-11-16; license); [Official CLI and supported platforms](https://docs.evidence.dev/cli) (2026-11-16; platforms, downloads, features); [Official Core launch and Studio distinction](https://evidence.dev/blog/evidence-core) (2026-11-16; identity, features, maintenance)
### Metabase

Business intelligence application with visual questions, SQL queries, dashboards and reports.

- **Platforms:** Web. **License:** AGPL-3.0 Open Source; enterprise and embedding files have separate terms. **Pricing model:** freemium.
- **Compatibility details:** Browser application deployed as Java service or container; a database connection and application storage are required.
- **Pricing details:** Open Source edition is free and self-hosted; paid cloud and enterprise editions are separate.
- **Pick for:** A team needs approachable questions and dashboards over an existing database.
- **Compare when:** Compare Superset for a SQL-centered analytics team and check commercial plan boundaries.
- **Strengths:** Non-SQL users can explore configured datasets; Self-hosted deployment can sit alongside existing databases
- **Limitations:** Database access and permissions need careful configuration; Enterprise governance, embedding and AI capabilities vary by plan
- **Maintenance:** active — Official release v0.65.4 is dated 2026-11-13; installation and performance were not independently tested. ([evidence](https://github.com/metabase/metabase/releases/tag/v0.65.4))
- [Official project](https://www.metabase.com/) · [Official installation / downloads](https://www.metabase.com/start/oss) · [Repository](https://github.com/metabase/metabase)
- **Sources:** [Official product overview](https://www.metabase.com/) (2026-11-15; identity, features, pricing); [Official project documentation](https://raw.githubusercontent.com/metabase/metabase/master/README.md) (2026-11-15; identity, features, downloads, platforms); [Official licensing terms](https://raw.githubusercontent.com/metabase/metabase/master/LICENSE.txt) (2026-11-15; license); [Official download or installation entry point](https://www.metabase.com/start/oss) (2026-11-15; downloads); [Official dated release](https://github.com/metabase/metabase/releases/tag/v0.65.4) (2026-11-15; maintenance, downloads)

## Text and code editors

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fcode-editors)

### Geany

GTK programmer's editor offering project management, symbol navigation, syntax highlighting, and build commands.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Edit and compile small projects using a straightforward desktop editor.
- **Compare when:** It offers a smaller integrated tooling surface than a full IDE.
- **Strengths:** Build commands and symbol navigation suit small projects without requiring a full IDE workflow.
- **Limitations:** It offers a smaller integrated tooling surface than a full IDE.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-01. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/geany/geany))
- [Official project](https://www.geany.org/) · [Official installation / downloads](https://github.com/geany/geany/releases) · [Repository](https://github.com/geany/geany)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/geany/geany) (2026-11-14; identity, maintenance, license); [Official official documentation](https://www.geany.org/) (2026-11-14; identity, features, platforms); [Official readme detail documentation](https://raw.githubusercontent.com/geany/geany/HEAD/README) (2026-11-14; identity, features); [Official release inspected: 2.1.0](https://github.com/geany/geany/releases/tag/2.1.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/geany/geany/releases/download/2.1.0/geany-2.1_setup.exe) (2026-11-15; downloads, pricing)
### Helix

Modal terminal editor with multiple selections, syntax-aware editing, and integrated language-server support.

- **Platforms:** Windows, macOS, Linux. **License:** MPL-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Edit source code in a terminal with core IDE-like navigation built in.
- **Compare when:** Its selection-first key model differs from Vim and takes practice.
- **Strengths:** Core language navigation and structural selections work together without assembling a large plugin collection.
- **Limitations:** Its selection-first key model differs from Vim and takes practice.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-12. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/helix-editor/helix))
- [Official project](https://helix-editor.com/) · [Official installation / downloads](https://github.com/helix-editor/helix/releases) · [Repository](https://github.com/helix-editor/helix)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/helix-editor/helix) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/helix-editor/helix/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://helix-editor.com/) (2026-11-14; identity, features); [Official release inspected: 25.07.1](https://github.com/helix-editor/helix/releases/tag/25.07.1) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/helix-editor/helix/releases/download/25.07.1/helix-25.07.1-x86_64-windows.zip) (2026-11-14; downloads, pricing)
### Kate

KDE advanced text editor with split views, sessions, project support, and language-server integration.

- **Platforms:** Windows, macOS, Linux. **License:** LGPL-2.0-or-later and MIT components; see per-file SPDX declarations. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Manage many source and configuration files in a session-oriented graphical editor.
- **Compare when:** Official macOS downloads are nightly testing packages; operating-system packaging and desktop integration vary.
- **Strengths:** Sessions and split views help keep several related files and projects organized.
- **Limitations:** Official macOS downloads are nightly testing packages; operating-system packaging and desktop integration vary.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/KDE/kate))
- [Official project](https://kate-editor.org/) · [Official installation / downloads](https://kate-editor.org/get-it/) · [Repository](https://github.com/KDE/kate)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/KDE/kate) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/KDE/kate/HEAD/README.md) (2026-11-14; identity, features, license); [Official license text](https://raw.githubusercontent.com/KDE/kate/HEAD/LICENSES/LGPL-2.0-or-later.txt) (2026-11-14; license); [Official official documentation](https://kate-editor.org/) (2026-11-14; identity, features); [Official platforms download documentation](https://kate-editor.org/get-it/) (2026-11-14; downloads, features, identity, platforms, pricing)
### Lapce

Rust-based graphical editor with language-server support, modal editing, and remote-development capabilities.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Evaluate a native editor for source navigation and remote development.
- **Compare when:** Extension breadth and workflow compatibility should be checked against the languages you use.
- **Strengths:** LSP and remote-development support provide a native-editor alternative for compatible workflows.
- **Limitations:** Extension breadth and workflow compatibility should be checked against the languages you use.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-10-09. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/lapce/lapce))
- [Official project](https://lap.dev/lapce/) · [Official installation / downloads](https://github.com/lapce/lapce/releases) · [Repository](https://github.com/lapce/lapce)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/lapce/lapce) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/lapce/lapce/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://lap.dev/lapce/) (2026-11-14; identity, features); [Official release inspected: v0.4.6](https://github.com/lapce/lapce/releases/tag/v0.4.6) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/lapce/lapce/releases/download/v0.4.6/Lapce-windows.msi) (2026-11-14; downloads, pricing)
### Lite XL

Small extensible graphical text editor with Lua plugins, syntax highlighting, and split views.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Keep a focused editor for scripts and small projects.
- **Compare when:** Language intelligence usually requires selecting and configuring extra plugins.
- **Strengths:** A focused core and Lua extensions let users add only the editing functions they need.
- **Limitations:** Language intelligence usually requires selecting and configuring extra plugins.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-10. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/lite-xl/lite-xl))
- [Official project](https://lite-xl.com/) · [Official installation / downloads](https://github.com/lite-xl/lite-xl/releases) · [Repository](https://github.com/lite-xl/lite-xl)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/lite-xl/lite-xl) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/lite-xl/lite-xl/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://lite-xl.com/) (2026-11-14; identity, features); [Official release inspected: v2.1.8](https://github.com/lite-xl/lite-xl/releases/tag/v2.1.8) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/lite-xl/lite-xl/releases/download/v2.1.8/lite-xl-v2.1.8-windows-x86_64.zip) (2026-11-14; downloads, pricing)
### Micro

Terminal text editor with familiar keybindings, mouse support, syntax highlighting, and plugins.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Edit files in a terminal without first learning a modal editor.
- **Compare when:** It is a text editor rather than a complete integrated build and debugging environment.
- **Strengths:** Conventional shortcuts lower the transition cost from graphical editors to terminal editing.
- **Limitations:** It is a text editor rather than a complete integrated build and debugging environment.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/micro-editor/micro))
- [Official project](https://micro-editor.github.io/) · [Official installation / downloads](https://github.com/micro-editor/micro/releases) · [Repository](https://github.com/micro-editor/micro)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/micro-editor/micro) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/micro-editor/micro/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://micro-editor.github.io/) (2026-11-14; identity, features); [Official release inspected: v2.0.15](https://github.com/micro-editor/micro/releases/tag/v2.0.15) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/micro-editor/micro/releases/download/v2.0.15/micro-2.0.15-win64.zip) (2026-11-14; downloads, pricing)
### Neovim

Extensible modal editor with Lua configuration, an embeddable API, and language-server integration.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0 with inherited Vim-licensed components. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Build a keyboard-driven programming environment across desktop operating systems.
- **Compare when:** A modal workflow and plugin configuration require an initial learning investment.
- **Strengths:** Lua configuration and an embeddable API support highly customized keyboard workflows.
- **Limitations:** A modal workflow and plugin configuration require an initial learning investment.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/neovim/neovim))
- [Official project](https://neovim.io/) · [Official installation / downloads](https://github.com/neovim/neovim/releases) · [Repository](https://github.com/neovim/neovim)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/neovim/neovim) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/neovim/neovim/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms, license); [Official license text](https://raw.githubusercontent.com/neovim/neovim/HEAD/LICENSE.txt) (2026-11-14; license); [Official official documentation](https://neovim.io/) (2026-11-14; identity, features); [Official release inspected: v0.12.6](https://github.com/neovim/neovim/releases/tag/v0.12.6) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/neovim/neovim/releases/download/v0.12.6/nvim-win64.msi) (2026-11-14; downloads, pricing)
### Notepad++

Text/code editing and language support

- **Platforms:** Windows. **License:** GPL-3.0 with project clarifications and exceptions. **Pricing model:** unknown.
- **Compatibility details:** Windows source editor
- **Pick for:** Text/code editing and language support
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Text/code editing and language support
- **Limitations:** Plugins execute code; test large files and encoding round trips; Potential source reference under listed license; retain notices and audit dependencies, exceptions, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/notepad-plus-plus/notepad-plus-plus) · [Repository](https://github.com/notepad-plus-plus/notepad-plus-plus)
- **Sources:** [Preserved original research source](https://github.com/notepad-plus-plus/notepad-plus-plus) (2026-11-14; identity, features); [Preserved original research source](https://github.com/notepad-plus-plus/notepad-plus-plus/blob/master/LICENSE) (2026-11-14; identity, features)
### Pulsar

Community-driven extensible text editor continuing Atom's package-based editing workflow.

- **Platforms:** Windows, macOS, Linux. **License:** MIT; bundled dependencies retain their licenses. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Retain an Atom-like editing workflow with a maintained community distribution.
- **Compare when:** Atom-era packages vary in maintenance and compatibility.
- **Strengths:** Its package-based model gives existing Atom users a familiar migration path.
- **Limitations:** Atom-era packages vary in maintenance and compatibility.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/pulsar-edit/pulsar))
- [Official project](https://pulsar-edit.dev/) · [Official installation / downloads](https://github.com/pulsar-edit/pulsar/releases) · [Repository](https://github.com/pulsar-edit/pulsar)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/pulsar-edit/pulsar) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/pulsar-edit/pulsar/HEAD/README.md) (2026-11-14; identity, features); [Official license text](https://raw.githubusercontent.com/pulsar-edit/pulsar/HEAD/LICENSE.md) (2026-11-14; license); [Official official documentation](https://pulsar-edit.dev/) (2026-11-14; identity, features); [Official release inspected: v1.133.1](https://github.com/pulsar-edit/pulsar/releases/tag/v1.133.1) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/pulsar-edit/pulsar/releases/download/v1.133.1/Windows.Pulsar-1.133.1-win.zip) (2026-11-14; downloads, pricing)
### Sublime Text

Commercial text editor with multiple selections, project navigation, syntax-aware editing, and a plugin ecosystem.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary Sublime Text license; free evaluation, purchase required for continued use. **Pricing model:** paid.
- **Pick for:** Use a paid graphical editor for intensive text manipulation and configurable coding workflows.
- **Compare when:** Evaluation is not a free-use license; plugins and language-server workflows may require extra configuration.
- **Strengths:** Multiple selections and navigation commands support focused text editing across desktop systems.
- **Limitations:** Evaluation is not a free-use license; plugins and language-server workflows may require extra configuration.
- **Maintenance:** active — Official download changelog lists Build 4215 dated 25 September 2026; no local installation or comparative benchmark performed. ([evidence](https://www.sublimetext.com/download))
- [Official project](https://www.sublimetext.com/) · [Official installation / downloads](https://www.sublimetext.com/download)
- **Sources:** [Official features and supported platforms](https://www.sublimetext.com/) (2026-11-14; identity, features, platforms); [Official downloads, evaluation terms and dated changelog](https://www.sublimetext.com/download) (2026-11-14; downloads, platforms, pricing, license, maintenance)
### Vim

Highly configurable modal text editor with scripting, macros, and extensive text manipulation commands.

- **Platforms:** Windows, macOS, Linux. **License:** Vim. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Edit configuration and source files consistently on local and remote machines.
- **Compare when:** Advanced configuration and modes can feel unfamiliar to GUI-editor users.
- **Strengths:** Motions, operators, macros, and registers compose into repeatable text transformations.
- **Limitations:** Advanced configuration and modes can feel unfamiliar to GUI-editor users.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/vim/vim))
- [Official project](https://www.vim.org/) · [Official installation / downloads](https://www.vim.org/download.php) · [Repository](https://github.com/vim/vim)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/vim/vim) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/vim/vim/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official official documentation](https://www.vim.org/) (2026-11-14; identity, features); [Public upstream app/package distribution: availability without payment or authentication checked](https://www.vim.org/downloads/gvim_9.2.0000_x64.exe) (2026-11-14; downloads, pricing); [Official source: Official Windows installers, Unix builds and macOS distribution guidance.](https://www.vim.org/download.php) (2026-11-14; downloads, platforms)
### Visual Studio Code

Graphical code editor with debugging, integrated terminals, source-control support, and extensions.

- **Platforms:** Windows, macOS, Linux. **License:** MIT for Code-OSS source; Microsoft product license for official Visual Studio Code binaries. **Pricing model:** free.
- **Pick for:** Develop in several languages with a widely supported debugger and extension ecosystem.
- **Compare when:** Microsoft's downloaded product terms differ from the MIT-licensed source repository.
- **Strengths:** Debugging, terminals, extensions, and source control share one general-purpose workspace.
- **Limitations:** Microsoft's downloaded product terms differ from the MIT-licensed source repository.; Windows User/System installers do not support portable mode; ZIP builds require manual updates by transferring data to a newer extracted build.; Portable mode still uses system temporary storage unless data/tmp exists. Its data folder overrides --user-data-dir and --extensions-dir.; Linux sandbox configuration and macOS quarantine can affect portable startup. Third-party tools, credentials and all filesystem writes have not been independently audited; portable mode is not a security boundary.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/microsoft/vscode))
- [Official project](https://code.visualstudio.com/) · [Official installation / downloads](https://code.visualstudio.com/Download) · [Repository](https://github.com/microsoft/vscode)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/microsoft/vscode) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/microsoft/vscode/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://code.visualstudio.com/) (2026-11-14; features, identity, platforms, pricing); [Official release inspected: 1.146.0](https://github.com/microsoft/vscode/releases/tag/1.146.0) (2026-11-14; downloads, maintenance); [Official portable distribution, data, update and temporary-storage constraints](https://code.visualstudio.com/docs/setup/portable) (2026-11-17; features, downloads)
### VSCodium

Community-built binaries of Microsoft's open-source VS Code editor code with a separate distribution configuration.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Use a familiar graphical code editor while choosing an independently built distribution.
- **Compare when:** Some Microsoft Marketplace extensions have distribution or compatibility restrictions.
- **Strengths:** An independent binary distribution retains much of the familiar VS Code editing model.
- **Limitations:** Some Microsoft Marketplace extensions have distribution or compatibility restrictions.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-10-31. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/VSCodium/vscodium))
- [Official project](https://vscodium.com/) · [Official installation / downloads](https://github.com/VSCodium/vscodium/releases) · [Repository](https://github.com/VSCodium/vscodium)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/VSCodium/vscodium) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/VSCodium/vscodium/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://vscodium.com/) (2026-11-14; identity, features); [Official release inspected: 1.143.17232](https://github.com/VSCodium/vscodium/releases/tag/1.143.17232) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/VSCodium/vscodium/releases/download/1.143.17232/VSCodium-x64-1.143.17232.msi) (2026-11-14; downloads, pricing)
### Zed

Collaborative graphical code editor with language tooling, terminal integration, and optional AI assistance.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0-or-later; Apache-2.0 components where marked. **Pricing model:** freemium.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Pair on source code in an editor with integrated communication and language navigation.
- **Compare when:** AI and collaboration services have separate availability and service terms.
- **Strengths:** Shared editing and integrated language tooling support collaborative code work.
- **Limitations:** AI and collaboration services have separate availability and service terms.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/zed-industries/zed))
- [Official project](https://zed.dev/) · [Official installation / downloads](https://github.com/zed-industries/zed/releases) · [Repository](https://github.com/zed-industries/zed)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/zed-industries/zed) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/zed-industries/zed/HEAD/README.md) (2026-11-14; identity, features, platforms, license); [Official official documentation](https://zed.dev/) (2026-11-14; identity, features); [Official release inspected: v1.28.1](https://github.com/zed-industries/zed/releases/tag/v1.28.1) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/zed-industries/zed/releases/download/v1.28.1/Zed-x86_64.exe) (2026-11-15; downloads, pricing); [Official source: Free editor use and optional paid hosted-AI/team plans.](https://zed.dev/docs/account/plans-and-pricing) (2026-11-14; pricing)

## Code and configuration linting

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fcode-linting)

### actionlint

Static checker for GitHub Actions syntax, expressions, workflow dependencies and action usage.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Official installation documentation provides release binaries and package-manager options for Windows, macOS and Linux.
- **Pricing details:** Public binaries and source are free under MIT.
- **Pick for:** You want local validation of GitHub Actions configuration and expressions.
- **Compare when:** Retain actual CI execution to verify permissions, service access and runner behavior.
- **Strengths:** Finds mistakes before a hosted workflow starts; Checks workflow semantics beyond generic YAML syntax
- **Limitations:** Cannot reproduce every hosted runner or action behavior; Embedded script checks require optional external analyzers
- **Maintenance:** active — Official release v1.7.12 is dated 2026-03-30; installation and performance were not independently tested. ([evidence](https://github.com/rhysd/actionlint/releases/tag/v1.7.12))
- [Official project](https://github.com/rhysd/actionlint) · [Official installation / downloads](https://github.com/rhysd/actionlint/blob/main/docs/install.md) · [Repository](https://github.com/rhysd/actionlint)
- **Sources:** [Official product overview](https://github.com/rhysd/actionlint) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/rhysd/actionlint/main/README.md) (2026-11-15; identity, features, downloads, pricing); [Official licensing terms](https://raw.githubusercontent.com/rhysd/actionlint/main/LICENSE.txt) (2026-11-15; license); [Documented deployment and platform scope](https://raw.githubusercontent.com/rhysd/actionlint/main/docs/install.md) (2026-11-15; platforms); [Official download or installation entry point](https://github.com/rhysd/actionlint/blob/main/docs/install.md) (2026-11-15; downloads); [Official dated release](https://github.com/rhysd/actionlint/releases/tag/v1.7.12) (2026-11-15; maintenance, downloads)
### Hadolint

Dockerfile linter that checks build instructions and ShellCheck diagnostics in embedded shell commands.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Compatibility details:** Official README documents Windows, macOS and Linux binaries, package managers and container execution.
- **Pricing details:** Public binaries and source are free under GPL.
- **Pick for:** You need consistent Dockerfile and embedded-shell checks before building images.
- **Compare when:** Pair with an image vulnerability scanner and real build tests for other failure classes.
- **Strengths:** Combines Dockerfile and shell checks in one CLI; Severity and rule configuration suit project policies
- **Limitations:** Passing lint does not establish image security or reproducibility; Intentional build patterns may need documented exclusions
- **Maintenance:** active — Official release v2.15.1 is dated 2026-07-31; installation and performance were not independently tested. ([evidence](https://github.com/hadolint/hadolint/releases/tag/v2.15.1))
- [Official project](https://github.com/hadolint/hadolint) · [Official installation / downloads](https://github.com/hadolint/hadolint#install) · [Repository](https://github.com/hadolint/hadolint)
- **Sources:** [Official product overview](https://github.com/hadolint/hadolint) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/hadolint/hadolint/master/README.md) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/hadolint/hadolint/master/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://github.com/hadolint/hadolint#install) (2026-11-15; downloads); [Official dated release](https://github.com/hadolint/hadolint/releases/tag/v2.15.1) (2026-11-15; maintenance, downloads)
### Ruff

Python linter and formatter combining configurable rules, fixes and project-level configuration.

- **Platforms:** Windows, macOS, Linux. **License:** MIT; bundled third-party notices apply. **Pricing model:** free.
- **Compatibility details:** Official README supplies native macOS, Linux and Windows installation instructions.
- **Pricing details:** Official package and standalone distributions are free; no product subscription is required.
- **Pick for:** You want a consolidated lint-and-format tool for Python code.
- **Compare when:** Retain a dedicated type checker and review rule compatibility when migrating existing projects.
- **Strengths:** A shared configuration can cover linting, import organization and formatting; Standalone binaries and Python package distribution fit different environments
- **Limitations:** Rule parity with older plugin stacks is not exact; Automatic fixes still need review and type checking remains separate
- **Maintenance:** active — Official release 0.17.5 is dated 2026-11-12; installation and performance were not independently tested. ([evidence](https://github.com/astral-sh/ruff/releases/tag/0.17.5))
- [Official project](https://docs.astral.sh/ruff/) · [Official installation / downloads](https://github.com/astral-sh/ruff#installation) · [Repository](https://github.com/astral-sh/ruff)
- **Sources:** [Official product overview](https://docs.astral.sh/ruff/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/astral-sh/ruff/main/README.md) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/astral-sh/ruff/main/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://github.com/astral-sh/ruff#installation) (2026-11-15; downloads); [Official dated release](https://github.com/astral-sh/ruff/releases/tag/0.17.5) (2026-11-15; maintenance, downloads)
### ShellCheck

Static analyzer for shell scripts that identifies quoting, syntax, portability and semantic pitfalls.

- **Platforms:** Windows, macOS, Linux, FreeBSD, Web. **License:** GPL-3.0. **Pricing model:** free.
- **Compatibility details:** Official README lists Windows, macOS, Linux and FreeBSD installation plus a web interface.
- **Pricing details:** Free GPL tool with public binaries and packages; web playground is optional.
- **Pick for:** You maintain shell scripts and want early feedback on common semantic errors.
- **Compare when:** Use Bats-core as a complement to verify actual execution behavior.
- **Strengths:** Explains common shell mistakes at the offending line; CLI use fits local checks and CI
- **Limitations:** Static analysis does not execute or prove a script correct; Shell dialect and intentional exceptions need configuration
- **Maintenance:** active — Official release v0.11.0 is dated 2025-08-04; installation and performance were not independently tested. ([evidence](https://github.com/koalaman/shellcheck/releases/tag/v0.11.0))
- [Official project](https://www.shellcheck.net/) · [Official installation / downloads](https://github.com/koalaman/shellcheck#installing) · [Repository](https://github.com/koalaman/shellcheck)
- **Sources:** [Official product overview](https://www.shellcheck.net/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/koalaman/shellcheck/master/README.md) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/koalaman/shellcheck/master/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://github.com/koalaman/shellcheck#installing) (2026-11-15; downloads); [Official dated release](https://github.com/koalaman/shellcheck/releases/tag/v0.11.0) (2026-11-15; maintenance, downloads)

## Data application frameworks

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fdata-app-frameworks)

### SQLPage

SQL-driven web application server that turns queries into forms, tables, charts and data-editing pages.

- **Platforms:** Windows, macOS, Linux, Web. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Local executable or container serves browser pages. Release binaries cover Linux/Windows x86-64 and Apple Silicon macOS; Intel Macs use Homebrew and may require a source build.
- **Pricing details:** The local open-source application is available without a license fee. Optional hosting, support, dependencies and infrastructure have separate terms.
- **Pick for:** You want a small data-centric web application and prefer defining its behavior in SQL.
- **Compare when:** Compare Evidence Core for analytical reports or Appsmith when a visual application builder fits the team better.
- **Strengths:** SQL practitioners can build a small data application without maintaining a separate JavaScript frontend; A standalone server and SQL files keep deployment inputs visible
- **Limitations:** Application authors still own SQL permissions, authentication configuration and data validation; Connector drivers and platform architecture can require additional setup
- **Maintenance:** active — Official release v0.48.0 is dated 2026-11-12. This is a release observation; installation and performance were not independently tested. ([evidence](https://github.com/sqlpage/SQLPage/releases/tag/v0.48.0))
- [Official project](https://sql-page.com/) · [Official installation / downloads](https://sql-page.com/your-first-sql-website/) · [Repository](https://github.com/sqlpage/SQLPage)
- **Sources:** [Official project documentation](https://github.com/sqlpage/SQLPage/blob/main/README.md) (2026-11-16; identity, features, platforms, downloads); [Official application and dependency licensing](https://github.com/sqlpage/SQLPage/blob/main/LICENSE.txt) (2026-11-16; license, pricing); [Official free software tutorial and platform qualifications](https://sql-page.com/your-first-sql-website/) (2026-11-16; downloads, platforms, pricing); [Official authentication setup](https://sql-page.com/sso/) (2026-11-16; features); [Official dated release and distribution](https://github.com/sqlpage/SQLPage/releases/tag/v0.48.0) (2026-11-16; maintenance, downloads)

## Command-line data processing

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fdata-cli)

### csvkit

Python command-line suite for converting, querying, cleaning, and analyzing CSV data.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Investigate CSV files and run SQL-style analysis from the command line.
- **Compare when:** Type inference and locale settings need review for identifiers and dates.
- **Strengths:** CSV conversion and SQL-style analysis connect shell workflows to tabular investigation.
- **Limitations:** Type inference and locale settings need review for identifiers and dates.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-09. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/wireservice/csvkit))
- [Official project](https://csvkit.readthedocs.io/en/latest/) · [Official installation / downloads](https://csvkit.readthedocs.io/en/latest/tutorial/1_getting_started.html) · [Repository](https://github.com/wireservice/csvkit)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/wireservice/csvkit) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/wireservice/csvkit/HEAD/README.rst) (2026-11-14; identity, features); [Official official documentation](https://csvkit.readthedocs.io/en/latest/) (2026-11-14; identity, features); [Official installation documentation](https://csvkit.readthedocs.io/en/latest/tutorial/1_getting_started.html) (2026-11-14; downloads); [Public upstream app/package distribution: availability without payment or authentication checked](https://files.pythonhosted.org/packages/41/76/7ffa26fcd79eb0a51daf73d18481d4d5214685545d27aadc5e76e01d522d/csvkit-2.2.0-py3-none-any.whl) (2026-11-14; downloads, pricing); [Official source: The current documentation explicitly supports maintained Python versions on Windows, macOS and Linux.](https://csvkit.readthedocs.io/en/latest/tricks.html) (2026-11-14; platforms)
### jq

Command-line processor for filtering, transforming, and formatting JSON data.

- **Platforms:** Windows, macOS, Linux. **License:** MIT (code); CC-BY-3.0 documentation and separate dependency terms. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Extract and transform JSON from APIs, logs, and configuration files.
- **Compare when:** Its expression language takes practice and very large inputs need suitable options.
- **Strengths:** JSON data can be filtered and transformed directly in scriptable pipelines.
- **Limitations:** Its expression language takes practice and very large inputs need suitable options.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-02. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/jqlang/jq))
- [Official project](https://jqlang.org/) · [Official installation / downloads](https://github.com/jqlang/jq/releases) · [Repository](https://github.com/jqlang/jq)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/jqlang/jq) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/jqlang/jq/HEAD/README.md) (2026-11-14; identity, features, downloads); [Official license text](https://raw.githubusercontent.com/jqlang/jq/HEAD/COPYING) (2026-11-14; license); [Official official documentation](https://jqlang.org/) (2026-11-14; identity, features); [Official release inspected: jq-1.8.2](https://github.com/jqlang/jq/releases/tag/jq-1.8.2) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/jqlang/jq/releases/download/jq-1.8.2/jq-win64.exe) (2026-11-14; downloads, pricing)
### Miller

Command-line data transformation tool for CSV, TSV, JSON, and record-oriented text.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-2-Clause. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Filter and aggregate tabular data without loading a spreadsheet.
- **Compare when:** Delimited-data edge cases and expressions should be checked against representative files.
- **Strengths:** Named-field operations keep tabular transformations readable as schemas change.
- **Limitations:** Delimited-data edge cases and expressions should be checked against representative files.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/johnkerl/miller))
- [Official project](https://miller.readthedocs.io/en/6.22.0/) · [Official installation / downloads](https://github.com/johnkerl/miller/releases) · [Repository](https://github.com/johnkerl/miller)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/johnkerl/miller) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/johnkerl/miller/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official license text](https://raw.githubusercontent.com/johnkerl/miller/HEAD/LICENSE.txt) (2026-11-14; license); [Official official documentation](https://miller.readthedocs.io/en/6.22.0/) (2026-11-14; identity, features); [Official release inspected: v6.22.0](https://github.com/johnkerl/miller/releases/tag/v6.22.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/johnkerl/miller/releases/download/v6.22.0/miller-6.22.0-windows-386.zip) (2026-11-14; downloads, pricing)
### qsv

Command-line toolkit for inspecting, validating, joining, and transforming CSV and other tabular data.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Audit and reshape large tabular files in repeatable pipelines.
- **Compare when:** The broad command set needs task-specific option choices and memory awareness.
- **Strengths:** Inspection and validation commands help diagnose data quality before downstream imports.
- **Limitations:** The broad command set needs task-specific option choices and memory awareness.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/dathere/qsv))
- [Official project](https://qsv.dathere.com/) · [Official installation / downloads](https://github.com/dathere/qsv/releases) · [Repository](https://github.com/dathere/qsv)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/dathere/qsv) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/dathere/qsv/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official license text](https://raw.githubusercontent.com/dathere/qsv/HEAD/LICENSE-MIT) (2026-11-14; license); [Official official documentation](https://qsv.dathere.com/) (2026-11-14; identity, features); [Official release inspected: 28.0.0](https://github.com/dathere/qsv/releases/tag/28.0.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/dathere/qsv/releases/download/28.0.0/qsv-28.0.0-x86_64-pc-windows-gnu.zip) (2026-11-14; downloads, pricing)
### sqlite-utils

Command-line utility for importing, transforming and querying SQLite databases from common data formats.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Import messy structured data into SQLite and build searchable tables.
- **Compare when:** SQLite version and extension availability depend on the Python distribution; transformations should be reviewed before updating valuable data.
- **Strengths:** Command pipelines can turn incoming records into queryable databases and add text search.
- **Limitations:** SQLite version and extension availability depend on the Python distribution; transformations should be reviewed before updating valuable data.
- **Maintenance:** active — An upstream release was observed dated 2026-08-13. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/simonw/sqlite-utils/releases/tag/4.2.1))
- [Official project](https://sqlite-utils.datasette.io/en/stable/) · [Official installation / downloads](https://sqlite-utils.datasette.io/en/stable/installation.html) · [Repository](https://github.com/simonw/sqlite-utils)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/simonw/sqlite-utils/HEAD/README.md) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/simonw/sqlite-utils/main/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://sqlite-utils.datasette.io/en/stable/installation.html) (2026-11-14; downloads, platforms); [Public upstream app/package distribution: unauthenticated availability checked](https://files.pythonhosted.org/packages/eb/d0/a20b9ea8686ea14f171582f3ce9f9b40b8fbb858fea744896191c09f2c2f/sqlite_utils-4.2.1-py3-none-any.whl) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/simonw/sqlite-utils/releases/tag/4.2.1) (2026-11-14; downloads, maintenance)
### VisiData

Keyboard-driven terminal interface for exploring, filtering and arranging tabular data from many formats.

- **Platforms:** macOS, Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Compatibility details:** Native Linux/macOS; the upstream Windows path uses WSL.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Explore a large or unfamiliar table interactively from a terminal.
- **Compare when:** Windows use is documented through WSL; some formats require optional Python packages and the keybindings take practice.
- **Strengths:** A terminal sheet view makes unfamiliar datasets inspectable before building a script.
- **Limitations:** Windows use is documented through WSL; some formats require optional Python packages and the keybindings take practice.
- **Maintenance:** active — An upstream release was observed dated 2026-10-28. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/saulpw/visidata/releases/tag/v3.5))
- [Official project](https://www.visidata.org/) · [Official installation / downloads](https://www.visidata.org/install/) · [Repository](https://github.com/saulpw/visidata)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/saulpw/visidata/HEAD/README.md) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/saulpw/visidata/HEAD/LICENSE.gpl3) (2026-11-14; license); [Official downloads or installation instructions](https://www.visidata.org/install/) (2026-11-14; downloads, platforms); [Public upstream app/package distribution: unauthenticated availability checked](https://files.pythonhosted.org/packages/e7/28/aed5a5bae24ad6085a3cf20c596e7789c43f142801b86df65500f0331ef9/visidata-3.5-py3-none-any.whl) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/saulpw/visidata/releases/tag/v3.5) (2026-11-14; downloads, maintenance)
### yq

Portable command-line processor for YAML and related structured formats using a jq-like expression syntax.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Update YAML configuration files in scripts and CI workflows.
- **Compare when:** Comment and whitespace preservation has documented limitations.
- **Strengths:** Structured YAML changes reduce reliance on brittle line-oriented replacements.
- **Limitations:** Comment and whitespace preservation has documented limitations.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-12. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/mikefarah/yq))
- [Official project](https://mikefarah.gitbook.io/yq) · [Official installation / downloads](https://github.com/mikefarah/yq/releases) · [Repository](https://github.com/mikefarah/yq)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/mikefarah/yq) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/mikefarah/yq/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://mikefarah.gitbook.io/yq) (2026-11-14; identity, features); [Official release inspected: v4.54.3](https://github.com/mikefarah/yq/releases/tag/v4.54.3) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/mikefarah/yq/releases/download/v4.54.3/yq_windows_386.exe) (2026-11-14; downloads, pricing)

## Data pipelines and orchestration

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fdata-pipelines)

### Apache Airflow

Workflow orchestration with code-defined tasks, schedules, execution history and a browser interface.

- **Platforms:** Linux, macOS, Web. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Official requirements specify POSIX/Linux and macOS for development; production is Linux, with a browser UI. Windows requires WSL or Linux containers.
- **Pricing details:** Apache source and packages have no product fee; infrastructure and managed offerings are separate.
- **Pick for:** A team needs scheduled multi-step workflows with visible task history.
- **Compare when:** Compare Prefect for Python-function workflows or Dagster when data assets are the organizing model.
- **Strengths:** Explicit task dependencies support repeatable batch workflows; Providers connect many external systems
- **Limitations:** Production deployment requires several operational components; Native Windows is not supported; use Linux containers or WSL for development
- **Maintenance:** active — Official release 3.4.0 is dated 2026-11-06; installation and performance were not independently tested. ([evidence](https://github.com/apache/airflow/releases/tag/3.4.0))
- [Official project](https://airflow.apache.org/) · [Official installation / downloads](https://github.com/apache/airflow#installing-from-pypi) · [Repository](https://github.com/apache/airflow)
- **Sources:** [Official product overview](https://airflow.apache.org/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/apache/airflow/main/README.md) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/apache/airflow/main/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://github.com/apache/airflow#installing-from-pypi) (2026-11-15; downloads); [Official dated release](https://github.com/apache/airflow/releases/tag/3.4.0) (2026-11-15; maintenance, downloads)
### Dagster

Data orchestration platform that models assets, dependencies, checks and materialization history.

- **Platforms:** Web. **License:** Apache-2.0. **Pricing model:** freemium.
- **Compatibility details:** Python tools and a self-hosted browser server; package and integration requirements apply.
- **Pricing details:** Open-source self-hosting is available; managed service and enterprise features have paid plans.
- **Pick for:** You want to organize pipelines around datasets and their dependencies.
- **Compare when:** Use Prefect for function-first workflows or a simpler runner for a single script.
- **Strengths:** Asset history connects pipeline execution to produced data; Local development shares concepts with production orchestration
- **Limitations:** Asset modeling adds an initial learning cost; Managed deployment and enterprise controls have separate plans
- **Maintenance:** active — Official release 1.13.30 is dated 2026-11-12; installation and performance were not independently tested. ([evidence](https://github.com/dagster-io/dagster/releases/tag/1.13.30))
- [Official project](https://dagster.io/) · [Official installation / downloads](https://github.com/dagster-io/dagster) · [Repository](https://github.com/dagster-io/dagster)
- **Sources:** [Official product overview](https://dagster.io/) (2026-11-15; identity, features, pricing); [Official project documentation](https://raw.githubusercontent.com/dagster-io/dagster/master/README.md) (2026-11-15; identity, features, downloads); [Official licensing terms](https://raw.githubusercontent.com/dagster-io/dagster/master/LICENSE) (2026-11-15; license); [Documented deployment and platform scope](https://raw.githubusercontent.com/dagster-io/dagster/master/python_modules/dagster/README.md) (2026-11-15; platforms); [Official download or installation entry point](https://github.com/dagster-io/dagster) (2026-11-15; downloads); [Official dated release](https://github.com/dagster-io/dagster/releases/tag/1.13.30) (2026-11-15; maintenance, downloads)
### dbt Core

Analytics transformation tooling that builds, tests and documents SQL models in a versioned project.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0 source; dbt product distribution is governed by a separate Product Licensing Agreement. **Pricing model:** unknown.
- **Compatibility details:** Current upstream v2 README lists macOS and Linux x86-64/ARM and Windows x86-64; Windows ARM is not yet supported.
- **Pricing details:** Current product distribution terms were reviewed, but a universal pricing classification was not established. Apache source and licensed binaries are distinguished.
- **Pick for:** You need reviewable SQL transformations and dependency-aware analytical builds.
- **Compare when:** Compare orchestration and ingestion tools separately; dbt does not replace every part of a data pipeline.
- **Strengths:** SQL transformations can follow source-control and review practices; Model dependencies and tests connect analytical tables to their definitions
- **Limitations:** Current v2 distribution and v1 Python Core have different installation and compatibility concerns; A supported database or warehouse and appropriate credentials are still required
- **Maintenance:** active — Official v2.0.0 release was published September 14, 2026. This supports the v2 line described here; the separate v1 Python Core release is not used to establish v2 maintenance. ([evidence](https://github.com/dbt-labs/dbt/releases/tag/v2.0.0))
- [Official project](https://www.getdbt.com/) · [Official installation / downloads](https://docs.getdbt.com/docs/local/install-dbt?version=2) · [Repository](https://github.com/dbt-labs/dbt)
- **Sources:** [Official product overview](https://www.getdbt.com/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/dbt-labs/dbt-core/main/README.md) (2026-11-15; identity, features, downloads, platforms); [Official licensing terms](https://www.getdbt.com/dbt-fusion-engine-license-agreement) (2026-11-15; license); [Official download or installation entry point](https://docs.getdbt.com/docs/local/install-dbt?version=2) (2026-11-15; downloads); [Official dated release for the documented v2 line](https://github.com/dbt-labs/dbt/releases/tag/v2.0.0) (2026-11-16; maintenance, downloads); [Official Apache source license, separate from product distribution terms](https://raw.githubusercontent.com/dbt-labs/dbt/main/LICENSE) (2026-11-16; license)
### Kestra

Declarative workflow orchestration with a browser editor, execution tracking and task plugins.

- **Platforms:** Web. **License:** Apache-2.0 core; Enterprise has separate terms. **Pricing model:** freemium.
- **Compatibility details:** Browser application backed by a server or container; local quick-start examples are development deployments.
- **Pricing details:** Core self-hosting is free; Cloud and Enterprise carry separate pricing and controls.
- **Pick for:** You need to coordinate diverse scripts and services with a shared execution interface.
- **Compare when:** Use a Python-first orchestrator when Python code should define the whole workflow.
- **Strengths:** One workflow can coordinate scripts and services in different languages; Visual operations and code definitions share the same workflow
- **Limitations:** Task execution needs configured runtimes and credentials; Enterprise governance differs from free Core
- **Maintenance:** active — Official release v2.0.10 is dated 2026-11-10; installation and performance were not independently tested. ([evidence](https://github.com/kestra-io/kestra/releases/tag/v2.0.10))
- [Official project](https://kestra.io/) · [Official installation / downloads](https://github.com/kestra-io/kestra#-quick-start) · [Repository](https://github.com/kestra-io/kestra)
- **Sources:** [Official product overview](https://kestra.io/) (2026-11-15; identity, features, pricing); [Official project documentation](https://raw.githubusercontent.com/kestra-io/kestra/develop/README.md) (2026-11-15; identity, features, downloads, platforms); [Official licensing terms](https://raw.githubusercontent.com/kestra-io/kestra/develop/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://github.com/kestra-io/kestra#-quick-start) (2026-11-15; downloads); [Official dated release](https://github.com/kestra-io/kestra/releases/tag/v2.0.10) (2026-11-15; maintenance, downloads)
### Meltano

Code-first data integration CLI using configured extractors, loaders and project environments.

- **Platforms:** Linux, macOS. **License:** MIT core; connector licenses vary. **Pricing model:** free.
- **Compatibility details:** Linux/macOS Python installation; official guide advises WSL or Docker for complete Windows functionality.
- **Pricing details:** Core is publicly installable without a product fee; hosted operations and third-party APIs may incur costs.
- **Pick for:** You need configurable data extraction and loading that fits a code-based project.
- **Compare when:** Use an orchestrator for broader task coordination and dbt for SQL transformations after loading.
- **Strengths:** Integration configuration can be reviewed and versioned; Connector ecosystem reduces repeated API plumbing
- **Limitations:** Connector quality and supported Python versions vary independently; Official in-depth guide warns native Windows support is incomplete
- **Maintenance:** active — Official release v4.4.1 is dated 2026-10-07; installation and performance were not independently tested. ([evidence](https://github.com/meltano/meltano/releases/tag/v4.4.1))
- [Official project](https://meltano.com/) · [Official installation / downloads](https://docs.meltano.com/getting-started) · [Repository](https://github.com/meltano/meltano)
- **Sources:** [Official product overview](https://meltano.com/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/meltano/meltano/main/README.md) (2026-11-15; identity, features, downloads, pricing); [Official licensing terms](https://raw.githubusercontent.com/meltano/meltano/main/LICENSE) (2026-11-15; license); [Documented deployment and platform scope](https://docs.meltano.com/guide/installation-guide) (2026-11-15; platforms); [Official download or installation entry point](https://docs.meltano.com/getting-started) (2026-11-15; downloads); [Official dated release](https://github.com/meltano/meltano/releases/tag/v4.4.1) (2026-11-15; maintenance, downloads)
### Prefect

Python workflow orchestration with tasks, retries, schedules and local or hosted run monitoring.

- **Platforms:** Web. **License:** Apache-2.0 core. **Pricing model:** freemium.
- **Compatibility details:** Python package with an optional self-hosted browser control plane; this Web record avoids claiming unverified native installers.
- **Pricing details:** Open-source engine can be self-hosted; managed service plans and infrastructure costs are separate.
- **Pick for:** You want to evolve Python scripts into scheduled, observable flows.
- **Compare when:** Compare Dagster for an asset-centered model and Airflow for established scheduled DAG operations.
- **Strengths:** Existing Python functions can become observable workflows; Local execution can grow into worker-based deployments
- **Limitations:** Infrastructure and credentials still require operational ownership; Managed cloud features and quotas are separate from the open-source engine
- **Maintenance:** active — Official release 3.9.3 is dated 2026-11-13; installation and performance were not independently tested. ([evidence](https://github.com/PrefectHQ/prefect/releases/tag/3.9.3))
- [Official project](https://www.prefect.io/) · [Official installation / downloads](https://github.com/PrefectHQ/prefect#getting-started) · [Repository](https://github.com/PrefectHQ/prefect)
- **Sources:** [Official product overview](https://www.prefect.io/) (2026-11-15; identity, features, pricing); [Official project documentation](https://raw.githubusercontent.com/PrefectHQ/prefect/main/README.md) (2026-11-15; identity, features, downloads, platforms); [Official licensing terms](https://raw.githubusercontent.com/PrefectHQ/prefect/main/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://github.com/PrefectHQ/prefect#getting-started) (2026-11-15; downloads); [Official dated release](https://github.com/PrefectHQ/prefect/releases/tag/3.9.3) (2026-11-15; maintenance, downloads)

## Data publishing

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fdata-publishing)

### Datasette

Local web application and CLI for exploring SQLite databases and exposing searchable data through pages and APIs.

- **Platforms:** macOS, Linux, Web. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** The documented local server installation paths cover macOS and Linux; its browsing interface runs in a web browser.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Turn a SQLite dataset into a browsable local research interface.
- **Compare when:** Publishing data requires deliberate access configuration; plugins and optional SQLite extensions have their own dependencies.
- **Strengths:** A database can become an explorable local research interface with little custom frontend code.
- **Limitations:** Publishing data requires deliberate access configuration; plugins and optional SQLite extensions have their own dependencies.
- **Maintenance:** active — An upstream release was observed dated 2026-09-16. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/simonw/datasette/releases/tag/0.65.5))
- [Official project](https://datasette.io/) · [Official installation / downloads](https://docs.datasette.io/en/stable/installation.html) · [Repository](https://github.com/simonw/datasette)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/simonw/datasette/HEAD/README.md) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/simonw/datasette/main/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://docs.datasette.io/en/stable/installation.html) (2026-11-14; downloads, platforms); [Public upstream app/package distribution: unauthenticated availability checked](https://files.pythonhosted.org/packages/b0/11/c30114a7f78ed33a13d7e98421f2ca1e1ead61a7441b745663e20f31bc4c/datasette-0.65.5-py3-none-any.whl) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/simonw/datasette/releases/tag/0.65.5) (2026-11-14; downloads, maintenance)

## Database clients

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fdatabase-clients)

### Beekeeper Studio

Desktop SQL editor and database manager with tabbed queries, saved history and table editing.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0-or-later Community; commercial directories use a separate EULA. **Pricing model:** freemium.
- **Compatibility details:** Official Community FAQ and download page establish Windows, macOS and Linux.
- **Pricing details:** Community features are free; the single application download unlocks premium features with a paid license.
- **Pick for:** You want a focused desktop SQL workflow with query history and editable tables.
- **Compare when:** Compare the free driver list against DbGate and DBeaver before relying on a particular database.
- **Strengths:** Focused SQL workflow avoids a full development IDE; Same core interface is available across desktop platforms
- **Limitations:** Some database engines and advanced features require payment; Product download combines free and paid functionality
- **Maintenance:** active — Official release v6.2.2 is dated 2026-11-06; installation and performance were not independently tested. ([evidence](https://github.com/beekeeper-studio/beekeeper-studio/releases/tag/v6.2.2))
- [Official project](https://www.beekeeperstudio.io/) · [Official installation / downloads](https://www.beekeeperstudio.io/get) · [Repository](https://github.com/beekeeper-studio/beekeeper-studio)
- **Sources:** [Official product overview](https://www.beekeeperstudio.io/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/beekeeper-studio/beekeeper-studio/master/README.md) (2026-11-15; identity, features, downloads); [Official licensing terms](https://raw.githubusercontent.com/beekeeper-studio/beekeeper-studio/master/LICENSE.md) (2026-11-15; license); [Documented deployment and platform scope](https://www.beekeeperstudio.io/community/) (2026-11-15; platforms, pricing); [Official download or installation entry point](https://www.beekeeperstudio.io/get) (2026-11-15; downloads); [Official dated release](https://github.com/beekeeper-studio/beekeeper-studio/releases/tag/v6.2.2) (2026-11-15; maintenance, downloads)
### DB Browser for SQLite

Visual SQLite database browser for creating databases, editing tables, inspecting data, and running SQL.

- **Platforms:** Windows, macOS, Linux. **License:** MPL-2.0 or GPL-3.0-or-later; dependency and plugin assets have their own terms. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Inspect and repair local SQLite data using a graphical interface.
- **Compare when:** It targets SQLite rather than client-server database administration.
- **Strengths:** Table browsing and SQL execution make local SQLite files accessible without a server.
- **Limitations:** It targets SQLite rather than client-server database administration.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/sqlitebrowser/sqlitebrowser))
- [Official project](https://sqlitebrowser.org/) · [Official installation / downloads](https://github.com/sqlitebrowser/sqlitebrowser/releases) · [Repository](https://github.com/sqlitebrowser/sqlitebrowser)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/sqlitebrowser/sqlitebrowser) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/sqlitebrowser/sqlitebrowser/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official license text](https://raw.githubusercontent.com/sqlitebrowser/sqlitebrowser/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://sqlitebrowser.org/) (2026-11-14; identity, features); [Official release inspected: v3.13.1](https://github.com/sqlitebrowser/sqlitebrowser/releases/tag/v3.13.1) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/sqlitebrowser/sqlitebrowser/releases/download/v3.13.1/DB.Browser.for.SQLite-v3.13.1-win64.msi) (2026-11-14; downloads, pricing)
### DBeaver Community

Universal database client with SQL editing, data browsing, schema navigation, and many database drivers.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Use one desktop interface for several SQL database engines.
- **Compare when:** Some advanced enterprise and cloud integrations belong to paid editions.
- **Strengths:** Multiple database engines can be explored through one consistent desktop client.
- **Limitations:** Some advanced enterprise and cloud integrations belong to paid editions.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/dbeaver/dbeaver))
- [Official project](https://dbeaver.io/) · [Official installation / downloads](https://github.com/dbeaver/dbeaver/releases) · [Repository](https://github.com/dbeaver/dbeaver)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/dbeaver/dbeaver) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/dbeaver/dbeaver/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://dbeaver.io/) (2026-11-14; identity, features, platforms); [Official release inspected: 26.2.4](https://github.com/dbeaver/dbeaver/releases/tag/26.2.4) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/dbeaver/dbeaver/releases/download/26.2.4/dbeaver-ce-26.2.4-windows-x86_64.exe) (2026-11-14; downloads, pricing)
### DbGate

SQL and NoSQL database manager with data editing, queries, schema comparison and import/export.

- **Platforms:** Windows, macOS, Linux, Web. **License:** GPL-3.0 Community; premium editions are commercial. **Pricing model:** freemium.
- **Compatibility details:** Official README documents Windows, Linux, macOS and a server-hosted browser version.
- **Pricing details:** Community is free under GPL; Premium drivers and team capabilities are paid.
- **Pick for:** You regularly switch between several SQL and NoSQL databases.
- **Compare when:** Check the edition matrix for your exact drivers before selecting it over DBeaver or Beekeeper Studio.
- **Strengths:** One workspace covers several relational and document data stores; Web and desktop distribution fit different environments
- **Limitations:** Some database drivers and integrations require Premium; Shared web deployment needs access-control administration
- **Maintenance:** active — Official release v7.3.6 is dated 2026-11-12; installation and performance were not independently tested. ([evidence](https://github.com/dbgate/dbgate/releases/tag/v7.3.6))
- [Official project](https://www.dbgate.io/) · [Official installation / downloads](https://www.dbgate.io/download-community/) · [Repository](https://github.com/dbgate/dbgate)
- **Sources:** [Official product overview](https://www.dbgate.io/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/dbgate/dbgate/master/README.md) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/dbgate/dbgate/master/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://www.dbgate.io/download-community/) (2026-11-15; downloads); [Official dated release](https://github.com/dbgate/dbgate/releases/tag/v7.3.6) (2026-11-15; maintenance, downloads)
### Harlequin

Terminal SQL IDE with an editor, database catalog, results table and pluggable database adapters.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Inspect schemas and run SQL in a terminal-based IDE.
- **Compare when:** Terminal key handling and adapter dependencies vary; optional databases require extra adapters.
- **Strengths:** An interactive database workspace can run in the same terminal as the rest of a development session.
- **Limitations:** Terminal key handling and adapter dependencies vary; optional databases require extra adapters.
- **Maintenance:** active — An upstream release was observed dated 2026-10-26. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/tconbeer/harlequin/releases/tag/v2.17.0))
- [Official project](https://harlequin.sh/) · [Official installation / downloads](https://github.com/tconbeer/harlequin#installing-harlequin) · [Repository](https://github.com/tconbeer/harlequin)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/tconbeer/harlequin/HEAD/README.md) (2026-11-14; downloads, features, identity, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/tconbeer/harlequin/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/tconbeer/harlequin#installing-harlequin) (2026-11-14; downloads); [Official documentation: Terminal SQL interface with result grids and database adapters.](https://harlequin.sh/) (2026-11-14; features, identity); [Official documentation: Canonical Harlequin repository and Windows, macOS and Linux installation instructions.](https://github.com/tconbeer/harlequin) (2026-11-14; platforms, downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://files.pythonhosted.org/packages/2c/12/edad22f66047c8298c77c80c27dd2a7bace7e753d6892e09acd226b6fac0/harlequin-2.17.0-py3-none-any.whl) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/tconbeer/harlequin/releases/tag/v2.17.0) (2026-11-14; downloads, maintenance)
### HeidiSQL

Windows database client for querying and administering supported SQL databases.

- **Platforms:** Windows. **License:** GPL-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Manage SQL databases from a Windows desktop without a large IDE.
- **Compare when:** Supported engines and feature parity vary; verify required database versions.
- **Strengths:** Database browsing, query editing, and export tools are combined in a focused administration interface.
- **Limitations:** Supported engines and feature parity vary; verify required database versions.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/HeidiSQL/HeidiSQL))
- [Official project](https://www.heidisql.com/) · [Official installation / downloads](https://github.com/HeidiSQL/HeidiSQL/releases) · [Repository](https://github.com/HeidiSQL/HeidiSQL)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/HeidiSQL/HeidiSQL) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/HeidiSQL/HeidiSQL/HEAD/readme.md) (2026-11-14; identity, features); [Official official documentation](https://www.heidisql.com/) (2026-11-14; identity, features); [Official release inspected: v12.22](https://github.com/HeidiSQL/HeidiSQL/releases/tag/v12.22) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/HeidiSQL/HeidiSQL/releases/download/v12.22/heidisql-12.22-1.x86_64.rpm) (2026-11-14; downloads, pricing)
### JetBrains DataGrip

Database IDE with schema-aware SQL assistance, interactive data editing, database connections, and query history.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary JetBrains product license; eligibility, free features and subscriptions depend on product. **Pricing model:** mixed.
- **Pick for:** Develop SQL and inspect related database objects using an integrated database IDE.
- **Compare when:** Free non-commercial licensing has conditions; commercial use and optional services require checking subscription terms.
- **Strengths:** Schema navigation and query tooling support work across several database engines.
- **Limitations:** Free non-commercial licensing has conditions; commercial use and optional services require checking subscription terms.
- **Maintenance:** unverified — Official product and distribution documentation reviewed; a recent dated release or repository activity was not independently established for this record. ([evidence](https://www.jetbrains.com/datagrip/))
- [Official project](https://www.jetbrains.com/datagrip/) · [Official installation / downloads](https://www.jetbrains.com/datagrip/download/)
- **Sources:** [Official product features and free-use scope](https://www.jetbrains.com/datagrip/) (2026-11-14; identity, features, pricing); [Official operating-system downloads](https://www.jetbrains.com/datagrip/download/) (2026-11-14; downloads, platforms); [JetBrains product use and subscription terms](https://www.jetbrains.com/legal/docs/toolbox/user/) (2026-11-14; license)
### Letos (formerly SQLiteStudio)

SQLite database manager, formerly SQLiteStudio, with SQL editing, schema tools, data browsing, and import/export support.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0 with OpenSSL exception (code); proprietary Icons8 assets in official builds. **Pricing model:** free.
- **Pricing details:** The upstream source was publicly accessible at no charge and its build/install route was reviewed. This establishes no-cost source availability, not free prebuilt binaries on every platform.
- **Pick for:** Manage multiple SQLite files without setting up a database server.
- **Compare when:** It focuses on SQLite workflows rather than enterprise database services.
- **Strengths:** Portable SQLite administration combines schema work, SQL editing, and data browsing.
- **Limitations:** It focuses on SQLite workflows rather than enterprise database services.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-10-21. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/pawelsalawa/letos))
- [Official project](https://letos.org/) · [Official installation / downloads](https://github.com/pawelsalawa/letos/releases) · [Repository](https://github.com/pawelsalawa/letos)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/pawelsalawa/letos) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/pawelsalawa/letos/HEAD/README.md) (2026-11-14; identity, features); [Official license text](https://raw.githubusercontent.com/pawelsalawa/letos/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://letos.org/) (2026-11-14; identity, features, platforms, downloads); [Official release inspected: 4.0.4](https://github.com/pawelsalawa/letos/releases/tag/4.0.4) (2026-11-14; downloads, maintenance, platforms); [Public upstream source distribution; compiled binary packaging is separate](https://github.com/pawelsalawa/letos/archive/HEAD.zip) (2026-11-14; downloads, pricing)
### pgAdmin

PostgreSQL administration and development interface with query tools, object inspection, and server management.

- **Platforms:** Windows, macOS, Linux. **License:** PostgreSQL License. **Pricing model:** free.
- **Pricing details:** The upstream source was publicly accessible at no charge and its build/install route was reviewed. This establishes no-cost source availability, not free prebuilt binaries on every platform.
- **Pick for:** Administer PostgreSQL and inspect query behavior in a visual interface.
- **Compare when:** It is PostgreSQL-specific and server connection credentials need secure handling.
- **Strengths:** PostgreSQL-specific object and server tools provide more context than a generic SQL editor.
- **Limitations:** It is PostgreSQL-specific and server connection credentials need secure handling.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/pgadmin-org/pgadmin4))
- [Official project](https://www.pgadmin.org/) · [Official installation / downloads](https://www.pgadmin.org/download/) · [Repository](https://github.com/pgadmin-org/pgadmin4)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/pgadmin-org/pgadmin4) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/pgadmin-org/pgadmin4/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official license text](https://raw.githubusercontent.com/pgadmin-org/pgadmin4/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://www.pgadmin.org/) (2026-11-14; identity, features); [Official platforms download documentation](https://www.pgadmin.org/download/) (2026-11-14; identity, features, platforms, downloads); [Public upstream source distribution; compiled binary packaging is separate](https://github.com/pgadmin-org/pgadmin4/archive/HEAD.zip) (2026-11-14; downloads, pricing)
### usql

Universal terminal database client with a psql-inspired interface and drivers for multiple database engines.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Query several database engines from one terminal client.
- **Compare when:** Driver features and build variants differ; a familiar interface does not make SQL dialects interchangeable.
- **Strengths:** A consistent command interface helps users who regularly switch between engines.
- **Limitations:** Driver features and build variants differ; a familiar interface does not make SQL dialects interchangeable.
- **Maintenance:** active — An upstream release was observed dated 2026-09-22. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/xo/usql/releases/tag/v0.21.6))
- [Official project](https://github.com/xo/usql) · [Official installation / downloads](https://github.com/xo/usql/releases) · [Repository](https://github.com/xo/usql)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/xo/usql/HEAD/README.md) (2026-11-14; downloads, features, identity, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/xo/usql/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/xo/usql/releases) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/xo/usql/releases/download/v0.21.6/usql-0.21.6-windows-amd64.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/xo/usql/releases/tag/v0.21.6) (2026-11-14; downloads, maintenance)

## Database engines and CLI tools

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fdatabase-engines)

### Dolt

SQL database with Git-like branches, commits, diffs and merges for tables and schemas.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Official README provides native Windows, macOS and Linux install paths.
- **Pricing details:** Open-source local database is publicly downloadable without a fee; hosting and collaboration services have separate plans.
- **Pick for:** Your data itself needs branching, review and merge history.
- **Compare when:** Choose ordinary SQLite when a local file is sufficient and table-versioning overhead is unnecessary.
- **Strengths:** Data changes can be reviewed as commits; SQL and version-control workflows share the same database
- **Limitations:** Compatibility and performance must be checked with the intended SQL workload; Merge conflicts in data need explicit resolution
- **Maintenance:** active — Official release v2.7.3 is dated 2026-11-11; installation and performance were not independently tested. ([evidence](https://github.com/dolthub/dolt/releases/tag/v2.7.3))
- [Official project](https://www.dolthub.com/) · [Official installation / downloads](https://github.com/dolthub/dolt#installation) · [Repository](https://github.com/dolthub/dolt)
- **Sources:** [Official product overview](https://www.dolthub.com/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/dolthub/dolt/main/README.md) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/dolthub/dolt/main/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://github.com/dolthub/dolt#installation) (2026-11-15; downloads); [Official dated release](https://github.com/dolthub/dolt/releases/tag/v2.7.3) (2026-11-15; maintenance, downloads)
### SQLite CLI

Command-line database shell for creating, inspecting, querying and exporting SQLite files.

- **Platforms:** Windows, macOS, Linux. **License:** Public domain core; optional components retain their notices. **Pricing model:** free.
- **Compatibility details:** Official downloads provide desktop command-line tools; build options affect bundled extensions.
- **Pricing details:** Core and official command-line utilities are public domain; commercial support and optional extensions are separate.
- **Pick for:** You need scriptable SQL over local database files without administering a server.
- **Compare when:** Use DB Browser for SQLite for visual editing or Dolt when table history and merging are central.
- **Strengths:** A database is a portable local file; CLI operations fit scripts and repeatable inspection
- **Limitations:** Concurrent write behavior differs from client-server databases; Extension availability depends on the selected build
- **Maintenance:** unverified — Official product and installation material reviewed; a recent dated release was not established for this product scope.
- [Official project](https://sqlite.org/cli.html) · [Official installation / downloads](https://sqlite.org/download.html) · [Repository](https://github.com/sqlite/sqlite)
- **Sources:** [Official product overview](https://sqlite.org/cli.html) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/sqlite/sqlite/master/README.md) (2026-11-15; identity, features, downloads); [Official licensing terms](https://sqlite.org/copyright.html) (2026-11-15; license, pricing); [Documented deployment and platform scope](https://sqlite.org/download.html) (2026-11-15; platforms, downloads)

## Database schema migrations

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fdatabase-migrations)

### Atlas

Database schema management with declarative planning, versioned migrations and schema comparison.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0 Community source; standard distribution includes proprietary features under Atlas MSA. **Pricing model:** freemium.
- **Compatibility details:** Official installation documents Windows, macOS, Linux and containers.
- **Pricing details:** Standard CLI is free under its MSA; Pro features require a license after trial. Apache Community build remains available with fewer capabilities.
- **Pick for:** You want schema-as-code planning rather than manually writing every migration.
- **Compare when:** Check which commands require standard or Pro distribution before adopting Community.
- **Strengths:** Desired-state models can generate schema migration plans; Fits workflows where schema and application changes are reviewed together
- **Limitations:** Community is a minimal build with important command gaps; Standard distribution and Pro capabilities have separate license terms
- **Maintenance:** active — Official release v1.3.0 is dated 2026-08-02; installation and performance were not independently tested. ([evidence](https://github.com/ariga/atlas/releases/tag/v1.3.0))
- [Official project](https://atlasgo.io/) · [Official installation / downloads](https://atlasgo.io/community-edition) · [Repository](https://github.com/ariga/atlas)
- **Sources:** [Official product overview](https://atlasgo.io/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/ariga/atlas/master/README.md) (2026-11-15; identity, features, downloads); [Official licensing terms](https://raw.githubusercontent.com/ariga/atlas/master/LICENSE) (2026-11-15; license); [Documented deployment and platform scope](https://atlasgo.io/community-edition) (2026-11-16; platforms, pricing, downloads, license); [Official dated release](https://github.com/ariga/atlas/releases/tag/v1.3.0) (2026-11-15; maintenance, downloads)
### dbmate

Standalone database migration CLI using timestamped SQL files and a shared schema history.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Official README documents Windows, macOS and Linux packages or binaries.
- **Pricing details:** Public binaries and source have no product fee; the project explicitly avoids a SaaS upsell.
- **Pick for:** A project needs a compact migration CLI without adopting a framework.
- **Compare when:** Compare Flyway for broader database integrations or Atlas for declarative schema planning.
- **Strengths:** Independent of the application language or framework; Migration files remain ordinary reviewable SQL
- **Limitations:** Database-specific SQL still needs testing; Rollbacks cannot automatically recover data discarded by a migration
- **Maintenance:** active — Official release v2.38.1 is dated 2026-11-09; installation and performance were not independently tested. ([evidence](https://github.com/amacneil/dbmate/releases/tag/v2.38.1))
- [Official project](https://github.com/amacneil/dbmate) · [Official installation / downloads](https://github.com/amacneil/dbmate#installation) · [Repository](https://github.com/amacneil/dbmate)
- **Sources:** [Official product overview](https://github.com/amacneil/dbmate) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/amacneil/dbmate/main/README.md) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/amacneil/dbmate/main/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://github.com/amacneil/dbmate#installation) (2026-11-15; downloads); [Official dated release](https://github.com/amacneil/dbmate/releases/tag/v2.38.1) (2026-11-15; maintenance, downloads)
### Flyway Community

Database migration tool that versions and applies schema changes through SQL or Java migrations.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0 OSS core; Redgate distributions and paid features have separate terms. **Pricing model:** freemium.
- **Compatibility details:** Official README and CLI documentation establish native Windows, macOS and Linux distributions.
- **Pricing details:** Redgate Community is free; Teams/Enterprise add paid features. The separately documented OSS distribution is Apache-licensed.
- **Pick for:** You need a conventional migration history across several database engines.
- **Compare when:** Use dbmate for a compact SQL-only workflow or Atlas for declarative planning.
- **Strengths:** Migration files fit existing source-control and CI workflows; Broad database integrations support mixed application stacks
- **Limitations:** OSS and Redgate Community distributions differ; Advanced comparison, governance and automation features require paid editions
- **Maintenance:** active — Official release flyway-13.12.2 is dated 2026-11-12; installation and performance were not independently tested. ([evidence](https://github.com/flyway/flyway/releases/tag/flyway-13.12.2))
- [Official project](https://www.red-gate.com/products/flyway/community/) · [Official installation / downloads](https://www.red-gate.com/products/flyway/community/) · [Repository](https://github.com/flyway/flyway)
- **Sources:** [Official product overview](https://www.red-gate.com/products/flyway/community/) (2026-11-15; identity, features, pricing, downloads); [Official project documentation](https://raw.githubusercontent.com/flyway/flyway/main/README.md) (2026-11-15; identity, features, downloads, platforms); [Official licensing terms](https://raw.githubusercontent.com/flyway/flyway/main/LICENSE.md) (2026-11-15; license); [Official dated release](https://github.com/flyway/flyway/releases/tag/flyway-13.12.2) (2026-11-15; maintenance, downloads)
### Liquibase Community

Database change management with changelogs, ordered changesets and deployment tracking.

- **Platforms:** Windows, macOS, Linux. **License:** FSL-1.1-ALv2 for current Community; future Apache-2.0 conversion under its terms. **Pricing model:** free.
- **Compatibility details:** Official README identifies Windows ZIP and Linux/macOS archives; Java and database drivers are required.
- **Pricing details:** Community downloads are free for uses allowed by the FSL; Liquibase Secure is a separate commercial distribution.
- **Pick for:** You want structured change history and declarative changesets across supported databases.
- **Compare when:** Review current FSL terms before choosing it over an unrestricted open-source migration tool.
- **Strengths:** Changelogs make the intended sequence of schema changes explicit; Several changelog formats suit different teams
- **Limitations:** Current FSL has permitted-purpose and competitive-use restrictions; Rollback support depends on the change type and supplied rollback logic
- **Maintenance:** active — Official release v5.0.4 is dated 2026-08-20; installation and performance were not independently tested. ([evidence](https://github.com/liquibase/liquibase/releases/tag/v5.0.4))
- [Official project](https://www.liquibase.com/) · [Official installation / downloads](https://www.liquibase.com/download-community) · [Repository](https://github.com/liquibase/liquibase)
- **Sources:** [Official product overview](https://www.liquibase.com/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/liquibase/liquibase/main/README.md) (2026-11-15; identity, features, downloads, platforms); [Official licensing terms](https://raw.githubusercontent.com/liquibase/liquibase/main/LICENSE.txt) (2026-11-15; license); [Distribution and pricing qualification](https://www.liquibase.com/download-community) (2026-11-15; pricing, downloads); [Official dated release](https://github.com/liquibase/liquibase/releases/tag/v5.0.4) (2026-11-15; maintenance, downloads)

## Debuggers

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fdebuggers)

### dnSpyEx

Community continuation of dnSpy combining a .NET debugger, assembly editor, and decompiler.

- **Platforms:** Windows. **License:** GPL-3.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Investigate and debug .NET applications with source-level views derived from assemblies.
- **Compare when:** Binary editing requires care, and supported runtimes vary.
- **Strengths:** Assembly browsing and debugging are available in the same .NET-focused application.
- **Limitations:** Binary editing requires care, and supported runtimes vary.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/dnSpyEx/dnSpy))
- [Official project](https://github.com/dnSpyEx/dnSpy) · [Official installation / downloads](https://github.com/dnSpyEx/dnSpy/releases) · [Repository](https://github.com/dnSpyEx/dnSpy)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/dnSpyEx/dnSpy) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/dnSpyEx/dnSpy/HEAD/README.md) (2026-11-14; identity, features); [Official release inspected: v6.6.0](https://github.com/dnSpyEx/dnSpy/releases/tag/v6.6.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/dnSpyEx/dnSpy/releases/download/v6.6.0/dnSpy-net-win64.zip) (2026-11-14; downloads, pricing)
### x64dbg

Graphical Windows debugger for user-mode x86 and x64 programs with disassembly, memory views, and plugins.

- **Platforms:** Windows. **License:** Modified GPL-3.0 with explicit permission for separately licensed plugins. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Debug Windows application binaries without source code.
- **Compare when:** It is platform and architecture specific and does not replace kernel debugging.
- **Strengths:** Register, memory, and disassembly views are integrated for Windows user-mode debugging.
- **Limitations:** It is platform and architecture specific and does not replace kernel debugging.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/x64dbg/x64dbg))
- [Official project](https://x64dbg.com/) · [Official installation / downloads](https://github.com/x64dbg/x64dbg/releases) · [Repository](https://github.com/x64dbg/x64dbg)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/x64dbg/x64dbg) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/x64dbg/x64dbg/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official license text](https://raw.githubusercontent.com/x64dbg/x64dbg/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://x64dbg.com/) (2026-11-14; identity, features); [Official release inspected: 2026.05.27](https://github.com/x64dbg/x64dbg/releases/tag/2026.05.27) (2026-11-14; downloads, maintenance); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/x64dbg/x64dbg/releases/download/2026.05.27/snapshot_2026-05-27_12-11.zip) (2026-11-15; downloads, pricing)

## Developer utility suites

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fdeveloper-utilities)

### CyberChef

Browser-based data transformation workbench that chains encodings, parsing, hashing and other operations.

- **Platforms:** Web. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Runs in a browser; official README documents local source/container deployment.
- **Pricing details:** Public source, release artifacts and container image have no product fee.
- **Pick for:** A technical task requires several visible, repeatable transformation steps.
- **Compare when:** Use a small utility for single conversions or a script for large unattended workloads.
- **Strengths:** Recipes make multi-step transformations repeatable; Visual inputs and outputs help inspect encoded data
- **Limitations:** It is not a substitute for a reviewed production cryptography implementation; Large input handling depends on browser memory and chosen operations
- **Maintenance:** active — Official release v11.5.0 is dated 2026-09-18; installation and performance were not independently tested. ([evidence](https://github.com/gchq/CyberChef/releases/tag/v11.5.0))
- [Official project](https://github.com/gchq/CyberChef) · [Official installation / downloads](https://github.com/gchq/CyberChef#running-locally) · [Repository](https://github.com/gchq/CyberChef)
- **Sources:** [Official product overview](https://github.com/gchq/CyberChef) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/gchq/CyberChef/master/README.md) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/gchq/CyberChef/master/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://github.com/gchq/CyberChef#running-locally) (2026-11-15; downloads); [Official dated release](https://github.com/gchq/CyberChef/releases/tag/v11.5.0) (2026-11-15; maintenance, downloads)
### DevToys

Developer conversion and formatting utility suite

- **Platforms:** Windows. **License:** MIT; third-party notices and extension terms separate. **Pricing model:** unknown.
- **Compatibility details:** Windows 10/11 repository topics; exact build prerequisites pending
- **Pick for:** Developer conversion and formatting utility suite
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Developer conversion and formatting utility suite
- **Limitations:** Old embedded Store rating dated 2024 is not a current 2026 rating; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/DevToys-app/DevToys) · [Repository](https://github.com/DevToys-app/DevToys)
- **Sources:** [Preserved original research source](https://github.com/DevToys-app/DevToys) (2026-11-14; identity, features)
### IT-Tools

Self-hostable collection of developer utilities for data formatting, conversion and common calculations.

- **Platforms:** Web. **License:** GPL-3.0. **Pricing model:** free.
- **Compatibility details:** Browser application that can run from the hosted site or a local/self-hosted container.
- **Pricing details:** Public source and container images are free under GPL; hosting is separate.
- **Pick for:** You want a browser-based toolbox for small technical transformations.
- **Compare when:** Choose CyberChef for chained recipes or DevToys for a dedicated desktop toolbox.
- **Strengths:** Frequently needed small utilities share one interface; Local hosting can keep routine utility workflows under user control
- **Limitations:** Individual tool behavior still needs checking on important data; It is a collection of utilities rather than a full development environment
- **Maintenance:** unverified — Official release v2024.10.22-7ca5933 is dated 2024-10-22; installation and performance were not independently tested. ([evidence](https://github.com/CorentinTh/it-tools/releases/tag/v2024.10.22-7ca5933))
- [Official project](https://github.com/CorentinTh/it-tools) · [Official installation / downloads](https://github.com/CorentinTh/it-tools#self-host) · [Repository](https://github.com/CorentinTh/it-tools)
- **Sources:** [Official product overview](https://github.com/CorentinTh/it-tools) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/CorentinTh/it-tools/main/README.md) (2026-11-15; identity, features, downloads, platforms, pricing); [Official licensing terms](https://raw.githubusercontent.com/CorentinTh/it-tools/main/LICENSE) (2026-11-15; license); [Official download or installation entry point](https://github.com/CorentinTh/it-tools#self-host) (2026-11-15; downloads); [Official dated release](https://github.com/CorentinTh/it-tools/releases/tag/v2024.10.22-7ca5933) (2026-11-15; maintenance, downloads)

## Diff and merge tools

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fdiff-merge)

### Beyond Compare

Commercial comparison, merging, and synchronization software for files, folders, images, and tabular data.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary Scooter Software license; paid Standard/Pro editions and evaluation. **Pricing model:** paid.
- **Pick for:** Compare mixed project assets and synchronize folders with explicit visual review.
- **Compare when:** Edition capabilities differ; evaluate the exact comparison and merge features before purchasing.
- **Strengths:** Specialized viewers and folder workflows cover more than source-code text comparisons.
- **Limitations:** Edition capabilities differ; evaluate the exact comparison and merge features before purchasing.
- **Maintenance:** unverified — Official product and distribution documentation reviewed; a recent dated release or repository activity was not independently established for this record. ([evidence](https://www.scootersoftware.com/))
- [Official project](https://www.scootersoftware.com/) · [Official installation / downloads](https://www.scootersoftware.com/download)
- **Sources:** [Official feature and platform overview](https://www.scootersoftware.com/) (2026-11-14; identity, features, platforms, downloads); [Official one-time-license and edition terms](https://www.scootersoftware.com/shop) (2026-11-14; pricing, license)
### delta

Syntax-aware pager for Git and diff output with side-by-side display and customizable presentation.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Read source changes in the terminal with clearer syntax and layout.
- **Compare when:** It presents diffs rather than resolving merge conflicts itself.
- **Strengths:** Syntax-aware side-by-side presentation adds context to terminal diff review.
- **Limitations:** It presents diffs rather than resolving merge conflicts itself.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/dandavison/delta))
- [Official project](https://dandavison.github.io/delta/) · [Official installation / downloads](https://github.com/dandavison/delta/releases) · [Repository](https://github.com/dandavison/delta)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/dandavison/delta) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/dandavison/delta/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://dandavison.github.io/delta/) (2026-11-14; identity, features); [Official release inspected: 0.20.1](https://github.com/dandavison/delta/releases/tag/0.20.1) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/dandavison/delta/releases/download/0.20.1/delta-0.20.1-x86_64-pc-windows-msvc.zip) (2026-11-14; downloads, pricing)
### Difftastic

Structural diff tool that compares parsed syntax for supported programming languages.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Review code changes where textual line diffs obscure structural edits.
- **Compare when:** Parser coverage and resource use vary, and text fallback still matters.
- **Strengths:** Syntax structure can expose meaningful code changes that line-based diffs obscure.
- **Limitations:** Parser coverage and resource use vary, and text fallback still matters.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/Wilfred/difftastic))
- [Official project](https://difftastic.wilfred.me.uk/) · [Official installation / downloads](https://github.com/Wilfred/difftastic/releases) · [Repository](https://github.com/Wilfred/difftastic)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/Wilfred/difftastic) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/Wilfred/difftastic/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://difftastic.wilfred.me.uk/) (2026-11-14; identity, features); [Official release inspected: 0.72.0](https://github.com/Wilfred/difftastic/releases/tag/0.72.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/Wilfred/difftastic/releases/download/0.72.0/difft-0.72.0-x86_64-pc-windows-msvc.zip) (2026-11-14; downloads, pricing)
### Meld

Visual file and directory comparison application with two-way and three-way comparison and version-control integration.

- **Platforms:** Windows, Linux. **License:** GPL-2.0. **Pricing model:** free.
- **Pricing details:** The upstream source was publicly accessible at no charge and its build/install route was reviewed. This establishes no-cost source availability, not free prebuilt binaries on every platform.
- **Pick for:** Resolve text conflicts and compare project folders graphically.
- **Compare when:** Windows packaging and desktop integration differ from Linux packages.
- **Strengths:** Two-way and three-way views support file comparison and conflict resolution.
- **Limitations:** Windows packaging and desktop integration differ from Linux packages.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/GNOME/meld))
- [Official project](https://meldmerge.org/) · [Official installation / downloads](https://meldmerge.org/) · [Repository](https://github.com/GNOME/meld)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/GNOME/meld) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/GNOME/meld/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official official documentation](https://meldmerge.org/) (2026-11-14; downloads, features, identity); [Public upstream source distribution; compiled binary packaging is separate](https://github.com/GNOME/meld/archive/HEAD.zip) (2026-11-14; downloads, pricing)
### WinMerge

Windows visual file and directory comparison tool with merging, filtering, and plugins.

- **Platforms:** Windows. **License:** GPL-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Compare directory trees and resolve text differences visually.
- **Compare when:** Complex file types may depend on plugins and encoding choices.
- **Strengths:** Folder comparison and text merging can be handled within one Windows interface.
- **Limitations:** Complex file types may depend on plugins and encoding choices.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/WinMerge/winmerge))
- [Official project](https://winmerge.org/) · [Official installation / downloads](https://github.com/WinMerge/winmerge/releases) · [Repository](https://github.com/WinMerge/winmerge)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/WinMerge/winmerge) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/WinMerge/winmerge/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://winmerge.org/) (2026-11-14; identity, features); [Official release inspected: v2.16.60](https://github.com/WinMerge/winmerge/releases/tag/v2.16.60) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/WinMerge/winmerge/releases/download/v2.16.60/winmerge-2.16.60-x64-exe.zip) (2026-11-14; downloads, pricing)

## Development environment management

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fenvironment-management)

### Conda

Language-agnostic binary package and environment manager used by several distributions.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-3-Clause for Conda; distribution and repository terms vary. **Pricing model:** mixed.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Maintain isolated environments with compiled scientific or developer dependencies.
- **Compare when:** Anaconda repository access can require commercial terms; the open-source manager and package repositories have different licensing scopes.
- **Strengths:** Environments can include native libraries alongside language packages.
- **Limitations:** Anaconda repository access can require commercial terms; the open-source manager and package repositories have different licensing scopes.
- **Maintenance:** active — An upstream release was observed dated 2026-11-06. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/conda/conda/releases/tag/26.10.0))
- [Official project](https://docs.conda.io/en/latest/) · [Official installation / downloads](https://docs.conda.io/projects/conda/en/stable/user-guide/install/) · [Repository](https://github.com/conda/conda)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/conda/conda/HEAD/README.md) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/conda/conda/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://docs.conda.io/projects/conda/en/stable/user-guide/install/) (2026-11-14; downloads, platforms, pricing); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/conda/conda/releases/download/26.10.0/conda-26.10.0.tar.gz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/conda/conda/releases/tag/26.10.0) (2026-11-14; downloads, maintenance)
### Devbox

Project-specific development shells that declare operating-system tools in a JSON file and resolve them through Nix.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** unknown.
- **Compatibility details:** Linux and macOS packages; Windows uses WSL2 rather than a native Windows shell. Nix provides the underlying package store.
- **Pricing details:** Open-source code and a public installation route are documented. A separate explicit pricing statement for the current distribution was not established in this review.
- **Pick for:** A team wants a declared local toolchain with a simpler entry point than writing Nix expressions.
- **Compare when:** Use Nix directly for detailed packaging control; compare DDEV or Lando when the main need is a running web-service stack.
- **Strengths:** Declares system-level tools together instead of manually managing conflicting installations; A JSON entry point reduces the initial Nix configuration work
- **Limitations:** Shell isolation does not provide a virtual-machine security boundary; Package availability and reproducibility still depend on the selected Nix packages and recorded versions
- **Maintenance:** active — Official release 0.21.0 is dated 2026-11-13. This is a release observation; installation and performance were not independently tested. ([evidence](https://github.com/jetify-com/devbox/releases/tag/0.21.0))
- [Official project](https://www.jetify.com/devbox/) · [Official installation / downloads](https://github.com/jetify-com/devbox#installing-devbox) · [Repository](https://github.com/jetify-com/devbox)
- **Sources:** [Official project documentation](https://github.com/jetify-com/devbox/blob/main/README.md) (2026-11-16; identity, features, platforms, downloads); [Official application and dependency licensing](https://github.com/jetify-com/devbox/blob/main/LICENSE) (2026-11-16; license); [Official operating-system requirements](https://github.com/jetify-com/docs/blob/main/docs/devbox/installing-devbox.mdx) (2026-11-16; platforms, downloads); [Official dated release and distribution](https://github.com/jetify-com/devbox/releases/tag/0.21.0) (2026-11-16; maintenance, downloads)
### direnv

Shell extension that loads and unloads approved project environment variables when the working directory changes.

- **Platforms:** macOS, Linux, FreeBSD. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** Unix-like systems with a supported shell; shell hooks are required. The release also publishes FreeBSD binaries.
- **Pricing details:** Open-source code and a public installation route are documented. A separate explicit pricing statement for the current distribution was not established in this review.
- **Pick for:** You already have a shell and toolchain and want project variables to appear and disappear automatically.
- **Compare when:** Use Devbox, Nix or mise alongside or instead of it when tools themselves must also be installed and versioned.
- **Strengths:** Project settings follow directory changes without modifying the global shell profile; Small CLI integrates with existing shells and language environment managers
- **Limitations:** An approved .envrc executes shell code; review the actual project file before authorizing it; It does not install a complete toolchain or isolate processes by itself
- **Maintenance:** active — Official release v2.38.2 is dated 2026-10-10. This is a release observation; installation and performance were not independently tested. ([evidence](https://github.com/direnv/direnv/releases/tag/v2.38.2))
- [Official project](https://direnv.net/) · [Official installation / downloads](https://direnv.net/docs/installation.html) · [Repository](https://github.com/direnv/direnv)
- **Sources:** [Official project documentation](https://github.com/direnv/direnv/blob/master/README.md) (2026-11-16; identity, features, platforms, downloads); [Official application and dependency licensing](https://github.com/direnv/direnv/blob/master/LICENSE) (2026-11-16; license); [Official dated release and distribution](https://github.com/direnv/direnv/releases/tag/v2.38.2) (2026-11-16; maintenance, downloads)
### fnm

Node.js version manager supporting project version files and several desktop shells.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Use the Node.js version each repository expects.
- **Compare when:** Shell initialization must be configured; Windows Command Prompt setup differs from PowerShell.
- **Strengths:** Existing Node version files can drive automatic per-project runtime selection.
- **Limitations:** Shell initialization must be configured; Windows Command Prompt setup differs from PowerShell.
- **Maintenance:** active — An upstream release was observed dated 2026-03-06. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/Schniz/fnm/releases/tag/v1.39.0))
- [Official project](https://github.com/Schniz/fnm) · [Official installation / downloads](https://github.com/Schniz/fnm#installation) · [Repository](https://github.com/Schniz/fnm)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/Schniz/fnm/HEAD/README.md) (2026-11-14; downloads, features, identity, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/Schniz/fnm/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/Schniz/fnm#installation) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/Schniz/fnm/releases/download/v1.39.0/fnm-arm32.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/Schniz/fnm/releases/tag/v1.39.0) (2026-11-14; downloads, maintenance)
### Mamba

Conda-compatible package management tools using libsolv, including the standalone micromamba executable.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-3-Clause. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** The reviewed upstream source is distributed at no charge and includes a documented build/install route. This does not establish free prebuilt binaries for every platform.
- **Pick for:** Create scripted conda-package environments with a standalone installer.
- **Compare when:** Channel terms and package compatibility remain separate concerns; do not assume every conda option is identical.
- **Strengths:** The standalone variant is convenient for scripted environments and CI setup.
- **Limitations:** Channel terms and package compatibility remain separate concerns; do not assume every conda option is identical.
- **Maintenance:** active — An upstream release was observed dated 2026-10-23. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/mamba-org/mamba/releases/tag/2.10.0))
- [Official project](https://mamba.readthedocs.io/en/latest/) · [Official installation / downloads](https://mamba.readthedocs.io/en/stable/installation/micromamba-installation.html) · [Repository](https://github.com/mamba-org/mamba)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/mamba-org/mamba/blob/main/README.md) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/mamba-org/mamba/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://mamba.readthedocs.io/en/stable/installation/micromamba-installation.html) (2026-11-14; downloads, platforms); [Official documentation: Conda-compatible environment tools support Windows, macOS and Linux.](https://mamba.readthedocs.io/en/stable/) (2026-11-14; platforms, features); [Public upstream source distribution; binary packaging is separate](https://github.com/mamba-org/mamba/archive/HEAD.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/mamba-org/mamba/releases/tag/2.10.0) (2026-11-14; downloads, maintenance)
### mise

Project tool-version manager combining runtime selection, environment variables and task execution.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Pin project runtimes and standardize development commands.
- **Compare when:** Each managed tool or backend has its own compatibility and trust requirements; shell integration needs setup.
- **Strengths:** A shared configuration keeps a project’s tools and commands together across developer machines.
- **Limitations:** Each managed tool or backend has its own compatibility and trust requirements; shell integration needs setup.
- **Maintenance:** active — An upstream release was observed dated 2026-11-13. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/jdx/mise/releases/tag/v2026.11.8))
- [Official project](https://mise.jdx.dev/) · [Official installation / downloads](https://github.com/jdx/mise/releases) · [Repository](https://github.com/jdx/mise)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/jdx/mise/HEAD/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/jdx/mise/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/jdx/mise/releases) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/jdx/mise/releases/download/v2026.11.8/mise-v2026.11.8-linux-arm64-musl.tar.gz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/jdx/mise/releases/tag/v2026.11.8) (2026-11-14; downloads, maintenance)
### Nix

Declarative package manager and build system for reproducible development environments and isolated package stores.

- **Platforms:** Windows, macOS, Linux. **License:** LGPL-2.1. **Pricing model:** unknown.
- **Compatibility details:** Official installation covers Linux and macOS; Windows runs Nix inside WSL2. Nix the package manager does not require installing NixOS.
- **Pricing details:** Open-source code and a public installation route are documented. A separate explicit pricing statement for the current distribution was not established in this review.
- **Pick for:** You need detailed control over reproducible toolchains, packages and build dependencies.
- **Compare when:** Compare Devbox for a simpler shell configuration or language-focused managers for narrower projects.
- **Strengths:** System tools and libraries can be described in one reproducible dependency model; Multiple package versions can coexist without a conventional global installation
- **Limitations:** The Nix language and packaging model introduce a substantial learning curve; Reproducibility depends on pinned inputs and build behavior; it is not guaranteed by a package-manager label alone
- **Maintenance:** active — Official Nix manual dates the 2.35.0 release notes June 22, 2026. This documents a maintained release line; installation and performance were not independently tested. ([evidence](https://nix.dev/manual/nix/2.35/release-notes/rl-2.35.html))
- [Official project](https://nixos.org/) · [Official installation / downloads](https://nix.dev/install-nix) · [Repository](https://github.com/NixOS/nix)
- **Sources:** [Official project documentation](https://github.com/NixOS/nix/blob/master/README.md) (2026-11-16; identity, features, platforms, downloads); [Official application and dependency licensing](https://github.com/NixOS/nix/blob/master/COPYING) (2026-11-16; license); [Official installation and host scope](https://nix.dev/install-nix) (2026-11-16; platforms, downloads); [Official dated release notes](https://nix.dev/manual/nix/2.35/release-notes/rl-2.35.html) (2026-11-16; maintenance, features)
### Pixi

Project environment manager that combines conda packages, Python packages, task definitions and lockfiles.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-3-Clause. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Reproduce a project with Python and native-library dependencies.
- **Compare when:** Availability depends on configured package channels and target platforms; repository terms are separate from Pixi’s license.
- **Strengths:** Non-Python dependencies can be locked beside Python requirements in one project.
- **Limitations:** Availability depends on configured package channels and target platforms; repository terms are separate from Pixi’s license.
- **Maintenance:** active — An upstream release was observed dated 2026-11-10. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/prefix-dev/pixi/releases/tag/v0.84.2))
- [Official project](https://pixi.prefix.dev/) · [Official installation / downloads](https://github.com/prefix-dev/pixi#installation) · [Repository](https://github.com/prefix-dev/pixi)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/prefix-dev/pixi/HEAD/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/prefix-dev/pixi/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/prefix-dev/pixi#installation) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/prefix-dev/pixi/releases/download/v0.84.2/pixi-aarch64-apple-darwin.tar.gz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/prefix-dev/pixi/releases/tag/v0.84.2) (2026-11-14; downloads, maintenance)
### pyenv

Unix-oriented Python version manager supporting global, project-local and shell-specific interpreter selection.

- **Platforms:** macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Native Unix/macOS tool. WSL installs Linux interpreters, not native Windows Python.
- **Pricing details:** The reviewed upstream source is distributed at no charge and includes a documented build/install route. This does not establish free prebuilt binaries for every platform.
- **Pick for:** Keep several Python interpreter versions available on Linux or macOS.
- **Compare when:** Native Windows is unsupported; many installations compile Python and require build dependencies.
- **Strengths:** Independent Python installations let projects use different interpreter versions.
- **Limitations:** Native Windows is unsupported; many installations compile Python and require build dependencies.
- **Maintenance:** active — An upstream release was observed dated 2026-11-10. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/pyenv/pyenv/releases/tag/v2.8.15))
- [Official project](https://github.com/pyenv/pyenv) · [Official installation / downloads](https://github.com/pyenv/pyenv#installation) · [Repository](https://github.com/pyenv/pyenv)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/pyenv/pyenv/blob/master/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://github.com/pyenv/pyenv/blob/master/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/pyenv/pyenv#installation) (2026-11-14; downloads); [Public upstream source distribution; binary packaging is separate](https://github.com/pyenv/pyenv/archive/HEAD.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/pyenv/pyenv/releases/tag/v2.8.15) (2026-11-14; downloads, maintenance)
### pyenv-win

Windows port of pyenv for installing and switching native Windows Python versions.

- **Platforms:** Windows. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Switch native Windows Python versions for different projects.
- **Compare when:** PATH order and Windows Python execution aliases can conflict; it is separate from Unix pyenv.
- **Strengths:** Windows users can use a pyenv-style workflow without receiving Linux interpreters through WSL.
- **Limitations:** PATH order and Windows Python execution aliases can conflict; it is separate from Unix pyenv.
- **Maintenance:** unverified — The observed upstream release is dated 2022-07-20; an older release alone does not establish abandonment or current support.
- [Official project](https://github.com/pyenv-win/pyenv-win) · [Official installation / downloads](https://github.com/pyenv-win/pyenv-win#installation) · [Repository](https://github.com/pyenv-win/pyenv-win)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/pyenv-win/pyenv-win/HEAD/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/pyenv-win/pyenv-win/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/pyenv-win/pyenv-win#installation) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://files.pythonhosted.org/packages/fe/bf/ad7bcca35c7b5465c922c9b1e9540a76c7524c68625983a33e25c3a712a4/pyenv_win-3.1.1-py3-none-any.whl) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/pyenv-win/pyenv-win/releases/tag/v3.1.1) (2026-11-14; downloads, maintenance)
### uv

Python package and project manager with environment creation, dependency locking and Python-version management.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0 OR MIT. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Create a reproducible Python project and run isolated Python tools.
- **Compare when:** Existing projects still need correct dependency metadata; platform-specific compiled packages can require additional toolchains.
- **Strengths:** One tool coordinates interpreter selection, dependencies and command-line Python tools.
- **Limitations:** Existing projects still need correct dependency metadata; platform-specific compiled packages can require additional toolchains.
- **Maintenance:** active — An upstream release was observed dated 2026-11-12. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/astral-sh/uv/releases/tag/0.13.8))
- [Official project](https://docs.astral.sh/uv/) · [Official installation / downloads](https://github.com/astral-sh/uv#installation) · [Repository](https://github.com/astral-sh/uv)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/astral-sh/uv/HEAD/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/astral-sh/uv/HEAD/LICENSE-APACHE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/astral-sh/uv#installation) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/astral-sh/uv/releases/download/0.13.8/uv-x86_64-pc-windows-msvc.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/astral-sh/uv/releases/tag/0.13.8) (2026-11-14; downloads, maintenance)

## Git clients

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fgit-clients)

### Fork

Commercial Git desktop client with commit history, interactive rebase, staging, image diffs, and merge-conflict tools.

- **Platforms:** Windows, macOS. **License:** Proprietary Fork license; paid with free evaluation. **Pricing model:** paid.
- **Pick for:** Manage Git history and conflicts with a dedicated Windows or macOS GUI.
- **Compare when:** No Linux build is advertised; a paid license follows evaluation.
- **Strengths:** History, staging, and visual rebasing are integrated into a desktop Git workflow.
- **Limitations:** No Linux build is advertised; a paid license follows evaluation.
- **Maintenance:** unverified — Official product and distribution documentation reviewed; a recent dated release or repository activity was not independently established for this record. ([evidence](https://git-fork.com/))
- [Official project](https://git-fork.com/) · [Official installation / downloads](https://git-fork.com/)
- **Sources:** [Official platform downloads, features and purchase/evaluation information](https://git-fork.com/) (2026-11-14; identity, features, platforms, downloads, pricing, license)
### Git Cola

Qt-based Git desktop client for reviewing diffs, staging changes and navigating repository history.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0. **Pricing model:** unknown.
- **Compatibility details:** Official instructions cover Linux, macOS and Windows. Git, Python and a supported Qt binding are required unless provided by the selected package.
- **Pricing details:** Open-source code and a public installation route are documented. A separate explicit pricing statement for the current distribution was not established in this review.
- **Pick for:** You want an open-source desktop Git interface that works with existing local repositories.
- **Compare when:** Compare Git Extensions for its Windows workflow or lazygit for a terminal interface.
- **Strengths:** Uses ordinary local Git repositories without requiring a hosting account; A focused GUI exposes staging and history beside command-line workflows
- **Limitations:** Python/Qt packaging differs between operating systems; Users still need to understand Git operations such as reset, rebase and merge
- **Maintenance:** active — Official release v4.19.0 is dated 2026-07-12. This is a release observation; installation and performance were not independently tested. ([evidence](https://github.com/git-cola/git-cola/releases/tag/v4.19.0))
- [Official project](https://git-cola.gitlab.io/) · [Official installation / downloads](https://github.com/git-cola/git-cola#installation) · [Repository](https://github.com/git-cola/git-cola)
- **Sources:** [Official project documentation](https://github.com/git-cola/git-cola/blob/main/README.md) (2026-11-16; identity, features, platforms, downloads); [Official application and dependency licensing](https://github.com/git-cola/git-cola/blob/main/LICENSE) (2026-11-16; license); [Official Git Cola commands and staging documentation](https://github.com/git-cola/git-cola/blob/main/docs/git-cola.rst) (2026-11-16; features); [Official dated release and distribution](https://github.com/git-cola/git-cola/releases/tag/v4.19.0) (2026-11-16; maintenance, downloads)
### Git Extensions

Graphical Windows Git client with repository history, branch management, diffs, and integration tools.

- **Platforms:** Windows. **License:** GPL-3.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Inspect branch history and manage repository workflows on Windows.
- **Compare when:** Windows-specific prerequisites and Git configuration must be installed correctly.
- **Strengths:** The commit graph and Windows integrations help inspect repository history visually.
- **Limitations:** Windows-specific prerequisites and Git configuration must be installed correctly.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/gitextensions/gitextensions))
- [Official project](https://gitextensions.github.io/) · [Official installation / downloads](https://github.com/gitextensions/gitextensions/releases) · [Repository](https://github.com/gitextensions/gitextensions)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/gitextensions/gitextensions) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/gitextensions/gitextensions/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official license text](https://raw.githubusercontent.com/gitextensions/gitextensions/HEAD/LICENSE.md) (2026-11-14; license); [Official official documentation](https://gitextensions.github.io/) (2026-11-14; identity, features); [Official release inspected: v7.2.1](https://github.com/gitextensions/gitextensions/releases/tag/v7.2.1) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/gitextensions/gitextensions/releases/download/v7.2.1/GitExtensions-x64-7.2.1.7-0aea2d6df.msi) (2026-11-14; downloads, pricing)
### GitHub Desktop

Graphical Git client focused on approachable commits, branch changes, pull requests, and GitHub workflows.

- **Platforms:** Windows, macOS. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Introduce version control with visual diffs and a guided commit workflow.
- **Compare when:** Official distributions target Windows and macOS, and advanced Git workflows may need the CLI.
- **Strengths:** A guided commit workflow makes staging and reviewing changes approachable.
- **Limitations:** Official distributions target Windows and macOS, and advanced Git workflows may need the CLI.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/desktop/desktop))
- [Official project](https://github.com/apps/desktop) · [Official installation / downloads](https://github.com/desktop/desktop/releases) · [Repository](https://github.com/desktop/desktop)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/desktop/desktop) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/desktop/desktop/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://github.com/apps/desktop) (2026-11-14; identity, features); [Official release inspected: release-3.6.10](https://github.com/desktop/desktop/releases/tag/release-3.6.10) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/desktop/desktop/releases/download/release-3.6.10/GitHub.Desktop-x64.zip) (2026-11-14; downloads, pricing)
### GitKraken Desktop

Graphical Git client with commit-graph navigation, diffs, merge tools, a terminal, and provider integrations.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary GitKraken terms; free tier and paid subscriptions. **Pricing model:** freemium.
- **Pick for:** Navigate repository history and resolve conflicts through a visual Git client.
- **Compare when:** The free tier limits private-repository and integration capabilities; compare current plan terms.
- **Strengths:** A visual graph and terminal can be used together to inspect repository state.
- **Limitations:** The free tier limits private-repository and integration capabilities; compare current plan terms.
- **Maintenance:** unverified — Official product and distribution documentation reviewed; a recent dated release or repository activity was not independently established for this record. ([evidence](https://www.gitkraken.com/git-client))
- [Official project](https://www.gitkraken.com/git-client) · [Official installation / downloads](https://www.gitkraken.com/download)
- **Sources:** [Official features, platforms and distribution](https://www.gitkraken.com/git-client) (2026-11-14; identity, features, platforms, downloads); [Official free and subscription feature comparison](https://www.gitkraken.com/pricing) (2026-11-14; pricing, license)
### GitUI

Keyboard-driven terminal Git client for status, staging, commits, logs, and diff review.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Review and stage code changes using a compact terminal interface.
- **Compare when:** Supported workflows are narrower than Git's complete command-line interface.
- **Strengths:** Keyboard-driven staging and diff review support focused terminal commit workflows.
- **Limitations:** Supported workflows are narrower than Git's complete command-line interface.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-10-06. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/gitui-org/gitui))
- [Official project](https://github.com/gitui-org/gitui) · [Official installation / downloads](https://github.com/gitui-org/gitui/releases) · [Repository](https://github.com/gitui-org/gitui)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/gitui-org/gitui) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/gitui-org/gitui/HEAD/README.md) (2026-11-14; identity, features, downloads); [Official release inspected: v0.28.1](https://github.com/gitui-org/gitui/releases/tag/v0.28.1) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/gitui-org/gitui/releases/download/v0.28.1/gitui-linux-x86_64.tar.gz) (2026-11-14; downloads, pricing)
### lazygit

Terminal Git interface for staging, branching, rebasing, reviewing diffs, and navigating history.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Manage Git changes visually while staying in a terminal.
- **Compare when:** Complex Git actions still require understanding their effect on shared history.
- **Strengths:** Git state, diffs, staging, and history remain visible while performing repository operations.
- **Limitations:** Complex Git actions still require understanding their effect on shared history.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/jesseduffield/lazygit))
- [Official project](https://github.com/jesseduffield/lazygit) · [Official installation / downloads](https://github.com/jesseduffield/lazygit/releases) · [Repository](https://github.com/jesseduffield/lazygit)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/jesseduffield/lazygit) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/jesseduffield/lazygit/HEAD/README.md) (2026-11-14; identity, features, downloads); [Official release inspected: v0.66.3](https://github.com/jesseduffield/lazygit/releases/tag/v0.66.3) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/jesseduffield/lazygit/releases/download/v0.66.3/lazygit_0.66.3_windows_x86_64.zip) (2026-11-14; downloads, pricing)

## Graphics debugging

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fgraphics-debugging)

### apitrace

Graphics API tracing tools for recording calls, replaying traces and inspecting rendering state.

- **Platforms:** Windows, Linux, macOS. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Official build instructions cover Windows, Linux and macOS; capture/replay API coverage and bitness differ.
- **Pricing details:** Public source and available binaries are free under MIT.
- **Pick for:** You need call-level tracing for an API and platform that apitrace supports.
- **Compare when:** Choose RenderDoc or vendor tools when modern frame debugging and hardware counters better match the task.
- **Strengths:** Recorded call sequences can be inspected outside the original run; Useful for supported legacy OpenGL and Direct3D debugging
- **Limitations:** Supported capture/replay features differ across APIs and platforms; Maintainer states that work proceeds as available time permits
- **Maintenance:** active — Official release 14.0 is dated 2026-03-10; installation and performance were not independently tested. ([evidence](https://github.com/apitrace/apitrace/releases/tag/14.0))
- [Official project](https://github.com/apitrace/apitrace) · [Official installation / downloads](https://github.com/apitrace/apitrace/releases) · [Repository](https://github.com/apitrace/apitrace)
- **Sources:** [Official product overview](https://github.com/apitrace/apitrace) (2026-11-15; identity, features, pricing); [Official licensing terms](https://raw.githubusercontent.com/apitrace/apitrace/master/LICENSE) (2026-11-15; license); [Documented deployment and platform scope](https://raw.githubusercontent.com/apitrace/apitrace/master/docs/INSTALL.markdown) (2026-11-15; platforms); [Official download or installation entry point](https://github.com/apitrace/apitrace/releases) (2026-11-15; downloads); [Official dated release](https://github.com/apitrace/apitrace/releases/tag/14.0) (2026-11-15; maintenance, downloads)
### NVIDIA Nsight Graphics

NVIDIA graphics debugger and profiler for supported Direct3D, Vulkan and OpenGL applications.

- **Platforms:** Windows, Linux. **License:** Proprietary NVIDIA developer-tools agreement; component notices apply. **Pricing model:** free.
- **Compatibility details:** Official download center lists Windows and Linux x64/ARM variants; consult the current supported GPU and driver matrix.
- **Pricing details:** NVIDIA identifies participating Nsight standalone tools as free; Pro/NDA access and hardware requirements are separate.
- **Pick for:** You need NVIDIA-specific graphics debugging and performance analysis.
- **Compare when:** Use RenderDoc for broader hardware capture coverage and PIX for its DirectX workflow.
- **Strengths:** Hardware-specific analysis can connect graphics events to NVIDIA GPU behavior; Debugging and profiling share captured application context
- **Limitations:** Supported GPU, driver and API combinations are specific; Public and Pro/NDA distributions have different availability and terms
- **Maintenance:** unverified — Official product and installation material reviewed; a recent dated release was not established for this product scope.
- [Official project](https://developer.nvidia.com/nsight-graphics) · [Official installation / downloads](https://developer.nvidia.com/tools-downloads)
- **Sources:** [Official product overview](https://developer.nvidia.com/nsight-graphics) (2026-11-15; identity, features); [Official licensing terms](https://docs.nvidia.com/nsight-graphics/CopyrightAndLicenses/) (2026-11-15; license); [Documented deployment and platform scope](https://developer.nvidia.com/tools-downloads) (2026-11-15; platforms, downloads); [Distribution and pricing qualification](https://docs.nvidia.com/nsight-vs-integration/getting-started/index.html) (2026-11-15; pricing)
### PIX on Windows

Microsoft graphics debugging and performance tool for DirectX 12 applications on Windows.

- **Platforms:** Windows. **License:** Distribution license not established from the reviewed overview and download documentation. **Pricing model:** unknown.
- **Compatibility details:** Windows builds are distributed separately from Xbox GDK PIX and older HoloLens-specific versions.
- **Pricing details:** Official public downloads were found; this review did not establish complete commercial-use and distribution terms, so pricing/licensing remain explicitly unresolved.
- **Pick for:** You develop a DirectX 12 Windows application and need Microsoft’s capture tooling.
- **Compare when:** Use a cross-API tool for Vulkan/OpenGL and check capture compatibility for the target GPU.
- **Strengths:** Targets the DirectX 12 development workflow; Combines frame analysis with broader application timing
- **Limitations:** Windows and DirectX scope differs from cross-API tools; Hardware, driver and preview-feature requirements must match the capture
- **Maintenance:** unverified — Official product and installation material reviewed; a recent dated release was not established for this product scope.
- [Official project](https://learn.microsoft.com/en-us/windows/pix/overview) · [Official installation / downloads](https://devblogs.microsoft.com/pix/download/)
- **Sources:** [Official product overview](https://learn.microsoft.com/en-us/windows/pix/overview) (2026-11-15; identity, features); [Documented deployment and platform scope](https://devblogs.microsoft.com/pix/download/) (2026-11-15; platforms, downloads)
### RenderDoc

Frame-capture graphics debugger for supported rendering APIs with resource and pipeline inspection.

- **Platforms:** Windows, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** The upstream source was publicly accessible at no charge and its build/install route was reviewed. This establishes no-cost source availability, not free prebuilt binaries on every platform.
- **Pick for:** Inspect a rendered frame to diagnose shader and graphics-state problems.
- **Compare when:** API, driver, and application compatibility must be checked; unsupported integrations can fail.
- **Strengths:** A captured frame exposes resource contents and rendering pipeline state together.
- **Limitations:** API, driver, and application compatibility must be checked; unsupported integrations can fail.; Upstream supports captures of programs you create; consult its project-support policy before use on third-party applications.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/baldurk/renderdoc))
- [Official project](https://renderdoc.org/) · [Official installation / downloads](https://renderdoc.org/) · [Repository](https://github.com/baldurk/renderdoc)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/baldurk/renderdoc) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/baldurk/renderdoc/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official official documentation](https://renderdoc.org/) (2026-11-14; identity, features); [Official release inspected: v1.47](https://github.com/baldurk/renderdoc/releases/tag/v1.47) (2026-11-14; downloads, maintenance); [Public upstream source distribution; compiled binary packaging is separate](https://github.com/baldurk/renderdoc/archive/HEAD.zip) (2026-11-14; downloads, pricing)

## HTTP command-line clients

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fhttp-clients)

### curl

Command-line data transfer tool supporting HTTP and numerous other network protocols.

- **Platforms:** Windows, macOS, Linux. **License:** curl license (permissive). **Pricing model:** free.
- **Pricing details:** The upstream source was publicly accessible at no charge and its build/install route was reviewed. This establishes no-cost source availability, not free prebuilt binaries on every platform.
- **Pick for:** Automate reproducible downloads and API requests in scripts.
- **Compare when:** Its many options require care around redirects, credentials, and TLS behavior.
- **Strengths:** A mature option surface makes exact network requests reproducible in scripts.
- **Limitations:** Its many options require care around redirects, credentials, and TLS behavior.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/curl/curl))
- [Official project](https://curl.se/) · [Official installation / downloads](https://github.com/curl/curl/releases) · [Repository](https://github.com/curl/curl)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/curl/curl) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/curl/curl/HEAD/README.md) (2026-11-14; identity, features); [Official license text](https://raw.githubusercontent.com/curl/curl/HEAD/COPYING) (2026-11-14; license); [Official official documentation](https://curl.se/) (2026-11-14; identity, features); [Official release inspected: curl-8_23_0](https://github.com/curl/curl/releases/tag/curl-8_23_0) (2026-11-14; downloads, maintenance); [Public upstream source distribution; compiled binary packaging is separate](https://github.com/curl/curl/releases/download/curl-8_23_0/curl-8.23.0.zip) (2026-11-14; downloads, pricing); [Official source: Documented supported operating-system families include Windows, macOS and modern Unix systems.](https://curl.se/docs/faq.html) (2026-11-14; platforms)
### HTTPie

Command-line HTTP client with readable output, JSON request syntax, sessions, and authentication support.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-3-Clause. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Explore HTTP APIs interactively from a terminal.
- **Compare when:** Saved sessions can contain authentication material and should be managed accordingly.
- **Strengths:** Readable request syntax and formatted responses suit exploratory API work.
- **Limitations:** Saved sessions can contain authentication material and should be managed accordingly.; Repository activity is older than one year; current maintenance has not been established.
- **Maintenance:** unverified — Repository not archived; latest repository push observed 2024-12-17. Activity is not a runtime, security, or support guarantee. No push within the preceding year was observed; current support status needs reassessment. ([evidence](https://api.github.com/repos/httpie/cli))
- [Official project](https://httpie.io/cli) · [Official installation / downloads](https://httpie.io/docs/cli/installation) · [Repository](https://github.com/httpie/cli)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/httpie/cli) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/httpie/cli/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://httpie.io/cli) (2026-11-14; identity, features); [Official platforms download documentation](https://httpie.io/docs/cli/installation) (2026-11-14; identity, features, platforms, downloads); [Official release inspected: 3.2.4](https://github.com/httpie/cli/releases/tag/3.2.4) (2026-11-14; downloads, maintenance); [Public upstream app/package distribution: availability without payment or authentication checked](https://files.pythonhosted.org/packages/03/b6/39bcf01e1185882f34bc9fb77d1fb4a27911a55f60ab407de34abc8a2347/httpie-3.2.4-py3-none-any.whl) (2026-11-14; downloads, pricing)
### xh

HTTP command-line client inspired by HTTPie's syntax, implemented in Rust with formatted output.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Make readable API requests using a standalone CLI.
- **Compare when:** It intentionally does not implement every HTTPie behavior.
- **Strengths:** A standalone client offers concise HTTP request construction with familiar HTTPie-like syntax.
- **Limitations:** It intentionally does not implement every HTTPie behavior.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-06. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/ducaale/xh))
- [Official project](https://github.com/ducaale/xh) · [Official installation / downloads](https://github.com/ducaale/xh/releases) · [Repository](https://github.com/ducaale/xh)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/ducaale/xh) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/ducaale/xh/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official release inspected: v0.26.3](https://github.com/ducaale/xh/releases/tag/v0.26.3) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/ducaale/xh/releases/download/v0.26.3/xh-v0.26.3-x86_64-pc-windows-msvc.zip) (2026-11-14; downloads, pricing)

## HTTP interception and debugging

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fhttp-debugging)

### HTTP Toolkit

Desktop HTTP debugging tool that captures and inspects traffic from supported applications and runtimes.

- **Platforms:** Windows, macOS, Linux. **License:** AGPL for application components; Apache-2.0/MIT for reusable components. **Pricing model:** freemium.
- **Pick for:** Inspect local application API calls through a visual workflow.
- **Compare when:** Advanced interception and editing capabilities depend on product plan and target support.
- **Strengths:** Visual request filtering and application integrations reduce setup for supported debugging targets.
- **Limitations:** Advanced interception and editing capabilities depend on product plan and target support.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-02-04. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/httptoolkit/httptoolkit))
- [Official project](https://httptoolkit.com/) · [Official installation / downloads](https://httptoolkit.com/) · [Repository](https://github.com/httptoolkit/httptoolkit)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/httptoolkit/httptoolkit) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/httptoolkit/httptoolkit/HEAD/README.md) (2026-11-14; identity, features, platforms, license); [Official official documentation](https://httptoolkit.com/) (2026-11-14; downloads, features, identity); [Official source: Core features are free; Pro and Team subscriptions unlock additional capabilities.](https://httptoolkit.com/pricing/) (2026-11-14; pricing)
### mitmproxy

Interactive intercepting proxy for inspecting, replaying, modifying, and scripting HTTP traffic in authorized environments.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Debug an application's HTTP behavior using a repeatable inspection proxy.
- **Compare when:** HTTPS inspection requires explicitly trusted certificates and controlled testing scope.
- **Strengths:** Inspection, replay, and scripting make HTTP troubleshooting repeatable.
- **Limitations:** HTTPS inspection requires explicitly trusted certificates and controlled testing scope.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/mitmproxy/mitmproxy))
- [Official project](https://www.mitmproxy.org/) · [Official installation / downloads](https://github.com/mitmproxy/mitmproxy/releases) · [Repository](https://github.com/mitmproxy/mitmproxy)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/mitmproxy/mitmproxy) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/mitmproxy/mitmproxy/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://www.mitmproxy.org/) (2026-11-14; identity, features); [Official release inspected: v12.3.1](https://github.com/mitmproxy/mitmproxy/releases/tag/v12.3.1) (2026-11-14; downloads, maintenance); [Public upstream app/package distribution: availability without payment or authentication checked](https://files.pythonhosted.org/packages/a7/b2/886992a28a7bf86e47691d7a33e26eba370ee71d89b77d3128412910a33e/mitmproxy-12.3.1-py3-none-any.whl) (2026-11-14; downloads, pricing); [Official source: Native Windows installation, macOS installation and Linux packages are documented; capture modes differ by platform.](https://docs.mitmproxy.org/stable/overview/installation/) (2026-11-14; platforms, downloads)

## Integrated development environments

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fides)

### IntelliJ IDEA

Java and Kotlin IDE with code analysis, refactoring, debugging, tests, and optional advanced framework tooling.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary JetBrains product license; eligibility, free features and subscriptions depend on product. **Pricing model:** freemium.
- **Pick for:** Develop a Java or Kotlin application with integrated code navigation, refactoring, and testing.
- **Compare when:** The free feature set and paid Ultimate features differ; optional AI services have separate terms.
- **Strengths:** Language-aware project understanding supports substantial Java and Kotlin refactoring workflows.
- **Limitations:** The free feature set and paid Ultimate features differ; optional AI services have separate terms.
- **Maintenance:** unverified — Official product and distribution documentation reviewed; a recent dated release or repository activity was not independently established for this record. ([evidence](https://www.jetbrains.com/idea/))
- [Official project](https://www.jetbrains.com/idea/) · [Official installation / downloads](https://www.jetbrains.com/idea/download/)
- **Sources:** [Official product features and free-use scope](https://www.jetbrains.com/idea/) (2026-11-14; identity, features, pricing); [Official operating-system downloads](https://www.jetbrains.com/idea/download/) (2026-11-14; downloads, platforms); [JetBrains product use and subscription terms](https://www.jetbrains.com/legal/docs/toolbox/user/) (2026-11-14; license)
### JetBrains CLion

C and C++ IDE integrating code analysis, build-system support, debuggers, testing, and embedded-development workflows.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary JetBrains product license; eligibility, free features and subscriptions depend on product. **Pricing model:** mixed.
- **Pick for:** Manage a C or C++ project with integrated refactoring, build, and debugger workflows.
- **Compare when:** Toolchain setup remains necessary; free non-commercial eligibility and commercial subscription terms differ.
- **Strengths:** Build configuration and language-aware analysis are connected to debugging and tests.
- **Limitations:** Toolchain setup remains necessary; free non-commercial eligibility and commercial subscription terms differ.
- **Maintenance:** unverified — Official product and distribution documentation reviewed; a recent dated release or repository activity was not independently established for this record. ([evidence](https://www.jetbrains.com/clion/))
- [Official project](https://www.jetbrains.com/clion/) · [Official installation / downloads](https://www.jetbrains.com/clion/download/)
- **Sources:** [Official product features and free-use scope](https://www.jetbrains.com/clion/) (2026-11-14; identity, features, pricing); [Official operating-system downloads](https://www.jetbrains.com/clion/download/) (2026-11-14; downloads, platforms); [JetBrains product use and subscription terms](https://www.jetbrains.com/legal/docs/toolbox/user/) (2026-11-14; license)
### JetBrains Rider

Cross-platform .NET and game-development IDE with refactoring, debugging, testing, and game-engine integrations.

- **Platforms:** Windows, macOS, Linux. **License:** Proprietary JetBrains product license; eligibility, free features and subscriptions depend on product. **Pricing model:** mixed.
- **Pick for:** Develop and debug .NET or supported game-engine projects with integrated language tooling.
- **Compare when:** Free non-commercial licensing has eligibility conditions; commercial work requires the appropriate subscription.
- **Strengths:** Language-aware refactoring and engine support keep .NET game-development work in one IDE.
- **Limitations:** Free non-commercial licensing has eligibility conditions; commercial work requires the appropriate subscription.
- **Maintenance:** unverified — Official product and distribution documentation reviewed; a recent dated release or repository activity was not independently established for this record. ([evidence](https://www.jetbrains.com/rider/))
- [Official project](https://www.jetbrains.com/rider/) · [Official installation / downloads](https://www.jetbrains.com/rider/download/)
- **Sources:** [Official product features and free-use scope](https://www.jetbrains.com/rider/) (2026-11-14; identity, features, pricing); [Official operating-system downloads](https://www.jetbrains.com/rider/download/) (2026-11-14; downloads, platforms); [JetBrains product use and subscription terms](https://www.jetbrains.com/legal/docs/toolbox/user/) (2026-11-14; license); [Official supported languages, project types and desktop platforms](https://www.jetbrains.com/rider/features/) (2026-11-16; features, platforms)
### Positron

Data-science IDE based on Code OSS with integrated R and Python exploration and reproducible authoring workflows.

- **Platforms:** Windows, macOS, Linux. **License:** Elastic License 2.0; some components are MIT-licensed. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** Classification follows the cited official pricing or licensing explanation; optional services and third-party assets may have separate terms.
- **Pick for:** Work interactively in R and Python within a data-science-focused IDE.
- **Compare when:** Elastic License 2.0 is source-available rather than OSI open source; hosting it as a third-party service requires agreement.
- **Strengths:** An editor familiar to Code OSS users adds interactive data-science panels and runtimes.
- **Limitations:** Elastic License 2.0 is source-available rather than OSI open source; hosting it as a third-party service requires agreement.
- **Maintenance:** active — An upstream release was observed dated 2026-11-09. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/posit-dev/positron/releases/tag/2026.11.1-4))
- [Official project](https://positron.posit.co/) · [Official installation / downloads](https://positron.posit.co/download.html) · [Repository](https://github.com/posit-dev/positron)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/posit-dev/positron/HEAD/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/posit-dev/positron/HEAD/LICENSE.txt) (2026-11-14; license); [Official downloads or installation instructions](https://positron.posit.co/download.html) (2026-11-14; downloads, platforms); [Official documentation: Elastic License 2.0 source-available distribution is free for personal, academic and commercial use, with hosted-service restrictions.](https://positron.posit.co/licensing) (2026-11-14; license, pricing); [Observed upstream release record and date](https://github.com/posit-dev/positron/releases/tag/2026.11.1-4) (2026-11-14; downloads, maintenance)
### RStudio Desktop

Integrated development environment for R with consoles, source editing, plots, debugging and reproducible-document authoring.

- **Platforms:** Windows, macOS, Linux. **License:** AGPL-3.0 open-source edition; commercial editions separately licensed. **Pricing model:** freemium.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** Classification follows the cited official pricing or licensing explanation; optional services and third-party assets may have separate terms.
- **Pick for:** Develop an R analysis while inspecting variables, plots and reports.
- **Compare when:** The R runtime is separate; professional editions and optional AI services have different commercial terms.
- **Strengths:** Interactive variables, plots and source code share a workspace suited to statistical analysis.
- **Limitations:** The R runtime is separate; professional editions and optional AI services have different commercial terms.
- **Maintenance:** unverified — Official sources and distribution pages were reviewed; current maintenance commitments were not independently established.
- [Official project](https://posit.co/products/open-source/rstudio) · [Official installation / downloads](https://docs.posit.co/ide/user/download.html) · [Repository](https://github.com/rstudio/rstudio)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/rstudio/rstudio/HEAD/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/rstudio/rstudio/HEAD/COPYING) (2026-11-14; license); [Official downloads or installation instructions](https://docs.posit.co/ide/user/download.html) (2026-11-14; downloads); [Official documentation: Free AGPL RStudio Desktop download, with commercial products listed separately.](https://posit.co/downloads) (2026-11-14; pricing, license, downloads); [Official documentation: IDE documentation and current Windows, macOS and Linux host requirements.](https://docs.posit.co/ide/user/index.html) (2026-11-14; platforms, features); [Official documentation: Open-source RStudio uses AGPL; commercial editions use separate licenses.](https://support.posit.co/hc/en-us/articles/217801078-What-license-is-the-RStudio-IDE-available-under) (2026-11-14; license, pricing)
### Spyder

Scientific Python development environment combining an editor, IPython console, variable explorer, and debugging tools.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Inspect arrays and dataframes while developing analysis scripts.
- **Compare when:** Scientific dependencies and environment selection can require setup.
- **Strengths:** The variable explorer and IPython console keep scientific data inspection close to code.
- **Limitations:** Scientific dependencies and environment selection can require setup.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/spyder-ide/spyder))
- [Official project](https://www.spyder-ide.org/) · [Official installation / downloads](https://github.com/spyder-ide/spyder/releases) · [Repository](https://github.com/spyder-ide/spyder)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/spyder-ide/spyder) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/spyder-ide/spyder/HEAD/README.md) (2026-11-14; identity, features); [Official official documentation](https://www.spyder-ide.org/) (2026-11-14; identity, features); [Official release inspected: v6.1.8](https://github.com/spyder-ide/spyder/releases/tag/v6.1.8) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/spyder-ide/spyder/releases/download/v6.1.8/Spyder-Windows-x86_64.exe) (2026-11-14; downloads, pricing)
### Thonny

Python IDE aimed at learning, with a debugger that exposes expression evaluation and variable state.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Learn Python execution and debug beginner programs visually.
- **Compare when:** Its teaching-focused interface is less suited to large multi-language projects.
- **Strengths:** The debugger makes expression evaluation and variable changes visible to learners.
- **Limitations:** Its teaching-focused interface is less suited to large multi-language projects.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-12. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/thonny/thonny))
- [Official project](https://thonny.org/) · [Official installation / downloads](https://github.com/thonny/thonny/releases) · [Repository](https://github.com/thonny/thonny)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/thonny/thonny) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/thonny/thonny/HEAD/README.rst) (2026-11-14; identity); [Official official documentation](https://thonny.org/) (2026-11-14; identity, features, platforms); [Official release inspected: v5.0.1](https://github.com/thonny/thonny/releases/tag/v5.0.1) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/thonny/thonny/releases/download/v5.0.1/thonny-5.0.1-windows-portable-x64.zip) (2026-11-14; downloads, pricing)

## JavaScript and TypeScript runtimes

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fjavascript-runtimes)

### Bun

JavaScript and TypeScript toolkit combining a runtime, package manager, bundler and test runner.

- **Platforms:** Windows, macOS, Linux. **License:** MIT core; JavaScriptCore/WebKit and bundled dependencies retain their own licenses. **Pricing model:** unknown.
- **Compatibility details:** Official README lists Windows, Linux and macOS x64/ARM64. Linux kernel and x64 CPU requirements vary by build and must be checked.
- **Pricing details:** Open-source code and a public installation route are documented. A separate explicit pricing statement for the current distribution was not established in this review.
- **Pick for:** You want to evaluate a single toolkit for runtime, dependencies, building and testing.
- **Compare when:** Compare Deno for permission-oriented execution and pnpm/npm for a package-manager change that keeps the existing runtime.
- **Strengths:** One executable covers several stages of a JavaScript project workflow; Can be evaluated incrementally as a package manager or runtime
- **Limitations:** Node API and native-module compatibility should be validated on the actual application; No general speed ranking is established here; performance depends on workload and configuration
- **Maintenance:** active — Official release bun-v1.4.4 is dated 2026-10-22. This is a release observation; installation and performance were not independently tested. ([evidence](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.4))
- [Official project](https://bun.com/) · [Official installation / downloads](https://bun.com/docs/installation) · [Repository](https://github.com/oven-sh/bun)
- **Sources:** [Official project documentation](https://github.com/oven-sh/bun/blob/main/README.md) (2026-11-16; identity, features, platforms, downloads); [Official application and dependency licensing](https://github.com/oven-sh/bun/blob/main/LICENSE.md) (2026-11-16; license); [Official dated release and distribution](https://github.com/oven-sh/bun/releases/tag/bun-v1.4.4) (2026-11-16; maintenance, downloads)
### Deno

JavaScript, TypeScript and WebAssembly runtime with explicit permissions and integrated developer tools.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** Official installation and release packages cover supported Windows, macOS and Linux architectures; check runtime version and native dependencies.
- **Pricing details:** Open-source code and a public installation route are documented. A separate explicit pricing statement for the current distribution was not established in this review.
- **Pick for:** You want TypeScript execution, integrated tooling and an explicit runtime permission model.
- **Compare when:** Compare Bun for its integrated package and runtime workflow; test existing Node applications rather than assuming compatibility.
- **Strengths:** Combines a runtime and common development tasks in one CLI; Permission prompts make requested filesystem and network access visible
- **Limitations:** Node compatibility still needs testing against the application and its native modules; Permissions are not a substitute for auditing code or a complete hostile-code sandbox
- **Maintenance:** active — Official release v2.9.8 is dated 2026-10-21. This is a release observation; installation and performance were not independently tested. ([evidence](https://github.com/denoland/deno/releases/tag/v2.9.8))
- [Official project](https://deno.com/) · [Official installation / downloads](https://github.com/denoland/deno#installation) · [Repository](https://github.com/denoland/deno)
- **Sources:** [Official project documentation](https://github.com/denoland/deno/blob/main/README.md) (2026-11-16; identity, features, platforms, downloads); [Official application and dependency licensing](https://github.com/denoland/deno/blob/main/LICENSE.md) (2026-11-16; license); [Official runtime features](https://docs.deno.com/runtime/) (2026-11-16; features); [Official dated release and distribution](https://github.com/denoland/deno/releases/tag/v2.9.8) (2026-11-16; maintenance, downloads)

## Load testing

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fload-testing)

### Apache JMeter

Java application for building load-test plans across web, database, messaging and other protocols.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** The reviewed upstream source is distributed at no charge and includes a documented build/install route. This does not establish free prebuilt binaries for every platform.
- **Pick for:** Build protocol-level load tests across HTTP, JDBC or messaging services.
- **Compare when:** Real load runs should use the documented non-GUI mode; protocol simulation does not execute a full browser.
- **Strengths:** A broad sampler catalog helps test systems with more than an HTTP interface.
- **Limitations:** Real load runs should use the documented non-GUI mode; protocol simulation does not execute a full browser.
- **Maintenance:** unverified — The observed upstream release is dated 2024-01-09; an older release alone does not establish abandonment or current support.
- [Official project](https://jmeter.apache.org/) · [Official installation / downloads](https://jmeter.apache.org/download_jmeter.cgi) · [Repository](https://github.com/apache/jmeter)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/apache/jmeter/blob/master/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://github.com/apache/jmeter/blob/master/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://jmeter.apache.org/download_jmeter.cgi) (2026-11-14; downloads); [Public upstream source distribution; binary packaging is separate](https://github.com/apache/jmeter/archive/HEAD.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/apache/jmeter/releases/tag/rel/v5.6.3) (2026-11-14; downloads, maintenance)
### Grafana k6

Scriptable load-testing tool with JavaScript scenarios, thresholds and several protocol integrations.

- **Platforms:** Windows, macOS, Linux. **License:** AGPL-3.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Exercise a service under a defined workload and assert response-time thresholds.
- **Compare when:** Load generators need adequate capacity and realistic scripts; Grafana Cloud execution and services have separate pricing.
- **Strengths:** Test scripts and thresholds turn expected performance behavior into repeatable CI checks.
- **Limitations:** Load generators need adequate capacity and realistic scripts; Grafana Cloud execution and services have separate pricing.
- **Maintenance:** active — An upstream release was observed dated 2026-11-12. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/grafana/k6/releases/tag/v2.4.0))
- [Official project](https://grafana.com/oss/k6/) · [Official installation / downloads](https://grafana.com/docs/k6/latest/set-up/install-k6/) · [Repository](https://github.com/grafana/k6)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/grafana/k6/blob/master/README.md) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://github.com/grafana/k6/blob/master/LICENSE.md) (2026-11-14; license); [Official downloads or installation instructions](https://grafana.com/docs/k6/latest/set-up/install-k6/) (2026-11-14; downloads, platforms); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/grafana/k6/releases/download/v2.4.0/k6-v2.4.0-linux-amd64.deb) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/grafana/k6/releases/tag/v2.4.0) (2026-11-14; downloads, maintenance)
### Locust

Load-testing tool that describes user behavior in Python and exposes live results through a web interface or CLI.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Model realistic users with Python and inspect response distributions.
- **Compare when:** Python dependencies and load-generator limits matter; hosted Locust services are separate from the open-source package.
- **Strengths:** Ordinary Python code makes stateful service scenarios and custom protocol clients extensible.
- **Limitations:** Python dependencies and load-generator limits matter; hosted Locust services are separate from the open-source package.
- **Maintenance:** active — An upstream release was observed dated 2026-10-21. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/locustio/locust/releases/tag/2.47.0))
- [Official project](https://locust.io/) · [Official installation / downloads](https://docs.locust.io/en/stable/installation.html) · [Repository](https://github.com/locustio/locust)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/locustio/locust/blob/master/README.md) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://github.com/locustio/locust/blob/master/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://docs.locust.io/en/stable/installation.html) (2026-11-14; downloads, platforms); [Public upstream app/package distribution: unauthenticated availability checked](https://files.pythonhosted.org/packages/77/47/142fc373ec814bfaf04f288cd1f33f39635955b16d99debe03de9937da2d/locust-2.47.0-py3-none-any.whl) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/locustio/locust/releases/tag/2.47.0) (2026-11-14; downloads, maintenance)
### oha

HTTP load generator with a live terminal dashboard, request controls and machine-readable results.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Run a focused HTTP load experiment from the terminal.
- **Compare when:** Results depend on client capacity and test conditions; HTTP/3 is an explicitly experimental build option.
- **Strengths:** A single focused executable suits interactive endpoint experiments with visible progress.
- **Limitations:** Results depend on client capacity and test conditions; HTTP/3 is an explicitly experimental build option.
- **Maintenance:** active — An upstream release was observed dated 2026-11-14. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/hatoo/oha/releases/tag/v1.17.0))
- [Official project](https://github.com/hatoo/oha) · [Official installation / downloads](https://github.com/hatoo/oha/releases) · [Repository](https://github.com/hatoo/oha)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/hatoo/oha/blob/master/README.md) (2026-11-14; downloads, features, identity, platforms); [Official license text or upstream licensing metadata](https://github.com/hatoo/oha/blob/master/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/hatoo/oha/releases) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/hatoo/oha/releases/download/v1.17.0/oha-windows-amd64-pgo.exe) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/hatoo/oha/releases/tag/v1.17.0) (2026-11-14; downloads, maintenance)
### Vegeta

Command-line HTTP load generator designed around a specified request rate and composable reports.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Measure an HTTP endpoint under a controlled request rate.
- **Compare when:** Complex stateful user journeys need scripting or another framework; some DNS options vary by OS.
- **Strengths:** An explicit arrival rate helps examine how a service behaves as traffic stays constant.
- **Limitations:** Complex stateful user journeys need scripting or another framework; some DNS options vary by OS.
- **Maintenance:** unverified — The observed upstream release is dated 2025-10-31; an older release alone does not establish abandonment or current support.
- [Official project](https://github.com/tsenart/vegeta) · [Official installation / downloads](https://github.com/tsenart/vegeta/releases) · [Repository](https://github.com/tsenart/vegeta)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/tsenart/vegeta/blob/master/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://github.com/tsenart/vegeta/blob/master/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/tsenart/vegeta/releases) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/tsenart/vegeta/releases/download/v12.13.0/vegeta_12.13.0_darwin_amd64.tar.gz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/tsenart/vegeta/releases/tag/v12.13.0) (2026-11-14; downloads, maintenance)

## Local web development environments

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Flocal-web-development)

### DDEV

Container-based local web development with per-project PHP, database and web-server configuration.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Requires a supported Docker provider; official instructions cover Windows/WSL2, macOS and Linux on supported architectures.
- **Pricing details:** The local open-source application is available without a license fee. Optional hosting, support, dependencies and infrastructure have separate terms.
- **Pick for:** You need a documented local PHP/CMS environment with databases, HTTPS and debugging included.
- **Compare when:** Compare Lando for its broader recipe and service composition; choose Devbox when you mainly need tools in a shell.
- **Strengths:** Common CMS development services have a documented, repeatable setup; Project configuration can travel with the repository
- **Limitations:** Docker provider requirements and licensing are separate from DDEV; A local development stack is not automatically a production hosting configuration
- **Maintenance:** active — Official release v1.25.5 is dated 2026-10-26. This is a release observation; installation and performance were not independently tested. ([evidence](https://github.com/ddev/ddev/releases/tag/v1.25.5))
- [Official project](https://ddev.com/) · [Official installation / downloads](https://docs.ddev.com/en/stable/users/install/ddev-installation/) · [Repository](https://github.com/ddev/ddev)
- **Sources:** [Official project documentation](https://github.com/ddev/ddev/blob/main/README.md) (2026-11-16; identity, features, platforms, downloads, pricing); [Official application and dependency licensing](https://github.com/ddev/ddev/blob/main/LICENSE) (2026-11-16; license); [Official installation requirements](https://docs.ddev.com/en/stable/users/install/ddev-installation/) (2026-11-16; platforms, downloads); [Official dated release and distribution](https://github.com/ddev/ddev/releases/tag/v1.25.5) (2026-11-16; maintenance, downloads)
### Lando

Local development environment manager that assembles container services, commands and application recipes in a Landofile.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Official installer supports Windows, macOS and Linux; Docker-based services require the supported engine and host configuration.
- **Pricing details:** The local open-source application is available without a license fee. Optional hosting, support, dependencies and infrastructure have separate terms.
- **Pick for:** Your web project needs a repeatable collection of services and custom developer commands.
- **Compare when:** Compare DDEV for a focused CMS workflow or plain shell environment tools for projects without service containers.
- **Strengths:** A Landofile captures service setup and project-specific commands together; Recipes offer a starting point while allowing lower-level customization
- **Limitations:** Docker setup and service resource use remain part of the workflow; Plugin, engine and recipe versions can affect an existing project
- **Maintenance:** active — Official release v3.26.9 is dated 2026-08-20. This is a release observation; installation and performance were not independently tested. ([evidence](https://github.com/lando/lando/releases/tag/v3.26.9))
- [Official project](https://lando.dev/) · [Official installation / downloads](https://docs.lando.dev/install/) · [Repository](https://github.com/lando/lando)
- **Sources:** [Official project documentation](https://github.com/lando/lando/blob/main/README.md) (2026-11-16; identity, features, platforms, downloads, pricing); [Official application and dependency licensing](https://github.com/lando/lando/blob/main/LICENSE) (2026-11-16; license); [Official platform installation routes](https://docs.lando.dev/install/) (2026-11-16; platforms, downloads); [Official dated release and distribution](https://github.com/lando/lando/releases/tag/v3.26.9) (2026-11-16; maintenance, downloads)

## Memory profiling

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fmemory-profiling)

### Heaptrack

Linux heap profiler that records allocation stack traces and offers graphical and command-line analysis.

- **Platforms:** Linux. **License:** GPL-2.0-or-later application with LGPL-2.1-or-later components. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** The reviewed upstream source is distributed at no charge and includes a documented build/install route. This does not establish free prebuilt binaries for every platform.
- **Pick for:** Locate native-program allocation hotspots and retained heap memory.
- **Compare when:** Collection targets Linux; debug symbols and supported allocation paths affect interpretation. Analysis components can be built on macOS.
- **Strengths:** Allocation counts and lifetimes help distinguish retained memory from repeated temporary allocations.
- **Limitations:** Collection targets Linux; debug symbols and supported allocation paths affect interpretation. Analysis components can be built on macOS.
- **Maintenance:** unverified — The observed upstream release is dated 2021-12-21; an older release alone does not establish abandonment or current support.
- [Official project](https://apps.kde.org/heaptrack/) · [Official installation / downloads](https://apps.kde.org/heaptrack/) · [Repository](https://github.com/KDE/heaptrack)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/KDE/heaptrack/HEAD/README.md) (2026-11-14; downloads, features, identity, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/KDE/heaptrack/HEAD/LICENSES/LGPL-2.1-or-later.txt) (2026-11-14; license); [Official downloads or installation instructions](https://apps.kde.org/heaptrack/) (2026-11-14; downloads, features, license, platforms); [Public upstream source distribution; binary packaging is separate](https://github.com/KDE/heaptrack/archive/HEAD.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/KDE/heaptrack/releases/tag/v1.3.0) (2026-11-14; downloads, maintenance)
### Memray

Python memory profiler tracking allocations in Python code and native extension stacks.

- **Platforms:** macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Trace Python memory growth back to allocating functions.
- **Compare when:** Supported on Linux and macOS, with extra build dependencies when a compatible wheel is unavailable.
- **Strengths:** Native extension allocations remain visible when Python-only accounting misses memory growth.
- **Limitations:** Supported on Linux and macOS, with extra build dependencies when a compatible wheel is unavailable.
- **Maintenance:** active — An upstream release was observed dated 2026-08-07. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/bloomberg/memray/releases/tag/v1.20.0))
- [Official project](https://bloomberg.github.io/memray/) · [Official installation / downloads](https://bloomberg.github.io/memray/getting_started.html) · [Repository](https://github.com/bloomberg/memray)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/bloomberg/memray/blob/main/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://github.com/bloomberg/memray/blob/main/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://bloomberg.github.io/memray/getting_started.html) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://files.pythonhosted.org/packages/ec/65/2d782edb420aa21ab1a27de559a82f67a9ebb0eb09c49b9f254debb27b6b/memray-1.20.0-cp310-cp310-macosx_10_14_x86_64.whl) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/bloomberg/memray/releases/tag/v1.20.0) (2026-11-14; downloads, maintenance)
### Valgrind

Dynamic-analysis suite with memory-error detection, thread checks and CPU/cache profiling tools.

- **Platforms:** Linux, FreeBSD. **License:** GPL-3.0-or-later with BSD-style client headers. **Pricing model:** free.
- **Compatibility details:** Linux and FreeBSD are included here. Upstream also lists specific legacy Intel macOS versions; no native Windows or general modern macOS claim is made.
- **Pricing details:** Classification follows the cited official pricing or licensing explanation; optional services and third-party assets may have separate terms.
- **Pick for:** Investigate native memory errors or threading issues on a supported system.
- **Compare when:** Instrumentation substantially slows execution; platform support is specific and modern Apple Silicon support is not implied.
- **Strengths:** Instrumented execution can identify classes of memory errors that sampling profilers do not capture.
- **Limitations:** Instrumentation substantially slows execution; platform support is specific and modern Apple Silicon support is not implied.
- **Maintenance:** active — The official project page lists a release dated 2026-10-23. Release activity is not a support or runtime-quality guarantee. ([evidence](https://valgrind.org/))
- [Official project](https://valgrind.org/) · [Official installation / downloads](https://valgrind.org/downloads/)
- **Sources:** [Official project README: documented behavior and installation](https://valgrind.org/) (2026-11-14; downloads, features, identity, license, maintenance, platforms, pricing); [Official downloads or installation instructions](https://valgrind.org/downloads/) (2026-11-14; downloads); [Official documentation: Linux and FreeBSD CPU/OS combinations are supported; macOS coverage is limited to specific legacy Intel combinations.](https://valgrind.org/info/platforms.html) (2026-11-14; platforms); [Official documentation: GPL-3.0-or-later tool code with BSD-style client request headers.](https://valgrind.org/docs/manual/manual-intro.html) (2026-11-14; license)

## Computational notebooks

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fnotebooks)

### Jupyter Notebook

Browser-based notebook application combining code cells, text and outputs through language kernels.

- **Platforms:** Web. **License:** BSD-3-Clause. **Pricing model:** free.
- **Compatibility details:** Local or hosted Python server accessed from a browser; kernels and packages determine actual computation requirements.
- **Pricing details:** Public open-source package has no product fee; hosted notebook services are separate.
- **Pick for:** You want a focused interface for existing Jupyter notebook workflows.
- **Compare when:** Choose JupyterLab for a broader multi-document workspace or marimo for reactive Python files.
- **Strengths:** Widely used notebook format connects tools and teaching materials; A focused notebook interface can run on a local server
- **Limitations:** Hidden execution state requires disciplined reproducibility practices; Classic v6 extensions are not automatically compatible with Notebook v7
- **Maintenance:** active — Official release v7.6.5 is dated 2026-11-06; installation and performance were not independently tested. ([evidence](https://github.com/jupyter/notebook/releases/tag/v7.6.5))
- [Official project](https://jupyter.org/) · [Official installation / downloads](https://jupyter.org/install) · [Repository](https://github.com/jupyter/notebook)
- **Sources:** [Official product overview](https://jupyter.org/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/jupyter/notebook/main/README.md) (2026-11-15; identity, features, downloads, platforms); [Official licensing terms](https://raw.githubusercontent.com/jupyter/notebook/main/LICENSE) (2026-11-15; license); [Distribution and pricing qualification](https://jupyter.org/install) (2026-11-15; pricing, downloads); [Official dated release](https://github.com/jupyter/notebook/releases/tag/v7.6.5) (2026-11-15; maintenance, downloads)
### JupyterLab

Browser-based local workspace for notebooks, code, terminals, data files, and interactive computation.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-3-Clause. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Combine explanatory text, code execution, and exploratory data analysis locally.
- **Compare when:** Kernel environments and extensions must be managed separately from the interface.
- **Strengths:** Code, narrative, outputs, and data files can be explored together in one workspace.
- **Limitations:** Kernel environments and extensions must be managed separately from the interface.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/jupyterlab/jupyterlab))
- [Official project](https://jupyter.org/) · [Official installation / downloads](https://jupyter.org/install) · [Repository](https://github.com/jupyterlab/jupyterlab)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/jupyterlab/jupyterlab) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/jupyterlab/jupyterlab/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official official documentation](https://jupyter.org/) (2026-11-14; identity, features); [Official release inspected: v4.6.6](https://github.com/jupyterlab/jupyterlab/releases/tag/v4.6.6) (2026-11-14; downloads, maintenance); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/jupyterlab/jupyterlab/releases/download/v4.6.6/jupyterlab-4.6.6-py3-none-any.whl) (2026-11-15; downloads, pricing)
### marimo

Reactive Python notebook that stores programs as Python files and can run as a script or interactive app.

- **Platforms:** Windows, macOS, Linux, Web. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Publisher metadata declares OS-independent Python and web environments; a supported Python installation and browser are required.
- **Pricing details:** Local open-source package is publicly installable without a product fee; hosting and optional model services are separate.
- **Pick for:** You want notebook interactivity with explicit dependencies and reviewable Python source.
- **Compare when:** Use Jupyter for its established notebook interchange or when existing extensions are required.
- **Strengths:** Code diffs use ordinary Python files; Reactive execution makes cell dependencies explicit
- **Limitations:** Reactive dependency rules require adapting some notebook patterns; Python packages and optional model services have separate requirements
- **Maintenance:** active — Official release 0.25.2 is dated 2026-10-19; installation and performance were not independently tested. ([evidence](https://github.com/marimo-team/marimo/releases/tag/0.25.2))
- [Official project](https://marimo.io/) · [Official installation / downloads](https://github.com/marimo-team/marimo#quickstart) · [Repository](https://github.com/marimo-team/marimo)
- **Sources:** [Official product overview](https://marimo.io/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/marimo-team/marimo/main/README.md) (2026-11-15; identity, features, downloads, pricing); [Official licensing terms](https://raw.githubusercontent.com/marimo-team/marimo/main/LICENSE) (2026-11-15; license); [Documented deployment and platform scope](https://pypi.org/pypi/marimo/json) (2026-11-15; platforms); [Official download or installation entry point](https://github.com/marimo-team/marimo#quickstart) (2026-11-15; downloads); [Official dated release](https://github.com/marimo-team/marimo/releases/tag/0.25.2) (2026-11-15; maintenance, downloads)

## JavaScript package managers

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fpackage-managers)

### npm CLI

Command-line package manager distributed with Node.js for installing, publishing and scripting JavaScript packages.

- **Platforms:** Windows, macOS, Linux. **License:** Artistic-2.0 for the CLI; dependencies and registry service have separate terms. **Pricing model:** unknown.
- **Compatibility details:** Runs on supported Node.js versions; the official installation guide covers Windows, macOS and Linux. CLI compatibility depends on the selected Node/npm release pair.
- **Pricing details:** Open-source code and a public installation route are documented. A separate explicit pricing statement for the current distribution was not established in this review.
- **Pick for:** You need the standard Node.js package workflow without adding another package-manager dependency.
- **Compare when:** Compare pnpm for shared dependency storage or Yarn for its workspace and resolution models.
- **Strengths:** Bundled with common Node.js distributions and widely documented; A standard package.json workflow minimizes extra package-manager setup
- **Limitations:** The open-source CLI does not imply free private registry or organizational services; Install scripts, dependency updates and runtime compatibility need project policy
- **Maintenance:** active — Official release v12.2.2 is dated 2026-11-04. This is a release observation; installation and performance were not independently tested. ([evidence](https://github.com/npm/cli/releases/tag/v12.2.2))
- [Official project](https://docs.npmjs.com/cli/) · [Official installation / downloads](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) · [Repository](https://github.com/npm/cli)
- **Sources:** [Official project documentation](https://github.com/npm/cli/blob/latest/README.md) (2026-11-16; identity, features, platforms, downloads); [Official application and dependency licensing](https://github.com/npm/cli/blob/latest/LICENSE) (2026-11-16; license); [Official installation and Node.js requirement](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (2026-11-16; platforms, downloads); [Official locked CI installation behavior](https://docs.npmjs.com/cli/v12/commands/npm-ci) (2026-11-16; features); [Official dated release and distribution](https://github.com/npm/cli/releases/tag/v12.2.2) (2026-11-16; maintenance, downloads)
### pnpm

JavaScript package manager using a shared content-addressed store, lockfiles and workspace support.

- **Platforms:** Windows, macOS, Linux. **License:** MIT for pnpm; pnpr directory uses PolyForm Shield 1.0.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Manage dependencies across JavaScript workspaces with a shared package store.
- **Compare when:** Some packages assume a different node_modules layout; the repository also contains pnpr under PolyForm Shield terms.
- **Strengths:** A shared package store and explicit dependency visibility help manage many related projects.
- **Limitations:** Some packages assume a different node_modules layout; the repository also contains pnpr under PolyForm Shield terms.
- **Maintenance:** active — An upstream release was observed dated 2026-11-05. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/pnpm/pnpm/releases/tag/v12.18.0))
- [Official project](https://pnpm.io/) · [Official installation / downloads](https://pnpm.io/installation) · [Repository](https://github.com/pnpm/pnpm)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/pnpm/pnpm/HEAD/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/pnpm/pnpm/main/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://pnpm.io/installation) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://registry.npmjs.org/pnpm/-/pnpm-12.21.0.tgz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/pnpm/pnpm/releases/tag/v12.18.0) (2026-11-14; downloads, maintenance)
### Yarn

Modern JavaScript package manager with workspaces, extensible commands and configurable dependency installation strategies.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-2-Clause. **Pricing model:** unknown.
- **Compatibility details:** Requires a supported Node.js version; official documentation covers Corepack-based project setup. Portable package scripts target Windows, macOS and Linux.
- **Pricing details:** Open-source code and a public installation route are documented. A separate explicit pricing statement for the current distribution was not established in this review.
- **Pick for:** A JavaScript monorepo needs workspace tooling and deliberate control over dependency resolution.
- **Compare when:** Compare pnpm or npm when conventional node_modules behavior and existing CI integration dominate the decision.
- **Strengths:** Dependency strategy and package-manager version can be recorded per project; Workspace and constraint tools support coordinated multi-package repositories
- **Limitations:** Modern Yarn differs from Yarn Classic and may require a migration; Plug’n’Play can expose tool assumptions about node_modules; integration must be checked
- **Maintenance:** active — Official release @yarnpkg/cli/4.18.1 is dated 2026-09-24. This is a release observation; installation and performance were not independently tested. ([evidence](https://github.com/yarnpkg/berry/releases/tag/%40yarnpkg/cli/4.18.1))
- [Official project](https://yarnpkg.com/) · [Official installation / downloads](https://yarnpkg.com/getting-started/install) · [Repository](https://github.com/yarnpkg/berry)
- **Sources:** [Official project documentation](https://github.com/yarnpkg/berry/blob/master/README.md) (2026-11-16; identity, features, platforms, downloads); [Official application and dependency licensing](https://github.com/yarnpkg/berry/blob/master/LICENSE.md) (2026-11-16; license); [Official project installation](https://yarnpkg.com/getting-started/install) (2026-11-16; platforms, downloads); [Official dependency resolution behavior](https://yarnpkg.com/features/pnp) (2026-11-16; features); [Official dated release and distribution](https://github.com/yarnpkg/berry/releases/tag/%40yarnpkg/cli/4.18.1) (2026-11-16; maintenance, downloads)

## Performance profiling

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fperformance-profiling)

### async-profiler

Sampling profiler for HotSpot-based JVMs with CPU, allocation, lock and native-stack views.

- **Platforms:** macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Find CPU, allocation or lock hotspots in a Java process.
- **Compare when:** Targets compatible HotSpot JVMs on Linux and macOS; permissions and profiler mode determine available events.
- **Strengths:** Java, runtime and native frames can be examined together when diagnosing JVM workloads.
- **Limitations:** Targets compatible HotSpot JVMs on Linux and macOS; permissions and profiler mode determine available events.
- **Maintenance:** active — An upstream release was observed dated 2026-10-19. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/async-profiler/async-profiler/releases/tag/v4.6))
- [Official project](https://github.com/async-profiler/async-profiler) · [Official installation / downloads](https://github.com/async-profiler/async-profiler/releases) · [Repository](https://github.com/async-profiler/async-profiler)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/async-profiler/async-profiler/blob/master/README.md) (2026-11-14; downloads, features, identity, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/async-profiler/async-profiler/HEAD/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/async-profiler/async-profiler/releases) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/async-profiler/async-profiler/releases/download/v4.6/async-profiler-4.6-linux-x64.tar.gz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/async-profiler/async-profiler/releases/tag/v4.6) (2026-11-14; downloads, maintenance)
### Hotspot

Graphical viewer and recorder for Linux perf profiles, including call trees, flame graphs and timelines.

- **Platforms:** Linux. **License:** GPL-2.0-or-later. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Explore Linux CPU and off-CPU profiles without manually reading perf reports.
- **Compare when:** Requires Linux perf data and suitable symbols; recording permissions and kernel event availability affect coverage.
- **Strengths:** Interactive filtering connects sampled stacks with the time interval that needs investigation.
- **Limitations:** Requires Linux perf data and suitable symbols; recording permissions and kernel event availability affect coverage.
- **Maintenance:** active — An upstream release was observed dated 2026-02-27. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/KDAB/hotspot/releases/tag/v1.6.0))
- [Official project](https://github.com/KDAB/hotspot) · [Official installation / downloads](https://github.com/KDAB/hotspot/releases) · [Repository](https://github.com/KDAB/hotspot)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/KDAB/hotspot/HEAD/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/KDAB/hotspot/HEAD/LICENSE.GPL.txt) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/KDAB/hotspot/releases) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/KDAB/hotspot/releases/download/v1.6.0/hotspot-v1.6.0-x86_64.AppImage) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/KDAB/hotspot/releases/tag/v1.6.0) (2026-11-14; downloads, maintenance)
### Perfetto

Tracing toolkit and trace viewer for system and application performance investigations.

- **Platforms:** Windows, macOS, Linux, Web. **License:** Apache-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Correlate CPU scheduling and application events in a shared timeline.
- **Compare when:** Capture capabilities differ by operating system and data source.
- **Strengths:** Trace timelines and SQL analysis support investigation across several event sources.
- **Limitations:** Capture capabilities differ by operating system and data source.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/google/perfetto))
- [Official project](https://perfetto.dev/) · [Official installation / downloads](https://github.com/google/perfetto/releases) · [Repository](https://github.com/google/perfetto)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/google/perfetto) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/google/perfetto/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official official documentation](https://perfetto.dev/) (2026-11-14; identity, features); [Official release inspected: v59.1](https://github.com/google/perfetto/releases/tag/v59.1) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/google/perfetto/releases/download/v59.1/windows-amd64.zip) (2026-11-14; downloads, pricing)
### py-spy

Sampling profiler that inspects running CPython processes and exports flame graphs or speedscope profiles.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Find where a running Python process spends CPU time.
- **Compare when:** Process-inspection permissions and native-extension coverage vary by OS; PyPy and some interpreter configurations are unsupported.
- **Strengths:** It can investigate a running Python process without adding instrumentation to application code.
- **Limitations:** Process-inspection permissions and native-extension coverage vary by OS; PyPy and some interpreter configurations are unsupported.
- **Maintenance:** active — An upstream release was observed dated 2026-11-02. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/benfred/py-spy/releases/tag/v0.4.3))
- [Official project](https://github.com/benfred/py-spy) · [Official installation / downloads](https://github.com/benfred/py-spy/releases) · [Repository](https://github.com/benfred/py-spy)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/benfred/py-spy/blob/master/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://github.com/benfred/py-spy/blob/master/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/benfred/py-spy/releases) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/benfred/py-spy/releases/download/v0.4.3/py_spy-0.4.3-py2.py3-none-macosx_10_12_universal2.macosx_10_12_x86_64.macosx_11_0_arm64.whl) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/benfred/py-spy/releases/tag/v0.4.3) (2026-11-14; downloads, maintenance)
### samply

Command-line CPU profiler that opens captured profiles in the Firefox Profiler interface.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0 OR MIT. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Capture a native application profile and inspect its timeline visually.
- **Compare when:** OS process permissions and available symbols matter; supported event types differ between platforms.
- **Strengths:** A shared visual interface can inspect samples from native applications across desktop operating systems.
- **Limitations:** OS process permissions and available symbols matter; supported event types differ between platforms.
- **Maintenance:** unverified — The observed upstream release is dated 2025-02-01; an older release alone does not establish abandonment or current support.
- [Official project](https://github.com/mstange/samply) · [Official installation / downloads](https://github.com/mstange/samply/releases) · [Repository](https://github.com/mstange/samply)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/mstange/samply/blob/main/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://github.com/mstange/samply/blob/main/LICENSE-APACHE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/mstange/samply/releases) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/mstange/samply/releases/download/samply-v0.13.1/samply-x86_64-pc-windows-msvc.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/mstange/samply/releases/tag/samply-v0.13.1) (2026-11-14; downloads, maintenance)
### Scalene

Python profiler separating Python and native CPU work, memory behavior and supported GPU activity.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Windows, macOS and Linux are supported. Current Windows memory profiling requires the documented Microsoft runtime prerequisites.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Inspect CPU and memory hotspots in a Python script.
- **Compare when:** GPU visibility depends on hardware/backend support; optional AI optimization suggestions may use external providers and do not establish correctness.
- **Strengths:** CPU and allocation information in one report helps distinguish different causes of slow Python code.
- **Limitations:** GPU visibility depends on hardware/backend support; optional AI optimization suggestions may use external providers and do not establish correctness.
- **Maintenance:** active — An upstream release was observed dated 2026-10-23. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/plasma-umass/scalene/releases/tag/v2.4.0))
- [Official project](https://github.com/plasma-umass/scalene) · [Official installation / downloads](https://github.com/plasma-umass/scalene#installation) · [Repository](https://github.com/plasma-umass/scalene)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/plasma-umass/scalene/blob/master/README.md) (2026-11-14; downloads, features, identity, license, platforms); [Official license text or upstream licensing metadata](https://github.com/plasma-umass/scalene/blob/master/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/plasma-umass/scalene#installation) (2026-11-14; downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://files.pythonhosted.org/packages/b0/c4/17cd8870a8c40736c2af5447ba4fa39b3454e4e97828db77074cc84a26f5/scalene-2.4.0-cp310-cp310-macosx_26_0_universal2.whl) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/plasma-umass/scalene/releases/tag/v2.4.0) (2026-11-14; downloads, maintenance)
### Speedscope

Interactive browser viewer for sampled profiles with flame graphs and several analysis views.

- **Platforms:** Web. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Runs in a supported web browser. Profiles are imported into the web application rather than a platform-native profiler.
- **Pricing details:** The upstream source was publicly accessible at no charge and its build/install route was reviewed. This establishes no-cost source availability, not free prebuilt binaries on every platform.
- **Pick for:** Inspect sampled stack traces to identify expensive call paths.
- **Compare when:** It visualizes imported profiles and does not capture application performance itself.
- **Strengths:** Several profile views help distinguish expensive stacks from frequently repeated calls.
- **Limitations:** It visualizes imported profiles and does not capture application performance itself.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-05-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/jlfwong/speedscope))
- [Official project](https://www.speedscope.app/) · [Official installation / downloads](https://www.speedscope.app/) · [Repository](https://github.com/jlfwong/speedscope)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/jlfwong/speedscope) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/jlfwong/speedscope/HEAD/README.md) (2026-11-14; features, identity, platforms); [Official official documentation](https://www.speedscope.app/) (2026-11-14; identity, features); [Official release inspected: v1.25.0](https://github.com/jlfwong/speedscope/releases/tag/v1.25.0) (2026-11-14; downloads, maintenance); [Public upstream source distribution; compiled binary packaging is separate](https://github.com/jlfwong/speedscope/archive/HEAD.zip) (2026-11-14; downloads, pricing)
### Tracy

Instrumentation profiler with CPU timelines, GPU profiling integrations, memory tracking, and lock analysis.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-3-Clause. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Find frame-time and multithreading bottlenecks in native applications.
- **Compare when:** Detailed instrumentation needs source integration and can affect the measured workload.
- **Strengths:** CPU, memory, and synchronization events can be correlated in instrumented programs.
- **Limitations:** Detailed instrumentation needs source integration and can affect the measured workload.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/wolfpld/tracy))
- [Official project](https://github.com/wolfpld/tracy) · [Official installation / downloads](https://github.com/wolfpld/tracy/releases) · [Repository](https://github.com/wolfpld/tracy)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/wolfpld/tracy) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/wolfpld/tracy/HEAD/README.md) (2026-11-14; identity, features); [Official license text](https://raw.githubusercontent.com/wolfpld/tracy/HEAD/LICENSE) (2026-11-14; license); [Official release inspected: v0.15.0](https://github.com/wolfpld/tracy/releases/tag/v0.15.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/wolfpld/tracy/releases/download/v0.15.0/windows-0.15.0.zip) (2026-11-14; downloads, pricing)
### VisualVM

Visual Java troubleshooting application combining JVM monitoring, thread inspection, heap analysis and profiling.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-2.0 with Classpath Exception. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Inspect a Java application before selecting deeper instrumentation.
- **Compare when:** A compatible JDK and attachment permissions are required; remote monitoring and profiling capabilities have different prerequisites.
- **Strengths:** A desktop view groups several JDK diagnostic tasks for interactive investigation.
- **Limitations:** A compatible JDK and attachment permissions are required; remote monitoring and profiling capabilities have different prerequisites.
- **Maintenance:** active — An upstream release was observed dated 2026-09-08. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/oracle/visualvm/releases/tag/2.2.2))
- [Official project](https://visualvm.github.io/) · [Official installation / downloads](https://visualvm.github.io/download) · [Repository](https://github.com/oracle/visualvm)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/oracle/visualvm/blob/master/README.md) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://github.com/oracle/visualvm/blob/master/LICENSE.txt) (2026-11-14; license); [Official downloads or installation instructions](https://visualvm.github.io/download) (2026-11-14; downloads, platforms); [Official documentation: VisualVM 2.2.2 release notes dated 8 September 2026 and supported host details.](https://visualvm.github.io/relnotes.html) (2026-11-14; maintenance, platforms); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/oracle/visualvm/releases/download/2.2.2/visualvm_222.zip) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/oracle/visualvm/releases/tag/2.2.2) (2026-11-14; downloads, maintenance)

## Reverse engineering

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Freverse-engineering)

### Cutter

Graphical reverse-engineering platform built on Rizin, with disassembly views, graphs, and analysis tools.

- **Platforms:** Windows, macOS, Linux. **License:** GPL-3.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Explore executable structure with a graphical reverse-engineering interface.
- **Compare when:** Plugin compatibility and architecture support should be checked for the target.
- **Strengths:** Graphs and navigable views make Rizin-based analysis accessible through a GUI.
- **Limitations:** Plugin compatibility and architecture support should be checked for the target.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/rizinorg/cutter))
- [Official project](https://cutter.re/) · [Official installation / downloads](https://github.com/rizinorg/cutter/releases) · [Repository](https://github.com/rizinorg/cutter)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/rizinorg/cutter) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/rizinorg/cutter/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://cutter.re/) (2026-11-14; identity, features); [Official release inspected: v2.5.0](https://github.com/rizinorg/cutter/releases/tag/v2.5.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/rizinorg/cutter/releases/download/v2.5.0/Cutter-v2.5.0-Windows-x86_64.zip) (2026-11-14; downloads, pricing)
### Ghidra

Software reverse-engineering framework with disassembly, decompilation, scripting, and program analysis.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Analyze software binaries and investigate program behavior in an authorized workflow.
- **Compare when:** Analysis quality depends on architecture support and binary characteristics.
- **Strengths:** Decompilation and scripting complement disassembly during binary investigation.
- **Limitations:** Analysis quality depends on architecture support and binary characteristics.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-10. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/NationalSecurityAgency/ghidra))
- [Official project](https://github.com/NationalSecurityAgency/ghidra) · [Official installation / downloads](https://github.com/NationalSecurityAgency/ghidra/releases) · [Repository](https://github.com/NationalSecurityAgency/ghidra)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/NationalSecurityAgency/ghidra) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/NationalSecurityAgency/ghidra/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://github.com/NationalSecurityAgency/ghidra) (2026-11-14; identity, features); [Official release inspected: Ghidra_12.2_build](https://github.com/NationalSecurityAgency/ghidra/releases/tag/Ghidra_12.2_build) (2026-11-14; downloads, maintenance); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_12.2_build/ghidra_12.2_PUBLIC_20261016.zip) (2026-11-14; downloads, pricing)
### ILSpy

Open-source .NET assembly browser and decompiler with C# output and metadata inspection.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Inspect .NET assemblies to understand dependencies and implementation behavior.
- **Compare when:** Desktop builds and the command-line tool have separate packages; decompilation is not guaranteed to reconstruct original source exactly.
- **Strengths:** Decompiled .NET code and metadata make assembly dependencies easier to inspect.
- **Limitations:** Desktop builds and the command-line tool have separate packages; decompilation is not guaranteed to reconstruct original source exactly.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/icsharpcode/ILSpy))
- [Official project](https://ilspy.net/) · [Official installation / downloads](https://github.com/icsharpcode/ILSpy/releases) · [Repository](https://github.com/icsharpcode/ILSpy)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/icsharpcode/ILSpy) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/icsharpcode/ILSpy/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://ilspy.net/) (2026-11-14; identity, features); [Official release inspected: v11.2](https://github.com/icsharpcode/ILSpy/releases/tag/v11.2) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/icsharpcode/ILSpy/releases/download/v11.2/ILSpy_windows_11.2.0.10050-x64.zip) (2026-11-14; downloads, pricing)
### radare2

Command-line framework for binary inspection, disassembly, patching, debugging, and scripting.

- **Platforms:** Windows, macOS, Linux. **License:** Primarily LGPL-3.0; dependencies and plugins have additional licenses. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Automate repeatable binary-analysis tasks from a terminal.
- **Compare when:** Its dense command language has a substantial learning curve.
- **Strengths:** Its command interface allows binary-analysis steps to be scripted and repeated.
- **Limitations:** Its dense command language has a substantial learning curve.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/radareorg/radare2))
- [Official project](https://www.radare.org/) · [Official installation / downloads](https://github.com/radareorg/radare2/releases) · [Repository](https://github.com/radareorg/radare2)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/radareorg/radare2) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/radareorg/radare2/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official license text](https://raw.githubusercontent.com/radareorg/radare2/HEAD/COPYING.md) (2026-11-14; license); [Official official documentation](https://www.radare.org/) (2026-11-14; identity, features); [Official release inspected: 6.2.6](https://github.com/radareorg/radare2/releases/tag/6.2.6) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/radareorg/radare2/releases/download/6.2.6/radare2-6.2.6-w64.zip) (2026-11-15; downloads, pricing)

## Shell prompts and customization

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fshell-customization)

### Oh My Posh

Configurable shell prompt engine with themes, contextual segments, and broad shell integration.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Create a themed prompt showing project and environment status.
- **Compare when:** Many themes need a Nerd Font and terminal configuration.
- **Strengths:** Prompt segments and themes allow precise control over which environment details are visible.
- **Limitations:** Many themes need a Nerd Font and terminal configuration.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/JanDeDobbeleer/oh-my-posh))
- [Official project](https://ohmyposh.dev/) · [Official installation / downloads](https://github.com/JanDeDobbeleer/oh-my-posh/releases) · [Repository](https://github.com/JanDeDobbeleer/oh-my-posh)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/JanDeDobbeleer/oh-my-posh) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/JanDeDobbeleer/oh-my-posh/HEAD/README.md) (2026-11-14; identity, features, platforms); [Official official documentation](https://ohmyposh.dev/) (2026-11-14; identity, features); [Official release inspected: v32.0.0](https://github.com/JanDeDobbeleer/oh-my-posh/releases/tag/v32.0.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/JanDeDobbeleer/oh-my-posh/releases/download/v32.0.0/posh-windows-amd64.exe) (2026-11-14; downloads, pricing)
### Starship

Cross-shell prompt that displays contextual information such as Git state and language environments.

- **Platforms:** Windows, macOS, Linux. **License:** ISC. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Use a consistent contextual prompt across different shells.
- **Compare when:** Large or slow repositories can require adjusting enabled modules and timeouts.
- **Strengths:** One configuration can present contextual project information across several shells.
- **Limitations:** Large or slow repositories can require adjusting enabled modules and timeouts.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/starship/starship))
- [Official project](https://starship.rs/) · [Official installation / downloads](https://github.com/starship/starship/releases) · [Repository](https://github.com/starship/starship)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/starship/starship) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/starship/starship/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://starship.rs/) (2026-11-14; identity, features); [Official release inspected: v1.27.0](https://github.com/starship/starship/releases/tag/v1.27.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/starship/starship/releases/download/v1.27.0/starship-x86_64-pc-windows-msvc.msi) (2026-11-14; downloads, pricing)

## Shells

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fshells)

### Fish

Interactive Unix shell with autosuggestions, syntax highlighting, and searchable command history.

- **Platforms:** macOS, Linux. **License:** GPL-2.0 with PSF, MIT and LGPL components. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Improve interactive shell use on Linux and macOS.
- **Compare when:** Fish syntax is not POSIX shell syntax; Windows use needs a Unix environment.
- **Strengths:** Interactive suggestions and syntax feedback help discover and correct commands while typing.
- **Limitations:** Fish syntax is not POSIX shell syntax; Windows use needs a Unix environment.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-11. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/fish-shell/fish-shell))
- [Official project](https://fishshell.com/) · [Official installation / downloads](https://github.com/fish-shell/fish-shell/releases) · [Repository](https://github.com/fish-shell/fish-shell)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/fish-shell/fish-shell) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/fish-shell/fish-shell/HEAD/README.rst) (2026-11-14; identity, features, downloads, platforms); [Official license text](https://raw.githubusercontent.com/fish-shell/fish-shell/HEAD/COPYING) (2026-11-14; license); [Official official documentation](https://fishshell.com/) (2026-11-14; identity, features); [Official release inspected: 4.9.3](https://github.com/fish-shell/fish-shell/releases/tag/4.9.3) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/fish-shell/fish-shell/releases/download/4.9.3/fish-4.9.3-linux-x86_64.tar.xz) (2026-11-14; downloads, pricing)
### Nushell

Shell that represents pipeline data as structured tables and values, with built-in filtering and transformation.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Inspect and transform structured command output interactively.
- **Compare when:** Its syntax differs from POSIX shells, so shell scripts are not drop-in compatible.
- **Strengths:** Structured values avoid reparsing many pipeline results as untyped text.
- **Limitations:** Its syntax differs from POSIX shells, so shell scripts are not drop-in compatible.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/nushell/nushell))
- [Official project](https://www.nushell.sh/) · [Official installation / downloads](https://github.com/nushell/nushell/releases) · [Repository](https://github.com/nushell/nushell)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/nushell/nushell) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/nushell/nushell/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://www.nushell.sh/) (2026-11-14; identity, features); [Official release inspected: 0.117.0](https://github.com/nushell/nushell/releases/tag/0.117.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/nushell/nushell/releases/download/0.117.0/nu-0.117.0-x86_64-pc-windows-msvc.msi) (2026-11-14; downloads, pricing)
### PowerShell

Cross-platform object-oriented shell and automation

- **Platforms:** Windows. **License:** MIT core. **Pricing model:** unknown.
- **Compatibility details:** Windows supported; release-specific lifecycle applies
- **Pick for:** Cross-platform object-oriented shell and automation
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Cross-platform object-oriented shell and automation
- **Limitations:** Scripts run with account privileges; no blanket execution-policy change; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/PowerShell/PowerShell) · [Repository](https://github.com/PowerShell/PowerShell)
- **Sources:** [Preserved original research source](https://github.com/PowerShell/PowerShell) (2026-11-14; identity, features)
### Xonsh

Python-powered shell combining shell commands with Python expressions and objects.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-2-Clause. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Mix filesystem commands with Python data manipulation interactively.
- **Compare when:** A Python runtime is required and shell compatibility differs from Bash.
- **Strengths:** Python objects and expressions can be used alongside shell commands in one session.
- **Limitations:** A Python runtime is required and shell compatibility differs from Bash.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/xonsh/xonsh))
- [Official project](https://xon.sh/) · [Official installation / downloads](https://github.com/xonsh/xonsh/releases) · [Repository](https://github.com/xonsh/xonsh)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/xonsh/xonsh) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/xonsh/xonsh/HEAD/README.rst) (2026-11-14; identity, features, downloads, platforms); [Official license text](https://raw.githubusercontent.com/xonsh/xonsh/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://xon.sh/) (2026-11-14; identity, features); [Official release inspected: 0.25.0](https://github.com/xonsh/xonsh/releases/tag/0.25.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/xonsh/xonsh/releases/download/0.25.0/xonsh-x86_64.AppImage) (2026-11-14; downloads, pricing)

## Task runners

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Ftask-runners)

### just

Project command runner using a justfile to organize named recipes and reusable developer tasks.

- **Platforms:** Windows, macOS, Linux. **License:** CC0-1.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Give a project consistent commands for setup, testing, and publishing.
- **Compare when:** It is a command runner, not a timestamp-based incremental build system.
- **Strengths:** Named recipes make recurring project operations discoverable to contributors.
- **Limitations:** It is a command runner, not a timestamp-based incremental build system.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/casey/just))
- [Official project](https://just.systems/) · [Official installation / downloads](https://github.com/casey/just/releases) · [Repository](https://github.com/casey/just)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/casey/just) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/casey/just/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://just.systems/) (2026-11-14; identity, features); [Official release inspected: 1.59.0](https://github.com/casey/just/releases/tag/1.59.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/casey/just/releases/download/1.59.0/just-1.59.0-x86_64-pc-windows-msvc.zip) (2026-11-14; downloads, pricing)
### Task

YAML-based task runner with dependencies, variables, and incremental task execution features.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Share repeatable development commands across team operating systems.
- **Compare when:** Shell commands inside task files still need platform-aware design.
- **Strengths:** Variables and task dependencies make shared developer commands easier to organize.
- **Limitations:** Shell commands inside task files still need platform-aware design.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-15. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/go-task/task))
- [Official project](https://taskfile.dev/) · [Official installation / downloads](https://github.com/go-task/task/releases) · [Repository](https://github.com/go-task/task)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/go-task/task) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/go-task/task/HEAD/README.md) (2026-11-14; identity, features, downloads); [Official official documentation](https://taskfile.dev/) (2026-11-14; identity, features); [Official release inspected: v3.54.0](https://github.com/go-task/task/releases/tag/v3.54.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/go-task/task/releases/download/v3.54.0/task_windows_386.zip) (2026-11-14; downloads, pricing)
### Watchexec

File-watching command runner that restarts or triggers commands when relevant files change.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Rerun tests or restart a local server after edits.
- **Compare when:** Watch limits and process termination behavior depend on the operating system.
- **Strengths:** Change-triggered execution shortens repetitive edit-and-rerun loops.
- **Limitations:** Watch limits and process termination behavior depend on the operating system.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/watchexec/watchexec))
- [Official project](https://watchexec.github.io/) · [Official installation / downloads](https://github.com/watchexec/watchexec/releases) · [Repository](https://github.com/watchexec/watchexec)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/watchexec/watchexec) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/watchexec/watchexec/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://watchexec.github.io/) (2026-11-14; identity, features); [Official release inspected: v2.8.0](https://github.com/watchexec/watchexec/releases/tag/v2.8.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/watchexec/watchexec/releases/download/v2.8.0/watchexec-2.8.0-x86_64-pc-windows-msvc.zip) (2026-11-14; downloads, pricing)

## Terminal emulators

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fterminal-emulators)

### Alacritty

OpenGL terminal emulator with vi-style selection, search and configurable text hints.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** Apache-2.0; retained MIT notices for prior portions. **Pricing model:** free.
- **Compatibility details:** Official installation covers Windows, macOS, Linux and BSD; OpenGL ES 2.0 and Windows ConPTY requirements apply.
- **Pricing details:** Official desktop binaries and source are publicly available without a product fee.
- **Pick for:** You prefer a focused terminal that leaves multiplexing to another tool.
- **Compare when:** Choose WezTerm or kitty when tabs and layout management should be built in.
- **Strengths:** Focused terminal behavior integrates with existing shells and multiplexers; Text configuration can be versioned
- **Limitations:** Tabs and split-pane workflows require another program; Official project still describes the release as beta
- **Maintenance:** active — Official release v0.17.0 is dated 2026-04-06; installation and performance were not independently tested. ([evidence](https://github.com/alacritty/alacritty/releases/tag/v0.17.0))
- [Official project](https://alacritty.org/) · [Official installation / downloads](https://github.com/alacritty/alacritty/releases) · [Repository](https://github.com/alacritty/alacritty)
- **Sources:** [Official product overview](https://alacritty.org/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/alacritty/alacritty/master/README.md) (2026-11-15; identity, features, downloads, platforms); [Official licensing terms](https://raw.githubusercontent.com/alacritty/alacritty/master/LICENSE-APACHE) (2026-11-15; license); [Distribution and pricing qualification](https://github.com/alacritty/alacritty/releases/latest) (2026-11-15; pricing); [Official download or installation entry point](https://github.com/alacritty/alacritty/releases) (2026-11-15; downloads); [Official dated release](https://github.com/alacritty/alacritty/releases/tag/v0.17.0) (2026-11-15; maintenance, downloads)
### Ghostty

Terminal emulator with native desktop interfaces, tabs, split panes and GPU rendering.

- **Platforms:** macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Official downloads cover macOS 13+ on Intel and Apple Silicon, and Linux packages or source builds.
- **Pricing details:** Official macOS download and Linux package/build instructions are freely accessible; no paid desktop tier is documented.
- **Pick for:** You want tabs and split panes in a terminal that follows the host desktop.
- **Compare when:** Choose WezTerm for a shared Windows/macOS/Linux setup or scripting-heavy multiplexing.
- **Strengths:** Desktop integration follows the host platform; Includes everyday pane and tab management
- **Limitations:** Current desktop downloads cover macOS and Linux; Native-platform behavior and configuration differ between hosts
- **Maintenance:** unverified — Official product and installation material reviewed; a recent dated release was not established for this product scope.
- [Official project](https://ghostty.org/) · [Official installation / downloads](https://ghostty.org/download) · [Repository](https://github.com/ghostty-org/ghostty)
- **Sources:** [Official product overview](https://ghostty.org/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/ghostty-org/ghostty/main/README.md) (2026-11-15; identity, features, downloads); [Official licensing terms](https://raw.githubusercontent.com/ghostty-org/ghostty/main/LICENSE) (2026-11-15; license); [Documented deployment and platform scope](https://ghostty.org/download) (2026-11-15; platforms, pricing, downloads)
### kitty

GPU terminal with layouts, tabs, graphics and scriptable extensions called kittens.

- **Platforms:** macOS, Linux, FreeBSD. **License:** GPL-3.0. **Pricing model:** free.
- **Compatibility details:** Project lists Linux, macOS and BSD; binary installers cover Linux and macOS while BSD installation differs.
- **Pricing details:** Official binaries and source are publicly distributed without a product fee; sponsorship is optional.
- **Pick for:** You want integrated layouts, graphics and programmable terminal utilities on Unix-like desktops.
- **Compare when:** Use WezTerm when native Windows support is part of the same workflow.
- **Strengths:** Rich terminal functions can be combined without a separate multiplexer; Terminal graphics and keyboard protocols enable specialized workflows
- **Limitations:** No native Windows application is documented; Some features require applications that implement kitty protocols
- **Maintenance:** active — Official release v0.50.0 is dated 2026-11-03; installation and performance were not independently tested. ([evidence](https://github.com/kovidgoyal/kitty/releases/tag/v0.50.0))
- [Official project](https://sw.kovidgoyal.net/kitty/) · [Official installation / downloads](https://sw.kovidgoyal.net/kitty/binary/) · [Repository](https://github.com/kovidgoyal/kitty)
- **Sources:** [Official product overview](https://sw.kovidgoyal.net/kitty/) (2026-11-15; identity, features, platforms); [Official licensing terms](https://raw.githubusercontent.com/kovidgoyal/kitty/master/LICENSE) (2026-11-15; license); [Distribution and pricing qualification](https://sw.kovidgoyal.net/kitty/binary/) (2026-11-15; pricing, downloads); [Official dated release](https://github.com/kovidgoyal/kitty/releases/tag/v0.50.0) (2026-11-15; maintenance, downloads)
### WezTerm

Terminal emulator with local and remote panes, tabs, multiplexing and Lua configuration.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Official project documents Linux, macOS, Windows and FreeBSD; package availability varies.
- **Pricing details:** Public builds and source are available without a product fee; sponsorship is optional.
- **Pick for:** You want a configurable terminal with built-in multiplexing across several operating systems.
- **Compare when:** Compare Alacritty for a smaller feature surface or Ghostty for platform-native desktop integration.
- **Strengths:** One configuration can cover several desktop platforms; Integrated multiplexing connects local and remote terminal sessions
- **Limitations:** Lua customization requires scripting knowledge; GPU and terminal-protocol compatibility depend on the host environment
- **Maintenance:** unverified — Official release 20240203-110809-5046fc22 is dated 2024-02-03; installation and performance were not independently tested. ([evidence](https://github.com/wezterm/wezterm/releases/tag/20240203-110809-5046fc22))
- [Official project](https://wezterm.org/) · [Official installation / downloads](https://wezterm.org/installation.html) · [Repository](https://github.com/wezterm/wezterm)
- **Sources:** [Official product overview](https://wezterm.org/) (2026-11-15; identity, features, platforms); [Official project documentation](https://raw.githubusercontent.com/wezterm/wezterm/main/README.md) (2026-11-15; identity, features, downloads); [Official licensing terms](https://raw.githubusercontent.com/wezterm/wezterm/main/LICENSE.md) (2026-11-15; license); [Distribution and pricing qualification](https://wezterm.org/installation.html) (2026-11-15; pricing, downloads); [Official dated release](https://github.com/wezterm/wezterm/releases/tag/20240203-110809-5046fc22) (2026-11-15; maintenance, downloads)
### Windows Terminal

Tabbed terminal and console host tooling

- **Platforms:** Windows. **License:** MIT. **Pricing model:** unknown.
- **Compatibility details:** Windows terminal application
- **Pick for:** Tabbed terminal and console host tooling
- **Compare when:** Candidate for task-based comparison; not installed, benchmarked or awarded best-in-class status in this pass.
- **Strengths:** Tabbed terminal and console host tooling
- **Limitations:** Terminal is not a shell or sandbox; test accessibility and large-output latency; Potential source reference under listed license; retain notices and audit dependencies, trademarks and assets before integration.
- **Maintenance:** unverified — Retained research snapshot; current release activity was not established by this import.
- [Official project](https://github.com/microsoft/terminal) · [Repository](https://github.com/microsoft/terminal)
- **Sources:** [Preserved original research source](https://github.com/microsoft/terminal) (2026-11-14; identity, features)

## Terminal search and filtering

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fterminal-search)

### fd

Command-line file finder with simple patterns, ignore-file support, and command execution over matches.

- **Platforms:** Windows, macOS, Linux. **License:** MIT or Apache-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Locate files quickly by name or extension before applying another tool.
- **Compare when:** Its defaults differ from traditional find, so scripts need explicit options.
- **Strengths:** Compact filename queries and executable actions suit repeatable shell workflows.
- **Limitations:** Its defaults differ from traditional find, so scripts need explicit options.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/sharkdp/fd))
- [Official project](https://github.com/sharkdp/fd) · [Official installation / downloads](https://github.com/sharkdp/fd/releases) · [Repository](https://github.com/sharkdp/fd)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/sharkdp/fd) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/sharkdp/fd/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms, license); [Official release inspected: v10.5.2](https://github.com/sharkdp/fd/releases/tag/v10.5.2) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/sharkdp/fd/releases/download/v10.5.2/fd-v10.5.2-x86_64-pc-windows-gnu.zip) (2026-11-14; downloads, pricing)
### fzf

Interactive fuzzy finder that selects entries from arbitrary command output and integrates with shells.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Pick files, history entries, processes, or Git branches from terminal lists.
- **Compare when:** Preview commands and pipelines inherit the permissions of your shell.
- **Strengths:** It can turn many kinds of textual lists into an interactive selection interface.
- **Limitations:** Preview commands and pipelines inherit the permissions of your shell.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-12. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/junegunn/fzf))
- [Official project](https://junegunn.github.io/fzf/) · [Official installation / downloads](https://github.com/junegunn/fzf/releases) · [Repository](https://github.com/junegunn/fzf)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/junegunn/fzf) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/junegunn/fzf/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://junegunn.github.io/fzf/) (2026-11-14; identity, features); [Official release inspected: v0.75.0](https://github.com/junegunn/fzf/releases/tag/v0.75.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/junegunn/fzf/releases/download/v0.75.0/fzf-0.75.0-windows_amd64.msi) (2026-11-14; downloads, pricing)
### GNU grep

Command-line matching of fixed strings and regular expressions in text streams and files, with explicit recursive-search and output controls.

- **Platforms:** Linux. **License:** GNU General Public License v3.0 or later. **Pricing model:** free.
- **Compatibility details:** Linux packaging was verified through Ubuntu and the installed Linux executable. Upstream distributes portable source; other operating-system builds are not established by this record.
- **Pricing details:** The official source archive is publicly downloadable without payment. Distribution packages and optional commercial support have separate terms.
- **Pick for:** Use line-oriented matching in shell pipelines and scripts with explicit search flags.
- **Compare when:** Consider ripgrep for repository ignore-file awareness; inspect the scoped measurement rather than assuming a universal speed winner.
- **Strengths:** Explicit line-oriented output fits shell pipelines and existing command-line scripts.
- **Limitations:** Recursive search does not automatically apply Git ignore rules.; Locale, binary handling, regex dialect and output options affect results and must be aligned before comparing tools.; The recorded performance experiment uses GNU grep 3.11; it does not test every current release or operating system.
- **Maintenance:** unverified — The inspected stable release announcement is grep 3.12 from April 2025; this source does not establish current release cadence. ([evidence](https://lists.gnu.org/archive/html/info-gnu/2025-04/msg00008.html))
- [Official project](https://www.gnu.org/software/grep/) · [Official installation / downloads](https://ftp.gnu.org/gnu/grep/) · [Repository](https://savannah.gnu.org/git/?group=grep)
- **Sources:** [Official project identity, distribution routes and GPL terms](https://www.gnu.org/software/grep/) (2026-11-15; identity, features, license, downloads); [Official matching, recursion, output and locale manual](https://www.gnu.org/software/grep/manual/grep.html) (2026-11-15; features); [Official Ubuntu Linux package and distribution details](https://packages.ubuntu.com/noble/grep) (2026-11-15; platforms, downloads); [Official public source archive: bounded unauthenticated HTTP retrieval observed](https://ftp.gnu.org/gnu/grep/grep-3.12.tar.xz) (2026-11-15; downloads, pricing); [Official stable release announcement with date](https://lists.gnu.org/archive/html/info-gnu/2025-04/msg00008.html) (2026-11-15; maintenance)
- **Scoped measurement:** [Fixed-string search with equivalent output](https://github.com/Herbertofury/Athena/blob/main/research/software-expansion-2026-11-15/search-benchmark.md). On these four synthetic warm-cache Linux workloads, ripgrep had lower median time on selective and no-match searches; dense-output timings overlapped. Complete outputs and exit codes matched an independent oracle in every run.
### ripgrep

Recursive command-line text search that understands common ignore files and supports regular expressions.

- **Platforms:** Windows, macOS, Linux. **License:** MIT or Unlicense. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Search a large source tree for identifiers or patterns from the terminal.
- **Compare when:** Ignore rules and binary-file filtering can hide results unless adjusted.
- **Strengths:** Recursive text matching combines naturally with version-control ignore rules.
- **Limitations:** Ignore rules and binary-file filtering can hide results unless adjusted.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-09. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/BurntSushi/ripgrep))
- [Official project](https://github.com/BurntSushi/ripgrep) · [Official installation / downloads](https://github.com/BurntSushi/ripgrep/releases) · [Repository](https://github.com/BurntSushi/ripgrep)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/BurntSushi/ripgrep) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/BurntSushi/ripgrep/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms, license); [Official release inspected: 15.2.0](https://github.com/BurntSushi/ripgrep/releases/tag/15.2.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/BurntSushi/ripgrep/releases/download/15.2.0/ripgrep-15.2.0-x86_64-pc-windows-gnu.zip) (2026-11-14; downloads, pricing)
- **Scoped measurement:** [Fixed-string search with equivalent output](https://github.com/Herbertofury/Athena/blob/main/research/software-expansion-2026-11-15/search-benchmark.md). On these four synthetic warm-cache Linux workloads, ripgrep had lower median time on selective and no-match searches; dense-output timings overlapped. Complete outputs and exit codes matched an independent oracle in every run.

## Terminal navigation and inspection

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fterminal-utilities)

### bat

Command-line file viewer with syntax highlighting, line numbers, Git changes, and pager integration.

- **Platforms:** Windows, macOS, Linux. **License:** MIT or Apache-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Inspect source files with context without opening an editor.
- **Compare when:** Formatting is meant for interactive reading; scripts may need plain output.
- **Strengths:** Syntax and change markers improve source inspection without leaving a terminal.
- **Limitations:** Formatting is meant for interactive reading; scripts may need plain output.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/sharkdp/bat))
- [Official project](https://github.com/sharkdp/bat) · [Official installation / downloads](https://github.com/sharkdp/bat/releases) · [Repository](https://github.com/sharkdp/bat)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/sharkdp/bat) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/sharkdp/bat/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms, license); [Official release inspected: v0.26.1](https://github.com/sharkdp/bat/releases/tag/v0.26.1) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/sharkdp/bat/releases/download/v0.26.1/bat-v0.26.1-x86_64-pc-windows-msvc.zip) (2026-11-14; downloads, pricing)
### eza

Directory-listing tool with file metadata, tree output, icons, and Git status options.

- **Platforms:** Windows, macOS, Linux. **License:** EUPL-1.2. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Inspect directory contents and repository state in a readable terminal listing.
- **Compare when:** Icons require compatible fonts, and platform-specific filesystem features vary.
- **Strengths:** Tree output, metadata, and Git status reveal several kinds of directory context together.
- **Limitations:** Icons require compatible fonts, and platform-specific filesystem features vary.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-08-06. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/eza-community/eza))
- [Official project](https://eza.rocks/) · [Official installation / downloads](https://github.com/eza-community/eza/releases) · [Repository](https://github.com/eza-community/eza)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/eza-community/eza) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/eza-community/eza/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official official documentation](https://eza.rocks/) (2026-11-14; identity, features); [Official release inspected: v0.23.5](https://github.com/eza-community/eza/releases/tag/v0.23.5) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/eza-community/eza/releases/download/v0.23.5/eza.exe_x86_64-pc-windows-gnu.zip) (2026-11-14; downloads, pricing)
### zoxide

Shell directory navigator that learns frequently visited locations and provides short jump commands.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Jump among frequently used project directories with fewer keystrokes.
- **Compare when:** It needs shell initialization and records visited directory paths locally.
- **Strengths:** Directory history removes the need to repeatedly type long project paths.
- **Limitations:** It needs shell initialization and records visited directory paths locally.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-08. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/ajeetdsouza/zoxide))
- [Official project](https://github.com/ajeetdsouza/zoxide) · [Official installation / downloads](https://github.com/ajeetdsouza/zoxide/releases) · [Repository](https://github.com/ajeetdsouza/zoxide)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/ajeetdsouza/zoxide) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/ajeetdsouza/zoxide/HEAD/README.md) (2026-11-14; identity, features, downloads, platforms); [Official release inspected: v0.10.0](https://github.com/ajeetdsouza/zoxide/releases/tag/v0.10.0) (2026-11-14; downloads, maintenance, platforms); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/ajeetdsouza/zoxide/releases/download/v0.10.0/zoxide-0.10.0-x86_64-pc-windows-msvc.zip) (2026-11-14; downloads, pricing)

## Test automation frameworks

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Ftest-automation)

### Appium

Driver-based automation server for mobile, browser and desktop applications using the WebDriver protocol.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** The server supports Windows, macOS and Linux; target-device support depends on the selected driver and native SDKs.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Test mobile or desktop applications through their supported Appium driver.
- **Compare when:** Each driver has independent platform, SDK and device requirements; installing the server alone does not provide every target.
- **Strengths:** One automation protocol can connect tests to several supported device and application drivers.
- **Limitations:** Each driver has independent platform, SDK and device requirements; installing the server alone does not provide every target.
- **Maintenance:** active — An upstream release was observed dated 2026-11-14. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/appium/appium/releases/tag/%40appium/execute-driver-plugin%407.0.3))
- [Official project](https://appium.io/) · [Official installation / downloads](https://appium.io/docs/en/latest/quickstart/install/) · [Repository](https://github.com/appium/appium)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/appium/appium/blob/master/README.md) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://github.com/appium/appium/blob/master/LICENSE) (2026-11-14; license); [Official downloads or installation instructions](https://appium.io/docs/en/latest/quickstart/install/) (2026-11-14; downloads); [Official documentation: The Appium server supports Windows, macOS and Linux; drivers impose additional platform requirements.](https://appium.io/docs/en/latest/quickstart/requirements/) (2026-11-14; platforms); [Public upstream app/package distribution: unauthenticated availability checked](https://registry.npmjs.org/appium/-/appium-3.9.1.tgz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/appium/appium/releases/tag/%40appium/execute-driver-plugin%407.0.3) (2026-11-14; downloads, maintenance)
### Robot Framework

Keyword-based automation framework for acceptance tests and robotic process automation, extended through libraries.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Create readable acceptance tests spanning several application interfaces.
- **Compare when:** Browser, desktop and application automation depend on additional libraries with their own support requirements.
- **Strengths:** Readable keyword suites let teams express acceptance workflows and reuse shared actions.
- **Limitations:** Browser, desktop and application automation depend on additional libraries with their own support requirements.
- **Maintenance:** active — An upstream release was observed dated 2026-11-02. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/robotframework/robotframework/releases/tag/v7.5.1))
- [Official project](https://robotframework.org/) · [Official installation / downloads](https://github.com/robotframework/robotframework#installation) · [Repository](https://github.com/robotframework/robotframework)
- **Sources:** [Official project README: documented behavior and installation](https://github.com/robotframework/robotframework/blob/master/README.rst) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://github.com/robotframework/robotframework/blob/master/LICENSE.txt) (2026-11-14; license); [Official downloads or installation instructions](https://github.com/robotframework/robotframework#installation) (2026-11-14; downloads); [Official documentation: Python-based framework installation and platform-independent acceptance automation.](https://github.com/robotframework/robotframework) (2026-11-14; platforms, downloads); [Official documentation: Explicit Python and framework installation instructions for Windows, macOS and Linux.](https://github.com/robotframework/robotframework/blob/master/INSTALL.rst) (2026-11-14; platforms, downloads); [Public upstream app/package distribution: unauthenticated availability checked](https://files.pythonhosted.org/packages/2b/a3/6d528a8ac42a03ba4b9f6642b80ea37de2d18086d458c044bb6a6a8df5b9/robotframework-7.5.1-py3-none-any.whl) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/robotframework/robotframework/releases/tag/v7.5.1) (2026-11-14; downloads, maintenance)

## Test runners

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Ftest-runners)

### Bats-core

Bash test runner for checking command output, exit status and shell behavior with TAP-compatible reports.

- **Platforms:** Windows, macOS, Linux, FreeBSD. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Official support matrix covers Linux, macOS, FreeBSD and Windows through Git Bash/MSYS2/Cygwin or WSL.
- **Pricing details:** Public source and packages are free under MIT.
- **Pick for:** You need executable regression tests for Bash scripts or CLI programs.
- **Compare when:** Use ShellCheck alongside it for static shell analysis; runtime tests cover different failures.
- **Strengths:** Tests can exercise command-line programs through their real interfaces; Shell fixtures fit existing Unix automation
- **Limitations:** Requires a supported Bash environment; Shell quoting and process behavior remain part of test correctness
- **Maintenance:** active — Official release v1.14.0 is dated 2026-07-21; installation and performance were not independently tested. ([evidence](https://github.com/bats-core/bats-core/releases/tag/v1.14.0))
- [Official project](https://bats-core.readthedocs.io/) · [Official installation / downloads](https://bats-core.readthedocs.io/en/stable/installation.html) · [Repository](https://github.com/bats-core/bats-core)
- **Sources:** [Official product overview](https://bats-core.readthedocs.io/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/bats-core/bats-core/master/README.md) (2026-11-15; identity, features, downloads); [Official licensing terms](https://raw.githubusercontent.com/bats-core/bats-core/master/LICENSE.md) (2026-11-15; license); [Documented deployment and platform scope](https://bats-core.readthedocs.io/en/stable/support-matrix.html) (2026-11-15; platforms); [Distribution and pricing qualification](https://bats-core.readthedocs.io/en/stable/installation.html) (2026-11-15; pricing, downloads); [Official dated release](https://github.com/bats-core/bats-core/releases/tag/v1.14.0) (2026-11-15; maintenance, downloads)
### cargo-nextest

Rust test runner providing per-test process isolation, filtering, retries and CI-oriented reporting.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0 OR MIT. **Pricing model:** free.
- **Compatibility details:** Check the upstream installation instructions for supported OS versions and required runtimes.
- **Pricing details:** A public upstream application/package distribution was accessible without payment or authentication. Optional hosted services, external models and dependencies can have separate costs and terms.
- **Pick for:** Run and diagnose a large Rust test suite with explicit isolation and filters.
- **Compare when:** Doctests are not supported; projects should retain a separate doctest step and assess retry policies carefully.
- **Strengths:** Test isolation and expressive selection help investigate large Rust suites.
- **Limitations:** Doctests are not supported; projects should retain a separate doctest step and assess retry policies carefully.
- **Maintenance:** active — An upstream release was observed dated 2026-11-13. This is evidence of release activity, not a support, security, stability or runtime-quality guarantee. ([evidence](https://github.com/nextest-rs/nextest/releases/tag/cargo-nextest-0.9.152))
- [Official project](https://nexte.st/) · [Official installation / downloads](https://nexte.st/docs/installation/pre-built-binaries/) · [Repository](https://github.com/nextest-rs/nextest)
- **Sources:** [Official project README: documented behavior and installation](https://raw.githubusercontent.com/nextest-rs/nextest/HEAD/README.md) (2026-11-14; downloads, features, identity, license); [Official license text or upstream licensing metadata](https://raw.githubusercontent.com/nextest-rs/nextest/HEAD/LICENSE-APACHE) (2026-11-14; license); [Official downloads or installation instructions](https://nexte.st/docs/installation/pre-built-binaries/) (2026-11-14; downloads, platforms); [Official documentation: Rust test runner with isolated test processes and filtering; doctests remain outside its supported test model.](https://nexte.st/) (2026-11-14; features); [Public upstream app/package distribution: unauthenticated availability checked](https://github.com/nextest-rs/nextest/releases/download/cargo-nextest-0.9.152/cargo-nextest-0.9.152-aarch64-pc-windows-msvc.tar.gz) (2026-11-14; downloads, pricing); [Observed upstream release record and date](https://github.com/nextest-rs/nextest/releases/tag/cargo-nextest-0.9.152) (2026-11-14; downloads, maintenance)
### Jest

JavaScript testing framework with assertions, mocks, snapshots, coverage and interactive watch mode.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Official CI covers Windows, macOS and Linux; supported Node versions and project transforms are required.
- **Pricing details:** Public npm package and MIT source have no product fee.
- **Pick for:** An established JavaScript project needs a broad conventional test framework.
- **Compare when:** Compare Vitest for Vite-first projects and real-browser tools for browser behavior.
- **Strengths:** A single test framework supplies many common test primitives; Existing integrations suit established JavaScript projects
- **Limitations:** ESM and build transforms can require project-specific configuration; Browser-like test environments are simulations unless a real browser is separately used
- **Maintenance:** active — Official release v30.5.2 is dated 2026-09-18; installation and performance were not independently tested. ([evidence](https://github.com/jestjs/jest/releases/tag/v30.5.2))
- [Official project](https://jestjs.io/) · [Official installation / downloads](https://jestjs.io/docs/getting-started) · [Repository](https://github.com/jestjs/jest)
- **Sources:** [Official product overview](https://jestjs.io/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/jestjs/jest/main/README.md) (2026-11-15; identity, features, downloads, pricing); [Official licensing terms](https://raw.githubusercontent.com/jestjs/jest/main/LICENSE) (2026-11-15; license); [Documented deployment and platform scope](https://raw.githubusercontent.com/jestjs/jest/main/.github/workflows/nodejs.yml) (2026-11-15; platforms); [Official download or installation entry point](https://jestjs.io/docs/getting-started) (2026-11-15; downloads); [Official dated release](https://github.com/jestjs/jest/releases/tag/v30.5.2) (2026-11-15; maintenance, downloads)
### pytest

Python test runner with assertion introspection, reusable fixtures, parameterization and plugins.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Publisher metadata lists macOS, Windows and POSIX/Unix; current supported Python version is required.
- **Pricing details:** Open-source package is free; optional third-party support is separate.
- **Pick for:** You need expressive tests for a Python project with reusable setup.
- **Compare when:** Use Robot Framework for keyword-driven acceptance workflows and test each plugin combination you adopt.
- **Strengths:** Small tests can share controlled setup through fixtures; Detailed failures reduce manual inspection of assertion values
- **Limitations:** Plugin combinations can complicate upgrades; Async and distributed execution need appropriate plugins
- **Maintenance:** active — Official release 9.2.0 is dated 2026-10-27; installation and performance were not independently tested. ([evidence](https://github.com/pytest-dev/pytest/releases/tag/9.2.0))
- [Official project](https://pytest.org/) · [Official installation / downloads](https://docs.pytest.org/en/stable/getting-started.html) · [Repository](https://github.com/pytest-dev/pytest)
- **Sources:** [Official product overview](https://pytest.org/) (2026-11-15; identity, features); [Official project documentation](https://raw.githubusercontent.com/pytest-dev/pytest/main/README.rst) (2026-11-15; identity, features, downloads, pricing); [Official licensing terms](https://raw.githubusercontent.com/pytest-dev/pytest/main/LICENSE) (2026-11-15; license); [Documented deployment and platform scope](https://pypi.org/pypi/pytest/json) (2026-11-15; platforms); [Official download or installation entry point](https://docs.pytest.org/en/stable/getting-started.html) (2026-11-15; downloads); [Official dated release](https://github.com/pytest-dev/pytest/releases/tag/9.2.0) (2026-11-15; maintenance, downloads)
### Vitest

JavaScript and TypeScript test runner integrating Vite transforms, watch mode, mocking and browser tests.

- **Platforms:** Windows, macOS, Linux. **License:** MIT. **Pricing model:** free.
- **Compatibility details:** Official CI exercises Linux, macOS and Windows; current Node/Vite requirements apply.
- **Pricing details:** Free open-source package; browser infrastructure and external CI are separate.
- **Pick for:** Your project uses Vite or needs integrated TypeScript and component testing.
- **Compare when:** Keep end-to-end navigation tests in Playwright or Cypress when they cover a different user workflow.
- **Strengths:** Application transforms can be shared with tests; Watch mode focuses development feedback on related changes
- **Limitations:** Jest-compatible APIs do not guarantee identical behavior; Browser mode requires an additional configured browser provider
- **Maintenance:** active — Official release v5.1.0 is dated 2026-11-02; installation and performance were not independently tested. ([evidence](https://github.com/vitest-dev/vitest/releases/tag/v5.1.0))
- [Official project](https://vitest.dev/) · [Official installation / downloads](https://vitest.dev/guide/) · [Repository](https://github.com/vitest-dev/vitest)
- **Sources:** [Official product overview](https://vitest.dev/) (2026-11-15; identity, features, pricing); [Official project documentation](https://raw.githubusercontent.com/vitest-dev/vitest/main/README.md) (2026-11-15; identity, features, downloads); [Official licensing terms](https://raw.githubusercontent.com/vitest-dev/vitest/main/LICENSE) (2026-11-15; license); [Documented deployment and platform scope](https://raw.githubusercontent.com/vitest-dev/vitest/main/.github/workflows/ci.yml) (2026-11-15; platforms); [Official download or installation entry point](https://vitest.dev/guide/) (2026-11-15; downloads); [Official dated release](https://github.com/vitest-dev/vitest/releases/tag/v5.1.0) (2026-11-15; maintenance, downloads)

## Version control systems

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fversion-control)

### Fossil

Distributed version-control system that bundles project tickets, wiki, forum and a web interface into a self-contained executable.

- **Platforms:** Windows, macOS, Linux. **License:** BSD-2-Clause. **Pricing model:** free.
- **Compatibility details:** Official project documents standalone executables for Windows, macOS and Linux; source builds are also available.
- **Pricing details:** The local open-source application is available without a license fee. Optional hosting, support, dependencies and infrastructure have separate terms.
- **Pick for:** You want an integrated, self-hosted source and project-history system in one executable.
- **Compare when:** Compare Git-backed tools when existing Git hosting, CI or contributor expectations are the deciding constraint.
- **Strengths:** A project can retain code and collaboration records together; Small self-hosted deployments need fewer separate applications
- **Limitations:** Its repository format and workflow differ from Git; GitHub mirroring does not make all Fossil tickets and wiki data native Git objects
- **Maintenance:** active — Official changelog lists release 2.28 on March 11, 2026 and a separate pending 2.29 section. Pending work is not presented as a released version. ([evidence](https://fossil-scm.org/home/doc/trunk/www/changes.wiki))
- [Official project](https://fossil-scm.org/home/doc/trunk/www/index.wiki) · [Official installation / downloads](https://fossil-scm.org/home/uv/download.html) · [Repository](https://fossil-scm.org/home)
- **Sources:** [Official project overview](https://fossil-scm.org/home/doc/trunk/www/index.wiki) (2026-11-16; identity, features, platforms, pricing); [Official BSD licensing terms](https://fossil-scm.org/home/doc/trunk/COPYRIGHT-BSD2.txt) (2026-11-16; license); [Official download route](https://fossil-scm.org/home/uv/download.html) (2026-11-16; downloads); [Official dated release history](https://fossil-scm.org/home/doc/trunk/www/changes.wiki) (2026-11-16; maintenance)
### Jujutsu

Version-control system with a Git-backed storage model, automatic working-copy snapshots and an operation log.

- **Platforms:** Windows, macOS, Linux. **License:** Apache-2.0. **Pricing model:** unknown.
- **Compatibility details:** Official releases provide Windows, macOS and Linux binaries. The current storage backend uses Git while higher-level metadata is stored separately.
- **Pricing details:** Open-source code and a public installation route are documented. A separate explicit pricing statement for the current distribution was not established in this review.
- **Pick for:** You want a different local change-editing workflow while keeping Git-based repositories and hosting.
- **Compare when:** Use a Git GUI when the team needs conventional Git semantics; compare Fossil for integrated project hosting.
- **Strengths:** Change editing and recovery are explicit parts of the command model; Git-backed repositories allow adoption alongside existing hosting
- **Limitations:** Bookmarks, conflicts and working-copy semantics differ from ordinary Git commands; Some replication features are explicitly experimental; interoperability does not mean every Git tool understands Jujutsu metadata
- **Maintenance:** active — Official release v0.47.1 is dated 2026-11-05. This is a release observation; installation and performance were not independently tested. ([evidence](https://github.com/jj-vcs/jj/releases/tag/v0.47.1))
- [Official project](https://www.jj-vcs.dev/) · [Official installation / downloads](https://docs.jj-vcs.dev/latest/install-and-setup/) · [Repository](https://github.com/jj-vcs/jj)
- **Sources:** [Official project documentation](https://github.com/jj-vcs/jj/blob/main/README.md) (2026-11-16; identity, features, platforms, downloads); [Official application and dependency licensing](https://github.com/jj-vcs/jj/blob/main/LICENSE) (2026-11-16; license); [Official dated release and distribution](https://github.com/jj-vcs/jj/releases/tag/v0.47.1) (2026-11-16; maintenance, downloads)

## Workflow automation

[Browse this task in Athena](https://herbertofury.github.io/Athena/#software?category=development%2Fworkflow-automation)

### Activepieces

Automation platform using visual flows and connector pieces with self-hosting and hosted services.

- **Platforms:** Windows, macOS, Linux, Web. **License:** MIT for Community code; commercial license for enterprise directories. **Pricing model:** freemium.
- **Compatibility details:** The web interface is browser-based. Self-hosting requires Docker Compose; Windows uses WSL2, and macOS compatibility follows the required Docker runtime rather than a native desktop app.
- **Pick for:** Connect business tools using inspectable workflows and reusable integrations.
- **Compare when:** Enterprise features and cloud services have separate commercial terms.
- **Strengths:** Reusable connector pieces make common service integrations easier to assemble.
- **Limitations:** Enterprise features and cloud services have separate commercial terms.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/activepieces/activepieces))
- [Official project](https://www.activepieces.com/) · [Official installation / downloads](https://github.com/activepieces/activepieces#quick-start) · [Repository](https://github.com/activepieces/activepieces)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/activepieces/activepieces) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/activepieces/activepieces/HEAD/README.md) (2026-11-14; identity, features, license); [Official license text](https://raw.githubusercontent.com/activepieces/activepieces/HEAD/LICENSE) (2026-11-14; license); [Official official documentation](https://www.activepieces.com/) (2026-11-14; identity, features); [Official release inspected: 0.93.0](https://github.com/activepieces/activepieces/releases/tag/0.93.0) (2026-11-14; downloads, maintenance); [Official source: A free plan and paid tiers have different capabilities and allowances for cloud or on-premises deployment.](https://www.activepieces.com/pricing) (2026-11-14; pricing); [Official source: Docker Compose deployment serves a browser interface; Windows requires WSL2, and paid license keys extend the free plan.](https://www.activepieces.com/docs/install/options/docker-compose) (2026-11-14; platforms, downloads, pricing); [Official source: The required Compose runtime is available through Docker Desktop on Windows, macOS and Linux; this establishes container-host compatibility rather than a native app installer.](https://docs.docker.com/compose/install/) (2026-11-14; platforms)
### n8n

Workflow automation platform connecting services, scripts, and AI steps with self-hosted and hosted options.

- **Platforms:** Windows, macOS, Linux, Web. **License:** Sustainable Use License and n8n Enterprise License. **Pricing model:** mixed.
- **Compatibility details:** Self-hosted deployment is a service with a web interface. Current setup requires Docker on Linux/macOS or WSL on Windows; the desktop OS list does not imply native graphical installers.
- **Pick for:** Automate internal workflows while choosing a deployment and licensing model deliberately.
- **Compare when:** Sustainable Use licensing is source-available and has commercial-use restrictions.
- **Strengths:** Visual steps and custom code can coexist in internal automation workflows.
- **Limitations:** Sustainable Use licensing is source-available and has commercial-use restrictions.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-14. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/n8n-io/n8n))
- [Official project](https://n8n.io/) · [Official installation / downloads](https://github.com/n8n-io/n8n#quick-start) · [Repository](https://github.com/n8n-io/n8n)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/n8n-io/n8n) (2026-11-14; identity, maintenance); [Official project README](https://raw.githubusercontent.com/n8n-io/n8n/HEAD/README.md) (2026-11-14; identity, features, license); [Official license text](https://raw.githubusercontent.com/n8n-io/n8n/HEAD/LICENSE.md) (2026-11-14; license); [Official official documentation](https://n8n.io/) (2026-11-14; identity, features); [Official release inspected: n8n@2.47.7](https://github.com/n8n-io/n8n/releases/tag/n8n%402.47.7) (2026-11-14; downloads, maintenance); [Official source: Free self-hosted Community use is subject to Sustainable Use License conditions; commercial licenses are separate.](https://support.n8n.io/article/can-i-use-your-license-for-my-use-case) (2026-11-14; pricing, license); [Official source: Paid hosted and enterprise options are distinct from the free self-hosted Community edition.](https://n8n.io/pricing/) (2026-11-14; pricing); [Official source: Current self-hosting instructions require Docker on Linux/macOS or WSL on Windows and expose a web interface.](https://github.com/n8n-io/n8n-docs/blob/main/docs/deploy/host-n8n/README.md) (2026-11-14; platforms, downloads)
### Node-RED

Flow-based automation environment for connecting events, APIs, devices, and services.

- **Platforms:** Windows, macOS, Linux, Web. **License:** Apache-2.0. **Pricing model:** free.
- **Pricing details:** An official public app/package distribution was accessible without payment or authentication. Optional paid editions, hosted services, models and third-party dependencies retain separate terms.
- **Pick for:** Build event-driven integrations using a visual flow editor.
- **Compare when:** Installed nodes and exposed endpoints require configuration and maintenance.
- **Strengths:** Visual flows make event and message routing inspectable during integration work.
- **Limitations:** Installed nodes and exposed endpoints require configuration and maintenance.
- **Maintenance:** active — Repository not archived; latest repository push observed 2026-11-13. Activity is not a runtime, security, or support guarantee. ([evidence](https://api.github.com/repos/node-red/node-red))
- [Official project](https://nodered.org/) · [Official installation / downloads](https://nodered.org/docs/getting-started/) · [Repository](https://github.com/node-red/node-red)
- **Sources:** [Official repository metadata: identity, license detection and activity](https://api.github.com/repos/node-red/node-red) (2026-11-14; identity, maintenance, license); [Official project README](https://raw.githubusercontent.com/node-red/node-red/HEAD/README.md) (2026-11-14; identity, features, downloads); [Official official documentation](https://nodered.org/) (2026-11-14; identity, features); [Official release inspected: 5.0.9](https://github.com/node-red/node-red/releases/tag/5.0.9) (2026-11-14; downloads, maintenance); [Public upstream app/package distribution: availability without payment or authentication checked](https://github.com/node-red/node-red/releases/download/5.0.9/node-red-5.0.9.zip) (2026-11-14; downloads, pricing); [Official source: Local Node.js installation and browser access are documented, with separate Windows instructions.](https://nodered.org/docs/getting-started/local) (2026-11-14; platforms, downloads); [Official source: Startup documentation explicitly covers Windows and Linux/OS X paths.](https://nodered.org/docs/faq/starting-node-red-on-boot) (2026-11-14; platforms)
