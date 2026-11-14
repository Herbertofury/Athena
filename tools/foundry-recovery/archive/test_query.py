import contextlib
import importlib.util
import io
import json
import os
from pathlib import Path
import sqlite3
import stat
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('archive_query', Path(__file__).with_name('query.py'))
q = importlib.util.module_from_spec(spec)
spec.loader.exec_module(q)

class ArchiveTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.db = self.root / 'fixture.sqlite'
        with sqlite3.connect(self.db) as c:
            c.execute('CREATE TABLE metadata(key TEXT PRIMARY KEY,value TEXT NOT NULL)')
            c.execute("INSERT INTO metadata VALUES('schema_version','1')")
            for table in q.FIELDS:
                columns = []
                for name, kind, required, pk in q.expected_columns(table):
                    columns.append(name + ' ' + kind + (' PRIMARY KEY' if pk else '') + (' AUTOINCREMENT' if table == 'history' and pk else '') + (' NOT NULL' if required else ''))
                c.execute('CREATE TABLE '+table+' ('+','.join(columns)+')')
                values = [1 if kind=='INTEGER' else ('SECRET_PAYLOAD' if name in ('raw_json','payload_json','url','spotify_uri') else 'PRIVATE_LABEL') for name,kind,*_ in q.expected_columns(table)]
                c.execute('INSERT INTO '+table+' VALUES('+','.join('?' for _ in values)+')',values)
        self.original = self.db.read_bytes()
    def tearDown(self):
        self.temp.cleanup()
    def test_counts_stdout_has_no_values_or_paths_and_source_directory_unchanged(self):
        before = {p.name:p.read_bytes() for p in self.root.iterdir()}
        out=io.StringIO()
        with contextlib.redirect_stdout(out):self.assertEqual(q.main(['--source',str(self.db)]),0)
        result=json.loads(out.getvalue());self.assertEqual(result['counts'],dict.fromkeys(q.FIELDS,1))
        self.assertNotIn('PRIVATE_LABEL',out.getvalue());self.assertNotIn(str(self.db),out.getvalue())
        self.assertEqual(before,{p.name:p.read_bytes() for p in self.root.iterdir()})
    def test_private_projection_excludes_payload_urls_requires_explicit_selection(self):
        dest=self.root/'private.json'
        with self.assertRaises(q.Refusal):q.inspect(self.db,private_export=True,destination=dest)
        receipt=q.inspect(self.db,['music_routes','history'],private_export=True,destination=dest)
        data=dest.read_text();self.assertNotIn('SECRET_PAYLOAD',data);self.assertNotIn('spotify_uri',data);self.assertNotIn('payload_json',data);self.assertIn('PRIVATE_LABEL',data)
        self.assertEqual(stat.S_IMODE(dest.stat().st_mode),0o600);self.assertTrue(receipt['exported']);self.assertEqual(self.db.read_bytes(),self.original)
        with self.assertRaises(q.Refusal):q.inspect(self.db,['history'],private_export=True,destination=dest)
        self.assertEqual(dest.read_text(),data)
    def test_wal_sidecars_journal_symlinks_reserved_destinations(self):
        for suffix in ('-wal','-shm','-journal'):
            side=Path(str(self.db)+suffix);side.write_bytes(b'fixture')
            with self.assertRaises(q.Refusal):q.inspect(self.db)
            side.unlink()
            with self.assertRaises(q.Refusal):q.inspect(self.db,['history'],private_export=True,destination=side)
        alias=self.root/'alias';alias.symlink_to(self.db)
        with self.assertRaises(q.Refusal):q.inspect(alias)
        with sqlite3.connect(self.db) as c:c.execute('PRAGMA journal_mode=WAL')
        with self.assertRaises(q.Refusal):q.inspect(self.db)
    def test_views_extra_columns_future_schema_and_wrong_types_refused(self):
        with sqlite3.connect(self.db) as c:c.execute('DROP TABLE artist_worlds');c.execute('CREATE VIEW artist_worlds AS SELECT * FROM artist_districts')
        with self.assertRaises(q.Refusal):q.inspect(self.db)
        with sqlite3.connect(self.db) as c:c.execute("UPDATE metadata SET value='2'")
        with self.assertRaises(q.Refusal):q.inspect(self.db,['history'])
    def test_value_and_row_limits_and_default_counts_do_not_export(self):
        with sqlite3.connect(self.db) as c:c.execute('UPDATE history SET event_type=?',('x'*(q.MAX_VALUE+1),))
        self.assertEqual(q.inspect(self.db,['history'])['counts'],{'history':1})
        dest=self.root/'private.json'
        with self.assertRaises(q.Refusal):q.inspect(self.db,['history'],private_export=True,destination=dest)
        self.assertFalse(dest.exists())
        with sqlite3.connect(self.db) as c:c.executemany('INSERT INTO history(event_type,payload_json,created_at) VALUES(?,?,?)',[('x','x',0)]*q.MAX_ROWS)
        with self.assertRaises(q.Refusal):q.inspect(self.db,['history'])
    def test_source_mutation_withdraws_output_and_sanitizes_errors(self):
        original=q.fingerprint;calls=0
        def changed(source):
            nonlocal calls
            calls+=1
            if calls==3:
                with sqlite3.connect(self.db) as c:c.execute("UPDATE history SET event_type='CHANGED_PRIVATE'")
            return original(source)
        dest=self.root/'private.json'
        with patch.object(q,'fingerprint',changed):
            with self.assertRaises(q.Refusal):q.inspect(self.db,['history'],private_export=True,destination=dest)
        self.assertFalse(dest.exists())
        out=io.StringIO()
        with contextlib.redirect_stdout(out):self.assertEqual(q.main(['--source',str(self.root/'SECRET_MISSING')]),1)
        self.assertNotIn('SECRET',out.getvalue());self.assertNotIn(str(self.root),out.getvalue())
    def test_argument_errors_never_echo_paths_or_values(self):
        out=io.StringIO()
        with contextlib.redirect_stdout(out),self.assertRaises(SystemExit):q.main(['--source',str(self.db),'--table','SECRET_UNKNOWN'])
        self.assertNotIn('SECRET',out.getvalue())


class AdditionalGuards(unittest.TestCase):
    setUp = ArchiveTests.setUp
    tearDown = ArchiveTests.tearDown
    def test_extra_column_and_wrong_projected_type_are_refused(self):
        with sqlite3.connect(self.db) as c:c.execute('ALTER TABLE history ADD COLUMN unexpected TEXT')
        with self.assertRaises(q.Refusal):q.inspect(self.db,['history'])
        self.db.write_bytes(self.original)
        with sqlite3.connect(self.db) as c:c.execute('UPDATE history SET event_type=?',(sqlite3.Binary(b'private bytes'),))
        with self.assertRaises(q.Refusal):q.inspect(self.db,['history'],private_export=True,destination=self.root/'private.json')
    def test_file_output_bounds_and_symlink_parent(self):
        with patch.object(q,'MAX_FILE',99):
            with self.assertRaises(q.Refusal):q.inspect(self.db)
        with patch.object(q,'MAX_OUTPUT',8):
            with self.assertRaises(q.Refusal):q.inspect(self.db,['history'],private_export=True,destination=self.root/'private.json')
        alias=self.root/'dir-alias';alias.symlink_to(self.root,target_is_directory=True)
        with self.assertRaises(q.Refusal):q.inspect(self.db,['history'],private_export=True,destination=alias/'private.json')
        self.assertFalse((self.root/'private.json').exists())

if __name__=='__main__':unittest.main()
