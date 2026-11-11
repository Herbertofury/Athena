"""Synthetic-only adversarial fixtures for the isolated Mastodon capture gate."""
import copy
import importlib.util
import json
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('mastodon_statuses', Path(__file__).resolve().parents[1] / 'experiments/mastodon-status-lab/statuses.py')
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
ORIGIN = 'https://example.test'
OPAQUE = '900719925474099312345abc/https://opaque.test/id'

def synthetic_status(sid=OPAQUE, aid='actor'):
    return {'id': sid, 'uri': 'https://federation.test/object/secret', 'account': {'id': aid, 'url': 'https://example.test/@private', 'display_name': 'CANARY_NAME', 'avatar': 'https://secret.test/avatar?CANARY_AVATAR'}, 'content': '<p>CANARY_BODY<a href="https://example.test/?CANARY_QUERY=1">link</a></p>', 'spoiler_text': 'CANARY_WARNING', 'sensitive': False, 'visibility': 'public', 'reblog': None, 'media_attachments': [], 'edited_at': None, 'in_reply_to_id': None, 'quote': None, 'poll': None, 'card': {'title': 'CANARY_CARD'}, 'emojis': []}

def obs(value, role='status', **kw):
    return dict(role=role, body=json.dumps(value).encode(), http=200, complete=True, redirected=False, **kw)

def run(value, **kw):
    return m.normalize(ORIGIN, OPAQUE, [obs(value)], **kw)

