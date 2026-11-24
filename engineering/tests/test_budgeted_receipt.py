import copy
import importlib.util
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('budget_gate',ROOT/'experiments/budgeted-preparation-lab/receipt_gate.py')
gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
class BudgetedReceiptTests(unittest.TestCase):
 def sample(self,mode='baseline'):
  return dict(schema_version=1,mode=mode,count=200,metadata_bytes=8192,serialized_bytes=1640000,sha256='a'*64,complete_output_equal=True,prepare_ms=10,prepare_and_verify_ms=20,peak_rss_kib=50000,encoding_buffer_bytes=1640000 if mode=='baseline' else 200*8192+200*1024+2)
 def test_valid_lanes_preserve_exact_receipt(self):
  for mode in ['baseline','budgeted']:
   v=self.sample(mode);self.assertIs(gate.validate(v,mode,200,8192),v)
 def test_missing_extra_and_wrong_identity(self):
  cases=[]
  for field in gate.FIELDS:
   v=self.sample();del v[field];cases.append(v)
  for key,value in [('extra',1),('schema_version',True),('mode','budgeted'),('count',True),('metadata_bytes',False),('complete_output_equal',1),('sha256','g'*64)]:
   v=self.sample();v[key]=value;cases.append(v)
  for v in cases:
   with self.subTest(value=v),self.assertRaises(ValueError):gate.validate(v,'baseline',200,8192)
 def test_invalid_metrics_and_allocation(self):
  for field in ['serialized_bytes','peak_rss_kib','encoding_buffer_bytes','prepare_ms','prepare_and_verify_ms']:
   for value in [True,False,0,-1,None,'1',float('nan'),float('inf')]:
    v=self.sample();v[field]=value
    with self.subTest(field=field,value=value),self.assertRaises(ValueError):gate.validate(v,'baseline',200,8192)
  for field,value in [('prepare_ms',21),('serialized_bytes',1),('encoding_buffer_bytes',200*8192+200*1024+3),('encoding_buffer_bytes',1640001)]:
   v=self.sample();v[field]=value
   with self.subTest(field=field,value=value),self.assertRaises(ValueError):gate.validate(v,'baseline',200,8192)
if __name__=='__main__':unittest.main()
