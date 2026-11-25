import importlib.util
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/route_game_dev.py"
spec = importlib.util.spec_from_file_location("game_route", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class Route(unittest.TestCase):
    def test_cartesian_valid_routes_and_conservative_unknown(self):
        for engine in module.ENGINES:
            for task in module.SOURCE_PER_TASK:
                with self.subTest(engine=engine, task=task):
                    if engine == module.CORE and task == "assets":
                        with self.assertRaisesRegex(ValueError, "no renderer"):
                            module.route(engine, task)
                        continue
                    row = module.route(engine, task)
                    self.assertEqual((row["engine"], row["task"]), (engine, task))
                    self.assertLessEqual(len(row["nextChecks"]), 3)
                    self.assertTrue(all((ROOT / c["read"]).is_file() for c in row["nextChecks"]))
                    self.assertIn("ran no engine", row["qualification"])
                    self.assertRegex(row["upstreamReference"], r"/blob/[a-f0-9]{40}/")
        with self.assertRaisesRegex(ValueError, "unknown hosts"):
            module.route("Unity", "replay")

    def test_real_catalog_and_distinct_invariants(self):
        card = module.route(module.CARD, "replay")
        rogue = module.route(module.ROGUE, "replay")
        self.assertNotEqual(card["nextChecks"][0]["read"], rogue["nextChecks"][0]["read"])
        self.assertIn("one zone", card["nextChecks"][1]["acceptance"])
        self.assertIn("next room", rogue["nextChecks"][1]["acceptance"])
        source = json.loads((ROOT / "engines/catalog.json").read_text())
        data = {p["id"]: p["status"] for p in source["packages"]}
        self.assertEqual(rogue["catalogStatus"], data[rogue["engine"]])

    def test_cli_relocates_without_external_dependencies_or_writes(self):
        with tempfile.TemporaryDirectory(prefix="Athena moved ") as temp:
            clone = Path(temp) / "portable copy"
            engine, task = module.ROGUE, "saves"
            data = module.route(engine, task)
            paths = ["scripts/route_game_dev.py", "engines/catalog.json", *(c["read"] for c in data["nextChecks"])]
            for path in paths:
                dest = clone / path
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(ROOT / path, dest)
            args = [sys.executable, "-I", "-B", str(clone / "scripts/route_game_dev.py"), "--engine", engine, "--task", task]
            before = {p: (clone / p).read_bytes() for p in paths}
            output = subprocess.run(args, cwd=temp, check=True, text=True, capture_output=True, timeout=10)
            self.assertEqual(json.loads(output.stdout), data)
            self.assertEqual({p: (clone / p).read_bytes() for p in paths}, before)
            self.assertEqual({str(p.relative_to(clone)).replace("\\", "/") for p in clone.rglob("*") if p.is_file()}, set(paths))
            missing = clone / data["nextChecks"][0]["read"]
            missing.unlink()
            refusal = subprocess.run(args, cwd=temp, text=True, capture_output=True, timeout=10)
            self.assertNotEqual(refusal.returncode, 0)
            self.assertEqual(refusal.stdout, "")
            self.assertIn("missing local reference", refusal.stderr)


if __name__ == "__main__":
    unittest.main()
