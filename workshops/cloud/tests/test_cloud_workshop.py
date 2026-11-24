"""Test local model contracts and distribution integrity, not real cloud behavior."""
import ast
from collections import Counter
import copy
import importlib.util
import json
from pathlib import Path
import re
import socket
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch
R=Path(__file__).resolve().parents[1]

def load(name,path):
    spec=importlib.util.spec_from_file_location(name,path)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    return module
L=load('cloud_lab',R/'labs/cloud-workshop/lab.py')
C=load('cloud_content',R/'scripts/cloud_content.py')
F=json.loads((R/'labs/cloud-workshop/fixtures/scenarios.json').read_text())

def command(*args):
    return subprocess.run([sys.executable,'labs/cloud-workshop/run_lab.py',*args],cwd=R,capture_output=True,text=True,timeout=30)

class ScopeTests(unittest.TestCase):
    def test_exact_and_descendant(self):
        self.assertTrue(L.scope_contains('academy/dev','academy/dev'))
        self.assertTrue(L.scope_contains('academy/dev','academy/dev/reports'))
    def test_sibling_and_reverse_not_contained(self):
        self.assertFalse(L.scope_contains('academy/dev','academy/dev-tools/reports'))
        self.assertFalse(L.scope_contains('academy/dev/reports','academy/dev'))
    def test_invalid_path_rejected(self):
        for path in ['',None,'Academy/dev','academy//dev','/academy','academy/','academy/..','a/'*8+'a','a'*201]:
            with self.subTest(path=path),self.assertRaises(ValueError):L.scope_contains(path,'academy')
    def test_narrow_and_broad_fixture(self):
        f=F['scope']
        self.assertEqual([p for p in f['resources'] if L.scope_contains(f['narrow'],p)],['academy/dev/reports'])
        self.assertEqual([p for p in f['resources'] if L.scope_contains(f['broad'],p)],f['resources'])

class NetworkTests(unittest.TestCase):
    def test_all_true(self):self.assertTrue(L.connection_checks(True,True,True,True)['all_assumed_gates_pass'])
    def test_failures_keep_parameter_order(self):self.assertEqual(L.connection_checks(False,True,False,False)['failed_assumptions'],['route_present','service_listening','identity_allows'])
    def test_exact_booleans(self):
        for value in [0,1,None,'true',[]]:
            with self.subTest(value=value),self.assertRaises(ValueError):L.connection_checks(value,True,True,True)
    def test_fixture_gaps(self):
        self.assertEqual(L.connection_checks(**F['network']['baseline'])['failed_assumptions'],['service_listening'])
        self.assertEqual(L.connection_checks(**F['network']['identity_gap'])['failed_assumptions'],['identity_allows'])

class ScalingTests(unittest.TestCase):
    def test_fixture_distinguishes_target_and_physical(self):
        r=L.replica_plan(**F['scaling'])
        self.assertEqual((r['needed_at_target'],r['planned_replicas']),(5,4))
        self.assertEqual((r['target_capacity_rpm'],r['physical_capacity_rpm']),(800,1600))
        self.assertFalse(r['target_met']);self.assertTrue(r['physical_capacity_met']);self.assertTrue(r['capped_by_maximum'])
    def test_exact_target_boundary(self):
        self.assertEqual(L.replica_plan(800,400,50,2,4)['needed_at_target'],4)
        self.assertTrue(L.replica_plan(800,400,50,2,4)['target_met'])
        self.assertFalse(L.replica_plan(801,400,50,2,4)['target_met'])
    def test_over_physical_capacity(self):self.assertFalse(L.replica_plan(1700,400,50,2,4)['physical_capacity_met'])
    def test_zero_demand_and_minimum(self):
        self.assertEqual(L.replica_plan(0,400,50,2,4)['planned_replicas'],2)
        self.assertTrue(L.replica_plan(0,400,50,0,0)['target_met'])
    def test_zero_maximum_with_positive_demand(self):
        r=L.replica_plan(1,1,100,0,0)
        self.assertFalse(r['target_met']);self.assertTrue(r['capped_by_maximum'])
    def test_bad_bounds_and_bool(self):
        for args in [(-1,400,50,2,4),(1,0,50,2,4),(1,1,0,0,1),(1,1,101,0,1),(1,1,50,3,2),(True,1,50,0,1),(1,1,50,0,1001)]:
            with self.subTest(args=args),self.assertRaises(ValueError):L.replica_plan(*args)
    def test_ceiling_property_bounded_grid(self):
        for demand in range(0,1000,17):
            r=L.replica_plan(demand,37,63,0,1000)
            planned=r['planned_replicas'];self.assertGreaterEqual(planned*37*63,demand*100)
            if planned:self.assertLess((planned-1)*37*63,demand*100)

