# Game Systems Exchange

Athena coordinates reusable card-game and roguelike systems across JetSetCraft, Modhunter, CrownFold and future apps.

**[Full engineering contract and implementation map](https://github.com/Herbertofury/Athena/blob/main/docs/GAME-SYSTEMS-EXCHANGE.md)** · [Capability registry](https://github.com/Herbertofury/Athena/blob/main/guidance/registry/shared-capabilities.json) · [Coordination issue #364](https://github.com/Herbertofury/Athena/issues/364)

The source inventory now also identifies GameSync's full 23-module card-game platform, five-minute Mascot Survivors loop and Midnight Mascot Syndicate hybrid 3D world. GameSync Next carries a mostly identical card engine copy (19/23 files identical, four UI files divergent). Athena is the canonical Engine Foundry host; GameSync and Next remain protected consumers until migration is accepted.

The shared contracts cover game-system packages, card definitions, deck state and roguelike run snapshots. Agents contribute verified improvements to the existing shared capability registry, while each game retains its own mechanics, balance, engine, art, economy and saves. Two compatible real-host acceptances are required before a shared implementation is declared canonical.

This is a non-blocking cross-project improvement lane. It does not change project-local release gates or make Athena a runtime dependency.
