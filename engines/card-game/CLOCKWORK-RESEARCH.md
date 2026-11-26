# Visible enemy countdown: Clockwork Sentinel

[Novus Orbis, Seizo Games](https://store.steampowered.com/app/2437330/Novus_Orbis/) reached 1.0 on November 13, 2026. The developer describes card-order combos and enemy countdowns advanced by card play and turn end. This matters because the enemy can interrupt an otherwise valid sequence: the player decides whether to stretch a combo or defend first. The source is developer documentation, not an independent test of its exact resolution order.

**Athena experiment.** Clockwork Sentinel is an optional, original encounter in the shared card package. Action time is printed on every button, with a preview of the next strike. An action resolves first, then the countdown advances; a due strike happens at most once and resets the clock to three, discarding overflow. A lethal player hit wins before the strike. These are Athena's design choices. No Novus Orbis code, cards, art or audio are included.

Prime costs two time, a brace costs one, and discharge costs two. Prime then discharge risks a six-damage hit. Brace first absorbs it and preserves the discharge. Invalid moves do not advance time. The tape has its own rules identifier, bounded inputs, and a replay checksum; it is not a Warden Duel save, a signed record or a cheat-prevention boundary.

Open the hosted test artifact's single HTML file locally, or build it with `node engines/card-game/build-clockwork.mjs`. The same module handles browser play and Node tape validation. Keep this an optional encounter until playtests determine whether visible interrupts improve other card modes. No GamesSync or ModHunter changes are made here.
