import unittest
from total import total
class TotalTests(unittest.TestCase):
    def test_normal(self): self.assertEqual(total(3, 2.5), 7.5)
    def test_zero(self): self.assertEqual(total(0, 2.5), 0)
    def test_invalid(self):
        for q,p in [(-1,2),(1,-2),(True,2),(1,float('nan')),(1,float('inf')),('2',3),(1.5,3)]:
            with self.assertRaises((ValueError,TypeError)): total(q,p)
if __name__=='__main__': unittest.main()
