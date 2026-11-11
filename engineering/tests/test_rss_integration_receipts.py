"""Integration provenance integrity; does not pretend to fetch original inputs."""
import hashlib
import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / 'experiments/rss-integration-lab'
SOURCE = ROOT / 'experiments/site-extraction-lab/extractors.py'
spec = importlib.util.spec_from_file_location('rss_compare', LAB / 'compare.py')
C = importlib.util.module_from_spec(spec)
spec.loader.exec_module(C)


class RssIntegrationReceiptTests(unittest.TestCase):
    def test_retained_replay_scope_and_current_source(self):
        receipt = json.loads((LAB / 'validation-2026-11-11.json').read_text())
        self.assertEqual(set(receipt['sourceDrafts']), {'5', '14', '53'})
        self.assertEqual(receipt['newProviderRequests'], 0)
        self.assertFalse(receipt['rawSourcePublished'])
        self.assertEqual([r['records'] for r in receipt['replays']], [60, 10])
        for row in receipt['replays']:
            self.assertEqual(row['candidateSha256'], hashlib.sha256(SOURCE.read_bytes()).hexdigest())
            self.assertEqual(row['titlesPreserved'], row['records'])
            self.assertEqual(row['datesPreserved'], row['records'])
            self.assertEqual(row['datesIndependentlyNormalized'], row['records'])
            self.assertTrue(row['allPreexistingNormalizedFieldsEqual'])
            self.assertTrue(row['allPreexistingReceiptFieldsEqual'])
            self.assertTrue(row['rawDateExcludedFromReceipt'])
            self.assertFalse(row['networkUsed'])

    def test_prior_reports_are_preserved_exactly(self):
        expected = json.loads((LAB / 'pr53-receipts/manifest.json').read_text())
        self.assertEqual(len(expected), 3)
        for path, digest in expected.items():
            self.assertEqual(hashlib.sha256((LAB / 'pr53-receipts' / path).read_bytes()).hexdigest(), digest)
        for family, rel in [('wordpress', 'site-extraction-lab/wordpress-collection-validation-2026-11-11.json'),
                            ('bluesky', 'bluesky-thread-lab/public-validation-2026-11-11.json')]:
            old = json.loads((LAB / 'pr53-receipts' / rel).read_text())
            new = json.loads((ROOT / 'experiments' / rel).read_text())
            for key in ['implementationSha256', 'offlineReplayReconciliation']:
                old.pop(key); new.pop(key)
            self.assertEqual(new, old, family)
        old = json.loads((LAB / 'pr53-receipts/youtube-topic-gate-lab/after.json').read_text())
        new = json.loads((ROOT / 'experiments/youtube-topic-gate-lab/after.json').read_text())
        old.pop('extractor_sha256'); new.pop('extractor_sha256')
        self.assertEqual(new, old)

    def test_socket_activity_rejected(self):
        with self.assertRaisesRegex(RuntimeError, 'prohibits socket'):
            C.audit('socket.connect', ())


if __name__ == '__main__':
    unittest.main()
