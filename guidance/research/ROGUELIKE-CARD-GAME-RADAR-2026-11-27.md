# Roguelike & Card Game Radar — 2026-11-27

## Appulse — ADAPT / isolated prototype

Le Rado / Raw Fury; Steam full release 2026-11-26 (not the original invention date: developer's earlier concept and demo already had the core mechanic). This qualifies for research based on a new shipping game and unusually strong fit for an optional arcade mode, not merely a new title or patch.

Official sources:
- Launch announcement: https://rawfury.com/appulse-is-out-now/
- Playable full game and demo, requirements and copyright: https://store.steampowered.com/app/3498700/Appulse/
- Earlier developer concept, explicitly Unreal Engine: https://lerado.itch.io/appulse
- Earlier announcement: https://rawfury.com/appulse-launches-november-26-on-pc/
- Deck compatibility corroboration: https://steamdb.info/app/3498700/config/
- Independent review (promotional copy disclosed), 2026-11-24, 9/10: https://fingerguns.net/reviews/2026/11/24/appulse-review-pc-disruptive-asset/
- More cautious launch-day review, 68%: https://playinsider.de/games/appulse/

Mechanic: firing changes the player's trajectory in the opposite direction while flippers provide initial propulsion. Attacking, dodging and navigation thus share a single verb. The upgrade draft can change ball, weapon, ability or board, including recoil magnitude, collision damage and time slowdown. Conquering new tables unlocks fleet support. This is an upgrade draft, not a complete deckbuilder. Distinctive design benefit: damage upgrades also modify movement affordances; mastery involves deciding when not to fire as well as where to aim. No claim that recoil locomotion itself is unprecedented.

Evidence: official launch and downloadable demo/full release; Steam product page observed 95% positive from 23 user reviews on 2026-11-27 (small early sample, not durable consensus); mixed independent critical response noted above. No hands-on play or performance measurement by this research pass. Developer announced Deck Verified on Nov 19; Valve compatibility metadata indicates legible text and default controller access, with external controller selection caveat. Windows 10 x64, DX12, Ryzen 5 2600X/i5-8500, RX 5500 XT/GTX 1060, 16 GB RAM, 5 GB SSD minimum. Earlier concept used Unreal; shipping engine/version not independently verified. Proprietary all-rights-reserved game; do not import binaries, assets, card text, table layouts, or source. A fresh generic behavior implementation can be designed independently, using existing appropriately licensed Athena packages; no Unreal dependency required.

## Existing architecture and consumer routes

Baseline: https://github.com/Herbertofury/Athena/blob/7d529423b52d3cc6104ce7469eec358f5dc9b9ac/engines/catalog.json and Game Systems Exchange. The roguelite and browser runtime packages are GPL-3.0-or-later intake snapshots, not canonical accepted runtime releases. The card engine already has a 23-module GameSync source intake; no need to modify it for this mechanic.

- Primary prototype: [GameSync](https://github.com/Herbertofury/Gamesync) and [GameSync Next](https://github.com/Herbertofury/GameSync-Next), optional mascot arcade challenge via Athena's existing shared browser runtime and roguelite package. Compare existing Dev Room movement/collision helpers before any extraction. Do not change the base Survivors loop.
- [JetSetCraft](https://github.com/Herbertofury/JetSetCraft): Rival Rush already has server-owned seeded runs, room contracts, drafts and evolutions; test a separate opt-in momentum room contract, not movement changes in normal rooms. Adventure Mode can later use a separate traversal challenge if graph reachability is maintained. Use native server authority/collision; share behavior fixtures, not browser physics code.
- [Modhunter](https://github.com/Herbertofury/Modhunter): Siege is hero/upgrade/boss combat; leave intact. Atlas Campaign may use a short optional momentum puzzle in an expedition; Shiverfell only if a thematic puzzle fits. Do not spend MO2 performance budget on a physics-heavy minigame, never issue maintenance-backed Forge Sigils from game play. Lower priority.
- [CrownFold](https://github.com/Herbertofury/CrownFold): SKIP direct integration; RTS tech loadouts, formations and Fold/Echo do not benefit from pinball locomotion. No forced card or physics conversion.

## Prototype acceptance contract (proposed, untested)

Reuse existing runtime input/scheduler/collision seam; one isolated original arena, an action-driven impulse to an actor, a flipper-like launch zone, a rebound obstacle, and a three-choice run-local modifier draft. Separate generic action-to-motion event contract from host-owned geometry, physics and rendering; apply exactly once per accepted action. Record input sequence and simulation version; same-host seeded replay checks outcomes with documented numeric tolerance or quantized state where appropriate. Separate collision, reward and progression authority. Test no duplicate reward on retry/reload; reachable exit and recovery from stalled actor; high-speed swept collision or equivalent no-tunneling check; pause/close disposes all loops. Measure p50/p95/p99 frame/update times, peak memory, and idle app CPU against existing host baseline on equal workloads. Target 60 Hz browser presentation (16.7 ms frame budget) without imposing that tick on Minecraft. Avoid background polling and do not remove content or lower fidelity to manufacture speed. Proposed accessibility: remappable keyboard/controller controls, optional aim/trajectory guide, slower practice mode, reduced shake/flashes, and legible non-color-only feedback. No evidence these additions are present in the source game. Preserve saves and all current gameplay. Require two compatible real host acceptances before any canonical package promotion.

## Registry routing

Link this research-only record to gameplay.roguelite-engine, gameplay.shared-browser-game-runtime, gameplay.encounter-content, gameplay.build-synergies and gameplay.game-research-radar. No proprietary source candidate, no new engine or capability ID; no canonical status change. Consumer links above are potential targets, not adoption claims. No code changes or runtime validation in this pass. Documentation-only research checkpoint, not a software release.

## Other screening (no alert)

DWARRF: turn-based pinball/Pachinko power-building phase and stronghold progression are interesting but storefront release status inconsistent at review time and no launch review evidence; revisit rather than issue a second pinball alert. https://store.steampowered.com/app/3634710
Spinova: rule-altering gods and day/night scoring, developer reports Nov 26 EA launch but retrieved official listing still coming soon with no reviews; no recommendation yet. https://store.steampowered.com/app/4487360/Spinova/
Brotato Nov 26 beta: individual DLC mechanic toggles are useful UX, but not an exceptional release; beta balancing patch, no notification. https://steamdb.info/patchnotes/26948350/
No newly verified exceptional engine/plugin release surfaced in this scan.
