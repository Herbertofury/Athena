import ast
from collections import Counter
import importlib.util
import json
import re
from pathlib import Path
import socket
import subprocess
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path)
 result=importlib.util.module_from_spec(spec);spec.loader.exec_module(result)
 return result
content=load('security_content',ROOT/'scripts/security_content.py')
lab=load('offline_lab',ROOT/'labs/security-foundations/offline_lab.py')

class Content(unittest.TestCase):
 def test_ten_unique_lessons(self):
  self.assertEqual(len(content.LESSONS),10)
  self.assertEqual(len({x['id'] for x in content.LESSONS}),10)
  self.assertEqual(content.PATH['lessonIds'],[x['id'] for x in content.LESSONS])
 def test_existing_schema_and_substantial_instruction(self):
  for x in content.LESSONS:
   with self.subTest(id=x['id']):
    self.assertEqual(len(x['explain']),6)
    self.assertGreaterEqual(len(' '.join(x['explain']).split()),250)
    self.assertEqual(len(x['lab']),6)
    self.assertEqual(len(x['learningGoals']),3)
    self.assertEqual(len(x['evidence']),3)
    self.assertTrue(x['limitations'])
    self.assertEqual(x['category'],'Security')
    self.assertIn('security-plus',x['tags'])
    self.assertTrue(all(s.startswith('https://') for s in x['sources']))
 def test_thirty_original_checks_balanced_and_distinct(self):
  checks=[c for x in content.LESSONS for c in [x]+x['additionalChecks']]
  self.assertEqual(len(checks),30)
  self.assertEqual(len({c['question'] for c in checks}),30)
  self.assertLessEqual(max(Counter(c['answer'] for c in checks).values())-min(Counter(c['answer'] for c in checks).values()),1)
  for c in checks:
   self.assertEqual(len(c['options']),4)
   self.assertEqual(len(set(c['options'])),4)
   self.assertIn(c['answer'],range(4));self.assertTrue(c['why'])
 def test_limits_and_version_honesty(self):
  self.assertIn('not exhaustive Security+',content.PATH['limits'])
  all_text=' '.join(str(x) for x in content.LESSONS)
  self.assertIn('Revision 3',all_text)
  self.assertNotIn('SY0-801',all_text)
  self.assertNotIn('pass guarantee',all_text)
 def test_supplemental_sources_registered(self):
  register=json.loads((ROOT/'research/security-foundations-sources.json').read_text())
  urls={s['url'] for s in register['sources']}
  for x in content.LESSONS:
   self.assertLessEqual(set(x['sources']),urls)
 def test_relative_document_links_exist(self):
  for p in ROOT.rglob('*.md'):
   if 'compatibility' in p.parts:
    continue
   for target in re.findall(r'\]\(([^)]+)\)',p.read_text()):
    if not target.startswith(('https://','http://','#')):
     self.assertTrue((p.parent/target).exists(),f'{p.name}: {target}')
 def test_docs_match_generation(self):
  for x in content.LESSONS:
   text=(ROOT/'docs/shared'/f"{x['id']}.md").read_text()
   for c in [x]+x['additionalChecks']:
    self.assertIn(c['question'],text);self.assertIn(c['why'],text)
   self.assertIn(x['limitations'],text)

class Access(unittest.TestCase):
 def test_all_eight_cases(self):
  self.assertEqual([x['allow'] for x in lab.run('access')],[True,False,False,False,True,False,True,False])
 def test_missing_fields_fail_closed(self):
  self.assertFalse(lab.access_decision({})['allow'])
 def test_truthy_string_does_not_grant_access(self):
  c=dict(lab.fixture('access-cases.json')[0]);c['active']='true'
  self.assertFalse(lab.access_decision(c)['allow'])
 def test_all_roles_cannot_export(self):
  for role in lab.PERMISSIONS:
   self.assertFalse(lab.access_decision(dict(active=True,managed_device=True,role=role,resource='bookings',action='export'))['allow'])
 def test_nonstring_resource_fails_closed(self):
  c=dict(lab.fixture('access-cases.json')[0]);c['resource']=[]
  self.assertFalse(lab.access_decision(c)['allow'])
 def test_role_cannot_override_inactive(self):
  for role in lab.PERMISSIONS:
   self.assertFalse(lab.access_decision(dict(active=False,managed_device=True,role=role,resource='accounts',action='manage'))['allow'])

class Flows(unittest.TestCase):
 def test_fixed_matrix(self):
  self.assertEqual([x['allow'] for x in lab.run('flows')],[True,True,False,False,False,False])
 def test_no_implicit_reverse_rule(self):
  self.assertFalse(lab.flow_decision(dict(source='database',destination='app',protocol='tcp',port=5432)))
 def test_malformed_port(self):
  self.assertFalse(lab.flow_decision(dict(source='staff',destination='web',protocol='tcp',port='443')))
 def test_unknown_flow(self):
  self.assertFalse(lab.flow_decision({}))

class Integrity(unittest.TestCase):
 def test_real_temporary_copy_and_change(self):
  r=lab.integrity()
  self.assertTrue(r['restored_matches']);self.assertFalse(r['changed_matches'])
  self.assertTrue(r['original_tag_valid']);self.assertFalse(r['changed_tag_valid'])
  self.assertTrue(r['temporary_directory_removed'])
  self.assertEqual(len(r['original_sha256']),64)
 def test_repeatable_no_persistent_state(self):
  self.assertEqual(lab.integrity(),lab.integrity())

