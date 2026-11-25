# Game development skill routing for Athena

Reviewed 25 November 2026. The [linked post](https://x.com/awe0_io/status/2125406446187843953) recommends a cross-engine agent skill pack, not a game engine. Its count is a point-in-time claim. The pinned [upstream tree](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/tree/c6ca6c41c839b68319ffc08430b99ab768debc32) contains 79 skill definitions plus a separate router. Its root license is [Apache-2.0](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/LICENSE), with a separate [NOTICE](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/NOTICE). Athena's contribution is original and uses links rather than copying templates or importing assets. No upstream installer, script or agent was run.

## What transfers

| Source reviewed | Athena adaptation | Boundary |
|---|---|---|
| [Engine detection](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/router/references/engine-detection.md) | Start with the actual project/runtime. This small offline command requires an explicit Athena package instead of guessing from words or needing more context. It returns at most three checks and declines unsupported combinations. | A framework name in a prompt is not proof that it is installed or that a consumer runs it. |
| [Card game](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/skills/genres/card-game/SKILL.md), [roguelike](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/skills/genres/roguelike/SKILL.md) | Keep replay checks distinct. Cards need zone conservation and isolated shuffles. Roguelites need seeded route and reward reproducibility; adding cosmetic randomness must not change the next room or upgrade offers. | Keep rendering, fairness, difficulty and game-specific rules in the real host. |
| [Saves](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/skills/disciplines/save-systems/SKILL.md) | Keep real disposable saves for every supported version. Verify round-trip, unknown fields, stale revision, corrupt payload and rollback. Use Athena's existing receipt/store contracts. | An atomic rename recipe alone is not proof of Windows durability or stopped-source WAL recovery. |
| [Assets](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/skills/disciplines/create-game-assets/SKILL.md) | Approve a reference, keep rights and originals, normalize derivatives deterministically, then inspect the actual imported asset for cost and appearance. | The shared simulation runtime is not an art host. A visually pleasing render is not a verified atlas, rig, collision model or import. |
| [Upstream evaluations](https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/evals/RESULTS.md) | Test confusing, unrelated and multi-part cases as well as positive cases. Qualify a local route separately from an actual engine or consumer. | Model-judged trigger scores measure skill selection; they are not independent gameplay or release proof. |

Do not recommend installing every skill. Don't substitute the upstream version matrix for the actual version found in an Athena consumer. Publishing, installing tools, changing permissions, and replacing saves remain separate decisions.

## Use in an Athena checkout

```text
python -B scripts/route_game_dev.py --engine athena.roguelite --task replay
python -B scripts/route_game_dev.py --engine athena.card-game --task saves
python -B scripts/route_game_dev.py --engine athena.mascot-open-world --task assets
```

The JSON distinguishes the exact checked-in catalog status from the tests the developer should run next. The command does not execute or download anything or send telemetry. The shared runtime will refuse the artwork route; use the actual card, roguelite or mascot renderer. Missing local sources fail closed instead of emitting a route that cannot be followed. No adoption or runtime readiness is inferred from intake status.
