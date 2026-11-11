"""Stored public-observation contract, without network or raw provider fixtures."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / 'experiments/steam-news-lab'


class SteamNewsReceiptTests(unittest.TestCase):
    def setUp(self):
        self.receipt = json.loads((LAB / 'public-validation-2026-11-11.json').read_text())

    def test_exact_captures_and_implementation(self):
        r = self.receipt
        self.assertEqual(r['captureCount'], 3)
        self.assertEqual(r['capturedBytes'], 13719)
        self.assertEqual([x['bytes'] for x in r['captures']], [8903, 2235, 2581])
        self.assertEqual([x['sha256'] for x in r['captures']], [
            'ed977b337d64c5ad9cd6045b7fe212cd2ecee233f1fbaf1852bf0ab91a7b38f3',
            'ab5225354a669b9dbf6289a462f7b0b927d90555db4a81933b828f7eb68e1dce',
            'bc55ac51813c3533654ed00182bab5894348b198b424f31c816fc2e36cab8356'])
        self.assertTrue(all(x['status'] == 200 and x['complete'] for x in r['captures']))
        for p in (LAB / 'news.py', ROOT / 'experiments/site-extraction-lab/extractors.py'):
            self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(), r['implementationSha256'][p.name])
        self.assertEqual(r['officialContract']['method'], 'GetNewsForApp')
        self.assertEqual(r['officialContract']['version'], 2)

    def test_actual_full_blurb_and_markup_scope(self):
        first, second = self.receipt['cases']
        self.assertIs(first['everyPairedIdentityMatched'], True)
        self.assertEqual([first['preferredFullFieldRecords'], second['preferredFullFieldRecords']], [3, 2])
        a, b = first['replay']['attempts']
        c, = second['replay']['attempts']
        self.assertEqual([x['state'] for x in (a, b, c)], ['observed'] * 3)
        self.assertEqual([x['responseCount'] for x in (a, b, c)], [800, 800, 740])
        self.assertEqual([x['returnedCount'] for x in (a, b, c)], [3, 3, 2])
        self.assertEqual([x['contentsBytes'] for x in a['rows']], [2964, 4253, 147])
        self.assertEqual([x['contentsBytes'] for x in b['rows']], [272, 290, 146])
        self.assertEqual([x['contentsBytes'] for x in c['rows']], [288, 1459])
        self.assertEqual([x['projection']['format'] for x in a['rows']], ['html', 'html', 'plain'])
        self.assertEqual([x['projection']['mediaCount'] for x in a['rows']], [1, 1, 0])
        self.assertEqual([x['projection']['format'] for x in b['rows']], ['plain'] * 3)
        self.assertEqual([x['projection']['state'] for x in c['rows']], ['unsupported_bbcode'] * 2)
        for attempt in (a, b, c):
            self.assertTrue(all(x['projection']['projectionComplete'] is False for x in attempt['rows']))
        for case in (first, second):
            self.assertEqual(case['replay']['sameScopeConflictCount'], 0)
            self.assertTrue(all(x is False for x in case['replay']['acceptance'].values()))
        self.assertIs(self.receipt['networkUsedByNormalizer'], False)
        self.assertIs(self.receipt['credentialsUsed'], False)
        self.assertEqual(self.receipt['linkedArticleRequests'], 0)
        self.assertEqual(self.receipt['mediaBytesFetched'], 0)
        self.assertIs(self.receipt['mediaDecoded'], False)

    def test_whitelist_has_no_source_text_identity_or_locations(self):
        serialized = json.dumps(self.receipt)
        for text in ('https://', 'http://', 'steam_community_announcements', 'playground.ru'):
            self.assertNotIn(text, serialized)
        def walk(value):
            if isinstance(value, dict):
                self.assertTrue(set(value).isdisjoint({'body', 'raw', 'source', 'url', 'headers', 'records', 'preferredObservation', 'gid', 'appid', 'title', 'author', 'feedname', 'feedlabel', 'contents'}))
                for key, item in value.items():
                    if key in {'fieldStates', 'responseFieldStates'}:
                        fields = {'appid', 'count', 'newsitems'} if key == 'responseFieldStates' else {'appid', 'gid', 'title', 'author', 'feedlabel', 'feedname', 'date', 'contents', 'url', 'is_external_url', 'feed_type', 'tags'}
                        self.assertEqual(set(item), fields)
                        self.assertTrue(all(x in {'missing', 'null', 'empty', 'present', 'malformed'} for x in item.values()))
                    else:
                        walk(item)
            elif isinstance(value, list):
                for item in value:
                    walk(item)
        walk(self.receipt)


if __name__ == '__main__':
    unittest.main()
