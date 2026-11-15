"""Real subprocess verification of synthetic bundles; no source app/user data."""
import hashlib,json,pathlib,subprocess,sys,tempfile,unittest
import convert
SCRIPT=pathlib.Path(__file__).with_name('convert.py')
class VerifyCLI(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.root=pathlib.Path(self.tmp.name)
  self.catalog=self.root/'catalog.json';self.catalog.write_text(json.dumps({'themes':[{'id':'test','rooms':[{'id':'room'}],'objects':[{'id':'object'}]}]}))
  row={'assetId':'source','scope':'ui','gravity':False,'gravityAfterPeel':False,'x':40,'y':40,'rotation':0,'scaleX':1,'scaleY':1,'opacity':1,'blendMode':'normal','locked':False,'zIndex':1,'skewX':0,'skewY':0,'brightness':1,'contrast':1,'saturation':1,'hue':0,'blur':0,'visible':True,'anchor':'mc','pinTargetId':None,'pinTargetKey':None,'pinX':.5,'pinY':.5}
  self.source=self.root/'source';raw=json.dumps([row]).encode();self.source.write_bytes(raw)
  frame={'left':0,'top':0,'width':100,'height':100};size={'width':10,'height':10}
  mapping={'sourceSha256':hashlib.sha256(raw).hexdigest(),'coordinatePolicy':'proportional-centers','assetReview':'manual-equivalence-confirmed','stackingReview':'independent-surfaces-reviewed','themeId':'test','roomId':'room','assets':{'source':'object'},'rows':[{'index':0,'sourceFrame':frame,'targetFrame':frame,'sourceSize':size,'targetSize':size,'anchor':None}]}
  self.mapping=self.root/'mapping';self.mapping.write_text(json.dumps(mapping));self.bundle=self.root/'bundle'
  convert.write_bundle(self.source,self.mapping,self.bundle,self.catalog)
 def tearDown(self):self.tmp.cleanup()
 def run_cli(self,*args):return subprocess.run([sys.executable,str(SCRIPT),'--catalog',str(self.catalog),*map(str,args)],capture_output=True,encoding='utf-8',timeout=15)
 def snapshot(self):return {str(p.relative_to(self.root)):p.read_bytes() for p in self.root.rglob('*') if p.is_file()}
 def test_verify_reports_limits_and_preserves_every_byte(self):
  before=self.snapshot();result=self.run_cli('--verify-bundle',self.bundle);self.assertEqual(result.returncode,0,result.stderr);report=json.loads(result.stdout);self.assertEqual(report['verifiedRows'],1);self.assertTrue(report['recomputed']);self.assertTrue(report['partialCompatibility']);self.assertFalse(report['originalVisualFidelityVerified']);self.assertEqual(self.snapshot(),before)
 def test_tampered_workspace_fails_without_repair_or_overwrite(self):
  (self.bundle/'athena-workspace.json').write_text('{}');before=self.snapshot();result=self.run_cli('--verify-bundle',self.bundle);self.assertNotEqual(result.returncode,0);self.assertIn('integrity',result.stderr);self.assertEqual(result.stdout,'');self.assertEqual(self.snapshot(),before)
 def test_incomplete_bundle_refused_read_only(self):
  (self.bundle/'manifest.json').unlink();before=self.snapshot();self.assertNotEqual(self.run_cli('--verify-bundle',self.bundle).returncode,0);self.assertEqual(self.snapshot(),before)
 def test_changed_catalog_refused_read_only(self):
  self.catalog.write_text('{}');before=self.snapshot();result=self.run_cli('--verify-bundle',self.bundle);self.assertNotEqual(result.returncode,0);self.assertIn('integrity',result.stderr);self.assertEqual(self.snapshot(),before)
 def test_modes_and_irrelevant_inputs_rejected(self):
  before=self.snapshot()
  for args in [[],['--new-bundle',self.root/'new'],['--verify-bundle',self.bundle,'--source',self.source],['--verify-bundle',self.bundle,'--mapping',self.mapping],['--verify-bundle',self.bundle,'--new-bundle',self.root/'new']]:
   with self.subTest(args=args):self.assertEqual(self.run_cli(*args).returncode,2);self.assertEqual(self.snapshot(),before)
 def test_existing_creation_command_remains_compatible(self):
  result=self.run_cli('--source',self.source,'--mapping',self.mapping,'--new-bundle',self.root/'new');self.assertEqual(result.returncode,0,result.stderr);self.assertEqual(json.loads(result.stdout)['convertedRows'],1)
if __name__=='__main__':unittest.main()
