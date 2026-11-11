"""Synthetic fixtures only; no live requests or media bytes."""
import importlib.util
import json
from pathlib import Path
import unittest

SPEC = importlib.util.spec_from_file_location('nasa_media', Path(__file__).resolve().parents[1] / 'experiments/nasa-media-lab/media.py')
media = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(media)
ID = 'synthetic-ID'


def envelope(role='search', source=None, **kwargs):
    path = '/search?nasa_id=' + ID if role == 'search' else '/' + {'asset': 'asset', 'metadata-location': 'metadata', 'caption-location': 'captions'}.get(role, 'unknown') + '/' + ID
    url = 'https://images-api.nasa.gov' + path
    if source is None:
        source = {'collection': {'href': url.replace('https:', 'http:'), 'version': '1.1', 'items': [{'data': [{'nasa_id': ID, 'title': '', 'description': 'Exact\ntext', 'center': 'Center', 'secondary_creator': 'Person'}], 'links': [{'href': 'https://images-assets.nasa.gov/image/' + ID + '/preview.jpg', 'rel': 'preview', 'render': 'image'}]}], 'metadata': {'total_hits': 1}}}
    value = dict(role=role, request_url=url, final_url=url, status=200, complete=True, body=json.dumps(source).encode())
    value.update(kwargs)
    return value


def run(*values):
    return media.normalize(ID, list(values))


def state(value):
    return run(value).receipt()['attempts'][0]['state']


