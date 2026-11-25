import importlib.util
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("verify_engine_intake", ROOT / "scripts" / "verify_engine_intake.py")
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class EngineIntakeTests(unittest.TestCase):
    def test_all_source_snapshots_match_exact_upstream_blobs(self):
        self.assertEqual(MODULE.verify(), [])

    def test_catalog_has_three_flagship_engines_and_shared_runtime(self):
        catalog = json.loads((ROOT / "engines/catalog.json").read_text(encoding="utf-8"))
        ids = {row["id"] for row in catalog["packages"]}
        self.assertTrue({"athena.card-game", "athena.roguelite", "athena.mascot-open-world", "athena.shared-game-runtime"} <= ids)

    def test_card_game_source_inventory_and_consumer_drift_are_explicit(self):
        manifest = json.loads((ROOT / "engines/card-game/SOURCE-MANIFEST.json").read_text(encoding="utf-8"))
        self.assertEqual(len(manifest["files"]), 23)
        self.assertEqual(manifest["consumerComparison"]["identical"], 19)
        self.assertEqual({x["file"] for x in manifest["consumerComparison"]["diverged"]}, {"board.js", "cardgame.css", "deck-select.js", "screens.js"})

    def test_world_engine_discloses_hybrid_spatial_model_and_external_renderer(self):
        manifest = json.loads((ROOT / "engines/mascot-open-world/SOURCE-MANIFEST.json").read_text(encoding="utf-8"))
        self.assertEqual(len(manifest["files"]), 16)
        self.assertTrue(any(x["license"] == "MIT" and x["copied"] is False for x in manifest["externalDependencies"]))


if __name__ == "__main__":
    unittest.main()
