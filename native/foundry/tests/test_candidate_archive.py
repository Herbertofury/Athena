import hashlib,importlib.util,json,pathlib,tempfile,unittest,zipfile
ROOT=pathlib.Path(__file__).resolve().parents[3]
spec=importlib.util.spec_from_file_location('candidate_archive',ROOT/'scripts/package_candidate.py');c=importlib.util.module_from_spec(spec);spec.loader.exec_module(c)
class CandidateArchive(unittest.TestCase):
 def setUp(self):
  self.tmp=tempfile.TemporaryDirectory();self.addCleanup(self.tmp.cleanup);self.root=pathlib.Path(self.tmp.name)
  self.binary=self.root/'binary';self.binary.write_bytes(b'SYNTHETIC NEVER EXECUTED')
  dep=self.root/'dep';dep.mkdir();(dep/'LICENSE').write_text('Synthetic license fixture, not legal advice.');(dep/'Cargo.toml').write_text('')
  self.metadata=self.root/'metadata.json';self.metadata.write_text(json.dumps({'packages':[{'name':'fixture','version':'1.0.0','source':'registry+https://github.com/rust-lang/crates.io-index','license':'MIT','manifest_path':str(dep/'Cargo.toml')}]}))
 def build(self,name):return c.build(self.binary,self.binary,'linux',[self.metadata],self.root/name,'0'*40)
 def test_reproducible_complete_archive_and_integrity(self):
  one=self.build('one');two=self.build('two');self.assertEqual(one['archive_sha256'],two['archive_sha256'])
  out=self.root/'extracted';receipt=c.extract(self.root/'one'/one['archive'],out,one['archive_sha256'])
  self.assertEqual(receipt['profile'],'unified');self.assertTrue((out/'DEPENDENCIES.json').is_file());self.assertFalse(list(out.rglob('*.sqlite')))
  self.assertEqual(c.launch.verify(out),receipt)
 def test_existing_dest_and_wrong_hash_refused(self):
  result=self.build('one');out=self.root/'existing';out.mkdir();sentinel=out/'keep';sentinel.write_bytes(b'keep')
  self.assertRaises(FileExistsError,c.extract,self.root/'one'/result['archive'],out,result['archive_sha256']);self.assertEqual(sentinel.read_bytes(),b'keep')
  self.assertRaises(ValueError,c.extract,self.root/'one'/result['archive'],self.root/'bad','0'*64);self.assertFalse((self.root/'bad').exists())
 def test_unsafe_names_fail_before_extraction(self):
  for n,name in enumerate(('../escape','C:stream','C:/escape','//host/share','a\\b','CON','a./file','nul.txt','COM¹','CONOUT$','file?','safe\x00evil')):
   archive=self.root/f'bad{n}.zip'
   with zipfile.ZipFile(archive,'w') as z:
    info=zipfile.ZipInfo('placeholder');info.filename=name;info.orig_filename=name;info.external_attr=0o100600<<16;z.writestr(info,b'x')
   self.assertRaises(ValueError,c.extract,archive,self.root/f'out{n}',c.sha(archive));self.assertFalse((self.root/f'out{n}').exists())
 def test_unreviewed_license_and_missing_notices_refuse(self):
  data=json.loads(self.metadata.read_text());data['packages'][0]['license']='GPL-3.0';self.metadata.write_text(json.dumps(data))
  self.assertRaises(ValueError,self.build,'badlicense')
  data['packages'][0]['license']='MIT';self.metadata.write_text(json.dumps(data));(self.root/'dep'/'LICENSE').unlink()
  self.assertRaises(ValueError,self.build,'missing')
 def test_gzip_checksum_license_is_scoped_to_reviewed_version(self):
  upstream='0BSD OR MIT OR Apache-2.0'
  self.assertEqual(c.dependency_license('adler2','2.0.1',upstream),upstream)
  for name,version in (('adler2','2.0.2'),('other','2.0.1')):
   self.assertRaises(ValueError,c.dependency_license,name,version,upstream)
 def test_malformed_license_expression_refused(self):
  for value in ('MIT AND','AND MIT','MIT Apache-2.0','(MIT','MIT OR OR ISC'):
   self.assertRaises(ValueError,c.license_expression,value)
 def test_destination_symlink_refused_before_write(self):
  result=self.build('one');actual=self.root/'actual';actual.mkdir();link=self.root/'link'
  try:link.symlink_to(actual,target_is_directory=True)
  except OSError as e:self.skipTest(str(e))
  self.assertRaises(ValueError,c.extract,self.root/'one'/result['archive'],link/'new',result['archive_sha256']);self.assertFalse((actual/'new').exists())
 def test_compressed_input_and_directory_count_bounds(self):
  huge=self.root/'sparse.zip'
  with huge.open('wb') as f:f.truncate(256*1024*1024+1)
  self.assertRaises(ValueError,c.extract,huge,self.root/'huge-out','0'*64);self.assertFalse((self.root/'huge-out').exists())
  archive=self.root/'count.zip'
  with zipfile.ZipFile(archive,'w') as z:
   info=zipfile.ZipInfo('a');info.external_attr=0o100600<<16;z.writestr(info,b'a')
  data=bytearray(archive.read_bytes());at=data.rfind(b'PK\x05\x06');data[at+8:at+12]=(3000).to_bytes(2,'little')*2;archive.write_bytes(data)
  self.assertRaises(ValueError,c.extract,archive,self.root/'count-out',c.sha(archive));self.assertFalse((self.root/'count-out').exists())
 def test_inventory_excludes_private_manifest_path(self):
  result=self.build('one');out=self.root/'extracted';c.extract(self.root/'one'/result['archive'],out,result['archive_sha256'])
  self.assertNotIn(str(self.root),(out/'DEPENDENCIES.json').read_text())
if __name__=='__main__':unittest.main()
