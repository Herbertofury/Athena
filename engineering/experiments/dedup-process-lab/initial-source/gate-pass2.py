"""Exact fixed-worker protocol; the engine deliberately omits zero correctness failures."""
import importlib.util,pathlib,re
ROOT=pathlib.Path(__file__).resolve().parents[2]
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);v=importlib.util.module_from_spec(spec);spec.loader.exec_module(v);return v
wire=module('dedup_protocol_wire',ROOT/'experiments/upstream-validation-lab/receipt_gate.py')
memory=module('dedup_protocol_memory',ROOT/'experiments/process-memory-lab/snapshot_gate.py')
SCOPE='Fresh process, one full strategy call; Linux self high-water through output retention before evidence serialization; includes input and observer overhead; not app or browser peak'
TRIAL={'baseline_ns','candidate_ns','equal_complete_output','peak_bytes','cancelled_cleanly'}
def require(value,message):
 if not value:raise ValueError(message)
def validate_worker(raw,lane,input_sha,output,identities):
 v=wire.decode_receipt(raw)
 fields={'schema_version','lane','input_count','input_sha256','output','elapsed_ns','before_input','after_input','retained_output','compiler','profile','opt_level','flags_sha256','target','scope',*identities}
 require(isinstance(v,dict) and set(v)==fields,'Unexpected worker fields')
 require(type(v['schema_version']) is int and v['schema_version']==1 and v['lane']==lane and lane in ['baseline','indexed'],'Worker identity mismatch')
 require(type(v['input_count']) is int and v['input_count']==6000 and v['input_sha256']==input_sha,'Input identity mismatch')
 require(v['output']==output,'Complete ordered output differs')
 require(type(v['elapsed_ns']) is int and 0<v['elapsed_ns']<=10_000_000_000,'Invalid timing')
 require(all(v[k]==value for k,value in identities.items()),'Source identity mismatch')
 require(v['profile']=='release' and v['opt_level']=='3' and isinstance(v['compiler'],str) and v['compiler'].startswith('rustc 1.99.1 ') and v['target']=='x86_64-unknown-linux-gnu' and isinstance(v['flags_sha256'],str) and re.fullmatch('[0-9a-f]{64}',v['flags_sha256']),'Build identity mismatch')
 require(v['scope']==SCOPE,'Worker scope mismatch')
 for phase in ['before_input','after_input','retained_output']:
  memory.validate_snapshot(v[phase]);require(all(v[phase][k]<=128*1024*1024 for k in memory.FIELDS),'Memory exceeds worker address-space bound')
 return v

def validate_engine(raw,runner_sha):
 v=wire.decode_receipt(raw)
 require(isinstance(v,dict) and set(v)=={'evidence','warmup_trials','decision','reason','completed','first_failure','elapsed_ms','limitations'},'Unexpected engine fields')
 require(v['completed'] is True and v['reason']=='Completed' and v['first_failure'] is None,'Engine did not complete')
 e=v['evidence'];required={'candidate_revision','baseline_revision','workload_id','environment_id','trials','stress_cases','stress_failures'}
 require(isinstance(e,dict) and set(e) in [required,required|{'correctness_failures'}],'Unexpected evidence fields')
 require(e['candidate_revision']=='indexed-unique-v1' and e['baseline_revision']=='linear-unique-v1' and e['workload_id']=='generated-6000-ids-mod-4001-v1','Engine workload mismatch')
 require(isinstance(e['environment_id'],str) and e['environment_id'].endswith('runner:'+runner_sha),'Engine source mismatch')
 require(type(e['stress_cases']) is int and e['stress_cases']==10000 and type(e['stress_failures']) is int and e['stress_failures']==0,'Stress evidence incomplete')
 failures=e.get('correctness_failures',0)
 require(type(failures) is int and failures==0,'Correctness failure or invalid count')
 require(isinstance(e['trials'],list) and len(e['trials'])==15 and isinstance(v['warmup_trials'],list) and len(v['warmup_trials'])==2,'Timing coverage incomplete')
 for t in e['trials']+v['warmup_trials']:
  require(isinstance(t,dict) and set(t)==TRIAL,'Unexpected trial fields')
  require(all(type(t[k]) is int and t[k]>0 for k in ['baseline_ns','candidate_ns']) and t['equal_complete_output'] is True,'Trial timing or parity failed')
  require(type(t['peak_bytes']) is int and t['peak_bytes']==0 and t['cancelled_cleanly'] is None,'Shared-runner evidence scope changed')
 require(type(v['elapsed_ms']) is int and v['elapsed_ms']>=0 and isinstance(v['limitations'],list) and all(isinstance(x,str) for x in v['limitations']),'Invalid engine metadata')
 require(isinstance(v['decision'],dict) and set(v['decision'])=={'Incomplete'} and isinstance(v['decision']['Incomplete'],str) and v['decision']['Incomplete'],'Shared runner unexpectedly promoted evidence')
 return v
