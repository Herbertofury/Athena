import sys, random, unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'examples'))
from spatial_grid import Circle, brute_force, indexed

class GridTests(unittest.TestCase):
    def test_generated_equivalence(self):
        rng=random.Random(20261026)
        for trial in range(100):
            circles=[Circle(i,rng.randint(-30,30),rng.randint(-30,30),rng.randint(0,6)) for i in range(40)]
            with self.subTest(trial=trial): self.assertEqual(brute_force(circles),indexed(circles,cell_size=rng.randint(1,8))[0])
    def test_tangent_negative_boundary_and_zero_radius(self):
        c=[Circle(5,-4,0,2),Circle(2,0,0,2),Circle(9,0,0,0),Circle(11,0,0,0)]
        self.assertEqual(brute_force(c),indexed(c)[0]);self.assertIn((2,5),indexed(c)[0]);self.assertIn((9,11),indexed(c)[0])
    def test_input_order_independence(self):
        c=[Circle(i,i,0,2) for i in range(15)]
        self.assertEqual(indexed(c)[0],indexed(reversed(c))[0])
    def test_huge_circle_falls_back_without_loss(self):
        c=[Circle(1,0,0,1000000),Circle(2,5,5,1)]
        result,info=indexed(c);self.assertTrue(info['fallback']);self.assertEqual(result,brute_force(c))
    def test_float_domain_rejected(self):
        with self.assertRaises(ValueError): indexed([Circle(1,0.0,0,1)])
    def test_empty(self):self.assertEqual(indexed([])[0],[])
    def test_bad_ids_and_numbers(self):
        for c in [[Circle(1,0,0,1),Circle(1,1,1,1)],[Circle(True,0,0,1)],[Circle(1,float('nan'),0,1)],[Circle(1,0,0,-1)],[Circle(1,0,0,1e10)]]:
            with self.assertRaises(ValueError):indexed(c)
    def test_bad_configuration(self):
        for n in [0,-1,True,float('inf')]:
            with self.assertRaises(ValueError):indexed([],n)
        with self.assertRaises(ValueError):indexed([],max_cells_per_circle=True)
