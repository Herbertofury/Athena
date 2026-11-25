import hashlib,importlib.util,json,os,pathlib,sqlite3,subprocess,sys,tempfile,unittest
from contextlib import closing
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[3]
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
launch=module('backup_launcher',ROOT/'native/foundry/portable_launcher.py');pack=module('backup_packager',ROOT/'scripts/package_native.py')
BINARY=pathlib.Path(os.environ.get('ATHENA_FOUNDRY_STORE_BINARY',ROOT/'crates/athena-foundry-store/target/debug'/('athena-foundry-store.exe' if os.name=='nt' else 'athena-foundry-store')))
class BackupTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name);self.bundle=self.root/'app';self.db=self.root/'source.sqlite';self.out=self.root/'backup.sqlite'
  self.data=pack.package(ROOT/'dist',BINARY,hashlib.sha256(BINARY.read_bytes()).hexdigest(),self.bundle,'windows' if os.name=='nt' else 'linux')
  launch.create_database(self.bundle,self.data,self.db)
 def backup(self,quiescent=True):return launch.backup_database(self.bundle,self.data,self.db,self.out,quiescent)
 def fingerprints(self):return {s:hashlib.sha256(pathlib.Path(str(self.db)+s).read_bytes()).hexdigest() for s in ('','-wal','-shm','-journal') if pathlib.Path(str(self.db)+s).exists()}
 def test_real_populated_wal_full_snapshot_and_unchanged_source(self):
  payload=(ROOT/'crates/athena-foundry-store/tests/fixtures/js-workspace.json').read_bytes()
  subprocess.run([str(BINARY),'save-backup',str(self.db)],input=payload,capture_output=True,check=True)
  with closing(sqlite3.connect(self.db)) as source:
   source.execute('pragma journal_mode=WAL');source.execute('pragma wal_autocheckpoint=0')
   source.execute("INSERT INTO soundtracks(theme_id,room_id,provider,url,label,status,updated_at) VALUES(?,?,?,?,?,?,?)",('frutiger-aero','frutiger-aero:room:aqua-atrium','youtube','https://music.youtube.com/watch?v=synthetic','PRIVATE SYNTHETIC','ready',1));source.commit()
   expected=list(source.iterdump());before=self.fingerprints();self.assertIn('-wal',before)
   if sqlite3.sqlite_version_info < (3,54,0):
    with self.assertRaises(subprocess.CalledProcessError):self.backup()
    self.assertEqual(before,self.fingerprints());self.assertFalse(self.out.exists());return
   receipt=self.backup();self.assertTrue(receipt['source_wal_present']);self.assertEqual(before,self.fingerprints())
   with closing(sqlite3.connect(self.out)) as backup:self.assertEqual(expected,list(backup.iterdump()))
   self.assertEqual(self.out.read_bytes()[18:20],b'\x01\x01');self.assertFalse(receipt['restored'])
 def test_cli_and_existing_destination_no_overwrite(self):
  args=[sys.executable,'-B',str(self.bundle/'launch.py'),'--backup-database',str(self.db),'--backup-destination',str(self.out),'--source-quiescent']
  result=subprocess.run(args,capture_output=True,text=True);self.assertEqual(result.returncode,0,result.stderr);self.assertTrue(json.loads(result.stdout)['backed_up']);before=self.out.read_bytes()
  self.assertEqual(subprocess.run(args,capture_output=True).returncode,2);self.assertEqual(before,self.out.read_bytes())
 def test_quiescence_corrupt_input_and_source_alias_refused(self):
  before=self.db.read_bytes()
  with self.assertRaises(ValueError):self.backup(False)
  self.out=self.db
  with self.assertRaises(ValueError):self.backup()
  self.assertEqual(self.db.read_bytes(),before);self.out=self.root/'backup.sqlite';self.db.write_bytes(b'bad')
  with self.assertRaises(subprocess.CalledProcessError):self.backup()
  self.assertFalse(self.out.exists());self.assertEqual(list(self.root.glob('.athena-backup-*')),[])
 def test_timeout_cleanup_preserves_source(self):
  before=self.fingerprints()
  with patch.object(launch.subprocess,'run',side_effect=subprocess.TimeoutExpired('synthetic',30)):
   with self.assertRaises(subprocess.TimeoutExpired):self.backup()
  self.assertEqual(before,self.fingerprints());self.assertFalse(self.out.exists());self.assertEqual(list(self.root.glob('.athena-backup-*')),[])
 def test_racing_destination_preserved(self):
  operation='rename' if os.name=='nt' else 'link';actual=getattr(os,operation)
  def race(src,dst):self.out.write_bytes(b'OTHER');return actual(src,dst)
  with patch.object(launch.os,operation,side_effect=race):
   with self.assertRaises(FileExistsError):self.backup()
  self.assertEqual(self.out.read_bytes(),b'OTHER');self.assertEqual(list(self.root.glob('.athena-backup-*')),[])
 @unittest.skipUnless(os.name=='nt','Windows publication behavior')
 def test_windows_backup_and_upgrade_copy_need_no_hardlinks(self):
  before=self.fingerprints()
  with patch.object(launch.os,'link',side_effect=AssertionError('hard link attempted')):
   for upgrade in (False,True):
    self.out=self.root/('upgraded.sqlite' if upgrade else 'ordinary.sqlite')
    receipt=launch.backup_database(self.bundle,self.data,self.db,self.out,True,upgrade=upgrade)
    self.assertEqual(receipt['upgraded_copy'],upgrade)
    self.assertEqual(receipt['sha256'],hashlib.sha256(self.out.read_bytes()).hexdigest())
  self.assertEqual(self.fingerprints(),before)
if __name__=='__main__':unittest.main()
