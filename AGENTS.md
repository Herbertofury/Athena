# Repository agent instructions

## Mandatory pre-release optimization gate

Before finalizing every release, follow the owner-mandated [Athena zero-loss pre-release optimization standard](https://github.com/Herbertofury/Athena/blob/main/guidance/PRE_RELEASE_OPTIMIZATION.md). Evaluate shrink-anything, fast-anything, rust-anything and Google migrate-to-rust where each applies using reviewed pinned tools in isolated worktrees; run applicable passes, compare equivalent complete workloads, keep only independently verified improvements, restore rejected changes, and record per-tool evidence or explicit inapplicability/blockers. Never weaken tests, delete required content, force a Rust rewrite or regress functionality, quality, portability, compatibility, security or protected performance metrics. Data/documentation-only releases and existing native Rust paths require honest applicability decisions, not artificial ports. Existing local and pinned governance requirements remain intact.

Dedicated security audits (safe-anything, Semgrep, cargo-deny/audit and equivalents) are explicitly opt-in and advisory, never a new mandatory release gate. The four named optimization assessments must complete whenever applicable; deferred or missing applicable assessments block checkout. Adopt every verified zero-loss win. See the current shared standard for receipt schema and scope.

## Mandatory CLI-first / non-interruptive execution

For every task, follow the owner-mandated [Athena CLI-first execution standard](https://github.com/Herbertofury/Athena/blob/main/guidance/CLI_FIRST_EXECUTION.md). Prefer fast official CLI/headless commands, supported APIs/SDKs/connectors and tested local automation. If a required application has no usable structured interface, discover or build a reviewed [CLI-Anything](https://github.com/HKUDS/CLI-Anything) harness over the real supported backend (or a native command surface for first-party code). Use isolated browser/renderer/test sessions for necessary UI proof. Never take over the user's active desktop, mouse, keyboard, focus or browser profile without explicit authorization for unavoidable foreground interaction. Preserve real runtime acceptance, data, permissions, feature parity and portable mode. Record reusable command coverage and unresolved gaps; no fake CLI parity or unnecessary release delay.

## Continuous frontier modernization and web acquisition

Follow [Athena's frontier-stack standard](guidance/WEB_ACQUISITION_FRONTIER.md). Every release must refresh official stack versions and adopt verified compatible upgrades. If the newest eligible version has a defect, diagnose, attempt a causal repair and retest before holding an older version; document failed repair or evidenced infeasibility and a next review. Do not downgrade merely because the initial upgrade failed. Review crawler/browser/download candidates and compare equivalent workloads. Preserve mandatory optimizers, CLI-first execution and opt-in security auditing.

## Shared capabilities and zero-loss evolution

Consult [Athena's reusable-package coordination](docs/REUSABLE-PACKAGE-COORDINATION.md) and [capability index](guidance/registry/shared-capabilities.json) before substantial implementation. Reuse or improve the strongest verified compatible existing solution; preserve unique local functionality, data and accepted baseline. Contribute verified fixes and evidence at the owning source and link them in Athena. Keep one authoritative record per capability, avoid parallel duplicate work, and record a bounded reuse/drift review within release stack freshness.

## Mandatory wiki closeout and documentation-driven product review

At every material checkpoint and before release follow [Athena's wiki closeout standard](guidance/WIKI_CLOSEOUT.md). Document what the product does and how to use its actual features, verify changed workflows on the real supported deliverable, review and safely repair confusing or redundant work, keep canonical sources and required live Wiki current. Prefer incremental docs and existing tooling; route RAG-Anything, Diagram Design and supporting tools where useful. Preserve all accepted functionality and document unresolved blockers honestly.

## Game Systems Exchange

For any card-game, deckbuilder, roguelike/roguelite, survivor, campaign, encounter, run-progression, boss, card, relic, upgrade-draft, synergy or reward-system task, consult [Athena's Game Systems Exchange](docs/GAME-SYSTEMS-EXCHANGE.md) and its gameplay capability IDs in [the shared capability registry](guidance/registry/shared-capabilities.json). Inspect the current owning repository, active issues, exact source and tests plus the other listed game repositories before building a new mechanic or framework. Preserve each game's identity, engine, economy, save ownership, offline/portable behavior and already accepted features.

When a material gameplay improvement is implemented, close the loop by updating the appropriate Athena capability entry with the owning repository, full commit SHA, source path, reusable behavior, test command, evidence level, limitations and compatible consumers. Add deterministic/contract fixtures where appropriate and link the local issue. Other repositories adopt only compatible, licensed, tested improvements; require two real host acceptances before marking a shared implementation canonical. Share contracts/fixtures across different languages instead of copy-pasting incompatible engines. Distinguish a full deck/hand/discard rules engine from upgrade-draft cards, technology/research cards and card UI rendering. Keep game-only rewards separate from verified external product-maintenance rewards. Unrelated releases do not wait for this cross-project workstream.

## Athena Engine Foundry — shared game-engine source of truth

Before creating or materially changing card-game rules, deckbuilding, roguelite runs, survivor combat, encounter/reward systems, mascot actors, open-world simulation, vehicles, missions, save progression or game runtime/rendering, consult [Athena Engine Foundry](https://github.com/Herbertofury/Athena/blob/main/docs/ENGINE-FOUNDRY.md), its [package catalog](https://github.com/Herbertofury/Athena/blob/main/engines/catalog.json), and [M5 issue #365](https://github.com/Herbertofury/Athena/issues/365). Reuse or improve the strongest verified compatible engine; contribute generic improvements and fixtures back to Athena. Keep this repository's unique content, UI, balance, assets, saves and host adapters local. Do not create a parallel engine or independently edit an immutable Athena intake snapshot. Consumers must pin an exact local package/source digest, pass their own full acceptance and retain rollback; no application runtime may depend on an online Athena service. A source candidate or prototype is not a verified engine release.


## Portfolio UI and backend quality

Follow the shared [Athena Design Quality Standard](guidance/DESIGN_QUALITY_STANDARD.md) when changing any user-facing surface or its supporting data/API. Apply profile, social, animation and media capabilities where relevant; do not add accounts merely for compliance. Use the [interface quality adoption receipt](guidance/templates/INTERFACE_QUALITY_RECEIPT.md) for material changes: record exact sources, actual consumer acceptance, protected performance and supported fallbacks. Claims of reference parity require runtime proof; preserve every project's identity, portable data and verified workflows.
