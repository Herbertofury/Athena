#!/usr/bin/env python3
"""Validate release receipt structure, not the truth of linked evidence."""
import argparse
import json
import re
from pathlib import Path

CORE = ("shrink-anything", "fast-anything", "rust-anything")
GATES = ("project_checks", "workflow_acceptance", "artifact_integrity",
         "artifact_rollback", "review", "stack_freshness")
LANES = ("quick", "standard", "high-risk")
OUTCOMES = ("adopted", "no_safe_win", "not_applicable")


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def valid_sha(value):
    return isinstance(value, str) and re.fullmatch(r"[0-9a-f]{40}|[0-9a-f]{64}", value) is not None


def validate(receipt, head):
    """Return problems; an empty list means only that the receipt is consistent."""
    if not isinstance(receipt, dict):
        return ["receipt must be an object"]
    problems = []
    if type(receipt.get("schemaVersion")) is not int or receipt["schemaVersion"] != 4:
        problems.append("schemaVersion must be 4")
    if not valid_sha(head) or receipt.get("head") != head:
        problems.append("head must match the independently supplied full candidate SHA")
    if not valid_sha(receipt.get("baseline")):
        problems.append("baseline must be a full commit SHA")
    lane = receipt.get("lane")
    if lane not in LANES or not nonempty(receipt.get("scope")):
        problems.append("valid risk lane and scope are required")
    if receipt.get("hard_blockers") != []:
        problems.append("hard_blockers must be explicitly empty; resolve or revert blockers")
    checks = receipt.get("checks")
    if not isinstance(checks, dict):
        checks = {}
    optimizations = receipt.get("core_tools")
    if not isinstance(optimizations, dict):
        optimizations = {}
    adopted = False
    for name in CORE:
        result = optimizations.get(name)
        if not isinstance(result, dict):
            problems.append(f"missing core assessment: {name}")
            continue
        status = result.get("status")
        if status not in OUTCOMES or not nonempty(result.get("evidence")):
            problems.append(f"{name}: valid outcome and evidence/reason required")
        if status in ("adopted", "no_safe_win"):
            if not nonempty(result.get("tool_version")) or not nonempty(result.get("command")):
                problems.append(f"{name}: completed assessment requires tool version and command")
        adopted |= status == "adopted"
    retained = receipt.get("retained_optimization")
    if type(retained) is not bool or (adopted and retained is not True):
        problems.append("retained_optimization must be boolean and true for an adopted core change")
    required = list(GATES)
    if lane == "high-risk":
        required.append("risk_specific")
    if retained is True or adopted:
        required.append("optimization_equivalence")
    for name in required:
        result = checks.get(name)
        if not isinstance(result, dict) or result.get("status") != "passed" or not nonempty(result.get("evidence")):
            problems.append(f"mandatory gate not evidenced as passed: {name}")
    for name, result in checks.items():
        if not isinstance(result, dict) or result.get("status") != "passed" or not nonempty(result.get("evidence")):
            problems.append(f"declared mandatory gate incomplete: {name}")
    freshness = checks.get("stack_freshness")
    holds = freshness.get("holds") if isinstance(freshness, dict) else None
    if not isinstance(holds, list):
        problems.append("stack_freshness requires an explicit holds list")
    else:
        for index, hold in enumerate(holds):
            label = f"stack_freshness hold {index + 1}"
            if not isinstance(hold, dict):
                problems.append(f"{label}: hold must be an object")
                continue
            for field in ("component", "retained_version", "candidate_version",
                          "reason", "repair_evidence", "next_review"):
                if not nonempty(hold.get(field)):
                    problems.append(f"{label}: {field} required")
            if hold.get("repair_status") not in ("attempted_unresolved", "infeasible"):
                problems.append(f"{label}: completed unsuccessful repair or evidenced infeasibility required")
            if (nonempty(hold.get("retained_version"))
                    and hold.get("retained_version") == hold.get("candidate_version")):
                problems.append(f"{label}: retained and candidate versions must differ")
    # Security audits are an optional advisory map, never a required gate.
    return list(dict.fromkeys(problems))


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate JSON key: {key}")
        result[key] = value
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--receipt", required=True, type=Path)
    parser.add_argument("--head", required=True, help="independently resolved exact candidate commit")
    args = parser.parse_args()
    try:
        with args.receipt.open("rb") as stream:
            raw = stream.read(1024 * 1024 + 1)
        if len(raw) > 1024 * 1024:
            raise ValueError("receipt exceeds 1 MiB")
        receipt = json.loads(raw, object_pairs_hook=unique_object)
        problems = validate(receipt, args.head)
    except (OSError, ValueError, RecursionError) as exc:
        print(f"INVALID RECEIPT: {exc}")
        return 2
    if problems:
        for problem in problems:
            print(f"BLOCK: {problem}")
        return 1
    print("Receipt structure valid for supplied head; linked evidence still requires real verification.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
