import ast
from collections import Counter
from contextlib import closing
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
content=load('systems_content',R/'scripts/systems_content.py')
lab=load('systems_lab',R/'labs/systems-workshop/offline_lab.py')

class Content(unittest.TestCase):
 def test_eight_lessons_and_existing_schema(self):
  self.assertEqual(len(content.LESSONS),8);self.assertEqual(len({x['id'] for x in content.LESSONS}),8)
  for x in content.LESSONS:
   with self.subTest(id=x['id']):
    self.assertEqual(len(x['explain']),6);self.assertGreaterEqual(len(' '.join(x['explain']).split()),250)
    self.assertEqual(len(x['lab']),6);self.assertEqual(len(x['learningGoals']),3)
    self.assertEqual(len(x['evidence']),3);self.assertTrue(x['limitations']);self.assertTrue(x['sources'])
    self.assertEqual(x['category'],'Systems');self.assertTrue(x['depth'].startswith('applied'))
 def test_twentyfour_unique_balanced_checks(self):
  checks=[c for x in content.LESSONS for c in [x]+x['additionalChecks']]
  self.assertEqual(len(checks),24);self.assertEqual(len({x['question'] for x in checks}),24)
  self.assertEqual(Counter(x['answer'] for x in checks),{0:6,1:6,2:6,3:6})
  for c in checks:
   self.assertEqual(len(set(c['options'])),4);self.assertIn(c['answer'],range(4));self.assertTrue(c['why'])
 def test_path_exact_and_limits_honest(self):
  self.assertEqual(content.PATH['lessonIds'],[x['id'] for x in content.LESSONS])
  self.assertIn('not complete',content.PATH['limits']);self.assertEqual(content.PATH['caseIds'],[])
 def test_primary_sources_registered(self):
  sources=json.loads((R/'research/systems-sources.json').read_text())
  urls={x['url'] for x in sources['sources']}
  for x in content.LESSONS:self.assertLessEqual(set(x['sources']),urls)
 def test_generated_documents_include_supplemental_checks(self):
  for x in content.LESSONS:
   text=(R/'docs/shared'/f"{x['id']}.md").read_text()
   for c in [x]+x['additionalChecks']:
    self.assertIn(c['question'],text);self.assertIn(c['why'],text)
   self.assertIn(x['limitations'],text)
 def test_local_markdown_links_resolve(self):
  for p in R.rglob('*.md'):
   if 'compatibility' in p.parts:continue
   for target in re.findall(r'\]\(([^)]+)\)',p.read_text()):
    if not target.startswith(('https://','http://','#')):self.assertTrue((p.parent/target).exists(),f'{p}: {target}')

class Files(unittest.TestCase):
 def test_actual_utf8_bytes_and_copy(self):
  r=lab.files_demo();self.assertEqual(r['characters'],5);self.assertEqual(r['utf8_bytes'],6);self.assertEqual(r['stat_size'],6)
  for k in ('roundtrip_text','copy_equal','expected_missing','temporary_directory_removed'):self.assertTrue(r[k])
 def test_repeat_is_independent(self):self.assertEqual(lab.files_demo(),lab.files_demo())

