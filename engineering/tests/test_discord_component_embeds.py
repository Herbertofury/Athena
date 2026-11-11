"""Synthetic component-embed projections, not live Discord API acceptance."""
from copy import deepcopy
import json
from pathlib import Path
import sys
import unittest

LAB = Path(__file__).resolve().parents[1] / 'experiments' / 'site-extraction-lab'
sys.path.insert(0, str(LAB))
from discord_message import discord_receipt, normalize_message
from extractors import ExtractionError


def message(**fields):
    return dict(dict(id='1', channel_id='2', author=dict(id='3', username='synthetic author'),
                     content='outer', components=[], attachments=[], embeds=[]), **fields)


def embed(children):
    return dict(type='components', components=children)


def tree():
    return [dict(type=17, components=[
        dict(type=10, content='first'),
        dict(type=9, components=[dict(type=10, content='section')],
             accessory=dict(type=2, label='visit', url='https://example.com/private-link?token=SECRET')),
        dict(type=12, items=[dict(media=dict(url='https://example.com/gallery.png'), description='private alt', spoiler=True),
                             dict(media=dict(url='https://example.com/second.png'))]),
        dict(type=9, components=[dict(type=10, content='thumbnail section')],
             accessory=dict(type=11, media=dict(url='https://example.com/thumb.png'), spoiler=True)),
        dict(type=13, file=dict(url='https://example.com/file.png')),
        dict(type=14), dict(type=10, content='last')])]


def attachment():
    return dict(id='4', filename='synthetic.png', content_type='image/png',
                url='https://cdn.discordapp.com/attachments/2/4/synthetic.png?hm=PRIVATE_SIGNATURE')


