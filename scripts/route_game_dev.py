"""Print local, evidence-aware next steps; never run a game, install a skill, or write data."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
UPSTREAM = "https://github.com/gamedev-skills/awesome-gamedev-agent-skills/blob/c6ca6c41c839b68319ffc08430b99ab768debc32/"
EXCHANGE = "docs/GAME-SYSTEMS-EXCHANGE.md"
ENGINE_FOUNDRY = "docs/ENGINE-FOUNDRY.md"
REGISTRY = "guidance/registry/shared-capabilities.json"
PACKAGE_SCHEMA = "guidance/schemas/game-system-package.schema.json"
CARD_STATE = "guidance/schemas/card-game-state.schema.json"
CARD_SCHEMA = "guidance/schemas/card-definition.schema.json"
RUN_SCHEMA = "guidance/schemas/roguelike-run-snapshot.schema.json"
CARD = "athena.card-game"
ROGUE = "athena.roguelite"
WORLD = "athena.mascot-open-world"
CORE = "athena.shared-game-runtime"
ENGINES = (CARD, ROGUE, WORLD, CORE)


def step(path: str, acceptance: str) -> dict[str, str]:
    return {"read": path, "acceptance": acceptance}


REPLAY = {
    CARD: (
        step(CARD_STATE, "Replay the same seed, content lock and actions; compare state, events and card zones."),
        step(CARD_SCHEMA, "Check each card instance is in one zone and the shuffle stream is independent of cosmetic randomness."),
        step(EXCHANGE, "Reject a mismatched ruleset or content version rather than claiming parity."),
    ),
    ROGUE: (
        step(RUN_SCHEMA, "Replay the same seed and action stream, comparing route, upgrades and reward receipt IDs."),
        step(EXCHANGE, "Inject an extra cosmetic draw in a separate stream; the next room and build offers must not change."),
        step(REGISTRY, "Exercise a fixed edge-case seed and a deterministic multi-seed sweep; report failures and sample size."),
    ),
    WORLD: (
        step(ENGINE_FOUNDRY, "Replay an input trace and compare simulation state and world event order, not screenshots."),
        step(EXCHANGE, "Test two target hosts and verify the renderer does not affect the simulation."),
    ),
    CORE: (
        step(ENGINE_FOUNDRY, "Check that a snapshot and command stream replay identically with the pinned runtime contract."),
        step(EXCHANGE, "Feed a version mismatch and a cosmetic RNG draw; verify fail-closed compatibility and isolated streams."),
    ),
}
SAVE = {
    CARD: CARD_STATE,
    ROGUE: RUN_SCHEMA,
    WORLD: ENGINE_FOUNDRY,
    CORE: ENGINE_FOUNDRY,
}
SOURCE_PER_TASK = {
    "replay": {
        CARD: "skills/genres/card-game/SKILL.md",
        ROGUE: "skills/genres/roguelike/SKILL.md",
        WORLD: "router/references/engine-detection.md",
        CORE: "router/references/engine-detection.md",
    },
    "saves": dict.fromkeys(ENGINES, "skills/disciplines/save-systems/SKILL.md"),
    "assets": dict.fromkeys(ENGINES, "skills/disciplines/create-game-assets/SKILL.md"),
    "handoff": dict.fromkeys(ENGINES, "evals/RESULTS.md"),
}


def route(engine: str, task: str, root: Path = ROOT) -> dict:
    if engine not in ENGINES:
        raise ValueError("Select an explicit Athena engine package; external or unknown hosts need separate qualification.")
    if task not in SOURCE_PER_TASK:
        raise ValueError("Unknown game-development task.")
    if task == "assets" and engine == CORE:
        raise ValueError("The shared runtime has no renderer; qualify artwork in the card, roguelite or mascot host.")
    catalog = json.loads((root / "engines/catalog.json").read_text(encoding="utf-8"))
    packages = [p for p in catalog["packages"] if p["id"] == engine]
    if len(packages) != 1:
        raise ValueError("Missing or ambiguous engine catalog entry.")
    package = packages[0]
    status = package["status"]
    if status not in catalog["lifecycle"]:
        raise ValueError("Unrecognized catalog lifecycle; review the catalog first.")
    if task == "replay":
        checks = REPLAY[engine]
    elif task == "saves":
        checks = (
            step(SAVE[engine], "Read an old and a current disposable save; round-trip IDs, values and unknown fields."),
            step(EXCHANGE, "Reject corrupt or interrupted replacement and keep the last valid save. Test rollback and stale revisions."),
            step(PACKAGE_SCHEMA, "Attach schema/content versions and portable store paths to the compatibility receipt."),
        )
    elif task == "assets":
        checks = (
            step(ENGINE_FOUNDRY, "Pin authorized originals, dimensions/anchors, naming, reuse rights and derivative settings."),
            step(EXCHANGE, "Compare the actual imported atlas or model in the target render host. Measure visual fidelity and resource budget there."),
        )
    else:
        checks = (
            step(PACKAGE_SCHEMA, "Pin source, version, license, content, migrations and reproducible local receipts."),
            step(EXCHANGE, "Require equivalent behavior in two real compatible hosts before claiming canonical adoption."),
            step(REGISTRY, "Record missing evidence explicitly. An intake or fixture result is not a shipped runtime."),
        )
    for check in checks:
        if not (root / check["read"]).is_file():
            raise ValueError(f"Route is incomplete; missing local reference: {check['read']}.")
    return {
        "schema": "athena-game-dev-route-v1",
        "engine": engine,
        "task": task,
        "catalogStatus": status,
        "catalogVersion": package["version"],
        "qualification": "advisory-only; this command ran no engine or acceptance check",
        "nextChecks": list(checks),
        "upstreamReference": UPSTREAM + SOURCE_PER_TASK[task][engine],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--engine", required=True, choices=ENGINES)
    parser.add_argument("--task", required=True, choices=SOURCE_PER_TASK)
    args = parser.parse_args(argv)
    try:
        result = route(args.engine, args.task)
    except (ValueError, KeyError, OSError) as exc:
        parser.error(str(exc))
    print(json.dumps(result, ensure_ascii=True, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
