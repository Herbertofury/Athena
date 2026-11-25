# Shared Browser Game Runtime

**Status:** source intake; support package, not a game engine. **License:** GPL-3.0-or-later.

GameSync's `game-core.js` supplies the canvas/input/drawing/collision/particle runtime used by Mascot Survivors and the mascot open-world game. Athena stores one shared source snapshot here rather than copying it into both packages.

The future adapter should expose an explicit host API, fixed-step scheduler, injected input/RNG, bounded particle/asset resources, resize/visibility handling, cancellation and deterministic teardown. No `window.__gsMascotGameCore` global should leak into the canonical package API.

The exact GameSync source snapshot is now stored at `upstream/gamesync/game-core.js` and pinned by [SOURCE-MANIFEST.json](SOURCE-MANIFEST.json). Consumers must pin a package version locally; no runtime fetch from Athena.
