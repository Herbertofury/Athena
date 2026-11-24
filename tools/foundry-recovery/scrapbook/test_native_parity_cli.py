"""Synthetic conversion -> actual SQLite CLI -> bridge, not visual acceptance."""
import hashlib, importlib.util, json, os, pathlib, subprocess, sys, tempfile, threading, unittest
from email.message import Message
from unittest.mock import Mock
import convert
from reconcile import reconcile
ROOT = pathlib.Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location('scrapbook_parity_bridge', ROOT/'native/foundry/bridge.py')
bridge = importlib.util.module_from_spec(spec); spec.loader.exec_module(bridge)
UPGRADES = ['history','soundtracks','transforms','scopes','environment','targets','instances','appearance','filters','origins','environments','blend-modes','music-precision']

class NativeParity(unittest.TestCase):
 def test_all_catalog_rooms_persist_supported_authored_fields_after_restart(self):
  binary = pathlib.Path(os.environ.get('ATHENA_FOUNDRY_STORE_BINARY', ROOT/'crates/athena-foundry-store/target/debug'/('athena-foundry-store.exe' if os.name=='nt' else 'athena-foundry-store')))
  self.assertTrue(binary.is_file(), 'Build current native CLI before acceptance')
  catalog_path = ROOT/'dist/workspaces/foundry/catalog.json'
  catalog = json.loads(catalog_path.read_bytes())
  with tempfile.TemporaryDirectory() as tmp:
   root = pathlib.Path(tmp); db = root/'native.sqlite'
   def cli(command, payload=None):
    return subprocess.run([str(binary), command, str(db)], input=payload, capture_output=True, timeout=20)
   for command in ['init'] + ['upgrade-'+x for x in UPGRADES]:
    result = cli(command); self.assertEqual(result.returncode, 0, result.stderr)
   count = 0
   for theme in catalog['themes']:
    for room in theme['rooms']:
     with self.subTest(theme=theme['id'], room=room['id']):
      folder = root/str(count); folder.mkdir(); count += 1
      rows = []
      for i, scope in enumerate(['ui','sticker']):
       rows.append({'assetId':'synthetic-asset','scope':scope,'gravity':False,'gravityAfterPeel':False,'x':45,'y':45,'rotation':17,'scaleX':-1.2,'scaleY':.7,'opacity':.61,'blendMode':'multiply' if i else 'normal','locked':bool(i),'zIndex':10+i,'skewX':5,'skewY':-3,'brightness':.8,'contrast':1.3,'saturation':.6,'hue':-37,'blur':0,'visible':not bool(i),'anchor':'tl','pinTargetId':'synthetic-pin' if i else None,'pinTargetKey':'synthetic-scene' if i else None,'pinX':.5,'pinY':.5})
      raw = json.dumps(rows).encode(); source = folder/'source.json'; source.write_bytes(raw)
      frame = {'left':0,'top':0,'width':100,'height':100}; size = {'width':10,'height':10}
      mapping = {'sourceSha256':hashlib.sha256(raw).hexdigest(),'coordinatePolicy':'proportional-centers','assetReview':'manual-equivalence-confirmed','stackingReview':'independent-surfaces-reviewed','blendReview':'same-isolated-backdrop-reviewed','themeId':theme['id'],'roomId':room['id'],'assets':{'synthetic-asset':theme['objects'][0]['id']},'rows':[{'index':i,'sourceFrame':frame,'targetFrame':frame,'sourceSize':size,'targetSize':size,'anchor':{'sourceKey':'synthetic-scene','sourceId':'synthetic-pin','nativeKey':'scene'} if i else None} for i in range(2)]}
      mapping_path = folder/'mapping.json'; mapping_path.write_text(json.dumps(mapping), encoding='utf8')
      bundle = folder/'bundle'
      result = subprocess.run([sys.executable,str(pathlib.Path(convert.__file__)),'--source',str(source),'--mapping',str(mapping_path),'--new-bundle',str(bundle),'--catalog',str(catalog_path)],capture_output=True,timeout=20)
      self.assertEqual(result.returncode,0,result.stderr)
      expected = json.loads((bundle/'athena-workspace.json').read_bytes())
      preserved = {p:p.read_bytes() for p in folder.rglob('*') if p.is_file()}
      result = cli('save-backup', json.dumps(expected).encode()); self.assertEqual(result.returncode,0,result.stderr)
      persisted = db.read_bytes(); versions = []
      report = reconcile(bundle,db,catalog_path,binary,True)
      self.assertEqual(report['counts'],{'expected':2,'exact':2,'missing':0,'different':0})
      self.assertTrue(report['all_mapped_placements_match']); self.assertFalse(report['source_retirement_safe'])
      for restart in range(2):
       server = bridge.Bridge.__new__(bridge.Bridge); server.binary=str(binary); server.database=str(db); server.operation_lock=threading.RLock(); server.schema=15; server.host='127.0.0.1:1'; server.origin='http://'+server.host
       handler = bridge.Handler.__new__(bridge.Handler); handler.server=server; handler.path='/__native/backup'; handler.headers=Message(); handler.headers['Host']=server.host; handler.headers['X-Athena-Native']='1'; handler.reply=Mock()
       handler.do_GET(); response = handler.reply.call_args
       self.assertEqual(response.args[0],200); self.assertEqual(json.loads(response.args[1]),expected); versions.append(response.kwargs['etag'])
      self.assertEqual(versions[0],versions[1]); self.assertEqual(db.read_bytes(),persisted)
      self.assertEqual({p:p.read_bytes() for p in preserved},preserved)
      self.assertEqual(json.loads(cli('load-backup').stdout),expected)
      invalid = json.loads(json.dumps(expected))
      next(iter(invalid['active']['placements'].values()))['objectId'] = 'unmapped-object'
      rejected = cli('save-backup',json.dumps(invalid).encode())
      self.assertNotEqual(rejected.returncode,0); self.assertEqual(db.read_bytes(),persisted)
      self.assertEqual(json.loads(cli('load-backup').stdout),expected)
   self.assertEqual(count,sum(len(t['rooms']) for t in catalog['themes']))
   self.assertGreater(count,0)

if __name__ == '__main__': unittest.main()
