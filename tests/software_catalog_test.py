"""Data-preservation and provenance gates for the published software catalog."""
import copy
import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]


def module(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    result = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(result)
    return result


builder = module("software_builder", "scripts/build_software_catalog.py")
links = module("software_links", "scripts/check_software_links.py")


class CatalogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = builder.load_catalog()

    def test_original_records_survive_in_full_and_counts_are_reconciled(self):
        original = builder.read(builder.LEGACY)["tools"]
        retained = {a["id"]: a["legacy"] for a in self.catalog["applications"] if "legacy" in a}
        self.assertEqual(retained, {a["id"]: a for a in original})
        c = self.catalog["counts"]
        self.assertEqual(c["applications"], c["new_applications"] + len(original))
        self.assertEqual(c["applications"], sum(c["by_family"].values()))
        self.assertEqual(c["categories"], len(self.catalog["categories"]))
        self.assertGreater(c["new_applications"], 0)

    def test_duplicate_identity_is_rejected_even_when_name_and_id_change(self):
        a = copy.deepcopy(self.catalog["applications"][0])
        b = copy.deepcopy(a); b.update(id="different-display-name", name="Different display name")
        with self.assertRaisesRegex(ValueError, "duplicate official identity"):
            builder.validate([a, b])

    def test_product_identity_retains_meaningful_unicode_and_punctuation(self):
        self.assertEqual(builder.product_key("µManager"), builder.product_key("μManager"))
        self.assertNotEqual(builder.product_key("µManager"), builder.product_key("Manager"))
        self.assertNotEqual(builder.product_key("MemTest86+"), builder.product_key("MemTest86"))
        self.assertEqual(builder.product_key("DB Browser for SQLite"), "db-browser-for-sqlite")

    def test_maintenance_and_source_claims_cannot_be_invented_without_evidence(self):
        a = copy.deepcopy(self.catalog["applications"][0])
        a["maintenance"].update(status="active", source_url=None)
        a["sources"][0]["supports"] = ["benchmark-winner"]
        with self.assertRaises(ValueError) as error:
            builder.validate([a])
        self.assertIn("maintenance assertion needs a source", str(error.exception))
        self.assertIn("invalid source claims", str(error.exception))

    def test_impossible_review_dates_are_rejected(self):
        a = copy.deepcopy(self.catalog["applications"][0])
        a["maintenance"]["checked_at"] = "2026-02-30"
        a["sources"][0]["checked_at"] = "2026-13-01"
        with self.assertRaises(ValueError) as error:
            builder.validate([a])
        self.assertIn("maintenance review date missing or invalid", str(error.exception))
        self.assertIn("source review date missing or invalid", str(error.exception))

    def test_known_fields_require_claim_specific_sources(self):
        a = copy.deepcopy(next(x for x in self.catalog["applications"]
                               if x["evidence_status"] != "legacy-research" and x["pricing_model"] != "unknown"))
        for s in a["sources"]:
            s["supports"] = [x for x in s["supports"] if x != "pricing"] or ["identity"]
        with self.assertRaisesRegex(ValueError, "missing claim-specific sources: pricing"):
            builder.validate([a])
        a["pricing_model"] = "unknown"
        builder.validate([a])

    def test_task_capabilities_require_known_ids_conditions_and_cited_feature_evidence(self):
        original = next(a for a in self.catalog["applications"] if a["id"] == "gpt4all")
        for mutation, message in [
            (lambda a: a["capabilities"][0].update(id="invented-task"), "unknown capability"),
            (lambda a: a["capabilities"][0].update(conditions=[]), "capability needs conditions"),
            (lambda a: a["capabilities"][0].update(source_urls=["https://example.com/unsupported"]), "cited feature evidence"),
            (lambda a: a.update(capabilities=a["capabilities"] * 2), "duplicate capability"),
        ]:
            with self.subTest(message=message):
                app = copy.deepcopy(original)
                mutation(app)
                with self.assertRaisesRegex(ValueError, message): builder.validate([app])
        app = copy.deepcopy(original)
        for source in app["sources"]:
            if source["url"] in app["capabilities"][0]["source_urls"]: source["supports"] = ["identity"]
        with self.assertRaisesRegex(ValueError, "cited feature evidence"): builder.validate([app])

    def test_second_expansion_preserves_all_published_application_ids(self):
        baseline = builder.read("research/software-expansion-2026-11-15/baseline.json")
        self.assertTrue(set(baseline["application_ids"]) <= {a["id"] for a in self.catalog["applications"]})

    def test_measurements_bind_targets_to_checked_raw_data_and_exact_evidence(self):
        original_read = builder.read
        document = copy.deepcopy(original_read("data/software/evaluations.json"))
        document["evaluations"][0]["data_sha256"] = "0" * 64
        with patch.object(builder, "read", side_effect=lambda p: document if p == "data/software/evaluations.json" else original_read(p)):
            with self.assertRaisesRegex(ValueError, "evidence hash mismatch"):
                builder.evaluation_registry({a["id"] for a in self.catalog["applications"]})
        document = copy.deepcopy(original_read("data/software/evaluations.json"))
        document["evaluations"][0]["tool_app_ids"]["ripgrep-auto"] = "invented-product"
        with patch.object(builder, "read", side_effect=lambda p: document if p == "data/software/evaluations.json" else original_read(p)):
            with self.assertRaisesRegex(ValueError, "versions must map"):
                builder.evaluation_registry({a["id"] for a in self.catalog["applications"]})

    def test_taxonomy_alternatives_and_recommendations_have_real_targets(self):
        ids = {a["id"] for a in self.catalog["applications"]}
        categories = {c["id"] for c in self.catalog["categories"]}
        for c in self.catalog["categories"]:
            self.assertEqual(c["count"], len(c["application_ids"]))
            self.assertEqual(set(c["application_ids"]), {a["id"] for a in self.catalog["applications"] if a["category_id"] == c["id"]})
        for a in self.catalog["applications"]:
            self.assertIn(a["category_id"], categories)
            self.assertTrue(set(a["alternative_ids"]) <= ids)
            self.assertNotIn(a["id"], a["alternative_ids"])
        for recipe in self.catalog["recipes"]:
            self.assertGreaterEqual(len(recipe["picks"]), 2)
            self.assertEqual(len({p["app_id"] for p in recipe["picks"]}), len(recipe["picks"]))
            for p in recipe["picks"]:
                self.assertIn(p["app_id"], ids)
                self.assertTrue(p["reason"] and p["tradeoff"])

    def test_refresh_queue_separates_review_age_from_product_status(self):
        current = builder.coverage_report(self.catalog, builder.REVIEWED)
        later = builder.coverage_report(self.catalog, "2027-03-01")
        self.assertFalse(any("latest source review older than 90 days" in a["reasons"] for a in current["refresh_queue"]))
        self.assertTrue(all("latest source review older than 90 days" in a["reasons"] for a in later["refresh_queue"]))
        self.assertEqual(len(later["refresh_queue"]), len(self.catalog["applications"]))
        self.assertEqual(later["counts"]["by_maintenance"], current["counts"]["by_maintenance"])

    def test_fresh_homepage_does_not_hide_an_overdue_license_source(self):
        catalog = copy.deepcopy(self.catalog)
        app = catalog["applications"][0]
        old_source = dict(app["sources"][0], checked_at="2025-01-01", supports=["license"])
        app["sources"].append(old_source)
        report = builder.coverage_report(catalog, builder.REVIEWED)
        record = next(item for item in report["refresh_queue"] if item["app_id"] == app["id"])
        self.assertIn("some cited sources older than 90 days", record["reasons"])
        source = next(item for item in report["source_refresh_queue"] if item["url"] == old_source["url"])
        self.assertTrue(any(ref["app_id"] == app["id"] and ref["supports"] == ["license"] for ref in source["references"]))
        self.assertGreater(report["source_urls_due_for_review"], 0)

    def test_link_audit_does_not_confuse_access_blocks_with_missing_pages(self):
        for status in [200, 206]: self.assertEqual(links.classify(status), "reachable")
        for status in [404, 410]: self.assertEqual(links.classify(status), "not_found")
        for status in [401, 403]: self.assertEqual(links.classify(status), "access_blocked")
        self.assertEqual(links.classify(429), "rate_limited")
        self.assertEqual(links.classify(503), "server_error")
        self.assertEqual(links.public_url("https://example.com/docs?q=one#part", resolve=False), "https://example.com/docs?q=one")
        for url in ["file:///etc/passwd", "https://user:secret@example.com", "http://localhost/test", "javascript:alert(1)"]:
            with self.assertRaises(ValueError): links.public_url(url, resolve=False)


if __name__ == "__main__":
    unittest.main()
