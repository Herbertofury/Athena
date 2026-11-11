"""Stored actual-observation contract; no network or raw provider fixtures."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / 'experiments/nasa-media-lab'


class NasaMediaReceiptTests(unittest.TestCase):
    def setUp(self):
        self.receipt = json.loads((LAB / 'public-validation-2026-11-11.json').read_text())

    def test_exact_captures_and_implementation(self):
        r = self.receipt
        self.assertEqual(r['captureCount'], 6)
        self.assertEqual(r['capturedBytes'], 7827)
        self.assertEqual([x['bytes'] for x in r['captures']], [2101, 586, 78, 172, 4807, 83])
        self.assertTrue(all(x['status'] == 200 and x['complete'] for x in r['captures']))
        self.assertEqual([x['sha256'] for x in r['captures']], [
            '41ca093e8a944963b626cd8b530b873c61dc17e4c699eb8bad6d3f5a9ff09b05',
            'f1ea49b7f15f7b46ac9c0b795b1853fecb6dee82f70dbd99e930fa938bfb8b1e',
            '98fce6c1e62f4d80d5ed54eb26414b78a2c41bde7cf862e45ece868428070701',
            '83fab59423d481d58903360d37d211d43142aebce1be62f8bb6da9259012dc00',
            '07f7822bc680b7fba1b44d2b3a14a8b301ba81a6ef10a37ad3b4ebe54eda28a5',
            '1050e0bbef20c50f9c54d5368eb1952b2a10684ba7329d97e7b9682aa289ab5c'])
        for p in (LAB / 'media.py', ROOT / 'experiments/site-extraction-lab/extractors.py'):
            self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(), r['implementationSha256'][p.name])
        self.assertEqual(r['officialContract']['documentRelease'], '1.22.0')
        self.assertEqual(r['officialContract']['documentReleaseDate'], '2023-01-06')
        self.assertEqual(r['observedCollectionVersions'], ['1.1'])
        self.assertIs(r['liveDeploymentVersionVerified'], False)

    def test_actual_cross_endpoint_discrepancy_and_scope(self):
        image, video = [x['replay'] for x in self.receipt['cases']]
        self.assertEqual([x['state'] for x in image['attempts']], ['exact-selection', 'observed', 'observed'])
        self.assertEqual([x['state'] for x in video['attempts']], ['empty-selection', 'observed', 'observed'])
        self.assertEqual(image['attempts'][0]['matched_records'], 1)
        self.assertEqual(image['attempts'][0]['references_count'], 6)
        self.assertEqual(image['attempts'][1]['references_count'], 6)
        self.assertEqual(video['attempts'][0]['items_count'], 0)
        self.assertEqual(video['attempts'][0]['query_total_hits'], 0)
        self.assertEqual(video['attempts'][1]['references_count'], 52)
        for replay in (image, video):
            self.assertEqual(replay['attempts'][2]['references_count'], 1)
            self.assertTrue(all(x is False for x in replay['acceptance'].values()))
        self.assertIs(self.receipt['networkUsedByNormalizer'], False)
        self.assertEqual(self.receipt['mediaBytesFetched'], 0)
        self.assertIs(self.receipt['captionContentsFetched'], False)
        self.assertIs(self.receipt['metadataContentsFetched'], False)

    def test_receipt_excludes_source_text_ids_and_locations(self):
        text = json.dumps(self.receipt)
        for secret in ('https://', 'http://', 'as11-40-5874', '172_ISS-Slosh', 'images-assets', 'photographer', 'secondary_creator'):
            self.assertNotIn(secret, text)
        def walk(value):
            if isinstance(value, dict):
                self.assertTrue(set(value).isdisjoint({'body', 'raw', 'value', 'record', 'source', 'url', 'location', 'href', 'description', 'title'}))
                for item in value.values():
                    walk(item)
            elif isinstance(value, list):
                for item in value:
                    walk(item)
        walk(self.receipt)


if __name__ == '__main__':
    unittest.main()
