import importlib.util,sys,unittest,subprocess,tempfile
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
import refresh_challenger_sources as m
SHA='a'*40
class SourceRefreshTests(unittest.TestCase):
 def transport(self,path,timeout):
  self.calls.append(path)
  if path.startswith('/search/'):data={'items':[{'full_name':'owner/repo','private':False}],'total_count':9,'incomplete_results':False}
  elif '/commits/' in path:data={'sha':SHA}
  elif '/license?' in path:data={'sha':'b'*40,'license':{'spdx_id':'MIT','name':'MIT License'}}
  elif path.endswith('/releases/latest'):data={'tag_name':'v1.2','published_at':'2026-11-17T00:00:00Z','draft':False,'prerelease':False}
  else:data={'full_name':'owner/repo','private':False,'default_branch':'feature/name','archived':False}
  return {'status':200,'outcome':'observed','sha256':'c'*64,'data':data}
 def setUp(self):self.calls=[]
 def test_exact_version_and_license_provenance(self):
  r=m.refresh(['owner/repo'],transport=self.transport)
  self.assertEqual(r['requests'],4);self.assertIn('/repos/owner/repo/commits/feature%2Fname',self.calls)
  self.assertIn('/repos/owner/repo/license?ref='+SHA,self.calls)
  record=r['repositories'][0];self.assertEqual(record['commit']['sha'],SHA);self.assertEqual(record['license']['reuse_decision'],'unreviewed');self.assertEqual(record['release']['tag'],'v1.2')
  self.assertTrue(all('data' not in e and e['source'].startswith(m.API) and e['checked_at'] for e in r['evidence']))
 def test_explicit_search_is_public_and_partial(self):
  r=m.refresh(public_query='game engine',transport=self.transport)
  self.assertIn('is%3Apublic',self.calls[0]);self.assertEqual(r['search']['total_count'],9);self.assertIn('not comprehensive',r['search']['scope']);self.assertEqual(r['requests'],5)
 def test_reject_urls_private_context_operators_and_unbounded_requests(self):
  for value in ['https://github.com/a/b','../x','a/..','a/b?token=x','a/b/c','a/b\n']:
   with self.assertRaises(ValueError):m.refresh([value],transport=self.transport)
  for query in ['', 'repo:private/secret','x'*121,'test\nsecret']:
   with self.assertRaises(ValueError):m.refresh(public_query=query,transport=self.transport)
  with self.assertRaises(ValueError):m.refresh(['a/a','a/b','a/c','a/d'],transport=self.transport)
  self.assertEqual(self.calls,[])
 def test_visibility_or_identity_mismatch_stops_followups(self):
  for data in [{'private':True,'full_name':'owner/repo'},{'private':False,'full_name':'other/repo'}]:
   r=m.refresh(['owner/repo'],transport=lambda *args:{'outcome':'observed','data':data});self.assertEqual(r['requests'],1);self.assertEqual(r['repositories'][0]['status'],'identity_or_visibility_mismatch')
 def test_errors_are_unknown_not_deletion_or_license_permission(self):
  for status in [403,404,429,500]:
   r=m.refresh(['owner/repo'],transport=lambda *args:{'status':status,'outcome':m.classify(status)})
   self.assertIsNone(r['repositories'][0]['license']);self.assertIsNone(r['repositories'][0]['commit']);self.assertEqual(r['requests'],1)
 def test_budget_exhaustion_does_not_issue_more_requests(self):
  times=iter([0,31,32]);r=m.refresh(['owner/repo'],transport=self.transport,clock=lambda:next(times))
  self.assertEqual(self.calls,[]);self.assertEqual(r['repositories'][0]['status'],'time_budget_exhausted')
 def test_malformed_search_retains_evidence_without_followups(self):
  for data in [{'items':None},{'items':{}},{'items':[{'private':False,'full_name':'../../secret'}]}]:
   r=m.refresh(public_query='browser',transport=lambda *args:{'outcome':'observed','status':200,'data':data,'sha256':'c'*64})
   self.assertEqual(r['search']['outcome'],'invalid_response');self.assertEqual(r['requests'],1);self.assertEqual(r['repositories'],[]);self.assertEqual(len(r['evidence']),1)
 def test_interrupted_response_is_transport_unavailable(self):
  from unittest.mock import patch
  from http.client import IncompleteRead
  with patch.object(m,'build_opener') as opener:
   opener.return_value.open.side_effect=IncompleteRead(b'partial',99)
   self.assertEqual(m.fetch_json('/repos/owner/repo',1)['outcome'],'transport_unavailable')
 def test_cli_requires_refresh_and_refuses_existing_output_without_network(self):
  with tempfile.TemporaryDirectory() as directory:
   out=Path(directory)/'receipt.json';out.write_text('keep')
   base=[sys.executable,str(Path(m.__file__)),'--repo','owner/repo','--output',str(out)]
   for args in [base,base+['--refresh']]:
    result=subprocess.run(args,capture_output=True,text=True,timeout=5);self.assertNotEqual(result.returncode,0)
   self.assertEqual(out.read_text(),'keep')
 def test_redirects_are_not_followed(self):self.assertIsNone(m.NoRedirect().redirect_request(None,None,302,'',{},'http://127.0.0.1'))
if __name__=='__main__':unittest.main()
