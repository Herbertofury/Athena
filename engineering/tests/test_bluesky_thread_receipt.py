"""Stored actual-observation receipt contracts; not live API replay or synthetic truth."""
import hashlib
import json
from pathlib import Path
import unittest

E = Path(__file__).resolve().parents[1]
R = E / 'experiments/bluesky-thread-lab/public-validation-2026-11-11.json'


class BlueskyThreadReceiptTests(unittest.TestCase):
    def setUp(self):
        self.value = json.loads(R.read_text())

    def test_implementation_and_exact_stored_capture_identity(self):
        paths = {'threads.py': 'bluesky-thread-lab/threads.py',
                 'bluesky.py': 'site-extraction-lab/bluesky.py',
                 'extractors.py': 'site-extraction-lab/extractors.py'}
        for name, path in paths.items():
            self.assertEqual(self.value['implementationSha256'][name],
                             hashlib.sha256((E / 'experiments' / path).read_bytes()).hexdigest())
        expected = [(1993, 'be858322f12ca67bb4d98ae93ba12813eba55f9d2dc872e1f947b9c61953ab8c', 1),
                    (12829, 'e8ffe2b5d87a4e7c9f70224e0355531223258715fe8e945b914e974ae31433b4', 9),
                    (3276, '1792a77f76c75432e908814c517b317a32161e5f7b46f1fda5acc4dcdca11bd0', 2)]
        self.assertEqual(self.value['captureCount'], 3)
        self.assertEqual(len(self.value['captures']), 3)
        for capture, (size, digest, nodes) in zip(self.value['captures'], expected):
            replay = capture['replay']
            self.assertEqual((replay['bytes'], replay['sha256'], replay['nodeCount']), (size, digest, nodes))
            self.assertEqual((replay['httpStatus'], replay['status']), (200, 'normalized_capture'))

    def test_geometry_and_presence_not_flattened_into_completeness(self):
        rows = [r['replay'] for r in self.value['captures']]
        self.assertEqual([(r['request']['depth'], r['request']['parentHeight']) for r in rows],
                         [(0, 0), (2, 2), (1, 2)])
        self.assertEqual(rows[0]['thread']['replyCount'], 6)
        self.assertFalse(rows[0]['thread']['repliesPresent'])
        self.assertNotIn('observedDirectReplyCount', rows[0]['thread'])
        self.assertEqual(rows[1]['thread']['observedDirectReplyCount'], 6)
        parent = rows[2]['thread']['parent']
        self.assertEqual(parent['replyCount'], 6)
        self.assertFalse(parent['repliesPresent'])
        identities = []
        def walk(node):
            if node['state'] == 'available':
                identities.append(node['uriSha256'])
            if 'parent' in node:
                walk(node['parent'])
            for child in node.get('replies', []):
                walk(child)
        for r in rows:
            walk(r['thread'])
        self.assertEqual(len(identities), 12)
        self.assertEqual(len(set(identities)), 9)
        self.assertEqual(self.value['totalVisibleRepresentations'], len(identities))
        self.assertEqual(self.value['uniqueObservedPostIdentities'], len(set(identities)))

    def test_receipt_has_no_escalated_acceptance_or_raw_prose(self):
        for row in self.value['captures']:
            replay = row['replay']
            for key in ('networkUsed', 'completeHistory', 'fullSupportAccepted',
                        'cryptographicIdentityVerified', 'playbackVerified', 'decodeVerified',
                        'moderationVerified', 'accountComplete'):
                self.assertIs(replay[key], False)
            public = json.dumps(replay)
            for forbidden in ('at://', 'https://', 'displayName', 'rawResponse', 'rawBytes', 'rawNode'):
                self.assertNotIn(forbidden, public)
        for key in ('mediaFetched', 'credentialsUsed', 'nativeMutations',
                    'rawCapturesPublished', 'headersOrViewerMetadataPublished'):
            self.assertIs(self.value[key], False)


if __name__ == '__main__':
    unittest.main()
