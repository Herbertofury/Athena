import json
import sys
import unittest
import zipfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import history_capsule as capsule
import history_bundle as bundle
import test_history_bundle as fixtures

class HistoryCapsuleTests(unittest.TestCase):
    setUp=fixtures.HistoryBundleTests.setUp
    def make(self):
        bundle.git(self.source,'symbolic-ref','refs/remotes/origin/HEAD','refs/heads/alternate')
        path=self.root/'history.zip';capsule.create(self.source,path);return path
    def test_symbolic_head_and_alias_restore_without_source_dependency(self):
        path=self.make();original=capsule.reference_metadata(self.source)
        moved=self.root/'source-hidden';self.source.rename(moved)
        destination=self.root/'restore.git';result=capsule.restore(path,destination)
        self.assertTrue(result['verified']);self.assertEqual(result['symbolicRefCount'],1)
        self.assertEqual(capsule.reference_metadata(destination),original)
    def test_detached_head_remains_detached(self):
        bundle.git(self.source,'checkout','--detach','--quiet');path=self.make()
        result=capsule.restore(path,self.root/'restore.git');self.assertFalse(result['headSymbolicPreserved'])
    def test_existing_destination_and_capsule_untouched(self):
        path=self.make();before=path.read_bytes()
        with self.assertRaises(ValueError):capsule.create(self.source,path)
        with self.assertRaises(FileExistsError):capsule.restore(path,self.source)
        self.assertEqual(path.read_bytes(),before)
    def modify(self,path,change):
        with zipfile.ZipFile(path) as z:raw=z.read('history.bundle');manifest=json.loads(z.read('manifest.json'))
        change(manifest)
        altered=self.root/'altered.zip'
        with zipfile.ZipFile(altered,'w') as z:z.writestr('history.bundle',raw);z.writestr('manifest.json',json.dumps(manifest))
        return altered
    def test_hash_tamper_rejected_before_destination(self):
        path=self.modify(self.make(),lambda m:m.update(bundleSha256='0'*64));destination=self.root/'restore.git'
        with self.assertRaises(ValueError):capsule.restore(path,destination)
        self.assertFalse(destination.exists())
    def test_alias_cycle_rejected(self):
        path=self.modify(self.make(),lambda m:m['symbolicRefs'].update({'refs/heads/alternate':'refs/remotes/origin/HEAD'}))
        with self.assertRaises(ValueError):capsule.verify(path)
    def test_extra_archive_member_rejected(self):
        path=self.make()
        with zipfile.ZipFile(path,'a') as z:z.writestr('../outside','no')
        with self.assertRaises(ValueError):capsule.verify(path)

if __name__=='__main__':unittest.main()
