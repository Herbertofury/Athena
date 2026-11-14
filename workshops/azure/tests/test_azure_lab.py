"""Offline regression tests: named cases, no Azure resources or credentials."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import shutil
import unittest

BASE=Path(__file__).resolve().parents[1]/'labs'/'azure-workshop'
sys.dont_write_bytecode=True
sys.path.insert(0,str(BASE))
import lab

def fixture(command):
    return json.loads((BASE/'fixtures'/(command+'.json')).read_text())

class AzureLabTests(unittest.TestCase):
    def result(self,command,data=None): return lab.run(command,fixture(command) if data is None else data)
    def test_hierarchy_exact_ancestry(self): self.assertEqual(self.result('hierarchy')['ancestors_by_scope']['vm'],['rg','sub','root'])
    def test_access_inheritance(self): self.assertTrue(self.result('access')['decisions'][0]['allowed'])
    def test_access_unassigned_action(self): self.assertFalse(self.result('access')['decisions'][1]['allowed'])
    def test_access_wrong_principal(self):
        d=fixture('access'); d['requests'][0]['principal']='other'; self.assertFalse(self.result('access',d)['decisions'][0]['allowed'])
    def test_access_not_upward(self):
        d=fixture('access'); d['requests'][0]['scope']='sub'; self.assertFalse(self.result('access',d)['decisions'][0]['allowed'])
    def test_access_empty_assignments(self):
        d=fixture('access'); d['assignments']=[]; self.assertFalse(self.result('access',d)['decisions'][0]['allowed'])
    def test_access_multiple_grants(self):
        d=fixture('access'); a=copy.deepcopy(d['assignments'][0]); a.update(id='rootgrant',scope='root'); d['assignments'].append(a); self.assertEqual(self.result('access',d)['decisions'][0]['matching_assignment_ids'],['readers','rootgrant'])
    def test_policy_distinct_findings(self): self.assertEqual(len(self.result('governance')['policy_findings']),2)
    def test_lock_control_only(self): self.assertEqual([r['blocked'] for r in self.result('governance')['lock_decisions']],[True,False])
    def test_lock_does_not_block_read(self):
        d=fixture('governance'); d['operations'][0]['operation']='read'; self.assertFalse(self.result('governance',d)['lock_decisions'][0]['blocked'])
    def test_cannotdelete_allows_write(self):
        d=fixture('governance'); d['operations'][0]['operation']='write'; self.assertFalse(self.result('governance',d)['lock_decisions'][0]['blocked'])
    def test_readonly_blocks_write(self):
        d=fixture('governance'); d['locks'][0]['level']='ReadOnly'; d['operations'][0]['operation']='write'; self.assertTrue(self.result('governance',d)['lock_decisions'][0]['blocked'])
    def test_lock_empty(self):
        d=fixture('governance'); d['locks']=[]; self.assertFalse(self.result('governance',d)['lock_decisions'][0]['blocked'])
    def test_storage_match(self): self.assertEqual(self.result('storage')['matching_options'],['RA-GZRS'])
    def test_storage_missing(self): self.assertEqual(self.result('storage')['comparisons'][1]['missing_requirements'],['secondary_read'])
    def test_storage_no_match(self):
        d=fixture('storage'); d['requirements'].append('archive_immediate_read'); self.assertEqual(self.result('storage',d)['matching_options'],[])
    def test_storage_ties_preserved(self):
        d=fixture('storage'); d['options'].append(dict(id='equal',capabilities=d['options'][2]['capabilities'])); self.assertEqual(self.result('storage',d)['matching_options'],['RA-GZRS','equal'])
    def test_network_longest_prefix_tie(self): self.assertTrue(self.result('network')['routes'][0]['ambiguous'])
    def test_network_default(self): self.assertEqual(self.result('network')['routes'][1]['selected_route_ids'],['default'])
    def test_network_no_route(self):
        d=fixture('network'); d['routes']=d['routes'][1:]; self.assertEqual(self.result('network',d)['routes'][1]['selected_route_ids'],[])
    def test_network_ipv6_is_separate(self):
        d=fixture('network'); d['destinations']=['2001:db8::1']; self.assertEqual(self.result('network',d)['routes'][0]['selected_route_ids'],[])
    def test_network_ipv6_prefix(self):
        d=fixture('network'); d['destinations']=['2001:db8::1']; d['routes']=[dict(id='v6',prefix='2001:db8::/32',next_hop='synthetic')]; self.assertEqual(self.result('network',d)['routes'][0]['selected_route_ids'],['v6'])
    def test_nsg_one_layer_denies(self): self.assertFalse(self.result('network')['nsg_cases'][0]['allowed'])
    def test_nsg_first_priority_wins(self): self.assertEqual(self.result('network')['nsg_cases'][0]['layer_decisions'][1]['rule_id'],'deny-web')
    def test_nsg_all_layers_allow(self):
        d=fixture('network'); d['nsg_cases'][0]['layers'][1]['rules'][0]['matches']=False; self.assertTrue(self.result('network',d)['nsg_cases'][0]['allowed'])
    def test_nsg_missing_match_denies(self):
        d=fixture('network'); d['nsg_cases'][0]['layers'][0]['rules']=[]; self.assertFalse(self.result('network',d)['nsg_cases'][0]['allowed'])
    def test_compute_ceiling(self): self.assertEqual(self.result('compute')['required_instances'],8)
    def test_compute_max_cap(self): self.assertEqual(self.result('compute')['capped_instances'],6)
    def test_compute_shortfall(self): self.assertEqual(self.result('compute')['shortfall'],4)
    def test_compute_zero_demand_minimum(self):
        d=fixture('compute'); d['demand']=0; self.assertEqual(self.result('compute',d)['required_instances'],2)
    def test_compute_exact_division(self):
        d=fixture('compute'); d['demand']=560; self.assertEqual(self.result('compute',d)['required_instances'],4)
    def test_compute_one_unit_ceiling(self):
        d=fixture('compute'); d['demand']=561; self.assertEqual(self.result('compute',d)['required_instances'],5)
    def test_compute_no_shortfall(self):
        d=fixture('compute'); d['demand']=1; self.assertEqual(self.result('compute',d)['shortfall'],0)
    def test_monitoring_statuses(self): self.assertEqual([w['status'] for w in self.result('monitoring')['windows']],['breach','insufficient_data','within_threshold'])
    def test_monitoring_missing_not_zero(self): self.assertEqual(self.result('monitoring')['windows'][1]['mean'],25)
    def test_monitoring_all_null(self):
        d=fixture('monitoring'); d['windows'][0]['samples']=[None]*3; self.assertIsNone(self.result('monitoring',d)['windows'][0]['mean'])
    def test_monitoring_no_samples(self):
        d=fixture('monitoring'); d['windows'][0]['samples']=[]; self.assertEqual(self.result('monitoring',d)['windows'][0]['status'],'insufficient_data')
    def test_recovery_order(self): self.assertEqual(self.result('recovery')['restore_order'],['network','database','app'])
    def test_recovery_rpo_miss(self): self.assertFalse(self.result('recovery')['rpo_met'])
    def test_recovery_rpo_equal(self):
        d=fixture('recovery'); d['recovery_point_age_minutes']=30; self.assertTrue(self.result('recovery',d)['rpo_met'])
    def test_recovery_missing_blocks_transitive(self):
        d=fixture('recovery'); d['components'][2]['depends_on']=['vault']; r=self.result('recovery',d); self.assertEqual(r['missing_dependencies'],['vault']); self.assertEqual(r['restore_order'],[]); self.assertEqual(r['blocked_components'],['app','database','network'])
    def test_recovery_independent_order(self):
        d=fixture('recovery'); d['components'].append(dict(id='aaa',depends_on=[])); self.assertEqual(self.result('recovery',d)['restore_order'],['aaa','network','database','app'])
    def test_cost_decimal_sum(self): self.assertEqual(self.result('cost')['total'],'18.85')
    def test_cost_group_before_rounding(self): self.assertEqual(self.result('cost')['allocations']['platform'],'14.35')
    def test_cost_missing_tags(self): self.assertEqual(self.result('cost')['missing_tag_resource_ids'],['storage-a'])
    def test_cost_budget_is_not_cap(self): self.assertFalse(self.result('cost')['budget_is_cap'])
    def test_cost_equal_budget(self):
        d=fixture('cost'); d['budget']='18.85'; self.assertFalse(self.result('cost',d)['over_budget'])
    def test_cost_compare_before_rounding(self):
        d=fixture('cost'); d['budget']='18.8499'; self.assertTrue(self.result('cost',d)['over_budget'])
    def test_capstone_risks(self): self.assertEqual(len(self.result('capstone')['risks']),5)
    def test_capstone_missing(self): self.assertEqual(len(self.result('capstone')['missing_evidence']),3)
    def test_capstone_never_readiness(self): self.assertIn('no readiness or approval',self.result('capstone')['conclusion'])
    def test_json_duplicate_keys_rejected(self):
        from run_lab import unique_object
        with self.assertRaises(ValueError): json.loads('{"a":1,"a":2}',object_pairs_hook=unique_object)
    def test_unknown_command(self):
        with self.assertRaises(ValueError): lab.run('../anything',{})
    def test_cli_rejects_path(self):
        p=subprocess.run([sys.executable,str(BASE/'run_lab.py'),'../fixtures/cost.json'],capture_output=True,text=True); self.assertEqual(p.returncode,2); self.assertFalse(json.loads(p.stdout)['real_azure_executed'])
    def test_cli_rejects_extra_argument(self):
        p=subprocess.run([sys.executable,str(BASE/'run_lab.py'),'cost','extra'],capture_output=True,text=True); self.assertEqual(p.returncode,2)

# Matrix cases each alter a distinct contract boundary and become independent tests.
def invalid_case(command,path,value):
    def test(self):
        d=fixture(command); target=d
        for key in path[:-1]: target=target[key]
        target[path[-1]]=copy.deepcopy(value)
        original=copy.deepcopy(d)
        with self.assertRaises(ValueError): lab.run(command,d)
        # NaN is not equal to itself; serialized form verifies no mutation.
        self.assertEqual(json.dumps(d,sort_keys=True),json.dumps(original,sort_keys=True))
    return test

cases=[('monitor_huge_integer_sample','monitoring',['windows',0,'samples'],[10**400]),('monitor_huge_integer_threshold','monitoring',['windows',0,'threshold'],10**400)]
for field in fixture('compute'):
    for label,value in [('bool',True),('negative',-1),('float',1.5),('nonfinite',float('inf')),('too_large',1000001)]:
        cases.append(('compute_'+field+'_'+label,'compute',[field],value))
cases += [
 ('zero_capacity','compute',['capacity_per_instance'],0),('zero_utilization','compute',['target_utilization_percent'],0),('utilization_over100','compute',['target_utilization_percent'],101),('scale_inverted','compute',['min_instances'],7),('current_over_max','compute',['current_instances'],7),
 ('scope_orphan','hierarchy',['scopes',3,'parent'],'missing'),('scope_cycle','hierarchy',['scopes',0,'parent'],'vm'),('scope_self_cycle','hierarchy',['scopes',2,'parent'],'rg'),('scope_invalid_kind','hierarchy',['scopes',3,'kind'],'tenant'),('scope_bad_parent_kind','hierarchy',['scopes',3,'parent'],'sub'),('scope_empty','hierarchy',['scopes'],[]),('scope_duplicate','hierarchy',['scopes',3,'id'],'rg'),('scope_second_root','hierarchy',['scopes',3,'parent'],None),
 ('access_wildcard','access',['assignments',0,'actions'],['*']),('access_unknown_scope','access',['assignments',0,'scope'],'missing'),('access_request_scope','access',['requests',0,'scope'],'missing'),('access_empty_actions','access',['assignments',0,'actions'],[]),('access_duplicate_actions','access',['assignments',0,'actions'],['read','read']),('access_blank_principal','access',['assignments',0,'principal'],' '),
 ('lock_invalid_level','governance',['locks',0,'level'],'deny'),('lock_unknown_scope','governance',['locks',0,'scope'],'missing'),('operation_bad_plane','governance',['operations',0,'plane'],'other'),('operation_bad_action','governance',['operations',0,'operation'],'execute'),('policy_empty_region','governance',['allowed_regions'],[]),('policy_duplicate_tags','governance',['required_tags'],['owner','owner']),
 ('storage_empty_requirement','storage',['requirements'],[]),('storage_empty_options','storage',['options'],[]),('storage_duplicate_capability','storage',['options',0,'capabilities'],['x','x']),
 ('network_host_bits','network',['routes',0,'prefix'],'10.0.0.1/24'),('network_invalid_prefix','network',['routes',0,'prefix'],'not-an-ip'),('network_invalid_address','network',['destinations'],['hostname.invalid']),('network_empty_layers','network',['nsg_cases',0,'layers'],[]),('nsg_bool_priority','network',['nsg_cases',0,'layers',0,'rules',0,'priority'],True),('nsg_priority_low','network',['nsg_cases',0,'layers',0,'rules',0,'priority'],99),('nsg_priority_high','network',['nsg_cases',0,'layers',0,'rules',0,'priority'],4097),('nsg_duplicate_priority','network',['nsg_cases',0,'layers',1,'rules',1,'priority'],100),('nsg_not_bool_match','network',['nsg_cases',0,'layers',0,'rules',0,'matches'],1),('nsg_invalid_action','network',['nsg_cases',0,'layers',0,'rules',0,'action'],'pass'),
 ('monitor_bool_sample','monitoring',['windows',0,'samples'],[True]),('monitor_nan_sample','monitoring',['windows',0,'samples'],[float('nan')]),('monitor_negative_sample','monitoring',['windows',0,'samples'],[-1]),('monitor_extra_sample','monitoring',['windows',0,'samples'],[1,2,3,4]),('monitor_zero_expected','monitoring',['windows',0,'expected_count'],0),('monitor_bool_expected','monitoring',['windows',0,'expected_count'],True),('monitor_inf_threshold','monitoring',['windows',0,'threshold'],float('inf')),
 ('recovery_cycle','recovery',['components',2,'depends_on'],['app']),('recovery_self_cycle','recovery',['components',0,'depends_on'],['app']),('recovery_duplicate_dep','recovery',['components',0,'depends_on'],['database','database']),('recovery_negative_age','recovery',['recovery_point_age_minutes'],-1),('recovery_bool_rpo','recovery',['rpo_minutes'],True),
 ('cost_nan','cost',['budget'],'NaN'),('cost_inf','cost',['budget'],'Infinity'),('cost_negative','cost',['budget'],'-1'),('cost_float','cost',['budget'],1.0),('cost_bool','cost',['budget'],True),('cost_excess_precision','cost',['budget'],'0.00001'),('cost_blank','cost',['budget'],''),('cost_huge','cost',['budget'],'1000001'),('cost_bad_team','cost',['resources',0,'team'],''),('cost_reserved_team','cost',['resources',0,'team'],'[unallocated]'),
 ('capstone_duplicate_evidence','capstone',['evidence'],['restore_test','restore_test']),('capstone_evidence_bool','capstone',['evidence'],[True])]
for name,command,path,value in cases:
    setattr(AzureLabTests,'test_invalid_'+name,invalid_case(command,path,value))
for command in lab.COMMANDS:
    def invariant(self,command=command):
        d=fixture(command); original=copy.deepcopy(d); result=lab.run(command,d)
        self.assertEqual(d,original); self.assertEqual(result,lab.run(command,d)); self.assertIs(result['real_azure_executed'],False)
        self.assertEqual(result['command'],command); json.dumps(result,allow_nan=False)
    setattr(AzureLabTests,'test_invariants_'+command,invariant)
    def wrong_fields(self,command=command):
        d=fixture(command); d['unexpected']=1
        with self.assertRaises(ValueError): lab.run(command,d)
    setattr(AzureLabTests,'test_reject_extra_fields_'+command,wrong_fields)
    def cli(self,command=command):
        p=subprocess.run([sys.executable,str(BASE/'run_lab.py'),command],capture_output=True,text=True)
        self.assertEqual(p.returncode,0,p.stderr); self.assertEqual(json.loads(p.stdout),lab.run(command,fixture(command)))
    setattr(AzureLabTests,'test_cli_'+command,cli)

def cli_bad_fixture(payload):
    def test(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            for filename in ('lab.py','run_lab.py'): shutil.copyfile(BASE/filename,root/filename)
            (root/'fixtures').mkdir()
            (root/'fixtures'/'cost.json').write_bytes(payload)
            p=subprocess.run([sys.executable,str(root/'run_lab.py'),'cost'],capture_output=True,text=True)
            self.assertEqual(p.returncode,2,p.stderr)
            self.assertFalse(json.loads(p.stdout)['real_azure_executed'])
            self.assertEqual(p.stderr,'')
            self.assertFalse((root/'__pycache__').exists())
    return test
for name,payload in {
    'malformed':b'{', 'duplicate':b'{"budget":"1","budget":"2"}',
    'nonfinite':b'{"budget":NaN}', 'wrong_fields':b'{"wrong":1}',
    'wrong_top_level':b'[]', 'oversized':b' '*100001,
    'deep_nesting':b'['*1100+b'0'+b']'*1100,
    'bad_encoding':b'\xff', 'empty':b'',
}.items():
    setattr(AzureLabTests,'test_cli_bad_fixture_'+name,cli_bad_fixture(payload))

if __name__=='__main__': unittest.main()
