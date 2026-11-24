import copy
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "../tools"))
from release_checkout import CORE, GATES, validate

HEAD = "a" * 40


def receipt():
    return {
        "schemaVersion": 4, "head": HEAD, "baseline": "b" * 40,
        "lane": "standard", "scope": "synthetic fixture", "hard_blockers": [],
        "retained_optimization": False,
        "checks": {name: {"status": "passed", "evidence": "fixture", **({"holds": []} if name == "stack_freshness" else {})} for name in GATES},
        "core_tools": {name: {"status": "no_safe_win", "evidence": "fixture", "tool_version": "fixture", "command": name + " fixture"} for name in CORE},
    }


class ReleaseCheckoutTests(unittest.TestCase):
    def test_valid_receipt(self):
        self.assertEqual(validate(receipt(), HEAD), [])

    def test_wrong_head(self):
        self.assertTrue(validate(receipt(), "c" * 40))

    def test_mandatory_failure(self):
        r = receipt()
        r["checks"]["workflow_acceptance"]["status"] = "failed"
        self.assertTrue(validate(r, HEAD))

    def test_declared_extra_gate_failure(self):
        r = receipt()
        r["checks"]["native_game"] = {"status": "blocked", "evidence": "fixture"}
        self.assertTrue(validate(r, HEAD))

    def test_missing_core_assessment(self):
        r = receipt()
        del r["core_tools"][CORE[0]]
        self.assertTrue(validate(r, HEAD))

    def test_deferred_core_blocks_even_with_followup(self):
        r = receipt()
        r["core_tools"][CORE[0]]["status"] = "deferred"
        r["core_tools"][CORE[0]]["follow_up"] = "fixture backlog"
        self.assertTrue(validate(r, HEAD))

    def test_failed_core_blocks(self):
        r = receipt()
        r["core_tools"][CORE[0]]["status"] = "failed"
        self.assertTrue(validate(r, HEAD))

    def test_completed_core_requires_version_and_command(self):
        for field in ("tool_version", "command"):
            r = receipt()
            del r["core_tools"][CORE[0]][field]
            self.assertTrue(validate(r, HEAD))

    def test_not_applicable_requires_reason(self):
        r = receipt()
        r["core_tools"][CORE[0]] = {"status": "not_applicable", "evidence": "fixture: unsupported runtime"}
        self.assertEqual(validate(r, HEAD), [])
        r["core_tools"][CORE[0]]["evidence"] = ""
        self.assertTrue(validate(r, HEAD))

    def test_security_opt_in_is_advisory(self):
        for status in ("not_run", "failed", "findings", "blocked", "passed"):
            r = receipt()
            r["security_audits"] = {"safe-anything": {"status": status}}
            self.assertEqual(validate(r, HEAD), [])

    def test_legacy_schema_rejected(self):
        r = receipt()
        for version in (1, 2, 3):
            r["schemaVersion"] = version
            self.assertTrue(validate(r, HEAD))

    def test_stack_freshness_required(self):
        r = receipt()
        del r["checks"]["stack_freshness"]
        self.assertTrue(validate(r, HEAD))
        r["checks"]["stack_freshness"] = {"status": "failed", "evidence": "fixture"}
        self.assertTrue(validate(r, HEAD))

    def test_stack_freshness_requires_explicit_holds(self):
        r = receipt()
        del r["checks"]["stack_freshness"]["holds"]
        self.assertTrue(validate(r, HEAD))

    def test_hold_requires_fix_forward_evidence(self):
        hold = {
            "component": "fixture-library", "retained_version": "1.0",
            "candidate_version": "2.0", "reason": "fixture regression",
            "repair_status": "attempted_unresolved",
            "repair_evidence": "fixture repair and failed retest",
            "next_review": "next upstream release",
        }
        r = receipt()
        r["checks"]["stack_freshness"]["holds"] = [hold]
        self.assertEqual(validate(r, HEAD), [])
        for status in ("not_attempted", "deferred", "repaired", None):
            invalid = copy.deepcopy(r)
            invalid["checks"]["stack_freshness"]["holds"][0]["repair_status"] = status
            self.assertTrue(validate(invalid, HEAD))
        for field in ("component", "retained_version", "candidate_version",
                      "reason", "repair_evidence", "next_review"):
            invalid = copy.deepcopy(r)
            del invalid["checks"]["stack_freshness"]["holds"][0][field]
            self.assertTrue(validate(invalid, HEAD))
        invalid = copy.deepcopy(r)
        invalid["checks"]["stack_freshness"]["holds"][0]["candidate_version"] = "1.0"
        self.assertTrue(validate(invalid, HEAD))

    def test_infeasible_repair_requires_constraint_evidence(self):
        r = receipt()
        r["checks"]["stack_freshness"]["holds"] = [{
            "component": "fixture-runtime", "retained_version": "1",
            "candidate_version": "2", "reason": "fixed ABI",
            "repair_status": "infeasible", "repair_evidence": "fixture target restriction",
            "next_review": "on supported ABI release",
        }]
        self.assertEqual(validate(r, HEAD), [])
        r["checks"]["stack_freshness"]["holds"][0]["repair_evidence"] = ""
        self.assertTrue(validate(r, HEAD))

    def test_high_risk_requires_extra_proof(self):
        r = receipt()
        r["lane"] = "high-risk"
        self.assertTrue(validate(r, HEAD))
        r["checks"]["risk_specific"] = {"status": "passed", "evidence": "fixture"}
        self.assertEqual(validate(r, HEAD), [])

    def test_adopted_requires_equivalence(self):
        r = receipt()
        r["core_tools"][CORE[0]]["status"] = "adopted"
        self.assertTrue(validate(r, HEAD))
        r["retained_optimization"] = True
        self.assertTrue(validate(r, HEAD))
        r["checks"]["optimization_equivalence"] = {"status": "passed", "evidence": "fixture"}
        self.assertEqual(validate(r, HEAD), [])

    def test_blocker_cannot_be_ignored(self):
        r = receipt()
        r["hard_blockers"] = ["fixture blocker"]
        self.assertTrue(validate(r, HEAD))

    def test_cli_duplicate_keys_refused(self):
        script = Path(__file__).resolve().parent / "../tools/release_checkout.py"
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "receipt.json"
            path.write_text('{"head": 1, "head": 2}', encoding="utf-8")
            p = subprocess.run([sys.executable, str(script), "--receipt", str(path), "--head", HEAD], capture_output=True)
            self.assertEqual(p.returncode, 2)

    def test_cli_valid_and_mismatch(self):
        script = Path(__file__).resolve().parent / "../tools/release_checkout.py"
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "receipt.json"
            path.write_text(json.dumps(receipt()), encoding="utf-8")
            for head, expected in ((HEAD, 0), ("c" * 40, 1)):
                p = subprocess.run([sys.executable, str(script), "--receipt", str(path), "--head", head], capture_output=True)
                self.assertEqual(p.returncode, expected)


if __name__ == "__main__":
    unittest.main()
