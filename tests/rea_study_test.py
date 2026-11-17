"""Original integrity checks for Athena's bounded REA study, not REA runtime tests."""
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
STUDY = ROOT / 'research/rea-source-study-2026-11-17/study.json'

class ReaStudyTest(unittest.TestCase):
    def setUp(self):
        self.study = json.loads(STUDY.read_text())

    def test_canonical_pinned_identity(self):
        self.assertEqual(self.study['repository_url'], 'https://github.com/morluto/rea')
        self.assertRegex(self.study['commit'], r'^[a-f0-9]{40}$')
        self.assertEqual(self.study['study_status'], 'partial-source-review')
        self.assertEqual(self.study['runtime_status'], 'not-installed-or-executed')

    def test_sources_are_bounded_and_hashed(self):
        sources = self.study['source_files']
        self.assertEqual(len({s['path'] for s in sources}), len(sources))
        for source in sources:
            with self.subTest(path=source['path']):
                self.assertRegex(source['sha256'], r'^[a-f0-9]{64}$')
                start, end = source['reviewed_lines']
                self.assertLessEqual(1, start)
                self.assertLessEqual(start, end)
                self.assertLessEqual(end, source['total_lines'])
                self.assertEqual(source['url'], f"{self.study['repository_url']}/blob/{self.study['commit']}/{source['path']}#L{start}-L{end}")
                self.assertFalse(source['runtime_tested'])

    def test_claims_cite_reviewed_paths_and_do_not_claim_implementation(self):
        paths = {s['path'] for s in self.study['source_files']}
        ids = set()
        for claim in self.study['claims']:
            self.assertNotIn(claim['id'], ids)
            ids.add(claim['id'])
            self.assertTrue(claim['source_paths'])
            self.assertTrue(set(claim['source_paths']) <= paths)
            self.assertEqual(claim['application_status'], 'proposed-not-implemented')
            self.assertTrue(claim['athena_application'])

    def test_coverage_never_equates_enumeration_with_review(self):
        paths = {s['path'] for s in self.study['source_files']}
        for item in self.study['coverage_queue']:
            self.assertGreater(item['file_count'], 0)
            reviewed = item['selected_reviewed_files']
            self.assertEqual(item['status'], 'partially-reviewed' if reviewed else 'queued')
            self.assertTrue(set(reviewed) <= paths)
            self.assertTrue(all(p.startswith(item['module'] + '/') for p in reviewed))

    def test_catalog_ingestion_has_exact_tool_and_caveats(self):
        source = json.loads((ROOT/'data/software/rea-expanded.json').read_text())['applications'][0]
        generated = json.loads((ROOT/'dist/workspaces/software/catalog.json').read_text())
        self.assertEqual(source['id'], 'rea')
        self.assertEqual(source['repository_url'], self.study['repository_url'])
        self.assertGreaterEqual(len(source['limitations']), 4)
        matches = [app for app in generated['applications'] if app['id'] == 'rea']
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0]['name'], source['name'])
        self.assertEqual(matches[0]['repository_url'], source['repository_url'])
        self.assertEqual(matches[0]['limitations'], source['limitations'])
        self.assertIn(self.study['commit'], matches[0]['maintenance']['note'])

if __name__ == '__main__':
    unittest.main()
