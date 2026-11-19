# Cross-project product pillars and adoption register

Updated 2026-11-19 from owner requirements. **Accepted requirements and implementation backlog, not universal shipped support.** Athena retains the shared direction; each consuming repository owns its implementation, tests and delivery evidence. Preserve existing work, current private candidates and project-specific acceptance holds.

## P1 — Portable owned data
Every application must support a portable folder containing its app-owned data, settings, indexes, caches, reports, histories and recovery receipts. No silent dependency on Program Files or AppData for portable operation. Explicit external game/tool/source paths remain references, not files to relocate automatically. Secure secrets, permissions, filesystem capabilities and OS integrations need explicit design; portability is not itself a security guarantee. Test whole-folder relocation, restart, read-only/locked paths, disk-full, backup/restore and upgrades. Document any unavoidable external state honestly.

## P2 — Responsive event-driven work
Prefer bounded one-off parallel work at launch, explicit refresh, update-view entry or relevant entity interaction. Avoid repeated whole-library polling just because the app is open. One coordinator coalesces triggers; no network requests inside sort comparators or per-row repaint. Reuse current evidence, invalidate changed subsets, bound CPU/IO/network/memory, cancel stale work, preserve last-good data and expose freshness/partial failures.
Necessary playback, safety, synchronization, explicitly enabled watches and missed-event reconciliation are not blanket forbidden. Audit their owners before optimizing, use events and bounded fallback where justified, and do not silently disable existing notifications or alter schedules. Measure idle wakeups, input/scroll/frame latency and equivalent result completeness, not only microbenchmarks.

## P3 — Unified Relationships and separate columns
Every database mod needs a unified **Relationships** field and independently selectable categories: requirements, optional dependencies, conflicts/incompatible, works-with/compatible, embedded/bundled, patch-for, alternatives and other connections. Keep exact game/edition/runtime/file/version identities, conditions, evidence and freshness. Unknown is different from reviewed none.
Read structured metadata and permitted author descriptions/posts; retain source/section/statement provenance and negation. Text-derived or ambiguous candidates require review. Overlapping files, priority adjacency and matching names do not establish dependency or compatibility. Sorting/filtering must never mutate activation or load order. Shared databases own one reusable contract, consumed by each app.

## P4 — Useful configurable notifications
Support mod updates, followed creators' new projects, evidenced removals/platform moves and relevant diagnostics/QoL events. Show why, source, scope and last check; distinguish unavailable/login-required from verified removal or ban. Deduplicate, allow pause/unfollow/quiet settings and meaningful per-kind routing. Initial discovery must not flood the user. Preserve unseen/read/delivery state and failures across restart. Notification does not authorize installation, changing source authority or disclosing private logs. This document activates no monitor, subscription or external delivery.

## P5 — Reusable creative assets without an ambition ceiling
Creatively reuse compatible existing components, permitted assets, user-authorized saved media and data for varied gameplay and expressive interfaces with a modest footprint. Retain rights, attribution, provenance, privacy and project identity. A saved image is not permission to redistribute it. Efficiency must not cut requested features or cap quality, ambition or depth; prove resulting behavior and resource cost.

## P6 — Deep games, connected rewards and research
Maintain source-backed research on released/upcoming Survivors-like roguelites, RTS (including Generals–Zero Hour as a reference) and top-down adventures, separating promotional claims from playtested evidence. Athena's learning/game ambition includes meaningful progression, recruitment/bosses/labs and extensive endgame, not superficial XP counters.
Preserve meaningful cross-mode rewards and deep endgame in every applicable mode without flattening their mechanics. Treat Path of Exile-scale depth and uncapped paragon-like progression as ambitions requiring balance, persistence and numeric robustness, not literal parity.
For the relevant ModHunter modes, retain 10/20/30/60/120-minute and endless choices, moving mineable geode worms, loot goblins and 10/20/30-minute portal side runs returning to the original run. Verify pause/restart/death/abandon/reward deduplication and original-run continuity. Do not impose those timers on every RTS/adventure.
JetSetCraft Coliseum must permit joining at any time for fun, escalating challenge through sequential rounds of multiple gangs. Preserve its own art/music identity and licensing.

