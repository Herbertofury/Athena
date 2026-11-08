"""Authoring, numeric-example and distribution contracts, not learner assessment."""
import importlib.util
import json
from pathlib import Path
import re
import unittest
from collections import Counter
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('bi_content_test',ROOT/'scripts/bi_content.py')
content=importlib.util.module_from_spec(spec);spec.loader.exec_module(content)
LESSONS=content.LESSONS
COMMANDS=['transform','model','context','dates','report','refresh','access','capstone']
class Content(unittest.TestCase):
 def test_reject_explanation_matches_bounded_raw_evidence(self):
  text=' '.join(LESSONS[0]['explain'])
  self.assertIn('raw_record',text);self.assertIn('256 characters',text)
  self.assertNotIn('rather than expecting copied raw fields',text)
 def test_eight_unique_ordered_lessons(self):
  self.assertEqual(len(LESSONS),8);self.assertEqual(len({x['id'] for x in LESSONS}),8)
  self.assertTrue(all(x['id'].startswith('bi-') for x in LESSONS))
  self.assertEqual(content.PATH['lessonIds'],[x['id'] for x in LESSONS])
  self.assertEqual(content.PATH['id'],'bi-workshop')
 def test_substantive_explanations(self):
  for item in LESSONS:
   with self.subTest(id=item['id']):
    self.assertEqual(len(item['explain']),6)
    self.assertGreaterEqual(sum(len(p.split()) for p in item['explain']),300)
    self.assertTrue(all(len(p.split())>=25 for p in item['explain']))
 def test_goals_practice_evidence_and_scope(self):
  for item in LESSONS:
   self.assertEqual(len(item['learningGoals']),3);self.assertEqual(len(item['lab']),6)
   self.assertEqual(len(item['evidence']),3);self.assertEqual(item['estimatedMinutes'],45)
   self.assertGreater(len(item['limitations']),100)
 def test_24_unique_balanced_explained_checks(self):
  checks=[q for x in LESSONS for q in [x]+x['additionalChecks']]
  self.assertEqual(len(checks),24);self.assertEqual(len({q['question'] for q in checks}),24)
  self.assertEqual(Counter(q['answer'] for q in checks),{0:6,1:6,2:6,3:6})
  for q in checks:
   self.assertEqual(len(q['options']),4);self.assertEqual(len(set(q['options'])),4)
   self.assertGreater(len(q['why']),35)
 def test_no_certification_tag_injection(self):
  for item in LESSONS:
   self.assertEqual(item['tags'],['bi','data','analytics'])
   self.assertEqual(item['category'],'Data & analytics')
 def test_only_fixed_commands_are_uncommented(self):
  for item,command in zip(LESSONS,COMMANDS):
   actual=[line.strip() for line in item['workedCode'].splitlines() if line.strip() and not line.lstrip().startswith(('#','//'))]
   self.assertEqual(actual,['python3 labs/bi-workshop/run_lab.py '+command],item['id'])
   self.assertIn('unexecuted',item['workedCode'].lower()+item['limitations'].lower())
 def test_sources_are_official_registered_https(self):
  register=json.loads((ROOT/'research/bi-sources.json').read_text())
  sources={x['url'] for x in register['sources']}
  self.assertTrue(all(u.startswith('https://learn.microsoft.com/') for u in sources))
  for item in LESSONS:self.assertTrue(set(item['sources'])<=sources)
 def test_generated_json_matches_source(self):
  self.assertEqual(json.loads((ROOT/'content/bi-lessons.json').read_text()),LESSONS)
  self.assertEqual(json.loads((ROOT/'content/bi-path.json').read_text()),content.PATH)
  checks=json.loads((ROOT/'content/bi-checks.json').read_text());self.assertEqual(len(checks),24)
  for item in LESSONS:
   for source,check in zip([item]+item['additionalChecks'],[q for q in checks if q['lessonId']==item['id']]):
    for k in ['question','options','answer','why']:self.assertEqual(source[k],check[k])
 def test_source_and_rendered_docs_agree(self):
  for item in LESSONS:
   text=(ROOT/'docs/shared'/f"{item['id']}.md").read_text()
   for p in item['explain']+item['lab']+item['evidence']+[item['limitations']]:self.assertIn(p,text)
 def test_scope_is_not_vendor_execution(self):
  scope=content.PATH['limits']
  for term in ['Power BI','DAX','unexecuted']:
   self.assertIn(term,scope)
  self.assertIn('not',scope.lower())
 def test_no_superseded_fixture_values(self):
  text=json.dumps(LESSONS)
  for stale in ['18500','18,500','730 dates','2025-01-15','15000 cents','Paper 10500']:
   self.assertNotIn(stale,text)
 def test_script_free_local_guide(self):
  class Parser(HTMLParser):
   def __init__(self):super().__init__();self.ids=[];self.href=[];self.scripts=[];self.details=0
   def handle_starttag(self,tag,attrs):
    attrs=dict(attrs)
    if 'id' in attrs:self.ids.append(attrs['id'])
    if tag=='a':self.href.append(attrs.get('href',''))
    if tag=='script':self.scripts.append(attrs)
    if tag=='details':self.details+=1
  p=Parser();p.feed((ROOT/'START-HERE.html').read_text())
  self.assertEqual(p.scripts,[]);self.assertEqual(len(p.ids),len(set(p.ids)));self.assertEqual(p.details,24)
  for item in LESSONS:self.assertIn(item['id'],p.ids)
  for href in p.href:
   if href.startswith('#'):self.assertIn(href[1:],p.ids)
   elif not href.startswith('https://'):self.assertTrue((ROOT/href).is_file(),href)
if __name__=='__main__':unittest.main()
