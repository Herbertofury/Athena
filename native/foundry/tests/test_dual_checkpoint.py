"""Two disposable SQLite stores; only native status is stubbed in unit tests."""
import hashlib,importlib.util,json,pathlib,sqlite3,subprocess,tempfile,unittest,os
from contextlib import closing
from unittest import mock
ROOT=pathlib.Path(__file__).resolve().parents[3]
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
launch=load('dual_launcher',ROOT/'native/foundry/portable_launcher.py');pack=load('dual_packager',ROOT/'scripts/package_native.py')
class DualCheckpoint(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name);binary=self.root/'synthetic';binary.write_bytes(b'NEVER EXECUTED')
  self.package=self.root/'package';self.data=pack.package(ROOT/'dist',binary,hashlib.sha256(binary.read_bytes()).hexdigest(),self.package,'linux',engine=binary,engine_sha=hashlib.sha256(binary.read_bytes()).hexdigest())
  self.sources=[self.root/'foundry.sqlite',self.root/'engineering.sqlite'];self.dest=self.root/'checkpoint'
  for index,path in enumerate(self.sources):
   with closing(sqlite3.connect(path)) as db:db.execute('create table marker(value text)');db.execute('insert into marker values (?)',(str(index),));db.commit()
  self.before=[path.read_bytes() for path in self.sources];self.real_run=subprocess.run
 def run_child(self,*args,**kwargs):
  if len(args[0])>1 and args[0][1]=='status':return subprocess.CompletedProcess(args[0],0,b'{"schema":15,"integrity":"ok"}',b'')
  return self.real_run(*args,**kwargs)
 def checkpoint(self):
  with mock.patch.object(launch.subprocess,'run',self.run_child):return launch.checkpoint_stores(self.package,self.data,*self.sources,self.dest,True)
 def test_complete_pair_no_source_mutation(self):
  result=self.checkpoint();self.assertTrue(result['complete']);self.assertFalse(result['atomic_live_snapshot']);self.assertEqual(json.loads((self.dest/'checkpoint.json').read_text()),result)
  self.assertEqual([path.read_bytes() for path in self.sources],self.before)
  for index,name in enumerate(('foundry.sqlite3','engineering.sqlite3')):
   with closing(sqlite3.connect(self.dest/name)) as db:self.assertEqual(db.execute('select value from marker').fetchall(),[(str(index),)])
  self.assertNotIn(str(self.root),json.dumps(result))
 def test_existing_destination_and_missing_assertion(self):
  with self.assertRaises(ValueError):launch.checkpoint_stores(self.package,self.data,*self.sources,self.dest)
  self.dest.mkdir();(self.dest/'sentinel').write_bytes(b'keep')
  with self.assertRaises(ValueError):self.checkpoint()
  self.assertEqual((self.dest/'sentinel').read_bytes(),b'keep')
 def test_alias_stores_refused(self):
  self.sources[1].unlink();os.link(self.sources[0],self.sources[1])
  with self.assertRaises(ValueError):self.checkpoint()
  self.assertFalse(self.dest.exists());self.assertEqual(self.sources[0].read_bytes(),self.before[0])
 def test_destination_source_sidecar_collision_refused(self):
  for source in self.sources:
   for suffix in ('-wal','-shm','-journal'):
    self.dest=pathlib.Path(str(source)+suffix)
    with self.subTest(source=source.name,suffix=suffix),self.assertRaises(ValueError):self.checkpoint()
    self.assertFalse(self.dest.exists());self.assertEqual([p.read_bytes() for p in self.sources],self.before)
 def test_cross_capture_mutation_refused(self):
  original=self.run_child
  def changed(args,**kwargs):
   result=original(args,**kwargs)
   if '--source' in args and args[args.index('--source')+1]==str(self.sources[1]):
    with closing(sqlite3.connect(self.sources[0])) as db:db.execute("insert into marker values ('later')");db.commit()
   return result
  self.run_child=changed
  with self.assertRaises(ValueError):self.checkpoint()
  self.assertFalse(self.dest.exists())
 def test_failure_retains_incomplete_directory_without_marker(self):
  operation='rename' if os.name=='nt' else 'link';original=getattr(os,operation);calls=[]
  def fail(source,destination):
   calls.append(destination)
   if len(calls)==2:raise OSError('synthetic publication failure')
   return original(source,destination)
  with mock.patch.object(launch.os,operation,fail),self.assertRaises(OSError):self.checkpoint()
  self.assertTrue((self.dest/'foundry.sqlite3').exists());self.assertFalse((self.dest/'checkpoint.json').exists());self.assertEqual([p.read_bytes() for p in self.sources],self.before)
 def test_racing_checkpoint_member_is_preserved_and_marker_not_published(self):
  operation='rename' if os.name=='nt' else 'link';actual=getattr(os,operation)
  publications=[]
  def race(src,dst):
   publications.append(dst.name)
   if dst.name=='engineering.sqlite3':dst.write_bytes(b'OTHER WRITER')
   return actual(src,dst)
  with mock.patch.object(launch.os,operation,side_effect=race),self.assertRaises(FileExistsError):
   self.checkpoint()
  self.assertEqual(publications,['foundry.sqlite3','engineering.sqlite3'])
  self.assertEqual((self.dest/'engineering.sqlite3').read_bytes(),b'OTHER WRITER')
  self.assertFalse((self.dest/'checkpoint.json').exists())
  with self.assertRaisesRegex(ValueError,'Incomplete checkpoint'):launch.verify_checkpoint(self.dest)
  self.assertEqual([p.read_bytes() for p in self.sources],self.before)
 @unittest.skipUnless(os.name=='nt','Windows publication behavior')
 def test_windows_checkpoint_and_fork_need_no_hardlinks(self):
  with mock.patch.object(launch.os,'link',side_effect=AssertionError('hard link attempted')):
   receipt=self.checkpoint()
   snapshot_before={p.name:p.read_bytes() for p in self.dest.iterdir()}
   target=self.root/'working'
   with mock.patch.object(launch.subprocess,'run',self.run_child):
    fork=launch.fork_checkpoint(self.package,self.data,self.dest,target,True)
  self.assertEqual(launch.verify_checkpoint(self.dest)[0],receipt)
  self.assertEqual(launch.verify_checkpoint(target)[0],fork)
  self.assertEqual({p.name:p.read_bytes() for p in self.dest.iterdir()},snapshot_before)
  self.assertEqual([p.read_bytes() for p in self.sources],self.before)
 def test_old_python_wal_gate_unchanged(self):
  if sqlite3.sqlite_version_info>=(3,54,0):self.skipTest('Runtime patched; production WAL test covers forced older gate')
  pathlib.Path(str(self.sources[1])+'-wal').write_bytes(b'captured WAL fixture')
  with self.assertRaises(subprocess.CalledProcessError):self.checkpoint()
  self.assertFalse(self.dest.exists());self.assertEqual([p.read_bytes() for p in self.sources],self.before)
if __name__=='__main__':unittest.main()
