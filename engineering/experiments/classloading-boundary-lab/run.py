#!/usr/bin/env python3
"""Execute original Java class-loading fixtures, never a game or mod loader."""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
SCOPE = 'Measured original JVM fixtures with complete and client-absent classpaths. No Fabric, Forge, NeoForge, game process, annotation stripping, or target-project acceptance.'
LIMIT = 1048576
COMPILER = ['-source', '21', '-target', '21', '-proc:none', '-g:none', '-encoding', 'UTF-8']
OPERATIONS = {'discover', 'initialize', 'methods', 'invoke:value', 'invoke:ping', 'invoke:literal', 'invoke:boxed', 'invoke:run:false', 'invoke:run:true', 'clear_failure_then_initialize', 'fresh_loader_then_initialize'}
EVENTS = {'ClientApi', 'SafeCommon', 'BodyReference', 'DescriptorReference', 'StaticReference', 'Exploding', 'Constants'}
IDENTITY_FIELDS = ['id', 'scenario', 'profile', 'operation', 'class_name', 'loader_generation']
RESULT_FIELDS = ['success', 'result', 'exception_chain', 'events']


def digest(data): return hashlib.sha256(data).hexdigest()


def same_value(a, b):
    if type(a) is not type(b): return False
    if isinstance(a, dict): return a.keys() == b.keys() and all(same_value(a[k], b[k]) for k in a)
    if isinstance(a, list): return len(a) == len(b) and all(same_value(x, y) for x, y in zip(a, b))
    return a == b


def read_bytes(path, limit=LIMIT):
    with Path(path).open('rb') as stream: data = stream.read(limit + 1)
    if len(data) > limit: raise ValueError('Byte budget exceeded')
    return data


def parse_json(text):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result: raise ValueError('Duplicate JSON key')
            result[key] = value
        return result
    def constant(value): raise ValueError('Non-finite JSON')
    return json.loads(text, object_pairs_hook=pairs, parse_constant=constant)


def read_json(path): return parse_json(read_bytes(path).decode('utf-8'))


def safe_text(value, limit=256):
    return isinstance(value, str) and 0 < len(value) <= limit and all(32 <= ord(c) != 127 for c in value)


def validate_result(row):
    if not isinstance(row, dict) or set(row) != set(RESULT_FIELDS): raise ValueError('Invalid result fields')
    if type(row['success']) is not bool: raise ValueError('Boolean outcome required')
    errors, events = row['exception_chain'], row['events']
    if not isinstance(errors, list) or len(errors) > 16 or any(not isinstance(x, str) or not re.fullmatch(r'java\.[A-Za-z0-9_.]+', x) for x in errors): raise ValueError('Invalid exception chain')
    if not isinstance(events, list) or len(events) > 16 or any(not isinstance(x, str) or x not in EVENTS for x in events): raise ValueError('Invalid initialization events')
    if row['success']:
        if errors or not safe_text(row['result'], 256): raise ValueError('Impossible successful outcome')
    elif not errors or row['result'] is not None: raise ValueError('Impossible failed outcome')


def validate_cases(doc):
    if not isinstance(doc, dict) or set(doc) != {'schema_version', 'kind', 'scope', 'sources', 'profiles', 'cases'}: raise ValueError('Unexpected case document')
    if type(doc['schema_version']) is not int or doc['schema_version'] != 1 or doc['kind'] != 'original_synthetic_jvm_fixtures': raise ValueError('Invalid synthetic schema')
    if doc['scope'] != 'OpenJDK class loading, reflection and initialization, not a mod-loader or native-game test.': raise ValueError('Invalid fixture scope')
    sources = doc['sources']
    if not isinstance(sources, list) or len(sources) != 9 or any(not isinstance(x, str) for x in sources) or len(set(sources)) != 9 or sources != sorted(sources): raise ValueError('Nine sorted unique sources required')
    if any(not isinstance(x, str) or not re.fullmatch(r'fixtures/(lab|client)/[A-Za-z]+\.java', x) for x in sources): raise ValueError('Unsafe source path')
    expected_profiles = {'complete': [x[9:-5] + '.class' for x in sources], 'without_client': [x[9:-5] + '.class' for x in sources if x.startswith('fixtures/lab/')]}
    if not same_value(doc['profiles'], expected_profiles) or len(expected_profiles['without_client']) != 8: raise ValueError('Invalid profile membership')
    rows = doc['cases']; seen = set(); groups = []; numbers = {}; previous = None
    if not isinstance(rows, list) or not 1 <= len(rows) <= 64: raise ValueError('Invalid observation count')
    for row in rows:
        if not isinstance(row, dict) or set(row) != set(IDENTITY_FIELDS) | {'expected'}: raise ValueError('Unexpected case fields')
        group = row['scenario']
        if not isinstance(group, str) or not re.fullmatch('[a-z_]{1,64}', group): raise ValueError('Invalid scenario')
        if group != previous:
            if group in groups: raise ValueError('Scenario must be contiguous')
            groups.append(group); previous = group
        numbers[group] = numbers.get(group, 0) + 1
        if row['id'] != f'{group}:{numbers[group]}' or row['id'] in seen: raise ValueError('Invalid case identity/order')
        seen.add(row['id'])
        if not isinstance(row['profile'], str) or row['profile'] not in expected_profiles or not isinstance(row['operation'], str) or row['operation'] not in OPERATIONS: raise ValueError('Invalid profile/operation')
        if type(row['loader_generation']) is not int or row['loader_generation'] not in {1, 2}: raise ValueError('Invalid loader generation')
        if not isinstance(row['class_name'], str) or row['class_name'].replace('.', '/') + '.class' not in expected_profiles['complete']: raise ValueError('Unknown fixture class')
        validate_result(row['expected'])
    return rows


