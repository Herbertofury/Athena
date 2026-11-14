"""Synthetic whole-URL and sanitized-receipt checks; no external requests."""
import importlib.util
import json
from pathlib import Path
import unittest
from lxml import html

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('srcset_boundary_extraction', ROOT / 'experiments/site-extraction-lab/extractors.py')
E = importlib.util.module_from_spec(spec)
spec.loader.exec_module(E)
ORIGIN = 'https://fixture.example/'


def body(value):
    node = html.fromstring('<div>before<img>after</div>')
    node.find('img').set('srcset', value)
    return E.ordered_body(node, ORIGIN)


def urls(value):
    return [u for event in body(value)['events'] for u in event.get('srcset', [])]


class SrcsetTokenizationTests(unittest.TestCase):
    def test_internal_commas_are_url_data_until_ascii_whitespace(self):
        self.assertEqual(list(E.srcset_url_tokens('a.webp,b.webp')), ['a.webp,b.webp'])
        self.assertEqual(list(E.srcset_url_tokens('a.webp, b.webp')), ['a.webp', 'b.webp'])
        self.assertEqual(urls('/one,two.webp 1x, /safe.webp 2x'), [ORIGIN + 'one,two.webp', ORIGIN + 'safe.webp'])

    def test_query_and_fragment_suffixes_never_become_new_references(self):
        for separator in ['?', '#']:
            for suffix in ['SYNTHETIC_TAIL', 'SYNTHETIC_TAIL,SECOND', '\u00a0SYNTHETIC_TAIL']:
                with self.subTest(separator=separator, suffix=suffix):
                    result = body('/a.webp' + separator + 'key=SYNTHETIC_HEAD,' + suffix + ' 1x, /safe.webp 2x')
                    projected = [u for e in result['events'] for u in e.get('srcset', [])]
                    self.assertEqual(projected, [ORIGIN + 'a.webp', ORIGIN + 'safe.webp'])
                    receipt = json.dumps(E.body_receipt(result))
                    self.assertNotIn('SYNTHETIC_HEAD', receipt)
                    self.assertNotIn('SYNTHETIC_TAIL', receipt)
                    self.assertIn('SYNTHETIC_HEAD', result['raw'])

    def test_complete_userinfo_reference_is_rejected_without_suffix_recovery(self):
        value = 'https://synthetic_user:SYNTHETIC_HEAD,SYNTHETIC_TAIL@outside.example/a.webp 1x, /safe.webp 2x'
        self.assertEqual(urls(value), [ORIGIN + 'safe.webp'])
        self.assertNotIn('SYNTHETIC_TAIL', json.dumps(E.body_receipt(body(value))))

    def test_trailing_commas_and_empty_segments_retain_recovery(self):
        for value in [' ,,, /one,two.webp,,, /safe.webp ', '/one,two.webp ,,, /safe.webp', '/one,two.webp 1x,,, /safe.webp 2x,']:
            self.assertEqual(urls(value), [ORIGIN + 'one,two.webp', ORIGIN + 'safe.webp'])
        for value in ['', ' ,,, ', '\t\n\f\r , ']:
            self.assertEqual(list(E.srcset_url_tokens(value)), [])

    def test_ascii_whitespace_is_explicit_and_non_ascii_remains_in_token(self):
        for whitespace in '\t\n\f\r ':
            self.assertEqual(list(E.srcset_url_tokens('a' + whitespace + '1x,b' + whitespace + '2x')), ['a', 'b'])
        for whitespace in ['\u00a0', '\u1680', '\u2000', '\u202f', '\ufeff', '\v']:
            self.assertEqual(list(E.srcset_url_tokens('a' + whitespace + 'b 1x')), ['a' + whitespace + 'b'])

    def test_descriptor_parenthesis_state_hides_internal_commas(self):
        for value in ['a (x,SYNTHETIC_TAIL), safe', 'a (((x,SYNTHETIC_TAIL), safe']:
            self.assertEqual(list(E.srcset_url_tokens(value)), ['a', 'safe'])
        self.assertEqual(list(E.srcset_url_tokens('a (x,SYNTHETIC_TAIL')), ['a'])
        self.assertEqual(list(E.srcset_url_tokens('a () , safe')), ['a', 'safe'])

    def test_quotes_brackets_and_backslashes_do_not_invent_escape_states(self):
        for value, expected in [('a "x,y", safe', ['a', 'y"', 'safe']), ('a [x,y], safe', ['a', 'y]', 'safe']), ('a \\,safe', ['a', 'safe'])]:
            self.assertEqual(list(E.srcset_url_tokens(value)), expected)

    def test_descriptors_stay_opaque_in_this_url_only_projection(self):
        value = '/a.webp invalid, /b.webp 0w, /c.webp 2h, /a.webp 1x'
        self.assertEqual(urls(value), [ORIGIN + 'a.webp', ORIGIN + 'b.webp', ORIGIN + 'c.webp', ORIGIN + 'a.webp'])

    def test_existing_unsafe_scheme_and_control_character_policy_remains(self):
        for value in ['/a.webp 1x, data:image/png,synthetic 2x', '/a.webp 1x, javascript:synthetic 2x', '/a.webp 1x, blob:https://fixture.example/id 2x']:
            self.assertEqual(urls(value), [])
        node = E.document('<div><img srcset="/a.webp?key=HEAD,&#xB;SYNTHETIC_TAIL 1x, /safe.webp"></div>')
        result = E.ordered_body(node, ORIGIN)
        self.assertEqual([u for e in result['events'] for u in e.get('srcset', [])], [ORIGIN + 'safe.webp'])
        self.assertNotIn('SYNTHETIC_TAIL', json.dumps(E.body_receipt(result)))

    def test_selected_serialization_text_and_picture_order_are_unchanged(self):
        node = E.document('<div>é\n<picture><source srcset="/one,two.webp 1x, /safe.webp 2x"><img src="/fallback.png"></picture>本文</div>')
        raw = html.tostring(node, encoding='unicode', with_tail=False)
        expected_text = node.text_content()
        result = E.ordered_body(node, ORIGIN)
        self.assertEqual(result['raw'], raw)
        self.assertEqual(result['text'], expected_text)
        media = [e for e in result['events'] if e['type'] == 'media']
        self.assertEqual([e['tag'] for e in media], ['source', 'img'])
        self.assertEqual(media[0]['srcset'], [ORIGIN + 'one,two.webp', ORIGIN + 'safe.webp'])
        self.assertEqual(media[1]['src'], ORIGIN + 'fallback.png')

    def test_public_wordpress_receipt_uses_whole_token_filtering(self):
        node = html.fromstring('<div>before<img>after</div>')
        node.find('img').set('srcset', '/one,two.webp?token=SYNTHETIC_HEAD,SYNTHETIC_TAIL 1x, /safe.webp 2x')
        value = {'id': 1, 'author': 7, 'content': {'rendered': html.tostring(node, encoding='unicode'), 'protected': False}}
        record = E.extract('wordpress', {'post': json.dumps(value).encode()}, ORIGIN)
        receipt = E.receipt(record)
        self.assertNotIn('SYNTHETIC_TAIL', json.dumps(receipt))
        self.assertFalse(receipt['fullSupportAccepted'])
        self.assertEqual([u for e in record['body']['events'] for u in e.get('srcset', [])], [ORIGIN + 'one,two.webp', ORIGIN + 'safe.webp'])

    def test_generated_comma_queries_preserve_complete_tokens_before_filtering(self):
        for i in range(1000):
            query = ','.join('SYNTHETIC_' + str(i) + '_' + str(j) for j in range(i % 9 + 1))
            value = '/image,' + str(i) + '.webp?token=' + query + ' 1x, /safe.webp 2x'
            self.assertEqual(urls(value), [ORIGIN + 'image,' + str(i) + '.webp', ORIGIN + 'safe.webp'])
            self.assertNotIn('SYNTHETIC_', json.dumps(E.body_receipt(body(value))))


if __name__ == '__main__':
    unittest.main()