## P7 — Project identity, black default and optional upgrades
Upgrade quality, accessibility, clarity and responsive feedback while preserving each project's established colors/design identity. Black is the default base, not permission to erase colored separators or theme-specific character. GameSync Next's current good UI remains available; a redesigned UI must be a selectable setting, not a forced replacement. Study sources without copying reserved assets, templates or paid model weights.
Verified existing source register: [design inspirations and constraints](https://github.com/Herbertofury/memories/blob/main/docs/Aesthetics.md), including UberDesigner/Haelith and libraries.dev.

## P8 — MO2R workspaces and editable knowledge
Native independent tab views/splits, saved layouts and separate mods/game-plugins/manager-extensions/utilities inventories, with explicit relationships and shared transaction owners. Tags, custom columns and cell overrides/images must preserve source provenance, history, restore/reset and source-versus-user values; refresh must not erase edits. Keep query/sort semantics explicit and image rights/portable storage safe.
Verified repository goals: [flexible workspaces, inventories and cell overrides](https://github.com/Herbertofury/MO2R/blob/main/docs/flexible-workspaces-and-inventories.md), [native tag column](https://github.com/Herbertofury/MO2R/blob/main/docs/native-tag-column.md), [MissLafka native utility parity](https://github.com/Herbertofury/MO2R/blob/main/docs/misslafka-native-parity.md). These are goals, not completed native UI. Existing Rust view foundations and compatibility code must be reused rather than assumed absent from sparse main.

## P9 — External CAS photo-to-Sim with CC-aware fitting
Editable face/full-body photo reference fitting to supported Sims controls, not a promise that generic AI meshes become playable Sims or that hidden anatomy is measured. Consent/privacy, local-first selection and explicit optional cloud use; manual correction and undo.
Use suitable installed presets/sliders, skins, hair/outfits and accessories; discover missing CC through shared evidence and ask before acquisition/install. Magic Bot and ThisIsThem are creator leads, not invented verified file compatibility. Retain exact requirements, licenses, availability, source identity and game validation.
Verified repository goal: [photo-to-Sim and CC-aware milestones](https://github.com/Herbertofury/External-CAS/blob/main/docs/PHOTO_TO_SIM_GOAL.md). Model research, fitting, package/Tray export and real-game acceptance remain separate gates.

## Adoption register and maintenance
| Area | Verified storage / next owner | Status |
|---|---|---|
| Athena | This register, product vision and integration evidence | All nine pillars recorded centrally; no universal runtime audit claimed |
| Shared mod database | Modding-Knowledge owns typed relationship/follow/release contracts | Consumer integration and full provider coverage require separate evidence |
| MO2R | Linked workspaces/native-parity docs and existing issues #1/#2/#5/#8/#11/#12 | Detailed goals saved; Windows/native implementation acceptance remains open |
| External CAS | Linked photo goal and existing acceptance checklist | Detailed goals saved, not implemented photo reconstruction |
| Design sources | Linked memories Aesthetics register | Inspiration/rights and project-identity requirements recorded |
| Other consumers | Apply relevant pillars to ModHunter, GameSync/Next, Enderloom, Noxviola, Sims tools and JetSetCraft | Audit each current authoritative branch, not just archived copies |

- [ ] Maintain a per-pillar/per-consumer matrix: owner, authoritative revision, planned/partial/tested/shipped status, exact test evidence and unresolved limits.
- [ ] Link this register from relevant local backlogs; preserve more specific/latest user directions rather than replacing them with generic text.
- [ ] On each scoped change, recheck source links and append exact implementation/acceptance evidence. Never mark an entire pillar complete from documentation or one passing fixture.
- [ ] Reconcile new corrections here and in the affected repository. Review existing active work first; avoid duplicate workers, truth stores or conflicting edits.
- [ ] Audit actual portable paths, timer owners, Relationships UI, notification delivery and saved preferences in deployed artifacts. Source/private-candidate tests are not installed-owner-machine acceptance.

This register is an updateable engineering requirement, not an autonomous maintenance service or authorization for publication of private artifacts, source deletion, new schedules or live migration.
