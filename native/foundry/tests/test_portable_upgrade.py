"""Synthetic native schema checkpoints, not historical release qualification."""
import test_portable_backup as base
from test_portable_backup import launch,BINARY,ROOT
import hashlib,json,pathlib,sqlite3,subprocess,sys
from unittest.mock import patch
import unittest
from contextlib import closing
class UpgradeTests(base.BackupTests):
 def backup(self,quiescent=True):return launch.backup_database(self.bundle,self.data,self.db,self.out,quiescent,upgrade=True)
 def upgrade(self):return launch.backup_database(self.bundle,self.data,self.db,self.out,True,upgrade=True)
 def test_every_supported_schema_preserves_workspace_and_original(self):
  self.db.unlink();subprocess.run([str(BINARY),'init',str(self.db)],check=True,capture_output=True)
  payload=(ROOT/'crates/athena-foundry-store/tests/fixtures/js-workspace.json').read_bytes()
  subprocess.run([str(BINARY),'save-backup',str(self.db)],input=payload,check=True,capture_output=True)
  upgrades=('history','soundtracks','transforms','scopes','environment','targets','instances','appearance','filters','origins','environments','blend-modes','music-precision')
  for schema in range(2,16):
   with self.subTest(schema=schema):
    before=self.fingerprints();r=self.upgrade();self.assertEqual(r['source_schema'],schema);self.assertEqual(r['schema'],15);self.assertTrue(r['upgraded_copy']);self.assertEqual(before,self.fingerprints())
    old=json.loads(subprocess.check_output([str(BINARY),'load-backup',str(self.db)]));new=json.loads(subprocess.check_output([str(BINARY),'load-backup',str(self.out)]))
    self.assertEqual(old,new);self.assertEqual(hashlib.sha256(self.out.read_bytes()).hexdigest(),r['sha256']);launch.verify(self.bundle);self.out.unlink()
   if schema<15:subprocess.run([str(BINARY),'upgrade-'+upgrades[schema-2],str(self.db)],check=True,capture_output=True)
 def test_upgrade_failure_and_source_change_never_publish(self):
  real=launch.subprocess.run;before=self.fingerprints()
  def fail(args,**kw):
   if args[1]=='status' and hasattr(fail,'seen'):raise subprocess.TimeoutExpired('synthetic',15)
   if args[1]=='status':fail.seen=True
   return real(args,**kw)
  with patch.object(launch.subprocess,'run',side_effect=fail):
   with self.assertRaises(subprocess.TimeoutExpired):self.upgrade()
  self.assertEqual(before,self.fingerprints());self.assertFalse(self.out.exists());self.assertEqual(list(self.root.glob('.athena-backup-*')),[])
  def mutate(args,**kw):
   result=real(args,**kw)
   if args[1]=='status' and hasattr(mutate,'seen'):
    with closing(sqlite3.connect(self.db)) as db,db:db.execute('pragma user_version=14')
   if args[1]=='status':mutate.seen=True
   return result
  with patch.object(launch.subprocess,'run',side_effect=mutate):
   with self.assertRaisesRegex(ValueError,'Source changed'):self.upgrade()
  self.assertFalse(self.out.exists())
 def test_upgrade_cli_explicit_new_copy(self):
  before=self.fingerprints();args=[sys.executable,'-B',str(self.bundle/'launch.py'),'--upgrade-copy',str(self.db),'--backup-destination',str(self.out),'--source-quiescent']
  r=subprocess.run(args,capture_output=True,text=True);self.assertEqual(r.returncode,0,r.stderr);self.assertTrue(json.loads(r.stdout)['upgraded_copy']);self.assertEqual(before,self.fingerprints())
  self.assertEqual(subprocess.run(args,capture_output=True).returncode,2)
if __name__=='__main__':unittest.main()
