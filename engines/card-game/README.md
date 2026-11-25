# Card Game Engine

**Status:** source intake; not yet a canonical production package. **License:** GPL-3.0-or-later. **Origin:** GameSync `app/shared/cardgame/` at `bce6c1bcb31c63d31c64185fef143a53d9c4d35f` (23 modules).

This is a substantial existing card-game platform, not just UI card components. It includes turn/combat rules, card/hero/keyword definitions, AI, deckbuilder, collection, packs, progression, multiple game modes and a GameSync library-to-card content adapter. GameSync Next has a matching 23-module directory: 19 files are byte-identical; `board.js`, `cardgame.css`, `deck-select.js` and `screens.js` are host/presentation divergences.

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

## Provenance

See [SOURCE-MANIFEST.json](SOURCE-MANIFEST.json) and the immutable source snapshot under `upstream/gamesync/`. Do not edit the snapshot; refactor into `src/` and preserve behavior through parity fixtures.
