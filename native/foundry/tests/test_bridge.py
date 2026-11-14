from contextlib import closing
import os
import importlib.util,pathlib,tempfile,subprocess,threading,http.client,unittest,json,sqlite3
ROOT=pathlib.Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('bridge',ROOT/'bridge.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
BIN=os.environ.get('ATHENA_FOUNDRY_STORE_BINARY',str(pathlib.Path(__file__).resolve().parents[3]/'crates/athena-foundry-store/target/debug'/('athena-foundry-store.exe' if os.name=='nt' else 'athena-foundry-store')));FIX=(pathlib.Path(__file__).resolve().parents[3]/'crates/athena-foundry-store/tests/fixtures/js-workspace.json').read_text()
class Tests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.db=pathlib.Path(self.tmp.name)/'store.sqlite';subprocess.run([BIN,'init',str(self.db)],check=True,capture_output=True);self.server=m.Bridge(BIN,self.db,ROOT.parents[1]/'dist');self.thread=threading.Thread(target=self.server.serve_forever);self.thread.start()
 def tearDown(self):self.server.shutdown();self.thread.join();self.server.server_close();self.tmp.cleanup()
 def request(self,method='GET',path='/__native/backup',body=None,headers=None):
  h={'Host':self.server.host,'Origin':self.server.origin,'X-Athena-Native':'1'};h.update(headers or {});c=http.client.HTTPConnection('127.0.0.1',self.server.server_port,timeout=5);c.request(method,path,body=body.encode('utf8') if isinstance(body,str) else body,headers=h);r=c.getresponse();result=(r.status,r.read(),dict(r.getheaders()));c.close();return result
 def test_actual_cli_save_load_last_good(self):
  self.assertEqual(self.request()[1],b'null');self.assertEqual(self.request('POST',body=FIX,headers={'Content-Type':'application/json','If-Match':'"empty"'})[0],200);stored=self.request()[1];self.assertEqual(json.loads(stored),json.loads(FIX));self.assertEqual(self.request('POST',body='{"bad":true}',headers={'Content-Type':'application/json','If-Match':self.request()[2]['ETag']})[0],422);self.assertEqual(self.request()[1],stored)
 def test_transform_upgrade_refusal_is_actionable_and_nonmutating(self):
  self.server.shutdown();self.thread.join();self.server.server_close()
  for command in ['upgrade-history','upgrade-soundtracks']:subprocess.run([BIN,command,str(self.db)],check=True,capture_output=True)
  self.server=m.Bridge(BIN,self.db,ROOT.parents[1]/'dist');self.thread=threading.Thread(target=self.server.serve_forever);self.thread.start()
  value=json.loads(FIX);value['version']=2;before=self.db.read_bytes()
  status,body,_=self.request('POST',body=json.dumps(value),headers={'Content-Type':'application/json','If-Match':'"empty"'})
  self.assertEqual(status,422);self.assertIn(b'upgrade-transforms',body);self.assertIn(b'relaunch',body);self.assertEqual(self.db.read_bytes(),before)
 def test_scope_upgrade_requires_schema6_without_mutating_schema5(self):
  self.server.shutdown();self.thread.join();self.server.server_close()
  for command in ['upgrade-history','upgrade-soundtracks','upgrade-transforms']:subprocess.run([BIN,command,str(self.db)],check=True,capture_output=True)
  self.server=m.Bridge(BIN,self.db,ROOT.parents[1]/'dist');self.thread=threading.Thread(target=self.server.serve_forever);self.thread.start()
  value=json.loads(FIX);value['version']=3;before=self.db.read_bytes()
  status,body,_=self.request('POST',body=json.dumps(value),headers={'Content-Type':'application/json','If-Match':'"empty"'})
  self.assertEqual(status,422);self.assertIn(b'upgrade-scopes',body);self.assertIn(b'relaunch',body);self.assertEqual(before,self.db.read_bytes())
 def test_environment_explicit_upgrade_and_disable_bootstrap(self):
  self.server.shutdown();self.thread.join();self.server.server_close()
  for command in ['upgrade-history','upgrade-soundtracks','upgrade-transforms','upgrade-scopes']:subprocess.run([BIN,command,str(self.db)],check=True,capture_output=True)
  self.server=m.Bridge(BIN,self.db,ROOT.parents[1]/'dist',disable_foundry_modules=['environment']);self.thread=threading.Thread(target=self.server.serve_forever);self.thread.start()
  value=json.loads(FIX);value['version']=4;before=self.db.read_bytes()
  status,body,_=self.request('POST',body=json.dumps(value),headers={'Content-Type':'application/json','If-Match':'"empty"'})
  self.assertEqual(status,422);self.assertIn(b'upgrade-environment',body);self.assertEqual(before,self.db.read_bytes())
  status,body,_=self.request(path='/native-store-bootstrap.js');self.assertEqual(status,200);self.assertIn(b'"environment":false',body)
 def test_target_upgrade_refuses_schema7_without_mutation(self):
  self.server.shutdown();self.thread.join();self.server.server_close()
  for command in ['upgrade-history','upgrade-soundtracks','upgrade-transforms','upgrade-scopes','upgrade-environment']:subprocess.run([BIN,command,str(self.db)],check=True,capture_output=True)
  self.server=m.Bridge(BIN,self.db,ROOT.parents[1]/'dist');self.thread=threading.Thread(target=self.server.serve_forever);self.thread.start()
  value=json.loads(FIX);value['version']=5;before=self.db.read_bytes()
  status,body,_=self.request('POST',body=json.dumps(value),headers={'Content-Type':'application/json','If-Match':'"empty"'})
  self.assertEqual(status,422);self.assertIn(b'upgrade-targets',body);self.assertEqual(before,self.db.read_bytes())
 def test_instance_upgrade_refuses_schema8_without_mutation(self):
  self.server.shutdown();self.thread.join();self.server.server_close()
  for command in ['upgrade-history','upgrade-soundtracks','upgrade-transforms','upgrade-scopes','upgrade-environment','upgrade-targets']:subprocess.run([BIN,command,str(self.db)],check=True,capture_output=True)
  self.server=m.Bridge(BIN,self.db,ROOT.parents[1]/'dist');self.thread=threading.Thread(target=self.server.serve_forever);self.thread.start()
  value=json.loads(FIX);value['version']=6;before=self.db.read_bytes()
  status,body,_=self.request('POST',body=json.dumps(value),headers={'Content-Type':'application/json','If-Match':'"empty"'})
  self.assertEqual(status,422);self.assertIn(b'upgrade-instances',body);self.assertEqual(before,self.db.read_bytes())
 def test_appearance_upgrade_refuses_schema9_without_mutation(self):
  self.server.shutdown();self.thread.join();self.server.server_close()
  for command in ['upgrade-history','upgrade-soundtracks','upgrade-transforms','upgrade-scopes','upgrade-environment','upgrade-targets','upgrade-instances']:subprocess.run([BIN,command,str(self.db)],check=True,capture_output=True)
  self.server=m.Bridge(BIN,self.db,ROOT.parents[1]/'dist');self.thread=threading.Thread(target=self.server.serve_forever);self.thread.start()
  value=json.loads(FIX);value['version']=7;before=self.db.read_bytes()
  status,body,_=self.request('POST',body=json.dumps(value),headers={'Content-Type':'application/json','If-Match':'"empty"'})
  self.assertEqual(status,422);self.assertIn(b'upgrade-appearance',body);self.assertEqual(before,self.db.read_bytes())
 def test_filters_upgrade_refuses_schema10_without_mutation(self):
  self.server.shutdown();self.thread.join();self.server.server_close()
  for command in ['upgrade-history','upgrade-soundtracks','upgrade-transforms','upgrade-scopes','upgrade-environment','upgrade-targets','upgrade-instances','upgrade-appearance']:subprocess.run([BIN,command,str(self.db)],check=True,capture_output=True)
  self.server=m.Bridge(BIN,self.db,ROOT.parents[1]/'dist');self.thread=threading.Thread(target=self.server.serve_forever);self.thread.start()
  value=json.loads(FIX);value['version']=8;before=self.db.read_bytes()
  status,body,_=self.request('POST',body=json.dumps(value),headers={'Content-Type':'application/json','If-Match':'"empty"'})
  self.assertEqual(status,422);self.assertIn(b'upgrade-filters',body);self.assertEqual(before,self.db.read_bytes())
 def test_origins_upgrade_refuses_schema11_without_mutation(self):
  self.server.shutdown();self.thread.join();self.server.server_close()
  for command in ['upgrade-history','upgrade-soundtracks','upgrade-transforms','upgrade-scopes','upgrade-environment','upgrade-targets','upgrade-instances','upgrade-appearance']:subprocess.run([BIN,command,str(self.db)],check=True,capture_output=True)
  self.server=m.Bridge(BIN,self.db,ROOT.parents[1]/'dist');self.thread=threading.Thread(target=self.server.serve_forever);self.thread.start()
  value=json.loads(FIX);value['version']=9;before=self.db.read_bytes()
  status,body,_=self.request('POST',body=json.dumps(value),headers={'Content-Type':'application/json','If-Match':'"empty"'})
  self.assertEqual(status,422);self.assertIn(b'upgrade-origins',body);self.assertEqual(before,self.db.read_bytes())
 def test_two_clients_and_external_cli_are_fenced(self):
  a=self.request()[2]['ETag'];b=self.request()[2]['ETag']
  self.assertEqual(a,b)
  self.assertEqual(self.request('POST',body=FIX,headers={'Content-Type':'application/json'})[0],428)
  status,_,h=self.request('POST',body=FIX,headers={'Content-Type':'application/json','If-Match':a});self.assertEqual(status,200)
  good=self.db.read_bytes();different=FIX.replace('Workspace 🌙','Client B')
  self.assertEqual(self.request('POST',body=different,headers={'Content-Type':'application/json','If-Match':b})[0],409);self.assertEqual(self.db.read_bytes(),good)
  reviewed=self.request()[2]['ETag']
  self.assertEqual(self.request('POST',body=different,headers={'Content-Type':'application/json','If-Match':reviewed})[0],200)
  token=self.request()[2]['ETag']
  subprocess.run([BIN,'save-backup',str(self.db)],input=FIX,text=True,check=True,capture_output=True)
  good=self.db.read_bytes()
  self.assertEqual(self.request('POST',body=different,headers={'Content-Type':'application/json','If-Match':token})[0],409);self.assertEqual(self.db.read_bytes(),good)
 def test_revision_read_requires_explicit_upgrade_and_rejects_corruption(self):
  self.assertEqual(self.request(path='/__native/revisions')[0],409)
  self.assertEqual(self.request('POST',path='/__native/restore',body='{"id":1}',headers={'Content-Type':'application/json','If-Match':'"empty"'})[0],422)
  self.assertEqual(json.loads(subprocess.check_output([BIN,'status',str(self.db)]))['schema'],2)
  self.server.shutdown();self.thread.join();self.server.server_close()
  subprocess.run([BIN,'upgrade-history',str(self.db)],check=True,capture_output=True)
  subprocess.run([BIN,'save-backup',str(self.db)],input=FIX,text=True,check=True,capture_output=True)
  self.server=m.Bridge(BIN,self.db,ROOT.parents[1]/'dist');self.thread=threading.Thread(target=self.server.serve_forever);self.thread.start()
  status,body,_=self.request(path='/__native/revisions');self.assertEqual(status,200);rows=json.loads(body);self.assertEqual(len(rows),1);id=rows[0]['id']
  self.assertEqual(json.loads(self.request(path=f'/__native/revision/{id}')[1]),json.loads(FIX))
  self.assertEqual(self.request(path='/__native/revision/999')[0],422)
  for path in ['/__native/revision/0','/__native/revision/-1','/__native/revision/1;drop','/__native/revision/999999999999999999999'] :self.assertEqual(self.request(path=path)[0],400)
  with closing(sqlite3.connect(self.db)) as db, db:db.execute('UPDATE workspace_revisions SET sha256=? WHERE id=?',('corrupt',id))
  before=self.db.read_bytes();self.assertEqual(self.request(path=f'/__native/revision/{id}')[0],422);self.assertEqual(self.db.read_bytes(),before)
  token=self.request()[2]['ETag']
  for selected in [id,999]:
   self.assertEqual(self.request('POST',path='/__native/restore',body=json.dumps({'id':selected}),headers={'Content-Type':'application/json','If-Match':token})[0],422);self.assertEqual(self.db.read_bytes(),before)
 def test_soundtrack_read_only_schema_and_corrupt_url(self):
  path='/__native/soundtrack/frutiger-aero/aero-lounge'
  self.assertEqual(self.request(path=path)[0],409)
  self.server.shutdown();self.thread.join();self.server.server_close()
  subprocess.run([BIN,'upgrade-history',str(self.db)],check=True,capture_output=True)
  self.server=m.Bridge(BIN,self.db,ROOT.parents[1]/'dist');self.thread=threading.Thread(target=self.server.serve_forever);self.thread.start()
  self.assertEqual(self.request(path=path)[0],409)
  self.server.shutdown();self.thread.join();self.server.server_close()
  subprocess.run([BIN,'upgrade-soundtracks',str(self.db)],check=True,capture_output=True)
  self.server=m.Bridge(BIN,self.db,ROOT.parents[1]/'dist');self.thread=threading.Thread(target=self.server.serve_forever);self.thread.start()
  self.assertEqual(json.loads(self.request(path=path)[1]),None)
  catalog=json.loads((ROOT.parents[1]/'dist/workspaces/foundry/catalog.json').read_text());t=catalog['themes'][0];room=t['rooms'][0]['id'];path=f"/__native/soundtrack/{t['id']}/{room}"
  assignment={'theme_id':t['id'],'room_id':room,'provider':'spotify','url':'https://open.spotify.com/track/synthetic','label':'Fixture','status':'USER_ASSIGNED','source_id':None}
  subprocess.run([BIN,'assign-native',str(self.db)],input=json.dumps(assignment),text=True,check=True,capture_output=True)
  before=self.db.read_bytes();status,body,_=self.request(path=path);self.assertEqual(status,200);self.assertEqual(json.loads(body)['assignment'],assignment);self.assertEqual(self.db.read_bytes(),before)
  first_token=self.request(path=path)[2]['ETag'];second_token=self.request(path=path)[2]['ETag'];public={k:assignment[k] for k in ['theme_id','room_id','provider','url','label']};edited={**public,'label':'Updated from client A'}
  self.assertEqual(self.request('POST',path='/__native/assign-soundtrack',body=json.dumps(edited),headers={'Content-Type':'application/json','If-Match':first_token})[0],200)
  last_good=self.db.read_bytes()
  self.assertEqual(self.request('POST',path='/__native/assign-soundtrack',body=json.dumps(public),headers={'Content-Type':'application/json','If-Match':second_token})[0],409);self.assertEqual(self.db.read_bytes(),last_good)
  reviewed=self.request(path=path)[2]['ETag']
  self.assertEqual(self.request('POST',path='/__native/assign-soundtrack',body=json.dumps({**edited,'status':'AUTHORIZED','source_id':'caller'}),headers={'Content-Type':'application/json','If-Match':reviewed})[0],400);self.assertEqual(self.db.read_bytes(),last_good)
  invalid={**edited,'url':'javascript:alert(1)'}
  self.assertEqual(self.request('POST',path='/__native/assign-soundtrack',body=json.dumps(invalid),headers={'Content-Type':'application/json','If-Match':reviewed})[0],422);self.assertEqual(self.db.read_bytes(),last_good)
  with closing(sqlite3.connect(self.db)) as db, db:db.execute("UPDATE soundtracks SET url='javascript:alert(1)'")
  before=self.db.read_bytes();self.assertEqual(self.request(path=path)[0],422);self.assertEqual(self.db.read_bytes(),before)
  self.assertEqual(self.request(path='/__native/soundtrack/a/../../file')[0],400)
 def test_host_origin_header_and_cors(self):
  for h in [{'Host':'evil.test'},{'Origin':'https://evil.test'},{'X-Athena-Native':''},{'Sec-Fetch-Site':'cross-site'}]:self.assertEqual(self.request(headers=h)[0],403)
  self.assertEqual(self.request('POST',body=FIX,headers={'Origin':'','Content-Type':'application/json'})[0],403)
  status,_,headers=self.request('OPTIONS');self.assertEqual(status,405);self.assertNotIn('Access-Control-Allow-Origin',headers)
 def test_rejected_post_bodies_are_delivered_without_native_mutation(self):
  before=self.db.read_bytes()
  for _ in range(5):
   for headers,expected in [({'Origin':''},403),({'Origin':'https://evil.test'},403),({'Content-Type':'text/plain'},415)]:
    status,body,response_headers=self.request('POST',body='x'*131072,headers={'Content-Type':'application/json',**headers})
    self.assertEqual(status,expected);self.assertNotIn('Access-Control-Allow-Origin',response_headers)
  self.assertEqual(self.db.read_bytes(),before);self.assertEqual(self.request()[1],b'null')
 def test_limits_routes_and_content(self):
  self.assertEqual(self.request('POST',body='',headers={'Content-Type':'application/json','Content-Length':'4000001'})[0],413)
  self.assertEqual(self.request('POST',body=FIX,headers={'Content-Type':'text/plain'})[0],415)
  for path in ['/../../bridge.py','/%2e%2e/bridge.py','/__native/backup?path=other','/__native/command'] : self.assertIn(self.request(path=path)[0],(400,404))
  status,body,_=self.request(path='/');self.assertEqual(status,200);self.assertIn(b'native-store-bootstrap.js',body)
if __name__=='__main__':unittest.main()
