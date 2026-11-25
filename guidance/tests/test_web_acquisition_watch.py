import json
import sys
import threading
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
        self.assertEqual(len({x["repository"].lower() for x in data["watch"]}), len(data["watch"]))

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

    def test_every_repository_is_observed_without_quantity_cap(self):
        data = {"schemaVersion": 1, "watch": [{"repository": f"example/item{i}"} for i in range(41)]}
        report = collect(data, lambda *args: ({"tag_name": "v1", "items": []}, None))
        self.assertEqual([item["repository"] for item in report["releases"]],
                         [item["repository"] for item in data["watch"]])
        self.assertTrue(all(item["status"] == "observed" for item in report["releases"]))

    def test_validation_finishes_before_any_fetch(self):
        for invalid in [None, {}, {"schemaVersion": 1, "watch": [None]},
                        {"schemaVersion": 1, "watch": [{"repository": "ok/repo"}, {}]}]:
            calls = []
            with self.assertRaises(ValueError):
                collect(invalid, lambda *args: calls.append(args))
            self.assertEqual(calls, [])
        for workers in [0, -1, 1.5, True]:
            with self.assertRaises(ValueError):
                collect(fixture(), workers=workers)

    def test_overlapping_requests_preserve_input_order(self):
        first_started = threading.Event()
        second_finished = threading.Event()
        data = {"schemaVersion": 1, "watch": [{"repository": "example/slow"},
                                             {"repository": "example/fast"}]}
        def fetch(endpoint, fields=()):
            if endpoint.endswith("slow/releases/latest"):
                first_started.set()
                if not second_finished.wait(3):
                    raise RuntimeError("requests did not overlap")
            elif endpoint.endswith("fast/releases/latest"):
                if not first_started.wait(3):
                    raise RuntimeError("first request did not start")
                second_finished.set()
            return {"tag_name": "v1", "items": []}, None
        report = collect(data, fetch, workers=2)
        self.assertTrue(second_finished.is_set())
        self.assertEqual([item["repository"] for item in report["releases"]],
                         ["example/slow", "example/fast"])
        self.assertTrue(all(item["status"] == "observed" for item in report["releases"]))

    def test_failure_isolated_and_serial_mode_matches_concurrent(self):
        data = {"schemaVersion": 1, "watch": [{"repository": "example/broken"},
                                             {"repository": "example/ok"}]}
        def fetch(endpoint, fields=()):
            if "broken" in endpoint:
                raise OSError("synthetic unavailable source")
            return {"tag_name": "v1", "items": []}, None
        serial = collect(data, fetch, workers=1)
        concurrent = collect(data, fetch, workers=4)
        for report in [serial, concurrent]:
            report.pop("observedAt")
        self.assertEqual(serial, concurrent)
        self.assertEqual(serial["releases"][0]["reason"], "fetch_exception")
        self.assertEqual(serial["releases"][1]["status"], "observed")

    def test_all_discovery_pages_are_preserved(self):
        def fetch(endpoint, fields=()):
            if endpoint.startswith("repos/"):
                return {"tag_name": "v1"}, None
            page = int(dict(field.split("=", 1) for field in fields)["page"])
            start, end = (0, 100) if page == 1 else (100, 137)
            return {"total_count": 137, "items": [
                {"full_name": f"discovered/item{i}", "private": False}
                for i in range(start, end)]}, None
        report = collect(fixture(), fetch)
        for row in report["discovery"]:
            self.assertEqual(len(row["candidates"]), 137)
            self.assertEqual(row["pages"], 2)
            self.assertEqual(row["unresolvedCount"], 0)
            self.assertFalse(row["incompleteResults"])

    def test_later_page_failure_retains_earlier_complete_page(self):
        def fetch(endpoint, fields=()):
            if endpoint.startswith("repos/"):
                return {"tag_name": "v1"}, None
            page = int(dict(field.split("=", 1) for field in fields)["page"])
            if page == 2:
                return None, "request_failed"
            return {"total_count": 101, "items": [
                {"full_name": f"discovered/item{i}", "private": False}
                for i in range(100)]}, None
        row = collect(fixture(), fetch)["discovery"][0]
        self.assertEqual(len(row["candidates"]), 100)
        self.assertEqual(row["status"], "partial")
        self.assertEqual(row["unresolvedCount"], 1)
        self.assertEqual(row["reason"], "request_failed")

    def test_provider_search_window_is_explicit_not_complete(self):
        def fetch(endpoint, fields=()):
            if endpoint.startswith("repos/"):
                return {"tag_name": "v1"}, None
            page = int(dict(field.split("=", 1) for field in fields)["page"])
            return {"total_count": 1201, "items": [
                {"full_name": f"discovered/item{page * 100 + i}", "private": False}
                for i in range(100)]}, None
        row = collect(fixture(), fetch)["discovery"][0]
        self.assertEqual(len(row["candidates"]), 1000)
        self.assertEqual(row["unresolvedCount"], 201)
        self.assertEqual(row["status"], "partial")
        self.assertEqual(row["reason"], "github_search_window")

    def test_malformed_discovery_is_never_claimed_complete(self):
        for payload in [{}, {"items": None}, {"items": [None, {"full_name": 7}]},
                        {"items": [], "total_count": 9},
                        {"items": [], "incomplete_results": True}]:
            row = collect(fixture(), lambda *args: (payload, None))["discovery"][0]
            self.assertIn(row["status"], ["partial", "unavailable"])
            self.assertTrue(row["incompleteResults"])

    def test_duplicate_results_do_not_hide_missing_coverage(self):
        def fetch(endpoint, fields=()):
            if endpoint.startswith("repos/"):
                return {"tag_name": "v1"}, None
            return {"total_count": 2, "items": [
                {"full_name": "example/new", "private": False},
                {"full_name": "EXAMPLE/new", "private": False}]}, None
        row = collect(fixture(), fetch)["discovery"][0]
        self.assertEqual(len(row["candidates"]), 1)
        self.assertEqual(row["duplicateCount"], 1)
        self.assertEqual(row["unresolvedCount"], 1)
        self.assertEqual(row["status"], "partial")


if __name__ == "__main__":
    unittest.main()
