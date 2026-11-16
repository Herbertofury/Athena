import json
from pathlib import Path
import sys,tempfile,unittest
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT/'tools'))
import skill_sync as sync

class SkillSyncTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name);self.source=self.root/'source'/'alpha';self.source.mkdir(parents=True);self.target=self.root/'client';self.target.mkdir()
  (self.source/'SKILL.md').write_text('---\nname: alpha\ndescription: Synthetic fixture, not instructions.\n---\nFixture\n',encoding='utf-8');(self.source/'data.txt').write_text('v1')
 def plan(self):return sync.prepare([self.source],self.target)[0]
 def install(self):return sync.apply([self.source],self.target,self.plan()['reviewSha256'])
 def test_install_update_removed_files_and_retained_backup(self):
  (self.source/'old.txt').write_text('old');before={p.name:p.read_bytes() for p in self.source.iterdir()};first=self.install();self.assertTrue(first['changed']);self.assertEqual(self.plan()['skills'][0]['action'],'noop')
  (self.source/'data.txt').write_text('v2');(self.source/'old.txt').unlink();result=self.install();recovery=Path(result['recoveryDirectory'])
  self.assertEqual((self.target/'alpha/data.txt').read_text(),'v2');self.assertFalse((self.target/'alpha/old.txt').exists());self.assertEqual((recovery/'old-alpha/old.txt').read_text(),'old')
  self.assertFalse(result['retirementReady']);self.assertEqual((self.source/'SKILL.md').read_bytes(),before['SKILL.md'])
 def test_unmanaged_and_locally_edited_never_overwritten(self):
  (self.target/'alpha').mkdir();(self.target/'alpha/keep').write_text('mine')
  with self.assertRaises(OSError):self.install()
  self.assertEqual((self.target/'alpha/keep').read_text(),'mine')
 def test_managed_local_edit_and_stale_review_refused(self):
  self.install();(self.target/'alpha/data.txt').write_text('mine')
  with self.assertRaises(ValueError):self.install()
  self.assertEqual((self.target/'alpha/data.txt').read_text(),'mine')
 def test_digest_source_change_and_wrong_digest_refused(self):
  digest=self.plan()['reviewSha256'];(self.source/'data.txt').write_text('v2')
  for expected in (digest,'bad'):
   with self.assertRaises(ValueError):sync.apply([self.source],self.target,expected)
  self.assertEqual(list(self.target.iterdir()),[])
 def test_failed_publication_restores_old_copy_and_retains_evidence(self):
  self.install();(self.source/'data.txt').write_text('v2');old=(self.target/'alpha'/sync.MARKER).read_bytes();rename=Path.rename
  def fail(path,dest):
   if path.name=='new-alpha':raise OSError('injected publication failure')
   return rename(path,dest)
  with patch.object(Path,'rename',fail):
   with self.assertRaises(OSError):self.install()
  self.assertEqual((self.target/'alpha/data.txt').read_text(),'v1');self.assertEqual((self.target/'alpha'/sync.MARKER).read_bytes(),old)
  receipts=[json.loads(p.read_text()) for p in self.target.glob('.athena-skill-recovery-*/receipt.json')];self.assertIn('rolled-back',[r['state'] for r in receipts])
 def test_pending_recovery_and_nested_source_refused(self):
  r=self.target/'.athena-skill-recovery-pending';r.mkdir();(r/'receipt.json').write_text('{"state":"preparing"}')
  with self.assertRaises(ValueError):self.plan()
  with self.assertRaises(ValueError):sync.prepare([self.source],self.source.parent)
 def test_source_link_refused(self):
  try:(self.source/'linked').symlink_to(self.source/'data.txt')
  except OSError:self.skipTest('symlink unavailable')
  with self.assertRaises(ValueError):self.plan()
 def test_duplicate_and_alias_refused(self):
  with self.assertRaises(ValueError):sync.prepare([self.source,self.source],self.target)
  (self.target/'ALPHA').mkdir()
  with self.assertRaises(ValueError):self.plan()
 def test_reserved_skill_root_name_refused(self):
  for name in ('con','aux','nul','com1','lpt1'):
   self.assertFalse(sync.portable(name))
  bad=self.source.parent/'con'
  try:bad.mkdir();(bad/'SKILL.md').write_text('---\nname: con\ndescription: fixture\n---\nFixture')
  except OSError:return # Windows itself refuses this fixture path.
  with self.assertRaises(ValueError):sync.prepare([bad],self.target)
if __name__=='__main__':unittest.main()