class Process(unittest.TestCase):
 def test_normal_child_protocol_and_cleanup(self):
  r=lab.child_case('normal');self.assertEqual(r['stdout_lines'],['READY','PONG','BYE']);self.assertEqual(r['returncode'],0)
  self.assertFalse(r['timed_out']);self.assertTrue(r['reaped']);self.assertTrue(r['temporary_directory_removed'])
 def test_failure_child_exit_and_error(self):
  r=lab.child_case('failure');self.assertEqual(r['returncode'],7);self.assertEqual(r['stdout_lines'],[])
  self.assertIn('REQUEST_REJECTED',r['stderr_lines'][0]);self.assertTrue(r['reaped'])
 def test_timeout_kills_only_owned_child_and_reaps(self):
  r=lab.child_case('timeout');self.assertTrue(r['timed_out']);self.assertNotEqual(r['returncode'],0);self.assertTrue(r['reaped']);self.assertTrue(r['temporary_directory_removed'])
 def test_reject_arbitrary_child_mode(self):
  with self.assertRaises(ValueError):lab.child_case('bash')
 def test_explicit_args_no_shell_and_no_inherited_credentials(self):
  real=lab.subprocess.Popen;calls=[]
  def wrapped(*a,**kw):calls.append((a,kw));return real(*a,**kw)
  with patch.object(lab.subprocess,'Popen',side_effect=wrapped):lab.child_case('normal')
  args,kw=calls[0];self.assertIsInstance(args[0],list);self.assertFalse(kw['shell']);self.assertIn('-I',args[0]);self.assertIn('-S',args[0])
  self.assertLessEqual(set(kw['env']),{'SystemRoot'});self.assertTrue(Path(kw['cwd']).name.startswith('athena-system-child-'))

