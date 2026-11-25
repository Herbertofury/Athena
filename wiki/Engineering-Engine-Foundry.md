# Athena Engine Foundry

Athena is the canonical host for reusable card-game, roguelite and mascot open-world engines. It owns source intake, package contracts, versioning, tests, benchmarks, documentation and consumer compatibility.

- [Engine Foundry architecture](https://github.com/Herbertofury/Athena/blob/main/docs/ENGINE-FOUNDRY.md)
- [Machine-readable engine catalog](https://github.com/Herbertofury/Athena/blob/main/engines/catalog.json)
- [M5 implementation issue #365](https://github.com/Herbertofury/Athena/issues/365)
- [Game Systems Exchange](Engineering-Game-Systems-Exchange)

## The three flagship engines

| Engine | Existing source | Current status |
|---|---|---|
| Card Game | GameSync's 23-module card engine; GameSync Next has 19 identical files and four UI divergences | Exact source snapshot hosted in Athena; deterministic core extraction and host acceptance pending |
| Roguelite | GameSync Mascot Survivors, JetSetCraft's seeded run/circuit and Modhunter Siege | GameSync loop hosted as source; cross-host run core and deterministic replay pending |
| Mascot Open World | GameSync Midnight Mascot Syndicate world simulation, Three.js WebGPU renderer and Dev Room | 16 exact source files hosted; hybrid 2D-world/3D-renderer foundation, not yet full volumetric 3D |

## Source intake and consumer policy

Athena currently hosts 41 exact GPL-3.0-or-later GameSync source files across four package manifests. The immutable snapshots are verified by Git blob SHA and are not production APIs. New refactored code belongs in Athena package source folders. Third-party Three.js MIT source is referenced, not copied; mascot packs and other assets remain separately licensed.

Consumers pin exact local package versions and keep host-specific UI, assets, saves and adapters. No app needs a live Athena connection. Do not delete or silently fork existing implementations before two compatible consumers pass complete acceptance and rollback.

[Card Game package](https://github.com/Herbertofury/Athena/tree/main/engines/card-game) · [Roguelite package](https://github.com/Herbertofury/Athena/tree/main/engines/roguelite) · [Mascot Open World package](https://github.com/Herbertofury/Athena/tree/main/engines/mascot-open-world) · [Shared Browser Game Runtime](https://github.com/Herbertofury/Athena/tree/main/engines/shared-game-runtime)
