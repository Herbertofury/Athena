"""Synthetic preserved-capsule -> reviewed native scene bundle CLI acceptance."""
import hashlib,importlib.util,json,pathlib,unittest
import test_verify_cli as fixtures
spec=importlib.util.spec_from_file_location('capsule_fixture',pathlib.Path(__file__).resolve().parents[1]/'capsule/capsule.py')
c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
class CapsuleCLI(unittest.TestCase):
 def setUp(self):
  self.f=fixtures.VerifyCLI();self.f.setUp();self.addCleanup(self.f.tearDown);self.path=self.f.root/'capsule.json';self.new=self.f.root/'from-capsule';self.raw=self.f.source.read_bytes();self.values={'ff-scrapbook-layout':self.raw.decode('utf8'),'ff-world-layout':'PRIVATE-UNRELATED','ff-visual-quality':'\ud800'};self.write(self.values)
 def write(self,values):self.path.write_text(json.dumps(c.pack(values)),encoding='ascii')
 def cli(self):return self.f.run_cli('--source',self.path,'--mapping',self.f.mapping,'--new-bundle',self.new,'--capsule')
 def test_valid_capsule_matches_raw_bundle_and_preserves_source(self):
  before=self.f.snapshot();r=self.cli();self.assertEqual(r.returncode,0,r.stderr)
  for name in ('source-original.utf8','mapping-private.json','athena-workspace.json','manifest.json'):self.assertEqual((self.new/name).read_bytes(),(self.f.bundle/name).read_bytes())
  for path,data in before.items():self.assertEqual((self.f.root/path).read_bytes(),data)
  report=self.f.run_cli('--verify-bundle',self.new);self.assertEqual(report.returncode,0,report.stderr);self.assertFalse(json.loads(report.stdout)['originalVisualFidelityVerified'])
  self.assertNotIn(b'PRIVATE-UNRELATED',b''.join(p.read_bytes() for p in self.new.iterdir()))
 def test_corrupt_unrelated_entry_refuses_without_bundle(self):
  data=json.loads(self.path.read_bytes());data['entries'][-1]['utf16_sha256']='0'*64;self.path.write_text(json.dumps(data));before=self.f.snapshot();self.assertNotEqual(self.cli().returncode,0);self.assertFalse(self.new.exists());self.assertEqual(self.f.snapshot(),before)
 def test_missing_or_unrepresentable_value_refuses(self):
  for values in ({'ff-world-layout':'private'},{'ff-scrapbook-layout':'\ud800'}):
   self.write(values);before=self.f.snapshot();self.assertNotEqual(self.cli().returncode,0);self.assertFalse(self.new.exists());self.assertEqual(self.f.snapshot(),before)
 def test_capsule_hash_not_substitute_for_selected_value_hash(self):
  m=json.loads(self.f.mapping.read_bytes());m['sourceSha256']=hashlib.sha256(self.path.read_bytes()).hexdigest();self.f.mapping.write_text(json.dumps(m));self.assertNotEqual(self.cli().returncode,0);self.assertFalse(self.new.exists())
 def test_manual_asset_review_still_required(self):
  m=json.loads(self.f.mapping.read_bytes());m['assetReview']='unreviewed';self.f.mapping.write_text(json.dumps(m));self.assertNotEqual(self.cli().returncode,0);self.assertFalse(self.new.exists())
 def test_existing_destination_and_wrong_mode_unchanged(self):
  self.new.mkdir();(self.new/'keep').write_bytes(b'keep');before=self.f.snapshot();self.assertNotEqual(self.cli().returncode,0);self.assertEqual(self.f.snapshot(),before)
  self.assertEqual(self.f.run_cli('--verify-bundle',self.f.bundle,'--capsule').returncode,2);self.assertEqual(self.f.snapshot(),before)
if __name__=='__main__':unittest.main()
