import os
from unittest.mock import patch
import pathlib,tempfile,shutil,unittest,importlib.util,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1];s=importlib.util.spec_from_file_location('boundary_bridge',ROOT/'bridge.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
BIN=os.environ.get('ATHENA_FOUNDRY_STORE_BINARY',str(pathlib.Path(__file__).resolve().parents[3]/'crates/athena-foundry-store/target/debug'/('athena-foundry-store.exe' if os.name=='nt' else 'athena-foundry-store')))
class StaticBoundary(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=pathlib.Path(self.tmp.name);self.runtime=self.root/'runtime';shutil.copytree(ROOT.parents[1]/'dist',self.runtime);self.db=self.root/'store.sqlite';subprocess.run([BIN,'init',str(self.db)],check=True,capture_output=True)
 def tearDown(self):self.tmp.cleanup()
 def bridge(self):return m.Bridge(BIN,self.db,self.runtime)
 def test_unreviewed_nonhidden_payloads_fail_before_listening(self):
  for name in ('backup.sqlite','diagnostics.json','notes.txt','workspaces/foundry/private.json'):
   with self.subTest(name=name):
    p=self.runtime/name;p.write_bytes(b'SYNTHETIC_PRIVATE_SENTINEL');before=self.db.read_bytes()
    with self.assertRaisesRegex(ValueError,'Unreviewed runtime file'):self.bridge()
    self.assertEqual(p.read_bytes(),b'SYNTHETIC_PRIVATE_SENTINEL');self.assertEqual(self.db.read_bytes(),before);p.unlink()
 def test_only_reviewed_files_appear_and_hidden_data_excluded(self):
  (self.runtime/'.env').write_bytes(b'SYNTHETIC_SECRET');(self.runtime/'.private').mkdir();(self.runtime/'.private'/'data.json').write_text('{}')
  server=self.bridge()
  try:self.assertEqual(set(server.files),{'/'+n for n in m.STATIC_PATHS});self.assertNotIn('/.env',server.files)
  finally:server.server_close()
 def test_disabled_optional_files_can_be_absent(self):
  for name in ('cinematic.mjs','native-weather.mjs','weather-renderer.mjs'):(self.runtime/'workspaces/foundry'/name).unlink()
  server=self.bridge()
  try:self.assertIn('/index.html',server.files);self.assertNotIn('/workspaces/foundry/native-weather.mjs',server.files)
  finally:server.server_close()
 def test_browser_code_types_do_not_depend_on_host_mime_registry(self):
  with patch.object(m.mimetypes,'guess_type',return_value=('text/plain',None)):
   server=self.bridge()
   try:
    for name in ('/app.js','/workspaces/foundry/index.mjs','/workspaces/foundry/layout-state.mjs'):
     self.assertEqual(server.files[name][1],'text/javascript',name)
   finally:server.server_close()
if __name__=='__main__':unittest.main()
