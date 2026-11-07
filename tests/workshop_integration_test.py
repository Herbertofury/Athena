"""Checks actual integrated data, docs, download bytes and deterministic output."""
from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
import zipfile

R = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(R / 'scripts'))
from workshop_content import LESSONS, PATHS, SOURCES, KEYS
C = json.loads((R / 'src/catalog.json').read_text())
BY_ID = {x['id']: x for x in C['lessons']}


class WorkshopIntegration(unittest.TestCase):
    def test_complete_nonoverlapping_inventory(self):
        self.assertEqual(len(C['lessons']), 90)
        self.assertEqual(len(BY_ID), 90)
        self.assertEqual(len(PATHS), 5)
        self.assertEqual(len(LESSONS), 42)
        self.assertEqual(C['learningPaths'][0]['id'], 'packet-trail')
        self.assertEqual(C['learningPaths'][1:], C['workshops'])
        self.assertEqual(Counter(x['answer'] for x in C['lessons']), {0:23,1:23,2:22,3:22})
        self.assertEqual(len(C['diagnosisCases']), 3)
        self.assertEqual(len(C['certifications']), 13)
        self.assertEqual(sum(len(x['domains']) for x in C['certifications']), 74)

    def test_composition_retains_every_authored_field(self):
        for source in LESSONS:
            actual = BY_ID[source['id']]
            with self.subTest(id=source['id']):
                for key, value in source.items():
                    if key not in ('options', 'answer'):
                        self.assertEqual(actual[key], value, key)
                self.assertEqual(set(actual['options']), set(source['options']))
                self.assertEqual(actual['options'][actual['answer']], source['options'][source['answer']])
                self.assertEqual(len(actual['additionalChecks']), 2)
                for check in [actual] + actual['additionalChecks']:
                    self.assertEqual(len(set(check['options'])), 4)
                    self.assertIn(check['answer'], range(4))
                    self.assertTrue(check['why'])

    def test_paths_prerequisites_downloads_and_sources(self):
        ids = set(BY_ID)
        self.assertEqual([len(x['lessonIds']) for x in PATHS], [10,8,8,8,8])
        for path in C['workshops']:
            self.assertTrue(set(path['lessonIds'] + path['prerequisites']) <= ids)
            self.assertEqual(path['caseIds'], [])
            self.assertTrue((R / 'dist' / path['downloadUrl']).is_file())
            self.assertEqual({BY_ID[x]['workshopId'] for x in path['lessonIds']}, {path['id']})
            self.assertTrue(path['sourceRegister'])
        for item in LESSONS:
            self.assertTrue(set(item['sources']) <= SOURCES.keys())
        self.assertTrue(all(url.startswith('https://') for url in SOURCES))

    def test_docs_and_wiki_expose_whole_lesson(self):
        for source in LESSONS:
            item = BY_ID[source['id']]
            doc = (R / 'docs/shared' / (item['id'] + '.md')).read_text()
            self.assertEqual(doc, (R / 'wiki' / ('shared-' + item['id'] + '.md')).read_text())
            for text in item['explain'] + item['lab'] + item['learningGoals'] + item['evidence'] + [item['limitations']]:
                self.assertIn(text, doc)
            for check in [item] + item['additionalChecks']:
                self.assertIn(check['question'], doc)
                self.assertIn(check['why'], doc)
            if item.get('workedCode'):
                self.assertIn(item['workedCode'], doc)
        self.assertEqual(sum(bool(x.get('workedCode')) for x in LESSONS), 16)

    def test_generated_runtime_catalog_matches_source(self):
        text = (R / 'dist/catalog.js').read_text()
        self.assertEqual(json.loads(text.removeprefix('globalThis.ATHENA_DATA = ').strip().removesuffix(';')), C)

    def test_each_download_has_safe_complete_manifest(self):
        for path in C['workshops']:
            with self.subTest(path=path['id']), zipfile.ZipFile(R / 'dist' / path['downloadUrl']) as archive:
                self.assertIsNone(archive.testzip())
                names = archive.namelist()
                self.assertEqual(len(names), len(set(names)))
                self.assertIn('README.md', names)
                self.assertTrue(any(x.startswith('tests/test_') for x in names))
                for name in names:
                    self.assertFalse(name.startswith('/'))
                    self.assertNotIn('..', Path(name).parts)
                    self.assertNotIn('__pycache__', name)
                    self.assertFalse(name.endswith('.cjs'))
                manifest = archive.read('MANIFEST.sha256').decode().splitlines()
                described = set()
                for line in manifest:
                    sha, name = line.split('  ', 1)
                    self.assertEqual(hashlib.sha256(archive.read(name)).hexdigest(), sha)
                    described.add(name)
                self.assertEqual(described, set(names) - {'MANIFEST.sha256'})

    def test_real_cloud_and_power_bi_limits_remain_explicit(self):
        cloud = next(x for x in PATHS if x['packKey'] == 'cloud')
        data = next(x for x in PATHS if x['packKey'] == 'data')
        self.assertIn('unexecuted', cloud['limits'])
        self.assertIn('not full PL-300', data['limits'])
        self.assertIn('unexecuted', C['coverageStatement'])


if __name__ == '__main__':
    unittest.main()
