#!/usr/bin/env python3
"""Offline compilation and ASM inspection of original fixtures, not a Mixin runner."""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import platform
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parent
SCOPE = 'Measured ASM observations of original synthetic classes. No Mixin execution, bytecode transformation, game loading, or target-project acceptance.'
FACTS = {'name_matches', 'exact_matches', 'return_opcodes', 'throw_opcodes', 'exact_hook_calls', 'owner_omitted_hook_calls'}
SELECTOR = {'method_name': 'compute', 'method_descriptor': '(I)I', 'call_owner': 'lab/Target', 'call_name': 'hook', 'call_descriptor': '(I)I'}
COMPILER = ['-source', '21', '-target', '21', '-proc:none']
MAX_JSON = 1048576


def digest(data):
    return hashlib.sha256(data).hexdigest()


def parse_json(text):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result: raise ValueError('Duplicate JSON key')
            result[key] = value
        return result
    def constant(value): raise ValueError('Non-finite JSON')
    return json.loads(text, object_pairs_hook=pairs, parse_constant=constant)


def read_bytes(path, limit=MAX_JSON):
    with Path(path).open('rb') as stream: data = stream.read(limit + 1)
    if len(data) > limit: raise ValueError('Input exceeds byte budget')
    return data


def read_json(path):
    return parse_json(read_bytes(path).decode('utf-8'))


def integer(value, low, high):
    return type(value) is int and low <= value <= high


def text_value(value):
    return isinstance(value, str) and 0 < len(value) <= 512 and not any(ord(c) < 32 or ord(c) == 127 for c in value)


def validate_cases(doc):
    fields = {'schema_version', 'kind', 'scope', 'compiler_options', 'debug_modes', 'selector', 'fixtures'}
    if not isinstance(doc, dict) or set(doc) != fields: raise ValueError('Unexpected case fields')
    if type(doc['schema_version']) is not int or doc['schema_version'] != 1 or doc['kind'] != 'synthetic': raise ValueError('Synthetic schema 1 required')
    if doc['compiler_options'] != COMPILER or doc['debug_modes'] != ['none', 'all'] or doc['selector'] != SELECTOR: raise ValueError('Unsupported experiment configuration')
    if doc['scope'] != 'Original classes and literal method/call counts, not Mixin injection semantics or native mod compatibility.': raise ValueError('Invalid fixture scope')
    rows = doc['fixtures']
    if not isinstance(rows, list) or not 1 <= len(rows) <= 32: raise ValueError('Expected 1 to 32 fixtures')
    seen = set()
    for item in rows:
        if not isinstance(item, dict) or set(item) != {'id', 'source', 'expected'}: raise ValueError('Unexpected fixture fields')
        ident = item['id']
        if not isinstance(ident, str) or not re.fullmatch(r'[a-z][a-z0-9_]{0,63}', ident) or ident in seen: raise ValueError('Invalid or duplicate fixture identity')
        seen.add(ident)
        if item['source'] != f'fixtures/{ident}/Target.java': raise ValueError('Unsafe source path')
        expected = item['expected']
        if not isinstance(expected, dict) or set(expected) != FACTS or not all(integer(v, 0, 128) for v in expected.values()): raise ValueError('Invalid expected counts')
    return rows


def input_identity():
    doc = read_json(ROOT / 'cases.json'); rows = validate_cases(doc)
    names = ['cases.json', 'dependencies.json', 'BytecodeProbe.java', 'run.py', 'setup-attempts.json'] + [r['source'] for r in rows]
    identities = {}
    for name in names:
        path = (ROOT / name).resolve()
        if not path.is_relative_to(ROOT.resolve()): raise ValueError('Source escapes laboratory')
        identities[name] = digest(read_bytes(path, 16384 if name.endswith('Target.java') else MAX_JSON))
    return doc, rows, identities


def verify_dependency(directory):
    manifest = read_json(ROOT / 'dependencies.json')
    if not isinstance(manifest, dict) or set(manifest) != {'schema_version', 'artifacts'} or type(manifest['schema_version']) is not int or manifest['schema_version'] != 1: raise ValueError('Invalid dependency manifest')
    entries = manifest['artifacts']
    if not isinstance(entries, list) or len(entries) != 1: raise ValueError('One pinned ASM artifact required')
    item = entries[0]
    if not isinstance(item, dict) or set(item) != {'name', 'url', 'bytes', 'sha256'}: raise ValueError('Invalid artifact fields')
    if item['name'] != 'asm-9.11.1.jar' or item['url'] != 'https://repo.maven.apache.org/maven2/org/ow2/asm/asm/9.11.1/asm-9.11.1.jar': raise ValueError('Unexpected artifact identity')
    if not integer(item['bytes'], 1, 1000000) or not isinstance(item['sha256'], str) or not re.fullmatch('[0-9a-f]{64}', item['sha256']): raise ValueError('Invalid artifact digest/size')
    path = Path(directory) / item['name']; data = read_bytes(path, 1000000)
    if len(data) != item['bytes'] or digest(data) != item['sha256']: raise ValueError('Dependency bytes mismatch')
    return path.resolve(), entries


