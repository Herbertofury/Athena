"""Stored actual public DOI metadata observations; no network or raw fixtures."""
import hashlib
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
LAB = ROOT / 'experiments/crossref-work-lab'


class CrossrefWorkReceiptTests(unittest.TestCase):
    def setUp(self):
        self.r = json.loads((LAB / 'public-validation-2026-11-11.json').read_text())

    def test_exact_actual_captures_and_implementation(self):
        r = self.r
        self.assertEqual(r['captureCount'], 3)
        self.assertEqual(r['capturedBytes'], 76436)
        self.assertEqual([v['bytes'] for v in r['captures']], [15425, 52592, 8419])
        self.assertEqual([v['sha256'] for v in r['captures']], [
            '134cc65c0df3f8e66537466033da40b5c81f615a70ec77ba1b62e610a7129ca6',
            'd194699ee731c4f18a616bbc1d5cfbeb9499b6d2df609cbd23824fafb52903c9',
            '424c2300fdbabba642cb191abab5d3bd5f1568eb4cbbcee179915c66753dcaae'])
        self.assertTrue(all(v['status'] == 200 and v['complete'] is True for v in r['captures']))
        for p in (LAB / 'work.py', ROOT / 'experiments/site-extraction-lab/extractors.py'):
            self.assertEqual(hashlib.sha256(p.read_bytes()).hexdigest(), r['implementationSha256'][p.name])
        self.assertIs(r['historicalReference']['deprecated'], True)
        self.assertEqual(r['historicalReference']['commit'], '00b1cc2c90e62d49c82f5381710590a6d9ca53ff')

    def test_actual_scope_dates_directions_and_fidelity(self):
        r = self.r
        rows = [c['replay']['observations'][0] for c in r['cases']]
        self.assertEqual([o['authors']['count'] for o in rows], [4, 112, 35])
        self.assertEqual([o['abstract']['bytes'] for o in rows], [1039, 569, 118])
        self.assertEqual([o['links']['count'] for o in rows], [4, 3, 3])
        self.assertEqual([o['licenses']['count'] for o in rows], [1, 2, 2])
        self.assertEqual([o['relations']['count'] for o in rows], [4, 6, 1])
        self.assertEqual([c['abstractEventCount'] for c in r['cases']], [3, 7, 3])
        original, correction = rows[1:]
        self.assertEqual(original['updateTo']['state'], 'missing')
        self.assertEqual(original['updatedBy'], {'state': 'present', 'count': 1})
        self.assertEqual(correction['updatedBy']['state'], 'missing')
        self.assertEqual(correction['updateTo'], {'state': 'present', 'count': 1})
        self.assertEqual(correction['dates']['published-print']['precisions'], ['month'])
        self.assertEqual(correction['dates']['published-online']['precisions'], ['day'])
        self.assertEqual(r['actualComparisons'], {'reciprocalCorrectionPointersMatch': True, 'bothUpdateTypesCorrection': True, 'bothUpdateSourcesPublisher': True, 'originalAndCorrectionAuthorsKeptSeparate': True, 'correctionPrintPrecision': 'month', 'correctionOnlinePrecision': 'day', 'publicationAndIndexDatesDifferInEveryRecord': True, 'timestampValuesPreservedWithoutUnitConversion': True})
        for case, row in zip(r['cases'], rows):
            self.assertIs(row['acceptedSingleton'], True)
            self.assertIsNone(row['error'])
            self.assertEqual(row['httpStatus'], 200)
            self.assertIs(row['captureComplete'], True)
            self.assertEqual(row['requestUrlSha256'], row['finalUrlSha256'])
            self.assertIs(case['abstractSourcePreserved'], True)
            self.assertEqual(row['abstract']['projectionState'], 'xml_diagnostic')
            self.assertIs(row['abstract']['projectionComplete'], False)
            self.assertIs(row['abstract']['safeRender'], False)
            self.assertIs(case['replay']['conflictingObservations'], False)
            self.assertTrue(all(v is False for v in case['replay']['gates'].values()))
        for key in ('networkUsedByNormalizer', 'credentialsUsed', 'emailIdentityShared', 'liveRestrictedAccessObserved'):
            self.assertIs(r[key], False)
        for key in ('fullTextRequests', 'resourceLinkRequests', 'mediaBytesFetched'):
            self.assertEqual(r[key], 0)

    def test_public_receipt_is_a_structural_whitelist(self):
        serialized = json.dumps(self.r)
        for forbidden in ('https://', 'http://', 'api.crossref.org', '<jats:', '10.7717/', '10.1038/', 'requestUrl"', 'finalUrl"', 'headers', 'date-time', 'ORCID', 'affiliation'):
            self.assertNotIn(forbidden, serialized)
        states = {'missing', 'null', 'empty', 'invalid', 'present'}
        for case in self.r['cases']:
            replay = case['replay']
            self.assertEqual(set(replay), {'schema', 'selectedDoiSha256', 'observations', 'conflictingObservations', 'gates'})
            row = replay['observations'][0]
            self.assertEqual(set(row), {'index', 'bodySha256', 'bodyBytes', 'error', 'acceptedSingleton', 'httpStatus', 'captureComplete', 'requestUrlSha256', 'finalUrlSha256', 'titles', 'authors', 'abstract', 'dates', 'updateTo', 'updatedBy', 'relations', 'licenses', 'links'})
            self.assertEqual(set(row['titles']), {'title', 'subtitle', 'original-title', 'short-title', 'container-title', 'short-container-title'})
            for field in list(row['titles'].values()) + [row[x] for x in ('authors', 'updateTo', 'updatedBy', 'relations', 'licenses', 'links')]:
                self.assertTrue(set(field) <= {'state', 'count'})
                self.assertIn(field['state'], states)
            self.assertEqual(set(row['abstract']), {'state', 'sha256', 'bytes', 'projectionState', 'projectionComplete', 'safeRender'})
            self.assertEqual(set(row['dates']), {'published', 'issued', 'published-online', 'published-print', 'created', 'deposited', 'indexed'})
            for field in row['dates'].values():
                self.assertTrue(set(field) <= {'state', 'dateParts', 'precisions', 'dateTimeState', 'timestampState'})
                self.assertIn(field['state'], states)
                self.assertTrue(set(field.get('precisions', [])) <= {'year', 'month', 'day'})


if __name__ == '__main__':
    unittest.main()
