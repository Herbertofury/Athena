"""Offline target checks: an archive map is neither a redirect nor proof of HTTP availability."""
import importlib.util
import json
from pathlib import Path
import unittest
from urllib.parse import unquote, urlsplit
ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = ROOT / 'migration/engineering-atlas/metadata-2026-11-14'
class PublishedTargets(unittest.TestCase):
    def test_every_claimed_file_and_wiki_destination_exists(self):
        for row in json.loads((SNAPSHOT / 'source-link-inventory.json').read_text()):
            destination = row['preserved_or_native_destination']
            if not destination:
                continue
            with self.subTest(source=row['original']):
                parts = urlsplit(destination)
                if parts.path.startswith('/Herbertofury/Athena/blob/main/'):
                    path = unquote(parts.path.removeprefix('/Herbertofury/Athena/blob/main/'))
                    self.assertTrue((ROOT / path).is_file(), path)
                elif parts.path.startswith('/Herbertofury/Athena/wiki/'):
                    page = unquote(parts.path.removeprefix('/Herbertofury/Athena/wiki/'))
                    self.assertTrue((ROOT / 'wiki' / (page + '.md')).is_file(), page)
                elif not parts.scheme:
                    self.assertTrue((ROOT / destination).is_file(), destination)
SPEC = importlib.util.spec_from_file_location("atlas_source_links", ROOT / "scripts/reconcile_atlas_source_links.py")
mapper = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mapper)

class MappingSemantics(unittest.TestCase):
    def mapped(self, url):
        row = {'original': url, 'locations': ['synthetic-fixture']}
        result = mapper.reconcile(row)
        self.assertEqual(result['original'], row['original'])
        self.assertEqual(result['locations'], row['locations'])
        return result
    def test_existing_athena_path_is_not_prefixed_again(self):
        url = mapper.ATHENA + '/blob/main/migration/engineering-atlas/README.md'
        self.assertEqual(self.mapped(url)['preserved_or_native_destination'], url)
    def test_missing_files_and_wiki_pages_remain_explicitly_unresolved(self):
        for path in ['blob/main/docs/adapters/discourse.md', 'wiki/Adapter-Round-Four-Other-Games']:
            row = self.mapped('https://github.com/Herbertofury/Engineering-Atlas/' + path)
            self.assertIsNone(row['preserved_or_native_destination'])
            self.assertTrue(row['classification'].startswith('unresolved'))
    def test_research_routes_keep_query_instead_of_losing_selection(self):
        row = self.mapped('https://herbertofury.github.io/Engineering-Atlas/explorer/?plan=planned-agent-protocol-v1#catalog')
        self.assertEqual(row['preserved_or_native_destination'], mapper.PAGES + '?plan=planned-agent-protocol-v1#research')
    def test_static_asset_is_not_falsely_replaced_with_homepage(self):
        suffix = 'card-receiver-lab/receiver.de24fd43535f3039.js'
        row = self.mapped('https://herbertofury.github.io/Engineering-Atlas/' + suffix)
        self.assertEqual(row['preserved_or_native_destination'], mapper.PAGES + 'engineering/docs/' + suffix)
    def test_creation_route_is_not_a_preserved_issue_body(self):
        row = self.mapped('https://github.com/Herbertofury/Engineering-Atlas/issues/new/choose')
        self.assertEqual(row['preserved_or_native_destination'], mapper.ATHENA + '/issues/new/choose')
        self.assertTrue(row['classification'].startswith('active destination issue creation'))
    def test_unknown_discussion_or_host_does_not_claim_identity(self):
        for url in ['https://github.com/Herbertofury/Engineering-Atlas/pull/99999',
                    'https://github.com.example.org/Herbertofury/Engineering-Atlas/blob/main/README.md']:
            self.assertIsNone(self.mapped(url)['preserved_or_native_destination'])
    def test_current_snapshot_is_reproducible(self):
        self.assertEqual(mapper.update(check=True), {'rows': 826, 'unresolved': 19})

if __name__ == '__main__': unittest.main()
