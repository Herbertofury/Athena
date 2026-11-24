# Portfolio catch-up and shared capability milestones — 2026-11-24

This is the cross-project routing and prioritization view of the owner's existing [Noxviola continuation backlog](https://github.com/Herbertofury/Noxviola/blob/main/TODO.md), not a replacement for project-local issues, accepted roadmaps or Athena's [shared capability registry](../guidance/registry/shared-capabilities.json). One accountable implementation owner per capability once selected; each consumer owns its acceptance. The per-repository rows below are the portfolio assignment; detailed work remains in linked local issues or roadmaps. Agents consult this page at task start and update the relevant canonical issue/roadmap/evidence on material progress, then link its new status here. Do not copy tasks into competing trackers.

**Evidence scope:** 42 repositories enumerated on November 24, 2026; 41 nonempty, one empty. Each nonempty repository was screened through actual README, tree or project docs; selected priority manifests, lockfiles, contracts and open issues were inspected. This is a dated triage, not a full dependency audit, native runtime audit, or proof a repository is broken/obsolete. Manifest minima/ranges differ from lockfile versions. Repository source and local/private work can differ. Investigate all actual active branches/checkpoints and reconcile before changes. No upgrades, deletion, migration, assignment to a real person, or runtime acceptance claimed. Priority and workstream ownership below are proposed coordination decisions under owner direction, not new universal release blockers.

## Milestone order and ownership

| ID | Milestone / accountable coordination | Completion evidence |
| --- | --- | --- |
| M0 | **Inventory, organize, establish protected baseline** — Athena coordinates; each project owns its actual source, branch, backlog, release and acceptance. | Exact source/last-good commit + artifact, feature inventory, active work, toolchain/manifest/lock and actual consumer map. Reconcile stale receipts, pending PRs, source recovery, wiki, and dependency decisions. No new competing tracker. |
| M1 | **Shared provider and acquisition foundation** — Athena coordinates contract, fixtures and selection; Modding-Knowledge owns public evidence schema; implementation owner(s) selected after matched comparisons. | Compare actual per-provider adapters, identity/metadata, transfer and browser routes; one strongest versioned implementation per compatible contract, independently accepted by at least two consumers. See detailed phases below. |
| M2 | **Frontier stack and reusable runtime tools** — Athena research, Ferrum isolated browser harness, Vault TestGrid for supported game workflows; owners retain native requirements. | Refresh official channels, repair newer versions, adopt every verified compatible improvement; compare CPU/RAM/latency/build size and real full output. Share CLI/API contracts, not unverified code merges. |
| M3 | **Finish real product workflows and parity** — each owning repository. | Protected features, exact current native/packaged runtime, portable data, compatibility, rollback, mandatory applicable optimizers, stack/fix-forward and wiki closeout receipt. Ship incremental vertical slices rather than waiting for all portfolio milestones. |
| M4 | **Consolidate knowledge and historic duplicates** — Athena coordinates evidence and links; product/data owners maintain canonical source. | Versioned provenance/exports, recoverable history, no unique feature/data loss. Verify actual consumers, docs/wiki and independently accepted replacement before retiring anything; no delete without owner authorization. |

Priority P0 means start/reconcile first because of broad dependencies or concrete drift; P1 means next product-critical work; P2 means scoped follow-up; HOLD is an explicit placeholder/constraint. These are ordering labels, not dates or GitHub milestone objects. A missing optional experiment does not stop unrelated releases. Existing mandatory checkout and opt-in security rules remain unchanged.

## M1 — provider and site adapters: first cross-repository execution lane

