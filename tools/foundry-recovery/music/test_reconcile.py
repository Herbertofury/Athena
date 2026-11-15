import hashlib,json,pathlib,sqlite3,subprocess,sys,tempfile,unittest
from unittest.mock import patch
import reconcile as m
ROOT=pathlib.Path(__file__).resolve().parents[3]
class ReconcileTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name)
  self.source=self.root/'source.json';self.mapping=self.root/'mapping.json';self.db=self.root/'snapshot.sqlite'
  self.catalog=json.loads((ROOT/'dist/workspaces/foundry/catalog.json').read_text(encoding='utf8'));t=self.catalog['themes'][0];r=t['rooms'][0];self.pair=(t['id'],r['id']);key=t['id']+'::Original'
  raw=json.dumps({'version':2,'route':'home','mappings':{key:{'provider':'youtube','url':'https://music.youtube.com/watch?v=synthetic','label':'PRIVATE-SYNTHETIC 音楽','status':'USER_ASSIGNED','updatedAt':'2023-01-01T00:00:00.123Z'}}},ensure_ascii=False).encode('utf8');self.source.write_bytes(raw)
  self.mapping.write_text(json.dumps({'sourceSha256':hashlib.sha256(raw).hexdigest(),'contexts':{key:{'themeId':self.pair[0],'roomId':self.pair[1]}}}),encoding='utf8')
  with sqlite3.connect(self.db) as db:
   db.executescript('CREATE TABLE soundtracks(theme_id TEXT,room_id TEXT,provider TEXT,url TEXT,label TEXT,status TEXT,source_id TEXT,updated_at INTEGER,updated_at_ms INTEGER); PRAGMA user_version=15;')
   db.execute('INSERT INTO soundtracks VALUES(?,?,?,?,?,?,?,?,?)',self.pair+('youtube','https://music.youtube.com/watch?v=synthetic','PRIVATE-SYNTHETIC 音楽','USER_ASSIGNED',None,1672531200,1672531200123))
 def verify(self):return m.reconcile(self.source,self.mapping,self.db,self.catalog,True)
 def command(self,*extra):return subprocess.run([sys.executable,str(pathlib.Path(m.__file__)),'--source',str(self.source),'--mapping',str(self.mapping),'--database',str(self.db),*extra],capture_output=True)
 def bytes(self):return {p.name:p.read_bytes() for p in self.root.iterdir()}
 def test_exact_and_cli_preserve_all_bytes_and_no_private_output(self):
  before=self.bytes();r=self.command('--source-quiescent');self.assertEqual(r.returncode,0,r.stderr);report=json.loads(r.stdout);self.assertEqual(report['counts'],{'expected':1,'exact':1,'missing':0,'different':0});self.assertFalse(report['migration_complete']);self.assertNotIn(b'PRIVATE-SYNTHETIC',r.stdout+r.stderr);self.assertEqual(self.bytes(),before)
 def test_missing_and_different_are_distinct(self):
  for sql,count in [('UPDATE soundtracks SET updated_at_ms=1672531200124','different'),('DELETE FROM soundtracks','missing')]:
   with sqlite3.connect(self.db) as db:db.execute(sql)
   before=self.bytes();report=self.verify();self.assertEqual(report['counts'][count],1);self.assertFalse(report['all_mapped_records_match']);self.assertEqual(self.command('--source-quiescent').returncode,1);self.assertEqual(self.bytes(),before)
 def test_quiescence_and_sidecars_rejected_without_changes(self):
  self.assertEqual(self.command().returncode,2)
  for suffix in ('-wal','-shm','-journal'):
   p=pathlib.Path(str(self.db)+suffix);p.write_bytes(b'synthetic');before=self.bytes()
   with self.assertRaises(ValueError):self.verify()
   self.assertEqual(self.bytes(),before);p.unlink()
 def test_wrong_schema_and_corruption(self):
  with sqlite3.connect(self.db) as db:db.execute('PRAGMA user_version=14')
  with self.assertRaises(ValueError):self.verify()
  self.db.write_bytes(b'invalid');before=self.bytes();r=self.command('--source-quiescent');self.assertEqual(r.returncode,2);self.assertEqual(self.bytes(),before);self.assertNotIn(str(self.root).encode(),r.stdout+r.stderr)
 def test_changed_snapshot_does_not_report_match(self):
  original=m.capture_module.capture;calls=0
  def changed(path):
   nonlocal calls
   calls+=1;result=original(path)
   if calls==2:result['']=result['']+b'x'
   return result
  with patch.object(m.capture_module,'capture',side_effect=changed),self.assertRaisesRegex(ValueError,'changed'):self.verify()
 def test_duplicate_source_keys_and_digest_mismatch_refused(self):
  self.source.write_bytes(b'{"version":2,"version":2}');before=self.bytes();self.assertEqual(self.command('--source-quiescent').returncode,2);self.assertEqual(self.bytes(),before)
if __name__=='__main__':unittest.main()
