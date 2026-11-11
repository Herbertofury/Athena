"""Synthetic adversarial tests; no network or real profile fixtures."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

PATH = Path(__file__).resolve().parents[1] / 'experiments/peertube-video-lab/videos.py'
SPEC = importlib.util.spec_from_file_location('peertube_videos', PATH)
v = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(v)
UUID = '12345678-1234-4123-8123-123456789abc'
INSTANCE = 'https://synthetic.invalid'


def observation(obj=None, kind='video', **changes):
    if obj is None:
        obj = {'uuid': UUID, 'id': 7, 'description': '**Synthetic**', 'truncatedDescription': 'Syn…', 'files': [], 'streamingPlaylists': []}
    value = {'kind': kind, 'instance': INSTANCE, 'request_uuid': UUID,
             'request_path': '/api/v1/videos/' + UUID + ('/captions' if kind == 'captions' else ''),
             'body': json.dumps(obj).encode(), 'status': 200, 'complete': True, 'redirected': False, 'contract': v.CONTRACT}
    value.update(changes)
    return value


def normalize(*obs):
    return v.normalize(list(obs), expected_uuid=UUID, instance=INSTANCE)


class PeerTubeTests(unittest.TestCase):
    def state(self, obs):
        return normalize(obs).receipt()['observations'][0]['state']

    def test_full_source_and_ambiguous_contract(self):
        obj = {'uuid': UUID, 'description': ' \r\n[link](https://example.invalid/?secret=1)\n', 'truncatedDescription': '', 'support': None}
        result = normalize(observation(obj))
        r = result.records[0]
        self.assertEqual(r['description']['value'], obj['description'])
        self.assertEqual(r['description']['projection']['raw'], obj['description'])
        self.assertFalse(r['description']['projection']['projectionComplete'])
        self.assertEqual(r['truncatedDescription']['state'], 'empty')
        self.assertEqual(r['support']['state'], 'null')
        self.assertEqual(r['descriptionContract'], 'full_field_contract')
        self.assertEqual(normalize(observation(obj, contract='unknown')).records[0]['descriptionContract'], 'ambiguous_contract')
        self.assertEqual(normalize(observation({'uuid': UUID})).records[0]['description']['state'], 'missing')

    def test_roles_and_instance_identity(self):
        obj = {'uuid': UUID, 'id': 3, 'shortUUID': 'short', 'url': 'https://canonical.invalid/video', 'account': {'id': 1}, 'channel': {'id': 2, 'ownerAccount': {'id': 4}}}
        r = normalize(observation(obj)).records[0]
        self.assertEqual(r['identity']['localId']['value'], 3)
        self.assertEqual(r['attribution']['channelOwnerAccount']['value']['id'], 4)
        self.assertEqual(r['attribution']['originalCreativeAuthor'], 'not_established')
        self.assertEqual(self.state(observation(obj, instance='https://other.invalid')), 'association_mismatch')
        for key in ('request_uuid', 'request_path'):
            self.assertEqual(self.state(observation(obj, **{key: 'wrong'})), 'association_mismatch')
        obj['uuid'] = 'different'
        self.assertEqual(self.state(observation(obj)), 'identity_mismatch')

    def test_hls_only_audio_and_null_legacy_thumbnail(self):
        obj = {'uuid': UUID, 'files': [], 'thumbnailPath': None, 'previewPath': None,
               'thumbnails': [{'fileUrl': 'https://synthetic.invalid/t.jpg'}],
               'streamingPlaylists': [{'type': 1, 'playlistUrl': 'https://synthetic.invalid/p.m3u8', 'files': [
                   {'resolution': {'id': 0}, 'hasAudio': True, 'hasVideo': False, 'size': 31, 'fileUrl': 'https://synthetic.invalid/audio', 'fileDownloadUrl': 'https://synthetic.invalid/download', 'magnetUri': 'magnet:?synthetic', 'torrentUrl': 'https://synthetic.invalid/torrent'}]}]}
        result = normalize(observation(obj))
        self.assertEqual(result.records[0]['counts'], {'directFiles': 0, 'playlists': 1, 'representations': 1, 'thumbnails': 1})
        self.assertEqual(result.records[0]['media']['thumbnailPath']['state'], 'null')
        self.assertTrue(all(x is False for x in result.receipt()['acceptance'].values()))
        private_file = result.records[0]['media']['streamingPlaylists']['value'][0]['files'][0]
        self.assertIn('magnetUri', private_file)
        self.assertIn('fileDownloadUrl', private_file)

    def test_live_unavailable_and_unknown(self):
        for state in (1, 4, 5, 7, 999):
            obj = {'uuid': UUID, 'state': {'id': state}, 'privacy': {'id': 5}, 'isLive': True, 'downloadEnabled': False}
            r = normalize(observation(obj)).records[0]
            self.assertEqual(r['availability']['state']['value']['id'], state)
            self.assertEqual(r['media']['files']['state'], 'missing')
        for key in ('isLive', 'downloadEnabled'):
            self.assertEqual(self.state(observation({'uuid': UUID, key: 1})), 'invalid_type')

    def test_caption_request_binding_and_counts(self):
        data = {'total': 1, 'data': [{'language': {'id': 'en', 'label': 'English'}, 'captionPath': None, 'fileUrl': 'https://synthetic.invalid/sub.vtt', 'automaticallyGenerated': True}]}
        self.assertEqual(normalize(observation(data, 'captions')).records[0]['countState'], 'count_matches')
        self.assertEqual(self.state(observation(data, 'captions', request_uuid='wrong')), 'association_mismatch')
        data['uuid'] = 'wrong'
        self.assertEqual(self.state(observation(data, 'captions')), 'identity_mismatch')
        del data['uuid']
        for obj, expected in (({'data': []}, 'missing_total'), ({'total': 0}, 'missing_data'), ({'total': 2, 'data': []}, 'count_mismatch')):
            self.assertEqual(normalize(observation(obj, 'captions')).records[0]['countState'], expected)
        self.assertEqual(self.state(observation({'total': True, 'data': []}, 'captions')), 'invalid_type')

    def test_transport_failures_retained_and_no_deletion(self):
        for code, expected in ((401, 'unauthorized'), (403, 'forbidden'), (404, 'not_found_not_deletion'), (429, 'rate_limited'), (302, 'redirect'), (206, 'partial'), (500, 'http_unavailable')):
            obs = observation(status=code, private_error='private detail')
            result = normalize(obs, observation())
            self.assertEqual(result.receipt()['observations'][0]['state'], expected)
            self.assertEqual(result.attempts[0]['original'], {k: val for k, val in obs.items() if k != 'private_error'})
            self.assertEqual(result.attempts[0]['ignoredEnvelopeFieldCount'], 1)
            self.assertEqual(len(result.records), 1)
        self.assertEqual(self.state(observation(complete=False)), 'partial')
        self.assertEqual(self.state(observation(redirected=True)), 'redirect')
        self.assertEqual(self.state(observation(status=True)), 'invalid_transport')
        self.assertEqual(self.state(observation(complete=1)), 'invalid_transport')

    def test_strict_json(self):
        for body in (b'{"uuid":1,"uuid":2}', b'{"x":NaN}', b'{"x":Infinity}', b'{', b'\xff', b'[]', b'{"x":1e999}', b'{"x":"\\ud800"}'):
            with self.subTest(body=body):
                self.assertNotEqual(self.state(observation(body=body)), 'metadata_observed')
        self.assertEqual(self.state(observation(body='{}')), 'invalid_body_type')
        self.assertEqual(self.state(observation({'uuid': UUID, 'id': True})), 'invalid_type')
        self.assertEqual(self.state(observation({'uuid': UUID, 'files': [{'size': False}]})), 'invalid_type')

    def test_limits(self):
        self.assertEqual(self.state(observation(body=b'x' * (v.MAX_BYTES + 1))), 'byte_limit')
        self.assertEqual(self.state(observation({'uuid': UUID, 'files': [{}] * (v.MAX_MEDIA + 1)})), 'collection_limit')
        self.assertEqual(self.state(observation({'total': 257, 'data': [{}] * 257}, 'captions')), 'collection_limit')
        nested = 0
        for _ in range(v.MAX_DEPTH + 1):
            nested = [nested]
        self.assertEqual(self.state(observation({'uuid': UUID, 'unknown': nested})), 'tree_limit')
        self.assertEqual(self.state(observation({'uuid': UUID, 'unknown': [0] * v.MAX_NODES})), 'tree_limit')
        with self.assertRaises(ValueError):
            normalize(*([observation()] * (v.MAX_OBSERVATIONS + 1)))

    def test_contradictions_are_not_overwritten(self):
        first = observation({'uuid': UUID, 'unknown': True})
        second = observation({'uuid': UUID, 'unknown': 1})
        result = normalize(first, second)
        self.assertEqual(len(result.records), 2)
        self.assertEqual(result.receipt()['observations'][1]['state'], 'contradiction')
        self.assertIs(result.attempts[0]['parsed']['unknown'], True)
        self.assertIs(type(result.attempts[1]['parsed']['unknown']), int)
        result = normalize(observation({'uuid': UUID, 'id': 1}), observation({'uuid': UUID, 'id': True}))
        self.assertTrue(result.receipt()['observations'][1]['contradiction'])
        self.assertEqual(result.receipt()['observations'][1]['state'], 'invalid_type')

    def test_receipt_isolation_and_allowlist(self):
        obs = observation({'uuid': UUID, 'description': 'PRIVATE_SENTINEL', 'account': {'name': 'SECRET_ACTOR'}, 'unknown': 'SECRET_UNKNOWN'})
        result = normalize(obs)
        before = result.receipt()
        obs['body'] = b'changed'
        result.records[0]['description']['value'] = 'LATE_LEAK'
        result.attempts[0]['outcome']['state'] = 'LATE_LEAK'
        result.receipt()['observations'][0]['state'] = 'LATE_LEAK'
        self.assertEqual(before, result.receipt())
        text = json.dumps(before)
        for secret in ('PRIVATE_SENTINEL', 'SECRET_ACTOR', 'SECRET_UNKNOWN', 'LATE_LEAK', UUID, INSTANCE):
            self.assertNotIn(secret, text)
        self.assertTrue(all(value is False for value in before['acceptance'].values()))

    def test_bounded_retention_and_shared_budget(self):
        huge = b'x' * (v.MAX_BYTES + 1)
        result = normalize(observation(body=huge))
        attempt = result.attempts[0]
        self.assertEqual(attempt['receivedBytes'], len(huge))
        self.assertEqual(attempt['retainedBytes'], v.MAX_FAILURE_PREFIX)
        self.assertEqual(len(attempt['original']['body']), v.MAX_FAILURE_PREFIX)
        self.assertEqual(attempt['bodyRetention'], 'prefix_only')
        self.assertEqual(attempt['outcome']['state'], 'byte_limit')
        # Valid bounded bodies can still exhaust the shared batch retention cap.
        body = json.dumps({'uuid': UUID, 'unknown': 'x' * 900000}).encode()
        result = normalize(*[observation(body=body) for _ in range(5)])
        self.assertLessEqual(sum(a['retainedBytes'] for a in result.attempts), v.MAX_TOTAL_RETAINED_BYTES)
        self.assertEqual(len(result.attempts), 5)
        self.assertEqual(len(result.records), 2)
        self.assertEqual(result.attempts[-1]['outcome']['state'], 'retained_byte_budget')
        self.assertEqual(result.attempts[-1]['retainedBytes'], 0)

    def test_arbitrary_envelope_metadata_is_not_traversed(self):
        class Hostile:
            def __deepcopy__(self, memo):
                raise AssertionError('must not copy')
            def __repr__(self):
                raise AssertionError('must not render')
        cycle = []
        cycle.append(cycle)
        deep = 0
        for _ in range(2000):
            deep = [deep]
        for extra in (cycle, deep, Hostile()):
            result = normalize(observation(extra=extra))
            self.assertEqual(result.attempts[0]['ignoredEnvelopeFieldCount'], 1)
            self.assertNotIn('extra', result.attempts[0]['original'])
            self.assertEqual(result.receipt()['observations'][0]['state'], 'metadata_observed')
        for obs in (None, [], Hostile(), {'body': Hostile()}, observation(kind=Hostile()), observation(status=Hostile()), observation(status=10**10000), observation(contract=cycle)):
            result = normalize(obs)
            self.assertNotEqual(result.receipt()['observations'][0]['state'], 'metadata_observed')
            json.dumps(result.receipt())
        self.assertEqual(self.state(observation(complete='SECRET_FLAG')), 'invalid_transport')
        result = normalize(observation(complete='SECRET_FLAG'))
        self.assertEqual(result.attempts[0]['original']['complete'], 'SECRET_FLAG')
        self.assertNotIn('SECRET_FLAG', json.dumps(result.receipt()))
        self.assertEqual(self.state(observation(instance='x' * 100000)), 'association_mismatch')
        self.assertEqual(self.state(observation(contract='\ud800')), 'invalid_contract')

    def test_playlist_type_states(self):
        obj = {'uuid': UUID, 'streamingPlaylists': [{'type': 1}, {'type': 999}, {}]}
        s = normalize(observation(obj)).receipt()['observations'][0]
        self.assertEqual(s['playlistTypes'], ['hls', 'unsupported', 'missing'])
        self.assertEqual(self.state(observation({'uuid': UUID, 'streamingPlaylists': [{'type': True}]})), 'invalid_type')

    def test_safe_collection_presence(self):
        obj = {'uuid': UUID, 'files': [], 'streamingPlaylists': [{'type': 1}, {'type': 1, 'files': []}], 'thumbnailPath': None, 'previewPath': ''}
        p = normalize(observation(obj)).receipt()['observations'][0]['mediaPresence']
        self.assertEqual(p, {'files': 'empty', 'streamingPlaylists': 'present', 'thumbnails': 'missing', 'thumbnailPath': 'null', 'previewPath': 'empty', 'nestedFiles': ['missing', 'empty']})

    def test_bad_markdown_reference_preserves_source(self):
        raw = '[bad](https://[malformed/)'
        result = normalize(observation({'uuid': UUID, 'description': raw}))
        self.assertEqual(result.records[0]['description']['value'], raw)
        self.assertEqual(result.receipt()['observations'][0]['state'], 'metadata_observed')


if __name__ == '__main__':
    unittest.main()
