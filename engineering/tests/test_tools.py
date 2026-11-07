import copy,datetime as dt,importlib.util,json,math,unittest
from pathlib import Path
from unittest.mock import patch
R=Path(__file__).resolve().parents[1]
def load(name):
 spec=importlib.util.spec_from_file_location(name,R/'scripts'/f'{name}.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
bench=load('compare_benchmarks');research=load('check_research')
class BenchmarkTests(unittest.TestCase):
 def setUp(self):
  self.a=json.loads((R/'tests/fixtures/synthetic-baseline.json').read_text());self.b=json.loads((R/'tests/fixtures/synthetic-candidate.json').read_text())
 def test_rejects_nonobject_inputs(self):
  with self.assertRaises(ValueError):bench.compare([],self.b)
  self.b['samples'][0]=None
  with self.assertRaises(ValueError):bench.compare(self.a,self.b)
 def test_equivalent_synthetic_pair(self):
  r=bench.compare(self.a,self.b);self.assertEqual(r['ratio_of_medians'],2);self.assertIn('not a real',r['qualification'])
 def test_rejects_changed_output(self):
  self.b['samples'][0]['result_sha256']='f'*64
  with self.assertRaises(ValueError):bench.compare(self.a,self.b)
 def test_rejects_removed_warnings(self):
  self.a['samples'][0]['warnings']=['unreadable file']
  with self.assertRaises(ValueError):bench.compare(self.a,self.b)
 def test_rejects_different_count(self):
  self.b['samples'][0]['result_count']=99
  with self.assertRaises(ValueError):bench.compare(self.a,self.b)
 def test_rejects_partial_results(self):
  for state in ['partial','cached-only','error']:
   with self.subTest(state=state):
    b=copy.deepcopy(self.b);b['samples'][0]['status']=state
    with self.assertRaises(ValueError):bench.compare(self.a,b)
 def test_rejects_bad_times(self):
  for value in [0,-1,True,'100',math.nan,math.inf]:
   with self.subTest(value=value):
    b=copy.deepcopy(self.b);b['samples'][0]['elapsed_ms']=value
    with self.assertRaises(ValueError):bench.compare(self.a,b)
 def test_rejects_mismatched_conditions(self):
  for key,value in [('condition','warm'),('environment_id','other-device'),('workload_sha256','d'*64),('kind','measured')]:
   with self.subTest(key=key):
    b=copy.deepcopy(self.b);b[key]=value
    with self.assertRaises(ValueError):bench.compare(self.a,b)
 def test_rejects_changed_normalization(self):
  self.b['normalization']['excluded_fields'].append('warnings')
  with self.assertRaises(ValueError):bench.compare(self.a,self.b)
 def test_rejects_unpaired_or_duplicate_ids(self):
  for value in ['different','pair-2']:
   b=copy.deepcopy(self.b);b['samples'][0]['pair_id']=value
   with self.assertRaises(ValueError):bench.compare(self.a,b)
 def test_rejects_too_few_samples(self):
  self.a['samples']=self.a['samples'][:1]
  with self.assertRaises(ValueError):bench.compare(self.a,self.b)
 def test_slower_candidate_is_reported_not_hidden(self):
  for sample in self.b['samples']:sample['elapsed_ms']*=4
  self.assertLess(bench.compare(self.a,self.b)['median_ms_saved'],0)
 def test_rejects_boolean_or_float_schema(self):
  for schema in [True,1.0,'1']:
   b=copy.deepcopy(self.b);b['schema']=schema
   with self.assertRaises(ValueError):bench.compare(self.a,b)
 def test_rejects_malformed_normalization(self):
  for key,value in [('name',True),('name',' '),('version',1),('excluded_fields',['x','x']),('excluded_fields',['']),('excluded_fields',[None]),('excluded_fields','x')]:
   b=copy.deepcopy(self.b);b['normalization'][key]=value
   with self.subTest(key=key,value=value),self.assertRaises(ValueError):bench.compare(self.a,b)
 def test_does_not_bless_semantic_exclusions(self):
  self.a['normalization']['excluded_fields']=['important_field'];self.b['normalization']['excluded_fields']=['important_field']
  result=bench.compare(self.a,self.b)
  self.assertIn('Synthetic',result['qualification'])
class ResearchTests(unittest.TestCase):
 def setUp(self):self.rows=json.loads((R/'data/sources.json').read_text());self.today=research.utc_today()
 def test_default_date_uses_utc_across_local_midnight_boundary(self):
  instant=dt.datetime(2026,10,27,0,10,tzinfo=dt.timezone.utc)
  class Clock(dt.datetime):
   @classmethod
   def now(cls,tz=None):
    if tz is not dt.timezone.utc:raise AssertionError('UTC clock required')
    return instant
  with patch.object(research.dt,'datetime',Clock):self.assertEqual(research.utc_today(),dt.date(2026,10,27))
 def test_register_and_links(self):self.assertGreater(research.check(R,self.today)['sources'],10)
 def test_duplicate_source(self):
  self.rows.append(copy.deepcopy(self.rows[0]))
  with self.assertRaises(ValueError):research.validate_sources(self.rows,self.today)
 def test_future_date(self):
  self.rows[0]['checked_at']='2099-01-01'
  with self.assertRaises(ValueError):research.validate_sources(self.rows,self.today)
 def test_url_credentials_rejected(self):
  self.rows[0]['url']='https://secret@example.com/'
  with self.assertRaises(ValueError):research.validate_sources(self.rows,self.today)
 def test_stale_is_visible(self):
  self.rows[0]['checked_at']=(self.today-dt.timedelta(days=self.rows[0]['review_after_days']+1)).isoformat()
  self.assertIn(self.rows[0]['id'],research.validate_sources(self.rows,self.today)[1])
 def test_no_evidence_promotion(self):
  self.rows[0]['evidence']='production_proven'
  with self.assertRaises(ValueError):research.validate_sources(self.rows,self.today)
if __name__=='__main__':unittest.main()
