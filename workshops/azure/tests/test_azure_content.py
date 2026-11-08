"""Content, rendering and fixed-output contract checks; no Azure access."""
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import subprocess
import sys
import unittest
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from azure_content import LESSONS, PATH, SOURCES

class Links(HTMLParser):
    def __init__(self): super().__init__();self.ids=[];self.links=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if 'id' in a:self.ids.append(a['id'])
        if tag=='a':self.links.append(a.get('href',''))

class ContentTests(unittest.TestCase):
    def test_depth_and_shape(self):
        self.assertEqual(len(LESSONS),10)
        self.assertEqual(len({x['id'] for x in LESSONS}),10)
        answers=[]
        for x in LESSONS:
            with self.subTest(lesson=x['id']):
                self.assertEqual(len(x['explain']),6)
                self.assertTrue(400<=len(' '.join(x['explain']).split())<=550)
                self.assertEqual(len(x['learningGoals']),3)
                self.assertEqual(len(x['lab']),6)
                self.assertEqual(len(x['evidence']),3)
                self.assertGreaterEqual(len(x['example'].split()),60)
                self.assertIn('unperformed',x['lab'][-1])
                for q in [x]+x['additionalChecks']:
                    self.assertEqual(len(q['options']),4)
                    self.assertEqual(len(set(q['options'])),4)
                    self.assertTrue(0<=q['answer']<4)
                    self.assertGreater(len(q['why']),50)
                    answers.append(q['answer'])
        self.assertEqual(len(answers),30)
        self.assertLessEqual(max(answers.count(i) for i in range(4))-min(answers.count(i) for i in range(4)),1)
    def test_sources_and_boundaries(self):
        for x in LESSONS:
            self.assertGreaterEqual(len(x['sources']),2)
            for k,u in zip(x['sourceKeys'],x['sources']):
                self.assertEqual(SOURCES[k]['url'],u)
                self.assertTrue(u.startswith('https://learn.microsoft.com/'))
                self.assertTrue(SOURCES[k]['scope'])
            self.assertIn('enrichment',x['depth'])
            self.assertIn('unperformed',x['depth'])
        self.assertEqual(PATH['certificationIds'],['az-900','az-104'])
        self.assertIn('incomplete',PATH['limits'])
        self.assertEqual(json.loads((ROOT/'research/azure-sources.json').read_text())['reviewedAt'],'2026-11-08')
    def test_json_matches_source(self):
        self.assertEqual(json.loads((ROOT/'content/azure-lessons.json').read_text()),LESSONS)
        self.assertEqual(json.loads((ROOT/'content/azure-path.json').read_text()),PATH)
        checks=json.loads((ROOT/'content/azure-checks.json').read_text())
        self.assertEqual(len(checks),30)
        for x in LESSONS:
            for i,q in enumerate([x]+x['additionalChecks'],1):
                got=next(c for c in checks if c['id']==x['id']+'-'+str(i))
                for k in ('question','options','answer','why'):self.assertEqual(got[k],q[k])
    def test_html_links_ids_and_accessibility(self):
        s=(ROOT/'START-HERE.html').read_text();p=Links();p.feed(s)
        self.assertEqual(len(set(p.ids)),len(p.ids))
        self.assertIn('lang="en"',s);self.assertIn('Skip to workbook',s)
        self.assertIn(':focus-visible',s);self.assertNotIn('<script',s)
        for x in LESSONS:self.assertIn(x['id'],p.ids)
        for u in p.links:
            if u.startswith('#'):self.assertIn(u[1:],p.ids)
            elif not u.startswith('https://'):self.assertTrue((ROOT/u).is_file(),u)
    def test_render_determinism(self):
        paths=[ROOT/'START-HERE.html',*sorted((ROOT/'content').glob('*.json')),*sorted((ROOT/'docs/shared').glob('*.md')),ROOT/'docs/paths/azure-workshop.md']
        before={p:hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
        subprocess.run([sys.executable,str(ROOT/'scripts/render_azure_content.py')],check=True,capture_output=True)
        self.assertEqual(before,{p:hashlib.sha256(p.read_bytes()).hexdigest() for p in paths})
    def test_worked_receipts(self):
        outputs={}
        for lesson in LESSONS:
            command=lesson['id'][4:]
            self.assertTrue(lesson['workedCode'].endswith('run_lab.py '+command))
            r=subprocess.run([sys.executable,'labs/azure-workshop/run_lab.py',command],cwd=ROOT,capture_output=True,text=True,check=True)
            outputs[command]=json.loads(r.stdout)
            self.assertIs(outputs[command]['real_azure_executed'],False)
        self.assertEqual(outputs['hierarchy']['ancestors_by_scope']['vm'],['rg','sub','root'])
        self.assertEqual([d['allowed'] for d in outputs['access']['decisions']],[True,False])
        self.assertEqual([d['blocked'] for d in outputs['governance']['lock_decisions']],[True,False])
        self.assertEqual(outputs['storage']['matching_options'],['RA-GZRS'])
        self.assertEqual(outputs['network']['routes'][0]['selected_route_ids'],['private-a','private-b'])
        self.assertIs(outputs['network']['routes'][0]['ambiguous'],True)
        self.assertIs(outputs['network']['nsg_cases'][0]['allowed'],False)
        self.assertEqual([outputs['compute'][k] for k in ['required_instances','shortfall','capped_instances','capacity_sufficient']],[8,4,6,False])
        self.assertEqual([w['status'] for w in outputs['monitoring']['windows']],['breach','insufficient_data','within_threshold'])
        self.assertEqual([w['mean'] for w in outputs['monitoring']['windows']],[90,25,85])
        self.assertEqual(outputs['recovery']['restore_order'],['network','database','app'])
        self.assertIs(outputs['recovery']['rpo_met'],False)
        self.assertEqual(outputs['recovery']['missing_dependencies'],[])
        self.assertEqual(outputs['cost']['total'],'18.85')
        self.assertEqual(outputs['cost']['budget'],'18.00')
        self.assertEqual(outputs['cost']['allocations'],{'platform':'14.35','[unallocated]':'4.50'})
        self.assertIs(outputs['cost']['budget_is_cap'],False)
        self.assertEqual(len(outputs['capstone']['risks']),5)
        self.assertEqual(outputs['capstone']['missing_evidence'],['region_availability_review','restore_test','complete_telemetry_windows'])
        self.assertEqual(outputs['capstone']['conclusion'],'Review synthetic findings; no readiness or approval conclusion')
    def test_public_scope(self):
        self.assertFalse(list(ROOT.rglob('*private*')))
        for x in LESSONS:
            self.assertNotIn('awsf-',json.dumps(x))
        for rel in ('README.md','docs/WORKBOOK.md','docs/AZURE-COVERAGE.md'):
            s=(ROOT/rel).read_text();self.assertIn('AZ-104',s);self.assertIn('incomplete',s)
            self.assertNotIn('retrieval-evidence-private',s)

if __name__=='__main__':unittest.main()
