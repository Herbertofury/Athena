"""Synthetic manifest authority boundaries; no native fixture executable is run."""
import copy,os,subprocess,hashlib,importlib.util,json,pathlib,tempfile,unittest
from unittest import mock
ROOT=pathlib.Path(__file__).resolve().parents[3]
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module);return module
launch=load('inventory_launcher',ROOT/'native/foundry/portable_launcher.py')
pack=load('inventory_packager',ROOT/'scripts/package_native.py')
class ManifestInventory(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name);binary=self.root/'synthetic';binary.write_bytes(b'NEVER EXECUTED')
  self.package=self.root/'package';self.data=pack.package(ROOT/'dist',binary,hashlib.sha256(binary.read_bytes()).hexdigest(),self.package,'linux');self.manifest=self.package/'native-package.json'
 def refused_before_file_read(self,data):
  self.manifest.write_text(json.dumps(data),encoding='utf-8');original=pathlib.Path.open;reads=[]
  def guarded(path,*args,**kwargs):
   reads.append(path)
   if path!=self.manifest:raise AssertionError('Listed file read before inventory rejected')
   return original(path,*args,**kwargs)
  with mock.patch.object(pathlib.Path,'open',guarded),self.assertRaises(ValueError):launch.verify(self.package)
  self.assertEqual(reads,[self.manifest])
 def test_late_hostile_paths_refused_before_any_listed_reads(self):
  for name in ('../outside','C:/outside','C:stream','file:stream','a\\b','CON.txt','COM¹','CONOUT$','safe\x00evil','a./b','file ','a//b','native-package.json','NATIVE-PACKAGE.JSON'):
   with self.subTest(name=name):
    data=copy.deepcopy(self.data);data['files'].append({'path':name,'bytes':0,'sha256':'0'*64});self.refused_before_file_read(data)
 def test_case_alias_and_bad_typed_fields(self):
  for field,value in (('path',123),('bytes',True),('bytes',-1),('bytes',600*1024*1024+1),('sha256','z'*64),('sha256',None)):
   with self.subTest(field=field,value=value):
    data=copy.deepcopy(self.data);data['files'][-1][field]=value;self.refused_before_file_read(data)
  data=copy.deepcopy(self.data);row=copy.deepcopy(data['files'][0]);row['path']=row['path'].upper();data['files'].append(row);self.refused_before_file_read(data)
 def test_inventory_shape_and_bounds(self):
  for inventory in ({},[],[None],[self.data['files'][0]]*2001):
   data=copy.deepcopy(self.data);data['files']=inventory;self.refused_before_file_read(data)
  data=copy.deepcopy(self.data)
  for row in data['files']:row['bytes']=600*1024*1024
  self.refused_before_file_read(data)
 def test_schema_bool_refused(self):
  data=copy.deepcopy(self.data);data['schema']=True;self.refused_before_file_read(data)
 def test_traversal_budget_refuses_extra_directory_tree(self):
  for n in range(4001):(self.package/f'extra{n}').mkdir()
  with self.assertRaisesRegex(ValueError,'traversal bound'):launch.verify(self.package)
 def test_unlisted_directory_link_refused(self):
  outside=self.root/'outside';outside.mkdir();sentinel=outside/'keep';sentinel.write_bytes(b'keep');link=self.package/'linked'
  if os.name=='nt':
   result=subprocess.run(['cmd','/c','mklink','/J',str(link),str(outside)],capture_output=True)
   self.assertEqual(result.returncode,0,result.stderr)
   self.addCleanup(lambda:link.rmdir() if link.exists() else None)
  else:link.symlink_to(outside,target_is_directory=True)
  with self.assertRaises(ValueError):launch.verify(self.package)
  self.assertEqual(sentinel.read_bytes(),b'keep')
 def test_valid_package_round_trip_and_no_mutation(self):
  before={p.relative_to(self.package).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in self.package.rglob('*') if p.is_file()}
  self.assertEqual(launch.verify(self.package),self.data)
  after={p.relative_to(self.package).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in self.package.rglob('*') if p.is_file()};self.assertEqual(before,after)
if __name__=='__main__':unittest.main()
