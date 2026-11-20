"""Independent regressions for preservation, product identity and evidence routes."""
import copy
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


builder = load_module("software_qa_builder", "scripts/build_software_catalog.py")
links = load_module("software_qa_links", "scripts/check_software_links.py")


class IntegrationRegressions(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = builder.load_catalog()
        cls.by_id = {a["id"]: a for a in cls.catalog["applications"]}

    def test_alternative_names_and_renames_link_to_existing_products(self):
        expected = {
            "db-browser-sqlite": {"letos", "dbeaver"},
            "heidisql": {"letos", "dbeaver"},
            "pgadmin": {"dbeaver", "jetbrains-datagrip"},
        }
        for app_id, targets in expected.items():
            with self.subTest(app_id=app_id):
                self.assertTrue(targets <= set(self.by_id[app_id]["alternative_ids"]))
                self.assertEqual(self.by_id[app_id]["alternatives_outside_catalog"], [])

    def test_ambiguous_aliases_fail_instead_of_silently_repointing_recommendations(self):
        original_read = builder.read

        def altered_read(path):
            value = original_read(path)
            if path == "data/software/development.json":
                value = copy.deepcopy(value)
                app = next(a for a in value["applications"] if a["id"] == "jan")
                app["aliases"] = [*app.get("aliases", []), "DB Browser for SQLite"]
            return value

        with patch.object(builder, "read", side_effect=altered_read):
            with self.assertRaisesRegex(ValueError, "Ambiguous product alias"):
                builder.load_catalog()

    def test_distinct_products_with_plus_signs_and_shared_brand_names_survive(self):
        self.assertIn("memtest86-plus", self.by_id)
        self.assertIn("memtest86", self.by_id)
        self.assertNotEqual(self.by_id["memtest86-plus"]["official_url"], self.by_id["memtest86"]["official_url"])
        self.assertIn("dolphin", self.by_id)
        self.assertIn("dolphin-file-manager", self.by_id)
        self.assertNotEqual(self.by_id["dolphin"]["category_id"], self.by_id["dolphin-file-manager"]["category_id"])
        self.assertNotEqual(self.by_id["dolphin"]["repository_url"], self.by_id["dolphin-file-manager"]["repository_url"])

    def test_all_cleanup_rows_survive_with_exclusion_and_unranked_context(self):
        path = "research/developer-cleanup-2026-11-14/catalog.json"
        source = json.loads((ROOT / path).read_text())
        rows = [r for r in self.catalog["research_records"] if r["origin"] == path]
        self.assertEqual(len(rows), sum(len(source[k]) for k in ("tools", "unranked", "excluded")))
        originals = [r["original"] for r in rows]
        for classification in ("tools", "unranked", "excluded"):
            for record in source[classification]:
                with self.subTest(name=record["name"], classification=classification):
                    self.assertIn(record, originals)
                    if classification != "tools":
                        retained = next(r for r in rows if r["original"] == record)
                        self.assertIn(classification, retained["kind"])
                        self.assertIn("not a recommended", retained["evidence_status"])


    def test_unavailable_annotation_rejects_an_observation_for_a_different_url(self):
        original_read = builder.read
        def changed(path):
            data = original_read(path)
            if path == "research/software-expansion-2026-11-15/research-availability-review.json":
                data = copy.deepcopy(data)
                data["records"][0]["observations"][0]["url"] = "https://unrelated.example/"
            return data
        with patch.object(builder, "read", side_effect=changed):
            with self.assertRaisesRegex(ValueError, "matching dated HTTP evidence"):
                builder.apply_research_availability(copy.deepcopy(self.catalog["research_records"]))

    def test_license_filter_classification_does_not_use_unrelated_proprietary_mentions(self):
        expected = {
            "libresprite": "open-source",
            "blockbench": "open-source",
            "armorpaint": "open-source",
            "duplicati": "mixed",
            # The current vendor binary uses MIT-style terms, but application
            # source availability is unresolved. Do not turn that license text
            # into a verified open-source classification.
            "everything": "unknown",
        }
        for app_id, classification in expected.items():
            with self.subTest(app_id=app_id):
                self.assertEqual(self.by_id[app_id]["license_kind"], classification)
        # The amended display classification must never rewrite original research.
        original = next(a for a in builder.read(builder.LEGACY)["tools"] if a["id"] == "libresprite")
        self.assertEqual(self.by_id["libresprite"]["legacy"], original)

    def test_exact_maintenance_evidence_is_published_and_collected_for_audit(self):
        app = self.by_id["activitywatch"]
        evidence = app["maintenance"]["source_url"]
        self.assertTrue(evidence)
        wiki = builder.markdown(self.catalog)
        self.assertIn(evidence, wiki["wiki/Software-" + app["family"].title() + ".md"])
        refs = links.collect_urls(self.catalog)[evidence]
        self.assertTrue(any(r.get("app_id") == app["id"] and r.get("field") == "maintenance" for r in refs))

    def test_unavailable_research_annotation_preserves_original_and_requires_bound_evidence(self):
        row = next(r for r in self.catalog["research_records"] if r["id"] == "cleanup-research-60")
        original = builder.read("research/developer-cleanup-2026-11-14/catalog.json")["tools"][59]
        self.assertEqual(row["original"], original)
        self.assertEqual(row["official_url"], original["download"])
        self.assertEqual(row["availability"]["status"], "unavailable")
        original_read = builder.read
        for field, value in (("research_id", "current-app"), ("expected_original_url", "https://different.example/"), ("evidence_sha256", "0" * 64)):
            def changed(path):
                data = original_read(path)
                if path == "data/software/research-availability.json":
                    data = copy.deepcopy(data)
                    data["records"][0][field] = value
                return data
            with self.subTest(field=field), patch.object(builder, "read", side_effect=changed):
                with self.assertRaises(ValueError):
                    builder.apply_research_availability(copy.deepcopy(self.catalog["research_records"]))


class SourceAuditRegressions(unittest.TestCase):
    """Exercise the command's exit status and receipt without any network access."""

    def audit(self, active_uses_missing_url=False, unavailable_history=False, recovered=False, excluded_unavailable=False, missing_status=404):
        missing = "https://projects.example/historical-exclusion"
        current = "https://projects.example/current-application"
        catalog = {
            "applications": [{
                "id": "current-app", "official_url": missing if active_uses_missing_url else current,
                "download_url": None, "repository_url": None, "sources": [],
                "maintenance": {"source_url": None},
            }],
            "research_records": [{"id": "cleanup-excluded-1", "official_url": missing}],
        }
        if unavailable_history:
            catalog["research_records"] = [{"id": "cleanup-excluded-1" if excluded_unavailable else "cleanup-research-60", "official_url": missing,
                "availability": {"status": "unavailable", "checked_at": "2026-11-16"}}]

        def observed(url, timeout=15):
            status = missing_status if url == missing and not recovered else 200
            return {
                "url": url, "status": status, "outcome": links.classify(status),
                "checked_at": "2026-11-15T00:00:00+00:00", "final_url": url, "method": "HEAD",
            }

        with tempfile.TemporaryDirectory(prefix="athena-software-audit-qa-") as temporary:
            root = Path(temporary)
            catalog_path, report_path = root / "catalog.json", root / "report.json"
            catalog_path.write_text(json.dumps(catalog))
            arguments = ["check_software_links.py", "--catalog", str(catalog_path), "--output", str(report_path), "--workers", "1", "--strict"]
            with patch.object(sys, "argv", arguments), patch.object(links, "check_url", side_effect=observed), contextlib.redirect_stdout(io.StringIO()):
                status = links.main()
            return status, json.loads(report_path.read_text())

    def test_confirmed_current_410_still_fails_strict_gate(self):
        status, report = self.audit(active_uses_missing_url=True, missing_status=410)
        self.assertEqual(status, 1)
        self.assertEqual(report["actionable_not_found"], 1)

    def test_known_excluded_404_is_retained_but_does_not_fail_current_catalog_gate(self):
        status, report = self.audit()
        self.assertEqual(status, 0)
        self.assertTrue(report["completed"])
        self.assertEqual(report["summary"]["not_found"], 1)
        self.assertEqual(report["actionable_not_found"], 0)
        historical = next(r for r in report["results"] if r["status"] == 404)
        self.assertTrue(historical["excluded_history_only"])
        self.assertEqual(historical["references"][0]["research_id"], "cleanup-excluded-1")

    def test_exclusion_does_not_hide_a_dead_link_also_used_by_a_current_application(self):
        status, report = self.audit(active_uses_missing_url=True)
        self.assertEqual(status, 1)
        self.assertEqual(report["actionable_not_found"], 1)
        self.assertFalse(report["results"][0]["excluded_history_only"])
        self.assertTrue(any(r.get("app_id") == "current-app" for r in report["results"][0]["references"]))

    def test_unavailable_history_stays_audited_and_cannot_hide_an_application_failure(self):
        status, report = self.audit(unavailable_history=True)
        self.assertEqual(status, 0)
        self.assertEqual(report["historical_not_found"], 1)
        self.assertEqual(report["actionable_not_found"], 0)
        self.assertFalse(next(x for x in report["results"] if x["status"] == 404)["excluded_history_only"])
        status, report = self.audit(active_uses_missing_url=True, unavailable_history=True)
        self.assertEqual(status, 1)
        self.assertEqual(report["actionable_not_found"], 1)
        self.assertEqual(report["historical_not_found"], 0)
        status, report = self.audit(unavailable_history=True, recovered=True)
        self.assertEqual(status, 0)
        self.assertEqual(report["unavailable_history_now_reachable"], 1)
        status, report = self.audit(unavailable_history=True, recovered=True, excluded_unavailable=True)
        self.assertEqual(status, 0)
        self.assertEqual(report["unavailable_history_now_reachable"], 1)
        self.assertTrue(any(x["excluded_history_only"] for x in report["results"]))


if __name__ == "__main__":
    unittest.main()
