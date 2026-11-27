# Tower Defense + RTS: design intake

**Status:** source-backed design brief, not an implemented or published engine. Athena's [Engine Foundry](README.md) should own one reusable strategy core. Tower defense, army control, and economy must work together without roguelite code. A host developer can opt into roguelite progression when the game benefits from it.

## Dawn of Defense: what to learn

- **Defend, then take ground.** 6side Studio builds a tension between defending a home base along attack lanes and commanding units to capture new territory. Captured ground supports production and defenses. Take the mechanic, not the game's names, theme, maps, narrative, art, or balance. [Official Steam page](https://store.steampowered.com/app/2781660/Dawn_of_Defense/)
- **A capture changes your choices.** Expansion should offer a clear benefit, such as sustained income, a better firing angle, or a new staging position, but require a real tradeoff: time, forces, an extended perimeter, or competing scarce resources. Don't make the optimal move “sit at home,” and don't reward capturing an outpost if it never changes the next decision. [Official Steam page](https://store.steampowered.com/app/2781660/Dawn_of_Defense/)
- **Read the threat and give the player counters.** The developers describe support enemies and configurable tower targeting in their combat update. Use original but legible interactions: a clearly signaled support enemy, an advanced targeting rule, and at least one reliable counter available without any progression unlock. [6side Studio combat devlog](https://steamcommunity.com/app/2781660/announcements/)
- **Treat movement and save/replay as first-class.** Their release notes call out group-path improvements and fixes for ruins and replayed-map upgrades. Test path invalidation, squad formation, destroyed structures, and upgrade state through save and restore from the first slice, not only once content grows. [6side Studio release notes](https://steamcommunity.com/app/2781660/allnews/)

Before extracting anything, examine [Mindustry](https://github.com/Anuken/Mindustry) for the defense/supply loop and [OpenRA](https://github.com/OpenRA/OpenRA) for an established RTS engine and command/movement design. Compare practical reuse, licensing, cost, and host fit against an original compact core. These are reference candidates, not adopted dependencies. No commercial code, package, or game assets were imported.

## Athena implementation boundary

| Layer | Owns | Developer choices |
| --- | --- | --- |
| Defense + RTS core | Fixed-step simulation; wave timing and telegraphs; lanes, tower targeting, orders and unit groups; construction, repairs, shared economy, capture, objectives, and save/replay events. | Tower-first or army-first scenarios, overlapping or authored wave windows, optional territory objectives, alternate resources, fixed or independently seeded maps. |
| Run layer | Seeded encounter variation, choice drafts, run rewards, and run-local resets; reuse [Roguelite](roguelite/README.md) contracts where semantics match. | `off` (default) or `run`. Off must not load draft UI, consume run RNG, or write progression data. |
| Persistent progression | Versioned unlock/reward receipts and a separate profile owned by the host. | Separately opt into `metaProgression` when runs are enabled. Keep tactical saves and persistent rewards separate; never grant twice on reload. |
| Host and presentation | Input, renderer, accessibility, audio, storage directory, and original content; offline local package. | Choose renderer and platform independently; bind to stable commands rather than sharing UI or global save state. |

No power grind to make the strategy core playable. Authored skirmishes should support a complete win/loss loop and readable difficulty with everything disabled. Optional run choices should create different strategies rather than inflate enemy health.

## First playable gate

1. Build one original map: two defense lanes, one base, a contested outpost, one squad, two tower roles, and an economy that changes after capture. Ship legible enemy-wave warnings, attack/move/retreat orders, and a real choice between reinforcing and expanding.
2. Use one command trace with both run modes. With run rules off, no draft or persistent write occurs. With runs on, the same seed and logged choices reproduce the same outcome. A different seed may change optional encounters, but may not remove all legal paths or necessary counters.
3. Replay checkpoint/resume around capture, construction, death, and wave transitions. Restore identical strategy state and reject stale commands. Verify that invalid placement never seals the only legal route unless a mode explicitly declares an alternate resolution. Compare same-state hashes across two compatible hosts before promoting to canonical.
4. Measure simulation tick p95/p99, command-to-simulation latency, path-search budgets, and input responsiveness under the same large wave/squad workload before and after optimization. Report actual loads and hardware; don't remove enemy behavior or hide delayed work to claim faster play.

[M5 implementation queue](https://github.com/Herbertofury/Athena/issues/365) · [Engine Foundry architecture](../docs/ENGINE-FOUNDRY.md)
