# Athena Engine Foundry

Athena is the canonical host for reusable game engines across the owner's repositories. The initial intake contains 41 exact GameSync source files, pinned in four manifests and protected by `scripts/verify_engine_intake.py`. Track extraction and consumer acceptance in [Athena issue #365](https://github.com/Herbertofury/Athena/issues/365).

- [Architecture and promotion rules](../docs/ENGINE-FOUNDRY.md)
- [Implementation issue #365](https://github.com/Herbertofury/Athena/issues/365)
- [Machine-readable engine catalog](catalog.json)
- [Game Systems Exchange and shared capabilities](../docs/GAME-SYSTEMS-EXCHANGE.md)
- [Cross-project milestone M5](../docs/PORTFOLIO-ALIGNMENT.md#m5--athena-engine-foundry)

## Engine families

| Package | Purpose | Current state |
|---|---|---|
| [Card Game](card-game/README.md) | Collectible card battler, deckbuilder, AI, collection and progression | 23-module GameSync source snapshot captured; deterministic extraction/qualification pending |
| [Roguelite](roguelite/README.md) | Survivor, arena, action, platformer and card-roguelite run systems | GameSync Survivors snapshot captured; JetSetCraft and Modhunter challengers; extraction pending |
| [Mascot Open World](mascot-open-world/README.md) | Free-roam mascot city/world, missions, vehicles, interiors and replaceable 3D renderer | 16-file GameSync Midnight Mascot Syndicate/Dev Room snapshot captured; host-neutral split pending |
| [Shared Browser Game Runtime](shared-game-runtime/README.md) | Reusable canvas/input/particles runtime for browser game adapters | GameSync baseline; lifecycle and deterministic-host work pending |

### Design intake (not a shipped engine)

- [Tower Defense + RTS](TOWER-DEFENSE-RTS-RESEARCH.md): a standalone defense-and-command core with optional roguelite layers, using *Dawn of Defense* as a design reference. Track the work under the existing [M5 Engine Foundry milestone](https://github.com/Herbertofury/Athena/issues/365).

- [Outpost playtest](tower-defense-rts/README.md): executable Rust terminal prototype for the strategy design. It is not a canonical package.

## Source-intake policy

The `upstream/` directories are immutable, exact-source snapshots with per-file Git blob SHA manifests. They are provenance and regression baselines, not production APIs. Do not edit them. New engine code belongs in each package's `src/`. The intake verifier checks that every snapshot still matches the recorded upstream blob.

The GameSync source baseline is GPL-3.0-or-later. Each package keeps that license separately; this does not change the license of the rest of Athena. Third-party libraries and game assets retain their own licenses and are not silently copied.

Consumers pin a package release/source digest locally. They do not load code from Athena over the network at runtime. Preserve current GameSync/GameSync Next copies until each host passes its own complete acceptance and rollback.
