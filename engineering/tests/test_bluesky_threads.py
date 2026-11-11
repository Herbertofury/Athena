"""Synthetic adversarial fixtures only; not live provider acceptance."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest
from unittest.mock import patch

PATH = Path(__file__).resolve().parents[1] / 'experiments/bluesky-thread-lab/threads.py'
SPEC = importlib.util.spec_from_file_location('bluesky_threads', PATH)
t = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(t)


def uri(key='root'):
    return 'at://did:plc:synthetic/app.bsky.feed.post/' + key


def ref(key):
    return {'uri': uri(key), 'cid': 'synthetic-cid-' + key}


def post(key='root', parent=None, root='root'):
    record = {'$type': 'app.bsky.feed.post', 'text': 'Synthetic secret prose 🧪',
              'createdAt': '2026-11-11T00:00:00Z'}
    if parent:
        record['reply'] = {'parent': ref(parent), 'root': ref(root)}
    return {'$type': t.VIEW, 'post': {**ref(key),
            'author': {'did': 'did:plc:synthetic', 'handle': 'private.invalid'},
            'record': record, 'indexedAt': '2026-11-11T00:00:01Z', 'replyCount': 0}}


def run(node=None, **kwargs):
    value = {'thread': post() if node is None else node}
    return t.normalize_capture(json.dumps(value).encode(), uri=kwargs.pop('uri', uri()),
                               depth=kwargs.pop('depth', 6),
                               parent_height=kwargs.pop('parent_height', 8), **kwargs)


class SyntheticThreadTests(unittest.TestCase):
    def failed(self, node, **kwargs):
        attempt = run(node, **kwargs)
        self.assertEqual(attempt['status'], 'failed_attempt')
        self.assertEqual(attempt['failure'], 'invalid_or_out_of_bounds_response')
        return attempt

    def test_root_reply_ancestor_and_private_unknown_fields(self):
        node = post('child', 'root')
        node['parent'] = post()
        node['post']['unknownFuture'] = {'sensitive': 'keep privately'}
        child = post('grandchild', 'child')
        node['replies'] = [child]
        attempt = run(node, uri=uri('child'), depth=1, parent_height=1)
        self.assertEqual(attempt['status'], 'normalized_capture')
        self.assertEqual(attempt['nodeCount'], 3)
        self.assertEqual(attempt['rawResponse']['thread'], node)
        self.assertEqual(json.loads(attempt['rawBytes']), {'thread': node})
        self.assertEqual(attempt['thread']['post']['body']['raw'], node['post']['record']['text'])
        self.assertFalse(t.receipt(attempt)['completeHistory'])

    def test_missing_and_empty_replies_are_distinct_neither_complete(self):
        node = post()
        node['post']['replyCount'] = 10
        one = t.receipt(run(node, depth=0))
        self.assertFalse(one['thread']['repliesPresent'])
        node['replies'] = []
        two = t.receipt(run(node, depth=0))
        self.assertTrue(two['thread']['repliesPresent'])
        self.assertEqual(two['thread']['replies'], [])
        self.assertFalse(two['completeHistory'])

    def test_reply_count_and_observed_array_presence_are_independent(self):
        node = post()
        del node['post']['replyCount']
        public = t.receipt(run(node))['thread']
        self.assertNotIn('replyCount', public)
        self.assertNotIn('observedDirectReplyCount', public)
        self.assertFalse(public['repliesPresent'])
        node['post']['replyCount'] = 0
        node['replies'] = []
        public = t.receipt(run(node))['thread']
        self.assertEqual(public['replyCount'], 0)
        self.assertEqual(public['observedDirectReplyCount'], 0)
        self.assertTrue(public['repliesPresent'])
        node['post']['replyCount'] = 6
        del node['replies']
        attempt = run(node, depth=0)
        public = t.receipt(attempt)
        self.assertEqual(attempt['thread']['replyCount'], 6)
        self.assertEqual(public['thread']['replyCount'], 6)
        self.assertNotIn('observedDirectReplyCount', public['thread'])
        self.assertFalse(public['completeHistory'])
        node['post']['replyCount'] = None
        self.failed(node)

    def test_unavailable_states_do_not_claim_deletion(self):
        for kind, flag, state in [(t.NOT_FOUND, 'notFound', 'not_found'), (t.BLOCKED, 'blocked', 'blocked')]:
            node = {'$type': kind, 'uri': uri(), flag: True}
            if flag == 'blocked':
                node['author'] = {'did': 'did:plc:synthetic', 'viewer': {'secret': 'token'}}
            result = run(node)
            self.assertEqual(result['status'], 'normalized_capture')
            self.assertEqual(result['thread']['state'], state)
            self.assertNotIn('deleted', json.dumps(t.receipt(result)))
            for bad in (False, 1, 'true', None):
                broken = copy.deepcopy(node)
                broken[flag] = bad
                self.failed(broken)

    def test_unknown_variant_is_opaque_and_unbound_without_uri(self):
        node = {'$type': 'future#secret', 'text': 'do not publish', 'replies': [{'junk': 1}]}
        result = run(node)
        self.assertEqual(result['status'], 'unbound_unknown_variant')
        self.assertEqual(result['thread']['rawNode'], node)
        self.assertEqual(result['nodeCount'], 1)
        self.assertNotIn('future', json.dumps(t.receipt(result)))
        node['uri'] = uri()
        self.assertEqual(run(node)['status'], 'normalized_capture')
        node['uri'] = uri('wrong')
        self.failed(node)

    def test_root_and_author_identity(self):
        self.failed(post('other'))
        node = post()
        node['post']['author']['did'] = 'did:plc:other'
        self.failed(node)
        blocked = {'$type': t.BLOCKED, 'uri': uri(), 'blocked': True,
                   'author': {'did': 'did:plc:other'}}
        self.failed(blocked)

    def test_invalid_union_and_required_post_fields(self):
        for node in ({}, {'$type': t.VIEW}, {'$type': 4}, {'$type': t.NOT_FOUND, 'notFound': True}):
            self.failed(node)
        for field in ('cid', 'indexedAt', 'record', 'author', 'uri'):
            node = post()
            del node['post'][field]
            self.failed(node)
        for bad in (None, {}, False):
            node = post()
            node['replies'] = bad
            self.failed(node)

    def test_visible_parent_and_root_strong_references(self):
        base = post()
        base['replies'] = [post('child', 'root')]
        for section, field, bad in [('parent', 'uri', uri('wrong')), ('parent', 'cid', 'wrong'),
                                     ('root', 'uri', uri('wrong')), ('root', 'cid', 'wrong')]:
            node = copy.deepcopy(base)
            node['replies'][0]['post']['record']['reply'][section][field] = bad
            self.failed(node)
        node = copy.deepcopy(base)
        del node['replies'][0]['post']['record']['reply']
        self.failed(node)
        node = post('child', 'root')
        node['parent'] = {'$type': t.NOT_FOUND, 'uri': uri('wrong'), 'notFound': True}
        self.failed(node, uri=uri('child'))

    def test_reference_shape_self_cycle_and_cross_branch_cycles(self):
        for bad in (None, {}, False, {'uri': uri('root'), 'cid': False}):
            node = post('child', 'root')
            node['post']['record']['reply']['parent'] = bad
            self.failed(node, uri=uri('child'))
        node = post('child', 'child')
        self.failed(node, uri=uri('child'))
        node = post('root', 'child', root='unseen')
        node['replies'] = [post('child', 'root', root='unseen')]
        self.failed(node)

    def test_ancestor_cycle_conflicting_duplicate_and_siblings(self):
        node = post()
        node['replies'] = [post()]
        self.failed(node)
        node = post()
        node['replies'] = [post('child', 'root'), post('child', 'root')]
        self.failed(node)
        node['replies'][1]['post']['record']['text'] = 'different'
        self.failed(node)
        node['replies'][1] = {'$type': t.BLOCKED, 'uri': uri('child'), 'blocked': True,
                              'author': {'did': 'did:plc:synthetic'}}
        self.failed(node)

    def test_request_and_response_integer_boundaries(self):
        for key in ('depth', 'parent_height'):
            for bad in (True, False, -1, 1001, 1.0, float('inf'), '2'):
                with self.subTest(key=key, bad=bad), self.assertRaises(t.ExtractionError):
                    run(**{key: bad})
        for bad in (True, -1, 1.1, '0'):
            node = post()
            node['post']['replyCount'] = bad
            self.failed(node)
        with self.assertRaises(t.ExtractionError):
            run(http_status=True)
        with self.assertRaises(t.ExtractionError):
            run(uri='at://someone.test/app.bsky.feed.post/root')
        self.assertEqual(run(depth=1000, parent_height=1000)['status'], 'normalized_capture')

    def test_requested_geometry_and_local_thread_limits(self):
        node = post()
        node['replies'] = [post('child', 'root')]
        self.failed(node, depth=0)
        node = post('child', 'root')
        node['parent'] = post()
        self.failed(node, uri=uri('child'), parent_height=0)
        node = post()
        node['replies'] = [post('c' + str(i), 'root') for i in range(t.MAX_THREAD_NODES)]
        self.failed(node)
        node = post()
        cursor = node
        for i in range(t.MAX_THREAD_DEPTH + 1):
            child = post('c' + str(i), 'root' if i == 0 else 'c' + str(i - 1))
            cursor['replies'] = [child]
            cursor = child
        self.failed(node, depth=1000)

    def test_bytes_decoder_unicode_and_structural_limits(self):
        good = json.dumps({'thread': post()}).encode()
        for raw in (b'{"thread":{},"thread":{}}', b'{"x":NaN}', b'{"x":1e999}',
                    b'\xff', b'{"x":"\\ud800"}', b'{"\\udfff":0}', b'[' * 2000,
                    b'[]', b'null', b'{"error":"private provider text"}'):
            result = t.normalize_capture(raw, uri=uri(), depth=1, parent_height=1)
            self.assertEqual(result['status'], 'failed_attempt')
            self.assertEqual(result['rawBytes'], raw)
        for raw in (good.decode(), bytearray(good), b'x' * (t.MAX_BYTES + 1)):
            with self.assertRaises(t.ExtractionError):
                t.normalize_capture(raw, uri=uri(), depth=1, parent_height=1)
        with patch.object(t, 'MAX_JSON_DEPTH', 3):
            self.failed(post())
        with patch.object(t, 'MAX_JSON_NODES', 8):
            self.failed(post())

    def test_capture_count(self):
        capture = {'raw': json.dumps({'thread': post()}).encode(), 'uri': uri(), 'depth': 0, 'parent_height': 0}
        self.assertEqual(len(t.normalize_captures([capture] * t.MAX_CAPTURES)), t.MAX_CAPTURES)
        with self.assertRaises(t.ExtractionError):
            t.normalize_captures([capture] * (t.MAX_CAPTURES + 1))
        with self.assertRaises(t.ExtractionError):
            t.normalize_captures(iter([capture]))

    def test_access_failures_and_no_error_leakage(self):
        raw = b'{"error":"token-secret","message":"private-text"}'
        for status in (401, 403, 404, 429, 500):
            attempt = t.normalize_capture(raw, uri=uri(), depth=1, parent_height=1, http_status=status)
            self.assertEqual(attempt['failure'], 'http_status')
            self.assertEqual(attempt['rawBytes'], raw)
            public = json.dumps(t.receipt(attempt))
            for secret in ('token-secret', 'private-text', 'at://', 'synthetic'):
                self.assertNotIn(secret, public)

    def test_adapter_full_text_facets_media_and_public_privacy(self):
        node = post()
        body = '🧪 secret'
        node['post']['record']['text'] = body
        node['post']['record']['facets'] = [{'index': {'byteStart': 0, 'byteEnd': 4},
            'features': [{'$type': 'app.bsky.richtext.facet#link', 'uri': 'https://secret.invalid/token'}]}]
        node['post']['embed'] = {'$type': 'app.bsky.embed.images#view', 'images': [
            {'thumb': 'https://secret.invalid/thumb', 'fullsize': 'https://secret.invalid/full', 'alt': 'secret alt'}]}
        node['post']['viewer'] = {'like': 'private token'}
        result = run(node)
        self.assertEqual(result['status'], 'normalized_capture')
        self.assertEqual(result['thread']['post']['body']['facets'][0]['text'], '🧪')
        self.assertEqual(result['thread']['post']['embeds'][0]['images'][0]['alt'], 'secret alt')
        public = t.receipt(result)
        self.assertEqual(public['thread']['media']['images'], 1)
        self.assertEqual(public['thread']['body']['utf8Bytes'], len(body.encode()))
        for secret in ('secret', 'private', 'viewer', 'https:', 'at://', 'synthetic', 'handle', 'alt'):
            self.assertNotIn(secret, json.dumps(public))
        node['post']['record']['facets'][0]['index']['byteEnd'] = 1
        self.failed(node)

    def test_unsupported_gallery_retained_not_complete(self):
        node = post()
        node['post']['embed'] = {'$type': 'app.bsky.embed.gallery#view', 'secret': 'raw private'}
        attempt = run(node)
        self.assertEqual(attempt['thread']['post']['embeds'][0]['rawEmbed'], node['post']['embed'])
        self.assertEqual(t.receipt(attempt)['thread']['media']['unknownOrLimited'], 1)
        self.assertFalse(t.receipt(attempt)['fullSupportAccepted'])

    def test_video_external_and_quote_counts_without_urls(self):
        for embed, counter in [({'$type': 'app.bsky.embed.video#view', 'playlist': 'https://secret.invalid/x'}, 'videos'),
                               ({'$type': 'app.bsky.embed.external#view', 'external': {'uri': 'https://secret.invalid/x'}}, 'externalCards'),
                               ({'$type': 'app.bsky.embed.record#view', 'record': {'$type': 'app.bsky.embed.record#viewNotFound', 'uri': uri('quoted')}}, 'quotes')]:
            node = post()
            node['post']['embed'] = embed
            public = t.receipt(run(node))
            self.assertEqual(public['thread']['media'][counter], 1)
            if counter == 'quotes':
                self.assertEqual(public['thread']['media']['quoteStates']['not_found'], 1)
            self.assertNotIn('secret', json.dumps(public))
            self.assertFalse(public['playbackVerified'])


if __name__ == '__main__':
    unittest.main()
