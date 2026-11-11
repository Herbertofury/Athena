"""Offline composition tests. Generated messages/feeds are not provider captures."""
from copy import deepcopy
import hashlib
import importlib.util
import itertools
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

E = Path(__file__).resolve().parents[1]
LAB = E / 'experiments/provider-foundation-integration'
sys.path.insert(0, str(E / 'experiments/site-extraction-lab'))
import extractors
import discord_message

RSS = (b'<rss><channel><item><guid>synthetic-1</guid><title>Generated &amp; title</title>'
       b'<pubDate>Wed, 11 Nov 2026 12:34:56 +0200</pubDate>'
       b'<description>Generated metadata only</description></item></channel></rss>')
MESSAGE = {'id': '1', 'channel_id': '2', 'components': [
    {'type': 17, 'spoiler': True, 'components': [
        {'type': 12, 'items': [{'media': {'url': 'https://example.test/a?private=not-real',
                                        'flags': 1, 'content_scan_metadata': {'flags': 2}}}]}]},
    {'type': 12, 'items': [{'media': {'url': 'https://example.test/b', 'flags': 0}}]}]}


class ProviderFoundationIntegrationTests(unittest.TestCase):
    def test_donor_files_and_prior_receipts_remain_exact(self):
        manifest = json.loads((LAB / 'preservation.json').read_text())
        self.assertEqual(len(manifest['exactImportedPaths']), 23)
        self.assertEqual(manifest['donor']['head'], '388cd5f8ad6de8329bc4f87b1620a73180eaa62d')
        for row in manifest['exactImportedPaths'] + manifest['preservedBasePaths']:
            raw = (E.parent / row['path']).read_bytes()
            self.assertEqual(hashlib.sha256(raw).hexdigest(), row['sha256'], row['path'])
            self.assertEqual(hashlib.sha1(b'blob ' + str(len(raw)).encode() + b'\0' + raw).hexdigest(),
                             row['gitBlob'], row['path'])

    def test_shared_utilities_bind_to_the_integrated_extractor(self):
        self.assertIs(discord_message.ExtractionError, extractors.ExtractionError)
        self.assertIs(discord_message.public_url, extractors.public_url)
        self.assertIs(discord_message.base_record, extractors.base_record)
        self.assertIs(discord_message.json_loads, extractors.json_loads)
        self.assertIs(discord_message.sha256, extractors.sha256)

    def test_rss_metadata_and_discord_flags_preserve_distinct_semantics(self):
        feed = extractors.extract('rss', {'feed': RSS})[0]
        self.assertEqual(feed['identity']['title'], 'Generated & title')
        self.assertEqual(feed['publicationDate']['utc'], '2026-11-11T10:34:56Z')
        self.assertIsNone(feed['body'])
        record = discord_message.normalize_message(MESSAGE, access='available')
        events = [e for e in record['body']['events'] if e['type'] == 'media']
        self.assertEqual([e['spoiler'] for e in events], [True, False])
        self.assertEqual([e['animatedHint'] for e in events], [True, None])
        self.assertEqual(events[0]['contentScanHints'][0]['gore'], 'flagged')
        self.assertNotIn('contentScanHints', events[1])
        self.assertFalse(record['body']['projectionComplete'])
        self.assertFalse(record['fullSupportAccepted'])

    def test_all_interleavings_preserve_complete_records_receipts_and_inputs(self):
        before = deepcopy(MESSAGE)
        rss_expected = extractors.extract('rss', {'feed': RSS})
        discord_expected = discord_message.normalize_message(MESSAGE, access='available')
        def rss_ok():
            actual = extractors.extract('rss', {'feed': RSS})
            self.assertEqual(actual, rss_expected)
            self.assertEqual(extractors.receipt(actual), extractors.receipt(rss_expected))
        def discord_ok():
            actual = discord_message.normalize_message(MESSAGE, access='available')
            self.assertEqual(actual, discord_expected)
            self.assertEqual(discord_message.discord_receipt(actual),
                             discord_message.discord_receipt(discord_expected))
        def atom_rejected():
            with self.assertRaises(extractors.ExtractionError):
                extractors.extract('rss', {'feed': b'<feed xmlns="http://www.w3.org/2005/Atom"/>'})
        def flags_rejected():
            invalid = deepcopy(MESSAGE)
            invalid['components'][1]['items'][0]['media']['flags'] = True
            with self.assertRaises(extractors.ExtractionError):
                discord_message.normalize_message(invalid, access='available')
        with patch('socket.socket', side_effect=AssertionError('Unexpected network')):
            for order in itertools.permutations((rss_ok, discord_ok, atom_rejected, flags_rejected)):
                for operation in order:
                    operation()
                self.assertEqual(MESSAGE, before)
                self.assertEqual(extractors.extract('rss', {'feed': RSS}), rss_expected)
                self.assertEqual(discord_message.normalize_message(MESSAGE, access='available'), discord_expected)

    def test_denied_and_partial_updates_do_not_rewrite_prior_records(self):
        original = discord_message.normalize_message(MESSAGE, access='available')
        saved = deepcopy(original)
        with patch('socket.socket', side_effect=AssertionError('Unexpected network')):
            for access in ('denied', 'intent_limited'):
                extractors.extract('rss', {'feed': RSS})
                result = discord_message.normalize_message({'id': '1'}, previous=original,
                                                             partial=True, access=access)
                self.assertEqual(result['body'], original['body'])
                self.assertEqual(result['files'], original['files'])
                self.assertEqual(original, saved)

    def test_existing_official_code_example_still_replays_exactly(self):
        lab = E / 'experiments/discord-component-embed-lab'
        spec = importlib.util.spec_from_file_location('foundation_discord_probe', lab / 'probe.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        with patch('socket.socket', side_effect=AssertionError('Unexpected network')):
            actual = module.replay(E / 'experiments/site-extraction-lab/discord_message.py',
                                  lab / 'fixtures/official-component-example.json')
        self.assertEqual(actual, json.loads((lab / 'current-after.json').read_text()))
        self.assertFalse(actual['api_response_observed'])

    def test_both_source_fragments_and_evidence_sections_are_present(self):
        index = json.loads((E / 'data/source-index.json').read_text())['files']
        for name in ('discord-component-embeds-20261111', 'discord-media-states-20261111',
                     'rss-publication-dates-20261108'):
            self.assertEqual(index.count('data/sources.d/' + name + '.json'), 1)
        text = (E / 'docs/experiment-evidence.md').read_text()
        for title in ('YouTube topic-format boundary, November 11', 'Discord component previews, November 11',
                      'Discord media visibility and flag namespaces'):
            self.assertEqual(text.count('## ' + title), 1)


if __name__ == '__main__':
    unittest.main()
