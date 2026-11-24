"""Synthetic separator regressions; no browser, network or full-srcset claim."""
import importlib.util
import json
from pathlib import Path
import unittest
from lxml import html

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('srcset_extraction', ROOT / 'experiments/site-extraction-lab/extractors.py')
E = importlib.util.module_from_spec(spec)
spec.loader.exec_module(E)
ORIGIN = 'https://fixture.example/'


def media(body):
    return [event for event in body['events'] if event['type'] == 'media']


def projected(value):
    node = html.fromstring('<div>before<img>after</div>')
    node.find('img').set('srcset', value)
    return E.ordered_body(node, ORIGIN)


class SrcsetEmptyCandidateTests(unittest.TestCase):
    def test_separator_recovery_keeps_order_and_duplicates(self):
        cases = [('/a.webp 1x, ', ['a.webp']), (', /a.webp 1x', ['a.webp']),
                 ('/a.webp 1x,, /b.webp 2x', ['a.webp', 'b.webp']), (',', []),
                 (' \t\n ', []), (' , \t,\n, ', []),
                 (', /a.webp 1x,, /a.webp 2x,', ['a.webp', 'a.webp'])]
        for value, expected in cases:
            with self.subTest(value=value):
                body = projected(value)
                self.assertEqual(body['text'], 'beforeafter')
                self.assertEqual(media(body)[0]['srcset'], [ORIGIN + name for name in expected])
                self.assertEqual([e['type'] for e in body['events']], ['text', 'media', 'text'])

    def test_absent_and_empty_attributes_keep_existing_omission(self):
        for markup in ['<div><img></div>', '<div><img srcset=""></div>']:
            self.assertNotIn('srcset', media(E.ordered_body(E.document(markup), ORIGIN))[0])
        self.assertEqual(media(projected('   '))[0]['srcset'], [])

    def test_complete_selected_serialization_and_literal_text_are_retained(self):
        node = E.document('<div>é\n <p>本文<img srcset=", /a.webp 1x, "> tail</p><a href="/p?key=SYNTHETIC_SECRET">after</a></div>')
        raw = html.tostring(node, encoding='unicode', with_tail=False)
        text = node.text_content()
        body = E.ordered_body(node, ORIGIN)
        self.assertEqual(body['raw'], raw)
        self.assertEqual(body['text'], text)
        self.assertEqual(body['completeness'], 'selected_scope')
        self.assertNotIn('SYNTHETIC_SECRET', json.dumps(E.body_receipt(body)))

    def test_picture_source_and_fallback_survive_separators(self):
        body = E.ordered_body(E.document('<div>before<picture><source type="image/webp" srcset=", /a.webp 1x,, /b.webp 2x,"><img src="/fallback.png"></picture>after</div>'), ORIGIN)
        items = media(body)
        self.assertEqual([e['tag'] for e in items], ['source', 'img'])
        self.assertEqual(items[0]['srcset'], [ORIGIN + 'a.webp', ORIGIN + 'b.webp'])
        self.assertEqual(items[1]['src'], ORIGIN + 'fallback.png')
        self.assertEqual(body['text'], 'beforeafter')

    def test_query_and_fragment_filtering_for_separate_simple_urls_is_unchanged(self):
        body = projected(', /a.webp?token=SYNTHETIC_SECRET#fragment 1x,, /b.webp?v=SYNTHETIC_SECRET 2x,')
        self.assertEqual(media(body)[0]['srcset'], [ORIGIN + 'a.webp', ORIGIN + 'b.webp'])
        self.assertNotIn('SYNTHETIC_SECRET', json.dumps(E.body_receipt(body)))
        self.assertIn('SYNTHETIC_SECRET', body['raw'])

    def test_existing_unsafe_reference_boundaries_are_not_relaxed(self):
        for scheme in ['data:image/png;base64,synthetic', 'javascript:synthetic', 'blob:https://fixture.example/id']:
            with self.subTest(scheme=scheme):
                self.assertEqual(media(projected(', /a.webp 1x, ' + scheme + ' 2x,'))[0]['srcset'], [])
        self.assertEqual(media(projected(', file:///synthetic.png 1x, https://user:pass@fixture.example/a 2x, /b.webp 3x,'))[0]['srcset'], [ORIGIN + 'b.webp'])

    def test_actual_wordpress_extractor_and_public_receipt_keep_scope(self):
        data = {'id': 1, 'author': 7, 'content': {'rendered': '<div>before<img srcset="/a.webp 1x, ">after</div>', 'protected': False}}
        record = E.extract('wordpress', {'post': json.dumps(data).encode()}, ORIGIN)
        self.assertEqual(record['body']['text'], 'beforeafter')
        self.assertEqual(media(record['body'])[0]['srcset'], [ORIGIN + 'a.webp'])
        self.assertFalse(record['fullSupportAccepted'])
        self.assertFalse(E.receipt(record)['fullSupportAccepted'])
        data['content']['protected'] = True
        protected = E.extract('wordpress', {'post': json.dumps(data).encode()}, ORIGIN)
        self.assertIsNone(protected['body'])
        self.assertIn('protected_body', protected['gates'])

    def test_generated_blank_segments_never_remove_valid_simple_candidates(self):
        blanks = ['', ' ', '\t', '\n', '\r\n', ' \t\n ']
        for left in blanks:
            for middle in blanks:
                for right in blanks:
                    value = left + ',/a.webp 1x,' + middle + ',/b.webp 2x,' + right
                    self.assertEqual(media(projected(value))[0]['srcset'], [ORIGIN + 'a.webp', ORIGIN + 'b.webp'])


if __name__ == '__main__':
    unittest.main()
