"""Native runtime startup contract, with CLI/socket edges mocked, real asset tree."""
import importlib.util,pathlib,tempfile,shutil,unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('bridge_preflight',pathlib.Path(__file__).resolve().parents[1]/'bridge.py')
m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
DIST=pathlib.Path(__file__).resolve().parents[3]/'dist'
CORE=('index.html','app.js','catalog.js','core.js','styles.css','workspace-host.js','native-store-bootstrap.js')
class Tests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=pathlib.Path(self.tmp.name);self.binary=self.root/'store';self.binary.write_bytes(b'not executed');self.db=self.root/'db';self.db.write_bytes(b'unchanged');self.runtime=self.root/'runtime';shutil.copytree(DIST,self.runtime)
 def tearDown(self):self.tmp.cleanup()
 def bridge(self):return m.Bridge(self.binary,self.db,self.runtime)
 def test_each_missing_core_asset_rejects_before_cli_or_socket(self):
  for name in CORE:
   with self.subTest(name=name):
    file=self.runtime/name;payload=file.read_bytes();file.unlink()
    try:
     with patch.object(m.Bridge,'cli',return_value='{"schema":15}') as cli,patch.object(m.HTTPServer,'__init__',autospec=True,side_effect=lambda server,*args:setattr(server,'server_port',12345)) as listener:
      with self.assertRaisesRegex(ValueError,'incomplete.*'+name.replace('.','\\.')):self.bridge()
      cli.assert_not_called();listener.assert_not_called();self.assertEqual(self.db.read_bytes(),b'unchanged')
    finally:file.write_bytes(payload)
 def test_empty_runtime_rejected_before_cli_or_socket(self):
  shutil.rmtree(self.runtime);self.runtime.mkdir()
  with patch.object(m.Bridge,'cli',return_value='{"schema":15}') as cli,patch.object(m.HTTPServer,'__init__',autospec=True,side_effect=lambda server,*args:setattr(server,'server_port',12345)) as listener:
   with self.assertRaisesRegex(ValueError,'incomplete'):self.bridge()
   cli.assert_not_called();listener.assert_not_called()
 def test_optional_module_omission_still_allowed(self):
  for name in ['cinematic.mjs','native-weather.mjs','weather-renderer.mjs']:(self.runtime/'workspaces/foundry'/name).unlink()
  def listen(server,*args):server.server_port=12345
  with patch.object(m.Bridge,'cli',return_value='{"schema":15}') as cli,patch.object(m.HTTPServer,'__init__',listen):
   server=self.bridge();cli.assert_called_once_with('status');self.assertEqual(server.origin,'http://127.0.0.1:12345');self.assertIn('/app.js',server.files)
 def test_snapshot_is_immutable_after_successful_startup(self):
  def listen(server,*args):server.server_port=12345
  with patch.object(m.Bridge,'cli',return_value='{"schema":15}'),patch.object(m.HTTPServer,'__init__',listen):
   server=self.bridge();loaded=server.files['/app.js'][0];(self.runtime/'app.js').write_text('changed after launch');self.assertEqual(server.files['/app.js'][0],loaded)
if __name__=='__main__':unittest.main()
