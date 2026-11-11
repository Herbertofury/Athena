"""Synthetic contract/security fixtures, never live-provider evidence."""
import dataclasses
import importlib.util
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

PATH = Path(__file__).resolve().parents[1] / 'experiments/crossref-work-lab/work.py'
spec = importlib.util.spec_from_file_location('crossref_work_under_test', PATH)
w = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = w
spec.loader.exec_module(w)
DOI = '10.1234/Example.(A)'


def envelope(**fields):
    return {'status': 'ok', 'message-type': 'work', 'message-version': '1.0.0',
            'message': {'DOI': DOI, **fields}}


def capture(payload=None, **fields):
    return {'requestUrl': 'https://api.crossref.org/works/' + DOI,
            'finalUrl': 'https://api.crossref.org/works/' + DOI,
            'status': 200, 'complete': True, 'headers': {'Content-Type': 'application/json'},
            'body': json.dumps(payload if payload is not None else envelope()).encode('utf-8'), **fields}


def card(payload):
    return w.reconcile(DOI, [capture(payload)]).observations[0].card


class CrossrefWorkTests(unittest.TestCase):
    def test_identity_exact_punctuation_case_and_single_decode(self):
        c = card(envelope(DOI=DOI.lower()))
        self.assertEqual(c.source_doi, DOI.lower())
        self.assertEqual(c.selected_doi, DOI)
        self.assertEqual(w.request_identity('https://api.crossref.org/works/10.1234%2FABC%252Fdef'),
                         '10.1234/abc%2fdef')
        self.assertNotEqual(w.doi('10.1234/abc.'), w.doi('10.1234/abc'))
        for s in [' '+DOI, DOI+' ', 'https://doi.org/'+DOI, '10.1234/Ä', '10.1/a']:
            with self.subTest(s=s), self.assertRaises(w.ExtractionError):
                w.doi(s)

    def test_routes_reject_credentials_queries_ports_other_hosts_and_redirects(self):
        for url in ['http://api.crossref.org/works/'+DOI,
                    'https://api.crossref.org:443/works/'+DOI,
                    'https://u@api.crossref.org/works/'+DOI,
                    'https://api.crossref.org.evil/works/'+DOI,
                    'https://doi.org/'+DOI, 'https://api.crossref.org/works/'+DOI+'?',
                    'https://api.crossref.org/works/'+DOI+'#',
                    'https://api.crossref.org/works/'+DOI+'?mailto=a@b.c',
                    'https://api.crossref.org/works/10.1234/x%GG',
                    'https://api.crossref.org/works/10.1234/x%0A',
                    'https://api.crossref.org/works/10.1234/x%FF']:
            with self.subTest(url=url):
                self.assertIsNone(w.reconcile(DOI, [capture(requestUrl=url)]).observations[0].card)
        c = capture(finalUrl='https://api.crossref.org/works/'+DOI.lower())
        self.assertEqual(w.reconcile(DOI, [c]).observations[0].error, 'redirect_unsupported')

    def test_source_failures_remain_before_and_after_success(self):
        samples = [capture(status=429), capture(), capture(status=503), capture(complete=False)]
        b = w.reconcile(DOI, samples)
        self.assertEqual([x.error for x in b.observations], ['http_status', None, 'http_status', 'incomplete_capture'])
        self.assertEqual(b.observations[0].capture['body'], samples[0]['body'])

    def test_conflicts_and_duplicates_do_not_merge_authors(self):
        a, b = capture(envelope(author=[{'family': 'A'}])), capture(envelope(author=[{'family': 'B'}]))
        batch = w.reconcile(DOI, [a, b, a])
        self.assertTrue(batch.conflicting)
        self.assertEqual(len(batch.observations), 3)
        self.assertEqual(batch.observations[0].card.authors.value[0]['family'], 'A')
        self.assertFalse(w.reconcile(DOI, [a, a]).conflicting)

    def test_transport_failure_and_bounded_http_diagnostics(self):
        for error, expected in [('timeout private message', 'transport_error'),
                                (True, 'invalid_transport_error'), ([], 'invalid_transport_error')]:
            b = w.reconcile(DOI, [capture(error=error)])
            self.assertEqual(b.observations[0].error, expected)
            self.assertIsNone(b.observations[0].card)
            self.assertNotIn('timeout private message', json.dumps(w.public_receipt(b)))
        for error in [None, '']:
            self.assertIsNotNone(w.reconcile(DOI, [capture(error=error)]).observations[0].card)
        for status in [401, 403, 404, 429, 500]:
            row = w.public_receipt(w.reconcile(DOI, [capture(status=status)]))['observations'][0]
            self.assertEqual(row['httpStatus'], status)
        row = w.public_receipt(w.reconcile(DOI, [capture(status=999999)]))['observations'][0]
        self.assertIsNone(row['httpStatus'])

    def test_unexpected_xml_helper_failure_retains_source(self):
        with patch.object(w.etree, 'fromstring', side_effect=RuntimeError('private parser detail')):
            c = card(envelope(abstract='<jats:p>Original</jats:p>'))
        self.assertEqual(c.abstract.value, '<jats:p>Original</jats:p>')
        self.assertEqual(c.abstract_projection.state, 'projection_error')

    def test_header_status_complete_strict(self):
        for fields in [{'status': True}, {'status': '200'}, {'complete': 1},
                       {'headers': {'content-type': 'text/html'}},
                       {'headers': {'content-type': 'application/json; charset=utf-16'}},
                       {'headers': {'content-type': 'application/json', 'Content-Type': 'application/json'}},
                       {'headers': {'content-type': None}}, {'headers': {}}]:
            with self.subTest(fields=fields):
                self.assertIsNone(w.reconcile(DOI, [capture(**fields)]).observations[0].card)
        for content_type in ['application/json', 'Application/JSON; charset="UTF-8"']:
            self.assertIsNotNone(w.reconcile(DOI, [capture(headers={'content-type': content_type})]).observations[0].card)

    def test_envelope_and_doi_failure(self):
        for key, value in [('status', 'error'), ('message-type', 'work-list'),
                           ('message-version', '9.0'), ('message', []), ('message', {'DOI': '10.1234/other'})]:
            obj = envelope()
            obj[key] = value
            self.assertIsNone(card(obj))
        for key in ('status', 'message-type', 'message-version', 'message'):
            obj = envelope()
            del obj[key]
            self.assertIsNone(card(obj))

    def test_json_encoding_duplicates_nonfinite_and_surrogates(self):
        for raw in [b'{"x":1,"x":2}', b'{"x":NaN}', b'{"x":Infinity}', b'{"x":1e999}',
                    b'{"x":"\\ud800"}', b'{"\\udfff":1}', b'\xff', b'\xef\xbb\xbf{}',
                    json.dumps(envelope()).encode('utf-16'), b'[]', b'{']:
            with self.subTest(raw=raw[:50]):
                self.assertIsNone(w.reconcile(DOI, [capture(body=raw)]).observations[0].card)

    def test_structural_byte_and_capture_limits(self):
        for constant, value, samples in [('MAX_CAPTURES', 1, [capture(), capture()]),
                                         ('MAX_BODY_BYTES', 1, [capture()]),
                                         ('MAX_TOTAL_BYTES', 1, [capture()]),
                                         ('MAX_METADATA_BYTES', 1, [capture()])]:
            with patch.object(w, constant, value), self.assertRaises(w.ExtractionError):
                w.reconcile(DOI, samples)
        with patch.object(w, 'MAX_DEPTH', 3):
            self.assertIsNone(card(envelope(extra=[[[[1]]]])))
        with patch.object(w, 'MAX_NODES', 60):
            self.assertIsNone(card(envelope(extra=list(range(100)))))

    def test_builtin_validation_precedes_copy_and_rejects_cycles(self):
        class Hostile(dict):
            def __deepcopy__(self, memo):
                raise AssertionError('must never copy')
        class String(str):
            pass
        for data in [Hostile(), {'x': Hostile()}, {'x': String('v')}, {'x': object()}, {'x': float('nan')}]:
            with self.subTest(data=type(data)), self.assertRaises(w.ExtractionError):
                w.reconcile(DOI, [capture(extra=data)])
        loop = []
        loop.append(loop)
        with self.assertRaises(w.ExtractionError):
            w.reconcile(DOI, [capture(extra=loop)])

    def test_field_states_and_exact_raw_title_author_retention(self):
        c = card(envelope(title=['A &amp; B', '<i>C</i>'], subtitle=[], **{'short-title': None,
            'container-title': 2}, author=[{'given': 'X', 'ORCID': 'not-verified',
            'affiliation': [{'name': 'Original'}], 'future': {'a': [1]}}], unknown={'x': [2]}))
        self.assertEqual([c.titles[k].state for k in ['title','subtitle','short-title','container-title','original-title']],
                         ['present','empty','null','invalid','missing'])
        self.assertEqual(c.titles['title'].value, ('A &amp; B', '<i>C</i>'))
        self.assertEqual(c.authors.value[0]['affiliation'][0]['name'], 'Original')
        self.assertEqual(c.envelope['message']['unknown']['x'], (2,))

    def test_snapshot_immutable_independent(self):
        original = capture(extra={'nested': ['old']})
        b = w.reconcile(DOI, [original])
        original['extra']['nested'][0] = 'new'
        self.assertEqual(b.observations[0].capture['extra']['nested'], ('old',))
        with self.assertRaises(TypeError):
            b.observations[0].capture['status'] = 404
        with self.assertRaises(dataclasses.FrozenInstanceError):
            b.selected_doi = 'other'

    def test_partial_dates_keep_roles_timestamp_and_invalid_states(self):
        c = card(envelope(published={'date-parts': [[2020]]}, indexed={'date-parts': [[2026,11,11]],
            'timestamp': 1794375925162}, **{'published-print': {'date-parts': [[2020,3]]},
            'published-online': {'date-parts': [[2020,2,24]]},
            'deposited': {'date-parts': [[2020,2,30]], 'timestamp': 'not-number'}, 'created': None}))
        for key, precision in [('published','year'), ('published-print','month'), ('published-online','day')]:
            self.assertEqual(c.dates[key].value.precisions, (precision,))
        self.assertEqual(c.dates['published-print'].value.parts.value, ((2020,3),))
        self.assertEqual(c.dates['indexed'].value.timestamp.value, 1794375925162)
        self.assertEqual(c.dates['deposited'].value.parts.state, 'invalid')
        self.assertEqual(c.dates['created'].state, 'null')
        self.assertEqual(c.dates['issued'].state, 'missing')
        for parts in [[[True]], [[2020,0]], [[2020,1,1,1]], [2020], '2020']:
            self.assertEqual(card(envelope(issued={'date-parts':parts})).dates['issued'].value.parts.state, 'invalid')

    def test_updates_relations_licenses_and_links_are_unverified_typed_objects(self):
        c = card(envelope(**{'update-to':[{'DOI':'10.1234/original', 'type':'correction',
            'label':'Correction','source':'publisher','updated':{'date-parts':[[2020,2]]}}],
            'updated-by':[{'DOI':'10.1234/later','type':'new-version'}],
            'relation': {'has-review':[{'id-type':'doi','id':'10.1234/review','asserted-by':'object'}]},
            'license':[{'URL':'https://example.test/license?private=secret','content-version':'tdm',
                'start':{'date-parts':[[2020]]},'delay-in-days':0}],
            'link':[{'URL':'javascript:do-not-render','content-type':'application/pdf',
                'content-version':'vor','intended-application':'text-mining'}]}))
        self.assertEqual(c.update_to.value[0].direction, 'update-to')
        self.assertEqual(c.update_to.value[0].type.value, 'correction')
        self.assertEqual(c.updated_by.value[0].doi.value, '10.1234/later')
        self.assertEqual(c.relations.value[0].asserted_by.value, 'object')
        self.assertEqual(c.licenses.value[0].start.value.precisions, ('year',))
        self.assertEqual(c.links.value[0].url.value, 'javascript:do-not-render')

    def test_abstract_raw_xml_order_unknown_math_media_and_entities(self):
        raw = '<jats:p>A<jats:italic>B</jats:italic>C<m:math xmlns:m="urn:math"><m:mi>x</m:mi></m:math><image src="private"/>D</jats:p>'
        c = card(envelope(abstract=raw))
        self.assertEqual(c.abstract.value, raw)
        p = c.abstract_projection
        self.assertEqual(p.state, 'xml_diagnostic')
        self.assertEqual(p.interpretation, 'local_jats_wrapper')
        self.assertFalse(p.complete)
        self.assertFalse(p.safe_render)
        self.assertEqual([e[1] for e in p.events if e[0]=='text'], ['A','B','C','x','D'])
        self.assertIn(('start', '{urn:math}mi', ()), p.events)
        self.assertIn(('start', 'image', (('src','private'),)), p.events)
        for raw, state in [('ordinary text','plaintext'), ('<jats:p>broken','projection_error'),
            ('<!DOCTYPE p [<!ENTITY e SYSTEM "file:///etc/passwd">]><p>&e;</p>','rejected_declaration'),
            ('<p>&unknown;</p>','projection_error')]:
            c = card(envelope(abstract=raw))
            self.assertEqual(c.abstract.value, raw)
            self.assertEqual(c.abstract_projection.state, state)

    def test_public_receipt_has_no_prose_pointer_headers_or_unknown_values(self):
        marker = 'DO_NOT_PUBLISH_SECRET_7'
        payload = envelope(title=[marker], author=[{'family':marker}], abstract=marker,
            license=[{'URL':marker}], link=[{'URL':marker}], extra=marker)
        b = w.reconcile(DOI, [capture(payload, headers={'content-type':'application/json','private':marker}, extra=marker)])
        r = w.public_receipt(b)
        text = json.dumps(r)
        self.assertNotIn(marker,text)
        self.assertNotIn(DOI,text)
        self.assertNotIn('api.crossref.org',text)
        self.assertTrue(all(v is False for v in r['gates'].values()))
        self.assertEqual(r['observations'][0]['abstract']['bytes'],len(marker))
        r['observations'].clear()
        self.assertEqual(len(w.public_receipt(b)['observations']),1)


if __name__ == '__main__':
    unittest.main()
