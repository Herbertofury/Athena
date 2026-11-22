import json
import shutil
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
 def athena(self):
  from repository_governance import apply, MANIFEST, POLICY_FILES
  source=self.root/'source';source.mkdir();guidance=source/'guidance'
  for name in [*POLICY_FILES,MANIFEST]:
   path=guidance/name;path.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/name,path)
  subprocess.run(['git','init','-q',str(source)],check=True)
  audit.git(source,'add','.')
  audit.git(source,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','canonical fixture')
  apply(guidance,self.target)
  p=self.target/'.athena/governance-lock.json'
  return guidance,p
 def test_current_athena_pin_and_local_owned_rules_coexist(self):
  source,p=self.athena();claim=json.loads(p.read_text());self.assertFalse(claim['sourceWorkingTreeDirty'])
  before=snapshot(self.target);report=audit.audit(source,self.target,'test');row=report['locks'][1]
  self.assertEqual(row['state'],'athena-pin-matches')
  self.assertTrue(row['policyBytesMatch']);self.assertEqual(row['sourcePinStatus'],'verified-selected-revision')
  self.assertEqual(row['selectedSourceCommit'],claim['sourceCommit'])
  self.assertEqual(snapshot(self.target),before);self.assertIn('PRIVATE_FIXTURE_DO_NOT_EMIT',(self.target/'AGENTS.md').read_text())
  cmd=[sys.executable,str(ROOT/'tools/audit_consumers.py'),'--source',str(source),'--target',str(self.target)]
  cli=json.loads(subprocess.check_output(cmd))['consumers'][0]
  self.assertEqual(cli['locks'][1],row);self.assertEqual(snapshot(self.target),before)
 def test_same_bytes_with_historical_or_unavailable_pin_do_not_verify_current_pin(self):
  source,p=self.athena();claim=json.loads(p.read_text())
  # Create a second release with the same canonical policy bytes. The old
  # version is legitimate for its own commit, not for this selected checkout.
  from repository_governance import MANIFEST, release
  (source/MANIFEST).write_text(json.dumps(release(source,'2.1.0')),encoding='utf-8')
  audit.git(source,'add','.')
  audit.git(source,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-qm','later release with same policy')
  before=snapshot(self.target);row=audit.audit(source,self.target,'test')['locks'][1]
  self.assertEqual(row['state'],'athena-canonical-bytes-match')
  self.assertTrue(row['policyBytesMatch']);self.assertEqual(row['sourcePinStatus'],'different-revision')
  self.assertEqual(row['sourceCommit'],claim['sourceCommit']);self.assertNotEqual(row['selectedSourceCommit'],claim['sourceCommit'])
  self.assertEqual(row['version'],claim['version'])
  audit.git(source,'checkout','--detach',claim['sourceCommit'])
  historical=audit.audit(source,self.target,'test')['locks'][1]
  self.assertEqual(historical['state'],'athena-pin-matches');self.assertEqual(historical['sourcePinStatus'],'verified-selected-revision')
  self.assertEqual(snapshot(self.target),before)
  export=self.root/'source-export';shutil.copytree(source,export)
  row=audit.audit(export,self.target,'test')['locks'][1]
  self.assertEqual(row['state'],'athena-canonical-bytes-match')
  self.assertTrue(row['policyBytesMatch']);self.assertEqual(row['sourcePinStatus'],'selected-revision-unavailable')
  self.assertIsNone(row['selectedSourceCommit'])
 def test_exact_bytes_cannot_clear_wrong_release_or_digest_format(self):
  source,p=self.athena();claim=json.loads(p.read_text())
  for key,value in [('version','999.0.0'),('digestFormat','opaque-fixture-private-text')]:
   with self.subTest(key=key):
    p.write_text(json.dumps({**claim,key:value}));before=snapshot(self.target);report=audit.audit(source,self.target,'test');row=report['locks'][1]
    self.assertEqual(row['state'],'needs-review')
    self.assertTrue(row['policyBytesMatch']);self.assertEqual(row['sourcePinStatus'],'claim-metadata-mismatch')
    self.assertTrue(any(key in issue for issue in row['issues']))
    self.assertNotIn('opaque-fixture-private-text',json.dumps(report));self.assertEqual(snapshot(self.target),before)
 def test_matching_head_claim_does_not_authenticate_dirty_working_policy_bytes(self):
  from repository_governance import MANIFEST, POLICY_FILES, apply, release
  source,p=self.athena();claim=json.loads(p.read_text())
  policy=source/POLICY_FILES[0];policy.write_bytes(policy.read_bytes()+b'\nSynthetic uncommitted policy.\n')
  next_release=release(source,'99.0.0');(source/MANIFEST).write_text(json.dumps(next_release),encoding='utf-8')
  apply(source,self.target)
  altered=json.loads(p.read_text());altered['sourceWorkingTreeDirty']=False;p.write_text(json.dumps(altered))
  before=snapshot(self.target);row=audit.audit(source,self.target,'test')['locks'][1]
  self.assertEqual(row['sourceCommit'],claim['sourceCommit'])
  self.assertEqual(row['state'],'athena-canonical-bytes-match')
  self.assertTrue(row['policyBytesMatch']);self.assertEqual(row['sourcePinStatus'],'selected-source-drift')
  self.assertEqual(snapshot(self.target),before)
if __name__=='__main__':unittest.main()
