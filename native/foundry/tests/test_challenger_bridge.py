import os,unittest,tempfile,pathlib,importlib.util,subprocess,threading,http.client,json,time
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('challenger_bridge',ROOT/'bridge.py');bridge=importlib.util.module_from_spec(spec);spec.loader.exec_module(bridge)
spec=importlib.util.spec_from_file_location('challenger_service',ROOT/'challenger_service.py');service=importlib.util.module_from_spec(spec);spec.loader.exec_module(service)
BIN=os.environ.get('ATHENA_FOUNDRY_STORE_BINARY',str(ROOT.parents[1]/'crates/athena-foundry-store/target/debug'/('athena-foundry-store.exe' if os.name=='nt' else 'athena-foundry-store')))
class Tests(unittest.TestCase):
 def test_service_rejects_nonpublic_paths_and_bounds(self):
  for values in [('http://localhost/x',),('a/..',),('a/a','a/b','a/c','a/d')]:
   with self.assertRaises(ValueError):service.ChallengerService(values)
  obj=service.ChallengerService();obj.start();self.assertIsNone(obj.thread);self.assertEqual(obj.snapshot()['status'],'disabled');obj.close()
 def test_service_failure_is_optional_and_launch_scoped(self):
  obj=service.ChallengerService(['owner/repo'])
  with patch.object(service.subprocess,'Popen',side_effect=OSError('unavailable')):
   obj.start();thread=obj.thread;obj.start();self.assertIs(obj.thread,thread);thread.join(2)
  self.assertEqual(obj.snapshot()['status'],'unavailable');obj.close()
 def test_shutdown_terminates_background_child_without_receipt_or_retry(self):
  started=threading.Event();ended=threading.Event()
  class Child:
   def wait(self,timeout=None):started.set();ended.wait(timeout);return -15
   def poll(self):return -15 if ended.is_set() else None
   def terminate(self):ended.set()
   def kill(self):ended.set()
  obj=service.ChallengerService(['owner/repo'])
  with patch.object(service.subprocess,'Popen',return_value=Child()) as launch:
   obj.start();self.assertTrue(started.wait(1));obj.close();self.assertFalse(obj.thread.is_alive());self.assertEqual(launch.call_count,1);self.assertIn('-B',launch.call_args.args[0])
  self.assertEqual(obj.snapshot()['status'],'stopped');self.assertIsNone(obj.snapshot()['report'])
 def test_malformed_optional_helper_does_not_block_native_core(self):
  with tempfile.TemporaryDirectory() as directory:
   db=pathlib.Path(directory)/'store.sqlite';subprocess.run([BIN,'init',str(db)],check=True,capture_output=True)
   with patch.object(bridge.importlib.util,'spec_from_file_location',side_effect=SyntaxError('optional helper')):
    server=bridge.Bridge(BIN,db,ROOT.parents[1]/'dist',challenger_repositories=['owner/repo'])
   try:self.assertEqual(server.challenger_status['status'],'unavailable');self.assertIn('/index.html',server.files)
   finally:server.server_close()
 def test_nonobject_child_receipt_becomes_unavailable(self):
  class Child:
   def wait(self,timeout=None):return 0
   def poll(self):return 0
  def launch(command,**kwargs):pathlib.Path(command[command.index('--output')+1]).write_text('[]');return Child()
  obj=service.ChallengerService(['owner/repo'])
  with patch.object(service.subprocess,'Popen',side_effect=launch):obj.start();obj.thread.join(2)
  self.assertEqual(obj.snapshot()['status'],'unavailable');obj.close()
 def test_native_endpoint_is_read_only_scoped_and_core_works_disabled(self):
  with tempfile.TemporaryDirectory() as directory:
   db=pathlib.Path(directory)/'store.sqlite';subprocess.run([BIN,'init',str(db)],check=True,capture_output=True);before=db.read_bytes();server=bridge.Bridge(BIN,db,ROOT.parents[1]/'dist');thread=threading.Thread(target=server.serve_forever);thread.start()
   try:
    def request(path,headers={},method='GET'):
     c=http.client.HTTPConnection('127.0.0.1',server.server_port,timeout=3);c.request(method,path,headers=headers);r=c.getresponse();body=r.read();c.close();return r.status,body
    self.assertEqual(request('/__native/challenger-review')[0],403)
    status,body=request('/__native/challenger-review',{'X-Athena-Native':'1'});self.assertEqual(status,200);self.assertEqual(json.loads(body)['status'],'disabled')
    self.assertEqual(request('/__native/challenger-review?repo=private/data',{'X-Athena-Native':'1'})[0],400)
    self.assertEqual(request('/__native/challenger-review',{'X-Athena-Native':'1'},'POST')[0],404)
    self.assertIn(b'if(!true)return',request('/native-store-bootstrap.js')[1]);
    self.assertEqual(request('/index.html')[0],200);self.assertEqual(db.read_bytes(),before)
   finally:server.shutdown();thread.join();server.server_close()
