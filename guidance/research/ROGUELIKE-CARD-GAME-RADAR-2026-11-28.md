# Roguelike & Card Game Radar — 2026-11-28

## Attack of the Astrals — ADAPT / bounded prototype

Hewer's Workshop / Goblinz Publishing / Gamirror Games. Full commercial launch on 2026-11-26 (confirmed by the launch announcement and Steam build 26948437; some stale store snapshots showed Nov 25). The core movement/attack mechanic was already available in the May demo and September demo update; do not claim its invention at 1.0. The full release expands to 12 champions, 216 upgrades, 78 alternative Zodiac moves, 70+ consumable Scrolls, 30+ enemies, seven regions and seven difficulty levels; demo progress carries forward.

Primary evidence:
- Developer/publisher launch press release (dated Nov 26, posted Nov 27): https://www.gamespress.com/Attack-of-the-Astrals-Now-Available
- Official store: https://store.steampowered.com/app/3991790/Attack_of_the_Astrals/
- Official demo: https://store.steampowered.com/app/4656950/Attack_of_the_Astrals_Demo/
- September demo update press release: https://www.gamespress.com/Attack-of-the-Astrals-Demo-Expanded-and-Localized
- Developer launch notes mirrored with exact build: https://steamdb.info/patchnotes/26948437/
- Early reception corroboration: https://steamdb.info/app/3991790/charts/ (41 positive, zero negative reviews on the retrieved snapshot; SteamDB's adjusted rating is a separate metric). Demo listing reports 35 positive reviews. Small early samples; not independent gameplay verification.

### Transferable behavior

1. **Movement as the complete tactical action.** Moving a champion automatically swaps positions with units along its path and resolves an area attack at the destination. Three champions act once per turn. Instead of choosing movement, attack and target through separate menus, the player plans three spatial transformations whose order matters. Developer reports typical battles last two to four turns.
2. **Opposition inherits defeated-region powers.** The player gains abilities from liberated regions, but the shared enemy army also gains powers from defeated regional foes. This makes route order matter twice: it shapes the player's build and the capabilities of future opposition.
3. **Conditional consumables and pair-specific upgrades.** Scrolls cast map-wide spells; the September developer update documents mid-battle scroll generation and reactions based on movement, conditions and targeting. Full release contains champion and paired-champion builds; these are consumables/upgrades, not evidence of a complete new deck engine. Efficient wins grant more XP; examine snowball risk before copying any progression incentive.

### Consumer routing / identity boundaries

- [Modhunter](https://github.com/Herbertofury/Modhunter) Atlas Campaign: first candidate for an opt-in regional expedition prototype. On clearing a region, commit one explicit, telegraphed enemy doctrine tag to later eligible encounters. Keep Atlas progression distinct from Siege and Shiverfell; do not touch verified MO2 Forge Sigils or maintenance authority. Shiverfell: consider optional three-action tactical dungeon puzzles only after Atlas evidence. Siege: skip conversion of continuous survivor combat to turns.
- [JetSetCraft](https://github.com/Herbertofury/JetSetCraft) Adventure Mode: adapt route-dependent enemy traits into its own region graph once the graph is validated. Optional authored positional puzzle encounters only; preserve movement/platforming. Rival Rush: research a bounded arena contract using telegraphed later-room modifiers, not a replacement of its existing six-room circuit or upgrade pool.
- [CrownFold](https://github.com/Herbertofury/CrownFold): compare doctrine inheritance against existing war simulation, doctrines and expeditions; optional campaign scenario with visible enemy adaptation. Do not replace real-time strategy commands or technology loadouts with a turn-based grid.
- [GameSync](https://github.com/Herbertofury/Gamesync) and [GameSync Next](https://github.com/Herbertofury/GameSync-Next): optional short tactical encounter inside a dedicated game mode, using existing shared browser runtime and existing card/effect foundations if needed, not a third engine.

### Athena integration and acceptance

Use [Game Systems Exchange](../../docs/GAME-SYSTEMS-EXCHANGE.md) and [Engine Foundry](../../engines/catalog.json). Link research into gameplay.encounter-content, gameplay.build-synergies, gameplay.seeded-run-state and gameplay.game-research-radar. The current registry already has seeded runs, explicit upgrades and regional contracts; this research adds a candidate for route-conditioned opposition capability inheritance, not another run engine. GameSync's 23-module card intake already exists. Keep canonical implementation/status untouched.

Proposed single owner experiment: extend the existing encounter contract with explicit on-clear doctrine grant IDs, eligibility and conflicts; persist ordered acquired tags in the existing run snapshot. Use an isolated deterministic reducer, not a global adaptive-difficulty service. For an optional grid fixture, resolve path displacement in declared order, check occupancy, then trigger the destination effect; preview from an immutable state with no RNG or reward side effects. Keep visual animation separate from authoritative state. Never poll when the game is closed.

Acceptance before promotion: same seed/content/action stream gives identical doctrine and occupancy state; preview equals commit; no duplicate occupants, lost units or repeat reward grants; save/reload preserves tags and order; graph remains completable for all supported modifier combinations. Exhaustively test small boards, fuzz seeded routes and compare equivalent full workloads (p50/p95/p99 frame/tick or action latency, CPU/RAM, cold start). No shortcut or reduced functionality. Test actual two compatible hosts before selecting shared runtime. Make future doctrines visible before a route commitment, offer keyboard/controller and mouse-only input, textual/icon attack forecasts, untimed choices, reduced motion and adjustable challenge. Benchmark and playtest win-rate/XP distribution to avoid excessive snowballing.

### Licensing, runtime, evidence limits

Commercial proprietary game; no source, asset, audio, card text or level redistribution permission established. Independent original implementation of general rules only; no extraction or copied content. Windows 10, Linux, Apple Silicon macOS; listed minimum 1 GB RAM, OpenGL 2.1 and 400 MB storage; developer reports Steam Deck availability (not a verified compatibility rating). Store lists adjustable difficulty, save anytime, untimed input, mouse-only play, own pace and controller support. The shipping engine is not established. The small listed requirements are not a benchmark of a new Athena module. No hands-on playtest, source inspection of the commercial game, measured performance, or integration test was performed.

### Other items screened (not alert recommendations)

DWARRF (Nov 27): separates pinball charge from combat discharge; interesting but overlaps the recent pinball radar and no substantive reception evidence yet. https://store.steampowered.com/app/3634710/
HellRaiders (Nov 26 EA): warband autobattler; first patch Nov 27 adds achievements, insufficient differentiation. https://store.steampowered.com/app/5541950/
Food Devils (Nov 24 EA): expedition ingredients -> restaurant -> recruits is a useful hub loop but still early; Steam Deck optimization caveat; monitor rather than promote in this pass. https://www.gamespress.com/en-US/Tactical-RPG-Gameplay-Spicy-Romance-and-Roguelike-Replayability-Combin
Slotbound (Nov 12): probability manipulation and unit recruitment via a slot grid, substantial sales but recent changes mainly balance; no paid/real-money random rewards proposed. https://store.steampowered.com/app/4459590/Slotbound/
DeckForge (Nov 25): commercial Godot template with standalone redistribution restriction, developer-reported tests; no compatible shared-runtime advantage proven. https://floating-studio.itch.io/deckforge-godot-4
RogueDeck Core: interesting queue architecture, but current README states PolyForm Noncommercial (earlier MIT revisions require exact pin verification); no newly dated major release established, no code intake. https://github.com/Paranoidgrinch/RogueDeck-Core

Research-only change; no release or runtime optimization claim. Existing source and registry candidate status preserved. Documentation/registry references only; no executable change for optimization tools.
