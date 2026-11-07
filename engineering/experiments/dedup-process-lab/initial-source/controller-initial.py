"""Bounded fixed-binary process study. No arbitrary commands or promotion."""
import argparse,hashlib,importlib.util,json,pathlib,resource,subprocess,sys,time
ROOT=pathlib.Path(__file__).resolve().parents[2]
def module(name,path):
 spec=importlib.util.spec_from_file_location(name,path);value=importlib.util.module_from_spec(spec);spec.loader.exec_module(value);return value
wire=module('dedup_wire',ROOT/'experiments/upstream-validation-lab/receipt_gate.py')
memory=module('dedup_memory',ROOT/'experiments/process-memory-lab/snapshot_gate.py')
def require(value,message):
 if not value:raise ValueError(message)
def digest(path):
 with path.open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()
def limits():
 resource.setrlimit(resource.RLIMIT_CPU,(4,4));resource.setrlimit(resource.RLIMIT_AS,(128*1024*1024,128*1024*1024));resource.setrlimit(resource.RLIMIT_FSIZE,(1024*1024,1024*1024))
p=argparse.ArgumentParser();p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args();require(sys.platform=='linux','Linux-only process memory study')
binary=ROOT/'apps/atlas-lab/target/release/examples/dedup_process_probe';require(binary.is_file() and not binary.is_symlink(),'Build the fixed probe first');a.output.mkdir(parents=True,exist_ok=False)
expected_input=[f'provider:item-{(i*37)%4001:05d}' for i in range(6000)];expected_output=list(dict.fromkeys(expected_input));input_sha=hashlib.sha256(json.dumps(expected_input,separators=(',',':')).encode()).hexdigest()
identities={'source_sha256':digest(ROOT/'apps/atlas-lab/examples/dedup_process_probe.rs'),'runner_sha256':digest(ROOT/'apps/atlas-lab/src/experiment_runner.rs'),'strategies_sha256':digest(ROOT/'apps/atlas-lab/src/collection.rs'),'observer_sha256':digest(ROOT/'experiments/process-memory-lab/linux_memory.rs'),'lock_sha256':digest(ROOT/'apps/atlas-lab/Cargo.lock')}
fields={'schema_version','lane','input_count','input_sha256','output','elapsed_ns','before_input','after_input','retained_output','compiler','profile','opt_level','flags_sha256','target','scope',*identities}
receipt={'schema_version':1,'complete':False,'binary_sha256':digest(binary),'sources':identities,'samples':[],'review_status':'Incomplete: cancellation and target-app memory acceptance remain unestablished','working_runner_memory_integrated':False,'promoted':False,'scope':'Generated current built-in workload in fresh fixed child processes; full outputs compared independently; OS memory before evidence serialization, not application/browser peak'};deadline=time.monotonic()+120

def child(mode,stem):
 require(time.monotonic()<deadline,'Overall process-study budget');require(digest(binary)==receipt['binary_sha256'],'Probe changed during run')
 with (a.output/(stem+'.stdout')).open('xb') as out,(a.output/(stem+'.stderr')).open('xb') as err:
  result=subprocess.run([str(binary),mode],stdout=out,stderr=err,timeout=min(10,deadline-time.monotonic()),preexec_fn=limits)
 require(result.returncode==0,'Probe failed; raw output retained')
 raw=(a.output/(stem+'.stdout')).read_bytes();require(len(raw)<=1024*1024,'Receipt size budget')
 require(sum(p.stat().st_size for p in a.output.iterdir() if p.is_file())<=16*1024*1024,'Retained evidence budget')
 return wire.decode_receipt(raw),hashlib.sha256(raw).hexdigest()
try:
 for pair in range(15):
  for lane in (['baseline','indexed'] if pair%2==0 else ['indexed','baseline']):
   value,raw_sha=child(lane,f'{pair:02d}-{lane}')
   require(isinstance(value,dict) and set(value)==fields,'Unexpected worker fields')
   require(type(value['schema_version']) is int and value['schema_version']==1 and value['lane']==lane,'Worker identity mismatch')
   require(type(value['input_count']) is int and value['input_count']==6000 and value['input_sha256']==input_sha,'Input identity mismatch')
   require(value['output']==expected_output,'Complete ordered output differs')
   require(type(value['elapsed_ns']) is int and 0<value['elapsed_ns']<=10_000_000_000,'Invalid timing')
   require(all(value[k]==v for k,v in identities.items()),'Source identity mismatch')
   require(value['profile']=='release' and value['opt_level']=='3' and isinstance(value['flags_sha256'],str) and len(value['flags_sha256'])==64 and value['compiler'].startswith('rustc 1.99.1 ') and value['target']=='x86_64-unknown-linux-gnu','Build identity mismatch')
   for phase in ['before_input','after_input','retained_output']:memory.validate_snapshot(value[phase])
   sample={k:v for k,v in value.items() if k!='output'};sample.update(pair=pair,full_output_equal=True,output_count=len(value['output']),output_sha256=hashlib.sha256(json.dumps(value['output'],separators=(',',':')).encode()).hexdigest(),raw_sha256=raw_sha)
   receipt['samples'].append(sample)
 engine,raw_sha=child('engine','actual-engine')
 require(engine['completed'] is True and engine['reason']=='Completed' and engine['first_failure'] is None,'Actual engine did not complete')
 evidence=engine['evidence'];require(len(evidence['trials'])==15 and evidence['stress_cases']==10000 and evidence['stress_failures']==0 and evidence['correctness_failures']==0,'Actual engine coverage incomplete')
 require(evidence['environment_id'].endswith('runner:'+identities['runner_sha256']),'Engine source identity mismatch')
 require('Incomplete' in engine['decision'],'Shared runner unexpectedly promoted evidence')
 receipt['actual_engine']={'raw_sha256':raw_sha,'stress_cases':10000,'stress_failures':0,'decision':engine['decision']}
 receipt['complete']=len(receipt['samples'])==30
except Exception as error:
 receipt['failure']={'type':type(error).__name__,'message':str(error)};raise
finally:
 (a.output/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'complete':receipt['complete'],'fresh_process_samples':len(receipt['samples']),'review_status':receipt['review_status']}))
