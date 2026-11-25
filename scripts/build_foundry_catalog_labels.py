"""Publish bounded source catalog labels, never behavior, tracks or owner content."""
import argparse
import copy
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
AUTHORED = ROOT / "feature-foundry/source/src/data/theme-world-packages.json"
NATIVE = ROOT / "crates/athena-foundry-store/catalog.json"
OUTPUT = ROOT / "dist/workspaces/foundry/catalog.json"
BOUNDED = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9 _-]{0,63}\Z")


def labels(source, base):
    sources = {(theme["id"], obj["id"]): obj for theme in source for obj in theme["objects"]}
    if len(sources) != sum(len(t["objects"]) for t in source):
        raise ValueError("Mixed identities in preserved source")
    seen = set()
    enriched = copy.deepcopy(base)
    for theme in enriched["themes"]:
        for obj in theme["objects"]:
            key = theme["id"], obj["id"]
            if key in seen:
                raise ValueError("Duplicate native object")
            seen.add(key)
            original = sources[key]
            if any(original[field] != obj[field] for field in ("id", "name", "shape", "role")):
                raise ValueError("Native shape identity diverges")
            material, tags, affordances = (original[field] for field in ("material", "tags", "affordances"))
            if not BOUNDED.fullmatch(material):
                raise ValueError("Material label exceeds review scope")
            for tokens in (tags, affordances):
                if not isinstance(tokens, list) or len(tokens) > 12 or any(not BOUNDED.fullmatch(x) for x in tokens):
                    raise ValueError("Object label out of scope")
            obj.update(sourceLabels={"material": material, "tags": tags, "affordances": affordances})
    if seen != set(sources):
        raise ValueError("Loss of source object coverage")
    return enriched


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    result = labels(json.loads(AUTHORED.read_bytes()), json.loads(NATIVE.read_bytes()))
    data = json.dumps(result, ensure_ascii=False, indent=2).encode() + b"\n"
    if args.check:
        if OUTPUT.read_bytes() != data:
            raise SystemExit("Foundry source labels need regeneration")
    else:
        OUTPUT.write_bytes(data)


if __name__ == "__main__":
    main()
