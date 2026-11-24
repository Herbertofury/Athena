"""Actual SQLite/CSV and curriculum checks. Not a learner or certification grade."""
import ast
from collections import Counter
import importlib.util
import json
from pathlib import Path
import re
import socket
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
R=Path(__file__).resolve().parents[1]
def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
L=load('data_lab',R/'labs/data-workshop/lab.py')
C=load('data_content',R/'scripts/data_content.py')
HEADER=','.join(L.HEADERS['tickets'])+'\n'
ROW='T-001,Q-R,2026-11-01T00:00:00Z,closed,30,"Screen, hinge"\n'
def cli(*args):return subprocess.run([sys.executable,'labs/data-workshop/run_lab.py',*args],cwd=R,capture_output=True,text=True,timeout=30)

class CsvTests(unittest.TestCase):
    def test_quoted_comma(self):self.assertEqual(L.parse_csv('tickets',HEADER+ROW)[0][-1],'Screen, hinge')
    def test_empty_work_is_none_not_zero(self):
        self.assertIsNone(L.parse_csv('tickets',HEADER+ROW.replace(',30,',',,'))[0][4])
        self.assertEqual(L.parse_csv('tickets',HEADER+ROW.replace(',30,',',0,'))[0][4],0)
    def test_minutes_reject_invalid_lexical_values(self):
        for value in ['NULL','-1','+1','1.5',' 1','１','1441','10000']:
            with self.subTest(value=value),self.assertRaises(ValueError):L.parse_csv('tickets',HEADER+ROW.replace(',30,',','+value+','))
    def test_minutes_accept_boundaries(self):
        for value in ['0','1440']:
            self.assertEqual(L.parse_csv('tickets',HEADER+ROW.replace(',30,',','+value+','))[0][4],int(value))
    def test_duplicate_key_rejected(self):
        with self.assertRaises(ValueError):L.parse_csv('tickets',HEADER+ROW+ROW)
    def test_wrong_header_or_order(self):
        for header in ['',HEADER.replace('ticket_id,queue_id','queue_id,ticket_id'),HEADER.rstrip()+',extra\n']:
            with self.subTest(),self.assertRaises(ValueError):L.parse_csv('tickets',header+ROW)
    def test_wrong_column_count_and_blank_record(self):
        for row in ['T-001,Q-R\n','\n',ROW.rstrip()+',extra\n']:
            with self.subTest(),self.assertRaises(ValueError):L.parse_csv('tickets',HEADER+row)
    def test_header_only_is_valid_empty(self):self.assertEqual(L.parse_csv('tickets',HEADER),[])
    def test_invalid_csv_quote(self):
        with self.assertRaises(ValueError):L.parse_csv('tickets',HEADER+'T-001,Q-R,2026-11-01T00:00:00Z,open,0,"unfinished\n')
    def test_size_and_type_bounds(self):
        for text in ['x'*32769,None,b'csv','é'*16385]:
            with self.subTest(),self.assertRaises(ValueError):L.parse_csv('tickets',text)
    def test_status_and_identifiers(self):
        for row in [ROW.replace('closed','pending'),ROW.replace('T-001','T-1'),ROW.replace('Q-R','q-r')]:
            with self.subTest(),self.assertRaises(ValueError):L.parse_csv('tickets',HEADER+row)
    def test_label_bounds(self):
        for value in ['', ' padded', 'x'*101, 'line\nfeed']:
            with self.subTest(value=value),self.assertRaises(ValueError):L.label(value)
    def test_real_calendar_date(self):
        for value in ['2026-02-30T00:00:00Z','2026-11-01T24:00:00Z','2026-11-01T00:00:00+00:00','2026-1-1T00:00:00Z',None]:
            with self.subTest(value=value),self.assertRaises(ValueError):L.timestamp(value)
        self.assertEqual(L.timestamp('2024-02-29T00:00:00Z'),'2024-02-29T00:00:00Z')
    def test_touches_cannot_have_missing_minutes(self):
        with self.assertRaises(ValueError):L.parse_csv('touches','touch_id,ticket_id,minutes\nX-001,T-001,\n')
    def test_reader_enforces_byte_cap(self):
        with tempfile.TemporaryDirectory() as name:
            p=Path(name)/'synthetic.txt';p.write_bytes(b'12345')
            self.assertEqual(L.bounded_text(p,5),'12345')
            with self.assertRaises(ValueError):L.bounded_text(p,4)

