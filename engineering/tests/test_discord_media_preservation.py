"""Historical documentation evidence and offline replay, not live Discord data."""
import hashlib
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch

E = Path(__file__).resolve().parents[1]
L = E / 'experiments/discord-component-embed-lab'
M = E / 'experiments/site-extraction-lab/discord_message.py'
S = E / 'experiments/discord-media-state-lab/schema-evidence.json'


class DiscordMediaPreservationTests(unittest.TestCase):
    def test_original_artifacts_and_module_identity_remain_pinned(self):
        receipt = json.loads((L / 'media-state-reconciliation.json').read_text())
        self.assertEqual(receipt['base_commit'], '9ff4679a30baa1840bb16c357d0bb3f0866b88d6')
        self.assertEqual(receipt['original_implementation_sha256'], 'b522913010d9ca91f6e39f0338323a72809df169da4234a34e2937c78f783948')
        self.assertEqual(receipt['original_receipt_sha256'], '04c75f2737fd498c5f2007a996dd63d06c0c5bf96599e1c82bb57baad8fd244e')
        for path, digest in receipt['preserved_artifacts'].items():
            self.assertEqual(hashlib.sha256((L / path).read_bytes()).hexdigest(), digest, path)
        self.assertEqual(receipt['current_implementation_sha256'], hashlib.sha256(M.read_bytes()).hexdigest())
        self.assertEqual(receipt['current_receipt_sha256'], hashlib.sha256((L / 'current-after.json').read_bytes()).hexdigest())
        self.assertTrue(all(value is False for value in receipt['acceptance'].values()))

    def test_current_replay_matches_exact_receipt_without_network(self):
        spec = importlib.util.spec_from_file_location('discord_media_preservation_probe', L / 'probe.py')
        probe = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(probe)
        with patch('socket.socket', side_effect=AssertionError('Unexpected network')):
            current = probe.replay(M, L / 'fixtures/official-component-example.json')
        expected = json.loads((L / 'current-after.json').read_text())
        self.assertEqual(current, expected)
        old = json.loads((L / 'after.json').read_text())
        self.assertNotEqual(old['implementation_sha256'], current['implementation_sha256'])
        self.assertEqual({k: v for k, v in old.items() if k != 'implementation_sha256'},
                         {k: v for k, v in current.items() if k != 'implementation_sha256'})
        self.assertFalse(current['api_response_observed'])
        self.assertFalse(current['projection_complete'])

    def test_public_example_not_positive_flag_or_container_spoiler_evidence(self):
        fixture = json.loads((L / 'fixtures/official-component-example.json').read_text())
        self.assertIs(fixture['component']['spoiler'], False)
        def walk(value):
            if isinstance(value, dict):
                self.assertNotIn('content_scan_metadata', value)
                self.assertNotIn('flags', value)
                for child in value.values():
                    walk(child)
            elif isinstance(value, list):
                for child in value:
                    walk(child)
        walk(fixture)

    def test_documented_namespaces_are_distinct(self):
        source = json.loads(S.read_text())
        self.assertEqual(source['commit'], '36adecb2e0bbbf500c430147ef4acbe9aa1a389e')
        masks = source['derived_schema']
        self.assertEqual(masks['attachment_flags']['IS_SPOILER'], 8)
        self.assertEqual(masks['attachment_flags']['IS_ANIMATED'], 32)
        self.assertEqual(masks['embed_media_flags']['IS_ANIMATED'], 32)
        self.assertEqual(masks['embed_flags']['IS_CONTENT_INVENTORY_ENTRY'], 32)
        self.assertEqual(masks['unfurled_media_flags']['IS_ANIMATED'], 1)
        self.assertEqual(set(masks['unfurled_content_scan_metadata_flags'].values()), {1, 2, 4})
        self.assertEqual([x['git_blob_sha1'] for x in source['sources']],
                         ['0181ed1489e1c609146d4ce0751db9f128983611', 'decbee70432678e7e0a2fbaf79215252230498a3'])
        self.assertIn('not live', source['evidence_level'])


if __name__ == '__main__':
    unittest.main()
