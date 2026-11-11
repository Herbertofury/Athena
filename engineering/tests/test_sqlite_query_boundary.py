from contextlib import closing
import hashlib
import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

P = Path(__file__).resolve().parents[1]/'experiments/sqlite-query-boundary-lab/query_boundary.py'
spec = importlib.util.spec_from_file_location('query_boundary', P)
q = importlib.util.module_from_spec(spec)
# dataclasses resolves module metadata when annotations require it.
import sys
sys.modules[spec.name] = q
spec.loader.exec_module(q)


class QueryBoundaryTests(unittest.TestCase):
    def setUp(self):
        self.root = Path(tempfile.mkdtemp(prefix='athena-synthetic-query-'))
        self.db = self.root/'fixture.sqlite'
        with closing(sqlite3.connect(self.db)) as c:
            c.executescript('CREATE TABLE catalog(id INTEGER PRIMARY KEY,name TEXT,payload BLOB);'
                            'CREATE TABLE private_notes(secret TEXT);'
                            'CREATE VIEW public_view AS SELECT id,name FROM catalog;'
                            'CREATE VIEW private_view AS SELECT secret FROM private_notes;'
                            "INSERT INTO private_notes VALUES('synthetic excluded value');")
            c.executemany('INSERT INTO catalog VALUES(?,?,?)',
                          [(i, 'entry-'+str(i), bytes([i])) for i in range(20)])
            c.commit()
        self.before = hashlib.sha256(self.db.read_bytes()).hexdigest()

    def tearDown(self):
        self.assertEqual(hashlib.sha256(self.db.read_bytes()).hexdigest(), self.before)

    def run_sql(self, sql, parameters=(), **kwargs):
        return q.run_query(self.db, sql, parameters, **kwargs)

    def reject(self, sql, parameters=(), reason=None, **kwargs):
        with self.assertRaisesRegex(q.Rejected, reason or '.*'):
            self.run_sql(sql, parameters, **kwargs)

    def test_complete_query_and_exact_serialized_bytes(self):
        r = self.run_sql('SELECT id,name,payload FROM catalog ORDER BY id')
        self.assertEqual(r['state'], 'complete')
        self.assertEqual(r['row_count'], 20)
        self.assertEqual(r['rows'][0], [0, 'entry-0', {'blob_hex': '00'}])
        wire = json.dumps(r['rows'], ensure_ascii=False, separators=(',', ':')).encode()
        self.assertEqual(r['output_bytes'], len(wire))

    def test_parameters_are_values_not_sql(self):
        r = self.run_sql('SELECT id FROM catalog WHERE name=?', ("x' OR 1=1 --",))
        self.assertEqual(r['rows'], [])

    def test_count_star_handles_empty_column_authorization(self):
        self.assertEqual(self.run_sql('SELECT count(*) FROM catalog')['rows'], [[20]])

    def test_join_of_permitted_table_preserves_complete_output(self):
        r = self.run_sql('SELECT a.id,b.name FROM catalog a JOIN catalog b ON a.id=b.id ORDER BY a.id')
        self.assertEqual(r['row_count'], 20)

    def test_private_table_denied(self):
        self.reject('SELECT secret FROM private_notes')

    def test_union_cannot_smuggle_private_table(self):
        self.reject('SELECT name FROM catalog UNION ALL SELECT secret FROM private_notes')

    def test_view_indirection_denied_even_for_allowed_base_table(self):
        self.reject('SELECT * FROM public_view')
        self.reject('SELECT * FROM private_view')

    def test_cte_alias_cannot_override_table_authority(self):
        self.reject('WITH catalog AS (SELECT secret AS name FROM private_notes) SELECT name FROM catalog')

    def test_empty_result_minimum_wire_budget(self):
        self.reject('SELECT id FROM catalog WHERE id<0', policy=q.Policy(output_bytes=1))
        r = self.run_sql('SELECT id FROM catalog WHERE id<0', policy=q.Policy(output_bytes=2))
        self.assertEqual(r['rows'], [])
        self.assertEqual(r['output_bytes'], 2)

    def test_empty_column_exception_never_grants_private_table_reads(self):
        for sql in ('SELECT count(*) FROM private_notes',
                    'SELECT 1 FROM private_notes',
                    'SELECT rowid FROM private_notes',
                    'SELECT count(*) FROM sqlite_master'):
            with self.subTest(sql=sql):
                self.reject(sql, reason='query authorization denied')

    def test_wire_byte_boundaries_for_unicode_escapes_and_blobs(self):
        for value in ('café 漢字', 'quote\" slash\\ line\n', bytes([0, 255, 34])):
            with self.subTest(value=value):
                r = self.run_sql('SELECT ?', (value,))
                encoded = json.dumps(r['rows'], ensure_ascii=False,
                                     separators=(',', ':')).encode('utf-8')
                self.assertEqual(r['output_bytes'], len(encoded))
                self.reject('SELECT ?', (value,), policy=q.Policy(output_bytes=len(encoded)-1),
                            reason='byte budget exceeded')
                self.assertEqual(self.run_sql('SELECT ?', (value,),
                    policy=q.Policy(output_bytes=len(encoded)))['rows'], r['rows'])

    def test_schema_introspection_denied(self):
        self.reject('SELECT sql FROM sqlite_master')

    def test_attach_denied_no_target_created(self):
        p = self.root/'never-created.sqlite'
        self.reject('ATTACH DATABASE ? AS other', (str(p),))
        self.assertFalse(p.exists())

    def test_vacuum_into_denied_no_target_created(self):
        p = self.root/'never-vacuumed.sqlite'
        self.reject('VACUUM INTO ?', (str(p),))
        self.assertFalse(p.exists())

    def test_write_update_delete_insert_denied(self):
        for sql in ("UPDATE catalog SET name='bad'", 'DELETE FROM catalog',
                    "INSERT INTO catalog VALUES(30,'bad',NULL)"):
            with self.subTest(sql=sql):
                self.reject(sql)

    def test_schema_mutation_denied(self):
        for sql in ('CREATE TABLE forbidden(x)', 'DROP TABLE catalog',
                    'ALTER TABLE catalog ADD COLUMN x', 'CREATE TEMP TABLE tempdata(x)'):
            with self.subTest(sql=sql):
                self.reject(sql)

    def test_pragma_and_table_valued_pragma_denied(self):
        self.reject('PRAGMA user_version=99')
        self.reject("SELECT * FROM pragma_table_info('catalog')")

    def test_extension_function_denied(self):
        self.reject("SELECT load_extension('nonexistent-fixture')")

    def test_unlisted_function_denied(self):
        self.reject('SELECT randomblob(100)')

    def test_multiple_statements_refused(self):
        self.reject('SELECT id FROM catalog; DELETE FROM catalog')

    def test_row_limit_does_not_promote_partial_output(self):
        self.reject('SELECT id FROM catalog ORDER BY id', policy=q.Policy(rows=19))
        r = self.run_sql('SELECT id FROM catalog ORDER BY id', policy=q.Policy(rows=20))
        self.assertEqual(r['row_count'], 20)

    def test_byte_limit_exact_boundary(self):
        r = self.run_sql('SELECT name FROM catalog WHERE id=0')
        self.reject('SELECT name FROM catalog WHERE id=0', policy=q.Policy(output_bytes=r['output_bytes']-1))
        self.assertEqual(self.run_sql('SELECT name FROM catalog WHERE id=0',
                         policy=q.Policy(output_bytes=r['output_bytes']))['rows'], r['rows'])

    def test_oversized_sql_refused(self):
        self.reject('SELECT 1 --'+'x'*8192)

    def test_oversized_parameter_refused(self):
        self.reject('SELECT ?', ('x'*16385,))

    def test_invalid_policy_and_parameters_refused(self):
        for policy in (q.Policy(rows=True), q.Policy(output_bytes=0), q.Policy(progress_callbacks=-1)):
            with self.subTest(policy=policy):
                self.reject('SELECT 1', policy=policy)
        for params in ({'x': 1}, [object()], [2**63], [float('inf')]):
            with self.subTest(params=repr(params)):
                self.reject('SELECT ?', params)

    def test_progress_budget_stops_expensive_join(self):
        self.reject('SELECT sum(a.id+b.id+c.id+d.id) FROM catalog a,catalog b,catalog c,catalog d',
                    policy=q.Policy(progress_callbacks=2, progress_interval=10),
                    reason='progress callback budget exhausted')
        self.assertEqual(self.run_sql('SELECT count(*) FROM catalog')['rows'], [[20]])

    def test_expired_deadline_preflight(self):
        self.reject('SELECT 1', deadline=1, clock=lambda: 2)

    def test_deadline_expiry_during_execution(self):
        calls = []
        def clock():
            calls.append(1)
            return 0 if len(calls) < 4 else 2
        self.reject('SELECT sum(a.id+b.id+c.id) FROM catalog a,catalog b,catalog c',
                    deadline=1, clock=clock, policy=q.Policy(progress_interval=1),
                    reason='deadline exhausted')
        self.assertGreaterEqual(len(calls), 4)

    def test_cancellation_before_and_during_execution(self):
        self.reject('SELECT 1', cancelled=lambda: True)
        calls = []
        def cancelled():
            calls.append(1)
            return len(calls) >= 4
        self.reject('SELECT sum(a.id+b.id+c.id) FROM catalog a,catalog b,catalog c',
                    cancelled=cancelled, policy=q.Policy(progress_interval=1), reason='cancelled')

    def test_nonfinite_result_not_silently_reencoded(self):
        self.reject('SELECT 1e999')

    def test_separate_connections_do_not_share_policy(self):
        self.reject('SELECT id FROM catalog', policy=q.Policy(rows=1))
        self.assertEqual(self.run_sql('SELECT id FROM catalog')['row_count'], 20)

    def test_missing_database_is_not_created(self):
        p = self.root/'missing.sqlite'
        with self.assertRaises(sqlite3.OperationalError):
            q.run_query(p, 'SELECT 1')
        self.assertFalse(p.exists())


if __name__ == '__main__':
    unittest.main()