class SqlTests(unittest.TestCase):
    def setUp(self):self.conn=L.load_database()
    def tearDown(self):self.conn.close()
    def test_fixture_counts(self):
        self.assertEqual([self.conn.execute('SELECT COUNT(*) FROM '+name).fetchone()[0] for name in ['queues','tickets','touches']],[4,9,9])
    def test_foreign_keys_enabled(self):self.assertEqual(self.conn.execute('PRAGMA foreign_keys').fetchone()[0],1)
    def test_strict_tables_enabled(self):
        rows=self.conn.execute('PRAGMA table_list').fetchall()
        self.assertTrue(all(row['strict']==1 for row in rows if row['name'] in ['queues','tickets','touches','calendar']))
    def test_main_cohort_order(self):self.assertEqual([r['ticket_id'] for r in L.query(self.conn,'filters')],['T-001','T-002','T-003','T-004','T-005','T-009','T-006'])
    def test_boundary_rows(self):
        ids={r['ticket_id'] for r in L.query(self.conn,'filters')};self.assertIn('T-001',ids);self.assertNotIn('T-007',ids);self.assertNotIn('T-008',ids)
    def test_main_metrics(self):
        r=L.query(self.conn,'metrics')[0]
        self.assertEqual({k:r[k] for k in ['tickets','closed','observed_work_values','missing_work_values','zero_work_values','work_minutes','mean_observed_work_minutes']},{'tickets':7,'closed':5,'observed_work_values':4,'missing_work_values':3,'zero_work_values':1,'work_minutes':105,'mean_observed_work_minutes':26.25})
        self.assertAlmostEqual(r['closed_share'],5/7)
    def test_empty_cohort_contract(self):
        r=L.query(self.conn,'metrics',{'start':'2026-11-06T00:00:00Z','end':'2026-11-07T00:00:00Z'})[0]
        for k in ['tickets','closed','observed_work_values','missing_work_values','zero_work_values']:self.assertEqual(r[k],0)
        for k in ['work_minutes','mean_observed_work_minutes','closed_share']:self.assertIsNone(r[k])
    def test_zero_imputation_answers_different_question(self):
        value=self.conn.execute('SELECT AVG(COALESCE(work_minutes,0)) FROM tickets WHERE opened_at>=:start AND opened_at<:end',L.WINDOW).fetchone()[0]
        self.assertEqual(value,15);self.assertNotEqual(value,L.query(self.conn,'metrics')[0]['mean_observed_work_minutes'])
    def test_groups_order_and_counts(self):
        rows=L.query(self.conn,'groups');self.assertEqual([r['queue_name'] for r in rows],['Access','Repair','Setup','Training']);self.assertEqual([r['tickets'] for r in rows],[3,3,1,0])
    def test_group_measures(self):
        rows=L.query(self.conn,'groups');self.assertEqual([r['work_minutes'] for r in rows],[0,60,45,None]);self.assertEqual([r['observed_work_values'] for r in rows],[1,2,1,0])
    def test_empty_group_not_observed_zero(self):
        access,_,_,training=L.query(self.conn,'groups')
        self.assertEqual(access['mean_observed_work_minutes'],0);self.assertIsNone(training['mean_observed_work_minutes']);self.assertIsNone(training['closed_share'])
    def test_join_fanout_detected(self):
        r=L.query(self.conn,'joins_naive')[0];self.assertEqual(r['joined_rows'],10);self.assertEqual(r['distinct_tickets'],7);self.assertEqual(r['repeated_work_minutes'],225)
    def test_distinct_value_shortcut_detected(self):
        wrong=L.query(self.conn,'joins_naive')[0]['distinct_value_work_minutes'];self.assertEqual(wrong,75);self.assertNotEqual(wrong,105)
    def test_preaggregation_preserves_grain(self):self.assertEqual(L.query(self.conn,'joins_correct')[0],{'ticket_rows':7,'work_minutes':105,'touch_rows':7,'touch_minutes':55})
    def test_correct_join_reconciles_base_metric(self):self.assertEqual(L.query(self.conn,'joins_correct')[0]['work_minutes'],L.query(self.conn,'metrics')[0]['work_minutes'])
    def test_naive_count_star_empty_queue_pitfall(self):
        r=self.conn.execute("SELECT COUNT(*) FROM queues q LEFT JOIN tickets t ON q.queue_id=t.queue_id AND t.opened_at>=:start AND t.opened_at<:end WHERE q.queue_id='Q-T'",L.WINDOW).fetchone()[0]
        self.assertEqual(r,1);self.assertEqual(L.query(self.conn,'groups')[-1]['tickets'],0)
    def test_daily_counts_and_window(self):
        rows=L.query(self.conn,'dates',L.DATE_WINDOW);self.assertEqual([r['opened_tickets'] for r in rows],[3,4,1,0]);self.assertEqual([r['running_opened_tickets'] for r in rows],[3,7,8,8])
    def test_daily_reconciles_same_wider_cohort(self):
        rows=L.query(self.conn,'dates',L.DATE_WINDOW);metrics=L.query(self.conn,'metrics',L.DATE_WINDOW)[0];self.assertEqual(sum(r['opened_tickets'] for r in rows),metrics['tickets']);self.assertEqual(metrics['tickets'],8)
    def test_invalid_interval(self):
        for window in [{'start':L.WINDOW['start'],'end':L.WINDOW['start']},{'start':'bad','end':L.WINDOW['end']},{'start':L.WINDOW['start']},dict(L.WINDOW,extra=1)]:
            with self.subTest(),self.assertRaises(ValueError):L.query(self.conn,'filters',window)
    def test_daily_rejects_nonmidnight_and_outside_calendar(self):
        for window in [{'start':'2026-11-01T01:00:00Z','end':'2026-11-03T00:00:00Z'},{'start':'2026-10-31T00:00:00Z','end':'2026-11-03T00:00:00Z'},{'start':'2026-11-01T00:00:00Z','end':'2026-11-06T00:00:00Z'}]:
            with self.subTest(),self.assertRaises(ValueError):L.query(self.conn,'dates',window)
    def test_unknown_query_rejected(self):
        with self.assertRaises(ValueError):L.query(self.conn,'../schema')
    def test_quote_remains_bound_data(self):
        self.conn.execute('INSERT INTO queues VALUES (?,?)',('Q-Z',"O'Brien"));self.assertEqual(self.conn.execute('SELECT queue_name FROM queues WHERE queue_id=?',('Q-Z',)).fetchone()[0],"O'Brien")
    def test_orphan_reference_rejected(self):
        with self.assertRaises(sqlite3.IntegrityError):self.conn.execute('INSERT INTO touches VALUES (?,?,?)',('X-999','T-999',1))
    def test_duplicate_identifier_rejected(self):
        with self.assertRaises(sqlite3.IntegrityError):self.conn.execute('INSERT INTO queues VALUES (?,?)',('Q-R','Other'))
    def test_check_constraint_rejects_status(self):
        with self.assertRaises(sqlite3.IntegrityError):self.conn.execute("UPDATE tickets SET status='unknown' WHERE ticket_id='T-001'")
    def test_strict_type_rejects_non_numeric_minutes(self):
        with self.assertRaises(sqlite3.IntegrityError):self.conn.execute('UPDATE tickets SET work_minutes=? WHERE ticket_id=?',('not numeric','T-001'))
    def test_strict_can_convert_numeric_text(self):
        self.conn.execute('UPDATE tickets SET work_minutes=? WHERE ticket_id=?',('12','T-001'));self.assertEqual(self.conn.execute("SELECT typeof(work_minutes) FROM tickets WHERE ticket_id='T-001'").fetchone()[0],'integer')
    def test_actual_batch_rollback(self):
        r=L.quality_demo(self.conn);self.assertTrue(r['invalid_batch_rejected']);self.assertEqual((r['before_rows'],r['after_rows']),(9,9));self.assertTrue(r['first_batch_row_absent']);self.assertEqual(r['foreign_key_violations'],[]);self.assertEqual(r['integrity_check'],'ok')
    def test_rollback_repeated_does_not_accumulate(self):self.assertEqual(L.quality_demo(self.conn),L.quality_demo(self.conn))
    def test_actual_csv_export_and_cleanup(self):
        created=[];real=tempfile.TemporaryDirectory
        def track(*a,**kw):
            value=real(*a,**kw);created.append(Path(value.name));return value
        with patch.object(L.tempfile,'TemporaryDirectory',side_effect=track):r=L.export_demo(self.conn)
        self.assertEqual(r['rows'],4);self.assertTrue(r['text_roundtrip_matches']);self.assertTrue(r['temporary_directory_removed']);self.assertFalse(created[0].exists())
        self.assertEqual(r['training_row']['tickets'],'0');self.assertEqual(r['training_row']['mean_observed_work_minutes'],'')
    def test_database_is_memory_only(self):self.assertEqual(self.conn.execute('PRAGMA database_list').fetchone()['file'],'')
    def test_queries_do_not_mutate_loaded_rows(self):
        before=[tuple(r) for r in self.conn.execute('SELECT * FROM tickets ORDER BY ticket_id')]
        for name in L.QUERY_NAMES:L.query(self.conn,name,L.DATE_WINDOW if name=='dates' else L.WINDOW)
        after=[tuple(r) for r in self.conn.execute('SELECT * FROM tickets ORDER BY ticket_id')];self.assertEqual(before,after)

