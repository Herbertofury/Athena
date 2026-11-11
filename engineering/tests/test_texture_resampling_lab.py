"""Offline contract tests. Real C execution is a separately recorded experiment."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / "experiments" / "texture-resampling-lab"
spec = importlib.util.spec_from_file_location("texture_resampling_lab", LAB / "run.py")
lab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lab)


class TextureResamplingTests(unittest.TestCase):
    def setUp(self):
        self.receipt = lab.read_json(LAB / "observed-2026-11-11.json")

    def reject(self, mutate):
        mutate(self.receipt)
        with self.assertRaises((ValueError, KeyError, TypeError)):
            lab.validate_receipt(self.receipt)

    def test_current_receipt(self):
        self.assertTrue(lab.validate_receipt(self.receipt))
        self.assertTrue(lab.validate_receipt(lab.read_json(LAB / "independent-replay-2026-11-11.json")))

    def test_fixture_identities(self):
        self.assertEqual(len(lab.fixtures()), 16)
        self.assertEqual([c["id"] for c in lab.fixtures()], lab.IDS)

    def test_known_output_values(self):
        expected = [[128]*3, [188]*3, [64]*3, [92]*3, [128]*3, [128]*3,
                    [0,0,255,128], [0,0,255,128], [128,0,128,128],
                    [188,0,188,188], [188,0,188,128], [128], [188],
                    [0.5,0,0.5,0.5], [0.25,0,0.25,0.5], [0.25,0,0.25,0.5]]
        self.assertEqual([o["output"] for o in self.receipt["observations"]], expected)

    def test_expected_bad_controls_are_preserved(self):
        bad = {o["id"] for o in self.receipt["observations"] if not o["matches_intended_contract"]}
        self.assertEqual(bad, {"color_bw_uint8", "color_mid_uint8", "edge_generic_linear",
                              "edge_generic_srgb", "edge_wrong_premultiplied", "scalar_srgb",
                              "float_double_weighted"})

    def test_all_cases_match_api_contract(self):
        self.assertTrue(all(o["matches_api_reference"] for o in self.receipt["observations"]))

    def test_transfer_endpoints(self):
        self.assertEqual(lab.decode(0), 0)
        self.assertEqual(lab.decode(1), 1)
        self.assertEqual(lab.encode(0), 0)
        self.assertAlmostEqual(lab.encode(1), 1)

    def test_transfer_round_trip(self):
        for value in [0, 0.001, 0.0031308, 0.01, 0.04045, 0.1, 0.5, 1]:
            with self.subTest(value=value):
                self.assertAlmostEqual(lab.encode(lab.decode(value)), value, places=7)

    def test_alpha_is_linear_in_rgba_srgb(self):
        obs = {o["id"]: o for o in self.receipt["observations"]}
        self.assertEqual(obs["edge_red_straight"]["output"][-1], 128)
        self.assertEqual(obs["edge_generic_srgb"]["output"][-1], 188)

    def test_hidden_colors_do_not_bleed_in_measured_straight_case(self):
        self.assertTrue(self.receipt["findings"]["hidden_rgb_outputs_equal"])

    def test_association_and_compositing_are_distinct(self):
        c = self.receipt["findings"]["linear_float_source_over_black"]
        self.assertEqual(c["float_straight"], c["float_premultiplied"])
        self.assertEqual(c["float_double_weighted"], [0.125, 0, 0.125])

    def test_mask_sample_count_is_not_preserved(self):
        f = self.receipt["findings"]
        self.assertEqual((f["original_two_pixel_mask_coverage"], f["filtered_one_pixel_mask_coverage"]), (0.5, 1.0))

    def test_duplicate_json_rejected(self):
        with self.assertRaises(ValueError): lab.parse_json('{"x":1,"x":2}')

    def test_nonfinite_json_rejected(self):
        for x in ["NaN", "Infinity", "-Infinity"]:
            with self.subTest(x=x), self.assertRaises(ValueError): lab.parse_json(x)

    def test_strict_type_comparison(self):
        self.assertFalse(lab.same(True, 1))
        self.assertFalse(lab.same(1, 1.0))

    def test_byte_budget(self):
        with tempfile.TemporaryDirectory() as t:
            p = Path(t)/"large"; p.write_bytes(b"12345")
            with self.assertRaises(ValueError): lab.read_bytes(p, 4)

    def test_receipt_extra_field(self): self.reject(lambda d: d.update(extra=True))
    def test_receipt_schema_type(self): self.reject(lambda d: d.update(schema_version=True))
    def test_receipt_scope(self): self.reject(lambda d: d.update(scope="GPU accepted"))
    def test_receipt_input_digest(self): self.reject(lambda d: d["inputs"].update({"driver.c": "0"*64}))
    def test_receipt_dependency_digest(self): self.reject(lambda d: d["dependency"].update(sha256="0"*64))
    def test_receipt_generated_cases(self): self.reject(lambda d: d.update(generated_cases_sha256="0"*64))
    def test_receipt_date(self): self.reject(lambda d: d.update(recorded_at="2026-02-30T00:00:00Z"))
    def test_receipt_environment_type(self): self.reject(lambda d: d["environment"].update(system=1))
    def test_receipt_compile_failure(self): self.reject(lambda d: d["compile"].update(returncode=1))
    def test_receipt_execution_failure(self): self.reject(lambda d: d["execution"].update(returncode=1))
    def test_receipt_command(self): self.reject(lambda d: d["compile"].update(command=["cc", "other.c"]))
    def test_receipt_binary_mismatch(self): self.reject(lambda d: d["execution"].update(binary_sha256="0"*64))
    def test_receipt_binary_shape(self): self.reject(lambda d: d["compile"].update(binary_sha256="bad"))
    def test_receipt_missing_output_row(self):
        self.reject(lambda d: d["execution"].update(stdout="\n".join(d["execution"]["stdout"].splitlines()[:-1])))
    def test_receipt_changed_observation(self): self.reject(lambda d: d["observations"][0].update(output=[0,0,0]))
    def test_receipt_changed_findings(self): self.reject(lambda d: d["findings"].update(hidden_rgb_outputs_equal=False))
    def test_receipt_changed_summary(self): self.reject(lambda d: d.update(all_expected=False))

    def test_raw_output_contract_rejections(self):
        rows = [json.loads(x) for x in self.receipt["execution"]["stdout"].splitlines()]
        for mutate in [lambda d: d[0].update(id="wrong"), lambda d: d[0].update(output=[0]),
                       lambda d: d[0].update(output=[256,0,0]), lambda d: d[0].update(output=[True,0,0]),
                       lambda d: d[0].update(output=[128.0,128.0,128.0])]:
            altered = copy.deepcopy(rows); mutate(altered)
            with self.assertRaises(ValueError): lab.observe("\n".join(json.dumps(x) for x in altered))

    def test_bad_raw_output_cannot_claim_success(self):
        rows = [json.loads(x) for x in self.receipt["execution"]["stdout"].splitlines()]
        rows[0]["output"] = [0,0,0]
        obs = lab.observe("\n".join(json.dumps(x) for x in rows))
        self.assertFalse(obs[0]["matches_declared_outcome"])

    def test_output_preservation_guard(self):
        with tempfile.TemporaryDirectory() as t:
            output = Path(t)/"receipt.json"; output.write_text("keep")
            with self.assertRaisesRegex(ValueError, "Output already exists"):
                lab.execute(Path(t)/"absent-header", output, "cc")
            self.assertEqual(output.read_text(), "keep")

    def test_partial_preservation_guard(self):
        with tempfile.TemporaryDirectory() as t:
            output = Path(t)/"receipt.json"; partial = Path(t)/"receipt.json.partial.json"
            partial.write_text("keep")
            with self.assertRaisesRegex(ValueError, "Output already exists"):
                lab.execute(Path(t)/"absent-header", output, "cc")
            self.assertEqual(partial.read_text(), "keep")

    def test_wrong_header_rejected_before_compilation(self):
        with tempfile.TemporaryDirectory() as t:
            header = Path(t)/"header"; header.write_text("wrong")
            with patch.object(lab.subprocess, "run") as process:
                with self.assertRaisesRegex(ValueError, "Header identity"):
                    lab.execute(header, Path(t)/"receipt.json", "cc")
                process.assert_not_called()

    def test_consistent_runtime_labels_are_not_attestation(self):
        self.receipt["environment"]["system"] = "unverified label"
        self.receipt["compile"]["binary_sha256"] = "a"*64
        self.receipt["execution"]["binary_sha256"] = "a"*64
        self.assertTrue(lab.validate_receipt(self.receipt))


if __name__ == "__main__": unittest.main()
