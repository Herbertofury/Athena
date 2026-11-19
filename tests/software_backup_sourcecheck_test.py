"""Regression gates for the narrow independently source-checked backup batch."""
import importlib.util
import json
from pathlib import Path
import unittest
ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('builder', ROOT / 'scripts/build_software_catalog.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class BackupSourcecheckTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalog = builder.load_catalog()
        cls.apps = {a['id']: a for a in cls.catalog['applications']}

    def test_enrichment_does_not_add_duplicate_products(self):
        for product in ('syncthing', 'duplicati', 'rclone', 'photorec'):
            self.assertEqual(sum(a['id'] == product for a in self.catalog['applications']), 1)
        evidence = json.loads((ROOT/'research/backup-sourcecheck-2026-11-17/source-checks.json').read_text())
        self.assertEqual(evidence['new_products'], 0)
        self.assertEqual(len(evidence['checks']), 6)

    def test_specific_caveats_and_portable_boundary_survive_generation(self):
        self.assertIn('disabled by default', ' '.join(self.apps['syncthing']['limitations']))
        self.assertIn('changed locally', ' '.join(self.apps['syncthing']['limitations']))
        self.assertIn('--portable-mode', ' '.join(self.apps['duplicati']['features']))
        self.assertIn('not proof', ' '.join(self.apps['duplicati']['limitations']))
        self.assertIn('copy rather than sync', ' '.join(self.apps['rclone']['limitations']))
        self.assertEqual(self.apps['photorec']['official_url'], 'https://www.cgsecurity.org/wiki/PhotoRec')

    def test_claim_sources_and_guide_are_integrated(self):
        for product, suffix in [('syncthing','/users/versioning.html'),('duplicati','/duplicati-programs/server.md'),('rclone','/commands/rclone_sync/')]:
            self.assertTrue(any(s['url'].endswith(suffix) and s['checked_at']=='2026-11-17' and 'features' in s['supports'] for s in self.apps[product]['sources']))
        recipe = next(r for r in self.catalog['recipes'] if r['id']=='separate-sync-from-recovery')
        self.assertEqual({p['app_id'] for p in recipe['picks']}, {'syncthing','rclone','duplicati'})

if __name__ == '__main__':
    unittest.main()
