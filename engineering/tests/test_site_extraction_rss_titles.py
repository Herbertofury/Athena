"""Generated RSS title regression fixtures; not live-provider acceptance."""
import hashlib
import importlib.util
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[1] / 'experiments' / 'site-extraction-lab' / 'extractors.py'
spec = importlib.util.spec_from_file_location('rss_title_extractor', SOURCE)
E = importlib.util.module_from_spec(spec)
spec.loader.exec_module(E)


def feed(title):
    return ('<rss><channel><title>Generated channel title</title><item>'
            '<guid>https://example.test/?p=1</guid><link>https://example.test/post</link>'
            + title + '<description>Generated summary</description></item></channel></rss>').encode()


class RssTitleTests(unittest.TestCase):
    def test_title_is_preserved_without_changing_identity_or_inventing_body(self):
        raw = feed('<title>  Generated &amp; exact title  </title>')
        original = bytes(raw)
        record = E.extract('rss', {'feed': raw}, 'https://example.test/')[0]
        self.assertEqual(record['identity']['title'], '  Generated & exact title  ')
        self.assertEqual(record['identity']['id'], 'rss-guid:' + hashlib.sha256(b'https://example.test/?p=1').hexdigest())
        self.assertEqual(record['metadataSummary'], 'Generated summary')
        self.assertIsNone(record['body'])
        self.assertFalse(record['fullSupportAccepted'])
        self.assertEqual(E.receipt(record)['identity']['title'], record['identity']['title'])
        self.assertEqual(raw, original)

    def test_missing_empty_and_whitespace_titles_stay_distinct(self):
        for xml, expected in [('', None), ('<title/>', ''), ('<title> </title>', ' ')]:
            with self.subTest(xml=xml):
                record = E.extract('rss', {'feed': feed(xml)})[0]
                self.assertIn('title', record['identity'])
                self.assertEqual(record['identity']['title'], expected)

    def test_unicode_cdata_remains_inert_text(self):
        record = E.extract('rss', {'feed': feed('<title><![CDATA[Generated 本文 <b>label</b>]]></title>')})[0]
        self.assertEqual(record['identity']['title'], 'Generated 本文 <b>label</b>')
        self.assertIsNone(record['body'])
        self.assertEqual(record['files'], [])

    def test_channel_title_never_fills_an_absent_item_title(self):
        record = E.extract('rss', {'feed': feed('')})[0]
        self.assertIsNone(record['identity']['title'])

    def test_duplicate_guid_still_rejected_even_with_different_titles(self):
        raw = feed('<title>Generated first</title>')
        raw = raw.replace(b'</channel>', b'<item><guid>https://example.test/?p=1</guid><title>Generated second</title></item></channel>')
        with self.assertRaises(E.ExtractionError):
            E.extract('rss', {'feed': raw})


if __name__ == '__main__':
    unittest.main()
