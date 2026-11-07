"""Wire-format regressions for the actual comparator CLIs; synthetic only."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from test_worker_sweep import fixture

ROOT = Path(__file__).resolve().parents[1]


class BenchmarkWireTests(unittest.TestCase):
    def run_cli(self, script, raw, optimized=False):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'input.json'
            path.write_text(raw, encoding='utf-8')
            command = [sys.executable] + (['-O'] if optimized else [])
            command += [str(ROOT / 'scripts' / script)]
            if script == 'compare_benchmarks.py':
                command.append(str(ROOT / 'tests/fixtures/synthetic-baseline.json'))
            command.append(str(path))
            return subprocess.run(command, capture_output=True, text=True, timeout=10)

    def test_both_clis_reject_contradictory_wire_fields(self):
        records = {
            'compare_benchmarks.py': (ROOT / 'tests/fixtures/synthetic-candidate.json').read_text(),
            'compare_worker_sweep.py': json.dumps(fixture()),
        }
        for script, raw in records.items():
            cases = [
                raw.replace('"schema": 1', '"schema": 99, "schema": 1', 1),
                raw.replace('"status": "complete"', '"status": "error", "status": "complete"', 1),
                raw.replace('"warnings": []', '"warnings": ["lost evidence"], "warnings": []', 1),
                raw.replace('"schema": 1', '"sch\\u0065ma": 99, "schema": 1', 1),
            ]
            cases += ['{"extra": ' + number + ',' + raw[1:] for number in ('NaN', 'Infinity', '-Infinity', '1e999')]
            for optimized in (False, True):
                for index, value in enumerate(cases):
                    with self.subTest(script=script, optimized=optimized, case=index):
                        result = self.run_cli(script, value, optimized)
                        self.assertEqual(result.returncode, 2, result.stderr)
                        self.assertEqual(result.stdout, '')
                        self.assertNotIn('Traceback', result.stderr)

    def test_valid_outputs_unchanged_in_both_modes(self):
        cases = [
            ('compare_benchmarks.py', (ROOT / 'tests/fixtures/synthetic-candidate.json').read_text()),
            ('compare_worker_sweep.py', json.dumps(fixture())),
        ]
        for script, raw in cases:
            outputs = []
            for optimized in (False, True):
                result = self.run_cli(script, raw, optimized)
                self.assertEqual(result.returncode, 0, result.stderr)
                outputs.append(json.loads(result.stdout))
            self.assertEqual(outputs[0], outputs[1])
            if script == 'compare_benchmarks.py':
                self.assertEqual(outputs[0]['ratio_of_medians'], 2)
            else:
                self.assertEqual(outputs[0]['suggested_workers_for_review'], 4)
                self.assertFalse(outputs[0]['accepted_in_application'])
