#!/usr/bin/env python3
"""Offline CLI. Input paths are supplied by the caller, never embedded fixtures."""
import argparse
import json
import re
from pathlib import Path
import sys

from lxml import etree
from extractors import FAMILIES, extract, json_loads, receipt, sha256

INPUT_ROLES = {
    "modrinth": {"project", "members", "versions", "uploader"},
    "pmc": {"item", "profile"}, "wordpress": {"post"}, "rss": {"feed"},
    "dwemer": {"page", "description", "files", "images", "changelog", "profile"},
    "modpub": {"page", "files", "profile"}, "subscribestar": {"fragments"},
    "simsfinds": {"fragments", "profile_receipt"},
}
INPUT_ERRORS = (ValueError, KeyError, TypeError, OSError, IndexError, AttributeError, etree.Error)


def replay_case(case, base=Path(".")):
    if not isinstance(case, dict) or case.get("family") not in FAMILIES:
        raise ValueError("Unknown case family")
    family, supplied = case["family"], case.get("inputs")
    required = INPUT_ROLES[family] - ({"profile_receipt"} if family == "simsfinds" else set())
    if not isinstance(supplied, dict) or not required <= supplied.keys() or supplied.keys() - INPUT_ROLES[family]:
        raise ValueError("Missing or unexpected input role")
    inputs = {role:(base / Path(path)).read_bytes() for role,path in supplied.items()}
    result = receipt(extract(case["family"], inputs, case.get("origin", "")))
    label = case.get("label", case["family"])
    label = label if isinstance(label, str) and re.fullmatch(r"[A-Za-z0-9_. -]{1,80}", label) else "input_case"
    return {"label": label, "family":case["family"], "status":"sample_scoped_replay_passed",
            "inputReceipts":{role:{"bytes":len(value), "sha256":sha256(value)} for role,value in inputs.items()},
            "result":result}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--manifest", type=Path, help="Local JSON list of {family, origin, inputs:{role:path}, label}")
    parser.add_argument("--family", choices=sorted(FAMILIES))
    parser.add_argument("--input", action="append", default=[], metavar="ROLE=PATH")
    parser.add_argument("--origin", default="")
    parser.add_argument("--output", type=Path, help="Sanitized receipt only; defaults to stdout")
    args = parser.parse_args(argv)
    if bool(args.manifest) == bool(args.family):
        parser.error("Choose a manifest or a family")
    output = {"schemaVersion":1,"networkUsed":False,"fullSupportAccepted":False,"cases":[]}
    output["implementationReceipts"] = {name: {"sha256": sha256((Path(__file__).parent / name).read_bytes())}
                                         for name in ("extractors.py", "replay.py")}
    base = args.manifest.parent if args.manifest else Path(".")
    if args.manifest:
        try:
            cases = json_loads(args.manifest.read_bytes())
            if not isinstance(cases, list) or not cases:
                raise ValueError("Expected nonempty case list")
        except INPUT_ERRORS as exc:
            cases = []
            output["cases"].append({"family":None,"status":"failed","errorType":type(exc).__name__})
    else:
        inputs = {}
        for item in args.input:
            if "=" not in item:
                parser.error("Each input needs ROLE=PATH")
            role,path = item.split("=",1)
            if role in inputs:
                parser.error("Duplicate input role")
            inputs[role] = path
        cases = [{"family":args.family,"origin":args.origin,"inputs":inputs}]
    for case in cases:
        try:
            output["cases"].append(replay_case(case, base))
        except INPUT_ERRORS as exc:
            # Exception messages can contain private file paths or raw payloads.
            family = case.get("family") if isinstance(case, dict) else None
            output["cases"].append({"family":family if isinstance(family, str) and family in FAMILIES else None,"status":"failed","errorType":type(exc).__name__})
    rendered = json.dumps(output, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        try:
            args.output.write_text(rendered, encoding="utf-8")
        except OSError:
            sys.stderr.write("Receipt output could not be written.\n")
            return 1
    else:
        sys.stdout.write(rendered)
    return int(any(c["status"]=="failed" for c in output["cases"]))


if __name__ == "__main__":
    raise SystemExit(main())
