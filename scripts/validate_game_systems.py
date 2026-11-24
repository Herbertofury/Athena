#!/usr/bin/env python3
"""Validate Athena's game-system capability records in the shared registry."""
from __future__ import annotations
import json, re, sys
from pathlib import Path

REQUIRED_IDS = {
    "gameplay.seeded-run-state", "gameplay.encounter-content", "gameplay.build-synergies",
    "gameplay.card-game-engine", "gameplay.card-presentation", "gameplay.reward-ledger",
    "gameplay.save-progression", "gameplay.card-run-bridge", "gameplay.game-research-radar",
}
EVIDENCE_LEVELS = {"source_inspected_not_runtime_verified", "synthetic_tested", "local_fixture_tested", "runtime_verified", "consumer_verified", "research_only"}
SHA_RE = re.compile(r"^[0-9a-f]{40}$")

def validate(data: object) -> list[str]:
    errors: list[str] = []
    if not isinstance(data, dict) or not isinstance(data.get("capabilities"), list):
        return ["registry must be an object with a capabilities array"]
    rows = data["capabilities"]
    ids = [row.get("id") for row in rows if isinstance(row, dict)]
    duplicates = sorted({value for value in ids if ids.count(value) > 1})
    if duplicates:
        errors.append("duplicate capability IDs: " + ", ".join(duplicates))
    gameplay = [row for row in rows if isinstance(row, dict) and str(row.get("id", "")).startswith("gameplay.")]
    missing = sorted(REQUIRED_IDS - {row.get("id") for row in gameplay})
    if missing:
        errors.append("missing required gameplay capabilities: " + ", ".join(missing))
    for row in gameplay:
        cap_id = str(row.get("id", "<unknown>"))
        for field in ("name", "status", "contractRefs", "researchRefs", "candidates", "nextAction"):
            if field not in row:
                errors.append(f"{cap_id}: missing {field}")
        if row.get("canonicalImplementation") is not None and row.get("status") != "verified":
            errors.append(f"{cap_id}: canonical implementation requires verified status")
        candidates = row.get("candidates")
        if not isinstance(candidates, list):
            errors.append(f"{cap_id}: candidates must be an array")
            continue
        seen: set[tuple[str, str]] = set()
        for index, candidate in enumerate(candidates):
            label = f"{cap_id}: candidate {index}"
            if not isinstance(candidate, dict):
                errors.append(f"{label} must be an object")
                continue
            for field in ("repository", "commit", "path", "source", "evidence", "observed", "limits"):
                if not candidate.get(field):
                    errors.append(f"{label}: missing {field}")
            repo, commit, path = candidate.get("repository", ""), candidate.get("commit", ""), candidate.get("path", "")
            if not isinstance(repo, str) or not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repo):
                errors.append(f"{label}: invalid repository")
            if not isinstance(commit, str) or not SHA_RE.fullmatch(commit):
                errors.append(f"{label}: commit must be a full 40-character SHA")
            if not isinstance(path, str) or path.startswith("/") or ".." in Path(path).parts:
                errors.append(f"{label}: invalid repository path")
            expected = f"https://github.com/{repo}/blob/{commit}/{path}"
            if candidate.get("source") != expected:
                errors.append(f"{label}: source URL must bind the exact repository, commit and path")
            if candidate.get("evidence") not in EVIDENCE_LEVELS:
                errors.append(f"{label}: unknown evidence level")
            key = (str(repo), str(path))
            if key in seen:
                errors.append(f"{label}: duplicate candidate path {repo}/{path}")
            seen.add(key)
    card_engine = next((row for row in gameplay if row.get("id") == "gameplay.card-game-engine"), None)
    if card_engine:
        if card_engine.get("canonicalImplementation") is not None:
            errors.append("gameplay.card-game-engine: no complete deck/hand rules engine has been verified")
        if card_engine.get("status") != "comparison_needed":
            errors.append("gameplay.card-game-engine: keep status comparison_needed until a real card-game host is accepted")
    return errors

def main() -> int:
    root = Path(__file__).resolve().parents[1]
    path = root / "guidance/registry/shared-capabilities.json"
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        print(f"cannot read shared capability registry: {error}", file=sys.stderr)
        return 2
    errors = validate(data)
    if errors:
        print("Game Systems Exchange registry validation failed:")
        for error in errors:
            print("- " + error)
        return 1
    count = sum(str(row.get("id", "")).startswith("gameplay.") for row in data["capabilities"])
    print(f"Game Systems Exchange registry valid: {count} gameplay capabilities, exact source pins and evidence levels checked.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
