import hashlib,importlib.util,pathlib,tempfile,unittest
root=pathlib.Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('addressed_io',root/'experiments/content-addressed-snapshot-lab/runner_io.py');io=importlib.util.module_from_spec(spec);spec.loader.exec_module(io)
class RunnerIOTests(unittest.TestCase):
 def test_stream_hash_is_complete_and_budgeted(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=pathlib.Path(tmp)/'data';data=bytes(range(256))*1000;p.write_bytes(data)
   self.assertEqual(io.digest(p,len(data)),hashlib.sha256(data).hexdigest())
   with self.assertRaises(ValueError):io.digest(p,len(data)-1)
   for budget in [-1,True,float("inf"),65*1024*1024]:
    with self.assertRaises(ValueError):io.digest(p,budget)
 def test_arbitrary_executable_is_rejected(self):
  with tempfile.TemporaryDirectory() as tmp:
   p=pathlib.Path(tmp)/'probe';p.write_text('not an authorized executable')
   with self.assertRaises(ValueError):io.fixed_binary(p)
if __name__=='__main__':unittest.main()