def validate_instruction(item, index):
    if not isinstance(item, dict) or type(item.get('index')) is not int or item['index'] != index or not integer(item.get('opcode'), 0, 201): raise ValueError('Invalid instruction identity/opcode')
    opcode = item['opcode']; extra = {}
    if opcode in {16, 17, 188}: extra = {'operand': int}
    elif opcode in set(range(21, 26)) | set(range(54, 59)) | {169}: extra = {'variable': int}
    elif opcode in {187, 189, 192, 193}: extra = {'type': str}
    elif opcode in {178, 179, 180, 181}: extra = {'owner': str, 'name': str, 'descriptor': str}
    elif opcode in {182, 183, 184, 185}: extra = {'owner': str, 'name': str, 'descriptor': str, 'interface': bool}
    elif opcode == 186: extra = {'name': str, 'descriptor': str, 'bootstrap_owner': str}
    elif opcode == 18: extra = {'constant': str}
    elif opcode == 132: extra = {'variable': int, 'increment': int}
    elif opcode == 170: extra = {'min': int, 'max': int}
    elif opcode == 171: extra = {'keys': int}
    elif opcode == 197: extra = {'descriptor': str, 'dimensions': int}
    if set(item) != {'index', 'opcode'} | set(extra): raise ValueError('Unexpected instruction fields')
    for key, cls in extra.items():
        if type(item[key]) is not cls or (cls is str and not text_value(item[key])): raise ValueError('Invalid instruction field type')


def decode_inventory(raw, fixtures):
    if not isinstance(raw, str) or len(raw.encode('utf-8')) > MAX_JSON: raise ValueError('Output exceeds byte budget')
    lines = raw.splitlines(); expected_order = [(r['id'], debug) for r in fixtures for debug in ['none', 'all']]
    if len(lines) != len(expected_order): raise ValueError('Missing or extra class observations')
    inventory = []
    for line, (ident, debug) in zip(lines, expected_order):
        item = parse_json(line)
        fields = {'fixture', 'debug', 'class_name', 'class_major', 'class_bytes', 'class_sha256', 'methods'}
        if not isinstance(item, dict) or set(item) != fields or (item['fixture'], item['debug']) != (ident, debug): raise ValueError('Unexpected class identity/order')
        if item['class_name'] != 'lab/Target' or type(item['class_major']) is not int or item['class_major'] != 65: raise ValueError('Unexpected class target')
        if not integer(item['class_bytes'], 1, 65536) or not isinstance(item['class_sha256'], str) or not re.fullmatch('[0-9a-f]{64}', item['class_sha256']): raise ValueError('Invalid class artifact identity')
        methods = item['methods']; seen = set()
        if not isinstance(methods, list) or not 1 <= len(methods) <= 128: raise ValueError('Invalid method inventory')
        for method in methods:
            if not isinstance(method, dict) or set(method) != {'name', 'descriptor', 'access', 'instructions'}: raise ValueError('Invalid method fields')
            if not text_value(method['name']) or not text_value(method['descriptor']) or not integer(method['access'], 0, 65535): raise ValueError('Invalid method identity')
            key = (method['name'], method['descriptor'])
            if key in seen: raise ValueError('Duplicate method identity')
            seen.add(key); instructions = method['instructions']
            if not isinstance(instructions, list) or len(instructions) > 10000: raise ValueError('Invalid instruction count')
            for index, instruction in enumerate(instructions): validate_instruction(instruction, index)
        inventory.append(item)
    return inventory


def evaluate(inventory, fixtures):
    expected = {f['id']: f['expected'] for f in fixtures}; observations = []; mismatches = []
    for item in inventory:
        named = [m for m in item['methods'] if m['name'] == SELECTOR['method_name']]
        exact = [m for m in named if m['descriptor'] == SELECTOR['method_descriptor']]
        instructions = [i for m in exact for i in m['instructions']]
        calls = [i for i in instructions if i['opcode'] in {182, 183, 184, 185} and i['name'] == SELECTOR['call_name'] and i['descriptor'] == SELECTOR['call_descriptor']]
        precise = [i for i in calls if i['owner'] == SELECTOR['call_owner']]
        facts = dict(name_matches=len(named), exact_matches=len(exact), return_opcodes=sum(172 <= i['opcode'] <= 177 for i in instructions), throw_opcodes=sum(i['opcode'] == 191 for i in instructions), exact_hook_calls=len(precise), owner_omitted_hook_calls=len(calls))
        context = [{'matching_ordinal': ordinal, 'instruction': i, 'preceding_instruction': instructions[i['index'] - 1] if i['index'] else None} for ordinal, i in enumerate(precise)]
        row = dict(fixture=item['fixture'], debug=item['debug'], facts=facts, expected=expected[item['fixture']], matches_expected=facts == expected[item['fixture']], matching_call_context=context)
        observations.append(row)
        if not row['matches_expected']: mismatches.append(item['fixture'] + '/' + item['debug'])
    debug_comparisons = []
    for i in range(0, len(inventory), 2):
        left, right = inventory[i:i+2]
        debug_comparisons.append(dict(fixture=left['fixture'], artifact_hash_equal=left['class_sha256'] == right['class_sha256'], inspected_methods_equal=left['methods'] == right['methods']))
    return observations, mismatches, debug_comparisons


