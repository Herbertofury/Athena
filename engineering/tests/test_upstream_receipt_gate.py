import copy
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / 'experiments/upstream-validation-lab'
spec = importlib.util.spec_from_file_location('receipt_gate', LAB / 'receipt_gate.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)

class ReceiptGateTests(unittest.TestCase):
    def receipt(self, kind):
        return json.loads((LAB / 'final' / f'{kind}-hls-0.json').read_text())

    def validate(self, data, kind):
        gate.validate_receipt(data, kind, 'hls',
                              {'length': 4670, 'sha256': self.receipt(kind)['input_sha256']})

    def test_retained_valid_receipts(self):
        for kind in ('timing', 'allocation'):
            self.validate(self.receipt(kind), kind)

    def test_rejects_incomplete_or_misbound_receipts(self):
        mutations = [
            ('empty samples', lambda d: d.update(samples=[])),
            ('truncated samples', lambda d: d['samples'].pop()),
            ('duplicate round', lambda d: d['samples'][1].update(round=0)),
            ('wrong source', lambda d: d.update(source='rustsec')),
            ('wrong digest', lambda d: d.update(input_sha256='0' * 64)),
            ('wrong length', lambda d: d.update(input_bytes=1)),
            ('truthy parity', lambda d: d['samples'][0].update(complete_record_equal='true')),
            ('changed default', lambda d: d.update(default_parser_changed=True)),
        ]
        for kind in ('timing', 'allocation'):
            for name, mutate in mutations:
                with self.subTest(kind=kind, mutation=name):
                    data = self.receipt(kind)
                    mutate(data)
                    with self.assertRaises(ValueError):
                        self.validate(data, kind)

    def test_rejects_invalid_timing(self):
        for field, value in [('iterations', 0), ('iterations', 1), ('baseline_ns', -1),
                             ('candidate_ns', float('nan')), ('warmup', 'false')]:
            with self.subTest(field=field, value=value):
                d = self.receipt('timing')
                d['samples'][0][field] = value
                with self.assertRaises(ValueError): self.validate(d, 'timing')

    def test_rejects_invalid_allocation(self):
        for field, value in [('allocation_calls', -1), ('peak_requested_rust_bytes_above_start', True),
                             ('total_successfully_requested_bytes', 0)]:
            with self.subTest(field=field, value=value):
                d = self.receipt('allocation')
                d['samples'][0]['baseline'][field] = value
                with self.assertRaises(ValueError): self.validate(d, 'allocation')

    def test_all_published_final_receipts(self):
        for path in sorted((LAB / 'final').glob('*.json')):
            if not path.name.startswith(('timing-', 'allocation-')): continue
            d = json.loads(path.read_text())
            gate.validate_receipt(d, path.name.split('-')[0], d['source'],
                                 {'length': d['input_bytes'], 'sha256': d['input_sha256']})

if __name__ == '__main__': unittest.main()
