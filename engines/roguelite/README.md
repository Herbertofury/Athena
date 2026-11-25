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

## Executable intake slice: GameSync survivor spawn director

The native game is not replaced. This optional standalone ESM module extracts
the original enemy templates and exact spawn/tick formulas from the pinned
GameSync source, with the original random helper math. It accepts explicit
host ticks, player positions and an injected random stream. It runs without
DOM, storage, renderer, game assets or network calls.

`createSpawnDirector({duration, random, checkpoint?})` returns a `step` method
and a versioned `checkpoint()` receipt. The default duration is the original
300 seconds. Original one-batch hitch behavior is unchanged; death, movement,
pauses, weapon effects, rewards and upgrades stay with the host. A host must
save its own random cursor and replay inputs when restoring. This is a first
rules-extraction proof, not a canonical engine or a two-host acceptance.

```sh
node engines/roguelite/tools/build-survivor-spawns.mjs --check
node --test engines/roguelite/tests/spawn-director.test.mjs
node engines/roguelite/examples/demo-spawn-lane.mjs 42 300
```

### Experience pickup and level gates

The separately generated pickup module exposes `spawnExperienceGem` and
`tickPickupFormulas`. Pass only engine-owned, validated gems and player state:
these synchronous primitives mutate the arrays and counters in place, just as
the original game does. Expiry is applied before pickup; magnet movement
crossing into the pickup radius is collected on a later tick, because the
original checks the pre-movement distance. Multiple pickups can advance
multiple gates in a single tick. The returned events preserve their original
order. No upgrade choices, random draw, audio, combat rewards, or durable
player progression are executed by the module.
