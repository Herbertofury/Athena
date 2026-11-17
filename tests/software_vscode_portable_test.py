"""Data-only gates: no installed VS Code acceptance is inferred."""
import importlib.util
import json
from pathlib import Path
import unittest
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('builder', ROOT/'scripts/build_software_catalog.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class PortableEditorTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = builder.load_catalog()
        cls.apps = cls.catalog['applications']
        cls.app = next(a for a in cls.apps if a['id'] == 'vscode')

    def test_single_existing_identity_and_preserved_fields(self):
        self.assertEqual(sum(a['id'] == 'vscode' for a in self.apps), 1)
        self.assertEqual(sum(a.get('repository_url') == 'https://github.com/microsoft/vscode' for a in self.apps), 1)
        self.assertIn('VS Code', self.app['aliases'])
        self.assertEqual(self.app['license_kind'], 'mixed')
        self.assertEqual(self.app['maintenance']['checked_at'], '2026-11-14')
        self.assertEqual(self.app['alternatives'], ['VSCodium', 'Zed'])

    def test_explicit_distribution_and_storage_boundaries(self):
        text = ' '.join(self.app['features'] + self.app['limitations'])
        for term in ['ZIP', 'TAR.GZ', 'code-portable-data', 'installers', 'manual updates', 'system temporary', 'data/tmp', '--user-data-dir', '--extensions-dir', 'not a security boundary']:
            self.assertIn(term, text)
        self.assertIn('Integrated debugger', self.app['features'])
        self.assertTrue(any("Microsoft's downloaded product terms" in s for s in self.app['limitations']))

    def test_source_and_published_record(self):
        source = next(s for s in self.app['sources'] if s['url'] == 'https://code.visualstudio.com/docs/setup/portable')
        self.assertEqual(source['checked_at'], '2026-11-17')
        self.assertIn('features', source['supports'])
        published = json.loads((ROOT/'dist/workspaces/software/catalog.json').read_text())
        self.assertEqual(next(a for a in published['applications'] if a['id'] == 'vscode'), self.app)
        self.assertEqual(len(self.apps), 1069)

if __name__ == '__main__':
    unittest.main()