def input_identity():
    doc = read_json(ROOT / 'cases.json'); cases = validate_cases(doc)
    reference = read_json(ROOT / 'runtime-reference.json')
    if not isinstance(reference, dict) or set(reference) != {'schema_version', 'jdk_source_repo', 'jdk_source_tag', 'jdk_source_commit', 'compiler_options', 'scope'}: raise ValueError('Invalid runtime reference')
    if type(reference['schema_version']) is not int or reference['schema_version'] != 1 or reference['jdk_source_repo'] != 'openjdk/jdk21u' or reference['jdk_source_tag'] != 'jdk-21.0.13+9' or reference['jdk_source_commit'] != 'ba94eace682733f66e623c089bcafcf4a1b8e39c' or reference['compiler_options'] != COMPILER: raise ValueError('Unexpected runtime reference')
    if reference['scope'] != 'Source revision reference, not an assertion that the local Debian runtime was built reproducibly from these sources. No external runtime is downloaded.': raise ValueError('Unexpected runtime reference scope')
    identities = {}
    for name in ['run.py', 'ClassloadingProbe.java', 'cases.json', 'runtime-reference.json'] + doc['sources']:
        path = (ROOT / name).resolve()
        if not path.is_relative_to(ROOT.resolve()): raise ValueError('Input escapes lab')
        identities[name] = digest(read_bytes(path, 16384 if name.startswith('fixtures/') else LIMIT))
    return doc, cases, reference, identities


def decode_output(stdout, doc, cases):
    if not isinstance(stdout, str) or len(stdout.encode()) > LIMIT: raise ValueError('Output exceeds budget')
    lines = stdout.splitlines()
    if len(lines) != len(cases) + 1: raise ValueError('Missing or extra driver rows')
    header = parse_json(lines[0])
    if not isinstance(header, dict) or set(header) != {'kind', 'java_version', 'java_runtime_version', 'java_vendor', 'compiler', 'inventory', 'profiles'} or header['kind'] != 'compiled': raise ValueError('Invalid compiler header')
    if not all(safe_text(header[k]) for k in ['java_version', 'java_runtime_version', 'java_vendor', 'compiler']) or not re.fullmatch(r'21(?:\.[0-9]+)*(?:[-+][A-Za-z0-9_.+-]+)?', header['java_version']): raise ValueError('JDK 21 runtime required for this control')
    if not same_value(header['profiles'], doc['profiles']): raise ValueError('Classpath profile inventory mismatch')
    inventory = header['inventory']
    if not isinstance(inventory, list) or [r.get('path') for r in inventory if isinstance(r, dict)] != doc['profiles']['complete']: raise ValueError('Invalid compiled class list')
    for row in inventory:
        if set(row) != {'path', 'bytes', 'class_major', 'sha256'} or type(row['bytes']) is not int or not 1 <= row['bytes'] <= 16384 or type(row['class_major']) is not int or row['class_major'] != 65 or not isinstance(row['sha256'], str) or not re.fullmatch('[0-9a-f]{64}', row['sha256']): raise ValueError('Invalid compiled artifact identity')
    observations = []
    for line, case in zip(lines[1:], cases):
        raw = parse_json(line)
        if not isinstance(raw, dict) or set(raw) != {'kind'} | set(IDENTITY_FIELDS) | set(RESULT_FIELDS) or raw['kind'] != 'observation': raise ValueError('Invalid observation fields')
        if not same_value({k: raw[k] for k in IDENTITY_FIELDS}, {k: case[k] for k in IDENTITY_FIELDS}): raise ValueError('Observation identity/order mismatch')
        actual = {k: raw[k] for k in RESULT_FIELDS}; validate_result(actual)
        observations.append({**{k: raw[k] for k in IDENTITY_FIELDS}, 'actual': actual, 'expected': case['expected'], 'matches_expected': same_value(actual, case['expected'])})
    return header, observations


