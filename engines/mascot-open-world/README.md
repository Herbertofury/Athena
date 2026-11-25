# Mascot Open-World Engine

**Status:** source intake; substantial hybrid prototype, not a full volumetric 3D engine. **License of copied GameSync source:** GPL-3.0-or-later.

The source is GameSync's **Midnight Mascot Syndicate**: a world simulation in `game-openworld.js`, a Three.js WebGPU renderer in `game-openworld-3d.js`, plus a copy-friendly Dev Room toolkit for 2D physics/movement/camera/combat/AI/vehicles/weather/dialogue/missions.

The exact 16-file source baseline (world simulation, 3D renderer and Dev Room toolkit) is now preserved under `upstream/gamesync/` and pinned by [SOURCE-MANIFEST.json](SOURCE-MANIFEST.json). It already models districts, buildings, interiors, NPCs, vehicles, pickups, weapons, missions, mascot packs and first-/third-person views. The world state is primarily 2D x/y mapped into 3D x/z, with jump/roof offsets. That is a useful foundation, not full 3D physics, navmesh or large-world streaming.

## Athena target package

- `src/world/`: host-neutral world/sector data, districts, interiors, interactions and streaming.
- `src/simulation/`: entity state, fixed-step physics, collision, movement, vehicle and AI systems.
- `src/mission/`: mission graphs, objectives, dialogue, contracts and rewards.
- `src/actors/`: generic mascot/character identity, animation and capability adapters.
- `src/renderers/three-webgpu/`: browser renderer adapter; other renderers remain possible.
- `src/host-adapters/`: save, input, network, filesystem and platform services.

## Important boundaries

- Keep mascot pack parsing/animation as a separate actor runtime; the world engine accepts a generic actor adapter.
- Three.js WebGPU is an external MIT-licensed dependency; the vendor file is not copied into the snapshot. Pin and test the actual Three version before adoption.
- The GameSync Next copy has diverged; GameSync's renderer contains delta-time camera smoothing absent in that copy. Full parity/visual comparison is still required.
- Keep world simulation independent of DOM/extension messaging and host-owned saves. Preserve all current mascot packs and source world data.

## Promotion gate

Prove world traversal, collisions, roofs/interiors, vehicles, NPC pathing, mission lifecycle, saves/migrations, cleanup, camera modes, low/high entity counts and performance in actual compatible hosts. A renderer demo is not proof of a complete open world.

## Portable city topology and indoor visit prototype

From the repository with Node.js 24, build to a new folder:
```sh
node engines/mascot-open-world/build-topology.mjs /path/to/new-city
cd /path/to/new-city
node explore.mjs map
node explore.mjs route 0 29
node explore.mjs tour hideout
```

This preserves the source-pinned 30-node, 49-connection city graph, five
districts, ten buildings, two safehouses, and four authored entrances and
interior exit zones. It verifies shortest road routes, exposes overlap and
nearby authored entries, and rehearses entry/exit with the exact outdoor
return position. The resulting standard ESM bundle is offline and portable.
It is not a game renderer, physical traversal or collision/nav mesh, save
import, vehicle, NPC or combat simulation, or evidence of consumer cutover.

### Single-file Midnight Atlas

Generate the visual prototype and open it directly:
```sh
node engines/mascot-open-world/build-atlas.mjs Midnight-Atlas.html
```

The finished HTML works without Node, a server, or network access. It
includes the exact same route and doorway logic as the CLI. Choose start/end
nodes by keyboard or pointer, zoom the city, inspect a coordinate, and
compare the authored indoor spawn and return points. The floor plan shows
the original room geometry as a rehearsal, not a collision simulation.
The view stores no data and does not start an animation loop.
