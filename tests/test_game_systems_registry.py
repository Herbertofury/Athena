import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("validate_game_systems", ROOT / "scripts" / "validate_game_systems.py")
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)

def candidate():
    repo = "Herbertofury/JetSetCraft"
    commit = "a" * 40
    path = "src/main/java/com/example/RushRun.java"
    return {"repository": repo, "commit": commit, "path": path,
            "source": f"https://github.com/{repo}/blob/{commit}/{path}",
            "evidence": "source_inspected_not_runtime_verified",
            "observed": "Seeded server-owned run state.", "limits": "Source inspection only."}

def registry():
    return {"capabilities": [{"id": cap_id, "name": cap_id, "status": "comparison_needed",
            "canonicalImplementation": None, "contractRefs": ["docs/GAME-SYSTEMS-EXCHANGE.md"],
            "researchRefs": [], "candidates": [candidate()], "nextAction": "Compare with a second compatible host."}
            for cap_id in sorted(MODULE.REQUIRED_IDS)]}

class GameSystemsRegistryTests(unittest.TestCase):
    def test_real_registry_is_valid(self):
        data = json.loads((ROOT / "guidance/registry/shared-capabilities.json").read_text(encoding="utf-8"))
        self.assertEqual(MODULE.validate(data), [])

    def test_schema_files_are_valid_json_and_versioned(self):
        for name in ("game-system-package.schema.json", "card-definition.schema.json",
                     "card-game-state.schema.json", "roguelike-run-snapshot.schema.json"):
            schema = json.loads((ROOT / "guidance/schemas" / name).read_text(encoding="utf-8"))
            self.assertEqual(schema["$schema"], "https://json-schema.org/draft/2020-12/schema")
            self.assertEqual(schema["type"], "object")

    def test_rejects_duplicate_capability_ids(self):
        data = registry()
        data["capabilities"].append(dict(data["capabilities"][0]))
        self.assertTrue(any("duplicate capability IDs" in error for error in MODULE.validate(data)))

    def test_rejects_source_url_not_bound_to_exact_revision(self):
        data = registry()
        data["capabilities"][0]["candidates"][0]["source"] = "https://github.com/Herbertofury/JetSetCraft/blob/main/README.md"
        self.assertTrue(any("source URL must bind" in error for error in MODULE.validate(data)))

    def test_rejects_unverified_canonical_implementation(self):
        data = registry()
        data["capabilities"][0]["canonicalImplementation"] = {"repository": "Herbertofury/JetSetCraft"}
        self.assertTrue(any("canonical implementation requires verified status" in error for error in MODULE.validate(data)))

    def test_card_engine_stays_a_gap_until_real_host_acceptance(self):
        data = registry()
        row = next(x for x in data["capabilities"] if x["id"] == "gameplay.card-game-engine")
        row["status"] = "verified"
        self.assertTrue(any("keep status comparison_needed" in error for error in MODULE.validate(data)))

if __name__ == "__main__":
    unittest.main()
