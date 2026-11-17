"""The workflow map is navigation, never executable instructions or a pass receipt."""
import copy
import json
from pathlib import Path, PurePosixPath
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]


def validate_map(data, root):
    if set(data) != {'schemaVersion', 'scope', 'workflows'} or data['schemaVersion'] != 1:
        raise ValueError('unsupported map schema')
    if not isinstance(data['scope'], str) or not data['scope'].strip():
        raise ValueError('missing scope')
    if not isinstance(data['workflows'], list) or not data['workflows']:
        raise ValueError('missing workflows')
    ids = set()
    for workflow in data['workflows']:
        if not isinstance(workflow, dict) or set(workflow) != {'id', 'entryPoint', 'sources', 'checks', 'expected'}:
            raise ValueError('invalid workflow fields; receipts do not belong in the map')
        for key in ('id', 'entryPoint', 'expected'):
            if not isinstance(workflow[key], str) or not workflow[key].strip():
                raise ValueError('missing workflow description')
        if workflow['id'] in ids:
            raise ValueError('duplicate workflow id')
        ids.add(workflow['id'])
        for key in ('sources', 'checks'):
            paths = workflow[key]
            if not isinstance(paths, list) or not paths:
                raise ValueError('missing file references')
            for value in paths:
                if not isinstance(value, str) or not value or '\\' in value or ':' in value:
                    raise ValueError('invalid path')
                path = PurePosixPath(value)
                if path.is_absolute() or '..' in path.parts:
                    raise ValueError('out-of-repository path')
                target = root / value
                if not target.resolve().is_relative_to(root.resolve()) or not target.is_file():
                    raise ValueError('missing or escaping file reference')


class VerificationMapTests(unittest.TestCase):
    def setUp(self):
        self.data = json.loads((ROOT / 'guidance/registry/verification-map.json').read_text())

    def test_repository_references_exist(self):
        validate_map(self.data, ROOT)

    def test_bad_references_and_claims_fail(self):
        for value in ('../private', '/tmp/private', 'C:\\private', 'missing-file', 'https://example.com/run'):
            bad = copy.deepcopy(self.data)
            bad['workflows'][0]['checks'] = [value]
            with self.subTest(value=value), self.assertRaises(ValueError):
                validate_map(bad, ROOT)
        for mutate in (
            lambda d: d['workflows'].append(d['workflows'][0]),
            lambda d: d['workflows'][0].update(passed=True),
            lambda d: d['workflows'][0].update(expected=''),
            lambda d: d['workflows'][0].update(checks=[]),
            lambda d: d.update(schemaVersion=2),
        ):
            bad = copy.deepcopy(self.data)
            mutate(bad)
            with self.assertRaises(ValueError):
                validate_map(bad, ROOT)

    def test_valid_neighbor_does_not_require_execution_or_receipts(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'source.py').write_text('raise RuntimeError("must not execute")')
            good = {'schemaVersion': 1, 'scope': 'fixture', 'workflows': [
                {'id': 'fixture', 'entryPoint': 'local fixture', 'sources': ['source.py'],
                 'checks': ['source.py'], 'expected': 'only file existence is checked'}]}
            validate_map(good, root)


if __name__ == '__main__':
    unittest.main()
