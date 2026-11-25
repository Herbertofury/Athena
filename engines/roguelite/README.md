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

### Movement, dash, contact and drops

`tickPlayerMovement` and `tickEnemyContact` run the exact pinned movement
and enemy stages on engine-owned state. The host supplies validated player,
keyboard, enemy, gem, run and tick values. It chooses stage order, applies
weapons separately and respects terminal state. These primitives keep the
original order of checks, including contact before a defeated enemy's drop.
They return particle and audio cues without rendering or playing them.
Do not use these standalone primitives as a trusted network authority.

```sh
node engines/roguelite/tools/build-survivor-movement.mjs --check
node --test engines/roguelite/tests/*.test.mjs
node engines/roguelite/examples/demo-encounter-lane.mjs
```

### Legacy level-up choices

`createLegacyUpgradeDirector({random})` rolls three inert display choices
from the original templates, then applies only a currently offered choice
to the same player object. Roll after the separately extracted XP gate.
A newer draft invalidates the old one; one successful choice consumes that
draft. Hosts must supply validated, mutable player state and own save,
pause, and network authority. The extracted stat and weapon-addition logic
does not fire weapons, play sound, or automatically choose an upgrade.

This is the legacy mode: it retains the original JavaScript random-sort
comparator and is only compared against the same engine/runtime. It does
not promise unbiased selection or byte-identical cross-JavaScript-runtime
transcripts. A fair seeded mode should be an explicitly separate version.

### Playable legacy arena

The standalone `createLegacySurvivorRun({random})` wires the exact original
player, enemy waves, six weapons, projectile pierce / per-target hits, orbit,
damage numbers, XP and upgrade choices into one five-minute simulation. It
also runs the original shared **600-particle** lifecycle: effects consume the
same injected random stream as target selection and upgrades, in the original
order. The original game's update function and real particle system are
the independent comparison; test inputs include explicit choices, loss/win
boundaries, variable seeded waves and full combat, without copying the old
renderer. `step({dt,keys})` pauses on a pending choice; `choose(id)` accepts
only an offered choice; `snapshot()` is diagnostic display data, not a save or
stable authoritative entity ID. This does not write to any app or user profile.

```sh
node engines/roguelite/tools/build-survivor-combat.mjs --check
node --test engines/roguelite/tests/legacy-survivor-run.test.mjs
node engines/roguelite/tools/build-survivor-arena.mjs
```

Open `Athena-Survivor-Arena.html` in a modern browser directly from disk. This
original, minimal top-down preview loads no external files, fonts, images or
sound, makes no network calls and stores nothing. It supports keyboard,
pause/resume, seeded restart and selectable upgrades. The authored GameSync
renderer, mascot art, audio, persistence, meta-progression and integration
into native products are separate acceptance gates, not part of this build.

### Optional endurance formats

Classic remains the exact five-minute source rules. Experiment with separate
20-, 30-, 60-, or 120-minute Marathon formats, or choose Endless. Marathons
walk through five spawn-pressure stages; Endless crosses into repeating
surges and breathers after 20 minutes and has no automatic win timer.
Endless scales enemy health and damage progressively with a stated upper
bound; position, movement and rolls still use the shared combat engine.

Endurance formats use a stage-specific limit of 45–125 live enemies and
count suppressed spawns instead of indefinitely growing the active set.
This cap and timing curve are deliberate alternate rules, not performance
or latency claims. Classic has not adopted them. The browser shows the
active stage and upcoming selection; changing it starts a new run only
when requested. This preview has no autosave, cross-app profile storage,
or mod-manager integration.

### Save or resume an offline run

The browser can download and validate a versioned **run tape** before loading
it. A tape stores the seed, format, 60 Hz input spans and upgrade choices.
It does not contain executable state or auto-write a file. Consecutive
identical inputs are compressed as one span. Verification replays those
inputs into a fresh engine, checks the exact resulting state digest, and
shows measured progress on long tapes. Cancel or reject the import without
replacing the current run. After successful loading, continue from Pause
or finish the pending upgrade choice.

Tapes are bounded to eight simulated hours, 450,000 spans and 8 MiB. An
Endless run can continue beyond the portable limits but can no longer be
exported. Digests check consistency, not authorship or multiplayer
legality. Browser hashing uses Web Crypto; no network connection is needed.
