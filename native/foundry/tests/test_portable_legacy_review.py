import hashlib
import importlib.util
import json
import os
import pathlib
import sqlite3
import stat
from contextlib import closing
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

    def test_exact_supported_fields_survive_reopen_and_reject_room_swaps(self):
        theme='frutiger-aero'
        aqua=theme+':room:aqua-atrium'
        cloud=theme+':room:cloud-terminal'
        with closing(sqlite3.connect(self.source)) as db, db:
            db.execute("INSERT INTO rooms VALUES(?,?,?,?,?,?)",
                       (cloud,theme,'district','Cloud','synthetic','{}'))
            db.execute("INSERT INTO room_soundtracks VALUES(?,?,?,?,?,?,?,?)",
                       (theme,cloud,'spotify','https://open.spotify.com/track/example',
                        'Synthetic cloud ♫','USER_ASSIGNED',None,234567890))
        before=sha(self.source)
        prepared=self.prepare('--source-quiescent')
        self.assertEqual(prepared.returncode,0,prepared.stderr)
        pin=sha(self.review)
        imported=self.invoke('--import-foundry-legacy',self.review,'--legacy-output',self.updated,
                             '--expected-legacy-sha256',pin)
        self.assertEqual(imported.returncode,0,imported.stderr)
        self.assertNotIn('Synthetic cloud',imported.stdout+imported.stderr)
        self.assertNotIn('private_marker',imported.stdout+imported.stderr)
        self.assertFalse(json.loads(imported.stdout)['lossless_migration'])
        columns='theme_id,room_id,provider,url,label,status,source_id,updated_at'
        # Independent SQLite comparison, not the Rust library used by the verifier.
        with closing(sqlite3.connect(self.source)) as db:
            expected=db.execute(f'SELECT {columns},NULL FROM room_soundtracks ORDER BY theme_id,room_id').fetchall()
        with closing(sqlite3.connect(self.updated)) as db:
            loaded=db.execute(f'SELECT {columns},updated_at_ms FROM soundtracks ORDER BY theme_id,room_id').fetchall()
            self.assertEqual(db.execute('PRAGMA user_version').fetchone(),(15,))
        self.assertEqual(loaded,expected)
        self.assertEqual(len(loaded),2)
        command=[str(BIN),'verify-legacy-soundtracks',str(self.review),str(self.updated)]
        matched=subprocess.run(command,text=True,capture_output=True)
        self.assertEqual(matched.returncode,0,matched.stderr)
        self.assertEqual(json.loads(matched.stdout),{'matched_soundtracks':2})
        with closing(sqlite3.connect(self.updated)) as db, db:
            for source,target in zip(loaded,reversed(loaded)):
                db.execute("UPDATE soundtracks SET provider=?,url=?,label=?,status=?,source_id=?,updated_at=?,updated_at_ms=? WHERE theme_id=? AND room_id=?",
                           (*source[2:],*target[:2]))
            self.assertEqual(db.execute('PRAGMA integrity_check').fetchone(),('ok',))
            self.assertEqual(db.execute('SELECT count(*) FROM soundtracks').fetchone(),(2,))
        wrong=sha(self.updated)
        rejected=subprocess.run(command,text=True,capture_output=True)
        self.assertNotEqual(rejected.returncode,0)
        self.assertIn('do not match reviewed legacy rooms',rejected.stderr)
        self.assertNotIn('Synthetic cloud',rejected.stdout+rejected.stderr)
        self.assertEqual(rejected.stdout,'')
        self.assertEqual(sha(self.updated),wrong)
        self.assertEqual(sha(self.source),before)
        self.assertEqual(sha(self.review),pin)

    def test_history_archive_preserves_utf8_events_without_logging_payloads(self):
        payload = '{"private_marker": "synthetic ♫", "number":1.00 }'
        with closing(sqlite3.connect(self.source)) as db, db:
            db.execute("UPDATE history SET payload_json=?", (payload,))
            db.execute("INSERT INTO history(event_type,payload_json,created_at) VALUES(?,?,?)",
                       ('synthetic', '[1, 2]', 1234))
        before=sha(self.source)
        result=self.prepare('--source-quiescent')
        self.assertEqual(result.returncode,0,result.stderr)
        pin=sha(self.review)
        archive=self.root/'events.json'
        command=('--archive-foundry-legacy-history',self.review,'--legacy-output',archive)
        self.assertEqual(self.invoke(*command).returncode,2)
        exported=self.invoke(*command,'--expected-legacy-sha256',pin)
        self.assertEqual(exported.returncode,0,exported.stderr)
        self.assertNotIn('private_marker',exported.stdout+exported.stderr)
        receipt=json.loads(exported.stdout)
        self.assertEqual(receipt,{'archived_history':True,'events':2,'reviewed_sha256':pin,
                                  'output_sha256':sha(archive),'lossless_migration':False})
        if os.name=='posix':
            self.assertEqual(stat.S_IMODE(archive.stat().st_mode)&0o077,0)
        events=json.loads(archive.read_bytes())['events']
        self.assertEqual([(x['id'],x['payload_json']) for x in events],[(1,payload),(2,'[1, 2]')])
        self.assertEqual(events[0]['payload_sha256'],hashlib.sha256(payload.encode()).hexdigest())
        self.assertEqual(self.invoke(*command,'--expected-legacy-sha256',pin).returncode,2)
        self.assertEqual(receipt['output_sha256'],sha(archive))
        self.assertEqual(sha(self.source),before)
        self.assertEqual(sha(self.review),pin)
        self.assertFalse(self.updated.exists())

    def test_history_rejects_malformed_payload_without_publishing_partial_file(self):
        result=self.prepare('--source-quiescent')
        self.assertEqual(result.returncode,0,result.stderr)
        archive=self.root/'events.json'
        result=self.invoke('--archive-foundry-legacy-history',self.review,'--legacy-output',archive,
                           '--expected-legacy-sha256',sha(self.review))
        self.assertEqual(result.returncode,2)
        self.assertNotIn('private_marker',result.stdout+result.stderr)
        self.assertFalse(archive.exists())

    def test_history_rejects_an_oversized_event_without_publishing(self):
        with closing(sqlite3.connect(self.source)) as db, db:
            db.execute("UPDATE history SET payload_json=?", (json.dumps("x" * (256*1024)),))
        result=self.prepare('--source-quiescent')
        self.assertEqual(result.returncode,0,result.stderr)
        archive=self.root/'events.json'
        result=self.invoke('--archive-foundry-legacy-history',self.review,'--legacy-output',archive,
                           '--expected-legacy-sha256',sha(self.review))
        self.assertEqual(result.returncode,2)
        self.assertFalse(archive.exists())

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
