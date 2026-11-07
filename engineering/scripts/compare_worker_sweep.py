#!/usr/bin/env python3
"""Evaluate a complete 4/8/16/32/64 sweep against explicit budgets; never certify a release."""
import argparse
import json
import math
import statistics
from pathlib import Path
from compare_benchmarks import compare, validate, decode_record

COUNTS = (4, 8, 16, 32, 64)
METRICS = ('peak_memory_mb', 'peak_handles', 'ui_latency_ms', 'cancel_latency_ms')


def positive(value, name, allow_zero=False):
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise ValueError(f'{name} must be a finite number')
    if value < 0 or (value == 0 and not allow_zero):
        raise ValueError(f'{name} is outside its permitted range')
    return value


def resources(record):
    samples = validate(record)
    result = {}
    for metric in METRICS:
        values = []
        for sample in samples.values():
            if metric not in sample:
                raise ValueError(f'missing resource observation: {metric}')
            values.append(positive(sample[metric], metric, allow_zero=True))
        result[metric] = {'max': max(values), 'median': statistics.median(values)}
    return result


def evaluate(sweep):
    if not isinstance(sweep, dict) or type(sweep.get('schema')) is not int or sweep.get('schema') != 1:
        raise ValueError('worker sweep schema must be 1')
    baseline = sweep['baseline']
    base_resources = resources(baseline)
    budgets = sweep['budgets']
    if not isinstance(budgets, dict) or set(budgets) != set(METRICS):
        raise ValueError('explicit budgets required for all four metrics')
    for key, value in budgets.items():
        positive(value, key)
    improvement = positive(sweep['minimum_reduction_percent'], 'minimum_reduction_percent')
    tolerance = positive(sweep['near_fastest_percent'], 'near_fastest_percent', allow_zero=True)
    if improvement >= 100 or tolerance > 10:
        raise ValueError('invalid improvement or near-fastest threshold')
    candidates = sweep['candidates']
    if not isinstance(candidates, list) or len(candidates) != len(COUNTS):
        raise ValueError('complete five-configuration sweep required')
    seen = set()
    revisions = set()
    reports = []
    for candidate in candidates:
        if not isinstance(candidate, dict):
            raise ValueError('candidate must be an object')
        workers = candidate.get('workers')
        if type(workers) is not int or workers not in COUNTS or workers in seen:
            raise ValueError('worker counts must be exactly 4, 8, 16, 32, 64')
        seen.add(workers)
        record = candidate['benchmark']
        result = compare(baseline, record)
        revisions.add(record['source_revision'])
        observed = resources(record)
        reasons = []
        if result['median_elapsed_reduction_percent'] < improvement:
            reasons.append('below required complete-result improvement')
        if result['candidate_sample_p95_ms'] > result['baseline_sample_p95_ms']:
            reasons.append('complete-result sample tail regressed')
        for metric in METRICS:
            if observed[metric]['max'] > budgets[metric]:
                reasons.append(f'{metric} exceeds absolute budget')
            if observed[metric]['median'] > base_resources[metric]['median']:
                reasons.append(f'{metric} median regressed')
        reports.append({'workers': workers, 'eligible': not reasons,
                        'reasons': reasons, 'timing': result, 'resources': observed})
    if len(revisions) != 1:
        raise ValueError('candidate code revisions differ; not a worker-only comparison')
    eligible = [r for r in reports if r['eligible']]
    selected = None
    if eligible:
        fastest = min(r['timing']['candidate_median_ms'] for r in eligible)
        near = [r for r in eligible if r['timing']['candidate_median_ms'] <= fastest * (1 + tolerance / 100)]
        selected = min(r['workers'] for r in near)
    return {'kind': baseline['kind'], 'suggested_workers_for_review': selected,
            'configurations': sorted(reports, key=lambda r: r['workers']),
            'accepted_in_application': False,
            'qualification': 'Synthetic demonstration only.' if baseline['kind'] == 'synthetic' else
            'Screening result only: review trial order, raw traces, correctness, security, UX and statistical uncertainty. No default is changed.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('sweep', type=Path)
    args = parser.parse_args()
    try:
        result = evaluate(decode_record(args.sweep.read_text()))
    except (ValueError, KeyError, TypeError) as exc:
        parser.exit(2, f'Invalid sweep: {exc}\n')
    print(json.dumps(result, indent=2, allow_nan=False))


if __name__ == '__main__':
    main()