class FailureTests(unittest.TestCase):
    def test_baseline_and_improved(self):
        a=L.failure_report(**F['failure']['baseline']);b=L.failure_report(**F['failure']['improved'])
        self.assertEqual((a['surviving_replicas'],a['target_capacity_after_rpm']),(2,400))
        self.assertTrue(a['target_met_before']);self.assertFalse(a['target_met_after'])
        self.assertEqual((b['surviving_replicas'],b['target_capacity_after_rpm']),(3,600));self.assertTrue(b['target_met_after'])
    def test_no_failure(self):self.assertTrue(L.failure_report(['zone-a'],[],200,400,50)['target_met_after'])
    def test_all_zones_failed(self):
        r=L.failure_report(['zone-a','zone-b'],['zone-a','zone-b'],1,400,50)
        self.assertEqual(r['surviving_replicas'],0);self.assertFalse(r['physical_capacity_met_after'])
    def test_unknown_zone_and_bad_placement(self):
        for placements,failed in [([],[]),(['not-a-zone'],[]),(['zone-a'],['zone-b']),(['zone-a'],None),(['zone-a']*1001,[])]:
            with self.subTest(),self.assertRaises(ValueError):L.failure_report(placements,failed,1,1,100)
    def test_duplicate_failed_zone_has_no_extra_effect(self):
        self.assertEqual(L.failure_report(['zone-a','zone-b'],['zone-a'],1,1,100),L.failure_report(['zone-a','zone-b'],['zone-a','zone-a'],1,1,100))
    def test_placement_order_invariance(self):
        f=copy.deepcopy(F['failure']['baseline']);a=L.failure_report(**f);f['placements'].reverse();self.assertEqual(a,L.failure_report(**f))

class RecoveryTests(unittest.TestCase):
    def test_independent_objectives(self):
        r=L.recovery_report(**F['recovery'])
        self.assertEqual((r['data_gap_minutes'],r['downtime_minutes']),(20,50));self.assertFalse(r['rpo_met']);self.assertTrue(r['rto_met'])
    def test_equal_target_is_met(self):
        r=L.recovery_report(10,25,85,15,60);self.assertTrue(r['rpo_met']);self.assertTrue(r['rto_met'])
    def test_zero_intervals(self):
        r=L.recovery_report(0,0,0,0,0);self.assertTrue(r['rpo_met']);self.assertTrue(r['rto_met'])
    def test_invalid_order_and_type(self):
        for args in [(2,1,3,1,1),(1,3,2,1,1),(0,1,2,-1,1),(True,1,2,1,1),(0,1.5,2,1,1)]:
            with self.subTest(args=args),self.assertRaises(ValueError):L.recovery_report(*args)
    def test_newer_recovery_point_does_not_change_downtime(self):
        a=L.recovery_report(580,600,650,15,60);b=L.recovery_report(590,600,650,15,60)
        self.assertEqual(a['downtime_minutes'],b['downtime_minutes']);self.assertTrue(b['rpo_met'])
    def test_actual_restore_and_cleanup(self):
        created=[];original=tempfile.TemporaryDirectory
        def track(*args,**kwargs):
            result=original(*args,**kwargs);created.append(Path(result.name));return result
        with patch.object(L.tempfile,'TemporaryDirectory',side_effect=track):r=L.restore_roundtrip()
        for key in ['backup_matches_original','restored_matches_original','current_source_differs','temporary_directory_removed']:self.assertTrue(r[key])
        self.assertEqual(len(created),1);self.assertFalse(created[0].exists())
    def test_restore_is_repeatable(self):self.assertEqual(L.restore_roundtrip(),L.restore_roundtrip())

