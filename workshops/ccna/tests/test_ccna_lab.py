"""Behavior, trust-boundary, and fixed-CLI tests for the synthetic CCNA models."""
import sys
sys.dont_write_bytecode = True
import ast
import copy
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1] / 'labs' / 'ccna-workshop'
sys.path.insert(0, str(ROOT))
import lab
import run_lab


def fixture(command):
    return lab.decode((ROOT / 'fixtures' / (command + '.json')).read_bytes())


def result(command, data=None):
    return lab.run(command, fixture(command) if data is None else data)['result']


def replace(data, path, value):
    for key in path[:-1]:
        data = data[key]
    data[path[-1]] = value


class ModelTests(unittest.TestCase):
    def test_vlan_intersection(self):
        self.assertEqual(result('vlans')['trunk_intersections'], {'uplink': [10, 20]})

    def test_vlan_learning_scope(self):
        rows = result('vlans')['learned']
        self.assertEqual([(r['vlan'], r['port']) for r in rows if r['mac'].endswith('01')], [(10, 'deskA'), (20, 'uplink')])

    def test_vlan_unknown_flood(self):
        self.assertEqual(result('vlans')['events'][0], {'decision':'flood_unknown_unicast','egress':['uplink']})

    def test_vlan_known_forward(self):
        self.assertEqual(result('vlans')['events'][1], {'decision':'known_unicast','egress':['deskA']})

    def test_vlan_invalid_ingress_does_not_learn(self):
        out = result('vlans')
        self.assertEqual(out['events'][3]['decision'], 'drop_vlan')
        self.assertFalse(any(r['mac'].endswith('03') for r in out['learned']))

    def test_vlan_same_port_filters(self):
        d = fixture('vlans'); d['frames'] = [d['frames'][0]] * 2
        d['frames'] = copy.deepcopy(d['frames']); d['frames'][1]['destination'] = d['frames'][0]['source']
        self.assertEqual(result('vlans', d)['events'][1]['decision'], 'filter_same_port')

    def test_vlan_mac_move(self):
        d = fixture('vlans'); d['frames'] = d['frames'][:2]
        d['frames'][1]['source'] = d['frames'][0]['source']
        self.assertEqual(result('vlans', d)['learned'][0]['port'], 'uplink')

    def test_vlan_empty_intersection(self):
        d = fixture('vlans'); d['ports'][2]['peer_vlans'] = [30]
        self.assertEqual(result('vlans', d)['events'][0]['egress'], [])

    def test_loop_root_priority(self):
        self.assertEqual(result('loop-control')['root'], 'root')

    def test_loop_mac_tiebreak(self):
        d=fixture('loop-control'); d['switches'][0]['priority']=32768
        self.assertEqual(result('loop-control',d)['root'],'root')

    def test_loop_cost_tie_preserved(self):
        row=next(r for r in result('loop-control')['paths'] if r['switch']=='edge')
        self.assertEqual(row['root_cost'],8); self.assertEqual(row['candidate_neighbors'],['left','right'])
        self.assertEqual(row['status'],'equal_cost_not_fully_tiebroken')

    def test_loop_island(self):
        row=next(r for r in result('loop-control')['paths'] if r['switch']=='island')
        self.assertIsNone(row['root_cost']); self.assertEqual(row['status'],'unreachable')

    def test_loop_unequal_cost(self):
        d=fixture('loop-control'); d['links'][3]['cost']=5
        row=next(r for r in result('loop-control',d)['paths'] if r['switch']=='edge')
        self.assertEqual(row['candidate_neighbors'],['left'])

    def test_bundle_passive_pair(self):
        self.assertEqual(result('bundles')['members'][1]['reasons'],['both_passive'])

    def test_bundle_multiple_mismatches(self):
        self.assertEqual(result('bundles')['members'][2]['reasons'],['speed_mismatch','vlan_mismatch'])

    def test_bundle_vlan_order_irrelevant(self):
        d=fixture('bundles'); d['members']=d['members'][:2]; d['members'][1]['peer_mode']='active'
        self.assertTrue(result('bundles',d)['all_compatible'])

    def test_bundle_half_duplex_rejected_by_model(self):
        d=fixture('bundles'); d['members'][0]['duplex']='half'
        self.assertIn('model_requires_full_duplex',result('bundles',d)['members'][0]['reasons'])

    def test_ipv6_membership(self):
        rows=result('ipv6')['addresses']; self.assertTrue(rows[0]['in_prefix']); self.assertFalse(rows[1]['in_prefix'])

    def test_ipv6_categories(self):
        self.assertEqual([r['category'] for r in result('ipv6')['addresses']],['other_unicast','other_unicast','link_local','unique_local','multicast','unspecified','loopback'])

    def test_ipv6_no_reachability_claim(self):
        self.assertFalse(result('ipv6')['reachability_proven'])

    def test_ipv6_host_prefix(self):
        d=fixture('ipv6'); d['prefix']='2001:db8:42::7/128'
        self.assertTrue(result('ipv6',d)['addresses'][0]['in_prefix'])

    def test_route_lpm_before_ad(self):
        r=result('routing'); self.assertEqual(r['selected'],['specific']); self.assertEqual(r['admin_distance'],220)

    def test_route_floating_fallback(self):
        d=fixture('routing'); d['routes'][3]['active']=False
        self.assertEqual(result('routing',d)['selected'],['floating'])

    def test_route_primary_same_prefix(self):
        d=fixture('routing'); d['routes'][3]['active']=False; d['routes'][1]['active']=True
        self.assertEqual(result('routing',d)['selected'],['primary'])

    def test_route_unresolved_equal_candidates(self):
        d=fixture('routing'); d['routes'].append(dict(d['routes'][3],id='equal'))
        self.assertEqual(result('routing',d)['selected'],['equal','specific'])
        self.assertEqual(result('routing',d)['decision'],'tie_not_resolved')

    def test_route_default(self):
        d=fixture('routing'); d['destination']='203.0.113.5'
        self.assertEqual(result('routing',d)['selected'],['default'])

    def test_route_no_route(self):
        d=fixture('routing'); d['routes']=[]
        self.assertEqual(result('routing',d)['decision'],'no_route')

    def test_route_ipv6(self):
        d={'destination':'2001:db8::7','routes':[{'id':'v6','prefix':'2001:db8::/32','admin_distance':1,'next_hop':'2001:db8:1::1','active':True}]}
        self.assertEqual(result('routing',d)['selected'],['v6'])

    def test_ospf_mtu_distinguished(self):
        self.assertEqual(result('ospf')['neighbors'][0]['failed_checks'],['mtu_match'])

    def test_ospf_checks_not_adjacency_proof(self):
        row=result('ospf')['neighbors'][1]; self.assertTrue(row['prerequisites_satisfied']); self.assertFalse(row['full_adjacency_proven'])

    def test_ospf_indirect_shortest_path(self):
        self.assertEqual(result('ospf')['shortest_costs'],{'A':0,'B':5,'C':3,'D':9,'island':None})

    def test_ospf_positive_cycle_safe(self):
        d=fixture('ospf'); d['links'].append({'a':'A','b':'D','cost':50})
        self.assertEqual(result('ospf',d)['shortest_costs']['D'],9)

    def test_acl_first_match(self):
        r=result('services'); self.assertEqual(r['acl_decision'],'deny'); self.assertEqual(r['matched_rule'],'blockHost')

    def test_acl_order_changes_result(self):
        d=fixture('services'); d['rules'].reverse()
        self.assertEqual(result('services',d)['acl_decision'],'permit')

    def test_acl_implicit_deny(self):
        d=fixture('services'); d['rules']=[]
        self.assertTrue(result('services',d)['implicit_deny'])

    def test_acl_port_mismatch(self):
        d=fixture('services'); d['packet']['source']='192.0.2.10'; d['packet']['destination_port']=80
        self.assertTrue(result('services',d)['implicit_deny'])

    def test_acl_protocol_mismatch(self):
        d=fixture('services'); d['packet']['source']='192.0.2.10'; d['packet']['protocol']='udp'
        self.assertTrue(result('services',d)['implicit_deny'])

    def test_nat_independent_evidence(self):
        r=result('services'); self.assertEqual(r['source_mapping_if_applied'],'203.0.113.9'); self.assertFalse(r['translation_executed'])

    def test_nat_no_mapping(self):
        d=fixture('services'); d['static_nat']=[]
        self.assertIsNone(result('services',d)['source_mapping_if_applied'])

    def test_wireless_eligibility(self):
        self.assertEqual([a['eligible'] for a in result('wireless')['aps']],[True,False,False])

    def test_wireless_channel_relationships(self):
        self.assertEqual([p['relationship'] for p in result('wireless')['channel_pairs']],['overlap_in_simplified_plan','separated_in_simplified_plan','overlap_in_simplified_plan'])

    def test_wireless_cochannel(self):
        d=fixture('wireless'); d['aps'][1]['channel']=1
        self.assertEqual(result('wireless',d)['channel_pairs'][0]['relationship'],'co_channel')

    def test_wireless_wpa3_client(self):
        d=fixture('wireless'); d['client_security'].append('wpa3_sae')
        self.assertTrue(result('wireless',d)['aps'][1]['eligible'])

    def test_automation_diff(self):
        self.assertEqual(result('automation')['changes'],[{'id':'desk','change':'update','fields':['vlan','description']},{'id':'retired','change':'remove'},{'id':'uplink','change':'create'}])

    def test_automation_dependency_order(self):
        self.assertEqual(result('automation')['desired_dependency_order'],['uplink','desk'])

    def test_automation_idempotent_desired(self):
        d=fixture('automation'); d['actual']=copy.deepcopy(d['desired'])
        self.assertEqual(result('automation',d)['changes'],[])

    def test_automation_empty(self):
        self.assertEqual(result('automation',{'actual':[],'desired':[],'dependencies':[]})['changes'],[])

    def test_capstone_independent_gaps(self):
        r=result('capstone'); self.assertEqual(r['gaps'],['application_response','neighbor_exchange']); self.assertEqual(r['contradictions'],['acl_order'])

    def test_capstone_all_support_still_no_execution_proof(self):
        d={'observations':[{'topic':t,'outcome':'supports'} for t in ('vlan_membership','route_selection','acl_order','neighbor_exchange','application_response')]}
        r=result('capstone',d); self.assertEqual(r['gaps'],[]); self.assertFalse(r['end_to_end_success_proven'])

    def test_capstone_missing_all(self):
        self.assertEqual(len(result('capstone',{'observations':[]})['gaps']),5)