class PackTests(unittest.TestCase):
    def test_all_fixed_cli_commands(self):
        for name in ['profile','filters','metrics','groups','joins','dates','quality','export']:
            p=cli(name);self.assertEqual(p.returncode,0,p.stderr);out=json.loads(p.stdout);self.assertFalse(out['power_bi_executed']);self.assertEqual(out['exercise'],name)
    def test_cli_rejects_targets_paths_and_sql(self):
        for args in [('metrics','--database','personal.db'),('export','--output','report.csv'),('SELECT 1',)]:
            p=cli(*args);self.assertEqual(p.returncode,2);self.assertIn('error:',p.stderr)
    def test_sql_works_without_sockets(self):
        with patch.object(socket,'socket',side_effect=AssertionError('no network')):
            conn=L.load_database()
            try:self.assertEqual(L.query(conn,'metrics')[0]['tickets'],7)
            finally:conn.close()
    def test_no_network_shell_imports_or_external_sqlite_target(self):
        banned={'socket','requests','urllib','http','subprocess','os'}
        for p in (R/'labs/data-workshop').glob('*.py'):
            for n in ast.walk(ast.parse(p.read_text())):
                if isinstance(n,ast.Import):self.assertFalse({a.name.split('.')[0] for a in n.names}&banned)
                if isinstance(n,ast.ImportFrom):self.assertNotIn((n.module or '').split('.')[0],banned)
                if isinstance(n,ast.Call) and isinstance(n.func,ast.Attribute) and isinstance(n.func.value,ast.Name) and n.func.value.id=='sqlite3' and n.func.attr=='connect':self.assertEqual(n.args[0].value,':memory:')
    def test_content_depth_and_structure(self):
        self.assertEqual(len(C.LESSONS),8);self.assertEqual(len({l['id'] for l in C.LESSONS}),8)
        for l in C.LESSONS:self.assertEqual(len(l['explain']),6);self.assertGreaterEqual(len(' '.join(l['explain']).split()),250);self.assertEqual(len(l['lab']),6);self.assertEqual(len(l['learningGoals']),3);self.assertEqual(len(l['evidence']),3);self.assertEqual(l['codeLanguage'],'sql')
    def test_checks_balanced_and_distinct(self):
        checks=json.loads((R/'content/data-checks.json').read_text());self.assertEqual(len(checks),24);self.assertEqual(len({c['question'] for c in checks}),24);self.assertEqual(Counter(c['answer'] for c in checks),{0:6,1:6,2:6,3:6})
        for c in checks:self.assertEqual(len(set(c['options'])),4);self.assertGreater(len(c['why']),30)
    def test_generated_data_matches_source(self):
        self.assertEqual(C.LESSONS,json.loads((R/'content/data-lessons.json').read_text()));self.assertEqual(C.PATH,json.loads((R/'content/data-path.json').read_text()))
    def test_documents_retain_sql_and_all_checks(self):
        for l in C.LESSONS:
            text=(R/'docs/shared'/(l['id']+'.md')).read_text()
            for part in l['explain']+[l['workedCode'],l['limitations']]:self.assertIn(part,text)
            for c in [l]+l['additionalChecks']:self.assertIn(c['question'],text);self.assertIn(c['why'],text)
    def test_markdown_links(self):
        for p in [R/'README.md',*R.joinpath('docs').rglob('*.md'),*R.joinpath('labs').rglob('*.md')]:
            for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',p.read_text()):
                if not target.startswith(('http:','https:','#')):self.assertTrue((p.parent/target.split('#')[0]).is_file(),(p,target))
    def test_official_sources_and_scope(self):
        register=json.loads((R/'research/data-sources.json').read_text());self.assertEqual(len(register['sources']),11);self.assertEqual({s['url'] for s in register['sources']},set(C.S.values()))
        self.assertTrue(all(s['status']=='opened' for s in register['sources']));self.assertIn('not full PL-300',C.PATH['limits'])
        self.assertEqual(C.PATH['prerequisites'],['data-quality','data-model','databases'])
