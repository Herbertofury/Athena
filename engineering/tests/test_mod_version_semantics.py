"""Offline harness/receipt checks. Native upstream API replay is a separate command."""
import copy
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

LAB = Path(__file__).resolve().parents[1] / 'experiments/mod-version-semantics-lab'
SPEC = importlib.util.spec_from_file_location('mod_version_probe', LAB / 'run.py')
probe = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(probe)


class VersionSemanticsTests(unittest.TestCase):
    def setUp(self):
        self.fixture, _ = probe.strict_json(LAB / 'cases.json')
        self.receipt, _ = probe.strict_json(LAB / 'observed-2026-11-11.json')

    def test_fixture_is_explicitly_synthetic(self):
        self.assertEqual(len(probe.validate_cases(self.fixture)), 60)

    def test_retained_receipt_matches_current_sources(self):
        self.assertEqual(probe.validate_retained_receipt(self.receipt), 60)

    def test_duplicate_json_keys_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'value.json'; p.write_text('{"x":1,"x":2}')
            with self.assertRaisesRegex(ValueError, 'Duplicate'): probe.strict_json(p)

    def test_nonfinite_json_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'value.json'; p.write_text('{"x":NaN}')
            with self.assertRaisesRegex(ValueError, 'Non-finite'): probe.strict_json(p)

    def test_large_json_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / 'value.json'; p.write_bytes(b' ' * (probe.MAX_BYTES + 1))
            with self.assertRaisesRegex(ValueError, 'limit'): probe.strict_json(p)

    def test_boolean_schema_rejected(self):
        self.fixture['schema_version'] = True
        with self.assertRaises(ValueError): probe.validate_cases(self.fixture)

    def test_measured_fixture_label_rejected(self):
        self.fixture['kind'] = 'production'
        with self.assertRaises(ValueError): probe.validate_cases(self.fixture)

    def test_duplicate_case_rejected(self):
        self.fixture['cases'].append(self.fixture['cases'][0])
        with self.assertRaisesRegex(ValueError, 'duplicate'): probe.validate_cases(self.fixture)

    def test_extra_fields_rejected(self):
        self.fixture['cases'][0]['command'] = 'something'
        with self.assertRaises(ValueError): probe.validate_cases(self.fixture)

    def test_unknown_operation_rejected(self):
        self.fixture['cases'][0]['operation'] = 'launch_game'
        with self.assertRaises(ValueError): probe.validate_cases(self.fixture)

    def test_control_characters_rejected(self):
        for text in ['1\t2', '1\n2', '1\r2', '1\x002', '1\x7f2']:
            with self.subTest(text=repr(text)):
                f = copy.deepcopy(self.fixture); f['cases'][0]['left'] = text
                with self.assertRaises(ValueError): probe.validate_cases(f)

    def test_empty_version_input_is_preserved(self):
        cases = probe.validate_cases(self.fixture)
        self.assertEqual(next(c for c in cases if c['id'] == 'f-empty')['left'], '')

    def test_invalid_expected_value_rejected(self):
        self.fixture['cases'][0]['expected_value'] = 'compatible'
        with self.assertRaises(ValueError): probe.validate_cases(self.fixture)

    def test_unknown_expected_status_rejected(self):
        self.fixture['cases'][0]['expected_status'] = 'skipped'
        with self.assertRaises(ValueError): probe.validate_cases(self.fixture)

    def test_missing_rows_rejected(self):
        raw = '\n'.join(self.receipt['raw_stdout'].splitlines()[:-1])
        with self.assertRaises(ValueError): probe.decode_observations(raw, self.fixture['cases'])

    def test_extra_rows_rejected(self):
        raw = self.receipt['raw_stdout'] + self.receipt['raw_stdout'].splitlines()[0] + '\n'
        with self.assertRaises(ValueError): probe.decode_observations(raw, self.fixture['cases'])

    def test_reordered_rows_rejected(self):
        lines = self.receipt['raw_stdout'].splitlines(); lines[0], lines[1] = lines[1], lines[0]
        with self.assertRaises(ValueError): probe.decode_observations('\n'.join(lines), self.fixture['cases'])

    def test_truncated_detail_rejected(self):
        raw = self.receipt['raw_stdout'].replace('mc-build-metadata\tok\t-1\t', 'mc-build-metadata\tok\t-1', 1)
        with self.assertRaises(ValueError): probe.decode_observations(raw, self.fixture['cases'])

    def test_wrong_expected_result_retains_mismatch(self):
        self.fixture['cases'][0]['expected_value'] = '1'
        rows, mismatches = probe.decode_observations(self.receipt['raw_stdout'], self.fixture['cases'])
        self.assertEqual(mismatches, ['fc-build-metadata']); self.assertFalse(rows[0]['matches_expected'])

    def test_recommended_version_detail_is_checked(self):
        raw = self.receipt['raw_stdout'].replace('recommended=1.2.3;restrictions=1;hard=false', 'recommended=;restrictions=1;hard=true')
        _, mismatches = probe.decode_observations(raw, self.fixture['cases'])
        self.assertEqual(mismatches, ['m-bare-miss'])

    def test_receipt_aggregate_cannot_hide_failure(self):
        self.receipt['all_expected'] = False
        with self.assertRaises(ValueError): probe.validate_retained_receipt(self.receipt)

    def test_receipt_raw_output_must_match_rows(self):
        self.receipt['raw_stdout'] = self.receipt['raw_stdout'].replace('fc-build-metadata\tok\t0\t', 'fc-build-metadata\tok\t1\t', 1)
        with self.assertRaises(ValueError): probe.validate_retained_receipt(self.receipt)

    def test_receipt_input_identity_is_required(self):
        self.receipt['inputs']['cases_sha256'] = '0' * 64
        with self.assertRaises(ValueError): probe.validate_retained_receipt(self.receipt)

    def test_receipt_count_is_not_boolean(self):
        self.receipt['case_count'] = True
        with self.assertRaises(ValueError): probe.validate_retained_receipt(self.receipt)

    def test_receipt_time_must_be_utc(self):
        self.receipt['observed_at_utc'] = '2026-11-11T00:00:00'
        with self.assertRaises(ValueError): probe.validate_retained_receipt(self.receipt)

    def test_receipt_environment_is_required(self):
        self.receipt['environment']['java_version'] = ''
        with self.assertRaises(ValueError): probe.validate_retained_receipt(self.receipt)

    def test_receipt_scope_is_required_and_fixed(self):
        for scope in [None, 'Native Forge/NeoForge compatibility proven']:
            with self.subTest(scope=scope):
                value = copy.deepcopy(self.receipt)
                if scope is None: value.pop('scope')
                else: value['scope'] = scope
                with self.assertRaisesRegex(ValueError, 'scope'): probe.validate_retained_receipt(value)

    def mutate_result(self, case_id, status, value, detail):
        lines = self.receipt['raw_stdout'].splitlines()
        index = next(i for i, line in enumerate(lines) if line.startswith(case_id + '\t'))
        lines[index] = '\t'.join([case_id, status, value, detail])
        return '\n'.join(lines) + '\n'

    def test_impossible_result_values_rejected(self):
        for ident, value in [('fc-build-metadata', 'not-a-comparison'), ('fc-build-metadata', '2'), ('f-empty', 'maybe')]:
            with self.subTest(case=ident, value=value):
                raw = self.mutate_result(ident, 'ok', value, '')
                with self.assertRaisesRegex(ValueError, 'Impossible'): probe.decode_observations(raw, self.fixture['cases'])

    def test_impossible_result_details_rejected(self):
        for ident, value, detail in [('fc-build-metadata', '0', 'extra'), ('f-empty', 'true', 'extra'), ('m-bare-miss', 'true', 'hard=true')]:
            with self.subTest(case=ident):
                raw = self.mutate_result(ident, 'ok', value, detail)
                with self.assertRaises(ValueError): probe.decode_observations(raw, self.fixture['cases'])

    def test_impossible_parse_errors_rejected(self):
        for ident, value, detail in [('fc-build-metadata', '0', 'VersionParsingException'),
                                     ('fc-build-metadata', '', 'InvalidVersionSpecificationException'),
                                     ('mc-build-metadata', '', 'InvalidVersionSpecificationException'),
                                     ('m-bare-miss', '', 'VersionParsingException')]:
            with self.subTest(case=ident, value=value, detail=detail):
                raw = self.mutate_result(ident, 'parse_error', value, detail)
                with self.assertRaisesRegex(ValueError, 'Impossible'): probe.decode_observations(raw, self.fixture['cases'])

    def fake_manifest(self):
        return {'schema_version': 1, 'scope': 'test', 'artifacts': [
            {'name': name, 'url': 'https://example.invalid/' + name, 'bytes': 1, 'sha256': probe.digest(b'x')}
            for name in ['one.jar', 'two.jar']]}

    def test_matching_dependency_bytes_accepted(self):
        with tempfile.TemporaryDirectory() as d:
            for name in ['one.jar', 'two.jar']: (Path(d) / name).write_bytes(b'x')
            paths, _ = probe.verified_dependencies(d, self.fake_manifest()); self.assertEqual(len(paths), 2)

    def test_changed_dependency_bytes_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            (Path(d) / 'one.jar').write_bytes(b'y')
            with self.assertRaisesRegex(ValueError, 'mismatch'): probe.verified_dependencies(d, self.fake_manifest())

    def test_dependency_path_traversal_rejected(self):
        value = self.fake_manifest(); value['artifacts'][0]['name'] = '../one.jar'
        with self.assertRaises(ValueError): probe.verified_dependencies('.', value)

    def test_missing_dependency_does_not_download(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(FileNotFoundError): probe.verified_dependencies(d, self.fake_manifest())


if __name__ == '__main__':
    unittest.main()