class Capacity(unittest.TestCase):
 def test_two_cases(self):
  a,b=lab.run('capacity');self.assertEqual(a['byte_shortfall'],lab.GIB//2);self.assertFalse(a['fits_bytes']);self.assertTrue(a['fits_file_slots'])
  self.assertTrue(b['fits_bytes']);self.assertFalse(b['fits_file_slots']);self.assertEqual(b['file_slot_shortfall'],15)
 def test_exact_fit(self):
  c=lab.fixture('capacity.json')[0];c['total_bytes']+=lab.GIB//2
  self.assertTrue(lab.capacity(c)['fits_bytes'])
 def test_units_explicit(self):self.assertEqual(lab.GIB,1073741824);self.assertNotEqual(lab.GIB,1000000000)
 def test_negative_boolean_float_rejected(self):
  for value in (-1,True,2.5,'10'):
   c=lab.fixture('capacity.json')[0];c['total_bytes']=value
   with self.subTest(value=value),self.assertRaises(ValueError):lab.capacity(c)
 def test_used_cannot_exceed_total(self):
  c=lab.fixture('capacity.json')[0];c['used_bytes']=c['total_bytes']+1
  with self.assertRaises(ValueError):lab.capacity(c)

class Config(unittest.TestCase):
 def test_exact_schema(self):self.assertEqual(lab.parse_config('{"workers":2,"queue_limit":20}'),{'workers':2,'queue_limit':20})
 def test_duplicate_rejected(self):
  with self.assertRaises(ValueError):lab.parse_config('{"workers":2,"workers":3,"queue_limit":20}')
 def test_boolean_rejected(self):
  with self.assertRaises(ValueError):lab.parse_config('{"workers":true,"queue_limit":20}')
 def test_unknown_field_rejected(self):
  with self.assertRaises(ValueError):lab.parse_config('{"workers":2,"queue_limit":20,"typo":1}')
 def test_bounds_and_type(self):
  for workers in [0,9,2.0,'2',None]:
   with self.subTest(workers=workers),self.assertRaises(ValueError):lab.parse_config(json.dumps(dict(workers=workers,queue_limit=20)))
 def test_queue_must_cover_workers(self):
  with self.assertRaises(ValueError):lab.parse_config('{"workers":4,"queue_limit":2}')
 def test_input_size(self):
  with self.assertRaises(ValueError):lab.parse_config(' '*1025)
 def test_full_change_lifecycle(self):
  r=lab.config_demo()
  for key in ['dry_run_preserved','invalid_rejected','invalid_preserved','interruption_injected','interrupted_preserved','rollback_matches_original','temporary_directory_removed']:self.assertTrue(r[key],key)
  self.assertTrue(r['applied']['changed']);self.assertFalse(r['repeated']['changed']);self.assertEqual(r['staged_files_remaining'],0)
 def test_failure_before_replace_leaves_no_backup_or_stage(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);active=root/'active.json';before=b'{"workers":2,"queue_limit":20}\n';active.write_bytes(before)
   with self.assertRaises(RuntimeError):lab.apply_config(root,'{"workers":3,"queue_limit":30}',fail_before_replace=True)
   self.assertEqual(active.read_bytes(),before);self.assertEqual(sorted(p.name for p in root.iterdir()),['active.json'])
 def test_noop_does_not_rewrite_active(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);active=root/'active.json';active.write_text('{ "workers":2, "queue_limit":20 }')
   before=active.read_bytes();stat=active.stat()
   r=lab.apply_config(root,'{"queue_limit":20,"workers":2}')
   self.assertFalse(r['changed']);self.assertEqual(active.read_bytes(),before);self.assertEqual(active.stat().st_mtime_ns,stat.st_mtime_ns)

class Dependencies(unittest.TestCase):
 def test_valid_order_satisfies_every_edge(self):
  graph=lab.fixture('dependencies.json');order=lab.dependency_order(graph)
  self.assertEqual(set(order),set(graph));self.assertEqual(len(order),len(graph))
  for n,parents in graph.items():
   for p in parents:self.assertLess(order.index(p),order.index(n))
 def test_cycle_rejected(self):
  with self.assertRaises(ValueError):lab.dependency_order({'A':['B'],'B':['A']})
 def test_unknown_prerequisite(self):
  with self.assertRaises(ValueError):lab.dependency_order({'A':['missing']})
 def test_self_cycle(self):
  with self.assertRaises(ValueError):lab.dependency_order({'A':['A']})
 def test_duplicates_rejected(self):
  with self.assertRaises(ValueError):lab.dependency_order({'A':[],'B':['A','A']})
 def test_transient_to_success(self):self.assertEqual(lab.retry_plan(['transient','transient','success'],3),{'attempts':3,'decision':'complete'})
 def test_uncertain_never_uses_next_result(self):self.assertEqual(lab.retry_plan(['uncertain','success'],3),{'attempts':1,'decision':'verify-before-retry'})
 def test_permanent_never_retried(self):self.assertEqual(lab.retry_plan(['permanent','success'],3),{'attempts':1,'decision':'stop-permanent'})
 def test_exhaustion(self):self.assertEqual(lab.retry_plan(['transient','transient','success'],2),{'attempts':2,'decision':'limit-reached'})
 def test_invalid_attempt_limit(self):
  for value in [0,11,True,'3']:
   with self.subTest(value=value),self.assertRaises(ValueError):lab.retry_plan(['success'],value)
 def test_incomplete_evidence_not_invented(self):self.assertEqual(lab.retry_plan(['transient'],3)['decision'],'more-evidence-needed')

class Database(unittest.TestCase):
 def test_full_persistent_workflow(self):
  r=lab.database_demo();expected={'stock':2,'receipts':[{'job_id':'job-001','payload':'replace filter'}]}
  self.assertEqual(r['before_close'],expected);self.assertEqual(r['primary_reopened'],expected);self.assertEqual(r['backup_reopened'],expected)
  self.assertEqual(r['backup_integrity_check'],'ok');self.assertTrue(r['conflicting_payload_rejected']);self.assertTrue(r['injected_failure_rolled_back']);self.assertTrue(r['temporary_directory_removed'])
 def test_duplicate_cannot_double_decrement(self):
  with closing(sqlite3.connect(':memory:',isolation_level=None)) as c:
   lab.initialize_database(c);lab.apply_job(c,'j','p');lab.apply_job(c,'j','p');self.assertEqual(lab.database_state(c)['stock'],2)
 def test_conflict_preserves_original(self):
  with closing(sqlite3.connect(':memory:',isolation_level=None)) as c:
   lab.initialize_database(c);lab.apply_job(c,'j','p')
   with self.assertRaises(ValueError):lab.apply_job(c,'j','different')
   self.assertEqual(lab.database_state(c),{'stock':2,'receipts':[{'job_id':'j','payload':'p'}]});self.assertFalse(c.in_transaction)
 def test_exhausted_stock_stays_nonnegative(self):
  with closing(sqlite3.connect(':memory:',isolation_level=None)) as c:
   lab.initialize_database(c)
   for i in range(3):lab.apply_job(c,str(i),'p')
   with self.assertRaises(ValueError):lab.apply_job(c,'4','p')
   self.assertEqual(lab.database_state(c)['stock'],0);self.assertEqual(len(lab.database_state(c)['receipts']),3)
 def test_injected_failure_rolls_back_both_changes(self):
  with closing(sqlite3.connect(':memory:',isolation_level=None)) as c:
   lab.initialize_database(c)
   with self.assertRaises(RuntimeError):lab.apply_job(c,'j','p',inject_failure=True)
   self.assertEqual(lab.database_state(c),{'stock':3,'receipts':[]});self.assertFalse(c.in_transaction)
 def test_payload_is_data_not_sql(self):
  with closing(sqlite3.connect(':memory:',isolation_level=None)) as c:
   lab.initialize_database(c);payload="'); DROP TABLE stock; --";lab.apply_job(c,'j',payload)
   self.assertEqual(lab.database_state(c)['stock'],2);self.assertEqual(lab.database_state(c)['receipts'][0]['payload'],payload)

class Incident(unittest.TestCase):
 def test_reconciliation(self):
  r=lab.run('incident')['reconciliation'];self.assertEqual(r['completed'],['job-001']);self.assertEqual(r['not_established_complete'],['job-002'])
 def test_unmatched_receipt_not_dropped(self):
  r=lab.reconcile_jobs([],['j']);self.assertEqual(r['receipts_without_supplied_events'],['j'])
 def test_duplicate_receipt_rejected(self):
  with self.assertRaises(ValueError):lab.reconcile_jobs([],['j','j'])
 def test_bad_event_not_treated_as_complete(self):
  with self.assertRaises(ValueError):lab.reconcile_jobs([{'job_id':'j','event':'done'}],[])

class Safety(unittest.TestCase):
 def test_all_commands_without_network(self):
  with patch.object(socket,'socket',side_effect=AssertionError('network forbidden')),patch.object(socket,'create_connection',side_effect=AssertionError('network forbidden')):
   for name in ['files','process','capacity','config','dependencies','database','incident']:self.assertIsNotNone(lab.run(name))
 def test_no_network_modules_or_os_settings_commands(self):
  source=(R/'labs/systems-workshop/offline_lab.py').read_text();tree=ast.parse(source);modules=set()
  for node in ast.walk(tree):
   if isinstance(node,ast.Import):modules.update(x.name.split('.')[0] for x in node.names)
   elif isinstance(node,ast.ImportFrom):modules.add(node.module.split('.')[0])
  self.assertFalse(modules & {'socket','urllib','requests','http'})
  for banned in ['os.system(', 'os.chmod(', 'os.kill(', 'shell=True', 'systemctl ', 'sudo ', 'schtasks']:
   self.assertNotIn(banned,source)
 def test_cli_refuses_target_path(self):
  p=subprocess.run([sys.executable,str(R/'labs/systems-workshop/offline_lab.py'),'/etc/passwd'],capture_output=True,text=True)
  self.assertNotEqual(p.returncode,0);self.assertIn('invalid choice',p.stderr)
 def test_cli_refuses_extra_command(self):
  p=subprocess.run([sys.executable,str(R/'labs/systems-workshop/offline_lab.py'),'process','bash'],capture_output=True,text=True)
  self.assertNotEqual(p.returncode,0)
 def test_unknown_command_rejected(self):
  with self.assertRaises(ValueError):lab.run('scan')

if __name__=='__main__':unittest.main(verbosity=2)
