import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / 'experiments/upstream-validation-lab'
spec = importlib.util.spec_from_file_location('receipt_gate', LAB / 'receipt_gate.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class ReceiptDecodingTests(unittest.TestCase):
    def test_duplicate_keys_at_any_depth_are_rejected(self):
        for raw in ['{"source":"wrong","source":"hls"}',
                    '{"samples":[{"complete_record_equal":false,"complete_record_equal":true}]}',
                    '{"x":1,"x":1}', '{"x":1,"\\u0078":2}']:
            with self.subTest(raw=raw), self.assertRaisesRegex(ValueError, 'Duplicate'):
                gate.decode_receipt(raw)

    def test_nonfinite_constants_and_exponents_are_rejected(self):
        for value in ['NaN', 'Infinity', '-Infinity', '1e9999', '-1e9999']:
            with self.subTest(value=value), self.assertRaisesRegex(ValueError, 'Non-finite'):
                gate.decode_receipt('{"unknown":[' + value + ']}')

    def test_unknown_complete_fields_and_finite_numbers_survive(self):
        raw = '{"future":{"x":[1,2.25,1e-20,null,true,"雪"]},"sibling":{"x":4}}'
        self.assertEqual(gate.decode_receipt(raw), json.loads(raw))

    def test_malformed_and_concatenated_json_rejected(self):
        for raw in ['{}{}', '{"x":1,}', '{', '']:
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                gate.decode_receipt(raw)

    def test_all_retained_receipts_remain_complete(self):
        count = 0
        for path in sorted((LAB / 'final').glob('*.json')):
            if not path.name.startswith(('timing-', 'allocation-')):
                continue
            data = gate.decode_receipt(path.read_text())
            self.assertEqual(data, json.loads(path.read_text()))
            gate.validate_receipt(data, path.name.split('-')[0], data['source'],
                                  {'length': data['input_bytes'], 'sha256': data['input_sha256']})
            count += 1
        self.assertEqual(count, 16)

    def test_runner_decodes_before_measurement_acceptance(self):
        source = (LAB / 'run_local.py').read_text()
        self.assertIn('data=decode_receipt(result.stdout)', source)
        self.assertNotIn('json.loads(result.stdout)', source)

    def test_ci_discovers_every_javascript_contract(self):
        source = (ROOT / '.github/workflows/checks.yml').read_text()
        self.assertIn('node --test tests/*.test.mjs', source)
        self.assertTrue((ROOT / 'tests/media-events.test.mjs').is_file())


if __name__ == '__main__':
    unittest.main()
