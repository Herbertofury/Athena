"""Actual revision CLI through handler with in-memory HTTP response capture."""
import importlib.util,json,os,pathlib,subprocess,tempfile,threading,unittest
from email.message import Message
from unittest.mock import Mock
ROOT=pathlib.Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('preview_bridge',ROOT/'native/foundry/bridge.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class Tests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.db=pathlib.Path(self.temp.name)/'db.sqlite'
  self.binary=pathlib.Path(os.environ.get('ATHENA_FOUNDRY_STORE_BINARY',ROOT/'crates/athena-foundry-store/target/debug'/('athena-foundry-store.exe' if os.name=='nt' else 'athena-foundry-store')))
  self.assertTrue(self.binary.is_file(),'Build native CLI first')
  def run(command,payload=None):
   result=subprocess.run([str(self.binary),command,str(self.db)],input=payload,capture_output=True);self.assertEqual(result.returncode,0,result.stderr);return result.stdout
  run('init');original=(ROOT/'crates/athena-foundry-store/tests/fixtures/js-workspace.json').read_bytes();run('save-backup',original);run('upgrade-history');self.revision=json.loads(run('revisions'))[0]['id'];run('save-backup',original.replace(b'320',b'300'))
  self.server=m.Bridge.__new__(m.Bridge);self.server.binary=str(self.binary);self.server.database=str(self.db);self.server.operation_lock=threading.RLock();self.server.host='127.0.0.1:1';self.server.origin='http://'+self.server.host;self.server.schema=3
 def handler(self):
  h=m.Handler.__new__(m.Handler);h.server=self.server;h.path='/__native/revision-preview/'+str(self.revision);h.headers=Message();h.headers['Host']=self.server.host;h.headers['X-Athena-Native']='1';h.reply=Mock();return h
 def test_read_only_preview_through_real_cli(self):
  before=self.db.read_bytes();h=self.handler();h.do_GET();self.assertEqual(h.reply.call_args.args[0],200);value=json.loads(h.reply.call_args.args[1]);self.assertFalse(value['restore_applied']);self.assertEqual(value['changes'],[{'path':'/view/inspectorWidth','change':'replaced'}]);self.assertEqual(self.db.read_bytes(),before)
 def test_reject_untrusted_and_malformed_requests_before_cli(self):
  for mode in ('header','origin','id'):
   h=self.handler();h.server.cli=Mock()
   if mode=='header':del h.headers['X-Athena-Native']
   elif mode=='origin':h.headers['Origin']='https://other.invalid'
   else:h.path='/__native/revision-preview/1x'
   h.do_GET();self.assertIn(h.reply.call_args.args[0],(400,403));h.server.cli.assert_not_called()
 def test_missing_revision_no_mutation(self):
  before=self.db.read_bytes();h=self.handler();h.path='/__native/revision-preview/999999';h.do_GET();self.assertEqual(h.reply.call_args.args[0],422);self.assertEqual(self.db.read_bytes(),before)
if __name__=='__main__':unittest.main()
