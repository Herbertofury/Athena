"""Content, link, exact worked-output and deterministic-rendering acceptance checks."""
import collections
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import subprocess
import sys
import unittest
from urllib.parse import urlsplit, unquote
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from ccna_content import LESSONS, PATH, REGISTER, MAPPING
COMMANDS=['vlans','loop-control','bundles','ipv6','routing','ospf','services','wireless','automation','capstone']

def run(command):
    p=subprocess.run([sys.executable,'-B',str(ROOT/'labs/ccna-workshop/run_lab.py'),command],capture_output=True,text=True,check=True)
    return json.loads(p.stdout)

class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.ids=[];self.links=[];self.tags=collections.Counter();self.scripts=[]
    def handle_starttag(self,tag,attrs):
        self.tags[tag]+=1;d=dict(attrs)
        if 'id' in d:self.ids.append(d['id'])
        if 'href' in d:self.links.append(d['href'])
        if tag=='script':self.scripts.append(d)

class ContentTests(unittest.TestCase):
    def test_structure(self):
        self.assertEqual([x['id'] for x in LESSONS],['ccnaf-'+x for x in COMMANDS])
        answers=[]
        for x in LESSONS:
            with self.subTest(lesson=x['id']):
                self.assertEqual(len(x['explain']),6)
                self.assertTrue(400<=len(' '.join(x['explain']).split())<=550)
                for k,n in [('learningGoals',3),('lab',6),('evidence',3),('additionalChecks',2)]:self.assertEqual(len(x[k]),n)
                self.assertGreater(len(x['example'].split()),85)
                self.assertGreater(len(x['limitations'].split()),20)
                self.assertEqual(x['workedCode'].splitlines()[-1],'python3 -B labs/ccna-workshop/run_lab.py '+x['id'][6:])
                for q in [x]+x['additionalChecks']:
                    self.assertEqual(len(q['options']),4);self.assertEqual(len(set(q['options'])),4)
                    self.assertIn(q['answer'],range(4));self.assertGreater(len(q['why'].split()),10)
                    answers.append(q['answer'])
        counts=collections.Counter(answers)
        self.assertEqual(len(answers),30);self.assertLessEqual(max(counts.values())-min(counts.values()),1)
    def test_sources_and_mapping(self):
        sources={x['key']:x for x in REGISTER['sources']}
        for x in sources.values():
            self.assertEqual(x['reviewedAt'],'2026-11-08');self.assertTrue(x['scope'])
            host=urlsplit(x['url']).hostname
            self.assertTrue(host.endswith('cisco.com') or host.endswith('rfc-editor.org'))
        for x in LESSONS:
            self.assertGreaterEqual(len(x['sourceKeys']),2)
            self.assertEqual(x['sources'],[sources[k]['url'] for k in x['sourceKeys']])
        self.assertEqual(MAPPING['baseline'],'v1.1')
        self.assertEqual(MAPPING['currentLastTestDate'],'2027-02-02')
        self.assertEqual(MAPPING['announcedNextVersion']['firstTestDate'],'2027-02-03')
        for x in MAPPING['lessons']:
            self.assertEqual(x['alignment'],'partial');self.assertTrue(x['localEvidence']);self.assertTrue(x['remainingGap'])
        self.assertIn('6.4',MAPPING['notClaimedObjectives']);self.assertIn('6.6',MAPPING['notClaimedObjectives'])
    def test_path_and_prerequisites(self):
        self.assertEqual(PATH['id'],'ccna-workshop');self.assertEqual(PATH['certificationIds'],['ccna'])
        self.assertEqual(PATH['lessonIds'],[x['id'] for x in LESSONS])
        # Portable contract: these are the exact intended Packet Trail references.
        # Athena integration separately checks these identifiers against its live catalog.
        self.assertEqual(PATH['prerequisites'],[
            'net-packet-journey','net-subnet-planning','net-route-arp',
            'net-dns-evidence','net-dhcp-evidence','net-incident-proof'])
    def test_html_semantics_and_links(self):
        p=Page();s=(ROOT/'START-HERE.html').read_text();p.feed(s)
        self.assertIn('<html lang="en">',s);self.assertIn('name="viewport"',s)
        self.assertEqual(len(p.ids),len(set(p.ids)));self.assertIn('main',p.ids)
        self.assertEqual(p.tags['section'],10);self.assertEqual(p.tags['details'],30)
        self.assertEqual(p.tags['summary'],30);self.assertEqual(p.scripts,[])
        self.assertIn(':focus-visible',s)
        for x in LESSONS:self.assertIn(x['id'],p.ids)
        for link in p.links:
            parsed=urlsplit(link)
            if parsed.scheme:continue
            if parsed.path:self.assertTrue((ROOT/unquote(parsed.path)).exists(),link)
            elif parsed.fragment:self.assertIn(parsed.fragment,p.ids)
    def test_markdown_links(self):
        paths=[ROOT/'README.md']+list((ROOT/'docs').rglob('*.md'))+list((ROOT/'labs').rglob('*.md'))
        for p in paths:
            for link in re.findall(r'\[[^\]]*\]\(([^)]+)\)',p.read_text()):
                q=urlsplit(link)
                if not q.scheme and q.path:
                    target=(p.parent/unquote(q.path)).resolve()
                    self.assertTrue(target.is_relative_to(ROOT.resolve()),str(p)+': link escapes portable pack: '+link)
                    self.assertTrue(target.exists(),str(p)+': '+link)
    def test_generated_json(self):
        self.assertEqual(json.loads((ROOT/'content/ccna-lessons.json').read_text()),LESSONS)
        self.assertEqual(json.loads((ROOT/'content/ccna-path.json').read_text()),PATH)
        checks=json.loads((ROOT/'content/ccna-checks.json').read_text())
        self.assertEqual(len(checks),30);self.assertEqual(len({q['id'] for q in checks}),30)
        for lesson in LESSONS:
            selected=[q for q in checks if q['lessonId']==lesson['id']]
            self.assertEqual(len(selected),3)
            for q,original in zip(selected,[lesson]+lesson['additionalChecks']):
                for k in ['question','options','answer','why']:self.assertEqual(q[k],original[k])
    def test_deterministic_rendering(self):
        files=[ROOT/'START-HERE.html',ROOT/'docs/paths/ccna-workshop.md']+list((ROOT/'content').glob('*.json'))+list((ROOT/'docs/shared').glob('*.md'))
        before={str(p.relative_to(ROOT)):p.read_bytes() for p in files}
        for _ in range(2):
            subprocess.run([sys.executable,'-B',str(ROOT/'scripts/render_ccna_content.py')],check=True,capture_output=True)
            self.assertEqual(before,{str(p.relative_to(ROOT)):p.read_bytes() for p in files})

class WorkedOutputTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.receipts={n:run(n) for n in COMMANDS}
    def test_envelopes(self):
        for n,r in self.receipts.items():
            self.assertEqual(r['command'],n);self.assertIs(r['real_network_executed'],False);self.assertIs(r['synthetic_model'],True)
    def result(self,n):return self.receipts[n]['result']
    def test_vlans(self):
        r=self.result('vlans')
        self.assertEqual(r['trunk_intersections'],{'uplink':[10,20]})
        self.assertEqual(r['events'],[{'decision':'flood_unknown_unicast','egress':['uplink']},{'decision':'known_unicast','egress':['deskA']},{'decision':'flood_unknown_unicast','egress':['deskB']},{'decision':'drop_vlan','egress':[]}])
        self.assertEqual(r['learned'],[{'mac':'02:00:00:00:00:01','port':'deskA','vlan':10},{'mac':'02:00:00:00:00:02','port':'uplink','vlan':10},{'mac':'02:00:00:00:00:01','port':'uplink','vlan':20}])
    def test_loop_control(self):
        r=self.result('loop-control');self.assertEqual(r['root'],'root');p={x['switch']:x for x in r['paths']}
        self.assertEqual(p['edge'],{'switch':'edge','root_cost':8,'candidate_neighbors':['left','right'],'status':'equal_cost_not_fully_tiebroken'})
        self.assertEqual(p['island']['root_cost'],None);self.assertEqual(p['island']['status'],'unreachable')
        for n in ['left','right']:self.assertEqual(p[n]['root_cost'],4);self.assertEqual(p[n]['candidate_neighbors'],['root'])
    def test_bundles(self):
        r=self.result('bundles');self.assertFalse(r['all_compatible']);self.assertEqual(r['reference_member'],'m1')
        self.assertEqual(r['members'],[{'member':'m1','compatible':True,'reasons':[]},{'member':'m2','compatible':False,'reasons':['both_passive']},{'member':'m3','compatible':False,'reasons':['speed_mismatch','vlan_mismatch']}])
    def test_ipv6(self):
        r=self.result('ipv6');self.assertEqual(r['prefix'],'2001:db8:42::/64');self.assertEqual(r['prefix_length'],64)
        self.assertEqual([(x['address'],x['category'],x['in_prefix']) for x in r['addresses']],[('2001:db8:42::7','other_unicast',True),('2001:db8:43::7','other_unicast',False),('fe80::1','link_local',False),('fd00::1','unique_local',False),('ff02::1','multicast',False),('::','unspecified',False),('::1','loopback',False)])
        self.assertFalse(r['reachability_proven']);self.assertEqual(r['neighbor_observation'],'advertisement_seen')
    def test_routing(self):
        self.assertEqual(self.result('routing'),{'destination':'192.0.2.77','prefix_length':26,'admin_distance':220,'decision':'unique_route','selected':['specific']})
    def test_ospf(self):
        r=self.result('ospf');self.assertEqual(r['shortest_costs'],{'A':0,'B':5,'C':3,'D':9,'island':None});self.assertEqual(r['source'],'A')
        self.assertEqual(r['neighbors'],[{'neighbor':'peerA','prerequisites_satisfied':False,'failed_checks':['mtu_match'],'full_adjacency_proven':False},{'neighbor':'peerB','prerequisites_satisfied':True,'failed_checks':[],'full_adjacency_proven':False}])
    def test_services(self):
        r=self.result('services');self.assertEqual(r['acl_decision'],'deny');self.assertEqual(r['matched_rule'],'blockHost')
        self.assertFalse(r['implicit_deny']);self.assertEqual(r['source_mapping_if_applied'],'203.0.113.9');self.assertFalse(r['translation_executed'])
    def test_wireless(self):
        r=self.result('wireless');self.assertFalse(r['rf_measurements_available'])
        self.assertEqual(r['aps'],[{'ap':'lobby','eligible':True,'reasons':[]},{'ap':'office','eligible':False,'reasons':['unsupported_client_security']},{'ap':'guest','eligible':False,'reasons':['unsupported_client_security','below_requested_security']}])
        self.assertEqual([x['relationship'] for x in r['channel_pairs']],['overlap_in_simplified_plan','separated_in_simplified_plan','overlap_in_simplified_plan'])
    def test_automation(self):
        self.assertEqual(self.result('automation'),{'applied':False,'changes':[{'change':'update','fields':['vlan','description'],'id':'desk'},{'change':'remove','id':'retired'},{'change':'create','id':'uplink'}],'desired_dependency_order':['uplink','desk']})
    def test_capstone(self):
        self.assertEqual(self.result('capstone'),{'contradictions':['acl_order'],'end_to_end_success_proven':False,'gaps':['application_response','neighbor_exchange'],'next_step':'Resolve contradictions and collect missing independent evidence in an authorized environment.','supporting':['route_selection','vlan_membership']})

if __name__=='__main__':unittest.main()
