"""Independent review probes; synthetic temporary databases, no lab edits."""
import importlib.util
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest

LAB = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('independent_fts_catalog', LAB / 'catalog.py')
lab = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lab)

class IndependentReview(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.connections = []
    def tearDown(self):
        for con in self.connections:
            con.close()
        self.temp.cleanup()
    def database(self, rows=(('k','oldtoken','','{}'),), **kwargs):
        path = self.root / ('test%d.db' % len(self.connections))
        con = lab.create(path, rows, **kwargs)
        self.connections.append(con)
        return con, path
    def connection(self,path):
        con = lab.connect(path)
        self.connections.append(con)
        return con
    def healthy(self,con):
        result = lab.audit(con)
        self.assertTrue(all(r['ok'] for r in result.values()), result)
    def keys(self, con, query):
        return [r['external_key'] for r in lab.search(con,query)]
    def broken_trigger(self,con, action):
        con.execute('DROP TRIGGER documents_update')
        con.execute('''CREATE TRIGGER documents_update AFTER UPDATE ON documents BEGIN
          INSERT INTO search_index(search_index,rowid,title,body)
          VALUES('delete',old.id,old.title,old.body);
          SELECT RAISE(%s, 'injected trigger failure');
          INSERT INTO search_index(rowid,title,body) VALUES(new.id,new.title,new.body);
          END''' % action)

    def test_commit_busy_rolls_back_written_data_and_postings(self):
        writer,path=self.database(); reader=self.connection(path)
        reader.execute('BEGIN'); before=lab.rows(reader)
        observed=[]
        def before_commit(c): observed.append(self.keys(c,'newtoken'))
        with self.assertRaises(sqlite3.OperationalError) as error:
            lab.put(writer,'k','newtoken',after_write=before_commit)
        self.assertEqual(error.exception.sqlite_errorname,'SQLITE_BUSY')
        self.assertEqual(observed,[['k']])
        self.assertFalse(writer.in_transaction)
        self.assertEqual(lab.rows(writer),before)
        self.assertEqual(self.keys(writer,'newtoken'),[])
        reader.execute('ROLLBACK'); self.healthy(writer)

    def test_commit_busy_rebuild_restores_original_drift(self):
        writer,path=self.database(backfill=False); reader=self.connection(path)
        reader.execute('BEGIN'); before=lab.rows(reader)
        observed=[]
        def before_commit(c): observed.append(self.keys(c,'oldtoken'))
        with self.assertRaises(sqlite3.OperationalError) as error:
            lab.rebuild(writer,after_rebuild=before_commit)
        self.assertEqual(error.exception.sqlite_errorname,'SQLITE_BUSY')
        self.assertEqual(observed,[['k']])
        self.assertFalse(writer.in_transaction)
        self.assertEqual(lab.rows(writer),before)
        self.assertEqual(self.keys(writer,'oldtoken'),[])
        reader.execute('ROLLBACK')
        self.assertFalse(lab.audit(writer)['fts_external_content']['ok'])

    def test_dbapi_commit_and_rollback_are_noops_in_this_mode(self):
        con,_=self.database(); before=lab.rows(con)
        with self.assertRaises(KeyboardInterrupt):
            with lab.transaction(con):
                con.execute("UPDATE documents SET title='newtoken'")
                self.assertTrue(con.in_transaction)
                con.commit(); self.assertTrue(con.in_transaction)
                con.rollback(); self.assertTrue(con.in_transaction)
                self.assertEqual(self.keys(con,'newtoken'),['k'])
                raise KeyboardInterrupt('synthetic cancellation')
        self.assertFalse(con.in_transaction)
        self.assertEqual(lab.rows(con),before); self.healthy(con)

    def test_fail_abort_and_rollback_trigger_exceptions_leave_no_partial_commit(self):
        for action in ('FAIL','ABORT','ROLLBACK'):
            with self.subTest(action=action):
                con,_=self.database(); before=lab.rows(con)
                self.broken_trigger(con,action)
                with self.assertRaisesRegex(sqlite3.IntegrityError,'injected'):
                    lab.put(con,'k','newtoken')
                self.assertFalse(con.in_transaction)
                self.assertEqual(lab.rows(con),before)
                self.assertEqual(self.keys(con,'oldtoken'),['k'])
                self.assertEqual(self.keys(con,'newtoken'),[])
                self.healthy(con)

    def test_missing_triggers_pass_audit_and_rebuild_does_not_repair_schema(self):
        con,_=self.database()
        for name in ('documents_insert','documents_update','documents_delete'):
            con.execute('DROP TRIGGER '+name)
        self.healthy(con)
        lab.rebuild(con); self.healthy(con)
        self.assertEqual(con.execute("SELECT count(*) FROM sqlite_schema WHERE type='trigger'").fetchone()[0],0)
        lab.put(con,'k','newtoken')
        self.assertEqual(self.keys(con,'oldtoken'),['k'])
        self.assertEqual(self.keys(con,'newtoken'),[])
        self.assertFalse(lab.audit(con)['fts_external_content']['ok'])

    def test_recursive_triggers_on_paired_replace_control(self):
        con,_=self.database(); con.execute('PRAGMA recursive_triggers=ON')
        con.execute("INSERT OR REPLACE INTO documents VALUES(1,'k','newtoken','','{}')")
        self.assertEqual(self.keys(con,'oldtoken'),[])
        self.assertEqual(self.keys(con,'newtoken'),['k']); self.healthy(con)

    def test_replace_new_rowid_off_produces_detectable_orphan(self):
        con,_=self.database(); con.execute('PRAGMA recursive_triggers=OFF')
        con.execute("INSERT OR REPLACE INTO documents VALUES(2,'k','newtoken','','{}')")
        with self.assertRaisesRegex(RuntimeError,'orphan'):
            lab.search(con,'oldtoken')
        self.assertEqual(self.keys(con,'newtoken'),['k'])
        self.assertFalse(lab.audit(con)['fts_external_content']['ok'])

    def test_wal_exit_before_and_after_commit_reopened(self):
        for stage in ('before_commit','after_commit'):
            with self.subTest(stage=stage):
                con,path=self.database([('fixture:1','oldtoken','','{"warning":"retained","phase":"old"}')],wal=True)
                con.close(); self.connections.remove(con)
                p=subprocess.run([sys.executable,'-B',str(LAB/'exit_writer.py'),str(path),stage],capture_output=True,check=False,timeout=10)
                self.assertEqual(p.returncode,71); self.assertEqual(p.stderr,b'')
                receipt=json.loads(p.stdout)
                self.assertEqual(receipt['in_transaction'],stage=='before_commit')
                reopened=self.connection(path)
                title='oldtoken' if stage=='before_commit' else 'newtoken'
                phase='old' if stage=='before_commit' else 'new'
                self.assertEqual(self.keys(reopened,title),['fixture:1'])
                self.assertEqual(self.keys(reopened,'newtoken' if title=='oldtoken' else 'oldtoken'),[])
                self.assertEqual(json.loads(lab.exact(reopened,'fixture:1')['metadata_json']),{'warning':'retained','phase':phase})
                self.healthy(reopened)

    def test_reinsert_reusing_rowid_has_no_old_terms(self):
        con,_=self.database(); original=lab.exact(con,'k')['id']
        lab.remove(con,'k'); lab.put(con,'different','newtoken','bodytoken','opaque receipt')
        self.assertEqual(lab.exact(con,'different')['id'],original)
        self.assertEqual(self.keys(con,'oldtoken'),[])
        self.assertEqual(self.keys(con,'newtoken'),['different']); self.healthy(con)

    def test_audit_busy_is_distinct_from_corruption(self):
        writer,path=self.database(); other=self.connection(path)
        writer.execute('BEGIN IMMEDIATE')
        report=lab.audit(other)
        self.assertTrue(all(not r['ok'] for r in report.values()))
        self.assertTrue(all(r['error']['sqlite_errorname']=='SQLITE_BUSY' for r in report.values()),report)
        self.assertFalse(other.in_transaction)
        writer.execute('ROLLBACK'); self.healthy(other)

    def test_nested_rebuild_and_audit_leave_caller_transaction_untouched(self):
        con,_=self.database(); con.execute('BEGIN')
        for action in (lab.rebuild,lab.audit):
            with self.assertRaisesRegex(ValueError,'caller transaction'):
                action(con)
            self.assertTrue(con.in_transaction)
        con.execute('ROLLBACK'); self.healthy(con)

    def test_actual_rebuild_api_interrupted_inside_sql_restores_prior_state(self):
        con,_=self.database([(str(i),'gold '*50,'','{}') for i in range(500)],backfill=False)
        before=lab.rows(con); calls=0; observed=[]
        def stop():
            nonlocal calls
            calls += 1
            return int(calls>=10)
        def trace(sql):
            if sql=="INSERT INTO search_index(search_index) VALUES('rebuild')":
                observed.append(sql)
                con.set_progress_handler(stop,100)
        con.set_trace_callback(trace)
        try:
            with self.assertRaises(sqlite3.OperationalError) as error:
                lab.rebuild(con)
            self.assertEqual(error.exception.sqlite_errorname,'SQLITE_INTERRUPT')
            self.assertFalse(con.in_transaction)
        finally:
            con.set_progress_handler(None,0); con.set_trace_callback(None)
        self.assertEqual(len(observed),1); self.assertGreaterEqual(calls,10)
        self.assertEqual(lab.rows(con),before); self.assertEqual(self.keys(con,'gold'),[])
        self.assertFalse(lab.audit(con)['fts_external_content']['ok'])
        lab.rebuild(con); self.healthy(con)

    def test_multirow_update_unique_constraint_restores_statement(self):
        con,_=self.database([('k1','oldtoken','','{}'),('k2','secondtoken','','{}')]); before=lab.rows(con)
        with self.assertRaises(sqlite3.IntegrityError):
            with lab.transaction(con):
                con.execute("UPDATE documents SET external_key='collision',title='newtoken'")
        self.assertEqual(lab.rows(con),before)
        self.assertEqual(self.keys(con,'newtoken'),[]); self.healthy(con)

if __name__=='__main__': unittest.main(verbosity=2)
