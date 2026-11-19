# Universal engineering pillars and project-goal index

Scope corrected 2026-11-19 at the owner's direction. **Central pillars are principles applicable across all repositories. Project-specific features belong to their owning repositories and are linked only in the separate index below.** **Accepted requirements and implementation backlog, not universal shipped support.** Athena retains the shared direction; each consuming repository owns its implementation, tests and delivery evidence. Preserve existing work, current private candidates and project-specific acceptance holds.

## P1 — Portable owned data
Every application must support a portable folder containing its app-owned data, settings, indexes, caches, reports, histories and recovery receipts. No silent dependency on Program Files or AppData for portable operation. Explicit external game/tool/source paths remain references, not files to relocate automatically. Secure secrets, permissions, filesystem capabilities and OS integrations need explicit design; portability is not itself a security guarantee. Test whole-folder relocation, restart, read-only/locked paths, disk-full, backup/restore and upgrades. Document any unavoidable external state honestly.

## P2 — Responsive event-driven work
Prefer bounded one-off parallel work at launch, explicit refresh, update-view entry or relevant entity interaction. Avoid repeated whole-library polling just because the app is open. One coordinator coalesces triggers; no network requests inside sort comparators or per-row repaint. Reuse current evidence, invalidate changed subsets, bound CPU/IO/network/memory, cancel stale work, preserve last-good data and expose freshness/partial failures.
Necessary playback, safety, synchronization, explicitly enabled watches and missed-event reconciliation are not blanket forbidden. Audit their owners before optimizing, use events and bounded fallback where justified, and do not silently disable existing notifications or alter schedules. Measure idle wakeups, input/scroll/frame latency and equivalent result completeness, not only microbenchmarks.

## P3 — Evidence, identity and explicit relationships
Preserve source provenance, stable identities, conditions, versions and freshness for facts and relationships relevant to each product. Distinguish unknown, inferred, declared and verified; never promote adjacency, name similarity or an unavailable source into certainty. Reuse shared domain contracts rather than duplicate truth stores. Presentation operations must not silently mutate underlying user state. Specific relationship schemas and columns belong to their domain repositories.

## P4 — Useful feedback and user control
Communicate meaningful progress, results, uncertainty and failures without noise. Where notifications apply, make them configurable, deduplicated, attributable and recoverable across restart. Preserve user choices and privacy; an informational event does not authorize a consequential action. Specific event kinds, subscriptions and delivery workflows belong to their product requirements. This document activates no monitor or external delivery.

## P5 — Reusable creative assets without an ambition ceiling
Creatively reuse compatible existing components, permitted assets, user-authorized saved media and data for varied gameplay and expressive interfaces with a modest footprint. Retain rights, attribution, provenance, privacy and project identity. A saved image is not permission to redistribute it. Efficiency must not cut requested features or cap quality, ambition or depth; prove resulting behavior and resource cost.

## P6 — Complete outcomes, depth and verified quality
Carry features through useful end-to-end workflows, including interruption, recovery and long-term use, rather than stopping at superficial demos or counters. Match depth and testing to the product's purpose, retain requested ambition and measure actual outcomes. Research is not implementation, a fixture is not native acceptance, and a completed document is not delivered functionality. Games' modes, economies and progression goals remain game-project requirements, not universal features.

## P7 — Preserve identity and accessible design
Improve visual quality, accessibility, clarity and responsive feedback while preserving each project's established colors/design identity. Black is the default base, not permission to erase meaningful colors or force one generic theme. Preserve user customizations and avoid disruptive redesigns; product-specific opt-in or compatibility requirements live with that product. Study design sources without copying reserved assets, templates or model weights.

## P8 — Modular features and safe independent evolution
Organize features into cohesive, clearly owned modules with explicit responsibilities and minimal coupling. Each feature should work independently where its purpose permits, with required dependencies declared and optional integrations failing gracefully. Standalone operation complements, but does not replace, the ability to change, upgrade, test or replace one feature without unintended changes to others.

Use stable, documented interfaces and versioned data/contracts at real boundaries. Keep feature internals private; avoid hidden shared mutable state, circular dependencies and cross-feature access to another module's storage or implementation details. Reuse appropriate common services without turning them into a tightly coupled central dependency. Choose the simplest sufficient boundaries: modularity does not require microservices, a plugin framework for every function, duplicate implementations or speculative abstractions.

Before changing a feature, identify its consumers and compatibility obligations. Test the module in isolation, its interface contracts, affected integrations and regression behavior of neighboring features. Include disabled/missing optional components, failure, cancellation, restart and upgrade scenarios where applicable. Make schema/configuration changes explicit and safely migratable, with preserved original data, tested recovery or rollback paths and clearly stated irreversible limits. Breaking changes need an intentional migration plan rather than silent ripple effects.

**Acceptance backlog:** record module ownership, public contracts, dependency direction, relevant contract/regression/integration tests and migration evidence for each scoped change. Demonstrate that unrelated user workflows and stored data remain intact; document justified coupling and remaining risks. This is a design and verification target, not an absolute guarantee that a change can never affect another feature, and not a claim that existing repositories already meet it.

## Project-specific goal index — not global pillars
These links retain project ownership and acceptance detail; they do not impose their features on unrelated repositories.