class SyntheticMastodonTests(unittest.TestCase):
    def test_opaque_identity_and_instance_collision(self):
        a = run(synthetic_status()); b = m.normalize('https://other.test', OPAQUE, [obs(synthetic_status())])
        self.assertEqual(a['statuses'][0]['local_id'], OPAQUE)
        self.assertNotEqual(m.receipt(a)['statuses'][0]['identity_sha256'], m.receipt(b)['statuses'][0]['identity_sha256'])
        for bad in (12, True, '', None):
            v = synthetic_status(); v['id'] = bad
            self.assertEqual(run(v)['observations'][0]['state'], 'invalid_capture')

    def test_boost_roles_and_exact_html(self):
        value = synthetic_status(); value['reblog'] = synthetic_status('original', 'original-author')
        result = run(value); s = result['statuses'][0]
        self.assertEqual(s['author']['local_id'], 'actor')
        self.assertEqual(s['reblog']['author']['local_id'], 'original-author')
        self.assertEqual(s['html_source'], value['content'])
        self.assertNotIn('CANARY_QUERY', json.dumps(s['projection']['events']))
        self.assertEqual(m.receipt(result)['statuses'][0]['actor_role'], 'boost_actor')

    def test_profile_join_and_failure(self):
        value = synthetic_status(); profile = copy.deepcopy(value['account']); join = {'status_id': OPAQUE, 'account_id': 'actor'}
        def normal(p): return m.normalize(ORIGIN, OPAQUE, [obs(value), p], join)
        self.assertEqual(normal(obs(profile, 'profile'))['join_state'], 'matched')
        profile['url'] = 'https://other.test/'; self.assertEqual(normal(obs(profile, 'profile'))['join_state'], 'mismatch')
        p = obs(profile, 'profile'); p['http'] = 403
        r = normal(p); self.assertEqual(r['join_state'], 'unavailable'); self.assertEqual(len(r['observations']), 2)

    def test_attachment_roles_and_unknown(self):
        value = synthetic_status(); value['media_attachments'] = [{'id': 'a', 'type': 'future', 'preview_url': None, 'remote_url': ''}, {'id': 'b', 'type': 'image', 'url': 'https://secret.test/?CANARY_MEDIA'}]
        a = run(value)['statuses'][0]['attachments']
        self.assertEqual(a[0]['kind'], 'unsupported')
        self.assertEqual([a[0]['roles'][k]['state'] for k in ('url', 'preview_url', 'remote_url')], ['missing', 'null', 'empty'])
        self.assertEqual(a[1]['order'], 1)

    def test_private_visibility_edit_reply_and_no_text_fallback(self):
        value = synthetic_status(); value.update(visibility='direct', edited_at='2026-01-01T00:00:00Z', in_reply_to_id='opaque:reply', content='', text='NOT_BODY')
        s = run(value)['statuses'][0]
        self.assertEqual(s['raw']['visibility'], 'direct'); self.assertEqual(s['raw']['in_reply_to_id'], 'opaque:reply')
        self.assertEqual(s['html_source'], ''); self.assertIsNone(s['projection'])

    def test_malformed_srcset_retains_failed_projection(self):
        value = synthetic_status(); value['content'] = '<p>before<img srcset=",">after</p>'
        result = run(value)
        self.assertEqual(result['observations'][0]['state'], 'normalized')
        self.assertEqual(result['observations'][0]['raw_capture'], obs(value)['body'])
        self.assertEqual(result['statuses'][0]['html_source'], value['content'])
        self.assertEqual(result['statuses'][0]['projection_state'], 'projection_failed')
        self.assertIsNone(result['statuses'][0]['projection'])

    def test_unknown_extension_contradictions_preserve_types(self):
        for a, b in [(True, 1), (False, 0), (1, 1.0)]:
            first = synthetic_status(); second = synthetic_status()
            first['poll'] = {'x': a}; second['poll'] = {'x': b}
            result = m.normalize(ORIGIN, OPAQUE, [obs(first), obs(second)])
            self.assertEqual(result['statuses_state'], 'contradictory')
            self.assertEqual(len(result['observations']), 2)
        first = synthetic_status(); second = copy.deepcopy(first)
        first['unknown'] = {'a': 1, 'b': True}; second['unknown'] = {'b': True, 'a': 1}
        self.assertEqual(m.normalize(ORIGIN, OPAQUE, [obs(first), obs(second)])['statuses_state'], 'consistent')
        p1 = first['account']; p2 = copy.deepcopy(p1)
        p1['unknown'] = True; p2['unknown'] = 1
        self.assertEqual(m.normalize(ORIGIN, OPAQUE, [obs(p1, 'profile'), obs(p2, 'profile')])['profiles_state'], 'contradictory')

    def test_projection_is_event_only_not_renderer_safety(self):
        value = synthetic_status()
        value['content'] = '<p onclick="CANARY()">a<script>CANARY_SCRIPT</script><a href="javascript:CANARY()">b</a></p>'
        result = run(value); projection = result['statuses'][0]['projection']
        self.assertEqual(set(projection), {'format', 'completeness', 'events'})
        self.assertEqual(projection['format'], 'ordered_events')
        self.assertEqual(projection['completeness'], 'partial_projection')
        self.assertNotIn('CANARY_SCRIPT', json.dumps(projection))
        self.assertEqual(result['statuses'][0]['html_source'], value['content'])

    def test_receipt_snapshot_has_no_private_dictionary_aliases(self):
        result = run(synthetic_status()); original = m.receipt(result)
        result['statuses'][0]['field_states']['content'] = 'CANARY_PRIVATE'
        result['statuses'][0]['extensions']['quote'] = 'CANARY_PRIVATE'
        self.assertEqual(m.receipt(result), original)
        self.assertNotIn('CANARY_PRIVATE', json.dumps(m.receipt(result)))
        external = m.receipt(result); external['statuses'][0]['field_states']['content'] = 'CANARY_EXTERNAL'
        self.assertEqual(m.receipt(result), original)

    def test_failed_observations_retain_transport_provenance(self):
        observation = obs({}); observation.update(complete=False, redirected=True, http=403)
        result = m.normalize(ORIGIN, OPAQUE, [observation])
        private = result['observations'][0]
        self.assertEqual(private['state'], 'redirect')
        self.assertIs(private['complete'], False)
        self.assertIs(private['redirected'], True)
        self.assertEqual(private['http'], 403)
        self.assertEqual(private['raw_capture'], observation['body'])

    def test_field_presence_provenance(self):
        value = synthetic_status(); del value['media_attachments']; del value['reblog']; del value['content']
        result = run(value)
        for key in ('media_attachments', 'reblog', 'content'):
            self.assertEqual(result['statuses'][0]['field_states'][key], 'missing')
            self.assertEqual(m.receipt(result)['statuses'][0]['field_states'][key], 'missing')
        value = synthetic_status(); value['content'] = ''
        states = m.receipt(run(value))['statuses'][0]['field_states']
        self.assertEqual(states['media_attachments'], 'empty'); self.assertEqual(states['reblog'], 'null'); self.assertEqual(states['content'], 'empty')
        value['media_attachments'] = None
        self.assertEqual(run(value)['observations'][0]['state'], 'invalid_capture')

    def test_empty_profile_url_is_not_join_corroboration(self):
        for url in ('', ' ', 'not-a-url', 'javascript:alert(1)', 'https://user:pass@example.test/'):
            value = synthetic_status(); value['account']['url'] = url
            result = m.normalize(ORIGIN, OPAQUE, [obs(value), obs(value['account'], 'profile')], {'status_id': OPAQUE, 'account_id': 'actor'})
            self.assertEqual(result['join_state'], 'mismatch')

    def test_whitespace_html_projection_failure_preserves_source(self):
        value = synthetic_status(); value['content'] = '   '
        result = run(value)
        self.assertEqual(result['observations'][0]['state'], 'normalized')
        self.assertEqual(result['statuses'][0]['html_source'], '   ')
        self.assertEqual(result['statuses'][0]['projection_state'], 'projection_failed')

    def test_access_and_partial_states(self):
        for code, expected in [(401, 'authentication_required'), (403, 'forbidden'), (404, 'not_found_or_inaccessible'), (429, 'rate_limited'), (500, 'http_other'), (302, 'redirect'), (206, 'partial')]:
            o = obs({'error': 'CANARY_ERROR'}); o['http'] = code
            r = m.normalize(ORIGIN, OPAQUE, [o]); self.assertEqual(r['observations'][0]['state'], expected); self.assertEqual(r['observations'][0]['raw_capture'], o['body'])
        for key, expected in [('redirected', 'redirect'), ('complete', 'partial')]:
            o = obs(synthetic_status()); o[key] = key == 'redirected'; self.assertEqual(m.normalize(ORIGIN, OPAQUE, [o])['observations'][0]['state'], expected)

    def test_types_unicode_and_json(self):
        for key, bad in [('sensitive', 1), ('favourites_count', True), ('replies_count', -1), ('content', None), ('id', 42), ('visibility', []), ('edited_at', False)]:
            v = synthetic_status(); v[key] = bad; self.assertEqual(run(v)['observations'][0]['state'], 'invalid_capture', key)
        for body in (b'{"id":1,"id":2}', b'{"x":NaN}', b'{"x":1e999}', b'{"x":"\\ud800"}', b'\xff'):
            o = obs({}); o['body'] = body; self.assertEqual(m.normalize(ORIGIN, OPAQUE, [o])['observations'][0]['state'], 'invalid_capture')
        for key, bad in [('body', '{}'), ('http', True), ('complete', 1), ('redirected', None)]:
            o = obs({}); o[key] = bad
            with self.assertRaises(m.Invalid): m.normalize(ORIGIN, OPAQUE, [o])
        with self.assertRaises(m.Invalid): m.normalize('http://example.test', OPAQUE, [])

    def test_depth_cycles_duplicates_budgets(self):
        v = synthetic_status(); v['reblog'] = synthetic_status()  # Semantic cycle, not Python execution.
        self.assertEqual(run(v)['observations'][0]['state'], 'invalid_capture')
        v = synthetic_status(); cursor = v
        for i in range(9): cursor['reblog'] = synthetic_status(str(i)); cursor = cursor['reblog']
        self.assertEqual(run(v)['observations'][0]['state'], 'invalid_capture')
        v = synthetic_status(); v['unknown'] = [[[[0]]]]
        for _ in range(40): v['unknown'] = [v['unknown']]
        self.assertEqual(run(v)['observations'][0]['state'], 'invalid_capture')
        o = obs({}); o['body'] = b'x' * (m.MAX_BYTES + 1)
        r = m.normalize(ORIGIN, OPAQUE, [o, obs({})]); self.assertEqual([x['state'] for x in r['observations']], ['byte_budget', 'byte_budget']); self.assertEqual(sum(len(x['raw_capture']) for x in r['observations']), m.MAX_BYTES)
        with self.assertRaises(m.Invalid): m.normalize(ORIGIN, OPAQUE, [obs({})] * 17)
        v = synthetic_status(); v['unknown'] = [0] * m.MAX_NODES; self.assertEqual(run(v)['observations'][0]['state'], 'invalid_capture')
        v = synthetic_status(); other = copy.deepcopy(v); other['content'] = 'different'
        self.assertEqual(m.normalize(ORIGIN, OPAQUE, [obs(v), obs(other)])['statuses_state'], 'contradictory')

    def test_receipt_privacy_canaries_and_unknown_retention(self):
        value = synthetic_status(); value['viewer_prose'] = 'CANARY_VIEWER'; value['quote'] = {'content': 'CANARY_QUOTE'}
        result = run(value); public = json.dumps(m.receipt(result))
        for secret in ('CANARY', 'https://', OPAQUE, 'actor', 'private'):
            # actor_role is a safe fixed key, not the raw actor ID.
            if secret != 'actor': self.assertNotIn(secret, public)
        self.assertEqual(result['statuses'][0]['raw']['viewer_prose'], 'CANARY_VIEWER')
        self.assertEqual(m.receipt(result)['statuses'][0]['extensions']['quote'], 'preserved_unsupported')

if __name__ == '__main__': unittest.main()
