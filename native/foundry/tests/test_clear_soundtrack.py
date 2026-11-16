"""Actual native executable through in-memory HTTP handler; no provider traffic."""
import importlib.util,io,json,os,pathlib,subprocess,tempfile,threading,unittest
from email.message import Message
from unittest.mock import Mock
ROOT=pathlib.Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('clear_bridge',ROOT/'native/foundry/bridge.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m)
class ClearTests(unittest.TestCase):
 def test_auth_preconditions_stale_and_scoped_clear_across_schemas(self):
  binary=pathlib.Path(os.environ.get('ATHENA_FOUNDRY_STORE_BINARY',ROOT/'crates/athena-foundry-store/target/debug'/('athena-foundry-store.exe' if os.name=='nt' else 'athena-foundry-store')))
  self.assertTrue(binary.is_file(),'Build native executable first')
  for schema in (4,15):
   with self.subTest(schema=schema),tempfile.TemporaryDirectory() as temp:
    db=pathlib.Path(temp)/'native.sqlite'
    def cli(cmd,body=None):
     r=subprocess.run([str(binary),cmd,str(db)],input=json.dumps(body).encode() if body else None,capture_output=True,timeout=20);self.assertEqual(r.returncode,0,r.stderr);return json.loads(r.stdout) if r.stdout.strip() else None
    upgrades=['history','soundtracks']+(['transforms','scopes','environment','targets','instances','appearance','filters','origins','environments','blend-modes','music-precision'] if schema==15 else [])
    for cmd in ['init']+['upgrade-'+v for v in upgrades]:cli(cmd)
    server=m.Bridge.__new__(m.Bridge);server.binary=str(binary);server.database=str(db);server.schema=schema;server.host='127.0.0.1:1';server.origin='http://'+server.host;server.operation_lock=threading.RLock()
    theme='frutiger-aero';room=theme+':room:aqua-atrium';other=theme+':room:cloud-terminal'
    def read(key):
     r=subprocess.run([str(binary),'read-native-versioned',str(db),theme,key],capture_output=True,timeout=20);self.assertEqual(r.returncode,0,r.stderr);return json.loads(r.stdout) if r.stdout.strip() else None
    for key in [room,other]:cli('compare-assign-soundtrack',{'expected':read(key)['version'],'assignment':{'theme_id':theme,'room_id':key,'provider':'youtube','url':'https://music.youtube.com/watch?v=synthetic','label':'Synthetic'}})
    initial=read(room);untouched=read(other)
    def post(token,origin=None,body=None):
     raw=json.dumps(body if body is not None else {'theme_id':theme,'room_id':room}).encode();h=m.Handler.__new__(m.Handler);h.server=server;h.path='/__native/clear-soundtrack';h.headers=Message()
     for k,v in [('Host',server.host),('Origin',origin or server.origin),('X-Athena-Native','1'),('Content-Type','application/json'),('Content-Length',str(len(raw)))]:h.headers[k]=v
     if token is not None:h.headers['If-Match']=token
     h.rfile=io.BufferedReader(io.BytesIO(raw));h.connection=Mock();h.connection.gettimeout.return_value=5;h.reply=Mock();h.do_POST();return h.reply.call_args
    before=db.read_bytes()
    self.assertEqual(post(None).args[0],428);self.assertEqual(post(initial['version'],'http://invalid.example').args[0],403);self.assertEqual(post('stale').args[0],409);self.assertEqual(post(initial['version'],body={'theme_id':theme}).args[0],400);self.assertEqual(db.read_bytes(),before)
    result=post(initial['version']);self.assertEqual(result.args[0],200);self.assertEqual(json.loads(result.args[1]),None);self.assertEqual(read(other),untouched);self.assertIsNone(read(room)['value']);self.assertEqual(result.kwargs['etag'],read(room)['version'])
    before=db.read_bytes();self.assertEqual(post(initial['version']).args[0],409);self.assertEqual(post(read(room)['version']).args[0],200);self.assertEqual(db.read_bytes(),before)
if __name__=='__main__':unittest.main()
