"""Fail-closed acceptance for Atlas's fixed upstream-parser measurement protocol.

This validates measurement structure and caller-supplied input identity, not whether
an executable is trustworthy or whether its reported measurements are truthful.
"""
import re


def require(condition, message):
    if not condition:
        raise ValueError(message)


def uint(value, name, positive=False):
    require(type(value) is int and value >= (1 if positive else 0),
            f'{name} must be a {"positive" if positive else "nonnegative"} integer')


def validate_receipt(data, kind, source, input_bytes):
    require(kind in ('timing', 'allocation'), 'Unknown receipt kind')
    require(isinstance(data, dict), 'Receipt must be an object')
    require(data.get('source') == source, 'Source identity mismatch')
    require(data.get('input_sha256') == input_bytes['sha256'], 'Input digest mismatch')
    require(type(data.get('input_bytes')) is int and
            data['input_bytes'] == input_bytes['length'], 'Input byte length mismatch')
    require(data.get('default_parser_changed') is False, 'Experiment changed parser default')
    samples = data.get('samples')
    count = 24 if kind == 'timing' else 6
    require(isinstance(samples, list) and len(samples) == count, 'Incomplete sample count')
    for index, sample in enumerate(samples):
        require(isinstance(sample, dict), 'Sample must be an object')
        require(type(sample.get('round')) is int and sample['round'] == index,
                'Missing, reordered or duplicate round')
        require(sample.get('complete_record_equal') is True, 'Full record parity not established')
        if kind == 'timing':
            require(sample.get('warmup') is (index < 4), 'Incorrect warmup classification')
            require(type(sample.get('iterations')) is int and sample['iterations'] == 100,
                    'Iteration budget mismatch')
            uint(sample.get('baseline_ns'), 'baseline_ns', positive=True)
            uint(sample.get('candidate_ns'), 'candidate_ns', positive=True)
        else:
            require(type(sample.get('post_drop_live_requested_delta')) is int and
                    sample['post_drop_live_requested_delta'] == 0, 'Allocation live-byte drift')
            for variant in ('baseline', 'candidate'):
                counters = sample.get(variant)
                require(isinstance(counters, dict), 'Allocation counters missing')
                for key in ('allocation_calls', 'reallocation_calls',
                            'held_requested_rust_bytes_above_start',
                            'peak_requested_rust_bytes_above_start',
                            'total_successfully_requested_bytes'):
                    uint(counters.get(key), key)
                require(counters['held_requested_rust_bytes_above_start'] <=
                        counters['peak_requested_rust_bytes_above_start'] <=
                        counters['total_successfully_requested_bytes'],
                        'Inconsistent allocation byte counters')
    if kind == 'timing':
        require(data.get('complete') is True, 'Timing protocol incomplete')
        for key in ('harness_sha256', 'baseline_source_sha256', 'candidate_sha256',
                    'validator_sha256', 'flags_sha256', 'lock_sha256'):
            require(isinstance(data.get(key), str) and
                    re.fullmatch('[0-9a-f]{64}', data[key]) is not None,
                    f'Missing or invalid {key}')
        for key in ('compiler', 'profile', 'target'):
            require(isinstance(data.get(key), str) and bool(data[key].strip()),
                    f'Missing {key}')
    else:
        require(data.get('accounting_error') is False, 'Allocation accounting error')
