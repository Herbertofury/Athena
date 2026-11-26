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

### Roaming Expedition

Select **Roaming Expedition · 20 min** in the standalone Arena. The Crystalback Geode Worm carries a moving mineable crystal node; the Lockbox Loot Goblin flees your approach. Your ordinary weapons damage these targets. Follow the canvas marker or the text direction, then step into the dropped cache to collect XP and crystal or gold. An escaped target or expired cache pays nothing. The resource balance is local to this run and included in its verified portable tape; it is not a shop, a base economy, or cross-game progression.

The opt-in encounter lane derives its choices from the run seed and simulated clock. It does not consume an extra random draw on existing Classic, Marathon, or Endless. Existing tapes are unchanged. Encounter and resource visuals are original Canvas drawings; the offline build does not fetch assets.

### Rift Expedition

**Rift Expedition · 20 min** includes the Roaming Expedition and discoverable portals. Follow a portal marker to choose whether to enter. Seeded side runs last 10, 20, or 30 minutes; you can decline or leave early. The parent run is suspended, including its clock, enemies, player, and random stream. A side run has its own clock, starting kit, health and random stream. Clearing it banks a one-time run-local reward; loss or early departure pays nothing. Your tape can resume a side run and preserves the suspended parent without changing older tape meanings. No store, account, native installation, or network access.

### Rendering and replay boundaries

The Canvas loop reads a copied frame projection, including every visible entity, projectile, damage number, cache and route marker. It does not clone the complete gameplay state or walk projectile hit sets merely to draw. Full snapshots, tape verification, save/resume, and rules remain unchanged. Tests compare the two views across all eight recipes, including portal choice and active side run, and verify that changing a frame record cannot alter gameplay.

### Camp Expedition

Select **Camp Expedition · 20 min** to give earned resources a use. Mine a geode, chase a goblin, or clear a rift, then follow the campfire marker. A health totem spends 12 crystal and grants 15 maximum health. A weapon rack spends 24 gold and increases weapon damage by 10%. Neither upgrade applies without your choice. The workshop, resources, upgrades, and already-paid choices are part of the selected run tape. This is an in-run progression prototype; it does not implement account, shared or permanent home progression.

### Frontier Expedition

**Frontier Expedition · 30 min** is a separate playable recipe, not a shortened
Marathon. Explore instead of following only time-triggered encounters. A fixed
seed places two distinct world regions in opposite directions. One route can
reach the quiet Survey Outcrop. Another enters Skirmish Basin while the Amber
Surveyors and Violet Marauders are already fighting. You can detour, or support
the Surveyors by staying in the basin until the outcome resolves. On success,
the cache is physically collected once and adds crystal to the same run's camp
wallet. Walking away can lose the fight and provides nothing. Rifts and camps
retain their previously tested local behavior, and the tape preserves the
existing phase, reward, and suspended worlds. No more than the two authored
regions are claimed here, and the older recipes retain their previous tape data.

### Ashglass Frontier

Choose **Ashglass Frontier · 60 min**. Fights, roaming resources, Rifts and Camp remain; a distant basalt entrance adds a route-dependent cavern, not another enemy wave. Follow three cairns in their displayed order, then walk onto the opened vault pedestal. A wrong alignment resets the sequence without consuming anything. Colored mirrors have text labels and the clue shows the active objective. The 34 gold is earned once, in this run's Camp wallet, and can pay for a weapon rack. The entrance appears only as you approach its seeded region. Optional discovery; no world timer gate, persistence outside the user-exported run tape, or new media assets.

### Floodplain Frontier

Choose **Floodplain Frontier · 90 min**. In addition to the Ashglass cavern and earlier discoveries, a far river route reveals a moving ferry. Walk to the gangway to launch, stay close so its hull survives both legs, and physically reach the far dock to recruit the ferryman. Losing the ferry grants nothing. A recruited companion offers two optional 36-HP remedies at Camp when hurt; each use spends one charge, not crystals or gold. Its route, status and remedy balance remain inside this run and its user-selected replay tape. No permanent unlock or background timer.

### Frontier Relay · Endless

The same Arena has no victory timer in **Frontier Relay · Endless**. Beyond the earlier regions, follow the compass to the first relay. Choose to recover a supply sled and carry it back for camp gold, or stand at two separate lookout beacons and report back for crystal. Completing either opens a farther station, chosen from the returned player's direction. The two activities repeat at different sites; they are not an infinite catalog of bespoke levels. You can decline, leave and return. Nothing advances while paused or in a side rift. Offline portable replay retains the current relay and running bank; a tape is capped at eight hours or the file/event limits and play can continue beyond that.

### Isolate visual randomness in new runtime callers

The lower-level survivor runner accepts an optional `visualRandom` callback in addition to its existing gameplay `random` callback. Use a genuinely independent stream for particle jitter and orbital hit flashes; never pass two wrappers around the same mutable RNG and call it partitioned. With an independent stream, extra particle draws do not change spawned enemies or upgrade offers in the qualified fixture. Omitting the option preserves the original single-stream order and v1 tape behavior. Do not switch an existing tape or saved host to a new stream silently. The explicit `ARENA_PARTITIONED_REPLAY_RULES` option records a distinct rules identifier on new tapes; opening a tape uses its recorded rules, not today's default. The Arena defaults to legacy. Choose **Isolated visual effects (preview)** under **Rules for next run** before starting or deliberately restarting. The active rules label and exports always follow the actual running or loaded tape, never the dropdown alone. A pre-change build is not expected to read new-rule tapes.
