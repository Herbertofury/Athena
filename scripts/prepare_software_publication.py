"""Rebuild software outputs and refresh only their reviewed runtime hashes.

This is also the hosted recovery path when a connector cannot upload the large
generated catalog. It never changes research claims or adds runtime files.
"""
import hashlib
import json
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
SOFTWARE_PATHS = frozenset(
    "workspaces/software/" + name
    for name in ("catalog.json", "index.mjs", "model.mjs", "style.css")
)


def refresh_runtime_hashes(root):
    config_path = root / "config/runtime-public-preview.json"
    config = json.loads(config_path.read_text(encoding="utf-8"))
    targets = [item for item in config["files"] if item.get("path") in SOFTWARE_PATHS]
    if len(targets) != len(SOFTWARE_PATHS) or {item["path"] for item in targets} != SOFTWARE_PATHS:
        raise ValueError("Expected exactly one reviewed entry for each software runtime file")
    hashes = {
        item["path"]: hashlib.sha256((root / "dist" / item["path"]).read_bytes()).hexdigest()
        for item in targets
    }
    for item in targets:
        item["sha256"] = hashes[item["path"]]
    config_path.write_text(json.dumps(config, indent=2) + "\n", encoding="utf-8")
    return hashes


if __name__ == "__main__":
    subprocess.run([sys.executable, str(ROOT / "scripts/build_software_catalog.py")], check=True)
    print(json.dumps({"software_runtime_sha256": refresh_runtime_hashes(ROOT)}, indent=2))