class Boundaries(unittest.TestCase):
    def test_unknown_command(self):
        with self.assertRaises(lab.LabError): lab.run('../routing',{})

    def test_read_is_bounded(self):
        stream=io.BytesIO(b' '*(lab.MAX_BYTES+2))
        with patch.object(Path,'open',return_value=stream),patch('sys.stdout',new_callable=io.StringIO) as out:
            self.assertEqual(run_lab.main(['routing']),2)
            self.assertIn('exceeds',json.loads(out.getvalue())['error']['message'])

    def test_missing_fixture_is_predictable(self):
        with patch.object(Path,'open',side_effect=OSError('private details')),patch('sys.stdout',new_callable=io.StringIO) as out:
            self.assertEqual(run_lab.main(['routing']),2)
            self.assertNotIn('private details',out.getvalue()); self.assertFalse(json.loads(out.getvalue())['real_network_executed'])

    def test_symlink_fixture_rejected(self):
        with patch.object(Path,'is_symlink',return_value=True),patch('sys.stdout',new_callable=io.StringIO) as out:
            self.assertEqual(run_lab.main(['routing']),2)
            self.assertIn('symlinks',out.getvalue())

    def test_no_network_or_execution_imports(self):
        allowed={'sys','ipaddress','json','re','pathlib','lab'}
        for filename in ('lab.py','run_lab.py'):
            tree=ast.parse((ROOT/filename).read_text())
            for node in ast.walk(tree):
                if isinstance(node,ast.Import): self.assertTrue(all(n.name in allowed for n in node.names))
                if isinstance(node,ast.ImportFrom): self.assertIn(node.module,allowed)
                if isinstance(node,ast.Call) and isinstance(node.func,ast.Name): self.assertNotIn(node.func.id,('eval','exec','compile','__import__'))

    def test_bytecode_disabled(self):
        self.assertTrue(sys.dont_write_bytecode)


