import hashlib,json,os,sys,tempfile,unittest,zipfile
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'tools'))
import package_skill as tool
class Packaging(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=Path(self.tmp.name);self.source=self.root/'demo';self.source.mkdir();(self.source/'SKILL.md').write_bytes(b'---\nname: demo\ndescription: Synthetic only.\n---\nNo execution.\n');(self.source/'data.json').write_bytes(b'{"n":18446744073709551617}\n')
 def run_package(self,out='out'):return tool.package(self.source,self.root/out,'https://github.com/example/project','a'*40)
 def test_deterministic_exact_roundtrip_source_preserved(self):
  before={p.name:p.read_bytes() for p in self.source.iterdir()};a=self.run_package('one');b=self.run_package('two');self.assertEqual(a,b);blob=(self.root/'one/skill.zip').read_bytes();self.assertEqual(blob,(self.root/'two/skill.zip').read_bytes());self.assertEqual(hashlib.sha256(blob).hexdigest(),a['sha256'])
  with zipfile.ZipFile(self.root/'one/skill.zip') as z:
   self.assertEqual(z.namelist(),['demo/SKILL.md','demo/data.json'])
   for name,data in before.items():self.assertEqual(z.read('demo/'+name),data)
  self.assertEqual(before,{p.name:p.read_bytes() for p in self.source.iterdir()})
 def test_existing_and_nested_output_refused(self):
  (self.root/'out').mkdir();(self.root/'out/sentinel').write_bytes(b'keep')
  with self.assertRaises(ValueError):self.run_package()
  self.assertEqual((self.root/'out/sentinel').read_bytes(),b'keep')
  with self.assertRaises(ValueError):tool.package(self.source,self.source/'new','https://github.com/example/project','a'*40)
  self.assertFalse((self.source/'new').exists())
 def test_portable_names_and_metadata(self):
  for url,rev in [('file:///private','a'*40),('https://github.com/example/project','main')]:
   with self.assertRaises(ValueError):tool.package(self.source,self.root/'out',url,rev)
  (self.source/'CON.txt').write_bytes(b'bad')
  with self.assertRaises(ValueError):self.run_package()
  self.assertFalse((self.root/'out').exists())
 def test_changed_source_refused(self):
  original=tool.tree;calls=0
  def changing(p):
   nonlocal calls
   calls+=1
   if calls==2:(self.source/'data.json').write_bytes(b'changed')
   return original(p)
  with patch.object(tool,'tree',side_effect=changing):
   with self.assertRaises(ValueError):self.run_package()
  self.assertFalse((self.root/'out').exists())
 def test_symlink_refused(self):
  try:(self.source/'link').symlink_to(self.source/'data.json')
  except OSError:self.skipTest('symlink privilege unavailable')
  with self.assertRaises(ValueError):self.run_package()
  self.assertFalse((self.root/'out').exists())
 def test_partial_failure_retained_no_receipt(self):
  original=Path.open
  def failing(path,*args,**kwargs):
   if path.name=='release-receipt.json':raise OSError('synthetic receipt failure')
   return original(path,*args,**kwargs)
  with patch.object(Path,'open',failing):
   with self.assertRaises(OSError):self.run_package()
  self.assertTrue((self.root/'out/skill.zip').exists());self.assertFalse((self.root/'out/release-receipt.json').exists())
 def test_midstream_receipt_failure_is_not_complete(self):
  def broken(value,stream,**kwargs):stream.write('{"partial":');raise OSError('synthetic midstream failure')
  with patch.object(tool.json,'dump',side_effect=broken):
   with self.assertRaises(OSError):self.run_package()
  self.assertEqual((self.root/'out/release-receipt.json').read_text(),'{"partial":')
  with self.assertRaises(json.JSONDecodeError):json.loads((self.root/'out/release-receipt.json').read_text())
if __name__=='__main__':unittest.main()
