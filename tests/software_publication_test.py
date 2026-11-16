"""The publication helper must not reapprove unrelated runtime changes."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location(
    "prepare_software_publication", Path(__file__).resolve().parents[1] / "scripts/prepare_software_publication.py"
)
publication = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(publication)


class PublicationBoundaryTests(unittest.TestCase):
    def fixture(self, root):
        files = [{"path": "app.js", "sha256": "preserve-reviewed-value", "note": "keep"}]
        for path in sorted(publication.SOFTWARE_PATHS):
            file = root / "dist" / path
            file.parent.mkdir(parents=True, exist_ok=True)
            file.write_text(path)
            files.append({"path": path, "sha256": "old"})
        config = {"schema": "preserve", "review": {"keep": True}, "files": files}
        target = root / "config/runtime-public-preview.json"
        target.parent.mkdir(parents=True)
        target.write_text(json.dumps(config))
        return target, config

    def test_unrelated_reviewed_files_and_metadata_are_preserved(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            target, before = self.fixture(root)
            hashes = publication.refresh_runtime_hashes(root)
            after = json.loads(target.read_text())
            self.assertEqual(after["files"][0], before["files"][0])
            self.assertEqual(after["review"], before["review"])
            self.assertEqual(after["schema"], before["schema"])
            self.assertEqual(set(hashes), publication.SOFTWARE_PATHS)
            self.assertTrue(all(len(value) == 64 for value in hashes.values()))

    def test_missing_or_duplicate_review_entries_fail_without_writing(self):
        for mode in ("missing", "duplicate"):
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as temp:
                root = Path(temp)
                target, config = self.fixture(root)
                if mode == "missing":
                    config["files"].pop()
                else:
                    config["files"].append(dict(config["files"][-1]))
                target.write_text(json.dumps(config))
                original = target.read_bytes()
                with self.assertRaises(ValueError):
                    publication.refresh_runtime_hashes(root)
                self.assertEqual(target.read_bytes(), original)


if __name__ == "__main__":
    unittest.main()
