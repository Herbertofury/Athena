"""Synthetic AppView defensive tests; actual private captures replay separately."""
import copy
import json
from pathlib import Path
import sys
import unittest

LAB = Path(__file__).resolve().parents[1] / 'experiments' / 'site-extraction-lab'
sys.path.insert(0, str(LAB))
from bluesky import (MAX_DEPTH, normalize_post, normalize_feed_page, normalize_follows_page,
                     normalize_profile, receipt)
from extractors import ExtractionError


def actor(name='alice'):
    return {'did': 'did:plc:' + name, 'handle': name + '.example',
            'displayName': 'Synthetic display prose',
            'avatar': 'https://cdn.example/' + name + '.jpg?token=secret'}


def post(name='alice', text='Synthetic body prose', rendered=None):
    result = {'uri': 'at://did:plc:' + name + '/app.bsky.feed.post/123', 'cid': 'syntheticcid',
              'author': actor(name), 'record': {'$type': 'app.bsky.feed.post', 'text': text,
              'createdAt': '2026-10-31T00:00:00Z'}}
    if rendered is not None:
        result['embed'] = rendered
    return result


def image_embed():
    return {'$type': 'app.bsky.embed.images#view', 'images': [
        {'thumb': 'https://cdn.example/first-thumb.jpg?secret=1',
         'fullsize': 'https://cdn.example/first.jpg?token=2', 'alt': 'Synthetic image prose'},
        {'thumb': 'https://cdn.example/second-thumb.jpg',
         'fullsize': 'https://cdn.example/second.jpg', 'alt': ''}]}


def quoted(value=None):
    p = value or post('bob', 'Synthetic quote prose')
    return {'$type': 'app.bsky.embed.record#view', 'record': {
        '$type': 'app.bsky.embed.record#viewRecord', 'uri': p['uri'], 'cid': p['cid'],
        'author': p['author'], 'value': p['record'],
        'embeds': [p['embed']] if 'embed' in p else []}}


