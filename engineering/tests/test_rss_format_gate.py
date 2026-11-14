"""Synthetic format gates; these fixtures are not actual YouTube entries."""
import importlib.util
from pathlib import Path
import unittest

LAB = Path(__file__).resolve().parents[1] / 'experiments' / 'site-extraction-lab'
spec = importlib.util.spec_from_file_location('rss_format_candidate', LAB / 'extractors.py')
E = importlib.util.module_from_spec(spec)
spec.loader.exec_module(E)


class RssFormatGateTests(unittest.TestCase):
    def test_unsupported_roots(self):
        for feed in [
            b'<feed xmlns="http://www.w3.org/2005/Atom"/>',
            b'<feed xmlns="http://www.w3.org/2005/Atom"><entry><id>synthetic</id></entry></feed>',
            b'<feed/>', b'<html><body/></html>',
            b'<html><channel><item><guid>synthetic</guid></item></channel></html>',
            b'<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"/>',
            b'<rss xmlns="urn:synthetic"><channel/></rss>',
            b'<RSS><channel/></RSS>',
        ]:
            with self.subTest(feed=feed), self.assertRaisesRegex(E.ExtractionError, 'Unsupported RSS format'):
                E.rss({'feed': feed}, 'https://example.test')

    def test_malformed_channel_envelopes(self):
        for feed in [
            b'<rss/>', b'<rss><channel/><channel/></rss>',
            b'<rss><wrapper><channel/></wrapper></rss>',
            b'<rss><channel><channel/></channel></rss>',
            b'<rss><channel/><wrapper><channel/></wrapper></rss>',
            b'<rss xmlns:x="urn:synthetic"><x:channel/></rss>',
        ]:
            with self.subTest(feed=feed), self.assertRaisesRegex(E.ExtractionError, 'Malformed RSS envelope'):
                E.rss({'feed': feed}, 'https://example.test')

    def test_items_cannot_be_silently_ignored(self):
        for feed in [
            b'<rss><channel/><item><guid>synthetic</guid></item></rss>',
            b'<rss><channel><wrapper><item/></wrapper></channel></rss>',
            b'<rss><channel><item><guid>synthetic</guid><item/></item></channel></rss>',
        ]:
            with self.subTest(feed=feed), self.assertRaisesRegex(E.ExtractionError, 'Unsupported RSS item placement'):
                E.rss({'feed': feed}, 'https://example.test')

    def test_valid_empty_channels_still_return_empty(self):
        for feed in [b'<rss><channel/></rss>', b'<rss version="2.0"><channel/></rss>',
                     b'<?xml version="1.0"?><rss version="2.0"><!-- synthetic --><channel><title>Synthetic</title><link>https://example.test</link><description>Empty test</description></channel></rss>']:
            with self.subTest(feed=feed):
                self.assertEqual(E.extract('rss', {'feed': feed}), [])

    def test_valid_records_and_extensions_keep_identical_output(self):
        body = b'''<channel xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom"><title>Synthetic</title><atom:link href="https://example.test/feed" rel="self"/><item><guid>synthetic-1</guid><link>https://example.test/one</link><description>Synthetic summary</description><dc:creator>Synthetic author</dc:creator><content:encoded>&lt;p&gt;Synthetic body&lt;/p&gt;</content:encoded><enclosure url="https://example.test/file" length="12" type="application/zip"/></item><item><link>https://example.test/two</link></item></channel>'''
        legacy = E.extract('rss', {'feed': b'<rss>' + body + b'</rss>'})
        versioned = E.extract('rss', {'feed': b'<rss version="2.0">' + body + b'</rss>'})
        self.assertEqual(legacy, versioned)
        self.assertEqual(len(versioned), 2)
        self.assertEqual(versioned[0]['people'][0]['name'], 'Synthetic author')
        self.assertEqual(versioned[0]['body']['text'], 'Synthetic body')
        self.assertFalse(versioned[0]['files'][0]['downloaded'])
        self.assertIsNone(versioned[1]['body'])

    def test_foreign_extensions_do_not_become_core_nodes(self):
        feed = b'<rss xmlns:x="urn:synthetic"><x:channel/><channel><x:item/><x:channel/><item><guid>synthetic</guid></item></channel></rss>'
        plain = b'<rss><channel><item><guid>synthetic</guid></item></channel></rss>'
        self.assertEqual(E.extract('rss', {'feed': feed}), E.extract('rss', {'feed': plain}))

    def test_foreign_extension_payloads_are_opaque_at_every_core_level(self):
        plain = b'<rss><channel><item><guid>synthetic</guid></item></channel></rss>'
        expected = E.extract('rss', {'feed': plain})
        for level in ('rss', 'channel', 'item'):
            for payload_name in ('item', 'channel'):
                extension = ('<x:extension xmlns:x="urn:synthetic-extension"><wrapper><'
                             + payload_name + '>payload</' + payload_name
                             + '></wrapper></x:extension>').encode()
                closing = ('</' + level + '>').encode()
                feed = plain.replace(closing, extension + closing)
                with self.subTest(level=level, payload_name=payload_name):
                    self.assertEqual(E.extract('rss', {'feed': feed}), expected)

    def test_comments_and_processing_instructions_are_preserved(self):
        plain = b'<rss><channel><item><guid>synthetic</guid></item></channel></rss>'
        feed = plain
        for level in ('rss', 'channel', 'item'):
            closing = ('</' + level + '>').encode()
            feed = feed.replace(closing, b'<!-- synthetic comment --><?synthetic payload?>' + closing)
        self.assertEqual(E.extract('rss', {'feed': feed}), E.extract('rss', {'feed': plain}))

    def test_versions_are_not_newly_restricted(self):
        plain = b'<rss><channel><item><guid>synthetic</guid></item></channel></rss>'
        expected = E.extract('rss', {'feed': plain})
        for version in ('0.91', '0.92', '2.0', ''):
            feed = plain.replace(b'<rss>', ('<rss version="' + version + '">').encode())
            with self.subTest(version=version):
                self.assertEqual(E.extract('rss', {'feed': feed}), expected)

    def test_dtd_entity_gate_remains_first(self):
        with self.assertRaisesRegex(E.ExtractionError, 'DTD/entity'):
            E.rss({'feed': b'<!DOCTYPE feed [<!ENTITY x "synthetic">]><feed/>'}, 'https://example.test')

    def test_malformed_xml_is_not_empty_success(self):
        with self.assertRaises(E.etree.XMLSyntaxError):
            E.rss({'feed': b'<rss><channel>'}, 'https://example.test')


if __name__ == '__main__':
    unittest.main()
