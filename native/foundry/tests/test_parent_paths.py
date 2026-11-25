"""Parent-component boundary tests; no database files or native processes created."""
import contextlib,importlib.util,io,pathlib,stat,sys,types,unittest
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('parent_launcher',ROOT/'native/foundry/portable_launcher.py')
launch=importlib.util.module_from_spec(spec);spec.loader.exec_module(launch)

class ParentPathTests(unittest.TestCase):
 def setUp(self):
  self.base=pathlib.Path.cwd()
  self.root=self.base/'synthetic-package'
  self.bad=self.base/'synthetic-other'/'..'/'synthetic-package'/'db.sqlite'
  self.good=self.base/'synthetic-external'/'db.sqlite'
  self.data={'binary':'unused-native','platform':'windows' if sys.platform=='win32' else 'linux'}
 def guards(self):
  stack=contextlib.ExitStack()
  stack.enter_context(patch.object(pathlib.Path,'is_symlink',return_value=False))
  stack.enter_context(patch.object(pathlib.Path,'is_dir',return_value=True))
  stack.enter_context(patch.object(pathlib.Path,'is_file',return_value=True))
  stack.enter_context(patch.object(launch.os.path,'lexists',return_value=False))
  stack.enter_context(patch.object(launch.tempfile,'TemporaryDirectory',side_effect=AssertionError('unexpected staging')))
  stack.enter_context(patch.object(launch.subprocess,'run',side_effect=AssertionError('unexpected process')))
  for operation in ('link','rename'):
   stack.enter_context(patch.object(launch.os,operation,side_effect=AssertionError('unexpected publication')))
  return stack
 def test_create_rejects_parent_path_before_work(self):
  with self.guards(),self.assertRaisesRegex(ValueError,'Parent path'):
   launch.create_database(self.root,self.data,self.bad)
 def test_backup_and_upgrade_reject_both_path_roles(self):
  for upgrade in (False,True):
   for source,destination in ((self.bad,self.good),(self.good,self.bad)):
    with self.subTest(upgrade=upgrade,source=str(source)),self.guards(),self.assertRaisesRegex(ValueError,'Parent path'):
     launch.backup_database(self.root,self.data,source,destination,True,upgrade=upgrade)
 def test_launch_rejects_parent_path_before_bridge_load(self):
  with self.guards(),patch.object(launch,'__file__',str(self.root/'launch.py')),patch.object(launch,'verify',return_value=self.data),patch.object(sys,'argv',['launch.py','--database',str(self.bad)]),patch.object(launch.importlib.util,'spec_from_file_location',side_effect=AssertionError('unexpected bridge')),contextlib.redirect_stderr(io.StringIO()),self.assertRaises(SystemExit) as exit:
   launch.main()
  self.assertEqual(exit.exception.code,2)
 def test_direct_paths_preserve_absolute_behavior(self):
  for value in (self.good,pathlib.Path('external')/'db.sqlite',pathlib.Path('..db')/'db.sqlite'):
   with self.subTest(value=str(value)):
    self.assertEqual(launch.external_path(value),pathlib.Path(value).absolute())
 def test_direct_create_refuses_symlink_and_reparse_parents_before_staging(self):
  for mode,attributes in ((stat.S_IFLNK,0),(stat.S_IFDIR,0x400)):
   metadata=types.SimpleNamespace(st_mode=mode,st_file_attributes=attributes)
   with self.subTest(mode=mode,attributes=attributes),self.guards(),patch.object(pathlib.Path,'lstat',return_value=metadata),self.assertRaisesRegex(ValueError,'New external'):
    launch.create_database(self.root,self.data,self.good)

if __name__=='__main__':unittest.main()
