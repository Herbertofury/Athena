"""Stored actual-observation contract, not a live network test or raw fixture replay."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / 'experiments/mastodon-status-lab'

class StoredMastodonReceiptTests(unittest.TestCase):
    def setUp(self):
        self.r = json.loads((LAB / 'public-validation-2026-11-11.json').read_text())

    def test_exact_implementation_and_capture_contract(self):
        r = self.r
        self.assertEqual(r['schemaVersion'], 1)
        self.assertEqual(r['sourceBaseCommit'], '7ba88d30229f3073c9aa738f087b9199ffae16ae')
        for p in (LAB / 'statuses.py', ROOT / 'experiments/site-extraction-lab/extractors.py'):
            self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(), r['implementationSha256'][p.name])
        self.assertEqual(r['captureCount'], 3)
        self.assertEqual(r['capturedBytes'], 12867)
        self.assertEqual([x['bytes'] for x in r['captures']], [4116, 7286, 1465])
        self.assertEqual([x['role'] for x in r['captures']], ['status', 'status', 'profile'])
        self.assertEqual([x['httpStatus'] for x in r['captures']], [200, 200, 200])
        self.assertEqual([x['sha256'] for x in r['captures']], ['427804f4b62914501c754c8df241382dba460f76eba4fc23eaa0b765653ca23a', 'db570f7d37bc6559650daabbe1b2a896b07b4a558c8c92086923ae2359dd7e1d', '73563d852a168ee587f630b1cdb365f819ec25d7e58fa9aff8dcd96ca6a6fdcc'])

    def test_attribution_roles_and_limits(self):
        first, second = [x['replay'] for x in self.r['cases']]
        self.assertEqual([first['join_state'], second['join_state']], ['matched', 'not_requested'])
        self.assertEqual([x['state'] for r in (first, second) for x in r['observations']], ['normalized'] * 3)
        statuses = first['statuses'] + second['statuses']
        self.assertEqual([x['html_length'] for x in statuses], [724, 567])
        self.assertEqual([len(x['attachments']) for x in statuses], [0, 4])
        self.assertEqual([x['reblog'] for x in statuses], [None, None])
        self.assertEqual([x['field_states']['media_attachments'] for x in statuses], ['empty', 'declared'])
        for n, a in enumerate(statuses[1]['attachments']):
            self.assertEqual(a, {'order': n, 'kind': 'image', 'roles': {'url': 'declared', 'preview_url': 'declared', 'remote_url': 'null'}})
        self.assertTrue(self.r['acceptance'])
        self.assertTrue(all(v is False for v in self.r['acceptance'].values()))

    def test_public_artifact_contains_no_source_fields(self):
        forbidden = {'raw', 'raw_capture', 'parsed', 'html_source', 'content', 'text', 'display_name', 'username', 'acct', 'note', 'avatar', 'avatar_static', 'local_id', 'instance', 'federation_uri', 'canonical_profile_url', 'projection', 'viewer_prose', 'error'}
        def check(value):
            if isinstance(value, dict):
                # The fixed field-state name content is allowed, never its source value.
                for k, v in value.items():
                    if k == 'field_states':
                        self.assertTrue(set(v.values()) <= {'missing', 'null', 'empty', 'declared'})
                    else:
                        self.assertNotIn(k, forbidden)
                        check(v)
            elif isinstance(value, list):
                for v in value: check(v)
            elif isinstance(value, str):
                for secret in ('https://', 'http://', '<p>', 'CANARY', '@superproductivity', '@lashman', '117192733475238885', '117270553071094821', '112857800192038588'):
                    self.assertNotIn(secret, value)
        check(self.r)

if __name__ == '__main__': unittest.main()
