"""Source ISO-millisecond fidelity contract for the upcoming explicit schema15 importer."""
import hashlib,json,unittest
from convert import convert
class PrecisionTests(unittest.TestCase):
 def convert_stamp(self,stamp):
  source={'version':2,'route':'home','mappings':{'theme::Original Room':{'provider':'youtube','url':'https://music.youtube.com/watch?v=abc','label':'Synthetic','status':'USER_ASSIGNED','sourceId':'local:fixture','updatedAt':stamp}}}
  raw=json.dumps(source).encode();before=bytes(raw)
  result=convert(raw,{'sourceSha256':hashlib.sha256(raw).hexdigest(),'contexts':{'theme::Original Room':{'themeId':'theme','roomId':'room'}}},{'themes':[{'id':'theme','rooms':[{'id':'room'}]}]})
  self.assertEqual(raw,before);self.assertEqual(result['version'],2)
  return result['rows'][0]
 def test_exact_source_milliseconds(self):
  for fraction in [1,123,999]:
   with self.subTest(fraction=fraction):
    row=self.convert_stamp(f'2023-01-01T00:00:00.{fraction:03d}Z')
    self.assertEqual(row['updated_at'],1672531200)
    self.assertEqual(row['updated_at_ms'],1672531200000+fraction)
 def test_epoch_and_whole_seconds_do_not_invent_precision(self):
  for stamp,seconds in [('1970-01-01T00:00:00.000Z',0),('2023-01-01T00:00:00Z',1672531200)]:
   row=self.convert_stamp(stamp);self.assertEqual(row['updated_at_ms'],seconds*1000)
 def test_unrepresentable_precision_and_invalid_dates_refused(self):
  for stamp in ['2023-01-01T00:00:00.1234Z','2023-02-30T00:00:00.123Z','1969-12-31T23:59:59.999Z','2023-01-01T00:00:00.123+01:00']:
   with self.subTest(stamp=stamp),self.assertRaises(ValueError):self.convert_stamp(stamp)
if __name__=='__main__':unittest.main()
