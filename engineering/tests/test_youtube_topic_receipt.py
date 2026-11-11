"""Stored actual observation checks; no live requests or invented entries."""
import hashlib
import json
from pathlib import Path
import unittest

E = Path(__file__).resolve().parents[1]
LAB = E / 'experiments/youtube-topic-gate-lab'


class YouTubeTopicReceiptTests(unittest.TestCase):
    def setUp(self):
        self.receipt = json.loads((LAB / 'public-validation-2026-11-11.json').read_text())
        self.before = json.loads((LAB / 'before.json').read_text())
        self.after = json.loads((LAB / 'after.json').read_text())

    def test_exact_input_and_implementation_identities(self):
        capture = self.receipt['capture']
        digest = 'f43e820f3c928fae60e93e1feeb5cb36d2c852849a760e85dd929471faefd6be'
        self.assertEqual((capture['captured_bytes'], capture['sha256']), (463, digest))
        for row in (self.before, self.after):
            self.assertEqual((row['input_bytes'], row['input_sha256']), (463, digest))
            self.assertFalse(row['collection_accepted'])
        self.assertEqual(self.before['extractor_sha256'], '2ca3ff4b1645930709ca58eb37f742cca917df4c78dc93ab9c7008475659d188')
        self.assertEqual(self.after['extractor_sha256'], hashlib.sha256((E / 'experiments/site-extraction-lab/extractors.py').read_bytes()).hexdigest())
        self.assertEqual(self.before['returned_value'], [])
        self.assertEqual(self.after['state'], 'explicit_extraction_rejection')

    def test_topic_stub_is_not_an_empty_channel_or_accepted_collector(self):
        receipt = self.receipt
        inspection = receipt['inspection']
        self.assertEqual(inspection['root_tag'], '{http://www.w3.org/2005/Atom}feed')
        self.assertEqual(inspection['entry_count'], 0)
        self.assertEqual(inspection['feed_channel_ids'], [])
        self.assertIsNone(inspection['feed_id'])
        self.assertFalse(inspection['self_link_preserves_requested_channel'])
        self.assertEqual(receipt['acceptance']['channel_is_empty'], 'unknown')
        for key, value in receipt['acceptance'].items():
            if key != 'channel_is_empty':
                self.assertIs(value, False, key)
        self.assertEqual(receipt['capture']['response_headers']['last-modified'], 'Tue, 03 Mar 2020 20:15:00 GMT')

    def test_bounded_public_read_and_publication_scope(self):
        receipt = self.receipt
        access = receipt['access']
        self.assertEqual((access['request_count'], access['retry_count']), (1, 0))
        self.assertTrue(access['anonymous_get'])
        for key in ('credential_used', 'grant_requested', 'hub_subscription_created', 'raw_response_published', 'watch_page_scraped', 'alternate_route_attempted'):
            self.assertIs(access[key], False)
        capture = receipt['capture']
        self.assertEqual(capture['status'], 200)
        self.assertEqual(capture['request']['url'], capture['final_url'])
        self.assertFalse(capture['request']['automatic_redirects'])
        self.assertFalse(capture['limit_exceeded'])
        self.assertEqual(set(capture['response_headers']), {'content-type', 'content-length', 'date', 'cache-control', 'last-modified'})
        for path in LAB.glob('*.json'):
            text = path.read_text().lower()
            self.assertNotIn('set-cookie', text)
            self.assertNotIn('/workspace/', text)
            self.assertNotIn('/home/', text)
        self.assertEqual(len(receipt['source_ids']), 5)


if __name__ == '__main__':
    unittest.main()
