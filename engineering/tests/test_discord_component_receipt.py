"""Official documentation fixture, not an actual Discord message/API response."""
from collections import Counter
import hashlib
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch

E = Path(__file__).resolve().parents[1]
LAB = E / 'experiments/discord-component-embed-lab'
MODULE = E / 'experiments/site-extraction-lab/discord_message.py'
FIXTURE = LAB / 'fixtures/official-component-example.json'
spec = importlib.util.spec_from_file_location('discord_example_probe', LAB / 'probe.py')
probe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(probe)


class DiscordComponentReceiptTests(unittest.TestCase):
    def test_exact_fixture_and_license_provenance(self):
        self.assertEqual(hashlib.sha256(FIXTURE.read_bytes()).hexdigest(), 'd2a3a025a50184b5b1309c9246d2d698eaeab3fb18405249b32f79d16e068153')
        self.assertEqual(hashlib.sha256((LAB / 'fixtures/LICENSE-CODE').read_bytes()).hexdigest(), 'ef75c87c20a645242bc8316055d642105b3e93f5aad95a66e734169728661c72')
        receipt = json.loads((LAB / 'public-validation-2026-11-11.json').read_text())
        self.assertEqual(receipt['upstream']['source_commit'], '36adecb2e0bbbf500c430147ef4acbe9aa1a389e')
        self.assertEqual(receipt['upstream']['source_blob_sha1_verified'], 'e10583d3d67c887ebffc1e3a939d79137372d993')
        self.assertEqual(receipt['artifacts']['full-example-script-exact.json']['sha256'], 'ff5b3fb0c7af5c849ab18c4233bcaa2371c6fa9df04096b46139b1cf59aad875')
        self.assertEqual(receipt['fixture']['sha256'], hashlib.sha256(FIXTURE.read_bytes()).hexdigest())
        self.assertTrue(receipt['fixture']['source_example_not_live_response'])
        self.assertTrue(receipt['rendered_example_matches_pinned_source'])

    def test_replay_is_reproducible_without_network(self):
        with patch('socket.socket', side_effect=AssertionError('Unexpected socket use')):
            actual = probe.replay(MODULE, FIXTURE)
        expected = json.loads((LAB / 'after.json').read_text())
        self.assertEqual(actual, expected)
        self.assertEqual(actual['implementation_sha256'], hashlib.sha256(MODULE.read_bytes()).hexdigest())
        self.assertEqual((actual['component_count'], actual['text_event_count'], actual['media_reference_count'], actual['link_event_count']), (15, 7, 4, 4))
        self.assertEqual(actual['media_spoiler_states'], [False, False, False, True])

    def test_preserves_raw_input_and_matches_source_inventory(self):
        before = json.loads((LAB / 'before.json').read_text())
        after = json.loads((LAB / 'after.json').read_text())
        self.assertEqual(before['fixture_sha256'], after['fixture_sha256'])
        self.assertEqual(before['input_raw_projection_sha256'], after['input_raw_projection_sha256'])
        self.assertEqual((before['component_count'], before['text_characters'], before['media_reference_count']), (0, 0, 0))
        self.assertEqual(before['implementation_sha256'], '818d68ece3d6a2249b37eb7fbf4cfea6aacda5354a6d6d50fc6b1dc8df2e7615')
        types, media = Counter(), []
        def walk(value):
            if isinstance(value, dict):
                if type(value.get('type')) is int:
                    types[str(value['type'])] += 1
                if isinstance(value.get('media'), dict):
                    media.append(hashlib.sha256(value['media']['url'].encode()).hexdigest())
                for child in value.values():
                    walk(child)
            elif isinstance(value, list):
                for child in value:
                    walk(child)
        walk(json.loads(FIXTURE.read_text()))
        self.assertEqual(dict(types), after['component_types'])
        self.assertEqual(media, after['media_url_sha256_in_order'])

    def test_no_live_message_or_media_acceptance_claim(self):
        receipt = json.loads((LAB / 'public-validation-2026-11-11.json').read_text())
        self.assertTrue(all(value is False for value in receipt['acceptance'].values()))
        self.assertEqual(receipt['source_inventory']['link_references'], 6)
        for name in ('before.json', 'after.json'):
            value = json.loads((LAB / name).read_text())
            self.assertTrue(value['envelope']['synthetic'])
            for key in ('api_response_observed', 'network_used', 'projection_complete', 'provider_rendering_verified', 'full_support_accepted'):
                self.assertIs(value[key], False)
            self.assertTrue(value['all_media_unfetched'])
        for path in LAB.glob('*.json'):
            self.assertNotIn('/workspace/', path.read_text())
            self.assertNotIn('Set-Cookie', path.read_text())


if __name__ == '__main__':
    unittest.main()
