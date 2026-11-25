# Card Game Engine

**Status:** source intake; not yet a canonical production package. **License:** GPL-3.0-or-later. **Origin:** GameSync `app/shared/cardgame/` at `bce6c1bcb31c63d31c64185fef143a53d9c4d35f` (23 modules).

The complete 23-module source snapshot is now stored at `upstream/gamesync/` and verified against the pinned source manifest. This is a substantial existing card-game platform, not just UI card components. It includes turn/combat rules, card/hero/keyword definitions, AI, deckbuilder, collection, packs, progression, multiple game modes and a GameSync library-to-card content adapter. GameSync Next has a matching 23-module directory: 19 files are byte-identical; `board.js`, `cardgame.css`, `deck-select.js` and `screens.js` are host/presentation divergences.

## Athena target package

- `src/core/`: pure rules, actions, event queue, phases, targeting and legal transitions.
- `src/content/`: versioned card definitions, typed effect registry and host content adapters.
- `src/deck/`: deck legality, construction, draft, collection and card-instance identities.
- `src/ai/`: deterministic opponent, draft and balance simulation.
- `src/progression/`: run-local and permanent progression, rewards, quests and migrations.
- `src/adapters/`: browser/extension/desktop storage, rendering, input, audio and asset adapters.
- `tests/`: zone conservation, effect order, seeded replay, target legality, migrations, full matches and host fixtures.

## First repairs

The current source rules engine contains 17 `Math.random` occurrences; the state layer uses browser `localStorage`. These must be replaced/separated before it can meet Athena's deterministic, host-neutral card-state contract. The current code is a baseline, not a verified performance or quality winner. Keep GameSync's game/mod-derived card content as one adapter, not a universal content requirement.

## Headless replay prototype

Build and replay actual retained GameSync turn/combat rules without a browser:

```sh
node engines/card-game/build-replay.mjs /path/to/new-replay-bundle
node --test engines/card-game/tests/replay.test.mjs
```

The generator verifies SHA-1 Git blob IDs for the three fixed upstream files,
refuses altered inputs and existing outputs, and emits normal ESM files.
The resulting folder (including its GPL notice) can be moved and imported
without Athena, network, storage or build time dependencies. It requires a
host-supplied card lookup, hero lookup and deterministic hero power resolver.
`createReplayEntropy(uint32Seed, logicalTimeBase)` pins Mulberry32/clock v1.
A fresh engine plus the same ordered inputs reproduces the initial shuffle,
mulligan, summon IDs, turns, hero power, discovery, and event timestamps.
Discovery uses a full Fisher–Yates shuffle rather than the original random
sort; the selection count and uniqueness are kept, not previous RNG samples.

This is an experimental replay slice, not a new production engine release,
arbitrary-action validator, snapshot/mid-turn restore, external package API,
or evidence that either GameSync host has cut over. It does not extract the
library/persistence/AI/presentation layers or verify all effects. The host
continues to own its content, storage, and authorization.

## Provenance

See [SOURCE-MANIFEST.json](SOURCE-MANIFEST.json) and the immutable source snapshot under `upstream/gamesync/`. Do not edit the snapshot; refactor into `src/` and preserve behavior through parity fixtures.

## Play and keep a portable match

Build a new bundle, then use its local demonstration, verifier or CLI:

```sh
node engines/card-game/build-replay.mjs ./warden-bundle
node warden-bundle/tape-cli.mjs demo ./warden-demo.json
node warden-bundle/tape-cli.mjs verify ./warden-demo.json
node warden-bundle/tape-cli.mjs play 42
node warden-bundle/tape-cli.mjs resume ./warden-demo.json
```

`play` starts a local Warden Duel with an original lab deck, authored heroes and
the retained battle rules, not a real library or player inventory. Type
`help` in the CLI for commands. `save PATH` writes a **new** replay file and
will not overwrite an existing one. A tape contains a seed, a fixed rules and
content identity, validated action sequence, and digests of the replayed
events and final state. It does not hold install data, private accounts, or
serialized executable content. `resume` replays the whole verified prefix
and continues at the next action; a finished tape stays finished. The bounded
format refuses noncanonical JSON, incompatible rules, illegal actions and
changed digests. Digests detect mismatched playback, not authorship or
multiplayer cheating. No arbitrary card-set validation is claimed.