# Every generated case is an independently named contract or malformed field.
def add_invalid(label, command, path, value):
    def check(self):
        data=fixture(command); replace(data,path,copy.deepcopy(value))
        with self.assertRaises(lab.LabError): lab.run(command,data)
    setattr(Boundaries,'test_invalid_'+label,check)

INVALID = [
('port_duplicate','vlans',['ports',1,'id'],'deskA'),('port_mode','vlans',['ports',0,'mode'],'native'),
('access_multiple','vlans',['ports',0,'local_vlans'],[10,20]),('access_peer','vlans',['ports',0,'peer_vlans'],[10]),
('vlan_zero','vlans',['ports',0,'local_vlans'],[0]),('vlan_reserved','vlans',['ports',0,'local_vlans'],[4095]),
('vlan_bool','vlans',['ports',0,'local_vlans'],[True]),('vlan_duplicate','vlans',['ports',2,'local_vlans'],[10,10]),
('vlan_float','vlans',['frames',0,'vlan'],10.0),('port_orphan','vlans',['frames',0,'ingress'],'unknown'),
('mac_multicast','vlans',['frames',0,'source'],'01:00:00:00:00:01'),('mac_uppercase','vlans',['frames',0,'source'],'02:AA:00:00:00:01'),
('mac_short','vlans',['frames',0,'destination'],'02:00:00'),('empty_ports','vlans',['ports'],[]),
('priority_step','loop-control',['switches',0,'priority'],4097),('priority_bool','loop-control',['switches',0,'priority'],False),
('priority_high','loop-control',['switches',0,'priority'],65535),('switch_duplicate','loop-control',['switches',1,'id'],'root'),
('cost_zero','loop-control',['links',0,'cost'],0),('cost_negative','loop-control',['links',0,'cost'],-1),
('cost_bool','loop-control',['links',0,'cost'],True),('cost_high','loop-control',['links',0,'cost'],65536),
('graph_orphan','loop-control',['links',0,'b'],'missing'),('graph_self_loop','loop-control',['links',0,'b'],'root'),
('bridge_duplicate','loop-control',['switches',1],{'id':'left','priority':4096,'mac':'02:00:00:00:00:01'}),
('link_duplicate','loop-control',['links',1],{'a':'left','b':'root','cost':4}),
('bundle_empty','bundles',['members'],[]),('bundle_speed_bool','bundles',['members',0,'speed_mbps'],True),
('bundle_speed_zero','bundles',['members',0,'speed_mbps'],0),('bundle_speed_huge','bundles',['members',0,'speed_mbps'],1000001),
('bundle_duplex','bundles',['members',0,'duplex'],'auto'),('bundle_local','bundles',['members',0,'local_mode'],'on'),
('bundle_peer','bundles',['members',0,'peer_mode'],'desirable'),('bundle_duplicate','bundles',['members',1,'id'],'m1'),
('bundle_vlan_empty','bundles',['members',0,'vlans'],[]),('bundle_vlan_duplicate','bundles',['members',0,'vlans'],[10,10]),
('ipv6_wrong_prefix','ipv6',['prefix'],'192.0.2.0/24'),('ipv6_host_bits','ipv6',['prefix'],'2001:db8::1/64'),
('ipv6_wrong_address','ipv6',['addresses'],['192.0.2.1']),('ipv6_scoped','ipv6',['addresses'],['fe80::1%eth0']),
('ipv6_duplicate','ipv6',['addresses'],['2001:db8::1','2001:0db8::1']),('ipv6_invalid','ipv6',['addresses'],['2001:::1']),
('ipv6_observation','ipv6',['neighbor_observation'],'reachable'),('ipv6_empty','ipv6',['addresses'],[]),
('route_bool_ad','routing',['routes',0,'admin_distance'],True),('route_ad_negative','routing',['routes',0,'admin_distance'],-1),
('route_ad_255','routing',['routes',0,'admin_distance'],255),('route_active_integer','routing',['routes',0,'active'],1),
('route_destination','routing',['destination'],'not-an-ip'),('route_host_bits','routing',['routes',1,'prefix'],'192.0.2.7/24'),
('route_version','routing',['routes',0,'next_hop'],'2001:db8::1'),('route_duplicate','routing',['routes',1,'id'],'default'),
('route_no_cidr','routing',['routes',0,'prefix'],'192.0.2.0'),('route_prefix_bool','routing',['routes',0,'prefix'],False),
('ospf_boolean','ospf',['neighbors',0,'mtu_match'],0),('ospf_source','ospf',['source'],'missing'),
('ospf_nodes_duplicate','ospf',['nodes'],['A','A']),('ospf_neighbor_duplicate','ospf',['neighbors',1,'id'],'peerA'),
('ospf_graph_orphan','ospf',['links',0,'b'],'missing'),('ospf_cost_float','ospf',['links',0,'cost'],3.5),
('ospf_graph_self_loop','ospf',['links',0,'b'],'A'),('ospf_empty_nodes','ospf',['nodes'],[]),
('acl_action','services',['rules',0,'action'],'allow'),('acl_protocol','services',['packet','protocol'],'sctp'),
('acl_port_bool','services',['packet','destination_port'],True),('acl_port_high','services',['packet','destination_port'],65536),
('acl_reversed','services',['rules',1,'port_min'],444),('acl_rule_duplicate','services',['rules',1,'id'],'blockHost'),
('acl_ipv6_packet','services',['packet','source'],'2001:db8::1'),('acl_any_narrow_ports','services',['rules',0,'port_min'],1),
('acl_icmp_nonzero','services',['packet','protocol'],'icmp'),('acl_bad_network','services',['rules',0,'source'],'192.0.2.9/24'),
('nat_invalid_global','services',['static_nat',0,'inside_global'],'bad'),('nat_ipv6','services',['static_nat',0,'inside_local'],'::1'),
('wifi_band','wireless',['aps',0,'band'],'5'),('wifi_width','wireless',['aps',0,'width_mhz'],40),
('wifi_width_bool','wireless',['aps',0,'width_mhz'],True),('wifi_channel_zero','wireless',['aps',0,'channel'],0),
('wifi_channel_12','wireless',['aps',0,'channel'],12),('wifi_channel_bool','wireless',['aps',0,'channel'],True),
('wifi_security','wireless',['aps',0,'security'],'wep'),('wifi_client_duplicate','wireless',['client_security'],['wpa2_aes','wpa2_aes']),
('wifi_client_empty','wireless',['client_security'],[]),('wifi_ap_duplicate','wireless',['aps',1,'id'],'lobby'),
('inventory_bool_vlan','automation',['actual',0,'vlan'],True),('inventory_enabled_int','automation',['actual',0,'enabled'],1),
('inventory_description_number','automation',['actual',0,'description'],7),('inventory_description_long','automation',['actual',0,'description'],'a'*81),
('inventory_duplicate','automation',['actual',1,'id'],'desk'),('desired_duplicate','automation',['desired',1,'id'],'desk'),
('dependency_orphan','automation',['dependencies',0,'before'],'absent'),('dependency_self_cycle','automation',['dependencies',0,'before'],'desk'),
('dependency_cycle','automation',['dependencies'],[{'before':'desk','after':'uplink'},{'before':'uplink','after':'desk'}]),
('dependency_duplicate','automation',['dependencies'],[{'before':'uplink','after':'desk'},{'before':'uplink','after':'desk'}]),
('evidence_unknown_topic','capstone',['observations',0,'topic'],'ping'),('evidence_outcome_bool','capstone',['observations',0,'outcome'],True),
('evidence_duplicate','capstone',['observations',1,'topic'],'vlan_membership'),('evidence_unsupported_outcome','capstone',['observations',0,'outcome'],'proved'),
]
for case in INVALID: add_invalid(*case)

