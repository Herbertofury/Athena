"""Fork only synthetic checkpoints; actual native acceptance is separate."""
import hashlib,json,pathlib,unittest,os,subprocess
from unittest import mock
import test_dual_checkpoint as fixture
launch=fixture.launch
class CheckpointFork(unittest.TestCase):
 setUp=fixture.DualCheckpoint.setUp
 run_child=fixture.DualCheckpoint.run_child
 checkpoint=fixture.DualCheckpoint.checkpoint
 def test_verified_fork_preserves_parent(self):
  self.checkpoint();before={p.name:p.read_bytes() for p in self.dest.iterdir()};working=self.root/'working'
  with mock.patch.object(launch.subprocess,'run',self.run_child):result=launch.fork_checkpoint(self.package,self.data,self.dest,working,True)
  self.assertTrue(result['complete']);self.assertEqual(result['parent_checkpoint_sha256'],hashlib.sha256(before['checkpoint.json']).hexdigest());self.assertEqual(before,{p.name:p.read_bytes() for p in self.dest.iterdir()})
  self.assertEqual(launch.verify_checkpoint(working)[0],result)
 def test_receipt_paths_cannot_select_external_files(self):
  self.checkpoint();marker=self.dest/'checkpoint.json';data=json.loads(marker.read_text());data['stores']['../outside']=data['stores'].pop('foundry.sqlite3');marker.write_text(json.dumps(data))
  with self.assertRaises(ValueError):launch.verify_checkpoint(self.dest)
 def test_tamper_and_duplicate_key_refused(self):
  self.checkpoint();marker=self.dest/'checkpoint.json';original=marker.read_text();marker.write_text(original[:-2]+',"complete":true}')
  with self.assertRaises(ValueError):launch.verify_checkpoint(self.dest)
  marker.write_text(original);(self.dest/'foundry.sqlite3').write_bytes(b'changed')
  with self.assertRaises(ValueError):launch.verify_checkpoint(self.dest)
 def test_nested_destination_refused(self):
  self.checkpoint();before={p.name:p.read_bytes() for p in self.dest.iterdir()}
  with self.assertRaises(ValueError):launch.fork_checkpoint(self.package,self.data,self.dest,self.dest/'new',True)
  self.assertEqual(before,{p.name:p.read_bytes() for p in self.dest.iterdir()})
 def test_change_between_verification_and_capture_refused(self):
  self.checkpoint();original=launch.verify_checkpoint;working=self.root/'working'
  def changed(directory):
   value=original(directory);path=self.dest/'engineering.sqlite3';path.write_bytes(path.read_bytes()+b'after');return value
  with mock.patch.object(launch,'verify_checkpoint',changed),self.assertRaises(ValueError):launch.fork_checkpoint(self.package,self.data,self.dest,working,True)
  self.assertFalse(working.exists())
 def test_stopped_assertion_required(self):
  self.checkpoint();working=self.root/'working'
  with self.assertRaises(ValueError):launch.fork_checkpoint(self.package,self.data,self.dest,working)
  self.assertFalse(working.exists())
 def test_checkpoint_directory_link_refused(self):
  self.checkpoint();link=self.root/'linked-checkpoint'
  if os.name=='nt':
   result=subprocess.run(['cmd','/c','mklink','/J',str(link),str(self.dest)],capture_output=True)
   self.assertEqual(result.returncode,0,result.stderr);self.addCleanup(lambda:link.rmdir() if link.exists() else None)
  else:link.symlink_to(self.dest,target_is_directory=True)
  with self.assertRaises(ValueError):launch.verify_checkpoint(link)
 def test_extra_file_and_invalid_typed_size_refused(self):
  self.checkpoint();extra=self.dest/'extra';extra.write_bytes(b'keep')
  with self.assertRaises(ValueError):launch.verify_checkpoint(self.dest)
  extra.unlink();marker=self.dest/'checkpoint.json';data=json.loads(marker.read_text());data['stores']['foundry.sqlite3']['bytes']=True;marker.write_text(json.dumps(data))
  with self.assertRaises(ValueError):launch.verify_checkpoint(self.dest)
if __name__=='__main__':unittest.main()
