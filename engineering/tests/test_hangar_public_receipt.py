"""Consistency of sanitized real captures, not a new network or playback test."""
import hashlib
import json
from pathlib import Path
import unittest


class HangarPublicReceiptTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.lab = Path(__file__).resolve().parents[1] / 'experiments/hangar-project-lab'
        cls.receipt = json.loads((cls.lab / 'public-validation.json').read_text())

    def test_exact_capture_and_replay_provenance(self):
        r = self.receipt
        self.assertEqual(r['module_sha256'], hashlib.sha256((self.lab / 'metadata.py').read_bytes()).hexdigest())
        self.assertEqual(len(r['captures']), 7)
        self.assertEqual(sum(x['bytes'] for x in r['captures']), 129312)
        self.assertEqual(len(r['normalized']), 3)
        captures = {x['requestUrl']: x for x in r['captures']}
        for capture in r['captures']:
            self.assertEqual(capture['status'], 200)
            self.assertTrue(capture['complete'])
            self.assertEqual(capture['requestUrl'], capture['finalUrl'])
            self.assertRegex(capture['sha256'], r'^[a-f0-9]{64}$')
        for normalized in r['normalized']:
            self.assertEqual(normalized['outcome'], 'accepted')
            self.assertEqual(normalized['bodySha256'], captures[normalized['requestUrl']]['sha256'])

    def test_null_page_and_external_artifact_limits_survive(self):
        r = self.receipt
        self.assertEqual(r['project']['detail_main_page_state'], 'null')
        self.assertEqual(r['project']['search_main_page_state'], 'present')
        self.assertEqual(r['project']['independent_page_bytes'], 2906)
        self.assertTrue(r['project']['page_equals_search_body_bytes'])
        self.assertTrue(r['project']['page_does_not_fill_detail_null'])
        self.assertEqual(r['selected_version']['project_id'], r['project']['id'])
        self.assertEqual(r['selected_version']['plugin_dependencies_state'], 'empty')
        self.assertFalse(r['selected_version']['list_detail_stats_equal'])
        for download in r['selected_version']['downloads'].values():
            self.assertEqual(download['file_info_state'], 'null')
            self.assertEqual(download['download_url_state'], 'null')
            self.assertTrue(download['mutable_latest_path'])
            self.assertFalse(download['bytes_fetched'])
            self.assertFalse(download['size_hash_verified'])
        self.assertFalse(r['body_projection']['projection_complete'])
        self.assertEqual(r['body_projection']['media_reference_count'], 1)
        self.assertEqual(r['body_projection']['playback'], 'not_attempted')

    def test_cache_privacy_and_unaccepted_scope_remain_explicit(self):
        r = self.receipt
        allowed = {'content-type', 'cache-control', 'date', 'etag', 'cf-cache-status'}
        for capture in r['captures']:
            self.assertLessEqual(set(capture['headers']), allowed)
            if capture['captureName'] != 'terms':
                self.assertIn('no-store', capture['headers']['cache-control'])
        self.assertFalse(r['discovery_context']['atomic_snapshot'])
        self.assertFalse(r['discovery_context']['complete_search'])
        self.assertFalse(r['discovery_context']['complete_history'])
        self.assertFalse(r['historical_failure']['retried'])
        self.assertFalse(r['historical_failure']['resolved_by_this_sample'])
        self.assertNotIn('INGRESSCOOKIE=', json.dumps(r))


if __name__ == '__main__':
    unittest.main()
