import importlib.util
import hashlib
import pathlib
import tempfile
import unittest
from unittest import mock
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('pack',ROOT/'scripts/package_app.py')
pack=importlib.util.module_from_spec(spec)
spec.loader.exec_module(pack)

class PackageTests(unittest.TestCase):
    def source(self,root):
        source=root/'dist';source.mkdir()
        for name in pack.REQUIRED:
            path=source/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_text('test fixture '+name)
        return source

    def approved(self, source):
        return {'schema':1, 'files':[{'path':p.relative_to(source).as_posix(), 'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in sorted(source.rglob('*')) if p.is_file()]}

    def test_missing_workspace_blocks_release_before_output(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root)
            (source/'workspaces/foundry/index.js').unlink()
            with self.assertRaisesRegex(ValueError,'missing'):
                pack.package(source,root/'public',self.approved(source))
            self.assertFalse((root/'public').exists())

    def test_one_entry_and_exact_runtime_copy(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root);manifest=pack.package(source,root/'public',self.approved(source))
            self.assertEqual(manifest['entry'],'index.html')
            self.assertEqual((root/'public/index.html').read_bytes(),(source/'index.html').read_bytes())
            self.assertIn('../#home',(root/'public/learn/index.html').read_text())
            self.assertEqual(len(manifest['files']),len(pack.REQUIRED)+2)
            self.assertTrue((root/'public/athena-runtime-manifest.json').exists())

    def test_lab_dependencies_required_before_output(self):
        for name in ('index.mjs', 'style.css', 'archive-view.mjs', 'collection-input.mjs', 'job-submit.mjs'):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as temp:
                root=pathlib.Path(temp);source=self.source(root)
                (source/'workspaces/foundry/index.js').unlink()
                (source/'workspaces/engineering/lab'/name).unlink()
                with self.assertRaisesRegex(ValueError, 'missing'):
                    pack.package(source,root/'public',self.approved(source),profile='public-preview')
                self.assertFalse((root/'public').exists())

    def test_card_dependencies_required_before_output(self):
        for relative in [p for p in pack.REQUIRED if '/cards/' in p]:
            with self.subTest(path=relative), tempfile.TemporaryDirectory() as temp:
                root=pathlib.Path(temp);source=self.source(root)
                (source/'workspaces/foundry/index.js').unlink()
                (source/relative).unlink()
                with self.assertRaisesRegex(ValueError, 'missing'):
                    pack.package(source,root/'public',self.approved(source),profile='public-preview')
                self.assertFalse((root/'public').exists())

    def test_existing_output_preserved(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root);output=root/'public';output.mkdir();(output/'mine').write_text('preserve')
            with self.assertRaises(ValueError):pack.package(source,output,self.approved(source))
            self.assertEqual((output/'mine').read_text(),'preserve')

    def test_hidden_file_cannot_be_published_accidentally(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root);(source/'.private').write_text('fixture')
            with self.assertRaisesRegex(ValueError,'hidden'):pack.package(source,root/'public',self.approved(source))
            self.assertFalse((root/'public').exists())

    def test_generated_paths_cannot_silently_overwrite_runtime_source(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root)
            (source/'learn').mkdir();(source/'learn/index.html').write_text('existing entry')
            with self.assertRaisesRegex(ValueError,'conflicts'):
                pack.package(source,root/'public',self.approved(source))
            self.assertFalse((root/'public').exists())

    def test_explicit_review_required_even_when_files_are_complete(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root)
            with self.assertRaisesRegex(ValueError,'explicitly reviewed'):
                pack.package(source,root/'public')

    def test_unreviewed_file_and_changed_content_both_block_packaging(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root);approved=self.approved(source)
            extra=source/'private-notes.txt';extra.write_text('test-only private marker')
            with self.assertRaisesRegex(ValueError,'unreviewed'):
                pack.package(source,root/'public',approved)
            extra.unlink();(source/'app.js').write_text('modified fixture')
            with self.assertRaisesRegex(ValueError,'changed after'):
                pack.package(source,root/'public',approved)
            self.assertFalse((root/'public').exists())

    def test_allowlist_rejects_noncanonical_or_duplicate_paths(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root);approved=self.approved(source)
            approved['files'].append(approved['files'][0])
            with self.assertRaisesRegex(ValueError,'Duplicate'):
                pack.package(source,root/'public',approved)
            for name in ('../secret','/absolute','a\\b','./app.js'):
                with self.subTest(name=name):
                    with self.assertRaisesRegex(ValueError,'canonical'):
                        pack.package(source,root/'public',{'schema':1,'files':[{'path':name,'sha256':'0'*64}]})

    def test_changed_during_staging_never_reaches_final_output(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root);approved=self.approved(source)
            original=pack.shutil.copyfile
            def raced_copy(src,dest):
                if pathlib.Path(src).name=='app.js':
                    pathlib.Path(src).write_text('unapproved changed fixture')
                return original(src,dest)
            with mock.patch.object(pack.shutil,'copyfile',side_effect=raced_copy):
                with self.assertRaisesRegex(ValueError,'during staging'):
                    pack.package(source,root/'public',approved)
            self.assertFalse((root/'public').exists())

    def test_public_preview_records_foundry_as_pending_without_copying_it(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root)
            (source/'workspaces/foundry/index.js').unlink()
            manifest=pack.package(source,root/'public',self.approved(source),profile='public-preview')
            self.assertEqual(manifest['workspaces'],['learning','research','media','lab','cards','audio','receiver','diagnostics','build'])
            self.assertEqual(manifest['pending'], ['Full Foundry parity: original 3D, artist worlds, native persistence and provider authorization'])
            self.assertFalse((root/'public/workspaces/foundry/index.js').exists())

    def test_public_preview_refuses_foundry_even_if_allowlisted(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root)
            with self.assertRaisesRegex(ValueError,'excludes Foundry'):
                pack.package(source,root/'public',self.approved(source),profile='public-preview')
            self.assertFalse((root/'public').exists())

if __name__=='__main__':unittest.main()
