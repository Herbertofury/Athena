"""Synthetic validation cases, never real application measurements."""
import copy
import json
import sys
import unittest
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from compare_worker_sweep import evaluate, COUNTS, METRICS


def fixture():
    baseline = json.loads((ROOT / 'tests/fixtures/synthetic-baseline.json').read_text())
    for sample in baseline['samples']:
        sample.update(dict.fromkeys(METRICS, 100))
    candidates = []
    for workers in COUNTS:
        record = copy.deepcopy(baseline)
        record['source_revision'] = 'synthetic-same-candidate'
        for sample in record['samples']:
            sample['elapsed_ms'] *= .5
        candidates.append({'workers': workers, 'benchmark': record})
    return {'schema': 1, 'baseline': baseline, 'candidates': candidates,
            'budgets': dict.fromkeys(METRICS, 120),
            'minimum_reduction_percent': 5, 'near_fastest_percent': 3}


class SweepTests(unittest.TestCase):
    def test_choose_smallest_tied_eligible_configuration(self):
        r = evaluate(fixture())
        self.assertEqual(r['suggested_workers_for_review'], 4)
        self.assertFalse(r['accepted_in_application'])
        self.assertEqual(r['kind'], 'synthetic')

    def test_absolute_memory_budget_rejects_even_fastest(self):
        s = fixture()
        s['candidates'][0]['benchmark']['samples'][0]['peak_memory_mb'] = 121
        self.assertEqual(evaluate(s)['suggested_workers_for_review'], 8)

    def test_resource_median_regression_rejected_within_budget(self):
        s = fixture()
        for c in s['candidates']:
            for sample in c['benchmark']['samples']:
                sample['ui_latency_ms'] = 101
        self.assertIsNone(evaluate(s)['suggested_workers_for_review'])

    def test_equivalence_mismatch_invalidates_sweep(self):
        s = fixture()
        s['candidates'][4]['benchmark']['samples'][0]['warnings'].append('new warning')
        with self.assertRaisesRegex(ValueError, 'output mismatch'):
            evaluate(s)

    def test_all_counts_required(self):
        s = fixture()
        s['candidates'].pop()
        with self.assertRaises(ValueError): evaluate(s)

    def test_duplicate_count_rejected(self):
        s = fixture()
        s['candidates'][4]['workers'] = 4
        with self.assertRaises(ValueError): evaluate(s)

    def test_same_candidate_revision_required(self):
        s = fixture()
        s['candidates'][4]['benchmark']['source_revision'] = 'other'
        with self.assertRaises(ValueError): evaluate(s)

    def test_missing_nonfinite_boolean_negative_metrics_rejected(self):
        for value in (None, float('nan'), float('inf'), True, -1):
            s = fixture()
            s['candidates'][0]['benchmark']['samples'][0]['peak_handles'] = value
            with self.subTest(value=value), self.assertRaises(ValueError): evaluate(s)
        s = fixture()
        del s['candidates'][0]['benchmark']['samples'][0]['cancel_latency_ms']
        with self.assertRaises(ValueError): evaluate(s)

    def test_missing_or_invalid_budgets_rejected(self):
        for value in ({}, dict.fromkeys(METRICS, 0), dict.fromkeys(METRICS, True)):
            s = fixture(); s['budgets'] = value
            with self.assertRaises(ValueError): evaluate(s)

    def test_tail_regression_rejects_candidate(self):
        s = fixture()
        s['candidates'][0]['benchmark']['samples'][0]['elapsed_ms'] = 1000000
        self.assertEqual(evaluate(s)['suggested_workers_for_review'], 8)

    def test_no_improvement_means_no_selection(self):
        s = fixture()
        for c in s['candidates']:
            for b, sample in zip(s['baseline']['samples'], c['benchmark']['samples']):
                sample['elapsed_ms'] = b['elapsed_ms']
        self.assertIsNone(evaluate(s)['suggested_workers_for_review'])

    def test_order_does_not_change_selection(self):
        s = fixture(); s['candidates'].reverse()
        self.assertEqual(evaluate(s)['suggested_workers_for_review'], 4)

    def test_near_fastest_prefers_smallest_but_not_slow_configuration(self):
        s = fixture()
        for sample in s['candidates'][0]['benchmark']['samples']:
            sample['elapsed_ms'] *= 1.02
        self.assertEqual(evaluate(s)['suggested_workers_for_review'], 4)
        for sample in s['candidates'][0]['benchmark']['samples']:
            sample['elapsed_ms'] *= 1.10
        self.assertEqual(evaluate(s)['suggested_workers_for_review'], 8)

    def test_malformed_candidates_and_boolean_schema(self):
        s = fixture(); s['candidates'][0] = None
        with self.assertRaises(ValueError): evaluate(s)
        s = fixture(); s['schema'] = True
        with self.assertRaises(ValueError): evaluate(s)