class BlueskyTests(unittest.TestCase):
    def test_identity_did_required_not_handle(self):
        p = post()
        p['author']['handle'] = 'renamed.example'
        self.assertEqual(normalize_post(p)['identity']['authorDid'], 'did:plc:alice')
        for uri in ('at://alice.example/app.bsky.feed.post/123',
                    'at://did:plc:bob/app.bsky.feed.post/123',
                    'at://did:plc:alice/app.bsky.feed.like/123',
                    'at://did:plc:alice/app.bsky.feed.post/123?key=secret'):
            p['uri'] = uri
            with self.assertRaises(ExtractionError): normalize_post(p)

    def test_full_body_and_utf8_facets_preserved(self):
        p = post(text='🦊 café link\n  exact spacing')
        start = len('🦊 café '.encode('utf-8'))
        p['record']['facets'] = [{'index': {'byteStart': start, 'byteEnd': start + 4},
            'features': [{'$type': 'app.bsky.richtext.facet#link',
                          'uri': 'https://example.test/real?q=full#fragment'}]}]
        r = normalize_post(p)
        self.assertEqual(r['body']['raw'], p['record']['text'])
        self.assertEqual(r['body']['facets'][0]['text'], 'link')
        self.assertEqual(r['body']['facets'][0]['features'][0]['uri'],
                         'https://example.test/real?q=full#fragment')
        self.assertEqual(receipt(r)['body']['utf8Bytes'], len(p['record']['text'].encode()))

    def test_invalid_utf8_ranges_overlap_and_bool_rejected(self):
        for start, end in ((1, 3), (-1, 4), (0, 100), (True, 4), (4, 4)):
            p = post(text='🦊abc')
            p['record']['facets'] = [{'index': {'byteStart': start, 'byteEnd': end},
                'features': [{'$type': 'app.bsky.richtext.facet#tag', 'tag': 'test'}]}]
            with self.assertRaises(ExtractionError): normalize_post(p)
        p = post(text='abcd')
        p['record']['facets'] = [ {'index': {'byteStart': a, 'byteEnd': b},
            'features': [{'$type': 'app.bsky.richtext.facet#tag', 'tag': 'test'}]}
            for a, b in ((0, 3), (2, 4))]
        with self.assertRaises(ExtractionError): normalize_post(p)

    def test_author_repost_and_quoted_author_not_flattened(self):
        p = post(rendered=quoted())
        r = normalize_feed_page({'feed': [{'post': p, 'reason': {
            '$type': 'app.bsky.feed.defs#reasonRepost', 'by': actor('carol'),
            'uri': 'at://did:plc:carol/app.bsky.feed.repost/123'}}], 'cursor': 'next-secret'})
        r = r['posts'][0]
        self.assertEqual(r['author']['did'], 'did:plc:alice')
        self.assertEqual(r['repost']['actor']['did'], 'did:plc:carol')
        self.assertEqual(r['embeds'][0]['quote']['post']['author']['did'], 'did:plc:bob')
        self.assertEqual(r['embeds'][0]['quote']['post']['author']['role'], 'quoted_author')

    def test_raw_blobs_not_made_into_media_urls(self):
        p = post(rendered=image_embed())
        p['record']['embed'] = {'$type': 'app.bsky.embed.images', 'images': [
            {'image': {'$type': 'blob', 'ref': {'$link': 'rawCID'}, 'mimeType': 'image/png'}}]}
        r = normalize_post(p)
        self.assertEqual(r['embeds'][0]['images'][0]['fullsize'], 'https://cdn.example/first.jpg?token=2')
        self.assertEqual(r['rawRecord']['embed'], p['record']['embed'])
        self.assertNotIn('rawCID', json.dumps(receipt(r)))
        p.pop('embed')
        self.assertTrue(normalize_post(p)['warnings'])
        self.assertEqual(normalize_post(p)['embeds'], [])

    def test_record_with_media_preserves_quote_and_outer_video(self):
        q = quoted()
        p = post(rendered={'$type': 'app.bsky.embed.recordWithMedia#view',
            'record': {'record': q['record']}, 'media': {
                '$type': 'app.bsky.embed.video#view', 'cid': 'cid',
                'playlist': 'https://video.example/master.m3u8?token=secret',
                'thumbnail': 'https://video.example/poster.jpg?token=secret'}})
        r = normalize_post(p)['embeds'][0]
        self.assertEqual(r['quote']['post']['author']['did'], 'did:plc:bob')
        self.assertTrue(r['media']['video']['playlist'].endswith('?token=secret'))
        self.assertFalse(r['media']['video']['playbackVerified'])

    def test_external_card_image_is_not_avatar_or_post_image(self):
        p = post(rendered={'$type': 'app.bsky.embed.external#view', 'external': {
            'uri': 'https://store.example/detail?item=7#real', 'thumb': 'https://cdn.example/card.jpg',
            'title': 'Synthetic card title prose', 'description': 'Synthetic card description prose'}})
        r = normalize_post(p)
        self.assertEqual(r['embeds'][0]['external']['imageRole'], 'external_card_image')
        self.assertEqual(r['embeds'][0]['external']['uri'], 'https://store.example/detail?item=7#real')
        self.assertNotEqual(r['author']['avatar'], r['embeds'][0]['external']['thumbnail'])

    def test_unavailable_quote_states_and_nonpost(self):
        for suffix, expected in (('viewBlocked', 'blocked'), ('viewNotFound', 'not_found'), ('viewDetached', 'detached')):
            r = normalize_post(post(rendered={'$type': 'app.bsky.embed.record#view',
                'record': {'$type': 'app.bsky.embed.record#' + suffix, 'uri': 'at://did:plc:bob/app.bsky.feed.post/123'}}))
            self.assertEqual(r['embeds'][0]['quote']['state'], expected)
        q = quoted(); q['record']['value']['$type'] = 'app.bsky.feed.generator'
        self.assertEqual(normalize_post(post(rendered=q))['embeds'][0]['quote']['state'], 'non_post')

    def test_nested_identity_mismatch_rejected(self):
        q = quoted(); q['record']['author'] = actor('wrong')
        with self.assertRaises(ExtractionError): normalize_post(post(rendered=q))

    def test_unknown_embed_warns_without_fabricated_projection(self):
        r = normalize_post(post(rendered={'$type': 'unknown.embed', 'images': ['untrusted']}))
        self.assertEqual(r['embeds'][0]['kind'], 'unknown')
        self.assertTrue(r['warnings'])
        self.assertNotIn('images', r['embeds'][0])

    def test_nesting_bounded(self):
        p = post('bob')
        for _ in range(MAX_DEPTH + 3):
            p = post('bob', rendered=quoted(p))
        r = normalize_post(p)
        encoded = json.dumps(receipt(r))
        self.assertIn('depth_limit', encoded)
        self.assertLess(len(encoded), 15000)

    def test_follow_subject_cursor_and_partial_import(self):
        p = {'subject': actor(), 'follows': [actor('bob')], 'cursor': 'opaque?token=secret'}
        r = normalize_follows_page(p, 'did:plc:alice')
        self.assertFalse(r['completeImport'])
        self.assertTrue(r['pagination']['hasNextCursor'])
        with self.assertRaises(ExtractionError): normalize_follows_page(p, 'did:plc:bob')
        del p['cursor']
        terminal = normalize_follows_page(p, 'did:plc:alice')
        self.assertTrue(terminal['pagination']['terminalPageHint'])
        self.assertFalse(terminal['pagination']['cursorPresent'])
        p['cursor'] = None
        r = normalize_follows_page(p, 'did:plc:alice')
        self.assertTrue(r['pagination']['terminalPageHint'])
        self.assertFalse(r['completeImport'])
        p['follows'].append(actor('bob'))
        with self.assertRaises(ExtractionError): normalize_follows_page(p, 'did:plc:alice')

    def test_missing_feed_cursor_terminal_but_malformed_rejected(self):
        r = normalize_feed_page({'feed': [post_item := {'post': post()}]})
        self.assertTrue(r['pagination']['terminalPageHint'])
        self.assertFalse(r['pagination']['completeImport'])
        for cursor in ('', 3, False, [], {}):
            with self.assertRaises(ExtractionError):
                normalize_feed_page({'feed': [post_item], 'cursor': cursor})
            with self.assertRaises(ExtractionError):
                normalize_follows_page({'subject': actor(), 'follows': [], 'cursor': cursor},
                                       'did:plc:alice')

    def test_repost_uri_actor_and_collection_join_required(self):
        reason = {'$type': 'app.bsky.feed.defs#reasonRepost', 'by': actor('carol')}
        for uri in ('at://did:plc:alice/app.bsky.feed.repost/123',
                    'at://did:plc:carol/app.bsky.feed.post/123',
                    'at://did:plc:carol/app.bsky.feed.repost/..', 'bad'):
            reason['uri'] = uri
            with self.assertRaises(ExtractionError):
                normalize_feed_page({'feed': [{'post': post(), 'reason': reason}]})
        del reason['uri']
        self.assertEqual(normalize_feed_page({'feed': [{'post': post(), 'reason': reason}]})
                         ['posts'][0]['repost']['actor']['did'], 'did:plc:carol')

    def test_missing_or_rejected_media_explicitly_incomplete(self):
        for rendered in ({'$type': 'app.bsky.embed.images#view', 'images': [{}]},
                         {'$type': 'app.bsky.embed.images#view', 'images': []},
                         {'$type': 'app.bsky.embed.video#view'},
                         {'$type': 'app.bsky.embed.video#view', 'playlist': 'javascript:evil'},
                         {'$type': 'app.bsky.embed.external#view', 'external': {'uri': 'javascript:evil'}}):
            r = normalize_post(post(rendered=rendered))
            self.assertFalse(r['embeds'][0]['mediaComplete'])
            self.assertTrue(r['warnings'])
            self.assertFalse(receipt(r)['embeds'][0]['mediaComplete'])

    def test_receipt_excludes_all_prose_cursors_queries_and_raw_blobs(self):
        p = post(rendered=quoted(post('bob', rendered=image_embed())))
        r = normalize_feed_page({'feed': [{'post': p}], 'cursor': 'CURSOR-SECRET'})
        encoded = json.dumps(receipt(r))
        for secret in ('Synthetic', 'token=', 'secret=', 'CURSOR-SECRET', 'rawRecord', 'displayName'):
            self.assertNotIn(secret, encoded)
        follow = receipt(normalize_follows_page({'subject': actor(), 'follows': [actor('bob')],
                         'cursor': 'CURSOR-SECRET'}, 'did:plc:alice'))
        self.assertNotIn('CURSOR-SECRET', json.dumps(follow))

    def test_receipt_omits_secret_paths_in_every_url_role(self):
        secret = 'https://discord.com/api/webhooks/123/WEBHOOK-CREDENTIAL?key=secret'
        p = post(rendered={'$type': 'app.bsky.embed.external#view', 'external': {
            'uri': secret, 'thumb': secret, 'title': 'Synthetic'}})
        p['author']['avatar'] = secret
        r = normalize_post(p)
        self.assertEqual(r['author']['avatar'], secret)
        self.assertEqual(r['embeds'][0]['external']['uri'], secret)
        encoded = json.dumps(receipt(r))
        self.assertNotIn('WEBHOOK-CREDENTIAL', encoded)
        self.assertNotIn('/api/webhooks', encoded)
        self.assertNotIn('key=secret', encoded)
        # Unknown token-path origins are treated identically; no incomplete denylist.
        for target in ('https://hooks.slack.com/services/WORKSPACE/SECRET',
                       'https://api.telegram.org/botBOT-SECRET/sendMessage',
                       'https://other.example/arbitrary/TOKEN-IN-PATH'):
            p['author']['avatar'] = target
            self.assertNotIn(url_tail := target.split('/', 3)[-1],
                             json.dumps(receipt(normalize_post(p))))

    def test_missing_text_does_not_substitute_card_description(self):
        p = post(); del p['record']['text']
        with self.assertRaises(ExtractionError): normalize_post(p)

    def test_raw_input_structural_limit_and_cycles(self):
        p = post()
        p['record']['cycle'] = p
        with self.assertRaises(ExtractionError): normalize_post(p)
        p = post()
        item = p['record']
        for _ in range(70):
            item['nested'] = {}
            item = item['nested']
        with self.assertRaises(ExtractionError): normalize_post(p)

    def test_unsafe_media_and_avatar_not_accepted(self):
        p = post(rendered=image_embed()); p['author']['avatar'] = 'javascript:evil'
        p['embed']['images'][0]['fullsize'] = 'https://user:pass@cdn.example/secret'
        r = normalize_post(p)
        self.assertIsNone(r['author']['avatar'])
        self.assertIsNone(r['embeds'][0]['images'][0]['fullsize'])
        self.assertEqual(r['rawRecord']['text'], 'Synthetic body prose')

if __name__ == '__main__': unittest.main()
