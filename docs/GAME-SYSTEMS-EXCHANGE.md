# Game Systems Exchange

**Purpose:** make every worthwhile card-game and roguelike implementation improve the rest of the project ecosystem through Athena, without turning every app into the same game or forcing a universal engine.

**Coordination issue:** [Athena #364](https://github.com/Herbertofury/Athena/issues/364). **Canonical capability source:** [shared-capabilities.json](../guidance/registry/shared-capabilities.json), using stable gameplay capability IDs. **Portfolio route:** [M5 Game Systems Exchange](PORTFOLIO-ALIGNMENT.md).

## 1. What already exists

This is a source inventory, not a claim that every feature is shipped or fully runtime-qualified.

| Project | Existing system worth learning from | Important boundary |
|---|---|---|
| [JetSetCraft](https://github.com/Herbertofury/JetSetCraft) | Rival Rush has seeded server-owned run state, a six-room route, upgrade drafts, rerolls/banishes, evolution recipes, bounded data-pack arena profiles, optional room contracts and immutable reward receipts. | Rival Rush is an arena roguelite. Adventure Mode is a separate approved platformer/Metroidvania/roguelike, but its run graph, stage builder, entry/return and boss gameplay remain unfinished. Do not conflate them. |
| [Modhunter](https://github.com/Herbertofury/Modhunter) | Siege has five hero classes, a survivor-style upgrade pool, bosses and authored regional contracts; Atlas Campaign and Shiverfell have distinct mission/world progression. Chronicle supplies profile-scoped events, idempotent purchases, save revisions and atomic persistence. | Game-only rewards must never mint or impersonate Forge Sigils earned by verified MO2 updates. The practical mod manager must remain usable without the game modes. |
| [CrownFold](https://github.com/Herbertofury/CrownFold) | Technology/research-card catalog has limited equip slots and explicit synergies; the war simulation documents deterministic same-seed/same-action outcomes, campaigns, doctrines and expeditions. | These are RTS research cards and loadouts, not a deckbuilder with draw/hand/discard, turns and card resolution. Keep Fold/Echo and strategic command identity. |
| [GameSync](https://github.com/Herbertofury/Gamesync) | A substantial 23-module card-game platform plus Mascot Survivors, Midnight Mascot Syndicate's open-world game, a Three.js WebGPU renderer and the original Dev Room toolkit. | The card game is a real engine candidate, not merely UI cards. It remains browser/host-integrated and its rules engine uses Math.random; the open-world simulation is a 2D spatial model rendered in 3D, not full volumetric 3D physics. |
| [Games](https://github.com/Herbertofury/Games) | Roguelites research page contains 198 unique entries, plus individual release, official-source and media records. It includes card/roguelike hybrids for discovery. | This is a game-discovery library, not an engine or proof of hands-on testing. Keep release state, source freshness and editorial judgments distinct. |
| [Athena](https://github.com/Herbertofury/Athena) | Card-density and card-receiver experiments study generated-data rendering, complete records and integrity validation. | These are UI/data-card experiments, not a game-card rules engine. Reuse measurement lessons, not their closed schemas as arbitrary game payload validators. |

**Card-game gap correction (2026-11-24):** GameSync already has a substantial deck/hand/discard/turn-resolution engine and full collection/deckbuilding/progression surfaces. GameSync Next carries a mostly identical copy (19/23 files byte-identical; four presentation files diverged). The gap is not invention from scratch: it is extraction into Athena's deterministic, storage-agnostic, versioned engine package, followed by two real consumer acceptances.

## 2. Athena Engine Foundry

Athena is now the canonical host for the three flagship engine families and their shared runtime. See [Engine Foundry architecture](ENGINE-FOUNDRY.md), [engine catalog](../engines/catalog.json), and [source intake manifests](../engines/README.md). Source snapshots are immutable GPL-licensed provenance; new refactored code belongs in Athena package `src/` folders. GameSync and GameSync Next remain protected consumers until migration is accepted. No consumer needs a live Athena connection.

## 3. Capabilities to share

| Capability | Reusable contract | Best initial sources |
|---|---|---|
| Seeded run state | Stable run ID, seed, RNG algorithm/version, ruleset/content lock, phase transitions, snapshots and deterministic replay | JetSetCraft RushRun/RushCircuit; CrownFold deterministic war simulation; Modhunter Chronicle |
| Encounter content | Stable room/node/boss/objective IDs, prerequisites, legal edges/exits, content versions, constraints and validation | JetSetCraft RushArenaCatalog/Contract; Modhunter Siege regional contracts; CrownFold campaigns/expeditions |
| Builds and synergies | Typed effects, trigger order, stack/replace rules, caps, prerequisites, draft offers and explicit synergy graph | JetSetCraft RushBuildPaths; Modhunter Siege upgrade pool; CrownFold LOST_TECH/WEAVE_SYNERGIES |
| Card-game rules | Card definitions, instances, deck zones, phases, resource costs, targeting, effect queue, action log and deterministic draw/resolution | Future real card-game host; CrownFold and existing drafts provide metadata/combination precedents only |
| Reward ledger | Stable claim key, source, run/profile identity, authoritative event, receipt, idempotency and separation of currencies | Modhunter Chronicle; JetSetCraft CrewRewardReceipt/History |
| Save/progression | Versioned snapshot, migration, permanent vs run-only progression, revision checks, recovery and rollback | Modhunter Chronicle; CrownFold migrateLineage; JetSetCraft versioned NBT receipts |
| Card presentation | Card art, readable cost/target/status, accessible motion, responsive layout and complete-data rendering | Host-specific UI; Athena's card labs are only supporting performance/integrity research |
| Card + roguelike bridge | Run-local deck mutation, card reward drafts, relics, map events, enemy intents, boss rewards and persistent unlock adapters | Future card-game host composed with the run contract above |
| Research radar | Release status, official evidence, mechanic novelty, technical implementation, license and adopt/adapt/skip recommendation | Games library plus daily Roguelike & Card Game Radar |

The existing shared capability registry records exact source commits, evidence level, limitations and next actions for every candidate. No universal implementation is selected yet.

## 4. Contracts and data boundaries

The versioned JSON Schemas in [guidance/schemas](../guidance/schemas/) define four portable envelopes:

- **Game-system package manifest:** owner repo/commit, package and contract version, capabilities, host/runtime requirements, dependencies, permissions, license/provenance, migrations, test evidence and consuming hosts.
- **Card definition:** stable card ID/version, kind, rarity, resource cost, target, tags, typed effect IDs/parameters and art provenance. Game content contains declarative effect references, never arbitrary executable code.
- **Card-game state:** deck, draw, hand, discard, exhaust, removed and resolving zones; card-instance IDs; turn/phase; resources; RNG and action-log revision.
- **Roguelike run snapshot:** mode/run IDs, seed/RNG version, ruleset/content lock, phase, map graph, run resources/upgrades, checkpoint, reward-claim keys, outcome and save revision.

JSON Schema cannot by itself prove gameplay invariants. Host tests must additionally enforce:

- Each card instance belongs to exactly one legal zone; draws, plays, discards, exhausts and transformations conserve or explicitly create/remove instances.
- Every effect ID exists in the host's allowlisted effect registry; target and resource requirements are valid before an action resolves.
- Identical seed + ruleset + content lock + action stream reproduce the same eligible simulation outcome. Use named/partitioned random streams where possible so a cosmetic or unrelated draw does not reshuffle the whole run.
- Encounter graphs have a valid route to completion/exit for every supported prerequisite state; optional branches cannot make mandatory progress impossible.
- Reward claims are idempotent across reload, reconnect, replay and concurrent actions. Permanent unlocks and run-only items are separate.
- Save migrations preserve known and unknown user data, reject stale revisions, and recover from interrupted writes. Rollback is claimed only when tested.
- Content and asset licenses, attribution, runtime requirements and data ownership travel with the package manifest.

## 5. What should be shared — and what must remain local

**Share when proven:** stable IDs, schemas, typed effect vocabulary, deterministic test fixtures, seed/replay contracts, reward receipt semantics, encounter validation, save migration tests, card metadata, synergy graph representation and versioned compatibility evidence.

**Keep host-specific unless a real equivalence test proves otherwise:** physics/movement, combat damage, tick timing, entity/network authority, rendering, animation, input, camera, art/audio, difficulty curves, currencies, narrative, world/save ownership, engine integration and balance values.

A Java Forge run manager, a Python desktop-game save ledger, a JavaScript browser RTS and a future card-game engine are not one drop-in runtime. Across different languages, share contracts and fixtures first. Extract a library only when its license, dependency, runtime, portability and behavior match and at least two compatible real hosts accept it.

## 6. Required agent workflow

1. **At task start:** read the owning repository's instructions/backlog; consult this guide and the gameplay capability registry; inspect current source, tests and active work in other game repositories. Do not build a duplicate because a similarly named file or feature exists.
2. **During implementation:** preserve the local game's identity and accepted baseline. Use stable capability IDs and content IDs. Keep rules separate from UI, game-only rewards separate from external verified-maintenance rewards, and run-local effects separate from permanent progression.
3. **At material closeout:** update the owning project's canonical issue/wiki with exact source revision, commands, fixtures, test result, runtime status, performance comparison, limitations and next action. Update Athena's corresponding capability candidate and link the owner issue and consumers.
4. **Promote carefully:** a candidate is not a winner. A canonical reusable implementation requires complete equivalent behavior, tests and independent acceptance in two compatible real hosts. Preserve old verified hosts until their own migration passes. Do not create an online Athena dependency at game startup.
5. **Share improvements back:** when a project adds a genuinely better card, relic, perk, upgrade, encounter, map generator, boss phase, run lifecycle, reward ledger, save migration or synergy, contribute its reusable behavior, fixtures and evidence to Athena. Other agents then compare and adopt compatible parts in their own game.
6. **Research releases:** use the [Games roguelite catalog](https://github.com/Herbertofury/Games/blob/main/wiki/Roguelites.md) and daily [Roguelike & Card Game Radar](https://github.com/Herbertofury/Athena/issues/364) coordination. Verify official release, actual mechanics, license, engine and performance before recommending an addition. Notifications are reserved for exceptional new releases or major updates, not routine patches.

## 7. First implementation queue

- **GameSync / GameSync Next:** preserve both accepted applications and the four divergent presentation files; migrate card rules and Mascot Games through Athena's pinned packages, then remove local engine duplication only after independent acceptance.
- **JetSetCraft:** preserve the already tested Rival Rush run/build/arena system; keep Adventure Mode separate and finish its own deterministic region graph, traversal prerequisites, checkpoints, run-local upgrades and bosses. Reuse only validated shared schemas/fixtures.
- **Modhunter:** compare Siege's hero/upgrade/evolution system with JetSetCraft's build paths; compare Chronicle's idempotent receipts/revision saves with JetSetCraft's receipt semantics. Keep Siege, Atlas Campaign and Shiverfell distinct and preserve the MO2 trust boundary.
- **CrownFold:** register the technology-card definitions and synergy graph as a loadout pattern; compare save migration and deterministic simulation contracts. Do not relabel the RTS as a roguelike or deckbuilder.
- **Games:** maintain researched roguelite and card-game releases, official source links and mechanic comparisons; send exceptional discoveries to Athena.
- **Athena:** maintain the capability registry, schemas, validation and cross-host evidence. The first shared deliverable is a verified contract/fixture in two compatible hosts, not a premature universal game engine.

**Release discipline:** this is a cross-cutting improvement lane, not a reason to hold unrelated releases. Existing project-specific release gates, mandatory optimizations and opt-in security rules remain unchanged.

## 7. Validate the exchange

From the repository root, run `python scripts/validate_game_systems.py` and `python -m unittest discover -s tests -p test_game_systems_registry.py -v`. The dedicated `Game Systems Exchange validation` workflow runs the same checks for relevant pushes and pull requests. These checks validate registry identity/evidence pins and schema JSON structure; they do not prove a game engine, live release, native runtime, benchmark or two-host adoption.

## Task-scoped developer preflight

Use [Game development skill routing](GAME-DEV-SKILLS-REVIEW.md) to pick up to three relevant local checks for replay, save compatibility, artwork import or handoff. It reads the selected Athena package's current catalog state and emits portable JSON; it installs nothing and does not claim a runtime test.