**Current fragmentation is confirmed, best implementation is not yet established.** Athena's [collection contract](../engineering/docs/adapters/contract.md) distinguishes provider-qualified IDs, media roles, access state and completeness; its [adapter lab](../engineering/docs/adapters/README.md) reports 426 researched scopes and limited operation-level real evidence. Minecraft Mod Vault's [identity contract](https://github.com/Herbertofury/Minecraft-Mod-Vault/blob/main/PROVIDER-IDENTITY-CONTRACT.md) adds exact-file anchors and compatibility. Modding-Knowledge's [health query contract](https://github.com/Herbertofury/Modding-Knowledge/blob/main/docs/mod-health-query.md) already defines exact-context public claims. Reuse these; don't design another incompatible schema.

- [ ] **M1a — inventory/contract.** Athena coordinates; Enderloom, Modhunter, Minecraft-Mod-Vault, Gamesync, GameSync-Next, Noxviola, MediaForge and UltraDeck identify real source/call sites, version, provider IDs, operations (discover, metadata, files, update, media, follow, download), authorization, supported runtime, full/partial/unknown states and existing tests. Modding-Knowledge maintains source/evidence schema. Use [shared capabilities](../guidance/registry/shared-capabilities.json). Do not duplicate existing adapter lab catalog.
- [ ] **M1b — first gold cohort.** Start with Modrinth, CurseForge, GitHub Releases and Nexus Mods where supported; exact project/file/version IDs and hashes, platform/game/loader filters, multi-file/add-on mapping, pagination, update/follow state, release timestamps, cache freshness, authorization/manual-only, errors and partial continuation. Compare identical recorded public/authorized fixtures and approved live tests. Keep provider-specific semantics and rate limits; no access-control bypass or unauthorized downloads.
- [ ] **M1c — pick and repair the strongest route.** Native Rust/Go/TS HTTP and existing provider adapters are controls; evaluate latest relevant reqwest, Firecrawl Local, Spider, Crawlee, Crawl4AI, official APIs and isolated browser only where needed. Compare complete metadata/media/identity and full download/hash/restart/rollback against actual internal candidates and Ghost Downloader 3/aria2. Measure first useful and complete result, p95/p99, peak RSS, CPU, transferred bytes and requests. Attempt root-cause repair for regressions before retaining older versions. Distinguish engine from adapter: no one universal crawler or downloader requirement.
- [ ] **M1d — two-consumer proof.** First cohort Enderloom + Modhunter, with Minecraft-Mod-Vault's identity/TestGrid contract and GameSync-Next asset pipeline as additional challengers/consumers. Assign authoritative implementation owner and pin contract/package version only after real equivalent acceptance; keep host-specific adapter bindings, app-local data and independent offline startup. Record per-provider operation evidence, exact consumer pin and rollback. Shared libraries only where rights/compatibility allow; use shared tests/specs otherwise.
- [ ] **M1e — controlled rollout.** GameSync/Next parity, Noxviola following, MediaForge media identity, UltraDeck native feed actions, MO2R and catalog consumers adopt compatible proven pieces in independent releases. Expand provider families in existing Athena research with actual coverage receipts. Review current official API/release changes on relevant tasks and release freshness; refresh stale entries, notify consumers through existing issues. No claim of full provider support from a catalog entry.

## Observed stack drift, not a blanket update order

| Project | Exact checked-in observation | Current candidate / next action |
| --- | --- | --- |
| Athena | [Rust toolchain](../engineering/apps/atlas-lab/rust-toolchain.toml) 1.99.1; [npm lock](../package-lock.json) Playwright 1.62.1 | Rust 1.100.0 and Playwright 1.65.1; test current full suite and generated Explorer. |
| Modhunter | [Rust toolchain](https://github.com/Herbertofury/Modhunter/blob/main/native/rust-toolchain.toml) 1.99.1; [Cargo.lock](https://github.com/Herbertofury/Modhunter/blob/main/native/Cargo.lock) Reqwest 0.12.28 + 0.13.5 | Rust 1.100.0; inspect reverse dependency/feature graph, test migration from 0.12 and only remove duplicate when all consumer contracts pass. |
| Enderloom | [npm lock](https://github.com/Herbertofury/Enderloom/blob/main/package-lock.json) Electron 44.4.5 / Playwright 1.62.1; [Cargo.lock](https://github.com/Herbertofury/Enderloom/blob/main/native/Cargo.lock) Reqwest 0.13.4, rusqlite 0.32.1 | Electron 45.5.0, Playwright 1.65.1, Reqwest 0.13.5; compare native storage and actual Tauri/browser/launcher flows with supported current channels. No unsupported rusqlite latest-version claim. |
| GameSync-Next | [npm lock](https://github.com/Herbertofury/GameSync-Next/blob/main/package-lock.json) Playwright 1.59.1, TypeScript 6.0.3, Vite 8.1.3 | Match Playwright package/browser versions; evaluate native TypeScript 7, current registry channel and supported Node. Don't treat Vite 8.1.3 as stale without lookup. |
| Ferrum-Browser | [npm lock](https://github.com/Herbertofury/Ferrum-Browser/blob/main/package-lock.json) Electron 43.4.0; Playwright 1.63.0-alpha-2026-08-21 | Electron 45.5.0 and stable Playwright 1.65.1 comparison; verify all real runtime lanes and diagnose any alpha-specific needed behavior. |
| Hover-App | [README](https://github.com/Herbertofury/Hover-App/blob/main/README.md) says verified with Rust 1.99.0; minimum 1.95 | Inspect actual resolved toolchain and stage latest stable; do not confuse minimum with build version. |

Upstream verified on 2026-11-24: [Rust 1.100.0](https://blog.rust-lang.org/2026/11/12/Rust-1.100.0/), [Electron v45.5.0](https://github.com/electron/electron/releases/tag/v45.5.0) (published Nov 24), [Playwright v1.65.1](https://github.com/microsoft/playwright/releases/tag/v1.65.1), [Reqwest v0.13.5](https://github.com/seanmonstar/reqwest/releases/tag/v0.13.5), [TypeScript 7 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/). Recheck exact package/channel at implementation; no claim current candidate is accepted. See [Athena's latest frontier research](../engineering/research/2026-11-24-frontier-index.md). Read existing mandatory [stack and fix-forward standard](../guidance/WEB_ACQUISITION_FRONTIER.md) and [release checkout](../guidance/PRE_RELEASE_OPTIMIZATION.md).

## Per-repository assigned catch-up tasks

### Athena

**P0 · M0/M1/M2 · open.** Rust lab pin 1.99.1 and Playwright lock 1.62.1; 64 frontier sources are indexed but not in the generated Explorer. Adapter lab documents 426 scopes, not production coverage. [Observed source](https://github.com/Herbertofury/Athena/blob/main/engineering/README.md).

- [ ] Own the shared adapter contract and comparison queue; integrate the new research into the existing Explorer and source/operation freshness. Stage Rust 1.100 and Playwright 1.65.1; verify Linux/Windows and live Wiki/Pages. Finish the existing unified app migration and preservation gates.
- **Existing local owner/work record:** [issue 60](https://github.com/Herbertofury/Athena/issues/60). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Enderloom

**P0 · M0/M1/M2/M3 · open.** Lockfiles resolve Electron 44.4.5, Playwright 1.62.1, Reqwest 0.13.4 and rusqlite 0.32.1. Existing native download path and JS provider fast lane overlap Vault/GameSync/Modhunter; open performance, recovery and update issues. [Observed source](https://github.com/Herbertofury/Enderloom/blob/main/docs/ENDERLOOM_ULTIMATE_CODEX_MASTER_BACKLOG.md).

- [ ] Upgrade/repair compatible stack; reconcile actual daily-driver source first. Co-own the first exact-file/transfer fixture cohort, preserve download destination on failure, partial provider results and last-good DB. Compare with Vault and Modhunter; adopt shared provider/transfer contract, not a wholesale replacement. Use Vault TestGrid/Ferrum for real Java/Bedrock/loader A/B and native proof.
- **Existing local owner/work record:** [issue 70](https://github.com/Herbertofury/Enderloom/issues/70). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Modhunter

**P0 · M0/M1/M2/M3 · open.** 0.12.1 release README; native pin 1.99.1; native lock resolves both Reqwest 0.12.28 and 0.13.5. Existing Python source_adapters.py and native helpers; no full source-to-live adapter parity proved here. [Observed source](https://github.com/Herbertofury/Modhunter/blob/main/wiki/Intelligence-and-Performance-Roadmap.md).

- [ ] Stage Rust 1.100; diagnose 0.12 to 0.13 compatibility and converge HTTP paths only if parity passes. Exact multi-file updates (Nexus, Modrinth, CurseForge, GitHub), stable IDs, author follow/Mod Health, MO2 profile selection, ESL flags, rollback and portable user data. Compare full real populated MO2 workloads; retain accepted OLED/list/gallery and version evidence.
- **Existing local owner/work record:** [issue 2](https://github.com/Herbertofury/Modhunter/issues/2). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### GameSync-Next

**P0 · M0/M1/M2/M3 · open.** Lock resolves Playwright 1.59.1, TS 6.0.3, Vite 8.1.3; asset orchestrator owns separate adapter/download pipeline. April parity document says desktop behind extension; current status must be reconciled, not assumed unchanged. [Observed source](https://github.com/Herbertofury/GameSync-Next/blob/main/docs/PARITY_CHECKLIST.md).

- [ ] Refresh parity matrix against Gamesync HEAD and #49, unify source ownership and shared core while preserving extension/desktop/mascot/game features. Test Playwright 1.65.1 with matched browsers, TS 7 native compiler and current Node/Electron where relevant; compare current adapter/download contracts and exact identity. Complete actual unpacked/browser/desktop cutover and restore path.
- **Existing local owner/work record:** [issue 49](https://github.com/Herbertofury/GameSync-Next/issues/49). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Gamesync

**P0 · M1/M3 · open.** Canonical app/ source and generated dist/ documented; independent smart-scrape, catalog, native messaging and WASM paths coexist with Next. [Observed source](https://github.com/Herbertofury/Gamesync/blob/main/README.md).

- [ ] Treat current legacy implementation as a protected parity baseline. Inventory unique features, adapters and actual call sites; transfer winning code/fixtures to agreed Next shared owner and prove exact source/runtime parity before retiring anything. Preserve extension identity, settings, credentials boundaries and old release rollback.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/GameSync-Next/issues/49). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Noxviola

**P0 · M1/M3 · open.** Main has public site and backlog; README says experimental browser remains draft PR #5, no stable release; source is not visible in main manifest inventory. [Observed source](https://github.com/Herbertofury/Noxviola/blob/main/README.md).

- [ ] Resolve draft browser acceptance using Enderloom baseline, verified upstream engine/version comparisons and Ferrum isolated native tests. Complete profile/container isolation, tabs/sidebar/split view, portable state and creator/project following. Reuse provider and download contracts. Keep stable browser release distinct from public site.
- **Existing local owner/work record:** [PR 5](https://github.com/Herbertofury/Noxviola/pull/5). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Minecraft-Mod-Vault

**P0 · M1/M3 · open.** 0.13.0 TestGrid and Go + Rust tooling described; provider contract explicitly anchors exact Modrinth SHA-512/CurseForge fingerprint, compatible file and offline identity. Significant overlap with Enderloom mod/port/repair/testing. [Observed source](https://github.com/Herbertofury/Minecraft-Mod-Vault/blob/main/PROVIDER-IDENTITY-CONTRACT.md).

- [ ] Co-design identity fixtures with Enderloom; publish a compatible shared TestGrid CLI contract and actual consumer trial instead of duplicating launch harnesses. Reconcile Creator Vault and native conversion; verify exact Java/Bedrock runtime, cancellation and artifacts. Check current Go/Rust/JDK/Gradle channels for fixed targets.
- **Existing local owner/work record:** [issue 40](https://github.com/Herbertofury/Minecraft-Mod-Vault/issues/40). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Modding-Knowledge

**P0 · M1/M2 · open.** Populated central SQLite and read-only Rust CLI; exact-context health claim schema; successor resolution explicitly not implemented. Cargo minimum 1.99 is not proof of actual compiler pin. [Observed source](https://github.com/Herbertofury/Modding-Knowledge/blob/main/docs/mod-health-query.md).

- [ ] Own public provider-qualified entity/release/health evidence schema and versioned snapshots, not every crawler implementation. Add revision/supersession and consumer contracts with Athena, Modhunter and GameSync; validate import/export, provenance, exact version context and restore. Check resolved toolchain/deps before release; compare current SQLite/FTS/indexing.
- **Existing local owner/work record:** [issue 16](https://github.com/Herbertofury/Modding-Knowledge/issues/16). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Ferrum-Browser

**P0 · M2/M3 · open.** Lock resolves Electron 43.4.0 and Playwright 1.63.0-alpha-2026-08-21. Existing real-browser/CDP/Lightpanda/Appium evidence lanes; source includes lightpanda.mjs. [Observed source](https://github.com/Herbertofury/Ferrum-Browser/blob/main/README.md).

- [ ] Stage Electron 45.5.0 and Playwright 1.65.1; keep alpha only if repaired stable candidate cannot meet actual compatibility. Expose reusable CLI workload/evidence contract to GameSync, Noxviola, Enderloom and Athena. Preserve extension bytes/ID, full Chromium, native and device acceptance; Lightpanda only for matching supported workloads.
- **Existing local owner/work record:** [issue 87](https://github.com/Herbertofury/Ferrum-Browser/issues/87). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### TD1-Occult-Hybrid-Apex

**P1 · M3 · open.** Recovered V9.5 May 29 checkpoint; current authorized upstream behavior baselines and extensive wiki research, not proof of complete native hybrid/CAS release. [Observed source](https://github.com/Herbertofury/TD1-Occult-Hybrid-Apex/blob/main/README.md).

- [ ] Reconcile current upstream and last-good behavior by exact game build; preserve hybrid, F11, live CAS, colors and appearance/undo. Compare package index and background work with TS4 Accelerator/External CAS in isolated real game; target long-tail stalls and large package sets. Keep existing native parity tracker.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/TD1-Occult-Hybrid-Apex/blob/main/wiki/TODO.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### External-CAS

**P1 · M3 · open.** Rust workspace with catalog, assets, render/material, source UI and bridge; README says no accepted installer. [Observed source](https://github.com/Herbertofury/External-CAS/blob/main/README.md).

- [ ] Inventory full room/UI/appearance/pose/animation parity against game; reuse verified DBPF/tray catalog and preview modules after contract comparison. Compare native UI/render/asset techniques from Athena; prove exact target game sync and independent native app, clean installer, portable data and rollback.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/External-CAS/blob/main/docs/EXTERNAL_CAS_ACCEPTANCE.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### TS4-Accelerator

**P1 · M3 · open.** Recovered V8 source 0.3.0; later 0.3.4 hash without matching recovered archive. Stable channel unpinned; default generated data described under LOCALAPPDATA. [Observed source](https://github.com/Herbertofury/TS4-Accelerator/blob/main/README.md).

- [ ] Reconcile missing lineage without claiming recovery, pin verified latest compatible Rust, add explicit portable data mode while preserving existing users. Compare DBPF metadata/parser with External CAS/Hover; measure true launch/CAS on large fixture without touching original Mods/Saves/Tray.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/TS4-Accelerator/blob/main/wiki/TODO.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Hover-App

**P1 · M0/M3 · open.** Development MSI acceptance but no verified release; README says local Rust 1.99.0; protected adoption PR #50 pending. DBPF parser source exists. [Observed source](https://github.com/Herbertofury/Hover-App/blob/main/README.md).

- [ ] Reconcile PR #50 through required checks; upgrade/repair Rust and current preview dependencies; compare shared read-only DBPF and media preview paths with CAS/Accelerator. Verify actual Windows install/rollback, supported formats, idle resource floor and portable mode; no bypass of protection.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Hover-App/blob/main/docs/current-status.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### MediaForge

**P1 · M1/M2 · open.** 0.4.1 instant/deep acquisition lanes and published performance fixture; independent media extraction and download flow. [Observed source](https://github.com/Herbertofury/MediaForge/blob/main/README.md).

- [ ] Preserve fast first-correct-result plus lossless complete deep scan; compare shared media-role, variant and download identity with Athena/GameSync/UltraDeck. Adopt common extraction/test fixtures and versioned native/CLI routes where compatible. Verify X/public media, GIF/ZIP export, real extension, complete counts and exact current build tools.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/MediaForge/blob/main/docs/PERFORMANCE.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### UltraDeck

**P1 · M1/M2 · open.** 8.5.0 supported social feed adapters retain native-backed actions and playback state; separate adapter research exists. [Observed source](https://github.com/Herbertofury/UltraDeck/blob/main/README.md).

- [ ] Compare provider identity, media roles and session/DOM lifecycle against Athena/MediaForge/Noxviola. Share normalized read-only contracts without breaking native interaction capsule or full mounted-card behavior. Verify actual supported sites, extension browsers, retained state, playback and current WXT/TS toolchain.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/UltraDeck/blob/main/docs/UltraDeck-v8.0.0-site-adapter-research.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### MO2R

**P1 · M1/M3 · open.** Main inventory is documentation-focused; README lists native tag/workspace/tool parity goals and explicitly labels planned work. [Observed source](https://github.com/Herbertofury/MO2R/blob/main/README.md).

- [ ] Locate and reconcile actual native source checkpoint before any upgrade claim. Compare Modhunter's MO2 lifecycle, provider identity and update intelligence with MO2R goals; reuse tested contracts, retain MO2R's distinct native manager/workspaces. Deliver real profile read/write/undo proof and portable data.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/MO2R/blob/main/docs/agent-accessible-workflows.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Project-Constellation

**P1 · M2/M3 · open.** v0.16 canonical source no longer depends on ProjectDump; local brain/continuity/recovery and provider adapters. [Observed source](https://github.com/Herbertofury/Project-Constellation/blob/main/README.md).

- [ ] Reconcile source/extension provider drift; compare Ferrum workload automation and Athena exact-source/knowledge contracts. Verify real supported provider capture and restart/recovery without duplicate requests, full local data/export and current browser/runtime stack. Preserve active work and authorization; retire old duplicates only after parity.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Project-Constellation/blob/main/docs/PROVIDERS.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Agent-Foundry

**P1 · M0/M2 · open.** Reusable skills/governance with migration overlap; Athena owns current shared guidance and receipt schema 5. [Observed source](https://github.com/Herbertofury/Agent-Foundry/blob/main/README.md).

- [ ] Reconcile existing skill/core ownership with Athena guidance; consume current canonical policies, failure evidence and release receipt rather than fork a second system. Check actual host skill compatibility, exact evaluator and native tool proof; retain source/history and distinct capabilities.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Agent-Foundry/blob/main/docs/SKILL-AUTHORING.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Advent-of-Ascension

**P1 · M3 · open.** Private playtest native evidence cited, full historical/latest merge explicitly unfinished. Multi-version atlas and existing weapon/runtime backlog. [Observed source](https://github.com/Herbertofury/Advent-of-Ascension/blob/main/README.md).

- [ ] Follow existing Noxviola AoA priorities; reconcile actual approved target and upstream versions; use shared Enderloom/Vault CLI TestGrid and Vulkan performance evidence for real client/server. Finish accepted vertical slices, preserve registry/save IDs, historical content, art/animation and source provenance.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Advent-of-Ascension/blob/main/development/README.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Minecraft-Vulkan-Hybrid

**P1 · M3 · open.** Main source inventory returned wiki/comparison material and no detected build manifest; actual renderer source/branch and latest native evidence need reconciliation. [Observed source](https://github.com/Herbertofury/Minecraft-Vulkan-Hybrid/blob/main/README.md).

- [ ] Locate actual renderer checkpoint, exact AoA test instance and driver/loader. Compare eligible Sodium/Lithium/VulkanMod techniques from Athena without changing fixed game target; measure real frame/tick tails, shader/assets/mod compatibility, and preserve working renderer rollback.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Minecraft-Vulkan-Hybrid/blob/main/wiki/Competing-Approaches.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### JetSetCraft

**P1 · M3 · open.** North-star encounter vision explicitly not shipped; existing operational acceptance and release-status pages. [Observed source](https://github.com/Herbertofury/JetSetCraft/blob/main/README.md).

- [ ] Deliver one fully playable encounter vertical slice on actual approved Minecraft target, preserving world/restoration, gang and music rights. Use shared TestGrid/Enderloom and native frame/tick QA; verify physics, controls, replay, assets and current compatible loader/compiler.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/JetSetCraft/blob/main/docs/ENCOUNTER_NORTH_STAR_ACCEPTANCE.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Feature-Foundry

**P1 · M3/M4 · open.** Maintained stack described as TypeScript 7/Vite 8/Three/Tauri/Rust/SQLite; V24 compatibility source preserved. Athena integration/deletion readiness not proved. [Observed source](https://github.com/Herbertofury/Feature-Foundry/blob/main/README.md).

- [ ] Do not mark stale solely for age. Reconcile exact latest source and all V24/V33 worlds/rooms/mascot/music/ecology/data with Athena native app, run real parity and save migration, current resolved toolchain check and independent host proof; preserve original repo/history until recovery and owner decision.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Athena/blob/main/docs/REUSABLE-PACKAGE-COORDINATION.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Engineering-Atlas

**P1 · M4 · open.** October 31 snapshot 283 candidates; Athena has newer November frontier source fragments and preserved migration archive. [Observed source](https://github.com/Herbertofury/Engineering-Atlas/blob/main/README.md).

- [ ] Route new research to Athena only after checking remaining source/draft deltas. Verify complete archive/recovery, exact-destination CI, wiki and app navigation, artifact and external consumer migration before owner considers retirement. No deletion or duplicate ongoing research.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Athena/blob/main/migration/engineering-atlas/README.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Sims4Foundry

**P1 · M3 · open.** Public README is a thin Sims4CreatorStudio index; tree shows bootstrap manifest, no detected full build manifest. [Observed source](https://github.com/Herbertofury/Sims4Foundry/blob/main/README.md).

- [ ] Find authoritative source/checkpoint and map CAS/creation capabilities against External CAS/Apex. Recover without recreating accepted work; compare current tools only after source/targets verified, then native acceptance and full wiki.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Sims4Foundry/blob/main/COMPETITORS.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### ruffle-external-cas

**P1 · M3 · open.** Upstream-style Ruffle README on master; External CAS workspace references ruffle_core profile. Actual fork divergence and dependency use unverified. [Observed source](https://github.com/Herbertofury/ruffle-external-cas/blob/master/README.md).

- [ ] Inventory fork commits and actual consumer revision/license, compare current upstream Ruffle and repair latest eligible compatibility in isolated fork branch; preserve CAS-specific behavior, ActionScript/UI fidelity and native acceptance. Do not blindly replace fork.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/External-CAS/blob/main/docs/EXTERNAL_CAS_ACCEPTANCE.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Skyrim-Mod-Workbench

**P1 · M1/M3 · open.** Python 3.11+ stdlib early read-only JSON manifest dependency checker; explicitly no ESP/ESM parsing or game qualification. [Observed source](https://github.com/Herbertofury/Skyrim-Mod-Workbench/blob/main/README.md).

- [ ] Compare Modhunter/MO2R and current Skyrim-native parsing, LOOT and version/runtime contracts from Athena; build real read-only plugin inventory/diagnostics and provenance, then isolated SE/AE/VR acceptance. Evaluate Rust only with full equivalent diagnostics and recovery.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Skyrim-Mod-Workbench/blob/main/README.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Computer-Link

**P1 · M2/M3 · open.** Tested JSONL read-only diagnostic foundation, not MCP or working native connector; no actual desktop access configured. [Observed source](https://github.com/Herbertofury/Computer-Link/blob/main/README.md).

- [ ] Reuse CLI-first harness discovery and Ferrum's isolated test contracts. Implement a minimal authorized supported connector only where platform allows, exact capability schema and native Windows read-only proof; no arbitrary shell fallback or foreground control. Compare current runtime and portability.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Computer-Link/blob/main/docs/architecture.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Minecraft-Mods

**P1 · M1/M4 · open.** Catalogue imports not fully reconciled; one unresolved identity row plus storage questions; source stars distinct from runtime tests. [Observed source](https://github.com/Herbertofury/Minecraft-Mods/blob/main/README.md).

- [ ] Link records to Modding-Knowledge stable IDs and Athena provider evidence; reconcile remaining imports and update exact version/loader/freshness metadata without deleting unique notes, release claims or historical source. Use incremental indexing and generated counts.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Minecraft-Mods/blob/main/docs/musthave-pending-identities.json). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Games

**P2 · M1/M4 · open.** Local-first recommendations/media catalog with explicit canonical game identity and multiple stores. [Observed source](https://github.com/Herbertofury/Games/blob/main/README.md).

- [ ] Reuse Athena source/media contracts and stable game/store IDs; compare shared GameSync metadata where appropriate, retain original recommendations, exact provenance and all counts. Test portable query/export/media and current publishing stack.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Games/blob/main/README.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### memories

**P2 · M1/M4 · open.** Creator/series chronology catalog reviewed Nov 15, incomplete inventory and unresolved chronology. [Observed source](https://github.com/Herbertofury/memories/blob/main/README.md).

- [ ] Use shared provider identity/media/follow evidence for public creator sources; distinguish original/reupload/compilation and rights, preserve history and explicit unknown dates. Reconcile current favorites backlog and current site build/wiki.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/memories/blob/main/README.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### ProjectDump

**P2 · M4 · open.** No root README found; tree includes historic Project Constellation release folders, Minecraft tools and wiki snapshots. Constellation README names itself canonical. [Observed source](https://github.com/Herbertofury/ProjectDump/blob/main/AGENTS.md).

- [ ] Inventory preserved artifacts and unique live consumers; map to canonical owning repos and archive/recover with hashes. Link instead of developing duplicate apps. No deletions or migrations without acceptance and authorization.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Project-Constellation/blob/main/README.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Skyrim-Animation-Research

**P2 · M4 · open.** Dated Nov 14 addendum; MMD Tools compatibility gap with current Blender 5.2 documented; research-only. [Observed source](https://github.com/Herbertofury/Skyrim-Animation-Research/blob/main/README.md).

- [ ] Refresh official Blender/MMD Tools/PyNifly/HKX and runtime channels, attempt supported compatibility repair in isolated workflow if feasible. Link Athena creative/game pipeline evidence, preserve historical version matrix, verify actual sample export before promotion.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Skyrim-Animation-Research/blob/main/docs/2026-11-14-SKYRIM-TOOLING.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### CrownFold

**P2 · M3 · open.** v0.8 experimental browser vertical slice with Rust/Wasm tactics; rest of renderer/UI/RPG/storage remains JS. [Observed source](https://github.com/Herbertofury/CrownFold/blob/main/README.md).

- [ ] Select next complete playable vertical slice; compare current Rust/Wasm/WebGPU/render options and asset pipeline with exact browser target. Preserve legacy board game, saved worlds, tactical behavior and real FPS/input. Avoid broad rewrite until measured.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/CrownFold/blob/main/README.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Bloom-and-Boom

**P2 · M3 · open.** Reference3 tested privately; browsable source import, public bundle and stable release open. [Observed source](https://github.com/Herbertofury/Bloom-and-Boom/blob/main/README.md).

- [ ] Reconcile actual tested source/hash, publish only permitted artifacts, use fixed Forge target and shared TestGrid/native checks. Preserve floral variants/registry/save IDs and visual fidelity; check latest compatible build stack.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Bloom-and-Boom/blob/main/docs/REFERENCE3.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Hearth-and-Haul

**P2 · M3 · open.** Recovered Backpacks 2.0.2.4 foundation, historic vs current vs future explicitly distinguished. [Observed source](https://github.com/Herbertofury/Hearth-and-Haul/blob/main/README.md).

- [ ] Recover and verify browsable actual source/current target with existing creature variants; use Enderloom/Vault conversion/testing contracts and native save/inventory compatibility. Refresh supported build tools, preserve storage and original registry IDs.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Hearth-and-Haul/blob/main/README.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Minecraft-Combat-Style-Suite

**P2 · M3 · open.** Comparison and evidence roadmap, current implementation not established from short README. [Observed source](https://github.com/Herbertofury/Minecraft-Combat-Style-Suite/blob/main/README.md).

- [ ] Inventory real source/runtime and unique combat requirements, compare current compatible mods and shared game-test harness. Deliver one fully accepted mechanics slice and preserve player control/mod behavior, not concepts-only claims.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Minecraft-Combat-Style-Suite/blob/main/COMPETITORS.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Pinterest-Nocturne

**P2 · M0/M1 · open.** Thin README, bootstrap marker; no detected app manifest in main inventory. [Observed source](https://github.com/Herbertofury/Pinterest-Nocturne/blob/main/README.md).

- [ ] Locate canonical extension/userscript or draft; compare UltraDeck/MediaForge reusable feed/media contracts and documented Pinterest behavior. Define supported scope, actual source and acceptance before adopting a stack; no duplicate extension engine.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Pinterest-Nocturne/blob/main/README.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### FlipForge

**P2 · M0 · open.** Main inventory contains only minimal top-level docs; product implementation not established. [Observed source](https://github.com/Herbertofury/FlipForge/blob/main/README.md).

- [ ] Recover project intent and authoritative source/artifact/checkpoint; inspect overlap with existing projects before building. Establish tested user journey, compatible frontier stack and wiki; do not invent feature claims.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/FlipForge/blob/main/README.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### CAS-Helper

**P2 · M0/M3 · open.** Main inventory minimal docs and no detected build manifest. [Observed source](https://github.com/Herbertofury/CAS-Helper/blob/main/README.md).

- [ ] Locate actual helper/source and unique supported CAS tasks; evaluate reuse in Apex/External CAS/Sims4Foundry before new development. Require real game proof for any native capability.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/CAS-Helper/blob/main/README.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Herbertofury.github.io

**P2 · M4 · open.** Root tree static HTML/CSS/privacy/terms; no build manifest detected. [Observed source](https://github.com/Herbertofury/Herbertofury.github.io/blob/main/index.html).

- [ ] Maintain simple canonical publishing surface, audit current links to active repos/wikis and duplicate site content; verify browser accessibility and portable static output. Do not introduce framework purely for modernity.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Herbertofury.github.io/blob/main/index.html). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Travel-Softball-Team

**P2 · M4 · open.** Intentionally plain HTML/CSS/JS static template with site.config.js as canonical data. [Observed source](https://github.com/Herbertofury/Travel-Softball-Team/blob/main/README.md).

- [ ] Keep lightweight static stack unless a verified stronger solution improves actual workflows. Verify responsive performance/accessibility, portable publishing and authorized content; refresh docs and supported tooling.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Travel-Softball-Team/blob/main/README.md). Review actual active work first, record exact evidence and next action there, then link the updated status here.

### Hover

**HOLD · M0 · open / intentional placeholder.** Empty repository; Hover-App README names the actual app repo. [Observed source](https://github.com/Herbertofury/Hover).

- [ ] Keep as empty placeholder unless owner later chooses a redirect/archive. Do not create second app or delete it; route active work to Hover-App.
- **Existing local owner/work record:** [canonical project reference](https://github.com/Herbertofury/Hover-App). Review actual active work first, record exact evidence and next action there, then link the updated status here.


## Closeout and review discipline

At each material checkpoint update the existing owning issue/wiki with what was actually completed, exact source/release and linked receipt; update only the corresponding row/phase here with status and next action. Review portfolio on Athena/agent task start and before relevant release; update stale evidence instead of silently copying old dates. Use current official release metadata and the existing daily acquisition signals. No fixed release deadline or automatic task execution is implied. Do not make all projects wait for M1: land compatible improvements independently. Never close an item from a documentation edit, green build, or untested proposal alone. Optional security audits remain opt-in, CLI-first/non-interruptive execution applies, and all applicable optimization gates and zero-loss fixes remain required.

Current gaps: full source/branch inventory outside selected projects, actual native/worktree state, every dependency's latest compatible channel, exact operation coverage for each adapter, implementation ownership after comparisons, live real benchmarks and consumer adoption all remain open. The empty Hover repo is not a missing app; Hover-App is active. No old sources or local tasks were removed.
