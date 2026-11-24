import hashlib,importlib.util,json,pathlib,subprocess,sys,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[3]
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
pack=module('unified_pack',ROOT/'scripts/package_native.py');launch=module('unified_launch',ROOT/'native/foundry/portable_launcher.py')
class PortableUnified(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name);self.bin=self.root/'synthetic';self.bin.write_bytes(b'NOT EXECUTABLE');self.sha=hashlib.sha256(self.bin.read_bytes()).hexdigest();self.out=self.root/'package'
 def build(self):return pack.package(ROOT/'dist',self.bin,self.sha,self.out,'windows' if sys.platform=='win32' else 'linux',self.bin,self.sha)
 def test_verified_exact_runtime_no_execution(self):
  receipt=self.build();self.assertEqual(receipt,launch.verify(self.out));self.assertEqual(receipt['profile'],'unified')
  r=subprocess.run([sys.executable,'-B',str(self.out/'launch.py'),'--verify-only'],capture_output=True,text=True);self.assertEqual(r.returncode,0,r.stderr)
  manifest=json.loads((ROOT/'config/runtime-public-preview.json').read_text())
  for f in manifest['files']:self.assertEqual(hashlib.sha256((self.out/'runtime'/f['path']).read_bytes()).hexdigest(),f['sha256'])
 def test_engine_hash_required_and_no_output(self):
  self.assertRaises(ValueError,pack.package,ROOT/'dist',self.bin,self.sha,self.out,'linux',self.bin,'0'*64);self.assertFalse(self.out.exists())
 def test_journal_requires_both_stores_and_direct_external_path(self):
  self.build();db=self.root/'db';db.write_bytes(b'untouched')
  for args in (['--database',str(db)],['--verify-only','--journal',str(self.root/'journal')],['--database',str(db),'--journal',str(self.root/'x'/'..'/'journal')]):
   r=subprocess.run([sys.executable,'-B',str(self.out/'launch.py'),*args],capture_output=True,text=True);self.assertEqual(r.returncode,2,r.stderr)
  self.assertEqual(db.read_bytes(),b'untouched')
 def test_engine_tamper_refused(self):
  receipt=self.build();(self.out/receipt['engine']).write_bytes(b'changed');self.assertRaises(ValueError,launch.verify,self.out)
if __name__=='__main__':unittest.main()
