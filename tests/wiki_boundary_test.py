"""Migration wiki synchronization must not follow links outside its explicit roots."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('wiki_boundary_sync',ROOT/'scripts/sync_wiki.py')
wiki=importlib.util.module_from_spec(spec);spec.loader.exec_module(wiki)

class WikiBoundaryTests(unittest.TestCase):
    def setUp(self):
        temp=tempfile.TemporaryDirectory(prefix='athena-wiki-boundary-');self.addCleanup(temp.cleanup)
        self.root=Path(temp.name);self.source=self.root/'source';self.target=self.root/'target'
        self.source.mkdir();self.target.mkdir();(self.source/'A.md').write_text('new A')
        self.sentinel=self.root/'outside.txt';self.sentinel.write_text('outside preserved')
    def link(self,target,path):
        try:path.symlink_to(target,target_is_directory=target.is_dir())
        except (OSError,NotImplementedError) as e:self.skipTest(f'Symlink fixture unavailable: {e}')
    def unchanged(self):
        self.assertEqual(self.sentinel.read_text(),'outside preserved')
        self.assertFalse((self.target/'A.md').exists())
    def test_linked_source_page_rejected_before_any_write(self):
        self.link(self.sentinel,self.source/'Z.md')
        with self.assertRaisesRegex(ValueError,'symlink'):wiki.sync(self.source,self.target)
        self.unchanged()
    def test_linked_target_page_even_with_matching_ownership_hash_rejected(self):
        (self.source/'Z.md').write_text('would overwrite outside')
        self.link(self.sentinel,self.target/'Z.md')
        manifest={'Z.md':wiki.digest(self.sentinel.read_text())}
        (self.target/'.athena-managed.json').write_text(json.dumps(manifest))
        before=(self.target/'.athena-managed.json').read_bytes()
        with self.assertRaisesRegex(ValueError,'symlink'):wiki.sync(self.source,self.target)
        self.unchanged();self.assertEqual((self.target/'.athena-managed.json').read_bytes(),before)
    def test_dangling_target_link_rejected_without_creating_external_file(self):
        missing=self.root/'outside-missing';self.link(missing,self.target/'A.md')
        with self.assertRaisesRegex(ValueError,'symlink'):wiki.sync(self.source,self.target)
        self.assertFalse(missing.exists());self.assertFalse((self.target/'.athena-managed.json').exists())
    def test_linked_manifest_rejected_before_page_write(self):
        outside=self.root/'outside.json';outside.write_text('{}');self.link(outside,self.target/'.athena-managed.json')
        with self.assertRaisesRegex(ValueError,'symlink'):wiki.sync(self.source,self.target)
        self.unchanged();self.assertEqual(outside.read_text(),'{}')
    def test_linked_roots_rejected(self):
        for name,source,target in [('source-alias',self.source,self.target),('target-alias',self.target,self.source)]:
            alias=self.root/name;self.link(source,alias)
            with self.assertRaisesRegex(ValueError,'symlink'):
                wiki.sync(alias,target) if name=='source-alias' else wiki.sync(target,alias)
        self.unchanged()
    def test_normal_named_roots_still_sync_and_leave_unmanaged_notes(self):
        (self.target/'User.md').write_text('manual')
        self.assertEqual(wiki.sync(self.source,self.target),1)
        self.assertEqual((self.target/'User.md').read_text(),'manual')
        self.assertEqual((self.target/'A.md').read_text(),'new A')

if __name__=='__main__':unittest.main()