- **MO2R:** [tabs, inventories, editable cells/images/custom columns](https://github.com/Herbertofury/MO2R/blob/main/docs/flexible-workspaces-and-inventories.md), [native tag column](https://github.com/Herbertofury/MO2R/blob/main/docs/native-tag-column.md), [MissLafka utility parity](https://github.com/Herbertofury/MO2R/blob/main/docs/misslafka-native-parity.md).
- **External CAS:** [photo-to-Sim and CC-aware fitting, privacy, licenses and acceptance](https://github.com/Herbertofury/External-CAS/blob/main/docs/PHOTO_TO_SIM_GOAL.md).
- **Modding domain:** [full Relationships schema and notification requirements](https://github.com/Herbertofury/Modding-Knowledge/blob/main/docs/shared-product-pillars-20261119.md).
- **Games:** [Athena game/research goals](PROJECT-GAME-GOALS.md), [ModHunter mode/endgame goals](https://github.com/Herbertofury/Modhunter/blob/main/docs/shared-product-pillars-20261119.md), [JetSetCraft Coliseum and mode continuity](https://github.com/Herbertofury/JetSetCraft/blob/main/docs/shared-product-pillars-20261119.md).
- **GameSync Next:** [retain existing UI and make upgraded UI selectable](https://github.com/Herbertofury/GameSync-Next/blob/main/docs/shared-product-pillars-20261119.md).
- **Design reference collection:** [source/rights register](https://github.com/Herbertofury/memories/blob/main/docs/Aesthetics.md).

## Adoption register and maintenance
| Area | Verified storage / next owner | Status |
|---|---|---|
| Athena | This register, product vision and integration evidence | Eight universal principles; separate project-goal navigation, no universal runtime audit claimed |
| Shared mod database | Modding-Knowledge owns typed relationship/follow/release contracts | Consumer integration and full provider coverage require separate evidence |
| MO2R | Linked workspaces/native-parity docs and existing issues #1/#2/#5/#8/#11/#12 | Detailed goals saved; Windows/native implementation acceptance remains open |
| External CAS | Linked photo goal and existing acceptance checklist | Detailed goals saved, not implemented photo reconstruction |
| Design sources | Linked memories Aesthetics register | Inspiration/rights and project-identity requirements recorded |
| Modding-Knowledge local adoption | [Scoped pillar backlog](https://github.com/Herbertofury/Modding-Knowledge/blob/main/docs/shared-product-pillars-20261119.md) | Saved and exact-content verified 2026-11-19; implementation/acceptance remains separate |
| GameSync-Next local adoption | [Scoped pillar backlog](https://github.com/Herbertofury/GameSync-Next/blob/main/docs/shared-product-pillars-20261119.md) | Saved and exact-content verified 2026-11-19; implementation/acceptance remains separate |
| Modhunter local adoption | [Scoped pillar backlog](https://github.com/Herbertofury/Modhunter/blob/main/docs/shared-product-pillars-20261119.md) | Saved and exact-content verified 2026-11-19; implementation/acceptance remains separate |
| Enderloom local adoption | [Scoped pillar backlog](https://github.com/Herbertofury/Enderloom/blob/main/docs/shared-product-pillars-20261119.md) | Saved and exact-content verified 2026-11-19; implementation/acceptance remains separate |
| Noxviola local adoption | [Scoped pillar backlog](https://github.com/Herbertofury/Noxviola/blob/main/docs/shared-product-pillars-20261119.md) | Saved and exact-content verified 2026-11-19; implementation/acceptance remains separate |
| JetSetCraft local adoption | [Scoped pillar backlog](https://github.com/Herbertofury/JetSetCraft/blob/main/docs/shared-product-pillars-20261119.md) | Saved and exact-content verified 2026-11-19; implementation/acceptance remains separate |
| External-CAS local adoption | [Scoped pillar backlog](https://github.com/Herbertofury/External-CAS/blob/main/docs/shared-product-pillars-20261119.md) | Saved and exact-content verified 2026-11-19; implementation/acceptance remains separate |
| Sims4Foundry local adoption | [Scoped pillar backlog](https://github.com/Herbertofury/Sims4Foundry/blob/main/docs/shared-product-pillars-20261119.md) | Saved and exact-content verified 2026-11-19; implementation/acceptance remains separate |
| TD1-Occult-Hybrid-Apex local adoption | [Scoped pillar backlog](https://github.com/Herbertofury/TD1-Occult-Hybrid-Apex/blob/main/docs/shared-product-pillars-20261119.md) | Saved and exact-content verified 2026-11-19; implementation/acceptance remains separate |

- [ ] Maintain a per-pillar/per-consumer matrix: owner, authoritative revision, planned/partial/tested/shipped status, exact test evidence and unresolved limits.
- [ ] Link this register from relevant local backlogs; preserve more specific/latest user directions rather than replacing them with generic text.
- [ ] On each scoped change, recheck source links and append exact implementation/acceptance evidence. Never mark an entire pillar complete from documentation or one passing fixture.
- [ ] Reconcile new corrections here and in the affected repository. Review existing active work first; avoid duplicate workers, truth stores or conflicting edits.
- [ ] Audit actual portable paths, timer owners, domain-appropriate data views, notification delivery where applicable and saved preferences in deployed artifacts. Source/private-candidate tests are not installed-owner-machine acceptance.

This register is an updateable engineering requirement, not an autonomous maintenance service or authorization for publication of private artifacts, source deletion, new schedules or live migration.