class CostTests(unittest.TestCase):
    def test_fixture_components(self):
        a=L.cost_estimate(**F['cost']['always_on']);b=L.cost_estimate(**F['cost']['scheduled'])
        self.assertEqual([a[k] for k in ['compute_credits','storage_credits','egress_credits','total_credits','difference_from_budget']],[10800,200,150,11150,1150])
        self.assertEqual(b['total_credits'],2750);self.assertEqual(b['difference_from_budget'],-7250)
        self.assertFalse(a['within_budget']);self.assertTrue(b['within_budget'])
    def test_zero_compute_does_not_zero_storage(self):
        r=L.cost_estimate(0,720,5,100,2,50,3,1000);self.assertEqual(r['total_credits'],350)
    def test_equal_budget_is_within(self):self.assertTrue(L.cost_estimate(1,2,3,0,0,0,0,6)['within_budget'])
    def test_double_egress_adds_exact_component(self):
        f=copy.deepcopy(F['cost']['always_on']);a=L.cost_estimate(**f);f['egress_gib']*=2;b=L.cost_estimate(**f)
        self.assertEqual(b['total_credits']-a['total_credits'],150)
    def test_invalid_counts_and_bool(self):
        for value in [-1,True,1.5,'1',1000001]:
            with self.subTest(value=value),self.assertRaises(ValueError):L.cost_estimate(value,1,1,1,1,1,1,1)
    def test_fictional_unit_label(self):self.assertIn('not currency',L.cost_estimate(0,0,0,0,0,0,0,0)['unit'])

class ChangeTests(unittest.TestCase):
    def test_fixture_plan_and_risks(self):
        r=L.plan_changes(**F['changes'])
        self.assertEqual(r['changes'],[{'id':'queue','action':'add','fields':[]},{'id':'reports','action':'remove','fields':[]},{'id':'web','action':'modify','fields':['public','size']}])
        self.assertEqual([x['id'] for x in r['risks']],['reports','web']);self.assertFalse(r['applied'])
    def test_identical_inventory_has_no_changes(self):
        before=F['changes']['before'];r=L.plan_changes(before,before);self.assertEqual(r['changes'],[]);self.assertEqual(r['risks'],[])
    def test_kind_change_models_replacement(self):
        before=[{'id':'a','kind':'compute','size':1,'public':False}];after=copy.deepcopy(before);after[0]['kind']='storage'
        r=L.plan_changes(before,after);self.assertEqual(r['changes'][0]['action'],'replace');self.assertEqual(len(r['risks']),1)
    def test_new_public_resource_flagged(self):
        r=L.plan_changes([],[dict(id='a',kind='storage',size=1,public=True)])
        self.assertEqual(len(r['risks']),1)
    def test_public_to_private_is_not_exposure_increase(self):
        before=[dict(id='a',kind='compute',size=1,public=True)];after=copy.deepcopy(before);after[0]['public']=False
        self.assertEqual(L.plan_changes(before,after)['risks'],[])
    def test_duplicate_ids_rejected(self):
        row=dict(id='a',kind='compute',size=1,public=False)
        with self.assertRaises(ValueError):L.plan_changes([row,row],[])
    def test_bad_fields_and_bounds(self):
        row=dict(id='a',kind='compute',size=1,public=False)
        bad=[{},dict(row,extra=1),dict(row,id='../a'),dict(row,kind='magic'),dict(row,size=True),dict(row,size=0),dict(row,public=1)]
        for value in bad:
            with self.subTest(value=value),self.assertRaises(ValueError):L.plan_changes([value],[])
        with self.assertRaises(ValueError):L.plan_changes([row]*101,[])
    def test_input_order_invariance(self):
        f=copy.deepcopy(F['changes']);a=L.plan_changes(**f);f['before'].reverse();f['after'].reverse();self.assertEqual(a,L.plan_changes(**f))

