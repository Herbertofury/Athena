"""Synthetic protocol mutations, not performance measurements."""
import argparse,copy,importlib.util,json,pathlib,subprocess,sys,unittest
from unittest.mock import patch
ROOT=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('dedup_process_gate_test',ROOT/'experiments/dedup-process-lab/receipt_gate.py');gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
IDS={name:'a'*64 for name in ['source_sha256','runner_sha256','strategies_sha256','observer_sha256','lock_sha256']}
def worker():
 m={key:1024 for key in gate.memory.FIELDS}
 return dict(schema_version=1,lane='baseline',input_count=6000,input_sha256='1'*64,output=['A','é'],elapsed_ns=10,before_input=m.copy(),after_input=m.copy(),retained_output=m.copy(),compiler='rustc 1.99.1 (synthetic)',profile='release',opt_level='3',flags_sha256='0'*64,target='x86_64-unknown-linux-gnu',scope=gate.SCOPE,**IDS)
def engine():
 t=dict(baseline_ns=10,candidate_ns=5,equal_complete_output=True,peak_bytes=0,cancelled_cleanly=None)
 return dict(completed=True,reason='Completed',first_failure=None,elapsed_ms=10,limitations=['Synthetic fixture'],decision={'Incomplete':'memory and cancellation absent'},warmup_trials=[t.copy() for _ in range(2)],evidence=dict(candidate_revision='indexed-unique-v1',baseline_revision='linear-unique-v1',workload_id='generated-6000-ids-mod-4001-v1',environment_id='synthetic; runner:'+'a'*64,trials=[t.copy() for _ in range(15)],stress_cases=10000,stress_failures=0))
class DedupProcessGateTests(unittest.TestCase):
 def test_controller_import_does_not_start_work(self):
  spec=importlib.util.spec_from_file_location('dedup_controller_import_test',ROOT/'experiments/dedup-process-lab/run.py');module=importlib.util.module_from_spec(spec)
  with patch.object(argparse.ArgumentParser,'parse_args',side_effect=AssertionError('Unexpected CLI parse')),patch.object(subprocess,'Popen',side_effect=AssertionError('Unexpected child')):spec.loader.exec_module(module)
  self.assertTrue(callable(module.main))
 def test_controller_refuses_arbitrary_executable_override(self):
  result=subprocess.run([sys.executable,str(ROOT/'experiments/dedup-process-lab/run.py'),'--output','new-fixture-output','--binary','unknown-program'],capture_output=True,timeout=5)
  self.assertEqual(result.returncode,2);self.assertIn(b'unrecognized arguments: --binary',result.stderr)
 def validate(self,value):return gate.validate_worker(json.dumps(value).encode(),'baseline','1'*64,['A','é'],IDS)
 def test_missing_expected_context_and_oversize_rejected(self):
  v=worker()
  for key in IDS:del v[key]
  with self.assertRaises(ValueError):gate.validate_worker(json.dumps(v).encode(),'baseline','1'*64,['A','é'],{})
  with self.assertRaises(ValueError):gate.validate_worker(b'x'*(1024*1024+1),'baseline','1'*64,['A','é'],IDS)
  with self.assertRaises(ValueError):gate.validate_engine(json.dumps(engine()).encode(),'')
 def test_complete_worker(self):self.assertEqual(self.validate(worker()),worker())
 def test_worker_identity_parity_scope_and_memory_mutations(self):
  for key,value in [('schema_version',True),('lane','indexed'),('input_count',True),('input_sha256','2'*64),('output',['A','é']),('output',['A']),('elapsed_ns',True),('elapsed_ns',0),('scope','universal winner'),('flags_sha256','z'*64),('profile','debug'),('source_sha256','b'*64),('extra',1)]:
   v=worker();v[key]=value
   with self.subTest(key=key),self.assertRaises(ValueError):self.validate(v)
  for value in [False,-1,129*1024*1024]:
   v=worker();v['retained_output']['status_high_water_rss_bytes']=value
   with self.assertRaises(ValueError):self.validate(v)
 def test_engine_omitted_zero_is_the_only_optional_count(self):
  v=engine();self.assertEqual(gate.validate_engine(json.dumps(v).encode(),'a'*64),v)
  v['evidence']['correctness_failures']=0;self.assertEqual(gate.validate_engine(json.dumps(v).encode(),'a'*64),v)
  for key in ['stress_cases','stress_failures','trials']:
   bad=engine();del bad['evidence'][key]
   with self.assertRaises(ValueError):gate.validate_engine(json.dumps(bad).encode(),'a'*64)
 def test_engine_malformed_counts_and_unearned_claims_rejected(self):
  for value in [False,None,0.0,1]:
   v=engine();v['evidence']['correctness_failures']=value
   with self.assertRaises(ValueError):gate.validate_engine(json.dumps(v).encode(),'a'*64)
  for field,value in [('stress_failures',False),('stress_cases','10000'),('extra',1)]:
   v=engine();v['evidence'][field]=value
   with self.assertRaises(ValueError):gate.validate_engine(json.dumps(v).encode(),'a'*64)
  for field,value in [('peak_bytes',1024),('cancelled_cleanly',True),('equal_complete_output',1)]:
   v=engine();v['evidence']['trials'][0][field]=value
   with self.assertRaises(ValueError):gate.validate_engine(json.dumps(v).encode(),'a'*64)
  v=engine();v['decision']={'EligibleForReview':{'median_speedup':2}}
  with self.assertRaises(ValueError):gate.validate_engine(json.dumps(v).encode(),'a'*64)
 def test_duplicate_and_nonfinite_wire_values_rejected(self):
  raw=json.dumps(worker())
  for bad in [raw.replace('"schema_version": 1','"schema_version": 1, "schema_version": 1'),raw.replace('"elapsed_ns": 10','"elapsed_ns": NaN')]:
   with self.assertRaises(ValueError):gate.validate_worker(bad.encode(),'baseline','1'*64,['A','é'],IDS)
if __name__=='__main__':unittest.main()
