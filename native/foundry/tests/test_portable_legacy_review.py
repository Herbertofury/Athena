import hashlib
import importlib.util
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import unittest
from legacy_fixture import create

ROOT=pathlib.Path(__file__).resolve().parents[3]
SUFFIX='.exe' if os.name=='nt' else ''
BIN=pathlib.Path(os.environ.get('ATHENA_FOUNDRY_STORE_BINARY', ROOT/'crates/athena-foundry-store/target/debug'/('athena-foundry-store'+SUFFIX)))
spec=importlib.util.spec_from_file_location('native_package_legacy',ROOT/'scripts/package_native.py')
pack=importlib.util.module_from_spec(spec)
spec.loader.exec_module(pack)

def sha(file):
    return hashlib.sha256(file.read_bytes()).hexdigest()

class LegacyReview(unittest.TestCase):
    def setUp(self):
        handle=tempfile.TemporaryDirectory()
        self.addCleanup(handle.cleanup)
        self.root=pathlib.Path(handle.name)
        self.package=self.root/'preview'
        pack.package(ROOT/'dist',BIN,sha(BIN),self.package,'windows' if os.name=='nt' else 'linux')
        self.source=self.root/'legacy.sqlite'
        self.review=self.root/'review.sqlite'
        self.updated=self.root/'athena.sqlite'
        create(self.source)

    def invoke(self,*argv):
        return subprocess.run([sys.executable,'-B',str(self.package/'launch.py'),*map(str,argv)],
                              text=True,capture_output=True,timeout=45)

    def prepare(self,*other):
        return self.invoke('--prepare-foundry-legacy',self.source,'--legacy-output',self.review,*other)

    def test_installed_preview_reuses_the_real_legacy_import(self):
        before=sha(self.source)
        self.assertEqual(self.prepare().returncode,2)
        self.assertFalse(self.review.exists())
        prepared=self.prepare('--source-quiescent')
        self.assertEqual(prepared.returncode,0,prepared.stderr)
        evidence=json.loads(prepared.stdout)
        self.assertTrue(evidence['prepared_review_copy'])
        self.assertFalse(evidence['lossless_migration'])
        self.assertNotIn('private_marker',prepared.stdout)
        self.assertEqual(evidence['output_sha256'],sha(self.review))
        self.assertEqual(evidence['report']['soundtracks'],1)
        imported=self.invoke('--import-foundry-legacy',self.review,'--legacy-output',self.updated,
                             '--expected-legacy-sha256',evidence['output_sha256'])
        self.assertEqual(imported.returncode,0,imported.stderr)
        out=json.loads(imported.stdout)
        self.assertTrue(out['imported_new_athena_profile'])
        self.assertEqual(out['output_sha256'],sha(self.updated))
        self.assertEqual(sha(self.source),before)
        self.assertEqual(sha(self.review),evidence['output_sha256'])
        data=json.loads(subprocess.check_output([str(BIN),'read-native',str(self.updated),
            'frutiger-aero','frutiger-aero:room:aqua-atrium']))
        self.assertEqual(data['updated_at'],123456789)
        self.assertEqual(data['assignment']['status'],'USER_SEARCH_ROUTE')

    def test_refuses_mutated_review_sidecars_and_existing_destination(self):
        result=self.prepare('--source-quiescent')
        self.assertEqual(result.returncode,0,result.stderr)
        pin=sha(self.review)
        command=('--import-foundry-legacy',self.review,'--legacy-output',self.updated,'--expected-legacy-sha256',pin)
        self.updated.write_bytes(b'keep')
        self.assertEqual(self.invoke(*command).returncode,2)
        self.assertEqual(self.updated.read_bytes(),b'keep')
        self.updated.unlink()
        sidecar=pathlib.Path(str(self.review)+'-wal')
        sidecar.write_bytes(b'preserve')
        self.assertEqual(self.invoke(*command).returncode,2)
        self.assertEqual(sidecar.read_bytes(),b'preserve')
        sidecar.unlink()
        with self.review.open('ab') as handle:
            handle.write(b'mutation')
        self.assertEqual(self.invoke(*command).returncode,2)
        self.assertFalse(self.updated.exists())

    def test_disjoint_actions_and_real_original_bytes(self):
        before=sha(self.source)
        self.assertEqual(self.prepare('--source-quiescent','--verify-only').returncode,2)
        self.assertFalse(self.review.exists())
        self.assertEqual(self.invoke('--prepare-foundry-legacy',self.source,'--legacy-output',self.source,
                                     '--source-quiescent').returncode,2)
        self.assertEqual(sha(self.source),before)
        link=self.root/'linked-source.sqlite'
        os.link(self.source,link)
        self.assertEqual(self.prepare('--source-quiescent').returncode,2)
        self.assertEqual(sha(link),before)
        self.assertFalse(self.review.exists())

if __name__=='__main__':
    unittest.main()
