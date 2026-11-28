"""Real feed round trips and no invented source dates; no network or clock reads."""
import copy
import datetime as dt
import importlib.util
import json
from pathlib import Path
import unittest
import xml.etree.ElementTree as ET

spec=importlib.util.spec_from_file_location('publication',Path(__file__).with_name('feed_publication.py'))
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
core=m.core
SOURCE=core.Source('publisher','https://publisher.example/feed',frozenset({'publisher.example'}))
SOURCES=[{'id':'publisher','name':'Publisher & Co','url':'https://publisher.example/',
          'feed':SOURCE.feed,'managed':True,'defaultEnabled':True}]
URLS={name:'https://reader.example/news.'+suffix for name,suffix in (('rss','xml'),('atom','atom'),('json','json'))}
NOW=dt.datetime(2026,11,28,12,tzinfo=dt.timezone.utc)


def rows():
    return core.normalize_saved_items([
        {'sourceId':'publisher','title':'Exact source time','url':'https://publisher.example/exact',
         'date':'2026-11-27','publishedAt':'2026-11-27T09:10:11.123456Z','updatedAt':'2026-11-28T09:10:11Z',
         'media':[{'kind':'image','url':'https://publisher.example/image.jpg'},
                  {'kind':'embed','url':'https://www.youtube.com/watch?v=zFwAT04IvGA'}]},
        {'sourceId':'publisher','title':'Legacy day only','url':'https://publisher.example/legacy','date':'2026-11-26','media':[]},
        {'sourceId':'publisher','title':'Only an update time','url':'https://publisher.example/updated','date':'2026-11-27',
         'updatedAt':'2026-11-27T15:00:00Z','media':[]},
    ],SOURCE)


class PublicationTest(unittest.TestCase):
    def publish(self,items=None,**overrides):
        digest={'schemaVersion':1,'generatedAt':core.iso_time(NOW),'items':items if items is not None else rows()}
        return m.publish_feeds(digest,SOURCES,title='News',home_url='https://reader.example/#news',feed_urls=URLS,**overrides)

    def test_rss_and_json_roundtrip_keep_exact_times_and_date_only_records(self):
        original=rows();result=self.publish(original)
        for format in ('rss','json'):
            parsed=core.parse_feed(SOURCE,result[format].encode(),SOURCE.feed)
            self.assertEqual(parsed,original,format)
        channel=ET.fromstring(result['rss']).find('channel')
        self.assertIsNone(channel.findall('item')[1].find('pubDate'))
        self.assertEqual(channel.findall('item')[1].find(f'{{{m.DC}}}date').text,'2026-11-26')
        feed=json.loads(result['json'])
        self.assertNotIn('date_published',feed['items'][1])
        self.assertNotIn('date_modified',feed['items'][1])
        self.assertEqual(feed['items'][1]['_feed_core']['date'],'2026-11-26')

    def test_atom_is_valid_and_omits_only_entries_without_real_instants(self):
        result=self.publish()
        document=ET.fromstring(result['atom']);tag=lambda name:f'{{{m.ATOM}}}{name}'
        entries=document.findall(tag('entry'))
        self.assertEqual(len(entries),2)
        self.assertEqual(result['report']['atomOmittedWithoutTimestamp'],1)
        self.assertEqual(result['report']['dateOnlyItems'],1)
        self.assertIsNotNone(document.find(tag('author')))
        self.assertTrue(all(entry.find(tag('updated')) is not None for entry in entries))
        self.assertIsNone(entries[1].find(tag('published')))
        self.assertEqual(core.parse_feed(SOURCE,result['atom'].encode(),SOURCE.feed),[rows()[0],rows()[2]])
        self.assertEqual(entries[0].find(tag('published')).text,'2026-11-27T09:10:11.123456Z')
        self.assertNotEqual(entries[0].find(tag('published')).text,core.iso_time(NOW))

    def test_publisher_timezone_is_preserved_as_an_exact_utc_instant(self):
        self.assertEqual(core.item_timestamp('2026-11-26T23:25:00-04:00'),'2026-11-27T03:25:00Z')
        self.assertEqual(core.item_timestamp('Fri, 27 Nov 2026 11:30:00 +0200'),'2026-11-27T09:30:00Z')
        for value in ('2026-11-27','2026-11-27T11:30:00','not a date',None,123):
            self.assertIsNone(core.item_timestamp(value))
        atom=b'<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Time</title><link href="https://publisher.example/time"/><published>2026-11-26T23:25:00-04:00</published></entry></feed>'
        item=core.parse_feed(SOURCE,atom,SOURCE.feed)[0]
        self.assertEqual(item['publishedAt'],'2026-11-27T03:25:00Z')
        self.assertEqual(item['date'],'2026-11-27')
        self.assertFalse(core.available_at({**item,'date':'2026-11-28','publishedAt':'2026-11-28T13:00:00Z'},NOW))
        self.assertTrue(core.available_at(item,NOW))

    def test_opml_lists_only_real_enabled_managed_feeds(self):
        catalog=[*SOURCES,{**SOURCES[0],'id':'disabled','defaultEnabled':False,'feed':'https://publisher.example/disabled'},
                 {'id':'reference','name':'Reference','url':'https://reference.example/','managed':False}]
        digest={'schemaVersion':1,'generatedAt':core.iso_time(NOW),'items':rows()}
        result=m.publish_feeds(digest,catalog,title='News',home_url='https://reader.example/',feed_urls=URLS)
        outlines=ET.fromstring(result['opml']).findall('body/outline')
        self.assertEqual(len(outlines),1)
        self.assertEqual(outlines[0].attrib['xmlUrl'],SOURCE.feed)
        self.assertEqual(outlines[0].attrib['text'],'Publisher & Co')
        self.assertEqual(result['report']['opmlSubscriptions'],1)

    def test_deterministic_publication_does_not_relabel_dates_on_rebuild(self):
        first=self.publish();self.assertEqual(first,self.publish())
        digest={'schemaVersion':1,'generatedAt':'2026-12-01T12:00:00Z','items':rows()}
        second=m.publish_feeds(digest,SOURCES,title='News',home_url='https://reader.example/#news',feed_urls=URLS)
        for format in ('rss','json','atom'):
            self.assertEqual(core.parse_feed(SOURCE,first[format].encode(),SOURCE.feed),core.parse_feed(SOURCE,second[format].encode(),SOURCE.feed))

    def test_unsafe_or_inconsistent_contracts_are_rejected(self):
        for changes in ({'publishedAt':'2026-11-27T09:00:00'}, {'publishedAt':'2026-11-29T09:00:00Z'},
                        {'publishedAt':'2026-11-26T09:00:00Z'}, {'url':'javascript:alert(1)'},
                        {'url':'https://user:secret@publisher.example/item'}, {'title':'bad\x00title'}):
            items=rows();items[0].update(changes)
            with self.subTest(changes=changes),self.assertRaises(ValueError):self.publish(items)
        with self.assertRaises(ValueError):self.publish(rows()*201)
        items=rows();items[0]['title']='A & B <img src=x onerror=alert(1)>'
        document=ET.fromstring(self.publish(items)['rss'])
        self.assertEqual(document.find('channel/item/title').text,items[0]['title'])
        self.assertEqual(document.findall('.//img'),[])


if __name__=='__main__':unittest.main()
