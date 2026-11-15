import hashlib,importlib.util,json,pathlib,subprocess,sys,tempfile,unittest
from convert import read_music_source
import test_reconcile as fixtures
spec=importlib.util.spec_from_file_location('capsule_test_api',pathlib.Path(__file__).resolve().parents[1]/'capsule/capsule.py')
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
class CapsuleInputTests(unittest.TestCase):
 def setUp(self):
  self.fixture=fixtures.ReconcileTests();self.fixture.setUp();self.addCleanup(self.fixture.doCleanups);self.root=self.fixture.root;self.path=self.root/'capsule.json';self.output=self.root/'converted.json';self.music=self.fixture.source.read_text(encoding='utf8');self.original={'ff.music-hub.v2':self.music,'ff-world-layout':'PRIVATE-UNRELATED-RAW','ff-visual-quality':'\ud800'};self.write(self.original)
 def write(self,values):self.path.write_text(json.dumps(c.pack(values),ensure_ascii=True),encoding='ascii')
 def run_convert(self):return subprocess.run([sys.executable,str(pathlib.Path(__file__).with_name('convert.py')),str(self.path),str(self.fixture.mapping),str(self.output),'--capsule'],capture_output=True)
 def test_direct_conversion_and_reconciliation_preserve_source(self):
  before=self.path.read_bytes();r=self.run_convert();self.assertEqual(r.returncode,0,r.stderr);data=json.loads(self.output.read_bytes());self.assertEqual(data['rows'][0]['assignment']['label'],'PRIVATE-SYNTHETIC 音楽');self.assertNotIn(b'PRIVATE-UNRELATED',self.output.read_bytes());self.assertEqual(self.path.read_bytes(),before)
  r=subprocess.run([sys.executable,str(pathlib.Path(__file__).with_name('reconcile.py')),'--source',str(self.path),'--mapping',str(self.fixture.mapping),'--database',str(self.fixture.db),'--source-quiescent','--capsule'],capture_output=True)
  self.assertEqual(r.returncode,0,r.stderr);self.assertTrue(json.loads(r.stdout)['all_mapped_records_match']);self.assertEqual(self.path.read_bytes(),before)
 def test_corrupt_any_entry_refuses_before_output(self):
  data=json.loads(self.path.read_bytes());data['entries'][0]['utf16_sha256']='0'*64;self.path.write_text(json.dumps(data),encoding='utf8');before=self.path.read_bytes();r=self.run_convert();self.assertNotEqual(r.returncode,0);self.assertFalse(self.output.exists());self.assertEqual(self.path.read_bytes(),before);self.assertNotIn(b'PRIVATE',r.stdout+r.stderr)
 def test_missing_music_and_unpaired_music_surrogate_refuse(self):
  for values in ({'ff-world-layout':'private'},{'ff.music-hub.v2':'\ud800'}):
   self.write(values);r=self.run_convert();self.assertNotEqual(r.returncode,0);self.assertFalse(self.output.exists())
 def test_mapping_hash_must_describe_raw_value_not_capsule(self):
  mapping=json.loads(self.fixture.mapping.read_bytes());mapping['sourceSha256']=hashlib.sha256(self.path.read_bytes()).hexdigest();self.fixture.mapping.write_text(json.dumps(mapping));self.assertNotEqual(self.run_convert().returncode,0);self.assertFalse(self.output.exists())
 def test_existing_destination_preserved(self):
  self.output.write_bytes(b'KEEP');self.assertNotEqual(self.run_convert().returncode,0);self.assertEqual(self.output.read_bytes(),b'KEEP')
 def test_capsule_size_and_extracted_music_bound(self):
  self.path.write_bytes(b' '*(c.LIMIT+1))
  with self.assertRaises(ValueError):read_music_source(self.path,True)
  self.write({'ff.music-hub.v2':'x'*1000001})
  with self.assertRaises(ValueError):read_music_source(self.path,True)
if __name__=='__main__':unittest.main()
