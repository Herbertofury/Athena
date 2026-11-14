"""Content checks enforce scope, source provenance and fixed executable contracts."""
import collections
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import unittest
from urllib.parse import urlparse
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from aws_content import LESSONS,PATH
from render_aws_content import build

class AWSContentTests(unittest.TestCase):
 def test_structure_and_depth(self):
  self.assertEqual(len(LESSONS),10)
  self.assertEqual(len({x['id'] for x in LESSONS}),10)
  for x in LESSONS:
   with self.subTest(lesson=x['id']):
    self.assertTrue(x['id'].startswith('awsf-'))
    self.assertEqual(len(x['learningGoals']),3)
    self.assertEqual(len(x['explain']),6)
    self.assertEqual(len(x['lab']),6)
    self.assertEqual(len(x['evidence']),3)
    self.assertTrue(400 <= len(' '.join(x['explain']).split()) <= 550)
    self.assertGreater(len(x['example']),100)
    self.assertGreater(len(x['limitations']),100)
 def test_checks_balanced_and_explained(self):
  positions=[];questions=[]
  for x in LESSONS:
   checks=[x]+x['additionalChecks'];self.assertEqual(len(checks),3)
   for q in checks:
    self.assertEqual(len(q['options']),4)
    self.assertEqual(len(set(q['options'])),4)
    self.assertIn(q['answer'],range(4))
    self.assertGreater(len(q['why']),65)
    positions.append(q['answer']);questions.append(q['question'])
  counts=collections.Counter(positions)
  self.assertLessEqual(max(counts.values())-min(counts.values()),1)
  self.assertEqual(len(set(questions)),30)
 def test_sources_verified_official(self):
  register=json.loads((ROOT/'research/aws-sources.json').read_text())
  self.assertEqual(len(register['sources']),25)
  sources={s['key']:s['url'] for s in register['sources']}
  for x in LESSONS:
   self.assertGreaterEqual(len(x['sources']),2)
   self.assertEqual(x['sources'],[sources[k] for k in x['sourceKeys']])
   for u in x['sources']:
    self.assertEqual(urlparse(u).scheme,'https')
    self.assertIn(urlparse(u).netloc,('docs.aws.amazon.com','aws.amazon.com'))
 def test_commands_match_fixture_and_run(self):
  fixture=json.loads((ROOT/'labs/aws-workshop/fixtures/scenarios.json').read_text())
  for x in LESSONS:
   key=x['id'].removeprefix('awsf-')
   if key!='capstone': self.assertIn(key,fixture)
   command='python3 labs/aws-workshop/run_lab.py '+key
   self.assertEqual(x['workedCode'].splitlines()[-1],command)
   self.assertTrue(any(command in p for p in x['lab']))
   r=subprocess.run([sys.executable,'labs/aws-workshop/run_lab.py',key],cwd=ROOT,text=True,capture_output=True,check=True)
   receipt=json.loads(r.stdout)
   self.assertIs(receipt['real_aws_executed'],False)
 def test_path_and_scope(self):
  self.assertEqual(PATH['id'],'aws-workshop')
  self.assertEqual(PATH['lessonIds'],[x['id'] for x in LESSONS])
  self.assertEqual(PATH['certificationIds'],['aws-clf','aws-saa'])
  coverage=(ROOT/'docs/AWS-COVERAGE.md').read_text()
  for x in LESSONS: self.assertIn(x['id'],coverage)
  for phrase in ['October 29','approximately','3.5','4.3','partial']:
   self.assertIn(phrase,coverage)
  self.assertIn('published',LESSONS[-1]['explain'][-1])
  self.assertIn('threshold_reached',LESSONS[-2]['example'])
  self.assertIn('no timestamps',LESSONS[7]['example'])
 def test_deterministic_renderer_and_html(self):
  build()
  paths=list((ROOT/'content').glob('*.json'))+list((ROOT/'docs/shared').glob('*.md'))+[ROOT/'START-HERE.html']
  before={p:p.read_bytes() for p in paths};build()
  self.assertEqual(before,{p:p.read_bytes() for p in paths})
  self.assertEqual(json.loads((ROOT/'content/aws-lessons.json').read_text()),LESSONS)
  self.assertEqual(len(json.loads((ROOT/'content/aws-checks.json').read_text())),30)
  html=(ROOT/'START-HERE.html').read_text()
  self.assertIn('lang="en"',html);self.assertIn('Skip to workbook',html)
  self.assertIn(':focus-visible',html);self.assertEqual(html.count('<details>'),30)
  self.assertNotIn('<script',html)
  for x in LESSONS: self.assertIn('id="'+x['id']+'"',html)

if __name__=='__main__': unittest.main()
