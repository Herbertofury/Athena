import hashlib,importlib.util,json,pathlib,subprocess,sys,tempfile,unittest
ROOT=pathlib.Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('native_packager',ROOT/'scripts/package_native.py');pack=importlib.util.module_from_spec(spec);spec.loader.exec_module(pack)
spec=importlib.util.spec_from_file_location('native_launcher',ROOT/'native/foundry/portable_launcher.py');launch=importlib.util.module_from_spec(spec);spec.loader.exec_module(launch)
class PortableTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=pathlib.Path(self.temp.name);self.binary=self.root/'fixture-binary';self.binary.write_bytes(b'SYNTHETIC NOT EXECUTABLE');self.sha=hashlib.sha256(self.binary.read_bytes()).hexdigest();self.output=self.root/'portable'
 def build(self):return pack.package(ROOT/'dist',self.binary,self.sha,self.output,'windows' if sys.platform=='win32' else 'linux')
 def test_exact_runtime_and_verify_only_without_checkout_imports(self):
  receipt=self.build();self.assertFalse(receipt['database_included']);self.assertEqual(launch.verify(self.output),receipt)
  result=subprocess.run([sys.executable,'-B',str(self.output/'launch.py'),'--verify-only'],cwd=self.root,capture_output=True,text=True)
  self.assertEqual(result.returncode,0,result.stderr);self.assertIn('no executable or database opened',result.stdout);self.assertFalse((self.output/'__pycache__').exists())
  manifest=json.loads((ROOT/'config/runtime-public-preview.json').read_text());self.assertEqual(len(receipt['files']),len(manifest['files'])+4)
  for row in manifest['files']:self.assertEqual((self.output/'runtime'/row['path']).read_bytes(),(ROOT/'dist'/row['path']).read_bytes())
 def test_refuse_existing_destination_and_wrong_binary_hash(self):
  with self.assertRaises(ValueError):pack.package(ROOT/'dist',self.binary,'0'*64,self.output,'linux')
  self.assertFalse(self.output.exists());self.output.mkdir();sentinel=self.output/'user-file';sentinel.write_text('keep')
  with self.assertRaises(FileExistsError):self.build()
  self.assertEqual(sentinel.read_text(),'keep')
 def test_tamper_and_unlisted_database_refused(self):
  self.build();(self.output/'runtime/app.js').write_bytes(b'tampered')
  with self.assertRaises(ValueError):launch.verify(self.output)
  result=subprocess.run([sys.executable,'-B',str(self.output/'launch.py'),'--database',str(self.root/'not-present')],capture_output=True,text=True)
  self.assertEqual(result.returncode,2);self.assertNotIn(str(self.root),result.stderr)
 def test_extra_private_file_and_manifest_path_escape_refused(self):
  self.build();private=self.output/'private.sqlite';private.write_bytes(b'keep')
  with self.assertRaises(ValueError):launch.verify(self.output)
  private.unlink();manifest=self.output/'native-package.json';data=json.loads(manifest.read_text());data['files'][0]['path']='../private.sqlite';manifest.write_text(json.dumps(data))
  with self.assertRaises(ValueError):launch.verify(self.output)
 def test_source_and_binary_unchanged(self):
  original=self.binary.read_bytes();before=(ROOT/'config/runtime-public-preview.json').read_bytes();self.build();self.assertEqual(self.binary.read_bytes(),original);self.assertEqual((ROOT/'config/runtime-public-preview.json').read_bytes(),before)
 def test_symlink_binary_refused(self):
  link=self.root/'link'
  try:link.symlink_to(self.binary)
  except OSError:self.skipTest('OS cannot create fixture symlink')
  with self.assertRaises(ValueError):pack.package(ROOT/'dist',link,self.sha,self.output,'linux')
if __name__=='__main__':unittest.main()
