import os
import pathlib,sqlite3,tempfile,subprocess,threading,http.client,json,unittest,importlib.util
from legacy_fixture import create
ROOT=pathlib.Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('bridge',ROOT/'bridge.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
BIN=os.environ.get('ATHENA_FOUNDRY_STORE_BINARY',str(pathlib.Path(__file__).resolve().parents[3]/'crates/athena-foundry-store/target/debug'/('athena-foundry-store.exe' if os.name=='nt' else 'athena-foundry-store')))
class LegacyTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=pathlib.Path(self.tmp.name);self.live=self.root/'live.sqlite';self.source=self.root/'source.sqlite';self.dest=self.root/'new.sqlite';create(self.source);subprocess.run([BIN,'init',str(self.live)],check=True,capture_output=True);self.server=m.Bridge(BIN,self.live,ROOT.parents[1]/'dist',self.source,self.dest);self.thread=threading.Thread(target=self.server.serve_forever);self.thread.start()
 def tearDown(self):self.server.shutdown();self.thread.join();self.server.server_close();self.tmp.cleanup()
 def request(self,path='/__native/legacy-review',body=None,extra=None):
  headers={'Host':self.server.host,'Origin':self.server.origin,'X-Athena-Native':'1','Content-Type':'application/json'};headers.update(extra or {});c=http.client.HTTPConnection('127.0.0.1',self.server.server_port,timeout=10);c.request('POST' if body is not None else 'GET',path,body=json.dumps(body) if body is not None else None,headers=headers);r=c.getresponse();data=r.read();c.close();return r.status,json.loads(data) if data else None
 def commit(self,token):return self.request('/__native/legacy-import',{'review_token':token})
 def test_real_partial_import_retains_source_and_live(self):
  before=self.source.read_bytes();live=self.live.read_bytes();status,r=self.request();self.assertEqual(status,200);self.assertFalse(r['report']['lossless_migration']);self.assertEqual(r['report']['soundtracks'],1);self.assertGreater(r['report']['skipped_metadata_rows'],0);self.assertNotIn('private_marker',json.dumps(r));self.assertNotIn(str(self.root),json.dumps(r))
  status,result=self.commit(r['review_token']);self.assertEqual(status,200);self.assertTrue(result['source_unchanged_at_checks']);self.assertFalse(result['snapshot_identity_verified']);self.assertTrue(result['restart_required']);self.assertEqual(self.source.read_bytes(),before);self.assertEqual(self.live.read_bytes(),live)
  store=json.loads(subprocess.check_output([BIN,'read-native',str(self.dest),'frutiger-aero','frutiger-aero:room:aqua-atrium']));self.assertEqual(store['updated_at'],123456789);self.assertEqual(store['assignment']['status'],'USER_SEARCH_ROUTE');self.assertEqual(self.commit(r['review_token'])[0],409)
 def test_changed_source_existing_destination_and_spoof_refused(self):
  _,r=self.request();self.assertEqual(self.request('/__native/legacy-import',{'review_token':r['review_token'],'source':'other'})[0],400)
  with sqlite3.connect(self.source) as db:db.execute("INSERT INTO metadata VALUES('extra','value')")
  self.assertEqual(self.commit(r['review_token'])[0],409);self.assertFalse(self.dest.exists());_,r=self.request();self.dest.write_bytes(b'keep');self.assertEqual(self.commit(r['review_token'])[0],409);self.assertEqual(self.dest.read_bytes(),b'keep');self.assertEqual(self.request(extra={'Origin':'https://evil.test'})[0],403)
 def test_source_changes_during_import_report_uncertainty(self):
  _,r=self.request();original=self.server.legacy_cli
  def changed(action):
   result=original(action)
   if action=='import-legacy':
    with sqlite3.connect(self.source) as db:db.execute("INSERT INTO metadata VALUES('changed-after','value')")
   return result
  self.server.legacy_cli=changed;status,result=self.commit(r['review_token']);self.assertEqual(status,200);self.assertTrue(result['imported']);self.assertFalse(result['source_unchanged_at_checks']);self.assertFalse(result['snapshot_identity_verified'])
 def test_source_and_live_sidecar_destinations_refused(self):
  for base in [self.source,self.live]:
   for suffix in ['-wal','-shm','-journal']:
    with self.assertRaises(ValueError):m.Bridge(BIN,self.live,ROOT.parents[1]/'dist',self.source,str(base)+suffix)
 def test_no_path_configuration_and_wal_refusal(self):
  self.server.legacy_source=None;self.assertEqual(self.request()[0],409);self.assertEqual(self.commit('a'*64)[0],409);self.server.legacy_source=self.source
  with sqlite3.connect(self.source) as db:db.execute('PRAGMA journal_mode=WAL')
  before=self.source.read_bytes();self.assertEqual(self.request()[0],422);self.assertEqual(self.source.read_bytes(),before);self.assertFalse(self.dest.exists())
 def test_uncertain_failure_consumes_review_and_preserves_output(self):
  _,r=self.request()
  def fail(action):self.dest.write_bytes(b'partial');raise ValueError('injected')
  self.server.legacy_cli=fail;status,result=self.commit(r['review_token']);self.assertEqual(status,422);self.assertIn('partial output',result['error']);self.assertEqual(self.dest.read_bytes(),b'partial');self.assertEqual(self.commit(r['review_token'])[0],409)
if __name__=='__main__':unittest.main()