class NasaMediaTests(unittest.TestCase):
    def test_exact_prose_roles_and_declared_http(self):
        result = run(envelope())
        row = result.observations[0]
        self.assertEqual(row['state'], 'exact-selection')
        self.assertTrue(row['source']['collection']['href'].startswith('http:'))
        record = row['normalized']['records'][0]
        self.assertEqual(record['description'], 'Exact\ntext')
        self.assertEqual(record['title'], '')
        self.assertNotIn('description_508', record)
        self.assertEqual(record['center'], 'Center')
        self.assertEqual(record['secondary_creator'], 'Person')
        self.assertEqual(row['normalized']['references'][0]['declared_rel'], 'preview')

    def test_request_mismatch(self):
        urls = ['https://evil.test/search?nasa_id=' + ID, 'http://images-api.nasa.gov/search?nasa_id=' + ID,
                'https://images-api.nasa.gov/search?nasa_id=wrong', 'https://images-api.nasa.gov/search?nasa_id=' + ID + '&nasa_id=' + ID,
                'https://images-api.nasa.gov/search?q=' + ID, 'https://images-api.nasa.gov/asset/' + ID,
                'https://images-api.nasa.gov/search?nasa_id=' + ID + '&q=x', 'https://images-api.nasa.gov:443/search?nasa_id=' + ID]
        for url in urls:
            with self.subTest(url=url):
                self.assertEqual(state(envelope(request_url=url, final_url=url)), 'request-mismatch')
        for role in media.ROLES[1:]:
            self.assertEqual(state(envelope(role, request_url='https://images-api.nasa.gov/asset/wrong')), 'request-mismatch')

    def test_empty_search_does_not_remove_manifest_or_pointer(self):
        e = run(envelope(source={'collection': {'items': [], 'metadata': {'total_hits': 0}}}), envelope('asset', {'collection': {'items': [{'href': 'https://example.test/file'}]}}), envelope('caption-location', {'location': 'https://example.test/caption.srt'}))
        self.assertEqual([r['state'] for r in e.observations], ['empty-selection', 'observed', 'observed'])
        self.assertEqual(e.observations[1]['normalized']['references'][0]['role'], 'manifest-entry')
        self.assertFalse(e.observations[2]['normalized']['contents_observed'])
        self.assertFalse(any(e.receipt()['acceptance'].values()))

    def test_mismatch_duplicate_and_missing_records(self):
        for records, expected in [([{'nasa_id': ID}, {'nasa_id': 'other'}], 'mixed-or-mismatched-selection'), ([{'nasa_id': ID}] * 2, 'duplicate-selection'), ([{}], 'mixed-or-mismatched-selection')]:
            self.assertEqual(state(envelope(source={'collection': {'items': [{'data': records}]}})), expected)
        for source in [{}, {'collection': None}, {'collection': {}}, {'collection': {'items': None}}, {'collection': {'items': [{}]}}]:
            self.assertEqual(state(envelope(source=source)), 'schema-or-identity-failure')

    def test_missing_null_empty_fields_preserved(self):
        for record in [{'nasa_id': ID}, {'nasa_id': ID, 'description': ''}, {'nasa_id': ID, 'description': None}]:
            r = run(envelope(source={'collection': {'items': [{'data': [record]}]}})).observations[0]
            self.assertEqual(r['normalized']['records'][0], record)
        for source in [{}, {'location': None}, {'location': ''}, {'location': 7}]:
            self.assertEqual(state(envelope('metadata-location', source)), 'schema-or-identity-failure')

    def test_references_never_fetch_or_infer(self):
        refs = ['javascript:alert(1)', 'data:text/plain,abc', 'https://other.test/file', 'https://images-assets.nasa.gov/image/' + ID + '/x']
        e = run(envelope('asset', {'collection': {'items': [{'href': r} for r in refs]}}))
        self.assertEqual([r['value'] for r in e.observations[0]['normalized']['references']], refs)
        self.assertEqual([r['state'] for r in e.observations[0]['normalized']['references']], ['unsafe', 'unsafe', 'external-reference', 'nasa-reference'])
        self.assertFalse(any(r['fetched'] for r in e.observations[0]['normalized']['references']))

    def test_pagination_scope(self):
        source = {'collection': {'items': [], 'metadata': {'total_hits': 20}, 'links': [{'rel': 'next', 'href': 'http://images-api.nasa.gov/search?nasa_id=' + ID + '&page=2'}]}}
        self.assertEqual(state(envelope(source=source)), 'empty-selection')
        source['collection']['links'][0]['href'] = 'http://images-api.nasa.gov/search?nasa_id=wrong&page=2'
        self.assertEqual(state(envelope(source=source)), 'schema-or-identity-failure')

    def test_response_identity_and_collection_href(self):
        for source in [{'nasa_id': 1, 'collection': {'items': []}}, {'collection': {'items': [], 'href': 'http://images-api.nasa.gov/search?nasa_id=wrong'}}, {'collection': {'items': [{'href': 'https://images-assets.nasa.gov/image/wrong/collection.json', 'data': [{'nasa_id': ID}]}]}}]:
            self.assertEqual(state(envelope(source=source)), 'schema-or-identity-failure')

    def test_transport_states(self):
        for kwargs, expected in [({'failure': 'private error'}, 'transport-failure'), ({'status': 404}, 'http-failure'), ({'status': 302}, 'redirect-or-final-mismatch'), ({'status': 206}, 'partial-response'), ({'complete': False}, 'partial-response'), ({'final_url': 'https://other.test'}, 'redirect-or-final-mismatch'), ({'status': True}, 'invalid-transport'), ({'complete': 1}, 'invalid-transport'), ({'body': '{}'}, 'body-type'), ({'role': 'unknown'}, 'unsupported-role')]:
            self.assertEqual(state(envelope(**kwargs)), expected)
        self.assertEqual(run(None).receipt()['attempts'][0]['state'], 'invalid-envelope')

    def test_strict_json_and_limits(self):
        bodies = [b'{"x":1,"x":2}', b'{"x":NaN}', b'{"x":1e9999}', b'{"x":"\\ud800"}', b'\xff', b'[' * 30 + b']' * 30, json.dumps({'x': 'a' * (media.MAX_STRING_BYTES + 1)}).encode(), json.dumps([0] * (media.MAX_ARRAY + 1)).encode()]
        for body in bodies:
            with self.subTest(length=len(body)):
                self.assertEqual(state(envelope(body=body)), 'invalid-json-or-limit')
        self.assertEqual(state(envelope(source={'collection': {'items': [], 'metadata': {'total_hits': True}}})), 'schema-or-identity-failure')
        b = b' ' * (media.MAX_BODY_BYTES + 1)
        result = run(envelope(body=b))
        self.assertEqual(result.receipt()['attempts'][0]['retained_bytes'], media.MAX_BODY_BYTES)
        self.assertEqual(result.receipt()['attempts'][0]['bytes'], len(b))
        self.assertEqual(state(envelope(body=b)), 'body-limit')
        batch = media.normalize(ID, [envelope(body=b)] * (media.MAX_OBSERVATIONS + 1))
        self.assertEqual(batch.receipt()['retained_body_bytes'], media.MAX_BATCH_BYTES)
        self.assertEqual(batch.receipt()['omitted_attempts'], 1)

    def test_no_extension_traversal(self):
        class Hostile:
            def __deepcopy__(self, memo):
                raise AssertionError('must not inspect extension')
        self.assertEqual(state(envelope(extension=Hostile())), 'exact-selection')
        cyclic = {}; cyclic['self'] = cyclic
        self.assertEqual(state(envelope(extension=cyclic)), 'exact-selection')

    def test_failures_contradictions_and_types_survive(self):
        e = run(envelope(status=404), envelope(), envelope(complete=1))
        self.assertEqual(len(e.observations), 3)
        self.assertTrue(all(a['contradictory'] for a in e.receipt()['attempts']))
        self.assertEqual(e.observations[0]['state'], 'http-failure')
        self.assertFalse(run(envelope(), envelope()).receipt()['attempts'][0]['contradictory'])

    def test_public_receipt_isolation_and_whitelist(self):
        e = run(envelope(failure='secret/private'), envelope())
        before = e.receipt()
        e.observations[1]['source']['collection']['items'][0]['data'][0]['description'] = 'private changed'
        changed = e.receipt(); changed['attempts'][0]['state'] = 'secret'; changed['acceptance']['license'] = True
        self.assertEqual(e.receipt(), before)
        serialized = json.dumps(before)
        for forbidden in ['synthetic-ID', 'secret', 'Center', 'Person', 'https', 'Exact']:
            self.assertNotIn(forbidden, serialized)
        allowed = {'role', 'state', 'bytes', 'retained_bytes', 'sha256', 'contradictory', 'matched_records', 'mismatched_records', 'duplicate_records', 'items_count', 'query_total_hits', 'references_count', 'issues_count'}
        for attempt in before['attempts']:
            self.assertLessEqual(attempt.keys(), allowed)

    def test_known_pointer_and_manifest_identity_mismatch(self):
        wrong = 'https://images-assets.nasa.gov/video/other/file'
        for role in ('metadata-location', 'caption-location'):
            self.assertEqual(state(envelope(role, {'location': wrong})), 'schema-or-identity-failure')
        self.assertEqual(state(envelope('asset', {'collection': {'items': [{'href': wrong}]}})), 'schema-or-identity-failure')

    def test_node_budget_and_numeric_identity(self):
        body = json.dumps([[0] * 1000 for _ in range(13)]).encode()
        self.assertEqual(state(envelope(body=body)), 'invalid-json-or-limit')
        for value in (True, 1, 1.0, None, []):
            source = {'collection': {'items': [{'data': [{'nasa_id': value}]}]}}
            self.assertEqual(state(envelope(source=source)), 'schema-or-identity-failure')

    def test_pagination_cannot_change_media_filter(self):
        url = 'https://images-api.nasa.gov/search?nasa_id=' + ID + '&media_type=image'
        source = {'collection': {'items': [], 'links': [{'rel': 'next', 'href': url.replace('media_type=image', 'media_type=video') + '&page=2'}]}}
        self.assertEqual(state(envelope(source=source, request_url=url, final_url=url)), 'schema-or-identity-failure')

    def test_review_nonempty_item_empty_data_is_not_empty_search(self):
        source = {'collection': {'items': [{'data': []}]}}
        result = run(envelope(source=source)).observations[0]
        self.assertEqual(result['state'], 'schema-or-identity-failure')
        self.assertIn('data-empty', result['normalized']['issues'])
        self.assertEqual(result['source'], source)

    def test_review_total_hits_cannot_be_less_than_page_items(self):
        for total, records in [(0, [{'nasa_id': ID}]), (1, [{'nasa_id': ID}, {'nasa_id': 'other'}])]:
            source = {'collection': {'items': [{'data': [record]} for record in records], 'metadata': {'total_hits': total}}}
            result = run(envelope(source=source)).observations[0]
            self.assertEqual(result['state'], 'schema-or-identity-failure')
            self.assertIn('total-hits-below-page-items', result['normalized']['issues'])
            self.assertEqual(result['source'], source)

    def test_review_media_type_must_match_requested_filter(self):
        url = 'https://images-api.nasa.gov/search?nasa_id=' + ID + '&media_type=image'
        source = {'collection': {'items': [{'data': [{'nasa_id': ID, 'media_type': 'video'}]}]}}
        result = run(envelope(source=source, request_url=url, final_url=url)).observations[0]
        self.assertEqual(result['state'], 'schema-or-identity-failure')
        self.assertIn('media-filter-mismatch', result['normalized']['issues'])
        self.assertEqual(result['source'], source)

    def test_review_known_preview_identity_must_match(self):
        source = {'collection': {'items': [{'data': [{'nasa_id': ID}], 'links': [{'href': 'https://images-assets.nasa.gov/image/other/preview.jpg', 'rel': 'preview', 'render': 'image'}]}]}}
        result = run(envelope(source=source)).observations[0]
        self.assertEqual(result['state'], 'schema-or-identity-failure')
        self.assertIn('link-identity-mismatch', result['normalized']['issues'])
        self.assertEqual(result['source'], source)
        self.assertEqual(result['normalized']['references'][0]['declared_rel'], 'preview')

    def test_bad_configuration(self):
        for ident in [True, 1, '', '../x', 'a b', 'x' * 257]:
            with self.assertRaises(ValueError):
                media.normalize(ident, [])
        with self.assertRaises(ValueError):
            media.normalize(ID, iter([]))


if __name__ == '__main__':
    unittest.main()