class Triage(unittest.TestCase):
 def test_priority_and_unknown(self):
  r=lab.run('triage')
  self.assertEqual(r['ordered_known_findings'],['B','D','E','A'])
  self.assertEqual(r['needs_exposure_verification'],['C'])
 def test_empty(self):
  self.assertEqual(lab.rank_findings([])['ordered_known_findings'],[])
 def test_reject_duplicate(self):
  x=lab.fixture('findings.json')[0]
  with self.assertRaises(ValueError):lab.rank_findings([x,x])
 def test_invalid_score_not_ranked(self):
  for value in (float('nan'),float('inf'),-1,11,'9.8',True):
   x=dict(lab.fixture('findings.json')[0]);x['severity']=value
   with self.subTest(value=value),self.assertRaises(ValueError):lab.rank_findings([x])
 def test_known_exploitation_requires_boolean(self):
  x=dict(lab.fixture('findings.json')[0]);x['known_exploitation']='false'
  with self.assertRaises(ValueError):lab.rank_findings([x])

class Logs(unittest.TestCase):
 def test_known_timeline_and_threshold(self):
  r=lab.run('logs')
  self.assertEqual(r['distinct_events'],6);self.assertEqual(r['duplicate_deliveries'],1)
  self.assertEqual([x['id'] for x in r['timeline']],['e1','e2','e3','e4','e5','e6'])
  self.assertEqual(len(r['alerts']),1)
  self.assertEqual(r['alerts'][0]['identity'],'dana')
  self.assertEqual(r['alerts'][0]['failure_event_ids'],['e1','e3','e4'])
 def test_timezone_normalization(self):
  self.assertEqual(lab.timestamp('2026-01-15T10:04:00+01:00'),lab.timestamp('2026-01-15T09:04:00Z'))
 def test_missing_timezone_rejected(self):
  with self.assertRaises(ValueError):lab.timestamp('2026-01-15T09:04:00')
 def events(self,last):
  return [dict(id=f'x{i}',identity='x',result='failure',event_time=t,collected_time=t)
          for i,t in enumerate(['2026-01-15T09:00:00Z','2026-01-15T09:02:00Z',last])]
 def test_exact_window_included(self):
  self.assertEqual(len(lab.analyze_logs(self.events('2026-01-15T09:05:00Z'))['alerts']),1)
 def test_outside_window_excluded(self):
  self.assertEqual(lab.analyze_logs(self.events('2026-01-15T09:05:01Z'))['alerts'],[])
 def test_conflicting_duplicate_rejected(self):
  e=dict(lab.fixture('events.json')[0]);f=dict(e);f['result']='failure'
  with self.assertRaises(ValueError):lab.analyze_logs([e,f])
 def test_order_independence(self):
  e=lab.fixture('events.json')
  self.assertEqual(lab.analyze_logs(e),lab.analyze_logs(list(reversed(e))))
 def test_empty(self):
  self.assertEqual(lab.analyze_logs([])['alerts'],[])
 def test_success_not_counted_as_failure(self):
  e=self.events('2026-01-15T09:04:00Z');e[1]['result']='success'
  self.assertEqual(lab.analyze_logs(e)['alerts'],[])

class Recovery(unittest.TestCase):
 def test_separate_targets(self):
  r=lab.run('recovery')
  self.assertEqual(r['data_loss_window_minutes'],20)
  self.assertEqual(r['recovery_time_minutes'],35)
  self.assertFalse(r['rpo_met']);self.assertTrue(r['rto_met'])
 def test_exact_boundary_meets(self):
  c=lab.fixture('recovery.json');c['rpo_minutes']=20;c['rto_minutes']=35
  r=lab.recovery_metrics(c);self.assertTrue(r['rpo_met']);self.assertTrue(r['rto_met'])
 def test_invalid_time_order(self):
  c=lab.fixture('recovery.json');c['recovery_point']='2026-01-15T10:21:00Z'
  with self.assertRaises(ValueError):lab.recovery_metrics(c)
 def test_invalid_objective(self):
  for value in (float('nan'),float('inf'),-1,True,'15'):
   c=lab.fixture('recovery.json');c['rpo_minutes']=value
   with self.subTest(value=value),self.assertRaises(ValueError):lab.recovery_metrics(c)

class Safety(unittest.TestCase):
 def test_all_commands_with_network_disabled(self):
  with patch.object(socket,'socket',side_effect=AssertionError('network forbidden')),patch.object(socket,'create_connection',side_effect=AssertionError('network forbidden')):
   for command in ['access','flows','integrity','triage','logs','recovery']:
    self.assertIsNotNone(lab.run(command))
 def test_imports_do_not_include_network_or_process_modules(self):
  tree=ast.parse((ROOT/'labs/security-foundations/offline_lab.py').read_text())
  modules=set()
  for node in ast.walk(tree):
   if isinstance(node,ast.Import):modules.update(x.name.split('.')[0] for x in node.names)
   if isinstance(node,ast.ImportFrom):modules.add(node.module.split('.')[0])
  self.assertFalse(modules & {'socket','requests','urllib','http','subprocess','os'})
 def test_cli_rejects_path_or_target(self):
  r=subprocess.run([sys.executable,str(ROOT/'labs/security-foundations/offline_lab.py'),'https://example.com'],capture_output=True,text=True)
  self.assertNotEqual(r.returncode,0);self.assertIn('invalid choice',r.stderr)
 def test_unknown_command(self):
  with self.assertRaises(ValueError):lab.run('scan')

if __name__=='__main__':unittest.main(verbosity=2)
