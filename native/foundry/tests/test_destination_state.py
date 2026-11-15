"""Publication boundary tests; synthetic SQLite plus mocked native status, no Rust acceptance claim."""
import importlib.util,json,os,pathlib,sqlite3,subprocess,sys,tempfile,unittest
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('destination_launcher',ROOT/'native/foundry/portable_launcher.py')
launch=importlib.util.module_from_spec(spec);spec.loader.exec_module(launch)
class DestinationTests(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name)
  self.bundle=self.root/'bundle';self.bundle.mkdir();self.source=self.root/'source.sqlite';self.output=self.root/'new.sqlite'
  with sqlite3.connect(self.source) as db:db.execute('CREATE TABLE evidence(value TEXT)');db.execute("INSERT INTO evidence VALUES('synthetic')")
  self.before=self.source.read_bytes();self.data={'binary':'unused-reviewed-native'}
  (self.bundle/'sqlite_backup.py').write_bytes((ROOT/'tools/foundry-recovery/sqlite/prepare.py').read_bytes())
 def invoke(self,mode):
  if mode=='create':return launch.create_database(self.bundle,self.data,self.output)
  return launch.backup_database(self.bundle,self.data,self.source,self.output,True,upgrade=mode=='upgrade')
 def test_initial_destination_family_refused_without_subprocess(self):
  for mode in ('create','backup','upgrade'):
   for suffix in ('-wal','-shm','-journal'):
    with self.subTest(mode=mode,suffix=suffix):
     self.output=self.root/(mode+suffix+'.sqlite');side=pathlib.Path(str(self.output)+suffix);side.write_bytes(b'preserve')
     with patch.object(launch.subprocess,'run') as run:self.assertRaises(FileExistsError,self.invoke,mode);run.assert_not_called()
     self.assertFalse(self.output.exists());self.assertEqual(side.read_bytes(),b'preserve')
  self.assertEqual(self.source.read_bytes(),self.before)
 def test_late_destination_family_refused_before_link(self):
  original=subprocess.run
  for mode in ('create','backup','upgrade'):
   for suffix in ('-wal','-shm','-journal'):
    with self.subTest(mode=mode,suffix=suffix):
     self.output=self.root/('late-'+mode+suffix+'.sqlite');side=pathlib.Path(str(self.output)+suffix)
     def run(args,**kwargs):
      if args[0]==sys.executable:return original(args,**kwargs)
      command=args[1];staged=pathlib.Path(args[2])
      if command=='init':staged.write_bytes(self.before)
      if command=='status':side.write_bytes(b'late state')
      return subprocess.CompletedProcess(args,0,json.dumps({'schema':15,'integrity':'ok'}).encode(),b'')
     with patch.object(launch.subprocess,'run',side_effect=run),patch.object(launch.os,'link') as link:
      self.assertRaises(FileExistsError,self.invoke,mode);link.assert_not_called()
     self.assertFalse(self.output.exists());self.assertEqual(side.read_bytes(),b'late state')
     self.assertEqual(self.source.read_bytes(),self.before)
  self.assertEqual(list(self.root.glob('.athena-*')),[])
 def test_dangling_sidecar_preserved(self):
  side=pathlib.Path(str(self.output)+'-shm')
  try:side.symlink_to(self.root/'missing')
  except OSError as error:self.skipTest('Symlink creation unavailable: '+str(error))
  for mode in ('create','backup','upgrade'):
   with self.subTest(mode=mode),patch.object(launch.subprocess,'run') as run:
    self.assertRaises(FileExistsError,self.invoke,mode);run.assert_not_called()
  self.assertTrue(side.is_symlink());self.assertFalse(self.output.exists())
if __name__=='__main__':unittest.main()
