import json,pathlib,sqlite3,subprocess,sys,unittest
from contextlib import closing
import test_reconcile
import resume_plan
class ResumeTests(unittest.TestCase):
 def setUp(self):
  self.f=test_reconcile.ReconcileTests();self.f.setUp();self.addCleanup(self.f.doCleanups);self.out=self.f.root/'plan.json'
 def invoke(self,*args):
  before=self.f.bytes();r=subprocess.run([sys.executable,resume_plan.__file__,'--source',str(self.f.source),'--mapping',str(self.f.mapping),'--database',str(self.f.db),'--destination',str(self.out),*args],capture_output=True,timeout=20)
  for name,value in before.items():self.assertEqual((self.f.root/name).read_bytes(),value)
  self.assertNotIn(b'PRIVATE-SYNTHETIC',r.stdout+r.stderr);self.assertNotIn(str(self.f.root).encode(),r.stdout+r.stderr)
  return r,json.loads(r.stdout)
 def test_identical_empty_plan_and_existing_destination_refused(self):
  r,report=self.invoke('--source-quiescent');self.assertEqual(r.returncode,0);self.assertEqual(report['already_identical'],1);self.assertEqual(json.loads(self.out.read_bytes())['rows'],[]);self.assertFalse(report['applied']);self.assertEqual(self.invoke('--source-quiescent')[0].returncode,2)
 def test_missing_record_written_only_to_private_candidate(self):
  with closing(sqlite3.connect(self.f.db)) as db,db:db.execute('DELETE FROM soundtracks')
  r,report=self.invoke('--source-quiescent');self.assertEqual(r.returncode,0);self.assertEqual(report['missing_records'],1);payload=json.loads(self.out.read_bytes());self.assertEqual(payload['version'],2);self.assertEqual(payload['rows'][0]['assignment']['label'],'PRIVATE-SYNTHETIC 音楽')
 def test_conflict_prevents_any_output(self):
  with closing(sqlite3.connect(self.f.db)) as db,db:db.execute("UPDATE soundtracks SET label='changed'")
  self.assertEqual(self.invoke('--source-quiescent')[0].returncode,2);self.assertFalse(self.out.exists())
 def test_quiescence_and_sidecar_refuse(self):
  self.assertEqual(self.invoke()[0].returncode,2);pathlib.Path(str(self.f.db)+'-wal').write_bytes(b'test');self.assertEqual(self.invoke('--source-quiescent')[0].returncode,2);self.assertFalse(self.out.exists())
 def test_changed_source_hash_refused(self):
  self.f.source.write_bytes(b'{}');self.assertEqual(self.invoke('--source-quiescent')[0].returncode,2);self.assertFalse(self.out.exists())
if __name__=='__main__':unittest.main()
