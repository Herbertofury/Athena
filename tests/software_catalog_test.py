"""Data-preservation and provenance gates for the published software catalog."""
import copy
import importlib.util
from pathlib import Path
import unittest

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