class DiscordComponentEmbedTests(unittest.TestCase):
    def project(self, children=None, **fields):
        return normalize_message(message(embeds=[embed(tree() if children is None else children)], **fields), access='available')

    def test_nested_tree_order_scope_and_media(self):
        r = self.project(attachments=[attachment()], components=[dict(type=10, content='top-level')])
        events = r['body']['events']
        self.assertEqual(r['body']['text'].splitlines(), ['outer', 'first', 'section', 'visit', 'thumbnail section', 'last', 'top-level'])
        start = next(i for i, e in enumerate(events) if e['type'] == 'embed_start')
        end = next(i for i, e in enumerate(events) if e['type'] == 'embed_end')
        self.assertTrue(all(e['source'].startswith('embeds/0/components/') for e in events[start + 1:end]))
        self.assertEqual(events[end + 1]['source'], 'components/0')
        media = [e for e in events[start:end] if e['type'] in ('media', 'file')]
        self.assertEqual([e['role'] for e in media], ['media', 'media', 'thumbnail', 'file'])
        self.assertIsNone(media[0]['attachmentId'])
        self.assertIsNone(media[0]['reference'])
        self.assertEqual(media[0]['description'], 'private alt')
        self.assertTrue(media[0]['spoiler'])
        self.assertTrue(media[2]['spoiler'])
        self.assertEqual(media[3]['url'], 'https://example.com/file.png')
        self.assertTrue(all(not e['downloaded'] and not e['playbackVerified'] for e in media))
        self.assertEqual(next(e['url'] for e in events if e['type'] == 'link'), 'https://example.com/private-link?token=SECRET')
        self.assertFalse(r['body']['projectionComplete'])

    def test_reuses_top_level_walker_without_changing_its_projection(self):
        top = normalize_message(message(components=tree(), attachments=[attachment()]))
        nested = self.project(attachments=[attachment()])
        top_events = [e for e in top['body']['events'] if e['source'].startswith('components/')]
        nested_events = [dict(e, source=e['source'].removeprefix('embeds/0/')) for e in nested['body']['events'] if e['source'].startswith('embeds/0/components/')]
        self.assertEqual(top_events, nested_events)

    def test_multiple_embeds_and_ordinary_embed_fields_keep_order(self):
        ordinary = dict(type='rich', author=dict(name='author'), title='title', description='description',
                        fields=[dict(name='name', value='value')], image=dict(url='https://example.com/image.png'),
                        footer=dict(text='footer'))
        r = normalize_message(message(embeds=[ordinary, embed([dict(type=10, content='middle')]), ordinary]))
        self.assertEqual(r['body']['text'].splitlines(), ['outer', 'author', 'title', 'description', 'name', 'value', 'footer', 'middle', 'author', 'title', 'description', 'name', 'value', 'footer'])
        base = normalize_message(message(embeds=[ordinary]))
        end = next(i for i, e in enumerate(r['body']['events']) if e['type'] == 'embed_end')
        self.assertEqual(r['body']['events'][:end + 1], base['body']['events'])

    def test_rich_embed_attachment_projection_matches_ordinary_media(self):
        # These ordinary embed media fields predate component link previews.
        # Compare their complete event payload against the same resolved media
        # represented as a top-level thumbnail (apart from source and role).
        for kind in ('image', 'thumbnail', 'video'):
            with self.subTest(kind=kind):
                ref = dict(url='attachment://synthetic.png')
                r = normalize_message(message(attachments=[attachment()], embeds=[dict(type='rich', **{kind: ref})]))
                event = next(e for e in r['body']['events'] if e['source'] == 'embeds/0/' + kind)
                top = normalize_message(message(attachments=[attachment()], components=[dict(type=11, media=ref)]))
                expected = next(e for e in top['body']['events'] if e['type'] == 'media')
                self.assertEqual(event, dict(expected, source='embeds/0/' + kind, role=kind))
                self.assertEqual(event['url'], attachment()['url'])
                self.assertEqual(event['attachmentId'], '4')

    def test_partial_replaces_embed_array_and_preserves_absent_fields(self):
        old = self.project(attachments=[attachment()], components=[dict(type=10, content='top')])
        before = deepcopy(old)
        new = normalize_message(dict(id='1', embeds=[embed([dict(type=10, content='replacement')])]), access='available', partial=True, previous=old)
        self.assertEqual(new['body']['text'], 'outer\nreplacement\ntop')
        self.assertEqual(new['people'], old['people'])
        self.assertEqual(len(new['files']), 1)
        absent = normalize_message(dict(id='1', content='edited'), access='available', partial=True, previous=old)
        self.assertIn('first', absent['body']['text'])
        cleared = normalize_message(dict(id='1', embeds=[]), access='available', partial=True, previous=old)
        self.assertEqual(cleared['body']['text'], 'outer\ntop')
        self.assertEqual(old, before)

    def test_denied_and_intent_limited_refresh_cannot_replace_embeds(self):
        old = self.project(attachments=[attachment()])
        for access in ('denied', 'intent_limited'):
            with self.subTest(access=access):
                incoming = message(embeds=[embed([dict(type=10, content='not authorized')])])
                r = normalize_message(incoming, access=access, previous=old)
                self.assertEqual(r['body'], old['body'])
                self.assertEqual(r['files'], old['files'])
                self.assertEqual(r['contentState'], 'retained_last_good')
                self.assertIn(access, r['gates'])
                fresh = normalize_message(incoming, access=access)
                self.assertIsNone(fresh['body'])
                self.assertEqual(fresh['files'], [])

    def test_malformed_arrays_and_nodes_fail(self):
        for children in (None, {}, '', [None], [dict(type=True)], [dict(type='10')],
                         [dict(type=17, components={})], [dict(type=12, items={})],
                         [dict(type=12, items=[None])], [dict(type=9, accessory=[])],
                         [dict(type=10, content=3)]):
            with self.subTest(children=children), self.assertRaises(ExtractionError):
                normalize_message(message(embeds=[embed(children)]))
        with self.assertRaises(ExtractionError):
            normalize_message(message(embeds=[dict(type='components')]))

    def test_unknown_component_warns_without_losing_following_text(self):
        r = self.project([dict(type=999, secret='private unknown'), dict(type=10, content='after')])
        self.assertEqual(r['body']['text'], 'outer\nafter')
        self.assertIn('Unsupported message component type 999', r['warnings'])
        self.assertTrue(any(e['type'] == 'unsupported_component' and e['source'] == 'embeds/0/components/0' for e in r['body']['events']))
        self.assertFalse(r['body']['projectionComplete'])

    def test_mismatched_embed_type_is_explicit_and_empty_tree_is_valid(self):
        for typ in ('rich', 'unknown', None):
            with self.subTest(typ=typ):
                r = normalize_message(message(embeds=[dict(type=typ, components=[dict(type=10, content='preserved')])]))
                self.assertIn('Embed components with non-components embed type', r['warnings'])
                self.assertIn('preserved', r['body']['text'])
                self.assertFalse(r['body']['projectionComplete'])
        empty = self.project([])
        self.assertIn('Empty component embed tree; no supported content projected', empty['warnings'])
        self.assertEqual([e['type'] for e in empty['body']['events']], ['text', 'embed_start', 'embed_end'])

    def test_forward_snapshot_uses_own_attachments_and_no_borrowed_author(self):
        r = normalize_message(message(message_snapshots=[dict(message=dict(embeds=[embed(tree())], attachments=[attachment()]))]))
        snap = r['snapshots'][0]
        self.assertEqual(snap['people'], [])
        self.assertEqual(snap['authorState'], 'not_in_snapshot_schema')
        self.assertIn('first', snap['body']['text'])
        self.assertIsNone(snap['files'][0]['attachmentId'])
        self.assertEqual(snap['files'][1]['attachmentId'], '4')
        self.assertEqual(r['files'], [])
        self.assertEqual(r['people'][0]['id'], '3')
        self.assertFalse(snap['body']['projectionComplete'])

    def test_embed_cannot_bind_enclosing_message_attachments(self):
        for ref in (dict(attachment_id='4'), dict(url='attachment://synthetic.png'),
                    dict(attachment_id='4', url='https://example.com/public.png')):
            with self.subTest(ref=ref), self.assertRaisesRegex(ExtractionError, 'cannot reference message attachments'):
                self.project([dict(type=13, file=ref)], attachments=[attachment()])
            for child in (dict(type=12, items=[dict(media=ref)]),
                          dict(type=9, components=[], accessory=dict(type=11, media=ref))):
                with self.subTest(ref=ref, child=child), self.assertRaisesRegex(ExtractionError, 'cannot reference message attachments'):
                    self.project([dict(type=17, components=[child])], attachments=[attachment()])
            # The existing message-level behavior is deliberately unchanged.
            top = normalize_message(message(components=[dict(type=13, file=ref)], attachments=[attachment()]))
            self.assertEqual(top['files'][0]['attachmentId'], '4')
        r = self.project([dict(type=11, media=dict(url='javascript:unsafe()'))])
        self.assertTrue(any(e.get('referenceRejected') for e in r['body']['events']))

    def test_receipt_remains_private_and_incomplete(self):
        r = self.project(attachments=[attachment()])
        before = deepcopy(r)
        receipt = discord_receipt(r)
        raw = json.dumps(receipt)
        for secret in ('PRIVATE_SIGNATURE', 'SECRET', 'private alt', 'synthetic author', 'private-link', 'synthetic.png', 'first'):
            self.assertNotIn(secret, raw)
        self.assertFalse(receipt['fullSupportAccepted'])
        self.assertFalse(receipt['body']['projectionComplete'])
        self.assertEqual(r, before)

    def test_nesting_guard_applies_in_embeds(self):
        child = dict(type=10, content='leaf')
        for _ in range(18):
            child = dict(type=17, components=[child])
        with self.assertRaisesRegex(ExtractionError, 'Component nesting limit'):
            self.project([child])


if __name__ == '__main__':
    unittest.main()