def run(directory):
    _, fixtures, identities = input_identity(); dependency, artifacts = verify_dependency(directory)
    version = subprocess.run(['java', '-version'], text=True, capture_output=True, timeout=15, check=True)
    with tempfile.TemporaryDirectory(prefix='athena-bytecode-lab-') as temporary:
        work = Path(temporary); ids = work / 'ids.txt'; ids.write_text(''.join(f['id'] + '\n' for f in fixtures), encoding='utf-8')
        result = subprocess.run(['java', '-Xmx128m', '--class-path', str(dependency), str(ROOT/'BytecodeProbe.java'), str(ROOT), str(ids), str(work/'classes')], text=True, capture_output=True, timeout=45)
    if result.returncode != 0 or result.stderr: raise RuntimeError('Probe did not complete cleanly: ' + result.stderr[:4000])
    inventory = decode_inventory(result.stdout, fixtures)
    observations, mismatches, debug = evaluate(inventory, fixtures)
    return dict(schema_version=1, kind='measured_bytecode_on_synthetic_sources', scope=SCOPE, observed_at_utc=dt.datetime.now(dt.timezone.utc).isoformat(),
                environment=dict(java_version=(version.stdout+version.stderr).strip(), python=platform.python_version(), platform=platform.system(), architecture=platform.machine()),
                compiler_options=COMPILER, input_sha256=identities, dependencies=artifacts, class_observations=len(inventory), all_expected=not mismatches,
                mismatches=mismatches, observations=observations, debug_comparisons=debug, inventory=inventory, raw_stdout=result.stdout)


def same_value(left, right):
    """JSON evidence equality must not equate booleans, integers and floats."""
    if type(left) is not type(right): return False
    if isinstance(left, dict):
        return left.keys() == right.keys() and all(same_value(left[k], right[k]) for k in left)
    if isinstance(left, list):
        return len(left) == len(right) and all(same_value(a, b) for a, b in zip(left, right))
    return left == right


def validate_receipt(receipt):
    _, fixtures, identities = input_identity()
    fields = {'schema_version','kind','scope','observed_at_utc','environment','compiler_options','input_sha256','dependencies','class_observations','all_expected','mismatches','observations','debug_comparisons','inventory','raw_stdout'}
    if not isinstance(receipt, dict) or set(receipt) != fields: raise ValueError('Invalid receipt fields')
    if type(receipt['schema_version']) is not int or receipt['schema_version'] != 1 or receipt['kind'] != 'measured_bytecode_on_synthetic_sources' or receipt['scope'] != SCOPE: raise ValueError('Invalid receipt evidence scope')
    if not isinstance(receipt['observed_at_utc'], str): raise ValueError('Invalid receipt time')
    date = dt.datetime.fromisoformat(receipt['observed_at_utc'])
    if date.tzinfo is None or date.utcoffset() != dt.timedelta(0): raise ValueError('UTC timestamp required')
    if not same_value(receipt['input_sha256'], identities) or not same_value(receipt['dependencies'], read_json(ROOT/'dependencies.json')['artifacts']) or not same_value(receipt['compiler_options'], COMPILER): raise ValueError('Receipt input identity mismatch')
    env = receipt['environment']
    if not isinstance(env, dict) or set(env) != {'java_version','python','platform','architecture'} or not all(isinstance(v,str) and v.strip() for v in env.values()): raise ValueError('Incomplete environment')
    inventory = decode_inventory(receipt['raw_stdout'], fixtures)
    observations, mismatches, debug = evaluate(inventory, fixtures)
    if not all(same_value(receipt[key], value) for key, value in [('inventory', inventory), ('observations', observations), ('mismatches', mismatches), ('debug_comparisons', debug)]): raise ValueError('Receipt differs from raw observations')
    if type(receipt['class_observations']) is not int or receipt['class_observations'] != len(inventory) or type(receipt['all_expected']) is not bool or receipt['all_expected'] != (not mismatches): raise ValueError('False receipt aggregate')
    return len(inventory)


def main():
    parser = argparse.ArgumentParser(description=__doc__); parser.add_argument('--dependency-dir', type=Path, required=True); args=parser.parse_args()
    try:
        receipt=run(args.dependency_dir); print(json.dumps(receipt,indent=2)); return 0 if receipt['all_expected'] else 1
    except (ValueError,OSError,RuntimeError,subprocess.SubprocessError) as error:
        print(str(error),file=sys.stderr); return 2


if __name__ == '__main__':
    raise SystemExit(main())
