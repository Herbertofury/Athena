# Roguelite Engine

**Status:** source intake and cross-host comparison. **License of copied GameSync source:** GPL-3.0-or-later.

The goal is one configurable run engine for several game shapes, not a clone of Vampire Survivors:

- survivor / bullet-heaven: movement, auto-attacks, weapons, enemy waves, XP drops and level-up drafts;
- arena / circuit: seeded room graph, route choices, timed encounters, optional contracts, bosses and extraction;
- action / platformer: authored encounter graphs, traversal unlocks, checkpoints and boss phases;
- card roguelite: deck mutations, card rewards, relics, map events and card-battle encounters.

The GameSync five-minute Survivors source file is now preserved in `upstream/gamesync/` with an exact source blob pin. The shared canvas runtime is maintained once in [Shared Browser Game Runtime](../shared-game-runtime/README.md).

## Source candidates

- GameSync `game-survivors.js` is a playable five-minute survivor-style loop; it currently uses Math.random and a fixed duration. Its canvas runtime is shared with other mascot games.
- JetSetCraft `RushRun` / `RushCircuit` provide strong server-owned seeded run, legal phase, upgrade draft, reroll/banish, evolution and reward-receipt patterns. These are Minecraft/Forge host code and remain a challenger, not a drop-in package.
- Modhunter `siege.js` is a separate browser survivor-style challenger. Its game-only rewards must remain isolated from real MO2 maintenance currency.

## Athena target core

Deterministic seeded RNG streams, fixed-step simulation, configurable run profile, spawn/encounter director, typed upgrade/effect registry, synergy/evolution graph, boss phases, map/route graph, checkpoints, idempotent reward ledger, versioned run snapshot, replay and meta-progression adapters. Each game chooses its own combat, camera, pacing, content, economy and presentation.

## Promotion gate

Same seed + ruleset + content lock + action stream must reproduce the same eligible result. Test early/mid/late runs, cancellation, pause/resume, reload, defeat, reward duplication, save migration and complete native/packaged gameplay. No source candidate is selected as universal winner yet.

## Portable fixed-step Mascot Survivors prototype

Build from the exact retained GameSync source with Node.js 24:

```sh
node engines/roguelite/build-fixed-step.mjs /path/to/new-survivors-folder
cd /path/to/new-survivors-folder
node play.mjs
node play.mjs --demo 123 300
```

The source-pinned prototype runs the original movement, dash, enemy waves,
auto-attacks, XP gems, upgrade choices and win/lose rules without a browser.
The terminal accepts discrete moves and explicitly pauses until an offered
upgrade is selected. Use seed/duration arguments to replay a chosen scenario.
There is no idle animation loop, storage, account, download or install step
after Node is available. The terminal demo defaults to 90 seconds; the engine
defaults to the original five minutes and supports 5–600 whole seconds.

The source-derived headless loop uses fixed 60 Hz simulation ticks, shares
the versioned deterministic entropy used by the card prototype, and uses
explicit Fisher–Yates for draft ordering. It preserves the upgrade effects
and archetype rules, not legacy per-frame timing or unseeded random samples.
Rendering, audio, owner data, endgame progression, rewards, snapshots, and
consumer integration are not part of this prototype. The old GameSync source
and other consumer projects remain unchanged.
