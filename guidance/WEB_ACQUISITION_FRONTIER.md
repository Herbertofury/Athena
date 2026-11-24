# Continuous web acquisition and frontier stack advancement

Owner directive, 2026-11-24. Applies to Athena and every consuming repository, alongside the existing CLI-first, modernization, and mandatory optimization standards. Athena owns shared research into better crawling, browsing, extraction, monitoring, and downloading. The release objective is the strongest current compatible stack, with measured evidence and no loss of functionality.

## Mandatory pre-release freshness

- Inventory the shipping stack: runtime/compiler, direct and resolved transitive dependencies, browser/renderer, driver, storage, network and download components, build/package tools, provider API versions and fixed platform/game compatibility targets. Use the actual manifests and lockfiles; documentation-only repositories review their relevant publishing tools.
- Before each release, refresh official registry/release metadata, changelogs, and compatibility documentation for the applicable stack. Prefer observations made within 24 hours of checkout; reuse relevant exact-input evidence. Distinguish stable, prerelease, nightly, local binaries, SDKs, distro packages and hosted services. Do not assume the latest GitHub release is the latest version on all channels.
- Prefer the newest verified production-worthy compatible release and current best-fit technology. Stage compatible upgrades early, test and adopt them when no material regression is found. Maintenance, compatibility, and reproducibility improvements count even without a speed increase. Evaluate frontier/nightly candidates when they offer a concrete benefit; do not substitute an unproven preview for a working release.
- Compare equivalent workloads and preserve complete functionality, compatibility, UI fidelity, data formats, portable operation, startup, latency, memory, throughput and relevant resource use. Split regressive upgrade groups, fix forward where practical, retain proven improvements, and keep a rollback path. Preserve explicit Minecraft/Sims/runtime/ABI target envelopes. Do not force incompatible version upgrades.
- Record current and proposed versions, official sources and observation dates, adopted or held decisions, evidence, and the next review for holds. A hold needs a concrete reason: measured regression, incompatibility, rights/distribution constraint, insufficient acceptance evidence or unavailable upstream information. Never claim a version was tested or is current if it was not verified.
- Pin resolved versions and lockfiles; run the mandatory applicable optimization assessments on the final stack. Perform the freshness review within existing release budgets; avoid speculative rewrites and expensive unrelated experiments on the critical path. Reuse validated results. Dedicated security audits remain opt-in. Existing permissions and project acceptance criteria remain intact.

## Continuous acquisition research

Start with Ghost Downloader 3 and Firecrawl. Maintain a shared candidate catalog with exact upstream links, version channels, documented interfaces, platform support, license/redistribution terms, portable configuration and state, known limits, and measured versus advertised capabilities.

Prefer authorized official APIs, feeds and provider file IDs; use conditional requests and incremental updates where documented. Use direct HTTP before headless rendering when equivalent, and respect documented site and provider access restrictions, rate limits, user permissions and creator rights. Keep local data and browser profiles isolated; use permitted cloud services only with explicit authorization.

Research modular alternatives rather than forcing a single engine into every repository. Candidate categories include direct HTTP, HTML extraction, crawl orchestration, headless browsing, change monitoring, resumable downloads, storage transfers and dependency update discovery.

For download integration, verify expected size and hashes where available, stream to a staging path, support cancellation and resumable partials tied to the correct file identity, and atomically promote validated files. Preserve last-good complete records after failure. Keep project-local state where supported.

## Evidence and adoption

Compare identical inputs and complete outputs on local controlled fixtures or authorized representative workloads. Measure first useful result, full completion, throughput, request count, transferred bytes, startup, peak memory, CPU and latency tails. Exercise pagination, duplicate records, retries, cancellation, interrupted downloads, restart, changed files and invalid results. Record reproducible benchmark instructions and limitations. No unverified superiority claims.

Review new upstream signals during relevant Athena and consumer work. Expand the catalog as better candidates are discovered. Share verified results and reusable adapters with the owning repositories. Prioritize Enderloom, Modhunter, GameSync, Noxviola, Athena and Modding-Knowledge while applying the freshness gate across the ecosystem.

See the [initial source-backed research](../research/web-acquisition-frontier-2026-11-24/README.md) and [candidate registry](registry/web-acquisition-watch.json). This is guidance and a research queue, not proof of installed tools, running autonomous research, executed benchmarks, or completed dependency upgrades.
