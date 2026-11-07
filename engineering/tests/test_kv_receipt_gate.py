import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / 'experiments/ordered-kv-lab/receipt_gate.py'
spec = importlib.util.spec_from_file_location('kv_receipt_gate', PATH)
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


def valid():
    return dict(schema_version=1, lane='sqlite', workload='public', rows=256,
                payload_bytes=1000, write_commit_ns=20, commit_ns=10,
                read_materialize_ns=5, database_bytes=4096,
                complete_output_equal=True, rollback_preserved=True,
                integrity=True, sqlite_version='3.54.1', redb_version='4.4.0')


def invalid_cases():
    result = []
    for key, value in [('lane', 'wrong'), ('workload', 'generated'), ('rows', True),
                       ('rows', 255), ('schema_version', True), ('schema_version', 2),
                       ('payload_bytes', 1), ('database_bytes', 8193),
                       ('sqlite_version', 'unknown'), ('redb_version', 'unknown'),
                       ('commit_ns', 21), ('write_commit_ns', 0),
                       ('read_materialize_ns', 1.5), ('commit_ns', True)]:
        item = valid(); item[key] = value; result.append(json.dumps(item))
    for key in ('complete_output_equal', 'rollback_preserved', 'integrity'):
        for value in (False, 1, 'true', None):
            item = valid(); item[key] = value; result.append(json.dumps(item))
    for key in valid():
        item = valid(); del item[key]; result.append(json.dumps(item))
    item = valid(); item['round'] = 99; result.append(json.dumps(item))
    result.extend(['[]', '{}', 'null', json.dumps(valid())[:-1]+',"rows":256}',
                   json.dumps(valid()).replace('"commit_ns": 10', '"commit_ns": NaN')])
    return result


class KVReceiptTests(unittest.TestCase):
    def test_valid_and_all_malformed_cases(self):
        self.assertEqual(gate.validate(json.dumps(valid()), 'sqlite', 'public', 1000, 8192), valid())
        for raw in invalid_cases():
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                gate.validate(raw, 'sqlite', 'public', 1000, 8192)

    def test_optimized_python_keeps_all_checks(self):
        program = '''import json,sys
from receipt_gate import validate
items=json.load(sys.stdin)
validate(items[0],'sqlite','public',1000,8192)
for raw in items[1:]:
 try: validate(raw,'sqlite','public',1000,8192)
 except ValueError: continue
 raise RuntimeError('Optimized interpreter accepted malformed receipt')
print(len(items)-1)
'''
        result = subprocess.run([sys.executable, '-O', '-c', program],
                                cwd=PATH.parent, input=json.dumps([json.dumps(valid()), *invalid_cases()]),
                                capture_output=True, text=True, timeout=10)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(int(result.stdout), len(invalid_cases()))

    def test_original_measurements_revalidate_without_changing_them(self):
        evidence = PATH.parent/'evidence'
        for file in ('budget64.json','diagnostic128.json','published-runner128.json'):
            receipt=json.loads((evidence/file).read_text())
            for sample in receipt['samples']:
                data={k:v for k,v in sample.items() if k!='round'}
                # Exact public byte total derived from retained source sizes.
                expected=(12840*86+7267*85+6200*85) if data['workload']=='public' else 256*65536
                gate.validate(json.dumps(data),data['lane'],data['workload'],expected,
                              64*1024*1024 if file=='budget64.json' else 128*1024*1024)
