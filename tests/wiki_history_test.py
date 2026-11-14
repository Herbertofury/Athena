"""Partial wiki sync must retain ownership evidence for untouched pages."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('wiki_sync_history', ROOT/'scripts/sync_wiki.py')
wiki = importlib.util.module_from_spec(spec)
spec.loader.exec_module(wiki)


class WikiHistoryTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='athena-wiki-history-')
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source, self.target = self.root/'source', self.root/'target'
        self.source.mkdir()
        self.target.mkdir()

    def write(self, name, text):
        (self.source/name).write_text(text)

    def manifest(self):
        return json.loads((self.target/'.athena-managed.json').read_text())

    def snapshot(self):
        return {p.name:p.read_bytes() for p in self.target.iterdir()}

    def initial(self):
        self.write('A.md', 'First A')
        self.write('B.md', 'First B')
        self.assertEqual(wiki.sync(self.source, self.target), 2)

    def test_partial_sync_retains_hash_for_absent_source_page(self):
        self.initial()
        expected = self.manifest()['B.md']
        (self.source/'B.md').unlink()
        self.write('A.md', 'Updated A')
        self.assertEqual(wiki.sync(self.source, self.target), 1)
        self.assertEqual(self.manifest()['B.md'], expected)
        self.assertEqual((self.target/'B.md').read_text(), 'First B')
        self.assertEqual(self.manifest()['A.md'], wiki.digest('Updated A'))

    def test_a_returning_page_can_be_updated_without_manual_repair(self):
        self.initial()
        (self.source/'B.md').unlink()
        wiki.sync(self.source, self.target)
        self.write('B.md', 'Updated B')
        self.assertEqual(wiki.sync(self.source, self.target), 2)
        self.assertEqual((self.target/'B.md').read_text(), 'Updated B')

    def test_absent_page_user_edit_is_not_adopted_as_managed(self):
        self.initial()
        original = self.manifest()['B.md']
        (self.source/'B.md').unlink()
        (self.target/'B.md').write_text('Manual B')
        wiki.sync(self.source, self.target)
        self.assertEqual(self.manifest()['B.md'], original)
        self.write('A.md', 'Should not land')
        self.write('B.md', 'Generated B')
        before = self.snapshot()
        with self.assertRaisesRegex(ValueError, 'user-edited'):
            wiki.sync(self.source, self.target)
        self.assertEqual(self.snapshot(), before)

    def test_empty_source_preserves_exact_manifest_bytes_and_all_pages(self):
        self.initial()
        manifest = self.target/'.athena-managed.json'
        manifest.write_text(json.dumps(self.manifest(), separators=(',', ':')))
        for path in self.source.iterdir():
            path.unlink()
        (self.target/'User.md').write_text('Unmanaged notes')
        before = self.snapshot()
        self.assertEqual(wiki.sync(self.source, self.target), 0)
        self.assertEqual(self.snapshot(), before)

    def test_initial_empty_source_does_not_create_tracking_file(self):
        self.assertEqual(wiki.sync(self.source, self.target), 0)
        self.assertEqual(self.snapshot(), {})

    def test_missing_or_regular_file_source_fails_without_writes(self):
        self.initial()
        before = self.snapshot()
        file_source = self.root/'not-a-directory'
        file_source.write_text('Synthetic')
        for source in (self.root/'missing', file_source):
            with self.subTest(source=source.name), self.assertRaisesRegex(ValueError, 'source.*directory'):
                wiki.sync(source, self.target)
            self.assertEqual(self.snapshot(), before)


if __name__ == '__main__':
    unittest.main()
