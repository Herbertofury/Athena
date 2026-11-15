import hashlib,importlib.util,json,os,pathlib,subprocess,sys,tempfile,unittest
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('first_run_launcher',ROOT/'native/foundry/portable_launcher.py');launch=importlib.util.module_from_spec(spec);spec.loader.exec_module(launch)
BINARY=pathlib.Path(os.environ.get('ATHENA_FOUNDRY_STORE_BINARY',ROOT/'crates/athena-foundry-store/target/debug'/('athena-foundry-store.exe' if os.name=='nt' else 'athena-foundry-store')))
class FirstRunTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name);self.target=self.root/'new.sqlite';self.data={'binary':BINARY.name}
 def create(self):return launch.create_database(BINARY.parent,self.data,self.target)
 def test_real_native_setup_and_repeat_preserves_bytes(self):
  self.assertTrue(BINARY.is_file(),'build current native store before tests')
  result=self.create();self.assertEqual(result['schema'],15);before=self.target.read_bytes()
  status=json.loads(subprocess.check_output([str(BINARY),'status',str(self.target)]));self.assertEqual(status['schema'],15);self.assertEqual(status['integrity'],'ok')
  with self.assertRaises(ValueError):self.create()
  self.assertEqual(before,self.target.read_bytes());self.assertEqual(list(self.root.glob('.athena-first-run-*')),[])
 def test_failed_native_setup_cleans_only_owned_staging(self):
  sentinel=self.root/'keep';sentinel.write_text('keep')
  with patch.object(launch.subprocess,'run',side_effect=subprocess.TimeoutExpired('synthetic',15)):
   with self.assertRaises(subprocess.TimeoutExpired):self.create()
  self.assertFalse(self.target.exists());self.assertEqual(sentinel.read_text(),'keep');self.assertEqual(list(self.root.glob('.athena-first-run-*')),[])
 def test_racing_target_never_overwritten(self):
  actual_link=os.link
  def race(source,target):
   self.target.write_bytes(b'OTHER WRITER');return actual_link(source,target)
  with patch.object(launch.os,'link',side_effect=race):
   with self.assertRaises(FileExistsError):self.create()
  self.assertEqual(self.target.read_bytes(),b'OTHER WRITER');self.assertEqual(list(self.root.glob('.athena-first-run-*')),[])
 def test_unsupported_hardlinks_refuse_without_target(self):
  with patch.object(launch.os,'link',side_effect=OSError('unsupported')):
   with self.assertRaises(OSError):self.create()
  self.assertFalse(self.target.exists());self.assertEqual(list(self.root.glob('.athena-first-run-*')),[])
 def test_missing_parent_internal_path_and_symlink_refused(self):
  with self.assertRaises(ValueError):launch.create_database(self.root,{},self.target)
  self.target=self.root/'missing'/'db'
  with self.assertRaises(ValueError):self.create()
  self.target=self.root/'link'
  try:self.target.symlink_to(self.root/'absent')
  except OSError:self.skipTest('OS cannot create fixture symlink')
  with self.assertRaises(ValueError):self.create()
if __name__=='__main__':unittest.main()
