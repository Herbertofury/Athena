import json
import shutil
import unittest
from unittest.mock import patch
import test_transition_consumer as fixtures
from test_consumer_audit import snapshot
import transition_consumer as transition
import update_transitioned_consumer as update
import repository_governance as governance
import adoption_transaction

class ReviewedUpdateTests(unittest.TestCase):
 setUp=fixtures.ReviewedTransitionTests.setUp
 commit=fixtures.ReviewedTransitionTests.commit
 def adopted(self):
  review,_=transition.prepare(self.source,self.target,self.router)
  transition.apply(self.source,self.target,self.router,review['reviewSha256']);self.commit(self.target)
  previous=self.source.parent/'previous';shutil.copytree(self.source,previous)
  p=self.source/'RUNTIME_PROOF.md';p.write_bytes(p.read_bytes()+b'\nSynthetic reviewed policy addition.\n')
  manifest=governance.release(self.source,'99.0.0')
  (self.source/governance.MANIFEST).write_text(json.dumps(manifest),encoding='utf-8');self.commit(self.source)
  return previous
 def test_update_preserves_all_nonmanaged_bytes_and_generic_guard(self):
  previous=self.adopted();before=snapshot(self.target);r,payloads=update.prepare(self.source,previous,self.target)
  result=update.apply(self.source,previous,self.target,r['reviewSha256']);after=snapshot(self.target)
  for path,data in before.items():
   if path not in payloads:self.assertEqual(data,after[path])
  self.assertEqual(after['AGENTS.md'],before['AGENTS.md']);self.assertFalse(result['retirementReady'])
  for path,data in payloads.items():self.assertEqual(after[path],data)
  with self.assertRaises(ValueError):governance.plan(self.source,self.target)
 def test_old_source_pin_and_committed_local_drift_refused(self):
  previous=self.adopted();before=snapshot(self.target)
  with self.assertRaises(ValueError):update.prepare(previous,self.source,self.target)
  self.assertEqual(before,snapshot(self.target))
  (self.target/'.agents/athena/RUNTIME_PROOF.md').write_text('preserve local edit');self.commit(self.target)
  with self.assertRaises(ValueError):update.prepare(self.source,previous,self.target)
 def test_wrong_digest_and_new_target_commit_refused(self):
  previous=self.adopted();r,_=update.prepare(self.source,previous,self.target);before=snapshot(self.target)
  with self.assertRaises(ValueError):update.apply(self.source,previous,self.target,'wrong')
  self.assertEqual(before,snapshot(self.target))
  (self.target/'local.txt').write_text('retain');self.commit(self.target);before=snapshot(self.target)
  with self.assertRaises(ValueError):update.apply(self.source,previous,self.target,r['reviewSha256'])
  self.assertEqual(before,snapshot(self.target))
 def test_update_lock_failure_rolls_back(self):
  previous=self.adopted();r,_=update.prepare(self.source,previous,self.target);before=snapshot(self.target);replace=adoption_transaction.os.replace
  def fail(src,dst):
   if str(dst).endswith('.athena/governance-lock.json') or str(dst).endswith('.athena\\governance-lock.json'):raise OSError('injected')
   return replace(src,dst)
  with patch.object(adoption_transaction.os,'replace',side_effect=fail):
   with self.assertRaises(OSError):update.apply(self.source,previous,self.target,r['reviewSha256'])
  self.assertEqual(before,snapshot(self.target));self.assertFalse(list(self.target.glob('.athena-adoption-*')))
 def test_dirty_and_legacy_drift_refused(self):
  previous=self.adopted()
  for root in (self.source,previous,self.target):
   p=root/'untracked';p.write_text('retain')
   with self.assertRaises(ValueError):update.prepare(self.source,previous,self.target)
   p.unlink()
  p=self.target/'.agents/foundry/RUNTIME_PROOF.md';p.write_text('preserve');self.commit(self.target)
  with self.assertRaises(ValueError):update.prepare(self.source,previous,self.target)
 def test_same_version_changed_policy_refused(self):
  previous=self.adopted()
  manifest=governance.release(self.source,governance.checked_release(previous)['version'])
  (self.source/governance.MANIFEST).write_text(json.dumps(manifest),encoding='utf-8');self.commit(self.source)
  with self.assertRaises(ValueError):update.prepare(self.source,previous,self.target)
 def test_linked_managed_snapshot_refused(self):
  previous=self.adopted();p=self.target/'.agents/athena/RUNTIME_PROOF.md';p.unlink()
  try:p.symlink_to(previous/'RUNTIME_PROOF.md')
  except OSError:self.skipTest('symlinks unavailable')
  self.commit(self.target)
  with self.assertRaises(ValueError):update.prepare(self.source,previous,self.target)
 def test_downgrade_and_unresolved_recovery_refused(self):
  previous=self.adopted();manifest=governance.release(self.source,'0.0.1')
  (self.source/governance.MANIFEST).write_text(json.dumps(manifest),encoding='utf-8');self.commit(self.source)
  with self.assertRaises(ValueError):update.prepare(self.source,previous,self.target)
  manifest=governance.release(self.source,'99.0.1')
  (self.source/governance.MANIFEST).write_text(json.dumps(manifest),encoding='utf-8');self.commit(self.source)
  recovery=self.target/'.athena-adoption-retained';recovery.mkdir();(recovery/'old').write_text('preserve recovery');self.commit(self.target)
  review,_=update.prepare(self.source,previous,self.target);before=snapshot(self.target)
  with self.assertRaises(ValueError):update.apply(self.source,previous,self.target,review['reviewSha256'])
  self.assertEqual(before,snapshot(self.target));self.assertEqual((recovery/'old').read_text(),'preserve recovery')
if __name__=='__main__':unittest.main()
