import copy
import json
from pathlib import Path
import unittest
from gate_source_route import evaluate, post_id

HERE = Path(__file__).resolve().parent


class SourceRoutingGate(unittest.TestCase):
    def setUp(self):
        self.raw = (HERE/'source-routing-fixture.json').read_bytes()
        self.receipt = json.loads((HERE/'memories-source-routing-receipt.json').read_text(encoding='utf-8'))

    def test_actual_receipt_scores_exact_abstentions_separately(self):
        score = evaluate(self.raw, self.receipt)
        self.assertTrue(score['passed'])
        self.assertEqual(score['counts'], {'exact_hit_total':2,'exact_hit_passed':2,'exact_abstention_total':2,
            'exact_abstention_passed':2,'descriptive_hit_total':1,'descriptive_hit_passed':1})

    def test_numeric_collision_and_auto_fallback_both_fail(self):
        a = post_id('https://twitter.com/a/status/2125587147482869811?t=1')
        b = post_id('https://x.com/a/status/2125587147482869812')
        self.assertEqual(float(a), float(b))
        self.assertNotEqual(a, b)
        bad = copy.deepcopy(self.receipt)
        bad['cases'][1]['rows'] = bad['cases'][0]['rows']
        result = evaluate(self.raw, bad)
        self.assertFalse(result['passed'])
        self.assertEqual(result['failed_cases'], ['exact-neighbor-absent'])
        bad = copy.deepcopy(self.receipt)
        bad['cases'][3]['mode'] = 'text'
        self.assertEqual(evaluate(self.raw, bad)['failed_cases'], ['exact-second-neighbor-absent'])

    def test_records_cannot_drop_provenance_or_invent_name(self):
        bad = copy.deepcopy(self.receipt)
        bad['cases'][-1]['rows'][0]['title'] = 'A guessed character'
        self.assertIn('descriptive-identity-safe', evaluate(self.raw, bad)['failed_cases'])
        bad = copy.deepcopy(self.receipt)
        bad['cases'][-1]['rows'][0]['source'] = None
        self.assertIn('descriptive-identity-safe', evaluate(self.raw, bad)['failed_cases'])

    def test_registered_hosts_only_and_checksum_pins(self):
        self.assertIsNone(post_id('https://x.com.other.example/a/status/2125587147482869811'))
        self.assertIsNone(post_id('https://someone@x.com/a/status/2125587147482869811'))
        bad = copy.deepcopy(self.receipt)
        bad['fixture_sha256'] = '0' * 64
        with self.assertRaises(ValueError):
            evaluate(self.raw, bad)


if __name__ == '__main__':
    unittest.main()
