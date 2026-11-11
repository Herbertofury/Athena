"""Offline preservation comparisons; synthetic inputs and unchanged official code example."""
from pathlib import Path
import argparse
import hashlib, importlib.util, json, sys
parser = argparse.ArgumentParser(description='Compare complete ordinary records against a local PR54 checkout; no network.')
parser.add_argument('--baseline', type=Path, required=True, help='Root of exact PR54 checkout 9ff4679a30baa1840bb16c357d0bb3f0866b88d6')
parser.add_argument('--candidate', type=Path, default=Path(__file__).resolve().parents[3])
args = parser.parse_args()
B, C = args.baseline, args.candidate
rel = 'engineering/experiments/site-extraction-lab/discord_message.py'
assert hashlib.sha256((B/rel).read_bytes()).hexdigest() == 'b522913010d9ca91f6e39f0338323a72809df169da4234a34e2937c78f783948', 'Unexpected baseline module'
sys.path.insert(0,str((C/rel).parent))
def load(root,name):
 spec=importlib.util.spec_from_file_location(name,root/rel);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
old,new=load(B,'legacy_discord'),load(C,'current_discord')
base={'id':'1','channel_id':'2'}; at={'id':'3','filename':'synthetic.png','url':'https://example.com/synthetic.png','content_type':'image/png'}
cases=[]
for field in ('image','thumbnail','video'):
 for ref in ({'url':'attachment://synthetic.png'},{'attachment_id':'3'}): cases.append(base|{'attachments':[at],'embeds':[{field:ref}]})
cases += [base|{'content':'synthetic ordinary text'},base|{'components':[{'type':17,'spoiler':False,'components':[{'type':10,'content':'synthetic'},{'type':12,'items':[{'media':{'url':'https://example.com/synthetic.gif','content_type':'image/gif'},'spoiler':True}]}]}]},base|{'message_snapshots':[{'message':{'content':'synthetic forwarded','attachments':[at]}}]}]
fixture=json.loads((C/'engineering/experiments/discord-component-embed-lab/fixtures/official-component-example.json').read_text())
cases.append(base|{'content':'','embeds':[{'type':'components','components':[fixture['component']]}]})
results=[]
for i,payload in enumerate(cases):
 for access in ('available','unknown'):
  a=old.normalize_message(payload,access=access);b=new.normalize_message(payload,access=access);assert a==b,(i,access)
  sha=hashlib.sha256(json.dumps(a,ensure_ascii=False,sort_keys=True).encode()).hexdigest()
  results.append(dict(case=i,access=access,complete_normalized_record_sha256=sha,identical=True,classification='unchanged official code sample in synthetic envelope' if i==9 else 'synthetic ordinary-behavior preservation'))
report=dict(schema_version=1,base_commit='9ff4679a30baa1840bb16c357d0bb3f0866b88d6',baseline_module_sha256=hashlib.sha256((B/rel).read_bytes()).hexdigest(),candidate_module_sha256=hashlib.sha256((C/rel).read_bytes()).hexdigest(),full_normalized_record_comparisons=len(results),all_identical=True,network_used=False,cases=results,limits=['This is preservation for the selected inputs, not proof for every Discord field or real API response.','The actual source code sample has no positive container spoiler or returned flag bits. All positive new states remain synthetic.'])
print(json.dumps(report, indent=2))
