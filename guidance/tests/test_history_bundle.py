import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'tools'))
import history_bundle as bundle

class HistoryBundleTests(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory();self.addCleanup(self.temp.cleanup)
        self.root=Path(self.temp.name);self.source=self.root/'source';self.source.mkdir()
        bundle.git(self.source,'init','--quiet')
        bundle.git(self.source,'config','user.name','Synthetic Fixture')
        bundle.git(self.source,'config','user.email','fixture@example.invalid')
        (self.source/'binary.dat').write_bytes(bytes(range(256)))
        bundle.git(self.source,'add','.');bundle.git(self.source,'commit','-qm','initial')
        bundle.git(self.source,'tag','-a','v1','-m','fixture tag')
        bundle.git(self.source,'branch','alternate')
        self.output=self.root/'output.bundle'
    def test_full_refs_detached_head_and_binary_restore(self):
        bundle.git(self.source,'checkout','--detach','--quiet')
        (self.source/'note').write_text('detached fixture',encoding='utf-8')
        bundle.git(self.source,'add','.');bundle.git(self.source,'commit','-qm','detached')
        original=bundle.refs(self.source);head=bundle.head(self.source)
        result=bundle.create(self.source,self.output)
        self.assertEqual(result['head'],head);self.assertEqual(result['refCount'],len(original))
        self.assertTrue(result['independentBareRestore']);self.assertFalse(result['retirementReady'])
        self.assertEqual(result['bundleSha256'],bundle.checksum(self.output))
        self.assertEqual(bundle.refs(self.source),original)
        self.assertNotIn(str(self.source),json.dumps(result))
    def test_shallow_source_refused(self):
        original=bundle.git
        def shallow(repo,*args):
            return b'true\n' if args==('rev-parse','--is-shallow-repository') else original(repo,*args)
        with patch.object(bundle,'git',side_effect=shallow):
            with self.assertRaises(ValueError):bundle.create(self.source,self.output)
        self.assertFalse(self.output.exists())
    def test_inside_source_output_refused(self):
        with self.assertRaises(ValueError):bundle.create(self.source,self.source/'history.bundle')
        self.assertFalse((self.source/'history.bundle').exists())
    def test_existing_output_preserved(self):
        self.output.write_bytes(b'keep')
        with self.assertRaises(ValueError):bundle.create(self.source,self.output)
        self.assertEqual(self.output.read_bytes(),b'keep')
    def test_publish_after_destination_appears_is_never_overwriting(self):
        staged=self.root/'verified-new'
        staged.write_bytes(b'complete verified bytes')
        self.output.write_bytes(b'other writer')
        with self.assertRaises(FileExistsError):bundle.publish_new(staged,self.output)
        self.assertEqual(self.output.read_bytes(),b'other writer')
        self.assertEqual(staged.read_bytes(),b'complete verified bytes')
    def test_publish_uses_native_exclusive_operation(self):
        staged=self.root/'verified-new'
        staged.write_bytes(b'complete verified bytes')
        if bundle.os.name=='nt':
            with patch.object(bundle.os,'link',side_effect=OSError('hard links unsupported')):
                bundle.publish_new(staged,self.output)
            self.assertFalse(staged.exists())
        else:
            with patch.object(bundle.os,'rename',side_effect=AssertionError('POSIX rename could overwrite')):
                bundle.publish_new(staged,self.output)
            self.assertTrue(staged.exists())
        self.assertEqual(self.output.read_bytes(),b'complete verified bytes')
    def test_failed_restore_never_publishes(self):
        original=bundle.git
        def fail(repo,*args):
            if args and args[0]=='fsck':raise ValueError('injected')
            return original(repo,*args)
        with patch.object(bundle,'git',side_effect=fail):
            with self.assertRaises(ValueError):bundle.create(self.source,self.output)
        self.assertFalse(self.output.exists())
        self.assertEqual((self.source/'binary.dat').read_bytes(),bytes(range(256)))
    def test_replacement_refs_are_rejected(self):
        bundle.git(self.source,'update-ref','refs/replace/'+bundle.head(self.source),bundle.head(self.source))
        with self.assertRaises(ValueError):bundle.create(self.source,self.output)
        self.assertFalse(self.output.exists())
    def test_working_changes_remain_unmodified_and_excluded(self):
        (self.source/'binary.dat').write_bytes(b'uncommitted')
        before=bundle.git(self.source,'status','--porcelain')
        result=bundle.create(self.source,self.output)
        self.assertEqual(before,bundle.git(self.source,'status','--porcelain'))
        self.assertIn('Working changes',result['limitations'][0])

if __name__=='__main__':unittest.main()
