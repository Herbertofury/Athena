import importlib.util
import json
from pathlib import Path
import random
import sqlite3
import subprocess
import sys
import tempfile
import unittest

LAB = Path(__file__).resolve().parents[1] / 'experiments/fts-consistency-lab'
spec = importlib.util.spec_from_file_location('fts_catalog_lab', LAB / 'catalog.py')
lab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lab)


class FtsConsistencyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.connections = []

    def tearDown(self):
        for con in self.connections:
            con.close()
        self.temp.cleanup()

    def database(self, rows=(), **kwargs):
        path = self.root / ('fixture-%s.db' % len(self.connections))
        con = lab.create(path, rows, **kwargs)
        self.connections.append(con)
        return con, path

    def healthy(self, con):
        result = lab.audit(con)
        self.assertTrue(all(v['ok'] for v in result.values()), result)

    def keys(self, con, query):
        return [r['external_key'] for r in lab.search(con, query)]

    def test_existing_path_refused(self):
        con, path = self.database()
        with self.assertRaises(FileExistsError): lab.create(path)
        self.healthy(con)

    def test_no_backfill_counts_and_internal_check_hide_missing_postings(self):
        con, _ = self.database([('k', 'gold', '', '{}')], backfill=False)
        self.assertEqual(con.execute('SELECT count(*) FROM search_index').fetchone()[0], 1)
        self.assertEqual(self.keys(con, 'gold'), [])
        audit = lab.audit(con)
        self.assertTrue(audit['sqlite_integrity']['ok'])
        self.assertTrue(audit['fts_internal']['ok'])
        self.assertFalse(audit['fts_external_content']['ok'])
        self.assertEqual(audit['fts_external_content']['error']['sqlite_errorname'], 'SQLITE_CORRUPT_VTAB')

    def test_triggers_added_after_rows_only_capture_later_rows(self):
        con, _ = self.database([('old', 'gold', '', '{}')], backfill=False)
        lab.put(con, 'new', 'gold')
        self.assertEqual(self.keys(con, 'gold'), ['new'])
        lab.rebuild(con)
        self.assertEqual(self.keys(con, 'gold'), ['old', 'new'])
        self.healthy(con)

    def test_initial_backfill_complete(self):
        con, _ = self.database([('k', 'gold', '', '{}')])
        self.assertEqual(self.keys(con, 'gold'), ['k']); self.healthy(con)

    def test_insert_update_delete_preserve_complete_metadata(self):
        con, _ = self.database()
        meta = '{ "unknown": [1, null], "warning": "kept", "creator": "fixture" }'
        lab.put(con, 'k', 'oldtoken', 'bodytoken', meta)
        original = lab.exact(con, 'k')
        self.assertEqual(lab.search(con, 'bodytoken'), [original])
        lab.put(con, 'k', 'newtoken', 'changed', meta)
        self.assertEqual(self.keys(con, 'oldtoken'), [])
        self.assertEqual(self.keys(con, 'newtoken'), ['k'])
        self.assertEqual(lab.search(con, 'changed')[0]['metadata_json'], meta)
        self.assertEqual(lab.exact(con, 'k')['id'], original['id'])
        lab.remove(con, 'k'); self.assertEqual(lab.rows(con), [])
        self.assertEqual(self.keys(con, 'newtoken'), []); self.healthy(con)

    def test_rowid_update_moves_postings(self):
        con, _ = self.database([('k', 'gold', '', '{}')])
        with lab.transaction(con): con.execute('UPDATE documents SET id=99')
        self.assertEqual(lab.search(con, 'gold')[0]['id'], 99); self.healthy(con)

    def test_metadata_only_update_remains_consistent(self):
        con, _ = self.database([('k', 'gold', '', '{}')])
        with lab.transaction(con): con.execute("UPDATE documents SET metadata_json='opaque receipt'")
        self.assertEqual(lab.search(con, 'gold')[0]['metadata_json'], 'opaque receipt'); self.healthy(con)

    def test_rollback_restores_canonical_and_postings(self):
        con, _ = self.database([('k', 'oldtoken', '', '{}')])
        before = lab.rows(con)
        def fail(c):
            self.assertEqual(self.keys(c, 'newtoken'), ['k'])
            raise RuntimeError('injected before commit')
        with self.assertRaises(RuntimeError): lab.put(con, 'k', 'newtoken', after_write=fail)
        self.assertEqual(lab.rows(con), before)
        self.assertEqual(self.keys(con, 'oldtoken'), ['k']); self.assertEqual(self.keys(con, 'newtoken'), [])
        self.healthy(con)

    def test_nested_transaction_refused_not_committed(self):
        con, _ = self.database()
        con.execute('BEGIN')
        with self.assertRaises(ValueError): lab.put(con, 'k', 'gold')
        self.assertTrue(con.in_transaction); con.execute('ROLLBACK')

    def test_stale_terms_join_to_new_metadata_and_audit_detects(self):
        con, _ = self.database([('k', 'oldtoken', '', '{}')])
        con.execute('DROP TRIGGER documents_update')
        con.execute("UPDATE documents SET title='newtoken'")
        self.assertEqual(lab.search(con, 'oldtoken')[0]['title'], 'newtoken')
        self.assertEqual(self.keys(con, 'newtoken'), [])
        self.assertFalse(lab.audit(con)['fts_external_content']['ok'])
        lab.rebuild(con)
        self.assertEqual(self.keys(con, 'oldtoken'), [])
        self.assertEqual(self.keys(con, 'newtoken'), ['k']); self.healthy(con)

    def test_orphan_is_not_silently_filtered(self):
        con, _ = self.database([('k', 'gold', '', '{}')])
        con.execute('DROP TRIGGER documents_delete'); con.execute('DELETE FROM documents')
        with self.assertRaisesRegex(RuntimeError, 'orphan'): lab.search(con, 'gold')
        self.assertFalse(lab.audit(con)['fts_external_content']['ok'])
        lab.rebuild(con); self.assertEqual(self.keys(con, 'gold'), []); self.healthy(con)

    def test_rebuild_fault_rolls_back_postings_and_canonical_data(self):
        con, _ = self.database([('k', 'gold', '', '{}')], backfill=False)
        before = lab.rows(con)
        def fail(c):
            self.assertEqual(self.keys(c, 'gold'), ['k'])
            raise RuntimeError('injected after rebuild')
        with self.assertRaises(RuntimeError): lab.rebuild(con, after_rebuild=fail)
        self.assertEqual(lab.rows(con), before); self.assertEqual(self.keys(con, 'gold'), [])
        self.assertFalse(lab.audit(con)['fts_external_content']['ok'])
        lab.rebuild(con); self.healthy(con)

    def test_rebuild_rejects_canonical_mutation_hook(self):
        con, _ = self.database([('k', 'gold', '', '{}')])
        before = lab.rows(con)
        def mutate(c): c.execute("UPDATE documents SET metadata_json='changed'")
        with self.assertRaisesRegex(RuntimeError, 'canonical'): lab.rebuild(con, after_rebuild=mutate)
        self.assertEqual(lab.rows(con), before); self.healthy(con)

    def test_interrupted_rebuild_resets_handler_then_keeps_previous_state(self):
        con, _ = self.database([(str(n), 'gold '*50, '', '{}') for n in range(500)], backfill=False)
        before = lab.rows(con); calls = 0
        def stop():
            nonlocal calls
            calls += 1
            return 1 if calls >= 10 else 0
        # Install after BEGIN so interruption occurs within rebuild, not BEGIN.
        con.execute('BEGIN IMMEDIATE'); con.set_progress_handler(stop, 100)
        try:
            with self.assertRaises(sqlite3.OperationalError) as error:
                con.execute("INSERT INTO search_index(search_index) VALUES('rebuild')")
            self.assertEqual(error.exception.sqlite_errorname, 'SQLITE_INTERRUPT')
        finally:
            con.set_progress_handler(None, 0)
            if con.in_transaction: con.execute('ROLLBACK')
        self.assertGreaterEqual(calls, 10)
        self.assertEqual(lab.rows(con), before); self.assertEqual(self.keys(con, 'gold'), [])
        self.assertFalse(lab.audit(con)['fts_external_content']['ok'])
        lab.rebuild(con); self.healthy(con)

    def test_empty_and_punctuation_query_distinct(self):
        con, _ = self.database()
        for text in ('', ' ', '\0', '\ud800'):
            with self.assertRaises(ValueError): lab.search(con, text)
        self.assertEqual(lab.search(con, '---'), [])

    def test_phrase_quotes_fts_grammar_separate_from_sql_binding(self):
        con, _ = self.database([('a', 'red', '', '{}'), ('b', 'blue', '', '{}'), ('c', 'red OR blue', '', '{}')])
        raw = [r[0] for r in con.execute('SELECT rowid FROM search_index WHERE search_index MATCH ?', ('red OR blue',))]
        self.assertEqual(len(raw), 3)
        self.assertEqual(self.keys(con, 'red OR blue'), ['c'])
        self.assertEqual(self.keys(con, 'red "OR" blue'), ['c'])
        self.assertEqual(lab.search(con, '"; DROP TABLE documents; --'), [])
        self.assertEqual(len(lab.rows(con)), 3)

    def test_exact_identifier_not_discovery_tokenization(self):
        con, _ = self.database([('Mod-A:01', 'mod a 01', '', '{}'), ('mod-a:01', 'mod a 01', '', '{}')])
        self.assertEqual(lab.exact(con, 'Mod-A:01')['id'], 1)
        self.assertEqual(lab.exact(con, 'mod-a:01')['id'], 2)
        self.assertIsNone(lab.exact(con, 'MOD-A:01'))
        self.assertEqual(self.keys(con, 'mod-a:01'), ['Mod-A:01', 'mod-a:01'])

    def test_no_accent_folding_policy(self):
        con, _ = self.database([('accent', 'café', '', '{}'), ('plain', 'cafe', '', '{}')])
        self.assertEqual(self.keys(con, 'café'), ['accent']); self.assertEqual(self.keys(con, 'cafe'), ['plain'])

    def test_repeated_rebuild_preserves_results_and_metadata(self):
        con, _ = self.database([('k', 'gold', '', '{ "x": 1 }')]); before = lab.rows(con)
        for _ in range(3): lab.rebuild(con)
        self.assertEqual(lab.rows(con), before); self.assertEqual(lab.search(con, 'gold'), before); self.healthy(con)

    def test_query_bytes_and_result_limits(self):
        con, _ = self.database([('a', 'gold', '', '{}'), ('b', 'gold', '', '{}')])
        with self.assertRaises(ValueError): lab.search(con, 'é'*129)
        for limit in (0, 101, True, 1.5):
            with self.assertRaises(ValueError): lab.search(con, 'gold', max_results=limit)
        with self.assertRaises(lab.ResultLimitExceeded): lab.search(con, 'gold', max_results=1)
        self.assertEqual(len(lab.search(con, 'gold', max_results=2)), 2)

    def test_invalid_record_fails_before_transaction(self):
        con, _ = self.database()
        for key, title in (('', 'x'), ('k', '\0'), ('k', '\ud800'), ('k', 'x'*2049)):
            with self.assertRaises(ValueError): lab.put(con, key, title)
        self.assertFalse(con.in_transaction); self.assertEqual(lab.rows(con), []); self.healthy(con)

    def test_other_writer_busy_is_not_empty_success(self):
        con, path = self.database(); other = lab.connect(path); self.connections.append(other)
        con.execute('BEGIN IMMEDIATE')
        with self.assertRaises(sqlite3.OperationalError): lab.put(other, 'k', 'gold')
        self.assertEqual(lab.rows(other), []); con.execute('ROLLBACK'); self.healthy(con)

    def test_wal_reader_pins_consistent_old_then_new_view(self):
        writer, path = self.database([('k', 'oldtoken', '', '{}')], wal=True)
        reader = lab.connect(path); self.connections.append(reader)
        reader.execute('BEGIN'); old = lab.search(reader, 'oldtoken')
        lab.put(writer, 'k', 'newtoken')
        self.assertEqual(lab.search(reader, 'oldtoken'), old)
        self.assertEqual(self.keys(reader, 'newtoken'), [])
        reader.execute('COMMIT')
        self.assertEqual(self.keys(reader, 'oldtoken'), []); self.assertEqual(self.keys(reader, 'newtoken'), ['k'])
        self.healthy(writer)

    def test_abrupt_process_exit_before_and_after_commit(self):
        for stage in ('before_commit', 'after_commit'):
            with self.subTest(stage=stage):
                con, path = self.database([('fixture:1', 'oldtoken', '', '{"warning":"retained","phase":"old"}')])
                con.close()
                p = subprocess.run([sys.executable, '-B', str(LAB / 'exit_writer.py'), str(path), stage],
                                   stdin=subprocess.DEVNULL, capture_output=True, timeout=10, check=False)
                self.assertEqual(p.returncode, 71); self.assertEqual(p.stderr, b'')
                con = lab.connect(path); self.connections.append(con)
                receipt = json.loads(p.stdout); self.assertEqual(receipt['child_view'][0]['title'], 'newtoken')
                expected = 'oldtoken' if stage == 'before_commit' else 'newtoken'
                self.assertEqual(self.keys(con, expected), ['fixture:1'])
                self.assertEqual(lab.exact(con, 'fixture:1')['title'], expected); self.healthy(con)

    def test_replace_negative_control_can_leave_stale_terms(self):
        con, _ = self.database([('k', 'oldtoken', '', '{}')])
        con.execute('PRAGMA recursive_triggers=OFF')
        con.execute("INSERT OR REPLACE INTO documents(id,external_key,title,body,metadata_json) VALUES(1,'k','newtoken','','{}')")
        self.assertEqual(self.keys(con, 'oldtoken'), ['k'])
        self.assertEqual(lab.search(con, 'oldtoken')[0]['title'], 'newtoken')
        self.assertFalse(lab.audit(con)['fts_external_content']['ok'])
        lab.rebuild(con); self.healthy(con)

    def test_healthy_audit_and_rebuild_do_not_restore_triggers(self):
        con, _ = self.database([('k', 'oldtoken', '', '{}')])
        for trigger in ('documents_insert', 'documents_update', 'documents_delete'):
            con.execute('DROP TRIGGER ' + trigger)  # Fixed owned schema names.
        self.healthy(con)
        lab.rebuild(con); self.healthy(con)
        lab.put(con, 'k', 'newtoken')
        self.assertEqual(self.keys(con, 'newtoken'), [])
        self.assertFalse(lab.audit(con)['fts_external_content']['ok'])

    def test_commit_busy_rolls_back_rows_and_postings(self):
        writer, path = self.database([('k', 'oldtoken', '', '{}')])
        reader = lab.connect(path); self.connections.append(reader)
        reader.execute('BEGIN'); old = lab.search(reader, 'oldtoken')
        inside = []
        def observe(c): inside.extend(lab.search(c, 'newtoken'))
        with self.assertRaises(sqlite3.OperationalError) as error:
            lab.put(writer, 'k', 'newtoken', after_write=observe)
        self.assertEqual(error.exception.sqlite_errorname, 'SQLITE_BUSY')
        self.assertEqual(len(inside), 1)
        self.assertFalse(writer.in_transaction)
        reader.execute('COMMIT')
        self.assertEqual(lab.search(writer, 'oldtoken'), old)
        self.assertEqual(self.keys(writer, 'newtoken'), []); self.healthy(writer)

    def test_seeded_mutations_against_ascii_token_oracle(self):
        con, _ = self.database(); expected = {}; rng = random.Random(20261111)
        tokens = ['amber', 'birch', 'cobalt', 'delta']
        for step in range(120):
            key = 'k%d' % rng.randrange(12)
            if rng.randrange(4) == 0:
                lab.remove(con, key); expected.pop(key, None)
            else:
                title = ' '.join(rng.sample(tokens, rng.randrange(1, 5)))
                meta = json.dumps({'step': step, 'warning': 'retained'})
                lab.put(con, key, title, '', meta); expected[key] = (title, meta)
            for token in tokens:
                result = lab.search(con, token)
                self.assertEqual({r['external_key'] for r in result}, {k for k,(v,m) in expected.items() if token in v.split()})
                for row in result: self.assertEqual((row['title'], row['metadata_json']), expected[row['external_key']])
            self.healthy(con)


if __name__ == '__main__': unittest.main()
