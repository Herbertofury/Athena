# Athena Engine Foundry

Athena is the canonical host for reusable game engines across the owner's repositories.

- [Architecture and promotion rules](../docs/ENGINE-FOUNDRY.md)
- [Machine-readable engine catalog](catalog.json)
- [Game Systems Exchange and shared capabilities](../docs/GAME-SYSTEMS-EXCHANGE.md)
- [Cross-project milestone M5](../docs/PORTFOLIO-ALIGNMENT.md#m5--athena-engine-foundry)

## Engine families

| Package | Purpose | Current state |
|---|---|---|
| [Card Game](card-game/README.md) | Collectible card battler, deckbuilder, AI, collection and progression | GameSync's complete 23-module source baseline is being captured; refactor/qualification pending |
| [Roguelite](roguelite/README.md) | Survivor, arena, action, platformer and card-roguelite run systems | GameSync Survivors plus JetSetCraft and Modhunter challengers; extraction pending |
| [Mascot Open World](mascot-open-world/README.md) | Free-roam mascot city/world, missions, vehicles, interiors and replaceable 3D renderer | GameSync Midnight Mascot Syndicate baseline; host-neutral split pending |
| [Shared Browser Game Runtime](shared-game-runtime/README.md) | Reusable canvas/input/particles runtime for browser game adapters | GameSync baseline; lifecycle and deterministic-host work pending |

## Source-intake policy

The `upstream/` directories are immutable, exact-source snapshots with per-file Git blob SHA manifests. They are provenance and regression baselines, not production APIs. Do not edit them. New engine code belongs in each package's `src/`. The intake verifier checks that every snapshot still matches the recorded upstream blob.

The GameSync source baseline is GPL-3.0-or-later. Each package keeps that license separately; this does not change the license of the rest of Athena. Third-party libraries and game assets retain their own licenses and are not silently copied.

Consumers pin a package release/source digest locally. They do not load code from Athena over the network at runtime. Preserve current GameSync/GameSync Next copies until each host passes its own complete acceptance and rollback.
