import importlib.util
import json
import tempfile
import unittest
from pathlib import Path, PureWindowsPath

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('source_registry_test', ROOT / 'scripts/source_registry.py')
registry = importlib.util.module_from_spec(spec)
spec.loader.exec_module(registry)


class SourceRegistryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name) / 'repo'
        (self.root / 'data/sources.d').mkdir(parents=True)
        (self.root / 'data/sources.json').write_text('[{"id":"BASE01","unknown":{"keep":[1,null,"☃"]}}]')

    def shard(self, name, value):
        (self.root / 'data/sources.d' / name).write_text(value)

    def test_legacy_register_is_unchanged(self):
        expected = json.loads((self.root / 'data/sources.json').read_text())
        self.assertEqual(registry.load_sources(self.root), expected)

    def test_fragments_are_complete_and_deterministic(self):
        self.shard('z.json', '[{"id":"Z01","extra":null}]')
        self.shard('a.json', '[{"id":"A01","extra":[]}]')
        rows = registry.load_sources(self.root)
        self.assertEqual([r['id'] for r in rows], ['BASE01','A01','Z01'])
        self.assertEqual(rows[0]['unknown']['keep'], [1,None,'☃'])
        self.assertEqual(rows[1]['extra'], [])
        self.assertIsNone(rows[2]['extra'])

    def test_duplicate_ids_never_override(self):
        self.shard('a.json', '[{"id":"BASE01"}]')
        with self.assertRaises(ValueError): registry.load_sources(self.root)

    def test_malformed_or_contradictory_fragments_fail(self):
        for value in ['{}','[null]','[{"id":1}]','[{"id":"A01","id":"B01"}]','[{"id":"A01","extra":NaN}]']:
            self.shard('a.json', value)
            with self.subTest(value=value), self.assertRaises(ValueError): registry.load_sources(self.root)

    def test_path_escape_is_rejected_before_reading(self):
        outside = Path(self.tmp.name) / 'outside.json'
        outside.write_text('[{"id":"OUT01"}]')
        try: (self.root / 'data/sources.d/out.json').symlink_to(outside)
        except OSError: self.skipTest('Symlink unavailable')
        with self.assertRaisesRegex(ValueError, 'escapes'): registry.load_sources(self.root)

    def test_actual_register_preserves_every_baseline_row(self):
        baseline = json.loads((ROOT / 'data/sources.json').read_text())
        rows = registry.load_sources(ROOT)
        self.assertEqual(rows[:len(baseline)], baseline)
        expected = baseline + [row for p in sorted((ROOT / 'data/sources.d').glob('*.json')) for row in json.loads(p.read_text())]
        self.assertEqual(rows, expected)

    def test_manifest_must_enumerate_every_source_file(self):
        self.shard('a.json', '[{"id":"A01"}]')
        index = self.root / 'data/source-index.json'
        index.write_text(json.dumps({'schema_version':1,'files':['data/sources.json']}))
        with self.assertRaisesRegex(ValueError, 'complete file set'): registry.load_sources(self.root)
        index.write_text(json.dumps({'schema_version':1,'files':['data/sources.json','data/sources.d/a.json']}))
        self.assertEqual(len(registry.load_sources(self.root)), 2)

    def test_manifest_paths_are_portable_to_windows(self):
        root = PureWindowsPath('C:/atlas')
        self.assertEqual(registry.relative_source_names(root, [root/'data/sources.json', root/'data/sources.d/a.json']), ['data/sources.json','data/sources.d/a.json'])
