import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import audit_consumers as audit

def snapshot(root):return {str(p.relative_to(root)):p.read_bytes() for p in root.rglob('*') if p.is_file() and '.git' not in p.parts}
class ConsumerAuditTests(unittest.TestCase):
 def setUp(self):
  self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup);self.root=Path(self.temp.name);self.target=self.root/'consumer';self.target.mkdir()
  subprocess.run(['git','init','-q',str(self.target)],check=True)
  (self.target/'AGENTS.md').write_text('# Local\nKeep private local wording PRIVATE_FIXTURE_DO_NOT_EMIT.\nRead .agents/foundry/AGENTS-adapter.md\n')
  (self.target/'CLAUDE.md').write_text('@AGENTS.md\n');self.commit()
 def commit(self):
  subprocess.run(['git','-C',str(self.target),'add','.'],check=True)
  subprocess.run(['git','-C',str(self.target),'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','fixture'],check=True)
 def legacy(self):
  inventory=json.loads((ROOT/'registry/agent-foundry-source-inventory.json').read_text());known={x['path']:x['sha256'] for x in inventory['files']}
  files={path:known[source] for path,source in audit.expected_paths('.agents/foundry').items()}
  p=self.target/'.agent-foundry/governance-lock.json';p.parent.mkdir();p.write_text(json.dumps({'schemaVersion':1,'version':'1.1.2','sourceRepository':audit.LEGACY,'sourceCommit':inventory['sourceCommit'],'sourceWorkingTreeDirty':False,'files':files}));self.commit();return p
 def test_no_mutation_or_private_contents_and_no_false_retirement(self):
  before=snapshot(self.target);report=audit.audit(ROOT,self.target,'test')
  self.assertEqual(snapshot(self.target),before);self.assertNotIn('PRIVATE_FIXTURE_DO_NOT_EMIT',json.dumps(report));self.assertFalse(report['legacyRetirementReady']);self.assertTrue(report['remainingConsumerWork']);self.assertEqual(report['legacyReferences'][0]['path'],'AGENTS.md')
 def test_missing_and_locally_changed_snapshots_are_reported_without_overwrite(self):
  self.legacy();p=self.target/'.agents/foundry/RUNTIME_PROOF.md';p.parent.mkdir(parents=True);p.write_text('Local exception')
  before=snapshot(self.target);report=audit.audit(ROOT,self.target,'test');lock=report['locks'][0]
  self.assertEqual(lock['state'],'needs-review');self.assertEqual(len(lock['snapshots']),16);self.assertTrue(all(x['matchesPreservedCanonical'] for x in lock['snapshots']));self.assertEqual(snapshot(self.target),before)
 def test_foreign_lock_values_not_echoed(self):
  p=self.legacy();p.write_text(json.dumps({'schemaVersion':1,'sourceRepository':'https://private.example/PRIVATE_FIXTURE_DO_NOT_EMIT','files':{}}));report=audit.audit(ROOT,self.target,'test');self.assertEqual(report['locks'][0]['state'],'foreign-or-invalid');self.assertNotIn('PRIVATE_FIXTURE_DO_NOT_EMIT',json.dumps(report))
 def test_linked_tracked_file_is_refused(self):
  other=self.root/'outside.md';other.write_text('DO_NOT_READ');p=self.target/'linked.md'
  try:p.symlink_to(other)
  except OSError:self.skipTest('symlinks unavailable')
  self.commit()
  with self.assertRaisesRegex(ValueError,'linked destination'):audit.audit(ROOT,self.target,'test')
 def test_generated_cache_and_environment_files_are_not_read_as_dependencies(self):
  (self.target/'.env').write_text('PRIVATE_FIXTURE_DO_NOT_EMIT');(self.target/'asset.bin').write_bytes(b'\x00\xff');self.commit();report=audit.audit(ROOT,self.target,'test');self.assertIn('.env',report['uninspectedPaths']);self.assertIn('asset.bin',report['uninspectedPaths']);self.assertNotIn('PRIVATE_FIXTURE_DO_NOT_EMIT',json.dumps(report))
 def test_current_athena_pin_and_local_owned_rules_coexist(self):
  from repository_governance import apply
  apply(ROOT,self.target);p=self.target/'.athena/governance-lock.json';lock=json.loads(p.read_text());lock['sourceWorkingTreeDirty']=False;p.write_text(json.dumps(lock));before=snapshot(self.target);report=audit.audit(ROOT,self.target,'test');self.assertEqual(report['locks'][1]['state'],'athena-pin-matches')
  self.assertEqual(snapshot(self.target),before);self.assertIn('PRIVATE_FIXTURE_DO_NOT_EMIT',(self.target/'AGENTS.md').read_text())
if __name__=='__main__':unittest.main()
