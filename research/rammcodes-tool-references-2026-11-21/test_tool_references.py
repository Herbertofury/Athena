"""Offline documentation contract; this does not validate tool operation."""

import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parent
EXPECTED = {
    "rea": ("morluto/rea", "MIT", ["LICENSE"]),
    "craft-anything": (
        "storytold/craft-anything", "MIT OR Apache-2.0",
        ["LICENSE-MIT", "LICENSE-APACHE"],
    ),
    "rust-anything": ("erkamyaman/rust-anything", "MIT", ["LICENSE"]),
    "fast-anything": ("EL4CTEO/fast-anything", "MIT", ["LICENSE"]),
}


def reject_duplicate_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError(f"duplicate key: {key}")
        result[key] = value
    return result


class ToolReferencesContract(unittest.TestCase):
    def setUp(self):
        self.ledger = json.loads(
            (ROOT / "tool-references.json").read_text(encoding="utf-8"),
            object_pairs_hook=reject_duplicate_keys,
        )
        self.readme = (ROOT / "README.md").read_text(encoding="utf-8")

    def test_reference_only_scope_and_exact_discovery_inputs(self):
        self.assertEqual(self.ledger["classification"], "reference_only")
        self.assertEqual(self.ledger["schema"], "athena.research.tool-references/1")
        self.assertEqual(
            self.ledger["verification"],
            {
                "upstream_documentation_reviewed": True,
                "executed": False,
                "benchmarked": False,
                "portability_verified": False,
                "runtime_catalog_admitted": False,
            },
        )
        self.assertEqual(self.ledger["discovery_sources"], [
            "https://x.com/rammcodes/status/2124218896546992453",
            "https://x.com/rammcodes/status/2124218899952750662",
        ])
        for source in self.ledger["discovery_sources"]:
            self.assertIn(f"]({source})", self.readme)

    def test_each_exact_repository_occurs_once_with_pinned_evidence(self):
        tools = self.ledger["tools"]
        self.assertEqual([tool["id"] for tool in tools], list(EXPECTED))
        self.assertEqual(len({tool["comparison_role"] for tool in tools}), 4)
        for tool in tools:
            with self.subTest(tool=tool["id"]):
                repo, license_text, license_files = EXPECTED[tool["id"]]
                url = f"https://github.com/{repo}"
                self.assertEqual(tool["repository"], url)
                self.assertIn(f"]({url})", self.readme)
                self.assertEqual(tool["license"], license_text)
                self.assertEqual(tool["evidence_origin"], "upstream_documentation")
                revision = tool["source_revision"]
                self.assertIsNotNone(re.fullmatch(r"[0-9a-f]{40}", revision))
                pin = f"{url}/blob/{revision}/"
                self.assertEqual(tool["sources"]["documentation"], [pin + "README.md"])
                self.assertIn(f"]({pin}README.md)", self.readme)
                self.assertEqual(tool["sources"]["license"], [
                    pin + name for name in license_files
                ])
                self.assertTrue(tool["boundary"].strip())

    def test_pending_rea_study_is_not_duplicated_or_required(self):
        tools = self.ledger["tools"]
        self.assertEqual(tools[0]["official_website"], "https://rea.tools/")
        self.assertEqual(tools[0]["existing_athena_work"], {
            "status_at_review": "pending_draft",
            "url": "https://github.com/Herbertofury/Athena/pull/283",
            "dependency": False,
        })
        for tool in tools[1:]:
            self.assertIsNone(tool["existing_athena_work"])


if __name__ == "__main__":
    unittest.main()
