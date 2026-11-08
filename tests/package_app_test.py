import importlib.util
import hashlib
import json
import shutil
import os
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
            self.assertEqual(manifest['workspaces'],['learning','research','media','lab'])
            self.assertEqual(manifest['pending'], ['Feature Foundry integration and verification; not included in this build'])
            self.assertFalse((root/'public/workspaces/foundry/index.js').exists())

    def test_public_preview_refuses_foundry_even_if_allowlisted(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root)
            with self.assertRaisesRegex(ValueError,'excludes Foundry'):
                pack.package(source,root/'public',self.approved(source),profile='public-preview')
            self.assertFalse((root/'public').exists())



class CandidatePackageTests(unittest.TestCase):
    source = PackageTests.source
    approved = PackageTests.approved
    def candidate_source(self, root):
        source=self.source(root)
        for name in pack.FOUNDRY_ASSETS:
            target=source/name
            target.parent.mkdir(parents=True,exist_ok=True)
            shutil.copyfile(ROOT/'dist'/name,target)
        return source

    def candidate_allowlist(self,source):
        allowlist=self.approved(source)
        allowlist.update(profile='integration-candidate',candidate=pack.candidate_contract())
        return allowlist

    def test_candidate_exact_assets_and_honest_limits(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.candidate_source(root)
            manifest=pack.package(source,root/'public',self.candidate_allowlist(source),profile='integration-candidate')
            self.assertEqual(manifest['candidate'],pack.candidate_contract())
            self.assertIn('build',manifest['workspaces'])
            self.assertEqual(manifest['pending'],pack.FOUNDRY_LIMITATIONS)
            self.assertFalse(manifest['candidate']['native'])
            self.assertFalse(manifest['candidate']['accountAuthorization'])
            self.assertFalse(manifest['candidate']['verifiedPlayback'])
            self.assertFalse(manifest['candidate']['deployed'])
            for name,expected in pack.FOUNDRY_ASSETS.items():
                data=(root/'public'/name).read_bytes()
                self.assertEqual(len(data),expected['bytes'])
                self.assertEqual(hashlib.sha256(data).hexdigest(),expected['sha256'])

    def test_candidate_needs_exact_review_contract(self):
        changes=[('profile','complete'),('candidate',{}),('candidate',dict(pack.candidate_contract(),native=True)),
                 ('candidate',dict(pack.candidate_contract(),sourceCommit='0'*40)),
                 ('candidate',dict(pack.candidate_contract(),integrationCommit='0'*40)),
                 ('candidate',dict(pack.candidate_contract(),deployed=True)),
                 ('candidate',dict(pack.candidate_contract(),extra=True))]
        for flag in ('native','accountAuthorization','verifiedPlayback','deployed'):
            for number in (0,0.0):
                changes.append(('candidate',dict(pack.candidate_contract(),**{flag:number})))
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.candidate_source(root)
            for key,value in changes:
                with self.subTest(key=key,value=value):
                    a=self.candidate_allowlist(source);a[key]=value
                    with self.assertRaisesRegex(ValueError,'contract'):
                        pack.package(source,root/'public',a,profile='integration-candidate')
                    self.assertFalse((root/'public').exists())

    def test_candidate_missing_or_extra_foundry_asset_is_rejected(self):
        for name in pack.FOUNDRY_ASSETS:
            with self.subTest(name=name),tempfile.TemporaryDirectory() as temp:
                root=pathlib.Path(temp);source=self.candidate_source(root);(source/name).unlink()
                with self.assertRaises(ValueError):
                    pack.package(source,root/'public',self.candidate_allowlist(source),profile='integration-candidate')
                self.assertFalse((root/'public').exists())
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.candidate_source(root)
            (source/'workspaces/foundry/extra.js').write_text('unreviewed fixture')
            with self.assertRaisesRegex(ValueError,'exactly'):
                pack.package(source,root/'public',self.candidate_allowlist(source),profile='integration-candidate')
            self.assertFalse((root/'public').exists())

    def test_candidate_rehash_cannot_silently_approve_modified_asset(self):
        for name in pack.FOUNDRY_ASSETS:
            with self.subTest(name=name),tempfile.TemporaryDirectory() as temp:
                root=pathlib.Path(temp);source=self.candidate_source(root);f=source/name
                data=f.read_bytes();f.write_bytes(b'X'+data[1:])
                with self.assertRaisesRegex(ValueError,'identity'):
                    pack.package(source,root/'public',self.candidate_allowlist(source),profile='integration-candidate')
                self.assertFalse((root/'public').exists())

    def test_candidate_rejects_wrong_declared_module_size(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.candidate_source(root);a=self.candidate_allowlist(source)
            with (source/'workspaces/foundry/index.js').open('ab') as f:f.write(b'X')
            with self.assertRaisesRegex(ValueError,'identity'):
                pack.package(source,root/'public',a,profile='integration-candidate')
            self.assertFalse((root/'public').exists())

    def test_candidate_source_identity_is_checked_beyond_allowlist(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.candidate_source(root)
            f=source/'workspaces/foundry/identity.json';value=json.loads(f.read_text());value['sourceHead']='0'*40
            f.write_text(json.dumps(value))
            assets={k:dict(v) for k,v in pack.FOUNDRY_ASSETS.items()}
            assets['workspaces/foundry/identity.json']={'bytes':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()}
            with mock.patch.object(pack,'FOUNDRY_ASSETS',assets):
                with self.assertRaisesRegex(ValueError,'source/runtime identity'):
                    pack.package(source,root/'public',self.candidate_allowlist(source),profile='integration-candidate')

    def test_public_preview_restriction_survives_candidate_contract(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.candidate_source(root)
            with self.assertRaisesRegex(ValueError,'excludes Foundry'):
                pack.package(source,root/'public',self.candidate_allowlist(source),profile='public-preview')
            self.assertFalse((root/'public').exists())


class LoaderBoundaryTests(unittest.TestCase):
    source = PackageTests.source
    approved = PackageTests.approved
    def add_bytes(self,source,count):
        i=0
        while count:
            length=min(count,pack.MAX_FILE_BYTES)
            with (source/('padding-%d.txt'%i)).open('wb') as f:f.truncate(length)
            count-=length;i+=1

    def test_exact_total_including_generated_bytes_is_accepted(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root)
            current=sum(p.stat().st_size for p in source.rglob('*') if p.is_file())
            generated=sum(map(len,pack.GENERATED.values()))
            self.add_bytes(source,pack.MAX_TOTAL_BYTES-current-generated)
            manifest=pack.package(source,root/'public',self.approved(source))
            self.assertEqual(sum(x['bytes'] for x in manifest['files']),pack.MAX_TOTAL_BYTES)

    def test_source_at_total_limit_cannot_overflow_with_generated_redirect(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root)
            current=sum(p.stat().st_size for p in source.rglob('*') if p.is_file())
            self.add_bytes(source,pack.MAX_TOTAL_BYTES-current)
            with self.assertRaisesRegex(ValueError,'including generated'):
                pack.package(source,root/'public',self.approved(source))
            self.assertFalse((root/'public').exists())

    def test_one_byte_over_total_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root);actual=sum(p.stat().st_size for p in source.rglob('*') if p.is_file())
            limit=actual+sum(map(len,pack.GENERATED.values()))-1
            with mock.patch.object(pack,'MAX_TOTAL_BYTES',limit):
                with self.assertRaisesRegex(ValueError,'total byte budget'):
                    pack.package(source,root/'public',self.approved(source))
            self.assertFalse((root/'public').exists())

    def test_file_budget_checked_before_loading_oversized_file(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root);f=source/'oversized.txt'
            with f.open('wb') as h:h.truncate(pack.MAX_FILE_BYTES+1)
            with self.assertRaisesRegex(ValueError,'file exceeds'):
                pack.package(source,root/'public',self.approved(source))
            self.assertFalse((root/'public').exists())

    def test_generated_entries_count_toward_loader_limit(self):
        for total,accepted in [(pack.MAX_ENTRIES,True),(pack.MAX_ENTRIES+1,False)]:
            with self.subTest(total=total),tempfile.TemporaryDirectory() as temp:
                root=pathlib.Path(temp);source=self.source(root)
                for i in range(total-len(pack.REQUIRED)-len(pack.GENERATED)):(source/('entry-%d.txt'%i)).write_text('')
                if accepted:
                    manifest=pack.package(source,root/'public',self.approved(source));self.assertEqual(len(manifest['files']),pack.MAX_ENTRIES)
                else:
                    with self.assertRaisesRegex(ValueError,'entry count'):
                        pack.package(source,root/'public',self.approved(source))
                    self.assertFalse((root/'public').exists())

    def test_manifest_budget_rejects_before_final_output(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root)
            with mock.patch.object(pack,'MAX_MANIFEST_BYTES',100):
                with self.assertRaisesRegex(ValueError,'manifest exceeds'):
                    pack.package(source,root/'public',self.approved(source))
            self.assertFalse((root/'public').exists())

    def test_rust_reserved_paths_extension_and_character_limits(self):
        for name in ('api/x.js','api','thing.sqlite','x.WOFF','x y.js','caf\u00e9.js','one/%25.js'):
            with self.subTest(name=name),tempfile.TemporaryDirectory() as temp:
                root=pathlib.Path(temp);source=self.source(root);f=source/name;f.parent.mkdir(parents=True,exist_ok=True);f.write_text('fixture')
                with self.assertRaisesRegex(ValueError,'Rust loader'):
                    pack.package(source,root/'public',self.approved(source))
                self.assertFalse((root/'public').exists())
        self.assertTrue(pack.runtime_path('a/'+'b'*254+'/'+('c'*252)+'.js'))
        self.assertFalse(pack.runtime_path('a/'+'b'*254+'/'+('c'*253)+'.js'))

    def test_source_root_and_nested_symlinks_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);source=self.source(root);a=self.approved(source)
            (root/'link').symlink_to(source,target_is_directory=True)
            with self.assertRaisesRegex(ValueError,'root.*symlink'):
                pack.package(root/'link',root/'public',a)
            (source/'nested').symlink_to(root,target_is_directory=True)
            with self.assertRaisesRegex(ValueError,'symlinks'):
                pack.package(source,root/'public',a)

    def test_budget_constants_match_unchanged_rust_loader(self):
        rust=(ROOT/'engineering/apps/atlas-lab/src/athena_assets.rs').read_text()
        for expression in ('MAX_MANIFEST: u64 = 2 * 1024 * 1024','MAX_FILE: u64 = 16 * 1024 * 1024',
                           'MAX_TOTAL: u64 = 64 * 1024 * 1024','manifest.files.len() > 4096','path.len() <= 512'):
            self.assertIn(expression,rust)
        self.assertEqual(pack.MAX_MANIFEST_BYTES,2*1024*1024)
        self.assertEqual(pack.MAX_FILE_BYTES,16*1024*1024)
        self.assertEqual(pack.MAX_TOTAL_BYTES,64*1024*1024)
        self.assertEqual(pack.MAX_ENTRIES,4096)

if __name__=='__main__':unittest.main()

