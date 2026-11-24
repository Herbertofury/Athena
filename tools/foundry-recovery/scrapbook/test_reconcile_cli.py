"""Synthetic reconciliation failure states, actual native process, unchanged originals."""
import json, os, pathlib, subprocess, sys, unittest
import convert
import test_verify_cli
from test_native_parity_cli import ROOT, UPGRADES
class ReconcileTests(unittest.TestCase):
 def setUp(self):
  self.fixture=test_verify_cli.VerifyCLI();self.fixture.setUp();self.addCleanup(self.fixture.tearDown)
  f=self.fixture;self.root=f.root;self.catalog=ROOT/'dist/workspaces/foundry/catalog.json'
  theme=json.loads(self.catalog.read_bytes())['themes'][0]
  mapping=json.loads(f.mapping.read_bytes());mapping.update(themeId=theme['id'],roomId=theme['rooms'][0]['id'],assets={'source':theme['objects'][0]['id']})
  f.mapping.write_text(json.dumps(mapping));self.bundle=self.root/'actual-bundle'
  convert.write_bundle(f.source,f.mapping,self.bundle,self.catalog)
  self.expected=json.loads((self.bundle/'athena-workspace.json').read_bytes())
  self.binary=pathlib.Path(os.environ.get('ATHENA_FOUNDRY_STORE_BINARY',ROOT/'crates/athena-foundry-store/target/debug'/('athena-foundry-store.exe' if os.name=='nt' else 'athena-foundry-store')))
  self.assertTrue(self.binary.is_file());self.db=self.root/'native.sqlite'
  for cmd in ['init']+['upgrade-'+x for x in UPGRADES]:self.assertEqual(self.native(cmd).returncode,0)
 def native(self,cmd,payload=None):return subprocess.run([str(self.binary),cmd,str(self.db)],input=json.dumps(payload).encode() if payload else None,capture_output=True,timeout=20)
 def run_review(self,*extra):
  before={p:p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
  result=subprocess.run([sys.executable,str(pathlib.Path(convert.__file__).with_name('reconcile.py')),'--bundle',str(self.bundle),'--database',str(self.db),'--catalog',str(self.catalog),'--native-binary',str(self.binary),*extra],capture_output=True,timeout=25)
  self.assertEqual({p:p.read_bytes() for p in self.root.rglob('*') if p.is_file()},before)
  self.assertNotIn(str(self.root).encode(),result.stdout);self.assertEqual(result.stderr,b'')
  return result,json.loads(result.stdout)
 def test_empty_store_missing_then_exact_then_different(self):
  result,report=self.run_review('--source-quiescent');self.assertEqual(result.returncode,1);self.assertEqual(report['counts']['missing'],1)
  self.assertEqual(self.native('save-backup',self.expected).returncode,0)
  result,report=self.run_review('--source-quiescent');self.assertEqual(result.returncode,0);self.assertEqual(report['counts']['exact'],1)
  next(iter(self.expected['active']['placements'].values()))['opacity']=.25
  self.assertEqual(self.native('save-backup',self.expected).returncode,0)
  result,report=self.run_review('--source-quiescent');self.assertEqual(result.returncode,1);self.assertEqual(report['counts']['different'],1)
 def test_missing_quiescence_refused(self):self.assertEqual(self.run_review()[0].returncode,2)
 def test_tampered_bundle_refused(self):
  (self.bundle/'athena-workspace.json').write_text('{}');self.assertEqual(self.run_review('--source-quiescent')[0].returncode,2)
 def test_sidecar_refused(self):
  pathlib.Path(str(self.db)+'-wal').write_bytes(b'synthetic');self.assertEqual(self.run_review('--source-quiescent')[0].returncode,2)
 def test_corrupt_database_refused(self):
  data=bytearray(self.db.read_bytes());data[0]=0;self.db.write_bytes(data);self.assertEqual(self.run_review('--source-quiescent')[0].returncode,2)
if __name__=='__main__':unittest.main()
