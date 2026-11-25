# Athena Engine Foundry

**Athena is the canonical host for reusable game-engine source, package contracts, versioning, tests, benchmarks, documentation and consumer compatibility.** It is not one mega-engine and does not force every project into the same game, renderer, balance, world or runtime. The Foundry owns reusable engine families; each app owns its game identity and host integration.

**Game Systems Exchange:** [shared capability registry](../guidance/registry/shared-capabilities.json) · [general coordination issue #364](https://github.com/Herbertofury/Athena/issues/364). **Engine Foundry execution:** [M5 issue #365](https://github.com/Herbertofury/Athena/issues/365) · [portfolio milestone M5](PORTFOLIO-ALIGNMENT.md#m5--athena-engine-foundry).

## 1. The three flagship engines

| Athena engine | Best current starting source | What it should become | Current maturity |
|---|---|---|---|
| **Card Game Engine** | GameSync's 23-module `app/shared/cardgame/` platform. GameSync Next has 19/23 byte-identical files; four presentation files diverged. | One excellent reusable collectible-card/deckbuilder/rules engine: typed card/effect registry, zones, turns, target validation, AI, drafting, deck building, collection, rewards, progression, content tooling and presentation adapters. | Existing substantial game, not yet isolated or qualified as a portable Athena package. |
| **Roguelite Engine** | GameSync Mascot Survivors + shared game core; JetSetCraft Rival Rush's deterministic server-owned run/circuit/build model; Modhunter Siege as another playable survivor-style challenger. | Configurable run engine supporting survivor/bullet-heaven, arena, action, platformer and card-roguelite variants: deterministic runs, spawn/encounter directors, weapons, upgrades, synergies/evolutions, boss phases, reward receipts, checkpoints, replay and meta-progression. | Multiple real game implementations exist; no cross-host winner/package selected yet. |
| **Mascot Open-World Engine** | GameSync's Midnight Mascot Syndicate: `game-openworld.js` + `game-openworld-3d.js`, Dev Room systems and mascot actor runtime. | Reusable free-roam world for mascots/characters: world/sector data, districts, interiors, NPCs, vehicles, traversal, missions, interactions, camera, combat, animation, save/streaming and replaceable renderers. | Significant browser-based hybrid prototype exists; it is not yet a full volumetric GTA-scale 3D simulation. |

Keep a separate **Mascot Actor Runtime** adapter for Shimeji/mascot pack parsing, animation and character identity. It supplies actors to the open-world engine; it is not the city, mission system or game loop. The GameSync Next modular TypeScript runtime is a challenger to the GameSync legacy `Mascot_Engine.js` monolith.

## 2. Why Athena should host them

- One canonical source per compatible engine, with versioned package manifests and exact source provenance.
- All agents look here before creating another card, run, reward, encounter, mascot, physics, world, camera, AI or save system.
- Improvements flow back to Athena; consumers adopt a pinned release or verified local snapshot. No untracked copy becomes an independent authority.
- The host includes example games, fixtures, docs, migration tools, performance baselines, compatibility matrix and release history.
- Engines are available locally/offline in each app. **No application needs a live connection to Athena at startup.**
- Different languages/runtimes can share contracts and deterministic fixtures first. Extract a binary/library only when a real compatible host can consume it without losing functionality.

## 3. Engine architecture

Each engine is split into five layers:

1. **Headless deterministic core:** rules, state transitions, content IDs, effect ordering, simulation, RNG streams and event log. No DOM, extension messaging, Minecraft globals, filesystem path or renderer dependency.
2. **Content and authoring:** declarative card/weapon/upgrade/relic/enemy/boss/mission/biome/vehicle/world definitions; schema validation; versioned assets and attribution. Never execute arbitrary downloaded content as code.
3. **Host adapters:** browser/extension, desktop, Minecraft/Forge, native game, input, mascot pack, persistence, networking and platform capabilities. Host-owned data stays host-owned.
4. **Presentation adapters:** canvas/DOM, Three.js/WebGPU, native GPU, UI, animation, audio, camera and accessibility. A renderer can be replaced without changing game rules.
5. **Tools and evidence:** deterministic replay, balance simulation, content lint, encounter graph validation, save migration, screenshots/native runtime, profiling and benchmark receipts.

A small shared kernel may provide versioned RNG, event/reward receipts, content IDs, migrations and telemetry contracts. Do not force all three engines to share physics, rendering, ticking, combat balance or one ECS. Reuse only where semantics actually match.

## 4. Source intake: what we found

### Card game

GameSync's current card-game source has 23 modules: `engine.js`, `state.js`, `cards.js`, `heroes.js`, `ai.js`, `deckbuilder.js`, `deck-select.js`, `collection.js`, `packs.js`, `progression.js`, `modes.js`, `adventure.js`, `screens.js`, `board.js`, `vfx.js`, `audio.js`, `cosmetics.js`, `shop.js`, `settings.js`, `developer-db.js`, `icons.js`, `index.js` and styles. The 46 KB rules engine describes a state machine and event output; the surrounding platform supplies AI, deckbuilder, packs, collection, game-library card generation, solo adventures and additional modes.

GameSync Next's matching card-game directory is **19 of 23 files byte-identical**. The divergent files are `board.js`, `cardgame.css`, `deck-select.js` and `screens.js` (presentation/host surface). Keep these host differences as adapters, not separate rules engines.

Important repair opportunities before calling the engine deterministic or reusable:
- The current `engine.js` contains 17 `Math.random` occurrences; inject versioned RNG and make every random effect replayable.
- `state.js` owns browser `localStorage`; separate the pure state/migration layer from storage adapters.
- Separate library-specific card derivation and GameSync's product content from generic card rules/effect IDs.
- Replace untyped/free-form effect execution with a validated allowlisted effect registry, explicit ordering, target constraints and versioned card definitions.
- Test zone/instance conservation, effect ordering, save migration, deterministic replay, target legality, AI choices and complete end-to-end matches.

### Roguelite

- GameSync `game-survivors.js` is a five-minute survivor-style game with auto-attacking weapons, enemy archetypes, XP drops and level-up drafts. It uses the shared canvas game core, but contains `Math.random` and a fixed run duration; extract configurable run rules and seeded streams.
- JetSetCraft `RushRun` / `RushCircuit` are strong patterns for server-owned seeded runs, legal choices, versioned phase transitions, upgrade drafts, rerolls/banishes, evolution recipes, bounded arena profiles and idempotent rewards. They are Minecraft-specific host code, not a drop-in cross-platform library.
- Modhunter `siege.js` is another actual survivor-style game candidate. Keep its game-only scoring/currency strictly separate from the verified MO2 maintenance reward ledger. Compare complete gameplay and state semantics, not just feature counts.

### Mascot open world

GameSync's `game-openworld.js` supplies the game simulation and `game-openworld-3d.js` supplies a Three.js WebGPU renderer. The world includes districts, buildings, interiors, NPCs, vehicles, weapons, pickups, missions, mascots and first-/third-person presentation. The Dev Room is explicitly a copy-friendly 2D reference toolkit, not an extracted package.

The current world model maps 2D x/y coordinates into 3D x/z rendering with vertical/jump/roof offsets. That is a meaningful hybrid foundation, not full 3D spatial physics. The GameSync Next open-world copies have diverged; its 3D renderer lacks the GameSync version's delta-time camera smoothing. Compare full source and actual experience before choosing a winner. The Three.js vendor file is a separate MIT-licensed dependency; the Shimeji mascot actor runtime is a separate GPL-licensed host integration. Do not copy mascot packs/art/audio without the required rights.

## 5. Package lifecycle and no-regression rules

`intake_snapshot → extracted_core → fixture_tested → native_runtime_tested → two_consumer_accepted → canonical_release`

- Upstream snapshots are immutable provenance, not where new work happens. Refactored source belongs in each Athena package's `src/`.
- Every package has a semantic version, API/contract version, license, exact upstream provenance, dependency/runtime matrix, capabilities, permissions, data ownership, migrations, changelog, tests, benchmarks, docs and consumer lock entries.
- A canonical engine requires complete feature parity for the declared scope and acceptance by at least two compatible real hosts. Source inspection or passing synthetic fixtures alone is not enough.
- Consumers pin an exact engine release/source digest and keep their own host adapters. Updates are staged, rollbackable and independently tested. No remote runtime dependency.
- Never delete GameSync/GameSync Next or other project copies until the replacement is accepted in each consumer. Preserve all UI differences, mascots, unique content, settings, saved games and historical source.
- New features from any project go through Athena: record reusable contract/fixture, merge into the engine if generic, and let other projects adopt through the compatibility matrix.

## 6. License and third-party boundaries

The GameSync source baseline is **GPL-3.0-or-later**. Its engine intake snapshots retain that license separately; this does not relicense the rest of Athena or any consumer. The Three.js WebGPU vendor source identifies **MIT** and must retain its attribution if redistributed. Mascot packs, images, sounds, models, fonts and external game assets are not included in the engine intake. Each consumer must review whether the package license and third-party assets are compatible with its distribution.

## 7. First implementation order

1. Preserve and pin GameSync's card engine source; extract a headless deterministic rules core and add fixture/replay tests.
2. Extract a shared roguelite run contract/core from GameSync Survivors and JetSetCraft's run invariants; compare Modhunter Siege before selecting mechanics.
3. Split Midnight Mascot Syndicate world simulation from the 3D renderer and mascot actor runtime; define a host-neutral world/content API.
4. Add small example hosts: card battler + card roguelite; survivor action roguelite + arena roguelite; mascot city exploration.
5. Benchmark, document and accept in two real compatible consumers before marking any engine canonical.

See [Engine Foundry package catalog](../engines/catalog.json), [Game Systems Exchange](GAME-SYSTEMS-EXCHANGE.md) and [portfolio M5](PORTFOLIO-ALIGNMENT.md#m5--athena-engine-foundry).

## 8. Current Athena source-intake status · 2026-11-24

Athena now stores **41 immutable source files**, each copied byte-for-byte from pinned GameSync commit `bce6c1bcb31c63d31c64185fef143a53d9c4d35f` and described by an exact per-file Git blob SHA:

- Card Game: 23 modules under `engines/card-game/upstream/gamesync/`.
- Mascot Open World: 16 files (world simulation, Three.js renderer and 14 Dev Room files) under `engines/mascot-open-world/upstream/gamesync/`.
- Roguelite: GameSync's survivor loop under `engines/roguelite/upstream/gamesync/`.
- Shared Browser Game Runtime: one shared canvas core under `engines/shared-game-runtime/upstream/gamesync/`.

The [engine catalog](../engines/catalog.json) and four [source manifests](../engines/README.md) record provenance and consumer drift. [`verify_engine_intake.py`](../scripts/verify_engine_intake.py) checks each local file's actual Git blob hash against its upstream pin. GameSync Next's card copy comparison confirms 19/23 identical modules and four presentation divergences. Its open-world renderer/simulation copies are divergent and remain comparison candidates.

**This is an actual Athena-hosted source intake, not yet an extracted reusable engine API.** All four package statuses remain `intake_snapshot`; their canonical `src/` implementations, replay/fixture suites, native runtime acceptance and two-consumer proofs are still open. The immutable snapshots are not to be edited or imported directly by consumers. Work the M5 queue in [Athena issue #365](https://github.com/Herbertofury/Athena/issues/365).
