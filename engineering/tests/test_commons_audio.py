import importlib.util
import json
from pathlib import Path
import unittest
ROOT=Path(__file__).resolve().parents[1]
SPEC=importlib.util.spec_from_file_location('commons_audio',ROOT/'experiments/commons-audio-lab/normalize.py')
MODULE=importlib.util.module_from_spec(SPEC);SPEC.loader.exec_module(MODULE)
RAW=(ROOT/'experiments/commons-audio-lab/public-imageinfo.json').read_text()
TITLE='File:Example sound file in Ogg Vorbis format.ogg'
class CommonsAudioTests(unittest.TestCase):
    def changed(self, path, value):
        data=json.loads(RAW);target=data
        for key in path[:-1]:target=target[key]
        target[path[-1]]=value
        return json.dumps(data)
    def test_real_response_retains_all_bytes_without_inventing_rights(self):
        row=MODULE.normalize_audio_metadata(RAW,TITLE)
        self.assertEqual(row['id'],'76730271');self.assertEqual(row['raw_json'],RAW);self.assertEqual(row['bytes'],153301);self.assertEqual(row['uploaded_by'],'K6ka')
        for key in ['access','creator','license','history']:self.assertEqual(row[key],'unknown')
        self.assertEqual(row['playback'],'unverified');self.assertNotIn('?',row['original'])
    def test_duplicate_keys_and_nonfinite_numbers_reject(self):
        for raw in [RAW.replace('"pageid":76730271','"pageid":42,"pageid":76730271'),RAW.replace('"pageid":76730271','"pageid":42,"\\u0070ageid":76730271'),RAW.replace('3.7035827664399092','1e999')]:
            with self.assertRaises(ValueError):MODULE.normalize_audio_metadata(raw,TITLE)
    def test_large_identifier_remains_exact_string(self):
        raw=self.changed(['query','pages',0,'pageid'],9007199254740993)
        self.assertEqual(MODULE.normalize_audio_metadata(raw,TITLE)['id'],'9007199254740993')
    def test_partial_missing_and_hidden_cases_reject(self):
        cases=[(['error'],{'code':'denied'}),(['continue'],{'iicontinue':'next'}),(['warnings'],{}),(['batchcomplete'],False),(['query','pages',0,'missing'],True),(['query','pages',0,'imagerepository'],'shared'),(['query','pages',0,'imageinfo',0,'filehidden'],True),(['query','pages',0,'imageinfo',0,'userhidden'],True),(['query','pages',0,'pageid'],True)]
        for path,value in cases:
            with self.subTest(path=path),self.assertRaises(ValueError):MODULE.normalize_audio_metadata(self.changed(path,value),TITLE)
    def test_urls_fail_closed(self):
        info=json.loads(RAW)['query']['pages'][0]['imageinfo'][0]
        values=[('url','https://example.invalid/a.ogg'),('url',info['url'].replace('https://','https://secret@')),('url',info['url']+'&token=generated'),('url',info['url'].replace('Example_sound','Other_sound')),('url',info['url'].replace('upload.wikimedia.org','upload.wikimedia.org:0')),('descriptionurl',info['descriptionurl']+'?token=generated'),('descriptionurl','https://commons.wikimedia.org/wiki/File:Other.ogg')]
        for key,value in values:
            with self.subTest(key=key,value=value),self.assertRaises(ValueError):MODULE.normalize_audio_metadata(self.changed(['query','pages',0,'imageinfo',0,key],value),TITLE)
    def test_file_bounds_and_types_reject(self):
        for key,value in [('size',1048577),('size',0),('size',True),('duration',True),('duration',10**300),('mime','text/html'),('sha1','invalid'),('timestamp','not-a-timeZ')]:
            with self.subTest(key=key),self.assertRaises(ValueError):MODULE.normalize_audio_metadata(self.changed(['query','pages',0,'imageinfo',0,key],value),TITLE)
        with self.assertRaises(ValueError):MODULE.normalize_audio_metadata(' '*1048577,TITLE)
    def test_unknown_fields_and_whitespace_are_preserved(self):
        raw=' \n'+self.changed(['future'],{'nested':[None,1,{'text':'<script>inert</script>'}]})+'\t'
        self.assertEqual(MODULE.normalize_audio_metadata(raw,TITLE)['raw_json'],raw)
if __name__=='__main__':unittest.main()