for command in lab.COMMANDS:
    def schema(self,c=command):
        for data in ([],None,True,{},dict(fixture(c),extra=1)):
            with self.subTest(data=data), self.assertRaises(lab.LabError): lab.run(c,data)
    setattr(Boundaries,'test_top_schema_'+command.replace('-','_'),schema)
    def immutable(self,c=command):
        data=fixture(c); before=copy.deepcopy(data)
        first=lab.run(c,data); second=lab.run(c,data)
        self.assertEqual(data,before); self.assertEqual(first,second)
        self.assertFalse(first['real_network_executed']); self.assertTrue(first['synthetic_model'])
    setattr(ModelTests,'test_pure_repeatable_'+command.replace('-','_'),immutable)
    def cli(self,c=command):
        completed=subprocess.run([sys.executable,'-B',str(ROOT/'run_lab.py'),c],capture_output=True,text=True,check=False)
        self.assertEqual(completed.returncode,0,completed.stderr)
        self.assertEqual(json.loads(completed.stdout),lab.run(c,fixture(c)))
    setattr(Boundaries,'test_fixed_cli_'+command.replace('-','_'),cli)

BAD_JSON={
'empty':b'', 'syntax':b'{', 'trailing':b'{} {}', 'utf8':b'\xff',
'duplicate':b'{"a":1,"a":2}', 'nested_duplicate':b'{"a":{"b":1,"b":2}}',
'nan':b'{"a":NaN}', 'infinity':b'[Infinity]', 'negative_infinity':b'[-Infinity]',
'float':b'[1.5]', 'overflow_exponent':b'[1e9999]', 'large_integer':b'[1000001]',
'huge_integer':b'['+b'9'*5000+b']','depth':b'['*20+b'0'+b']'*20,
'deep_parser':b'['*1500+b'0'+b']'*1500,'oversize':b' '*65537,
'long_string':json.dumps('a'*257).encode(),'long_array':json.dumps([0]*129).encode(),
'long_object':json.dumps({str(n):0 for n in range(129)}).encode(),
}
for label,raw in BAD_JSON.items():
    def bad_json(self,r=raw):
        with self.assertRaises(lab.LabError): lab.decode(r)
    setattr(Boundaries,'test_json_'+label,bad_json)

for index,args in enumerate(([],['routing','extra'],['../routing'],['/tmp/input.json'],['--help'],['ROUTING'],['routing.json'])):
    def bad_cli(self,a=args):
        with patch('sys.stdout',new_callable=io.StringIO) as output:
            self.assertEqual(run_lab.main(a),2)
            parsed=json.loads(output.getvalue()); self.assertFalse(parsed['real_network_executed'])
            self.assertEqual(parsed['error']['code'],'invalid_input'); self.assertIsNone(parsed['command'])
    setattr(Boundaries,'test_cli_rejects_argument_form_'+str(index),bad_cli)

if __name__ == '__main__': unittest.main()
