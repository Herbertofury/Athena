"""Stored actual public observations, with no live network or raw package fixtures."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / 'experiments/npm-metadata-lab'


class NpmMetadataReceiptTests(unittest.TestCase):
    def setUp(self):
        self.r = json.loads((LAB / 'public-validation-2026-11-11.json').read_text())

    def test_exact_actual_captures_and_implementation(self):
        r = self.r
        self.assertEqual(r['captureCount'], 3)
        self.assertEqual(r['capturedBytes'], 48345)
        self.assertEqual([v['bytes'] for v in r['captures']], [36183, 9995, 2167])
        self.assertEqual([v['sha256'] for v in r['captures']], [
            '8fdfbca6f95aa058e4e228ec3a4dc76b5b0a9f53354f06681a3effb2fca7ef92',
            '6349bc63a22af726dda304587581b3446abf1abd094e4700bbfa522f0a707300',
            '13a030af24dcf7e91b59b5106a6d023df294010be3e930eea1c676e006548246'])
        self.assertTrue(all(v['status'] == 200 and v['complete'] is True for v in r['captures']))
        for p in (LAB / 'metadata.py', ROOT / 'experiments/site-extraction-lab/extractors.py'):
            self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(), r['implementationSha256'][p.name])
        self.assertEqual(r['officialContract']['repositoryCommit'], 'ae49abf1bac0ec1a3f3f1fceea1cca6fe2dc00e1')

    def test_scope_omissions_and_actual_projection_limit(self):
        r = self.r
        full, abbreviated, standalone = r['selectedVersionReplay']['observations']
        self.assertEqual([v['state'] for v in (full, abbreviated, standalone)], ['metadata_observed', 'metadata_observed', 'provenance_mismatch'])
        self.assertEqual([v['versionCount'] for v in (full, abbreviated)], [15, 15])
        self.assertEqual([v['representation'] for v in (full, abbreviated)], ['full', 'abbreviated'])
        self.assertEqual(full['selectedVersionSha256'], abbreviated['selectedVersionSha256'])
        self.assertNotEqual(full['selectedVersionSha256'], r['explicitTagReplay']['observations'][0]['selectedVersionSha256'])
        self.assertEqual(full['rootReadme'], {'state': 'present', 'bytes': 6514, 'sha256': '8e676a0587ba350889df0a5fb883aeab26609ee36432e29441f55af3a0cb16ba', 'projectionState': 'incomplete_projection', 'mediaCount': 0})
        self.assertEqual(abbreviated['rootReadme']['state'], 'missing')
        self.assertTrue(all(v['selectedReadme']['state'] == 'missing' for v in (full, abbreviated)))
        for field in ('description', 'author', 'license', '_npmUser', 'maintainers'):
            self.assertEqual(full['selectedFields'][field], 'present')
            self.assertEqual(abbreviated['selectedFields'][field], 'missing')
        self.assertEqual(r['actualComparisons'], {'sameVersionKeySet': True, 'sameTagMap': True, 'standaloneObjectEqualsSelectedVersion': True, 'abbreviatedSharedFieldsEqualFull': True, 'rootAndSelectedDescriptionDiffer': True, 'versionObjectsWithReadme': 0, 'sourceReadmeImageMarkers': 4, 'projectedMediaReferences': 0, 'projectionComplete': False})
        for key in ('networkUsedByNormalizer', 'credentialsUsed', 'packageCodeExecuted', 'liveRestrictedAccessObserved'):
            self.assertIs(r[key], False)
        for key in ('packageArchivesFetched', 'mediaBytesFetched'):
            self.assertEqual(r[key], 0)
        for replay in (r['selectedVersionReplay'], r['explicitTagReplay']):
            self.assertEqual(replay['conflictCount'], 0)
            for gate in ('archiveVerified', 'authenticityVerified', 'installAccepted', 'compatibilityAccepted', 'playbackAccepted', 'targetAccepted'):
                self.assertIs(replay[gate], False)

    def test_public_whitelist_excludes_provider_content(self):
        text = json.dumps(self.r)
        for forbidden in ('https://', 'http://', 'registry.npmjs.org', 'is-number', '@', 'request_url', 'final_url', 'source_document', 'selected_source', 'source_capture'):
            self.assertNotIn(forbidden, text)
        fields = {'description', 'license', 'deprecated', 'dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', 'author', 'maintainers', '_npmUser', 'readme'}
        states = {'missing', 'null', 'empty', 'invalid', 'present'}
        for replay in (self.r['selectedVersionReplay'], self.r['explicitTagReplay']):
            self.assertEqual(set(replay), {'schema', 'packageSha256', 'selectorSha256', 'captureCount', 'conflictCount', 'observations', 'archiveVerified', 'authenticityVerified', 'installAccepted', 'compatibilityAccepted', 'playbackAccepted', 'targetAccepted'})
            for o in replay['observations']:
                self.assertEqual(set(o), {'state', 'bodySha256', 'bodyBytes', 'representation', 'rootFields', 'selectedFields', 'versionCount', 'selectedVersionSha256', 'rootReadme', 'selectedReadme'})
                for name in ('rootFields', 'selectedFields'):
                    self.assertIn(set(o[name]), (set(), fields))
                    self.assertTrue(set(o[name].values()) <= states)
                for name in ('rootReadme', 'selectedReadme'):
                    self.assertEqual(set(o[name]), {'state', 'bytes', 'sha256', 'projectionState', 'mediaCount'})
                    self.assertIn(o[name]['state'], states | {'unobserved'})
                    self.assertIn(o[name]['projectionState'], {'not_projected', 'incomplete_projection', 'omitted_budget', 'projection_failed'})


if __name__ == '__main__':
    unittest.main()
