import importlib.util,json,pathlib,unittest
root=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('recovery_gate_test',root/'experiments/content-addressed-snapshot-lab/recovery_gate.py');gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(gate)
class RecoveryGateTests(unittest.TestCase):
 def sample(self):return dict(schema_version=1,lane='baseline',committed_generations=4,complete_payload_history_equal=True,attempt_atomicity=True,integrity_ok=True,sqlite='3.54.1',scope='Process kill recovery only; not physical power-loss durability')
 def test_complete_receipt(self):
  v=self.sample();self.assertEqual(gate.validate(json.dumps(v).encode(),'baseline'),v)
 def test_explicit_compact_identity_and_unknown_lane_rejected(self):
  v=self.sample();v['lane']='compact';self.assertEqual(gate.validate(json.dumps(v).encode(),'compact'),v)
  with self.assertRaises(ValueError):gate.validate(json.dumps(v).encode(),'addressed')
  v['lane']='external'
  with self.assertRaises(ValueError):gate.validate(json.dumps(v).encode(),'external')
 def test_bad_fields_and_identity(self):
  for key,value in [('schema_version',True),('lane','addressed'),('committed_generations',True),('committed_generations',0),('committed_generations',1002),('committed_generations',4.0),('complete_payload_history_equal',1),('attempt_atomicity',False),('integrity_ok',False),('sqlite',None),('scope','power loss proven'),('extra',1)]:
   v=self.sample();v[key]=value
   with self.subTest(key=key,value=value),self.assertRaises(ValueError):gate.validate(json.dumps(v).encode(),'baseline')
  for key in gate.FIELDS:
   v=self.sample();del v[key]
   with self.subTest(missing=key),self.assertRaises(ValueError):gate.validate(json.dumps(v).encode(),'baseline')
 def test_duplicate_and_nonfinite_wire_rejected(self):
  good=json.dumps(self.sample())
  for bad in [good.replace('"schema_version": 1','"schema_version": 1, "schema_version": 1'),good.replace('"committed_generations": 4','"committed_generations": NaN')]:
   with self.assertRaises(ValueError):gate.validate(bad.encode(),'baseline')
if __name__=='__main__':unittest.main()
