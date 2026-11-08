"""Synthetic RSS publication dates. No live fetch, system clock or local-zone fallback."""
import importlib.util
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[1] / 'experiments/site-extraction-lab/extractors.py'
spec = importlib.util.spec_from_file_location('rss_date_extractor', SOURCE)
E = importlib.util.module_from_spec(spec)
spec.loader.exec_module(E)


def extract_date(xml, channel=''):
    raw = ('<rss><channel>' + channel + '<item><guid>generated-1</guid><title>Generated item</title>'
           '<description>Generated summary</description>' + xml + '</item></channel></rss>').encode()
    return E.extract('rss', {'feed': raw}, 'https://example.test/feed')[0]


def date(value):
    return extract_date('<pubDate>' + value + '</pubDate>')['publicationDate']


class RssPublicationDateTests(unittest.TestCase):
    def test_valid_gmt_preserves_raw_and_utc(self):
        raw = '  Fri, 06 Nov 2026 15:03:12 GMT  '
        result = date(raw)
        self.assertEqual(result, {'source': 'item/pubDate', 'raw': [raw], 'state': 'valid',
                                 'utc': '2026-11-06T15:03:12Z', 'sourceTimezoneKnown': True})

    def test_positive_negative_and_nonhour_offsets(self):
        for zone, expected in [('+0530','2026-11-05T19:00:00Z'), ('-0700','2026-11-06T07:30:00Z'),
                               ('+0000','2026-11-06T00:30:00Z'), ('-0330','2026-11-06T04:00:00Z')]:
            with self.subTest(zone=zone):
                self.assertEqual(date('Fri, 06 Nov 2026 00:30:00 '+zone)['utc'], expected)

    def test_negative_zero_keeps_unknown_source_timezone(self):
        result = date('Fri, 06 Nov 2026 15:03:12 -0000')
        self.assertEqual(result['state'], 'valid')
        self.assertEqual(result['utc'], '2026-11-06T15:03:12Z')
        self.assertFalse(result['sourceTimezoneKnown'])

    def test_rfc_named_zones_use_declared_fixed_offset(self):
        for zone,hour in [('UT',15),('GMT',15),('EST',20),('EDT',19),('CST',21),('CDT',20),
                          ('MST',22),('MDT',21),('PST',23),('PDT',22)]:
            with self.subTest(zone=zone):
                self.assertEqual(date('06 Nov 2026 15:03:12 '+zone)['utc'], f'2026-11-06T{hour}:03:12Z')

    def test_missing_and_unknown_timezone_never_assume_local_or_utc(self):
        for suffix,state in [('', 'timezone_missing'),(' XYZ','timezone_unknown'),(' A','timezone_unknown')]:
            with self.subTest(suffix=suffix):
                result = date('06 Nov 2026 15:03:12'+suffix)
                self.assertEqual(result['state'],state)
                self.assertIsNone(result['utc'])
                self.assertIsNone(result['sourceTimezoneKnown'])

    def test_missing_empty_and_whitespace_remain_distinct(self):
        for xml,raw,state in [('',[],'missing'),('<pubDate/>',[''],'empty'),('<pubDate> </pubDate>',[' '],'empty')]:
            with self.subTest(xml=xml):
                result = extract_date(xml)['publicationDate']
                self.assertEqual(result['raw'], raw)
                self.assertEqual(result['state'], state)
                self.assertIsNone(result['utc'])

    def test_channel_and_capture_dates_do_not_fill_missing_item_date(self):
        result = extract_date('', '<pubDate>Fri, 06 Nov 2026 15:03:12 GMT</pubDate>'
                                 '<lastBuildDate>Fri, 06 Nov 2026 15:03:12 GMT</lastBuildDate>')
        self.assertEqual(result['publicationDate']['state'], 'missing')
        self.assertIsNone(result['publicationDate']['utc'])
        self.assertEqual(result['identity']['title'], 'Generated item')
        self.assertIsNone(result['body'])
        self.assertFalse(result['fullSupportAccepted'])

    def test_invalid_calendar_time_offset_and_weekday(self):
        for raw in ['31 Feb 2026 12:00:00 GMT','06 Nov 2026 24:00:00 GMT',
                    '06 Nov 2026 12:60:00 GMT','06 Nov 2026 12:00:61 GMT',
                    '06 Nov 2026 12:00:00 +2460','06 Nov 2026 12:00:00 +0060',
                    'Sat, 06 Nov 2026 12:00:00 GMT','06 Nov 0000 12:00:00 GMT',
                    '06 Nov 2026 12:00:00 +2400']:
            with self.subTest(raw=raw):
                result = date(raw)
                self.assertEqual(result['state'],'invalid')
                self.assertIsNone(result['utc'])
                self.assertEqual(result['raw'],[raw])

    def test_unsupported_forms_remain_raw_not_guessed(self):
        for raw in ['2026-11-06','Fri, 06 Nov 2026 15:03:12 GMT garbage',
                    'Fri, 06 Nov 2026 15:03:12 GMT (comment)', '06 Nov 026 15:03 GMT']:
            with self.subTest(raw=raw):
                result=date(raw)
                self.assertEqual(result['state'],'unsupported')
                self.assertEqual(result['raw'],[raw])
                self.assertIsNone(result['utc'])

    def test_leap_second_is_retained_without_datetime_rollover(self):
        result=date('31 Dec 2016 23:59:60 GMT')
        self.assertEqual(result['state'],'unsupported')
        self.assertIsNone(result['utc'])

    def test_two_digit_year_uses_rfc_century_not_platform_pivot(self):
        for year,expected in [('00','2000'),('49','2049'),('50','1950'),('68','1968'),('99','1999')]:
            with self.subTest(year=year):
                self.assertEqual(date(f'06 Nov {year} 12:00 GMT')['utc'], f'{expected}-11-06T12:00:00Z')

    def test_optional_weekday_seconds_and_ascii_folding_whitespace(self):
        self.assertEqual(date('6 Nov 2026 12:00 GMT')['utc'],'2026-11-06T12:00:00Z')
        self.assertEqual(date('Fri,\n 06 Nov 2026\t12:00:00 GMT')['utc'],'2026-11-06T12:00:00Z')

    def test_duplicate_dates_are_ambiguous_and_preserved_in_order(self):
        result = extract_date('<pubDate>06 Nov 2026 12:00 GMT</pubDate><pubDate>07 Nov 2026 12:00 GMT</pubDate>')['publicationDate']
        self.assertEqual(result['raw'], ['06 Nov 2026 12:00 GMT','07 Nov 2026 12:00 GMT'])
        self.assertEqual(result['state'], 'ambiguous')
        self.assertIsNone(result['utc'])

    def test_nested_markup_is_not_promoted_to_date(self):
        result=extract_date('<pubDate>06 Nov 2026 <b>12:00 GMT</b></pubDate>')['publicationDate']
        self.assertEqual(result['state'],'unsupported')
        self.assertEqual(result['raw'],['06 Nov 2026 12:00 GMT'])
        self.assertIsNone(result['utc'])

    def test_receipt_retains_valid_state_but_never_untrusted_raw_date(self):
        record=extract_date('<pubDate><![CDATA[do not publish this arbitrary prose]]></pubDate>')
        self.assertEqual(E.receipt(record)['publicationDate'],{'source':'item/pubDate', 'state':'unsupported',
                         'utc':None, 'sourceTimezoneKnown':None})
        record=extract_date('<pubDate>Fri, 06 Nov 2026 12:00:00 GMT</pubDate>')
        self.assertEqual(E.receipt(record)['publicationDate']['utc'],'2026-11-06T12:00:00Z')

    def test_no_date_field_added_to_other_families(self):
        record=E.base_record('wordpress','https://example.test/')
        self.assertNotIn('publicationDate',E.receipt(record))

    def test_unicode_casefold_zone_lookalikes_are_not_ascii_zones(self):
        for zone in ['EſT', 'CſT', 'MſT', 'PſT', 'İST', 'K']:
            with self.subTest(zone=zone):
                result = date('06 Nov 2026 12:00 '+zone)
                self.assertEqual(result['state'], 'unsupported')
                self.assertIsNone(result['utc'])

    def test_pre_1900_years_are_not_valid_rfc_dates(self):
        for year in ['0001', '1800', '1899']:
            with self.subTest(year=year):
                result = date('06 Nov '+year+' 12:00 GMT')
                self.assertEqual(result['state'], 'invalid')
                self.assertIsNone(result['utc'])

    def test_input_bytes_and_previous_fields_are_not_mutated(self):
        raw=b'<rss><channel><item><guid>generated-1</guid><title>A</title><pubDate>06 Nov 2026 12:00 GMT</pubDate><enclosure url="https://example.test/a.mp3" type="audio/mpeg" length="12"/></item></channel></rss>'
        original=bytes(raw)
        record=E.extract('rss',{'feed':raw})[0]
        self.assertEqual(raw,original)
        self.assertEqual(record['files'][0]['gate'],'enclosure_manifest_only')
        self.assertFalse(record['files'][0]['downloaded'])
        self.assertFalse(record['fullSupportAccepted'])

if __name__ == '__main__':
    unittest.main()
