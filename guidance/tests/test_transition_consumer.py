import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import transition_consumer as transition
import repository_governance as governance
import adoption_transaction
from audit_consumers import expected_paths, LEGACY
from test_consumer_audit import snapshot

class ReviewedTransitionTests(unittest.TestCase):
 def commit(self,path):
  subprocess.run(['git','-C',str(path),'add','.'],check=True)
  subprocess.run(['git','-C',str(path),'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture'],check=True)
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);base=Path(self.tmp.name)
  self.source=base/'source';self.target=base/'target';self.source.mkdir();self.target.mkdir()
  manifest=governance.checked_release(ROOT)
  for name in [*governance.POLICY_FILES,'registry/repository-governance.json']:
   p=self.source/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes((ROOT/name).read_bytes())
  inv={'sourceCommit':'a'*40,'files':[{'path':p,'sha256':h} for p,h in manifest['files'].items()]}
  (self.source/'registry/agent-foundry-source-inventory.json').write_text(json.dumps(inv))
  files={}
  for old,name in expected_paths('.agents/foundry').items():
   p=self.target/old;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(governance.content(self.source/name));files[old]=governance.digest(p.read_bytes())
  p=self.target/'.agent-foundry/governance-lock.json';p.parent.mkdir();p.write_text(json.dumps({'schemaVersion':1,'sourceRepository':LEGACY,'sourceCommit':'a'*40,'version':'1.1.2','sourceWorkingTreeDirty':False,'files':files}))
  (self.target/'AGENTS.md').write_text('# Local protected\nRead .agents/foundry/AGENTS-adapter.md\n')
  (self.target/'CLAUDE.md').write_text('@AGENTS.md\n')
  p=self.target/'.agents/skills/local/SKILL.md';p.parent.mkdir(parents=True);p.write_text('local-only')
  for path in [self.source,self.target]:subprocess.run(['git','init','-q',str(path)],check=True);self.commit(path)
  self.router=(self.target/'AGENTS.md').read_bytes().replace(b'.agents/foundry/',b'.agents/athena/')
 def test_apply_preserves_legacy_local_skill_and_generic_guard(self):
  before=snapshot(self.target);r,_=transition.prepare(self.source,self.target,self.router)
  result=transition.apply(self.source,self.target,self.router,r['reviewSha256'])
  after=snapshot(self.target)
  for p,b in before.items():
   if p!='AGENTS.md':self.assertEqual(after[p],b)
  self.assertEqual(after['AGENTS.md'],self.router);self.assertFalse(result['retirementReady'])
  with self.assertRaises(ValueError):governance.plan(self.source,self.target)
  with self.assertRaises(ValueError):transition.apply(self.source,self.target,self.router,r['reviewSha256'])
 def test_wrong_digest_and_changed_router_do_not_write(self):
  r,_=transition.prepare(self.source,self.target,self.router);before=snapshot(self.target)
  for router,digest in [(self.router,'bad'),(self.router+b'changed',r['reviewSha256'])]:
   with self.assertRaises(ValueError):transition.apply(self.source,self.target,router,digest)
   self.assertEqual(snapshot(self.target),before)
 def test_dirty_source_or_target_and_existing_destination_refused(self):
  for path in [self.source/'untracked',self.target/'untracked']:
   path.write_text('preserve');before=snapshot(self.target)
   with self.assertRaises(ValueError):transition.prepare(self.source,self.target,self.router)
   self.assertEqual(snapshot(self.target),before);path.unlink()
  p=self.target/'.agents/athena/RUNTIME_PROOF.md';p.parent.mkdir();p.write_text('unmanaged');self.commit(self.target)
  with self.assertRaises(ValueError):transition.prepare(self.source,self.target,self.router)
  self.assertEqual(p.read_text(),'unmanaged')
 def test_changed_legacy_pin_refused_even_if_committed(self):
  (self.target/'.agents/foundry/RUNTIME_PROOF.md').write_text('local edit');self.commit(self.target)
  with self.assertRaises(ValueError):transition.prepare(self.source,self.target,self.router)
 def test_failure_rolls_back_written_snapshots_and_router(self):
  r,_=transition.prepare(self.source,self.target,self.router);before=snapshot(self.target);replace=adoption_transaction.os.replace
  def fail(src,dst):
   if str(dst).endswith('governance-lock.json') and '.athena' in str(dst):raise OSError('injected final lock failure')
   return replace(src,dst)
  with patch.object(adoption_transaction.os,'replace',side_effect=fail):
   with self.assertRaises(OSError):transition.apply(self.source,self.target,self.router,r['reviewSha256'])
  self.assertEqual(snapshot(self.target),before)
  self.assertFalse(list(self.target.glob('.athena-adoption-*')))
 def test_linked_destination_refused(self):
  p=self.target/'.agents/athena'
  try:p.symlink_to(self.source,target_is_directory=True)
  except OSError:self.skipTest('symlinks unavailable')
  self.commit(self.target)
  with self.assertRaises(ValueError):transition.prepare(self.source,self.target,self.router)
if __name__=='__main__':unittest.main()
