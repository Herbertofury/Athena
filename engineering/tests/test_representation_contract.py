import importlib.util
from pathlib import Path
import unittest
p=Path(__file__).resolve().parents[1]/'experiments/representation-contract-lab/threshold_probe.py'
spec=importlib.util.spec_from_file_location('threshold_probe',p);probe=importlib.util.module_from_spec(spec);spec.loader.exec_module(probe)
class RepresentationContractTests(unittest.TestCase):
    def test_threshold_boundary_and_zero_threshold_control(self):
        rows=probe.run_cases()['cases']
        self.assertEqual([r['numerically_equal'] for r in rows],[False,False,False,True,True])
    def test_negative_threshold_is_not_silently_accepted(self):
        with self.assertRaises(ValueError):probe.threshold_roundtrip('1','2','-0.1')
