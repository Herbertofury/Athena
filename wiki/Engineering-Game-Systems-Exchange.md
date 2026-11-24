# Game Systems Exchange

Athena coordinates reusable card-game and roguelike systems across JetSetCraft, Modhunter, CrownFold and future apps.

**[Full engineering contract and implementation map](https://github.com/Herbertofury/Athena/blob/main/docs/GAME-SYSTEMS-EXCHANGE.md)** · [Capability registry](https://github.com/Herbertofury/Athena/blob/main/guidance/registry/shared-capabilities.json) · [Coordination issue #364](https://github.com/Herbertofury/Athena/issues/364)

The first inventory identifies JetSetCraft's seeded Rival Rush/build paths, Modhunter's Siege/Chronicle, CrownFold's technology-card synergies and deterministic war simulation, and Games' 198-entry roguelite research index. No full reusable deck/hand/discard card-game engine is yet established. Athena's browser card labs are UI/data integrity experiments, not card-game rules.

The shared contracts cover game-system packages, card definitions, deck state and roguelike run snapshots. Agents contribute verified improvements to the existing shared capability registry, while each game retains its own mechanics, balance, engine, art, economy and saves. Two compatible real-host acceptances are required before a shared implementation is declared canonical.

This is a non-blocking cross-project improvement lane. It does not change project-local release gates or make Athena a runtime dependency.
