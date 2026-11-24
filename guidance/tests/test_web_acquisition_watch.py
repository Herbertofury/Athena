import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "../tools"))
from web_acquisition_watch import CATALOG, collect


def fixture():
    return {"schemaVersion": 1, "watch": [{"repository": "example/fixture",
                                          "initialRelease": {"tag": "v1"}}]}


class WebAcquisitionWatchTests(unittest.TestCase):
    def test_seed_registry(self):
        data = json.loads(CATALOG.read_text(encoding="utf-8"))
        self.assertIn("firecrawl/firecrawl", [x["repository"] for x in data["watch"]])
        self.assertIn("XiaoYouChR/Ghost-Downloader-3", [x["repository"] for x in data["watch"]])
        self.assertLessEqual(len(data["watch"]), 40)

    def test_release_and_public_discovery(self):
        def fetch(endpoint, fields=()):
            if endpoint.startswith("repos/"):
                return {"tag_name": "v2", "draft": False, "prerelease": False}, None
            return {"items": [{"full_name": "example/fixture", "private": False},
                              {"full_name": "example/new", "private": False},
                              {"full_name": "example/private", "private": True}]}, None
        report = collect(fixture(), fetch)
        self.assertTrue(report["releases"][0]["differsFromInitial"])
        self.assertEqual(report["discovery"][0]["candidates"][0]["repository"], "example/new")
        self.assertEqual(len(report["discovery"][0]["candidates"]), 1)

    def test_unavailable_is_not_current(self):
        report = collect(fixture(), lambda *args: (None, "request_failed"))
        self.assertEqual(report["releases"][0]["status"], "unavailable")
        self.assertNotIn("tag", report["releases"][0])

    def test_prerelease_not_stable(self):
        report = collect(fixture(), lambda *args: ({"tag_name": "v2-beta", "prerelease": True}, None))
        self.assertEqual(report["releases"][0]["status"], "unavailable")

    def test_duplicate_rejected(self):
        data = fixture()
        data["watch"].append({"repository": "EXAMPLE/fixture"})
        with self.assertRaises(ValueError):
            collect(data, lambda *args: (None, "request_failed"))

    def test_budget(self):
        data = {"schemaVersion": 1, "watch": [{"repository": f"example/item{i}"} for i in range(41)]}
        with self.assertRaises(ValueError):
            collect(data, lambda *args: (None, "request_failed"))


if __name__ == "__main__":
    unittest.main()
