"""Local measured microbenchmarks on generated inputs, not application acceptance."""
import datetime
import argparse, gc, hashlib, importlib.metadata, json, math, platform, random, statistics, time
from pathlib import Path
import orjson, ujson

LIBRARIES = {'stdlib': json, 'orjson': orjson, 'ujson': ujson}

def encode(name, value):
    if name == 'orjson': return orjson.dumps(value)
    if name == 'stdlib': return json.dumps(value, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode('utf-8')
    return ujson.dumps(value, ensure_ascii=False, escape_forward_slashes=False).encode('utf-8')

def canonical(value):
    return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()

def corpus():
    return {
        'small_manifest': {'id': 'sample-addon', 'version': '1.2.3', 'enabled': True, 'tags': ['配置', 'café', '🧪'], 'dependencies': [{'id': 'core', 'min': 12}], 'note': 'quote " slash / newline\n'},
        'catalog_2000': [{'id': i, 'name': f'Entry {i} café 🧪', 'active': i % 3 == 0, 'tags': ['mod', f'group-{i % 19}'], 'weight': (i % 97) / 8, 'nested': {'owner': f'author-{i % 37}', 'missing': None}} for i in range(2000)],
        'numeric_10000': [i / 8 for i in range(10000)],
    }

def semantic_cases():
    inputs = {
        'valid_unicode': b'{"x":"caf\xc3\xa9"}',
        'invalid_utf8': b'{"x":"\xff"}',
        'nonfinite_nan': b'{"x":NaN}',
        'nonfinite_infinity': b'{"x":Infinity}',
        'lone_surrogate': b'"\\ud800"',
        'duplicate_keys': b'{"x":1,"x":2}',
        'integer_above_u64': b'18446744073709551617',
        'integer_53_plus_1': b'9007199254740993',
        'trailing_comma': b'{"x":1,}',
        'leading_zero': b'01',
        'trailing_document': b'{}{}',
        'unescaped_control': b'"a\x01b"',
    }
    output = {}
    for label, raw in inputs.items():
        output[label] = {}
        for name, lib in LIBRARIES.items():
            try:
                value = lib.loads(raw)
                output[label][name] = {'accepted': True, 'python_type': type(value).__name__, 'value_repr': ascii(value)}
            except (ValueError, UnicodeError, OverflowError) as exc:
                output[label][name] = {'accepted': False, 'error_type': type(exc).__name__}
    return output

def run(rounds=15, iterations=30):
    if rounds < 5 or iterations < 1: raise ValueError('at least five rounds and one iteration required')
    rng = random.Random(20261026)
    report = {'schema': 1, 'evidence': 'measured_local_generated_workload', 'date': datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
              'harness_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
              'environment': {'python': platform.python_version(), 'system': platform.system(), 'machine': platform.machine(), 'kernel': platform.release(), 'versions': {'orjson': importlib.metadata.version('orjson'), 'ujson': importlib.metadata.version('ujson')}},
              'protocol': {'rounds': rounds, 'iterations_per_sample': iterations, 'order_seed': 20261026, 'gc_enabled': gc.isenabled(), 'timing': 'perf_counter_ns; warmed in-process; randomized library order each round', 'memory_measured': False, 'cold_start_measured': False, 'hardware_isolation_guaranteed': False},
              'semantic_cases': semantic_cases(), 'workloads': {}}
    for label, value in corpus().items():
        raw = encode('stdlib', value)
        digest = hashlib.sha256(canonical(value)).hexdigest()
        for name, lib in LIBRARIES.items():
            if canonical(lib.loads(raw)) != canonical(value): raise AssertionError(f'{name}: decoded value mismatch')
            if canonical(json.loads(encode(name, value))) != canonical(value): raise AssertionError(f'{name}: encoded value mismatch')
        results = {}
        for operation in ('decode', 'encode_utf8', 'decode_encode_utf8'):
            samples = {name: [] for name in LIBRARIES}; orders = []
            for round_id in range(rounds):
                names = list(LIBRARIES); rng.shuffle(names); orders.append(names[:])
                for name in names:
                    lib = LIBRARIES[name]
                    if operation == 'decode': fn = lambda: lib.loads(raw)
                    elif operation == 'encode_utf8': fn = lambda: encode(name, value)
                    else: fn = lambda: encode(name, lib.loads(raw))
                    for _ in range(3): fn()
                    start = time.perf_counter_ns()
                    for _ in range(iterations): result = fn()
                    elapsed = (time.perf_counter_ns() - start) / iterations / 1e6
                    # Verify after each sample, outside the timing region; all calls fully materialize their result.
                    actual = result if operation == 'decode' else json.loads(result)
                    if hashlib.sha256(canonical(actual)).hexdigest() != digest: raise AssertionError('sample result mismatch')
                    samples[name].append(elapsed)
            results[operation] = {'units': 'milliseconds per operation', 'round_orders': orders,
                'libraries': {name: {'samples_ms': values, 'median_ms': statistics.median(values), 'sample_min_ms': min(values), 'sample_max_ms': max(values)} for name, values in samples.items()}}
        report['workloads'][label] = {'input_bytes': len(raw), 'input_sha256': hashlib.sha256(raw).hexdigest(), 'semantic_sha256': digest, 'operations': results}
    report['qualification'] = 'These are real local timings on three generated inputs, not vendor benchmark reproductions, production workload results, memory/security certification, or a universal ranking.'
    return report

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--rounds', type=int, default=15)
    parser.add_argument('--iterations', type=int, default=30)
    args = parser.parse_args()
    report = run(args.rounds, args.iterations)
    args.output.write_text(json.dumps(report, indent=2, allow_nan=False) + '\n')
    for label, workload in report['workloads'].items():
        for operation, result in workload['operations'].items():
            print(label, operation, {name: round(v['median_ms'], 4) for name, v in result['libraries'].items()}, flush=True)