def derive(stdout, doc, cases):
    header, observations = decode_output(stdout, doc, cases)
    return {'compiled': header, 'observations': observations, 'observation_count': len(observations), 'expected_failure_observations': sum(not row['expected']['success'] for row in observations), 'all_expected': all(row['matches_expected'] for row in observations)}


def validate_receipt(receipt):
    fields = {'schema_version', 'scope', 'recorded_at_utc', 'environment', 'runtime_reference', 'input_sha256', 'driver_returncode', 'driver_stdout', 'driver_stderr', 'compiled', 'observations', 'observation_count', 'expected_failure_observations', 'all_expected'}
    if not isinstance(receipt, dict) or set(receipt) != fields or type(receipt['schema_version']) is not int or receipt['schema_version'] != 1: raise ValueError('Invalid receipt fields')
    doc, cases, reference, identities = input_identity()
    if receipt['scope'] != SCOPE or not same_value(receipt['input_sha256'], identities) or not same_value(receipt['runtime_reference'], reference): raise ValueError('Receipt scope/identity mismatch')
    stamp = receipt['recorded_at_utc']
    if not isinstance(stamp, str) or not re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\+00:00', stamp): raise ValueError('Invalid UTC timestamp')
    dt.datetime.fromisoformat(stamp)
    env = receipt['environment']
    if not isinstance(env, dict) or set(env) != {'python', 'system', 'machine'} or not all(safe_text(v) for v in env.values()): raise ValueError('Invalid environment labels')
    if type(receipt['driver_returncode']) is not int or receipt['driver_returncode'] != 0 or receipt['driver_stderr'] != '': raise ValueError('Driver did not complete cleanly')
    derived = derive(receipt['driver_stdout'], doc, cases)
    if any(not same_value(receipt[k], value) for k, value in derived.items()): raise ValueError('Derived receipt mismatch')
    return derived


def execute():
    doc, cases, reference, identities = input_identity()
    with tempfile.TemporaryDirectory(prefix='atlas-classloading-') as tmp:
        work = Path(tmp); source_list = work / 'sources.txt'; case_list = work / 'cases.tsv'
        source_list.write_text('\n'.join(doc['sources']) + '\n')
        case_list.write_text('\n'.join('\t'.join(row[k] for k in ['id', 'scenario', 'profile', 'operation', 'class_name']) for row in cases) + '\n')
        env = {'PATH': os.environ.get('PATH', ''), 'HOME': tmp, 'LANG': 'C.UTF-8', 'TZ': 'UTC'}
        if 'JAVA_HOME' in os.environ: env['JAVA_HOME'] = os.environ['JAVA_HOME']
        process = subprocess.run(['java', str(ROOT / 'ClassloadingProbe.java'), str(ROOT), str(source_list), str(case_list), str(work / 'classes')], env=env, capture_output=True, text=True, timeout=90)
        stdout, stderr = process.stdout.replace(tmp, '<RUN>'), process.stderr.replace(tmp, '<RUN>')
        if len(stdout.encode()) > LIMIT or len(stderr.encode()) > LIMIT: raise ValueError('Driver output budget exceeded after capture')
        if process.returncode != 0 or stderr: raise ValueError(json.dumps({'stage': 'driver_failed', 'returncode': process.returncode, 'stdout': stdout, 'stderr': stderr}))
        derived = derive(stdout, doc, cases)
        receipt = {'schema_version': 1, 'scope': SCOPE, 'recorded_at_utc': dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(), 'environment': {'python': platform.python_version(), 'system': platform.system(), 'machine': platform.machine()}, 'runtime_reference': reference, 'input_sha256': identities, 'driver_returncode': process.returncode, 'driver_stdout': stdout, 'driver_stderr': stderr, **derived}
        validate_receipt(receipt)
        return receipt


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--verify-receipt', type=Path)
    args = parser.parse_args(argv)
    try:
        if args.verify_receipt:
            if args.output: raise ValueError('Cannot execute during verification')
            result = validate_receipt(read_json(args.verify_receipt))
        else:
            if not args.output: raise ValueError('New output path required')
            if args.output.exists(): raise ValueError('Output exists; preserve previous evidence')
            result = execute()
            with args.output.open('x', encoding='utf-8') as stream: json.dump(result, stream, indent=2); stream.write('\n')
        print(json.dumps({k: result[k] for k in ['observation_count', 'expected_failure_observations', 'all_expected']}))
        return 0 if result['all_expected'] else 1
    except (ValueError, OSError, KeyError, subprocess.SubprocessError) as exc:
        print(str(exc), file=sys.stderr); return 2


if __name__ == '__main__': raise SystemExit(main())
