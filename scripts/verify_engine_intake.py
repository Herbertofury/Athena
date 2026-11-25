#!/usr/bin/env python3
"""Verify immutable Athena engine intake snapshots against upstream Git blob IDs."""
from __future__ import annotations
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFESTS = (
    "engines/card-game/SOURCE-MANIFEST.json",
    "engines/roguelite/SOURCE-MANIFEST.json",
    "engines/mascot-open-world/SOURCE-MANIFEST.json",
    "engines/shared-game-runtime/SOURCE-MANIFEST.json",
)
SHA = re.compile(r"^[0-9a-f]{40}$")


def git_blob_sha(data: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(data)).encode("ascii") + bytes([0]) + data).hexdigest()


def verify() -> list[str]:
    errors: list[str] = []
    seen: set[str] = set()
    for rel in MANIFESTS:
        path = ROOT / rel
        try:
            manifest = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError) as exc:
            errors.append(f"{rel}: cannot read manifest: {exc}")
            continue
        if manifest.get("schemaVersion") != 1 or manifest.get("status") != "intake_snapshot":
            errors.append(f"{rel}: expected schemaVersion 1 and intake_snapshot")
        upstream = manifest.get("upstream")
        if not isinstance(upstream, dict) or not upstream.get("repository") or not SHA.fullmatch(str(upstream.get("commit", ""))):
            errors.append(f"{rel}: invalid pinned upstream repository/commit")
        if manifest.get("license") != "GPL-3.0-or-later":
            errors.append(f"{rel}: GameSync intake license must remain GPL-3.0-or-later")
        files = manifest.get("files")
        if not isinstance(files, list) or not files:
            errors.append(f"{rel}: files must be a non-empty array")
            continue
        for index, row in enumerate(files):
            label = f"{rel}: file {index}"
            if not isinstance(row, dict):
                errors.append(f"{label}: expected object")
                continue
            source_path, local_path, expected = row.get("sourcePath"), row.get("localPath"), row.get("sourceBlob")
            if not isinstance(source_path, str) or source_path.startswith("/") or ".." in Path(source_path).parts:
                errors.append(f"{label}: invalid sourcePath")
                continue
            if not isinstance(local_path, str) or local_path.startswith("/") or ".." in Path(local_path).parts:
                errors.append(f"{label}: invalid localPath")
                continue
            if not isinstance(expected, str) or not SHA.fullmatch(expected):
                errors.append(f"{label}: sourceBlob must be a full Git blob SHA")
                continue
            if local_path in seen:
                errors.append(f"{label}: duplicate localPath {local_path}")
                continue
            seen.add(local_path)
            try:
                observed = git_blob_sha((ROOT / local_path).read_bytes())
            except OSError as exc:
                errors.append(f"{label}: missing local snapshot {local_path}: {exc}")
                continue
            if observed != expected:
                errors.append(f"{label}: source snapshot drift at {local_path}: expected {expected}, got {observed}")
        comparison = manifest.get("consumerComparison")
        if comparison and (not SHA.fullmatch(str(comparison.get("commit", ""))) or not comparison.get("repository")):
            errors.append(f"{rel}: invalid consumer comparison pin")
    return errors


if __name__ == "__main__":
    issues = verify()
    if issues:
        print("\n".join(issues), file=sys.stderr)
        raise SystemExit(1)
    total = 0
    for rel in MANIFESTS:
        total += len(json.loads((ROOT / rel).read_text(encoding="utf-8"))["files"])
    print(f"Verified {total} immutable engine source files against exact upstream Git blob IDs.")
