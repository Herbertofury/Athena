"""Synthetic media-state regression cases; no live messages or media fetched."""
from copy import deepcopy
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'experiments/site-extraction-lab'))
from discord_message import normalize_message
from extractors import ExtractionError


def message(**fields):
    return dict(dict(id='1', channel_id='2'), **fields)


def attachment(**fields):
    return dict(dict(id='3', filename='synthetic.webp', content_type='image/webp',
                     url='https://example.com/synthetic.webp'), **fields)


def gallery(**fields):
    return dict(type=12, items=[dict(media=dict(url='https://example.com/synthetic.webp', **fields))])


def media_events(record):
    return [e for e in record['body']['events'] if e['type'] in ('media', 'file')]


class DiscordMediaStateTests(unittest.TestCase):
    def test_container_visibility_all_descendants_and_sibling_isolation(self):
        children = [dict(type=10, content='synthetic text'),
                    dict(type=9, components=[], accessory=dict(type=2, label='synthetic', url='https://example.com')),
                    dict(type=17, spoiler=False, components=[gallery(flags=1)]),
                    dict(type=11, spoiler=False, media=dict(url='https://example.com/a')),
                    dict(type=13, spoiler=False, file=dict(url='https://example.com/b')),
                    dict(type=14), dict(type=999)]
        for nested in (False, True):
            nodes = [dict(type=17, spoiler=True, components=children), gallery()]
            payload = message(embeds=[dict(type='components', components=nodes)]) if nested else message(components=nodes)
            r = normalize_message(payload)
            prefix = 'embeds/0/' if nested else ''
            hidden = [e for e in r['body']['events'] if e['source'].startswith(prefix + 'components/0')]
            self.assertTrue(all(e.get('spoiler') is True for e in hidden))
            self.assertFalse(media_events(r)[-1]['spoiler'])
            self.assertTrue(r['files'][0]['spoiler'])
            self.assertFalse(r['body']['projectionComplete'])
            self.assertEqual(r['_payload'], payload)

    def test_flag_namespaces(self):
        for flags in (0, 1, 8, 32, 40, 256):
            with self.subTest(flags=flags):
                r = normalize_message(message(attachments=[attachment(flags=flags)],
                    embeds=[dict(flags=32, image=dict(url='https://example.com/x', flags=flags)),
                            dict(type='components', components=[gallery(flags=flags)])],
                    components=[gallery(flags=flags)]))
                rich, embedded, top, file = media_events(r)
                self.assertEqual(file['spoiler'], bool(flags & 8))
                self.assertEqual(file['animatedHint'], True if flags & 32 else None)
                self.assertEqual(rich['animatedHint'], True if flags & 32 else None)
                for e in (embedded, top):
                    self.assertEqual(e['animatedHint'], True if flags & 1 else None)

    def test_attachment_merge_never_reinterprets_clip_as_animation(self):
        for flags in (1, 8, 32, 40):
            for ref in (dict(attachment_id='3'), dict(url='attachment://synthetic.webp')):
                for own in ({}, dict(flags=0), dict(flags=1)):
                    r = normalize_message(message(attachments=[attachment(flags=flags)],
                        components=[dict(type=13, file=dict(ref, **own))]))
                    e = r['files'][0]
                    self.assertEqual(e['animatedHint'], True if flags & 32 or own.get('flags', 0) & 1 else None)
                    self.assertEqual(e['spoiler'], bool(flags & 8))
                    self.assertEqual(e['attachmentId'], '3')
                    self.assertEqual(e['url'], 'https://example.com/synthetic.webp')

    def test_malformed_boolean_and_flag_inputs_fail(self):
        for value in (True, False, -1, 1.0, '32', None, [], {}):
            for payload in (message(attachments=[attachment(flags=value)]),
                            message(embeds=[dict(flags=value)]),
                            message(embeds=[dict(image=dict(url='https://example.com', flags=value))]),
                            message(components=[gallery(flags=value)]),
                            message(components=[gallery(content_scan_metadata=dict(flags=value))])):
                with self.subTest(value=value, payload=payload), self.assertRaises(ExtractionError):
                    normalize_message(payload)
        for value in (0, 1, 'false', None, [], {}):
            for node in (dict(type=17, spoiler=value, components=[]),
                         dict(type=11, spoiler=value, media=dict(url='https://example.com')),
                         dict(type=12, items=[dict(spoiler=value, media=dict(url='https://example.com'))])):
                with self.subTest(value=value), self.assertRaises(ExtractionError):
                    normalize_message(message(components=[node]))

    def test_scanning_is_scoped_not_clean_or_animation(self):
        r = normalize_message(message(attachments=[attachment(flags=16|64|128|512)],
            embeds=[dict(flags=32|64, image=dict(url='https://example.com'))],
            components=[gallery(content_scan_metadata=dict(flags=1|4|16)), gallery()]))
        rich, scanned, unknown, file = media_events(r)
        self.assertIsNone(rich['animatedHint'])
        hint = file['contentScanHints'][0]
        self.assertEqual(hint['scope'], 'attachment')
        self.assertEqual(hint['unknownBits'], 512)
        self.assertEqual(hint['explicit'], 'flagged')
        hint = scanned['contentScanHints'][0]
        self.assertEqual(hint['scope'], 'unfurled_media')
        self.assertEqual(hint['gore'], 'not_flagged')
        self.assertEqual(hint['selfHarm'], 'flagged')
        self.assertEqual(hint['unknownBits'], 16)
        self.assertNotIn('contentScanHints', unknown)
        start = next(e for e in r['body']['events'] if e['type'] == 'embed_start')
        self.assertEqual(start['contentScanHints'][0]['gore'], 'flagged')

    def test_each_scan_namespace_and_unknown_bits(self):
        for flags in (0, 1, 2, 4, 7, 16, 32, 64, 128, 240, 1024):
            r = normalize_message(message(attachments=[attachment(flags=flags)],
                embeds=[dict(flags=flags)], components=[gallery(content_scan_metadata=dict(flags=flags))]))
            unfurled, file = media_events(r)
            embed = next(e for e in r['body']['events'] if e['type'] == 'embed_start')
            for event, bits, known in ((unfurled, (1, 2, 4), 7), (file, (16, 64, 128), 255),
                                       (embed, (16, 64, 128), 240)):
                hint = event['contentScanHints'][0]
                self.assertEqual(hint['state'], 'reported')
                self.assertEqual(hint['flags'], flags)
                self.assertEqual(hint['unknownBits'], flags & ~known)
                for key, bit in zip(('explicit', 'gore', 'selfHarm'), bits):
                    self.assertEqual(hint[key], 'flagged' if flags & bit else 'not_flagged')

    def test_bound_flag_and_scan_provenance_survives_collision(self):
        r = normalize_message(message(attachments=[attachment(flags=16|32|128)],
            components=[dict(type=13, file=dict(attachment_id='3', flags=0,
                content_scan_metadata=dict(flags=2)))]))
        e = r['files'][0]
        self.assertEqual(e['flags'], 0)
        self.assertEqual(e['flagSources'], [dict(scope='unfurled_media', flags=0),
                                            dict(scope='attachment', flags=176)])
        self.assertEqual([h['scope'] for h in e['contentScanHints']], ['attachment', 'unfurled_media'])
        self.assertEqual(e['contentScanHints'][0]['explicit'], 'flagged')
        self.assertEqual(e['contentScanHints'][1]['explicit'], 'not_flagged')
        self.assertTrue(e['animatedHint'])

    def test_partial_scan_arrival_replacement_and_denied_retention(self):
        initial = message(attachments=[attachment()], components=[gallery()])
        old = normalize_message(initial, access='available')
        changed = normalize_message(dict(id='1', attachments=[attachment(flags=16)],
            components=[gallery(content_scan_metadata=dict(flags=2))]), previous=old,
            partial=True, access='available')
        self.assertNotIn('contentScanHints', old['files'][0])
        self.assertEqual(changed['files'][0]['contentScanHints'][0]['explicit'], 'flagged')
        kept = normalize_message(dict(id='1', content='synthetic edit'), previous=changed,
                                 partial=True, access='available')
        self.assertEqual(kept['files'], changed['files'])
        for access in ('denied', 'intent_limited'):
            blocked = normalize_message(initial, previous=changed, access=access)
            self.assertEqual(blocked['body'], changed['body'])
            self.assertEqual(blocked['files'], changed['files'])
        replaced = normalize_message(dict(id='1', attachments=[attachment()], components=[]),
                                     previous=changed, partial=True, access='available')
        self.assertNotIn('contentScanHints', replaced['files'][0])
        self.assertEqual(old['_payload'], initial)

    def test_malformed_scan_shapes_and_flags_in_snapshots_fail(self):
        for metadata in (None, [], '', 0, {}, dict(flags=True)):
            with self.subTest(metadata=metadata), self.assertRaises(ExtractionError):
                normalize_message(message(components=[gallery(content_scan_metadata=metadata)]))
        with self.assertRaises(ExtractionError):
            normalize_message(message(message_snapshots=[dict(message=dict(attachments=[attachment(flags=True)]))]))

    def test_partial_denied_and_nested_snapshots(self):
        inner = dict(attachments=[attachment(flags=40)], components=[dict(type=17, spoiler=True, components=[gallery(flags=1)])])
        payload = message(message_snapshots=[dict(message=dict(message_snapshots=[dict(message=inner)]))])
        old = normalize_message(payload, access='available')
        before = deepcopy(old)
        for access in ('available', 'denied', 'intent_limited'):
            r = normalize_message(dict(id='1'), previous=old, partial=True, access=access)
            self.assertEqual(r['snapshots'], old['snapshots'])
        snap = old['snapshots'][0]['snapshots'][0]
        self.assertTrue(snap['files'][0]['spoiler'])
        self.assertTrue(snap['files'][0]['animatedHint'])
        self.assertEqual(snap['people'], [])
        self.assertEqual(old, before)

    def test_rich_attachment_binding_and_embed_restrictions_unchanged(self):
        r = normalize_message(message(attachments=[attachment(flags=40)],
            embeds=[dict(image=dict(url='attachment://synthetic.webp', flags=0))]))
        self.assertEqual(media_events(r)[0]['attachmentId'], '3')
        self.assertTrue(media_events(r)[0]['animatedHint'])
        for ref in (dict(attachment_id='3'), dict(url='attachment://synthetic.webp')):
            with self.assertRaisesRegex(ExtractionError, 'cannot reference message attachments'):
                normalize_message(message(attachments=[attachment()], embeds=[dict(type='components', components=[dict(type=13, file=ref)])]))
        with self.assertRaisesRegex(ExtractionError, 'identity mismatch'):
            normalize_message(message(attachments=[attachment()], components=[dict(type=13, file=dict(attachment_id='4', url='attachment://synthetic.webp'))]))


if __name__ == '__main__':
    unittest.main()
