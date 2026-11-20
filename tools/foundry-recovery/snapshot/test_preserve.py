import hashlib,json,os,pathlib,subprocess,sys,tempfile,unittest
from unittest.mock import patch
import preserve as p
class SnapshotRecovery(unittest.TestCase):
 def test_exact_bytes_including_malformed_and_empty(self):
  with tempfile.TemporaryDirectory() as d:
   root=pathlib.Path(d)
   for i,raw in enumerate([b'{ "private": "SYNTHETIC" }\r\n',b'broken\xff\x00',b'']):
    src=root/f'source{i}';dst=root/f'copy{i}';src.write_bytes(raw);result=p.preserve(src,dst,True)
    self.assertEqual(src.read_bytes(),raw);self.assertEqual(dst.read_bytes(),raw);self.assertEqual(result['sha256'],hashlib.sha256(raw).hexdigest());self.assertFalse(result['native_import']);self.assertFalse(result['snapshot_semantics_verified'])
    if os.name=='posix':self.assertEqual(dst.stat().st_mode&0o777,0o600)
 def test_no_overwrite_or_source_alias_or_missing_quiescence(self):
  with tempfile.TemporaryDirectory() as d:
   src=pathlib.Path(d)/'source';dst=pathlib.Path(d)/'dest';src.write_bytes(b'original');dst.write_bytes(b'last-good')
   with self.assertRaises(ValueError):p.preserve(src,dst)
   with self.assertRaises(ValueError):p.preserve(src,src,True)
   with self.assertRaises(FileExistsError):p.preserve(src,dst,True)
   self.assertEqual(src.read_bytes(),b'original');self.assertEqual(dst.read_bytes(),b'last-good')
 def test_oversize_fails_before_output(self):
  with tempfile.TemporaryDirectory() as d:
   src=pathlib.Path(d)/'source';dst=pathlib.Path(d)/'dest';src.write_bytes(b'x'*17)
   with patch.object(p,'LIMIT',16),self.assertRaises(ValueError):p.preserve(src,dst,True)
   self.assertFalse(dst.exists())
 def test_fsync_failure_removes_only_new_copy(self):
  with tempfile.TemporaryDirectory() as d:
   src=pathlib.Path(d)/'source';dst=pathlib.Path(d)/'dest';src.write_bytes(b'original')
   with patch('preserve.os.fsync',side_effect=OSError),self.assertRaises(OSError):p.preserve(src,dst,True)
   self.assertFalse(dst.exists());self.assertEqual(src.read_bytes(),b'original')
 def test_changed_source_refuses_and_removes_copy(self):
  with tempfile.TemporaryDirectory() as d:
   src=pathlib.Path(d)/'source';dst=pathlib.Path(d)/'dest';src.write_bytes(b'original');read=p.read_source;calls=0
   def changing(path):
    nonlocal calls
    calls+=1
    if calls==3:src.write_bytes(b'changed by external writer')
    return read(path)
   with patch('preserve.read_source',side_effect=changing),self.assertRaises(ValueError):p.preserve(src,dst,True)
   self.assertFalse(dst.exists());self.assertEqual(src.read_bytes(),b'changed by external writer')
 def test_cli_never_logs_snapshot_content_or_paths(self):
  with tempfile.TemporaryDirectory() as d:
   src=pathlib.Path(d)/'PRIVATE_PATH';dst=pathlib.Path(d)/'out';src.write_bytes(b'SYNTHETIC_PRIVATE_CONTENT')
   for extra in [[],['--source-quiescent']]:
    result=subprocess.run([sys.executable,str(pathlib.Path(p.__file__)),'--source',str(src),'--destination',str(dst),*extra],capture_output=True,text=True,timeout=10)
    self.assertEqual(result.returncode,0 if extra else 1)
    self.assertNotIn('PRIVATE_PATH',result.stdout+result.stderr);self.assertNotIn('SYNTHETIC_PRIVATE_CONTENT',result.stdout+result.stderr)
 def test_copy_verifies_after_original_is_unavailable(self):
  with tempfile.TemporaryDirectory() as d:
   root=pathlib.Path(d);src=root/'source';dst=root/'copy'
   for raw in [b'broken\xff\x00', b'']:
    src.write_bytes(raw);receipt=p.preserve(src,dst,True);src.unlink()
    before=dst.stat()
    self.assertEqual(p.verify_copy(dst,receipt['sha256'],receipt['bytes']),
                     {'copy_matches_receipt':True,'bytes':len(raw),'native_import':False,'snapshot_semantics_verified':False})
    self.assertEqual(dst.read_bytes(),raw);self.assertEqual(dst.stat().st_mtime_ns,before.st_mtime_ns);dst.unlink()
 def test_retained_size_and_digest_must_both_match(self):
  with tempfile.TemporaryDirectory() as d:
   path=pathlib.Path(d)/'copy';path.write_bytes(b'wrong')
   digest=hashlib.sha256(b'right').hexdigest()
   with self.assertRaises(ValueError):p.verify_copy(path,digest,5)
   with self.assertRaises(ValueError):p.verify_copy(path,hashlib.sha256(b'wrong').hexdigest(),4)
   for invalid_digest,invalid_size in [('g'*64,5),(digest,True),(digest,-1),(digest,p.LIMIT+1)]:
    with self.assertRaises(ValueError):p.verify_copy(path,invalid_digest,invalid_size)
   self.assertEqual(path.read_bytes(),b'wrong')
 def test_cli_verifies_without_writing_copy_and_refuses_mixed_modes(self):
  with tempfile.TemporaryDirectory() as d:
   root=pathlib.Path(d);path=root/'PRIVATE_PATH';path.write_bytes(b'SYNTHETIC_PRIVATE_CONTENT');out=root/'out'
   cmd=[sys.executable,p.__file__,'--verify-copy',str(path),'--expected-sha256',hashlib.sha256(path.read_bytes()).hexdigest(),'--expected-bytes',str(len(path.read_bytes()))]
   for extra,code in [([],0),(['--destination',str(out)],2),(['--source',str(path)],2),(['--source-quiescent'],2),(['--expected-bytes','0'],1)]:
    result=subprocess.run(cmd+extra,capture_output=True,text=True,timeout=10)
    self.assertEqual(result.returncode,code)
    if not code:self.assertTrue(json.loads(result.stdout)['copy_matches_receipt'])
    self.assertNotIn('PRIVATE_PATH',result.stdout+result.stderr)
    self.assertNotIn('SYNTHETIC_PRIVATE_CONTENT',result.stdout+result.stderr)
    self.assertFalse(out.exists())
   self.assertEqual(path.read_bytes(),b'SYNTHETIC_PRIVATE_CONTENT')
if __name__=='__main__':unittest.main()
