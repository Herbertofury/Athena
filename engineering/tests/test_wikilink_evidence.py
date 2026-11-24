import json,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/'experiments/wikilink-advisory-lab'
class WikilinkEvidence(unittest.TestCase):
 def test_complete_bounded_version_option_matrix(self):
  receipt=json.loads((ROOT/'raw/results.json').read_text());rows=receipt['samples'];self.assertEqual(len(rows),60)
  keys={(x['repeat'],x['repetitions'],x['wikilinks'],x['version']) for x in rows};self.assertEqual(len(keys),60)
  wire=json.loads((ROOT/'raw/wire-output.json').read_text())
  for row in rows:
   data=json.loads(wire[row['raw_file']]);self.assertEqual(data,row['result']);self.assertEqual(row['exit_code'],0);self.assertIs(data['event_cap_reached'],False);self.assertLessEqual(data['input_bytes'],112)
   n=row['repetitions'];expected=6*n+1 if row['wikilinks']=='off' else 4*n+1 if row['version']=='0.13.5' else 5*(2**n)-4
   self.assertEqual(data['event_count'],expected)
 def test_scoped_fresh_audit_is_complete_and_unfiltered(self):
  receipt=json.loads((ROOT/'audit/receipt.json').read_text());self.assertTrue(receipt['completed']);self.assertTrue(receipt['all_clear']);self.assertEqual(receipt['database_commit'],'40f5be6fb12ed93fc591bf4ab23b7d793b3f2239');self.assertEqual(len(receipt['runs']),3)
  for row in receipt['runs']:
   raw=json.loads((ROOT/'audit'/row['raw_result']).read_text());self.assertEqual(raw['settings']['ignore'],[]);self.assertEqual(raw['vulnerabilities'],{'found':False,'count':0,'list':[]});self.assertEqual(raw['warnings'],{})