class SafetyAndPackTests(unittest.TestCase):
    def test_fixture_inputs_not_mutated(self):
        f=copy.deepcopy(F);before=copy.deepcopy(f)
        L.replica_plan(**f['scaling']);L.recovery_report(**f['recovery']);L.plan_changes(**f['changes'])
        for values in f['failure'].values():L.failure_report(**values)
        for values in f['cost'].values():L.cost_estimate(**values)
        for values in f['network'].values():L.connection_checks(**values)
        self.assertEqual(f,before)
    def test_all_fixed_cli_commands(self):
        for name in ['scope','network','scaling','failure','recovery','cost','changes','restore']:
            p=command(name);self.assertEqual(p.returncode,0,p.stderr);self.assertEqual(p.stderr,'')
            output=json.loads(p.stdout);self.assertFalse(output['real_cloud_executed']);self.assertEqual(output['exercise'],name)
            self.assertEqual(output['execution_kind'],'actual_local_file_exercise' if name=='restore' else 'local_model')
    def test_cli_no_arbitrary_path_or_cloud_target(self):
        for args in [('apply',),('scope','--target','example.com'),('restore','--path','README.md')]:
            p=command(*args);self.assertEqual(p.returncode,2);self.assertIn('error:',p.stderr)
    def test_offline_functions_with_socket_disabled(self):
        with patch.object(socket,'socket',side_effect=AssertionError('network not permitted in test')):
            self.assertEqual(L.replica_plan(**F['scaling'])['planned_replicas'],4)
            self.assertFalse(L.plan_changes(**F['changes'])['applied'])
            self.assertTrue(L.restore_roundtrip()['restored_matches_original'])
    def test_no_network_shell_or_provider_imports(self):
        banned={'socket','requests','urllib','http','subprocess','boto3','botocore','azure','google','os'}
        for path in (R/'labs/cloud-workshop').glob('*.py'):
            tree=ast.parse(path.read_text())
            for n in ast.walk(tree):
                if isinstance(n,ast.Import):self.assertFalse({a.name.split('.')[0] for a in n.names}&banned,path)
                if isinstance(n,ast.ImportFrom):self.assertNotIn((n.module or '').split('.')[0],banned,path)
                if isinstance(n,ast.Call) and isinstance(n.func,ast.Name):self.assertNotIn(n.func.id,{'eval','exec'},path)
    def test_lesson_count_structure_and_depth(self):
        self.assertEqual(len(C.LESSONS),8);self.assertEqual(len({x['id'] for x in C.LESSONS}),8)
        for l in C.LESSONS:
            self.assertEqual(len(l['explain']),6);self.assertGreaterEqual(len(' '.join(l['explain']).split()),250)
            self.assertEqual(len(l['lab']),6);self.assertEqual(len(l['learningGoals']),3);self.assertEqual(len(l['evidence']),3)
            self.assertTrue(l['limitations']);self.assertTrue(l['sources'])
    def test_checks_balanced_and_unique(self):
        checks=json.loads((R/'content/cloud-checks.json').read_text())
        self.assertEqual(len(checks),24);self.assertEqual(len({c['question'] for c in checks}),24)
        self.assertEqual(Counter(c['answer'] for c in checks),{0:6,1:6,2:6,3:6})
        for c in checks:self.assertEqual(len(c['options']),4);self.assertEqual(len(set(c['options'])),4);self.assertGreater(len(c['why']),30)
    def test_generated_data_matches_source(self):
        self.assertEqual(json.loads((R/'content/cloud-lessons.json').read_text()),C.LESSONS)
        self.assertEqual(json.loads((R/'content/cloud-path.json').read_text()),C.PATH)
    def test_all_prose_and_checks_in_documents(self):
        for l in C.LESSONS:
            text=(R/'docs/shared'/(l['id']+'.md')).read_text()
            for part in l['explain']+l['lab']+[l['limitations']]:self.assertIn(part,text)
            for c in [l]+l['additionalChecks']:self.assertIn(c['question'],text);self.assertIn(c['why'],text)
    def test_source_register_and_official_hosts(self):
        register=json.loads((R/'research/cloud-sources.json').read_text())
        self.assertEqual(len(register['sources']),15)
        urls={s['url'] for s in register['sources']};self.assertEqual(urls,set(C.S.values()))
        for source in register['sources']:
            self.assertEqual(source['status'],'opened')
            self.assertTrue(source['url'].startswith(('https://csrc.nist.gov/','https://nvlpubs.nist.gov/','https://aws.amazon.com/','https://docs.aws.amazon.com/','https://learn.microsoft.com/','https://docs.cloud.google.com/')))
    def test_local_markdown_links(self):
        for path in [R/'README.md',*R.joinpath('docs').rglob('*.md'),*R.joinpath('labs').rglob('*.md')]:
            for target in re.findall(r'\[[^\]]+\]\(([^)]+)\)',path.read_text()):
                if not target.startswith(('https:','http:','#')):self.assertTrue((path.parent/target.split('#')[0]).is_file(),(path,target))
    def test_real_cloud_explicitly_unexecuted(self):
        self.assertIn('unexecuted',C.PATH['limits'])
        text=(R/'docs/CLOUD-COVERAGE.md').read_text()
        self.assertIn('Unexecuted real-cloud labs',text)
        self.assertIn('not complete AWS',text)
        self.assertEqual(C.PATH['prerequisites'],['cloud-models','ip-subnets','identity'])
