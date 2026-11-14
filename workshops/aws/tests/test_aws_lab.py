"""Offline model contracts and independent worked answers; stdlib only."""
import ast
from contextlib import redirect_stdout
from copy import deepcopy
import importlib.util
import io
import json
from pathlib import Path
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1] / 'labs' / 'aws-workshop'
# Avoid shadowing another workshop's generic lab module during combined discovery.
def load(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module
lab = load('aws_teaching_lab', ROOT / 'lab.py')
with patch.dict(sys.modules, {'lab': lab}):
    runner = load('aws_teaching_runner', ROOT / 'run_lab.py')


class Models(unittest.TestCase):
    def setUp(self):
        self.cases = runner.fixtures()

    def run_case(self, name, **updates):
        data = deepcopy(self.cases[name]); data.update(updates)
        return runner.FUNCTIONS[name](**data)

    def test_identity_missing_approval(self):
        self.assertEqual(self.run_case('identity')['decision'], 'approval_required')
    def test_identity_approval_allows(self):
        self.assertEqual(self.run_case('identity', approvals=['owner'])['decision'], 'allow')
    def test_identity_explicit_deny_overrides_approval(self):
        rules = self.cases['identity']['rules'] + [dict(id='stop', effect='deny', action='read', resource='orders')]
        result = self.run_case('identity', rules=rules, approvals=['owner'])
        self.assertEqual(result['decision'], 'deny'); self.assertEqual(result['matching_denies'], ['stop'])
    def test_identity_absence_denies(self):
        self.assertEqual(self.run_case('identity', rules=[])['decision'], 'deny')
    def test_identity_different_resource_not_match(self):
        request = dict(action='read', resource='other', required_approvals=[])
        self.assertEqual(self.run_case('identity', request=request)['decision'], 'deny')
    def test_identity_no_required_approval(self):
        request = dict(action='read', resource='orders', required_approvals=[])
        self.assertEqual(self.run_case('identity', request=request)['decision'], 'allow')
    def test_identity_multiple_missing_approvals_sorted(self):
        request = dict(action='read', resource='orders', required_approvals=['security', 'owner'])
        self.assertEqual(self.run_case('identity', request=request)['missing_approvals'], ['owner', 'security'])
    def test_network_routed_but_blocked(self):
        result = self.run_case('network')
        self.assertEqual(result['route_path'], ['client', 'edge', 'app', 'db'])
        self.assertIsNone(result['permitted_path']); self.assertFalse(result['reachable'])
    def test_network_complete_intersection(self):
        result = self.run_case('network', allows=self.cases['network']['routes'])
        self.assertEqual(result['permitted_path'], ['client', 'edge', 'app', 'db'])
    def test_network_allow_without_route_not_reachable(self):
        self.assertFalse(self.run_case('network', routes=[])['reachable'])
    def test_network_direction_matters(self):
        self.assertFalse(self.run_case('network', source='db', target='client')['reachable'])
    def test_network_same_node_zero_edges(self):
        self.assertEqual(self.run_case('network', target='client', routes=[], allows=[])['permitted_path'], ['client'])
    def test_network_cycle_terminates(self):
        result = lab.network(['a', 'b', 'c'], [['a','b'], ['b','a']], [['a','b'], ['b','a']], 'a', 'c')
        self.assertFalse(result['reachable'])
    def test_network_equal_paths_lexical_tiebreak(self):
        edges = [['s','b'], ['b','t'], ['s','a'], ['a','t']]
        self.assertEqual(lab.network(['s','b','a','t'], edges, edges, 's','t')['permitted_path'], ['s','a','t'])
    def test_matrix_storage_match(self):
        self.assertEqual(self.run_case('storage')['feasible'], ['S3-shaped'])
    def test_matrix_compute_preserves_tie(self):
        result = self.run_case('compute')
        self.assertTrue(result['ambiguous']); self.assertIsNone(result['recommendation'])
        self.assertEqual(result['feasible'], ['function-shaped', 'managed-container-shaped'])
    def test_matrix_unmet_not_recommended(self):
        result = self.run_case('storage', requirements=['unavailable'])
        self.assertEqual(result['feasible'], []); self.assertEqual(result['status'], 'unmet_requirements')
        self.assertEqual(len(result['nearest']), 3)
    def test_matrix_partial_match_is_not_feasible(self):
        result = self.run_case('storage', requirements=['object_api', 'unavailable'])
        self.assertEqual(result['nearest'], ['S3-shaped']); self.assertEqual(result['feasible'], [])
    def test_matrix_database_instance_standby_not_read_scaling(self):
        result = self.run_case('database')
        self.assertEqual(result['feasible'], ['multi-az-cluster-shaped', 'read-replica-shaped'])
        item = next(x for x in result['options'] if x['id']=='multi-az-instance-shaped')
        self.assertEqual(item['unmet'], ['read_scaling'])
    def test_matrix_caveats_defensive_copy(self):
        result = lab.decision_matrix(**self.cases['storage']); result['options'][0]['caveats'].append('changed')
        self.assertNotIn('changed', self.cases['storage']['options'][1]['caveats'])
    def test_queue_worked_delivery(self):
        result = self.run_case('queues')
        self.assertEqual(result['total_cents'], 1200); self.assertEqual(result['dead_letter'], ['order-2'])
        self.assertEqual(result['acknowledged'], ['order-1'])
        self.assertEqual(result['events'][1]['outcome'], 'duplicate_suppressed')
    def test_queue_lost_ack_redrives_even_applied(self):
        deliveries = [dict(id='order-1', handler_ok=True, ack_received=False)]
        result = self.run_case('queues', deliveries=deliveries, max_attempts=1)
        self.assertEqual(result['applied'], ['order-1']); self.assertEqual(result['dead_letter'], ['order-1'])
    def test_queue_terminal_deliveries_ignored(self):
        deliveries = [dict(id='order-1',handler_ok=True,ack_received=True)] * 2
        result = self.run_case('queues', deliveries=deliveries)
        self.assertEqual(result['total_cents'], 1200); self.assertEqual(result['attempts']['order-1'], 1)
        self.assertEqual(result['events'][-1]['outcome'], 'ignored_terminal')
    def test_queue_dead_letter_deliveries_ignored(self):
        deliveries = [dict(id='order-1',handler_ok=False,ack_received=False), dict(id='order-1',handler_ok=True,ack_received=True)]
        result = self.run_case('queues', deliveries=deliveries, max_attempts=1)
        self.assertEqual(result['total_cents'], 0); self.assertEqual(result['attempts']['order-1'], 1)
    def test_queue_no_deliveries_pending(self):
        result = self.run_case('queues', deliveries=[])
        self.assertEqual(result['pending'], ['order-1', 'order-2']); self.assertEqual(result['total_cents'], 0)
    def test_queue_retry_then_success(self):
        deliveries = [dict(id='order-2',handler_ok=False,ack_received=False), dict(id='order-2',handler_ok=True,ack_received=True)]
        self.assertEqual(self.run_case('queues', deliveries=deliveries)['total_cents'], 800)
    def test_resilience_correlated_failures(self):
        result = self.run_case('resilience')
        self.assertEqual(result['survivors'], ['app-3']); self.assertFalse(result['capacity_count_sufficient'])
        self.assertTrue(result['restore_within_rto']); self.assertFalse(result['backup_within_rpo'])
    def test_resilience_equality_meets_targets(self):
        result = self.run_case('resilience', measured_restore_minutes=60, backup_age_minutes=15)
        self.assertTrue(result['restore_within_rto']); self.assertTrue(result['backup_within_rpo'])
    def test_resilience_rto_miss(self):
        self.assertFalse(self.run_case('resilience', measured_restore_minutes=61)['restore_within_rto'])
    def test_resilience_no_domain_failure(self):
        self.assertTrue(self.run_case('resilience', failed_domains=[])['capacity_count_sufficient'])
    def test_resilience_all_domains_failed(self):
        self.assertEqual(self.run_case('resilience', failed_domains=['zone-a','zone-b'])['survivors'], [])
    def test_operations_classification(self):
        groups = self.run_case('operations')['classification']
        for bucket, key in [('CloudWatch','e1'), ('CloudTrail','e2'), ('AWS_Config','e3'), ('unclassified','e4')]:
            self.assertEqual(groups[bucket][0]['id'], key)
    def test_operations_unknown_retained(self):
        evidence = [dict(id='x', kind='unknown', summary='Unverified')]
        self.assertEqual(self.run_case('operations', evidence=evidence)['classification']['unclassified'], evidence)
    def test_operations_log_category(self):
        evidence = [dict(id='x', kind='log', summary='Fictional log')]
        self.assertEqual(self.run_case('operations', evidence=evidence)['classification']['CloudWatch'], evidence)
    def test_operations_output_copy(self):
        result = lab.operations(**self.cases['operations']); result['classification']['CloudWatch'][0]['summary']='Changed'
        self.assertNotEqual(self.cases['operations']['evidence'][0]['summary'], 'Changed')
    def test_cost_worked_total(self):
        result = self.run_case('cost')
        self.assertEqual(result['total_cents'], 1390); self.assertEqual(result['over_budget_cents'], 90)
        self.assertFalse(result['spending_cap']); self.assertTrue(result['threshold_reached'])
    def test_cost_half_up_line_rounding(self):
        lines = [dict(id='a', quantity='1', unit_usd='0.005'), dict(id='b', quantity='1', unit_usd='0.005')]
        self.assertEqual(self.run_case('cost', lines=lines)['total_cents'], 2)
    def test_cost_below_half_cent(self):
        self.assertEqual(self.run_case('cost', lines=[dict(id='x',quantity='1',unit_usd='0.004999')])['total_cents'], 0)
    def test_cost_decimal_exact(self):
        self.assertEqual(self.run_case('cost', lines=[dict(id='x',quantity='3',unit_usd='0.1')])['total_cents'], 30)
    def test_cost_budget_equality_alert(self):
        self.assertTrue(self.run_case('cost', budget_cents=1390)['threshold_reached'])
    def test_cost_below_budget(self):
        result=self.run_case('cost', budget_cents=1391)
        self.assertFalse(result['threshold_reached']); self.assertEqual(result['over_budget_cents'], 0)
    def test_cost_zero_quantity(self):
        self.assertEqual(self.run_case('cost', lines=[dict(id='x',quantity='0',unit_usd='100')])['total_cents'], 0)
    def test_capstone_exact_issues(self):
        result=lab.capstone(self.cases)
        self.assertEqual(result['issues'], ['identity_not_allowed','network_path_blocked','compute_tradeoff_unresolved',
          'database_tradeoff_unresolved','queue_redrive_review_needed','capacity_count_sufficient_failed',
          'backup_within_rpo_failed','budget_threshold_reached'])
        self.assertFalse(result['deployment_approved']); self.assertEqual(len(result['outstanding_evidence']), 6)
    def test_capstone_reject_missing_case(self):
        del self.cases['network']
        with self.assertRaises(lab.ContractError): lab.capstone(self.cases)
    def test_capstone_reject_unknown_argument(self):
        self.cases['network']['surprise']=1
        with self.assertRaises(lab.ContractError): lab.capstone(self.cases)
    def test_all_models_pure(self):
        before=deepcopy(self.cases)
        lab.capstone(self.cases)
        self.assertEqual(self.cases, before)
    def test_all_models_repeatable(self):
        self.assertEqual(lab.capstone(self.cases), lab.capstone(self.cases))
    def test_cli_names(self):
        self.assertEqual(len(runner.COMMANDS), 10)
        for name in runner.COMMANDS:
            result=runner.run(name)
            self.assertFalse(result['real_aws_executed']); json.dumps(result, allow_nan=False)
    def test_cli_success_stdout_json(self):
        out=io.StringIO()
        with redirect_stdout(out): status=runner.main(['cost'])
        self.assertEqual(status,0); self.assertEqual(json.loads(out.getvalue())['result']['total_cents'],1390)
    def test_cli_error_stdout_json(self):
        out=io.StringIO()
        with redirect_stdout(out): status=runner.main(['../../secret'])
        self.assertEqual(status,2); self.assertEqual(json.loads(out.getvalue())['error_type'],'input_contract')
    def test_cli_no_arg(self):
        out=io.StringIO()
        with redirect_stdout(out): status=runner.main([])
        self.assertEqual(status,2); json.loads(out.getvalue())
    def test_cli_extra_arg(self):
        out=io.StringIO()
        with redirect_stdout(out): status=runner.main(['cost','/tmp/path'])
        self.assertEqual(status,2)
    def test_cli_help_json(self):
        out=io.StringIO()
        with redirect_stdout(out): status=runner.main(['--help'])
        self.assertEqual(status,0); self.assertEqual(len(json.loads(out.getvalue())['commands']),10)
    def test_fixture_duplicate_json_key(self):
        with self.assertRaises(lab.ContractError): runner.unique_object([('a',1),('a',2)])
    def test_fixture_size_guard(self):
        with patch.object(Path,'open',return_value=io.BytesIO(b' '*65537)):
            with self.assertRaises(lab.ContractError): runner.fixtures()
    def test_fixture_nonfinite_json(self):
        with patch.object(Path,'open',return_value=io.BytesIO(b'{"x":NaN}')):
            with self.assertRaises(lab.ContractError): runner.fixtures()
    def test_fixture_malformed_json(self):
        with patch.object(Path,'open',return_value=io.BytesIO(b'{broken')):
            with self.assertRaises(lab.ContractError): runner.fixtures()
    def test_fixture_wrong_top_level(self):
        with patch.object(Path,'open',return_value=io.BytesIO(b'[]')):
            with self.assertRaises(lab.ContractError): runner.fixtures()
    def test_fixture_utf8_error(self):
        with patch.object(Path,'open',return_value=io.BytesIO(b'\xff')):
            with self.assertRaises(lab.ContractError): runner.fixtures()
    def test_no_network_process_or_cloud_imports(self):
        allowed={'collections','decimal','re','inspect','json','pathlib','sys','lab'}
        for name in ('lab.py','run_lab.py'):
            tree=ast.parse((ROOT/name).read_text())
            imported=set()
            for node in ast.walk(tree):
                if isinstance(node,ast.Import): imported.update(x.name.split('.')[0] for x in node.names)
                elif isinstance(node,ast.ImportFrom): imported.add(node.module.split('.')[0])
            self.assertLessEqual(imported,allowed)


# Each mutation changes a distinct contract condition, not copies of happy-path tests.
INVALID = [
 ('identity', ['request','action'], '*', 'wildcard_action'),
 ('identity', ['request','resource'], '', 'empty_resource'),
 ('identity', ['request','required_approvals'], ['owner','owner'], 'duplicate_required_approvals'),
 ('identity', ['approvals'], ['owner','owner'], 'duplicate_approvals'),
 ('identity', ['approvals'], 'owner', 'approval_not_list'),
 ('identity', ['rules',0,'effect'], 'permit', 'unknown_effect'),
 ('identity', ['rules',1,'id'], 'reader', 'duplicate_rule_id'),
 ('identity', ['rules',0,'action'], 'x'*81, 'identifier_too_long'),
 ('network', ['nodes'], [], 'empty_nodes'),
 ('network', ['nodes'], ['a','a'], 'duplicate_nodes'),
 ('network', ['source'], 'missing', 'unknown_source'),
 ('network', ['target'], True, 'boolean_target'),
 ('network', ['routes'], [['client','unknown']], 'unknown_edge_endpoint'),
 ('network', ['routes'], [['client']], 'malformed_edge'),
 ('network', ['allows'], [['client','edge'],['client','edge']], 'duplicate_edge'),
 ('network', ['routes'], [('client','edge')], 'edge_tuple_rejected'),
 ('network', ['nodes'], ['n'+str(x) for x in range(101)], 'too_many_nodes'),
 ('storage', ['requirements'], [], 'empty_requirements'),
 ('storage', ['requirements'], ['object_api','object_api'], 'duplicate_requirement'),
 ('storage', ['options'], [], 'empty_options'),
 ('storage', ['options',0,'capabilities'], ['a','a'], 'duplicate_capability'),
 ('storage', ['options',0,'caveats'], [1], 'nonstr_caveat'),
 ('storage', ['options',0,'caveats'], ['x'*301], 'oversized_caveat'),
 ('storage', ['options',1,'id'], 'S3-shaped', 'duplicate_option_id'),
 ('queues', ['messages'], [], 'empty_messages'),
 ('queues', ['messages',1,'id'], 'order-1', 'duplicate_message_id'),
 ('queues', ['messages',0,'amount_cents'], True, 'boolean_cents'),
 ('queues', ['messages',0,'amount_cents'], -1, 'negative_cents'),
 ('queues', ['messages',0,'amount_cents'], 1.0, 'float_cents'),
 ('queues', ['messages',0,'amount_cents'], float('nan'), 'nan_cents'),
 ('queues', ['max_attempts'], 0, 'zero_attempts'),
 ('queues', ['max_attempts'], True, 'boolean_attempts'),
 ('queues', ['max_attempts'], 101, 'unbounded_attempts'),
 ('queues', ['deliveries',0,'id'], 'unknown', 'unknown_delivery'),
 ('queues', ['deliveries',0,'handler_ok'], 1, 'nonboolean_handler'),
 ('queues', ['deliveries',0,'ack_received'], 'false', 'nonboolean_ack'),
 ('queues', ['deliveries',2,'ack_received'], True, 'failure_ack_contradiction'),
 ('resilience', ['failed_domains'], ['unknown'], 'unknown_failure_domain'),
 ('resilience', ['replicas',1,'id'], 'app-1', 'duplicate_replica_id'),
 ('resilience', ['required_survivors'], 0, 'zero_survivor_requirement'),
 ('resilience', ['required_survivors'], 4, 'excess_survivor_requirement'),
 ('resilience', ['measured_restore_minutes'], True, 'boolean_restore'),
 ('resilience', ['backup_age_minutes'], -1, 'negative_backup_age'),
 ('resilience', ['target_rto_minutes'], float('inf'), 'infinite_rto'),
 ('resilience', ['target_rpo_minutes'], 1.5, 'fractional_rpo'),
 ('operations', ['evidence'], [], 'empty_evidence'),
 ('operations', ['evidence',1,'id'], 'e1', 'duplicate_evidence_id'),
 ('operations', ['evidence',0,'summary'], '', 'empty_summary'),
 ('operations', ['evidence',0,'kind'], {}, 'malformed_kind'),
 ('cost', ['lines'], [], 'empty_cost_lines'),
 ('cost', ['lines',1,'id'], 'compute-hours', 'duplicate_cost_id'),
 ('cost', ['budget_cents'], True, 'boolean_budget'),
 ('cost', ['budget_cents'], -1, 'negative_budget'),
 ('cost', ['lines',0,'quantity'], 'NaN', 'nan_quantity'),
 ('cost', ['lines',0,'unit_usd'], 'Infinity', 'infinite_rate'),
 ('cost', ['lines',0,'quantity'], '-1', 'negative_quantity'),
 ('cost', ['lines',0,'unit_usd'], '-0.1', 'negative_rate'),
 ('cost', ['lines',0,'unit_usd'], 0.1, 'float_rate'),
 ('cost', ['lines',0,'unit_usd'], True, 'boolean_rate'),
 ('cost', ['lines',0,'quantity'], '1e9', 'scientific_notation'),
 ('cost', ['lines',0,'quantity'], '01', 'ambiguous_leading_zero'),
 ('cost', ['lines',0,'quantity'], '1000000000', 'oversized_decimal'),
 ('cost', ['lines',0,'unit_usd'], '0.0000001', 'excess_rate_precision'),
]


def invalid_test(name, path, value):
    def test(self):
        data=deepcopy(self.cases[name]); current=data
        for part in path[:-1]: current=current[part]
        current[path[-1]]=deepcopy(value)
        with self.assertRaises(lab.ContractError): runner.FUNCTIONS[name](**data)
    return test

for model, path, value, label in INVALID:
    setattr(Models,'test_contract_'+model+'_'+label,invalid_test(model,path,value))

if __name__ == '__main__': unittest.main()
