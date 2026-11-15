"""Synthetic all-room original conversion -> Rust SQLite -> actual bridge handler.
Transport is in-memory, not browser/socket acceptance. No provider requests.
"""
import hashlib,importlib.util,json,os,pathlib,subprocess,sys,tempfile,threading,unittest
from email.message import Message
from unittest.mock import Mock
from reconcile import reconcile
ROOT=pathlib.Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('music_parity_bridge',ROOT/'native/foundry/bridge.py')
bridge=importlib.util.module_from_spec(spec);spec.loader.exec_module(bridge)
UPGRADES=['history','soundtracks','transforms','scopes','environment','targets','instances','appearance','filters','origins','environments','blend-modes','music-precision']
PROVIDERS={'spotify':'https://open.spotify.com/track/synthetic','apple':'https://music.apple.com/us/album/synthetic','deezer':'https://www.deezer.com/track/synthetic','soundcloud':'https://soundcloud.com/synthetic/track','tidal':'https://listen.tidal.com/track/synthetic','youtube':'https://music.youtube.com/watch?v=synthetic'}
class ParityTests(unittest.TestCase):
 def test_every_catalog_room_survives_conversion_restart_and_bridge_read(self):
  binary=pathlib.Path(os.environ.get('ATHENA_FOUNDRY_STORE_BINARY',ROOT/'crates/athena-foundry-store/target/debug'/('athena-foundry-store.exe' if os.name=='nt' else 'athena-foundry-store')))
  self.assertTrue(binary.is_file(),'Build current native CLI before parity acceptance')
  catalog=json.loads((ROOT/'dist/workspaces/foundry/catalog.json').read_text(encoding='utf8'))
  source={'version':2,'route':'settings','mappings':{}};contexts={}
  for theme in catalog['themes']:
   for room in theme['rooms']:
    i=len(contexts);key=theme['id']+'::'+room['name'];provider=list(PROVIDERS)[i%len(PROVIDERS)]
    source['mappings'][key]={'provider':provider,'url':PROVIDERS[provider],'label':f'Synthetic Café 音楽 🦉 {i}','status':'USER_ASSIGNED','updatedAt':f'2023-01-01T00:00:00.{i*29%1000:03d}Z'}
    if i%2:source['mappings'][key]['sourceId']=f'local:synthetic-{i}'
    contexts[key]={'themeId':theme['id'],'roomId':room['id']}
  self.assertGreaterEqual(len(contexts),len(PROVIDERS))
  with tempfile.TemporaryDirectory() as tmp:
   t=pathlib.Path(tmp);src=t/'source.json';mapping=t/'mapping.json';output=t/'output.json';db=t/'new.sqlite'
   raw=json.dumps(source,ensure_ascii=False).encode('utf8');src.write_bytes(raw)
   mapping.write_text(json.dumps({'sourceSha256':hashlib.sha256(raw).hexdigest(),'contexts':contexts}),encoding='utf8');original=(src.read_bytes(),mapping.read_bytes())
   result=subprocess.run([sys.executable,str(ROOT/'tools/foundry-recovery/music/convert.py'),str(src),str(mapping),str(output)],capture_output=True)
   self.assertEqual(result.returncode,0,result.stderr)
   payload=json.loads(output.read_bytes());self.assertEqual(len(payload['rows']),len(contexts))
   def cli(command,payload=None):
    return subprocess.run([str(binary),command,str(db)],input=json.dumps(payload,ensure_ascii=False).encode('utf8') if payload else None,capture_output=True)
   for command in ['init']+['upgrade-'+x for x in UPGRADES]:self.assertEqual(cli(command).returncode,0)
   self.assertEqual(cli('import-music-json',payload).returncode,0)
   persisted=db.read_bytes();versions=[]
   report=reconcile(src,mapping,db,catalog,True)
   self.assertEqual(report['counts']['exact'],len(contexts));self.assertTrue(report['all_mapped_records_match']);self.assertFalse(report['migration_complete'])
   for restart in range(2):
    server=bridge.Bridge.__new__(bridge.Bridge);server.binary=str(binary);server.database=str(db);server.operation_lock=threading.RLock();server.schema=15;server.host='127.0.0.1:1';server.origin='http://'+server.host
    current=[]
    for row in payload['rows']:
     a=row['assignment'];h=bridge.Handler.__new__(bridge.Handler);h.server=server;h.path='/__native/soundtrack/'+a['theme_id']+'/'+a['room_id'];h.headers=Message();h.headers['Host']=server.host;h.headers['X-Athena-Native']='1';h.reply=Mock()
     h.do_GET();args=h.reply.call_args
     self.assertEqual(args.args[0],200);self.assertEqual(json.loads(args.args[1]),row)
     self.assertIsInstance(args.kwargs['etag'],str);current.append(args.kwargs['etag'])
    versions.append(current)
   self.assertEqual(versions[0],versions[1]);self.assertEqual(db.read_bytes(),persisted)
   self.assertNotEqual(cli('import-music-json',payload).returncode,0);self.assertEqual(db.read_bytes(),persisted)
   self.assertEqual((src.read_bytes(),mapping.read_bytes()),original)
if __name__=='__main__':unittest.main()
