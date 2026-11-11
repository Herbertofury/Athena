#!/usr/bin/env python3
"""Offline, hash-pinned upstream API experiment. No game/mod startup or downloads."""
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
OPS = {'fabric_compare', 'maven_compare', 'fabric_match', 'maven_match'}
MAX_BYTES = 262144
SCOPE = 'Only named upstream APIs. No game, Forge/NeoForge wrappers, full mod solver, performance, or production acceptance.'


def digest(data):
    return hashlib.sha256(data).hexdigest()


def strict_json(path):
    path = Path(path)
    with path.open('rb') as handle:
        data = handle.read(MAX_BYTES + 1)
    if len(data) > MAX_BYTES:
        raise ValueError('JSON input exceeds limit')
    def pairs(items):
        out = {}
        for key, value in items:
            if key in out:
                raise ValueError('Duplicate JSON key')
            out[key] = value
        return out
    def constant(value):
        raise ValueError('Non-finite JSON constant')
    return json.loads(data.decode('utf-8'), object_pairs_hook=pairs, parse_constant=constant), data


def validate_cases(value):
    if not isinstance(value, dict) or set(value) != {'schema_version', 'kind', 'purpose', 'cases'}:
        raise ValueError('Unexpected fixture fields')
    if type(value['schema_version']) is not int or value['schema_version'] != 1 or value['kind'] != 'synthetic':
        raise ValueError('Synthetic schema 1 required')
    if not isinstance(value['purpose'], str) or not value['purpose'].strip():
        raise ValueError('Fixture purpose required')
    cases = value['cases']
    if not isinstance(cases, list) or not 1 <= len(cases) <= 256:
        raise ValueError('Expected 1 to 256 cases')
    seen = set()
    keys = {'id', 'operation', 'left', 'right', 'expected_status', 'expected_value', 'expected_detail', 'reason'}
    for case in cases:
        if not isinstance(case, dict) or set(case) != keys:
            raise ValueError('Unexpected case fields')
        if any(not isinstance(case[key], str) for key in keys):
            raise ValueError('Case fields must be strings')
        ident = case['id']
        if not re.fullmatch(r'[a-z0-9_-]{1,64}', ident) or ident in seen:
            raise ValueError('Invalid or duplicate case ID')
        seen.add(ident)
        if case['operation'] not in OPS:
            raise ValueError('Unsupported operation')
        for key in keys:
            text = case[key]
            if len(text) > 512 or any(ord(c) < 32 or ord(c) == 127 for c in text):
                raise ValueError('Oversized or control-containing case field')
        if not case['reason'].strip():
            raise ValueError('Case reason required')
        if case['expected_status'] == 'parse_error':
            if case['expected_value'] or case['expected_detail'] not in {'VersionParsingException', 'InvalidVersionSpecificationException'}:
                raise ValueError('Invalid expected parse error')
        elif case['expected_status'] == 'ok':
            choices = {'-1', '0', '1'} if case['operation'].endswith('compare') else {'true', 'false'}
            if case['expected_value'] not in choices:
                raise ValueError('Invalid expected value')
        else:
            raise ValueError('Unknown expected status')
    return cases


def verified_dependencies(directory, manifest):
    if not isinstance(manifest, dict) or set(manifest) != {'schema_version', 'scope', 'artifacts'}:
        raise ValueError('Invalid dependency manifest')
    if type(manifest['schema_version']) is not int or manifest['schema_version'] != 1:
        raise ValueError('Invalid dependency schema')
    artifacts = manifest['artifacts']
    if not isinstance(artifacts, list) or len(artifacts) != 2:
        raise ValueError('Two pinned libraries required')
    paths, receipts, seen = [], [], set()
    for item in artifacts:
        if not isinstance(item, dict) or set(item) != {'name', 'url', 'bytes', 'sha256'}:
            raise ValueError('Invalid artifact entry')
        name = item['name']
        if not isinstance(name, str) or not re.fullmatch(r'[a-z0-9.-]+\.jar', name) or name in seen:
            raise ValueError('Unsafe or duplicate artifact name')
        seen.add(name)
        if type(item['bytes']) is not int or not 0 < item['bytes'] <= 8_000_000:
            raise ValueError('Invalid artifact size')
        if not isinstance(item['sha256'], str) or not re.fullmatch(r'[0-9a-f]{64}', item['sha256']):
            raise ValueError('Invalid artifact hash')
        if not isinstance(item['url'], str) or not item['url'].startswith('https://'):
            raise ValueError('HTTPS provenance URL required')
        path = Path(directory) / name
        with path.open('rb') as handle:
            data = handle.read(8_000_001)
        if len(data) != item['bytes'] or digest(data) != item['sha256']:
            raise ValueError('Dependency identity mismatch: ' + name)
        paths.append(str(path.resolve()))
        receipts.append(dict(item))
    return paths, receipts


def decode_observations(stdout, cases):
    if len(stdout.encode('utf-8')) > 262144:
        raise ValueError('Unexpectedly large Java output')
    lines = stdout.splitlines()
    if len(lines) != len(cases):
        raise ValueError('Missing or extra result rows')
    observations, mismatches = [], []
    for case, line in zip(cases, lines):
        fields = line.split('\t')
        if len(fields) != 4 or fields[0] != case['id']:
            raise ValueError('Result identity/order mismatch')
        _, status, result, detail = fields
        if status not in {'ok', 'parse_error'}:
            raise ValueError('Unknown result status')
        if status == 'ok':
            choices = {'-1', '0', '1'} if case['operation'].endswith('compare') else {'true', 'false'}
            if result not in choices:
                raise ValueError('Impossible result value')
            if case['operation'] == 'maven_match':
                if not re.fullmatch(r'recommended=.*;restrictions=[0-9]+;hard=(true|false)', detail):
                    raise ValueError('Malformed Maven result detail')
            elif detail:
                raise ValueError('Unexpected result detail')
        else:
            error_type = 'VersionParsingException' if case['operation'].startswith('fabric_') else 'InvalidVersionSpecificationException'
            if result or detail != error_type or case['operation'] == 'maven_compare':
                raise ValueError('Impossible parsing failure')
        row = {'id': case['id'], 'operation': case['operation'], 'left': case['left'], 'right': case['right'],
               'status': status, 'value': result, 'detail': detail}
        row['matches_expected'] = [status, result, detail] == [case['expected_status'], case['expected_value'], case['expected_detail']]
        observations.append(row)
        if not row['matches_expected']:
            mismatches.append(case['id'])
    return observations, mismatches


def run(directory, cases_path=None):
    case_doc, case_bytes = strict_json(cases_path or ROOT / 'cases.json')
    cases = validate_cases(case_doc)
    manifest, manifest_bytes = strict_json(ROOT / 'dependencies.json')
    paths, dependencies = verified_dependencies(directory, manifest)
    source = ROOT / 'VersionProbe.java'
    tsv = ''.join('\t'.join(case[k] for k in ('id', 'operation', 'left', 'right')) + '\n' for case in cases)
    if len(tsv.encode('utf-8')) > 65536:
        raise ValueError('TSV input exceeds Java limit')
    version = subprocess.run(['java', '-version'], capture_output=True, text=True, timeout=15, check=True)
    with tempfile.TemporaryDirectory(prefix='athena-version-probe-') as temporary:
        input_path = Path(temporary) / 'cases.tsv'
        input_path.write_text(tsv, encoding='utf-8')
        result = subprocess.run(['java', '--class-path', os.pathsep.join(paths), str(source), str(input_path)],
                                capture_output=True, text=True, timeout=30)
    if result.returncode != 0:
        raise RuntimeError('Java experiment failed before a complete receipt: ' + result.stderr[:4000])
    if result.stderr:
        raise RuntimeError('Unexpected Java stderr: ' + result.stderr[:4000])
    observations, mismatches = decode_observations(result.stdout, cases)
    return {'schema_version': 1, 'kind': 'measured_api_behavior_on_synthetic_inputs',
            'observed_at_utc': dt.datetime.now(dt.timezone.utc).isoformat(),
            'scope': SCOPE,
            'environment': {'java_version': (version.stdout + version.stderr).strip(), 'platform': platform.system(),
                            'architecture': platform.machine(), 'python': platform.python_version()},
            'inputs': {'cases_sha256': digest(case_bytes), 'dependency_manifest_sha256': digest(manifest_bytes),
                       'driver_sha256': digest(source.read_bytes()), 'runner_sha256': digest(Path(__file__).read_bytes())},
            'dependencies': dependencies, 'case_count': len(cases), 'all_expected': not mismatches,
            'mismatches': mismatches, 'observations': observations, 'raw_stdout': result.stdout}


def validate_retained_receipt(receipt):
    """Check retained evidence identity and internal consistency, not authenticity."""
    case_doc, case_bytes = strict_json(ROOT / 'cases.json')
    cases = validate_cases(case_doc)
    manifest, manifest_bytes = strict_json(ROOT / 'dependencies.json')
    if not isinstance(receipt, dict) or type(receipt.get('schema_version')) is not int or receipt['schema_version'] != 1:
        raise ValueError('Invalid receipt schema')
    if receipt.get('kind') != 'measured_api_behavior_on_synthetic_inputs':
        raise ValueError('Wrong evidence kind')
    if receipt.get('scope') != SCOPE:
        raise ValueError('Retained evidence scope mismatch')
    date = dt.datetime.fromisoformat(receipt['observed_at_utc'])
    if date.tzinfo is None or date.utcoffset() != dt.timedelta(0):
        raise ValueError('UTC observation timestamp required')
    expected_inputs = {'cases_sha256': digest(case_bytes), 'dependency_manifest_sha256': digest(manifest_bytes),
                       'driver_sha256': digest((ROOT / 'VersionProbe.java').read_bytes()),
                       'runner_sha256': digest(Path(__file__).read_bytes())}
    if receipt.get('inputs') != expected_inputs or receipt.get('dependencies') != manifest['artifacts']:
        raise ValueError('Retained input identity mismatch')
    observations, mismatches = decode_observations(receipt['raw_stdout'], cases)
    if receipt.get('observations') != observations or receipt.get('mismatches') != mismatches:
        raise ValueError('Retained observations differ from raw output')
    if type(receipt.get('case_count')) is not int or receipt['case_count'] != len(cases):
        raise ValueError('Incorrect retained case count')
    if type(receipt.get('all_expected')) is not bool or receipt['all_expected'] != (not mismatches):
        raise ValueError('Incorrect retained aggregate')
    if not isinstance(receipt.get('environment'), dict) or set(receipt['environment']) != {'java_version', 'platform', 'architecture', 'python'}:
        raise ValueError('Incomplete retained environment')
    if any(not isinstance(v, str) or not v.strip() for v in receipt['environment'].values()):
        raise ValueError('Empty retained environment')
    return len(cases)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--dependency-dir', required=True, type=Path)
    args = parser.parse_args()
    try:
        receipt = run(args.dependency_dir)
        print(json.dumps(receipt, indent=2))
        return 0 if receipt['all_expected'] else 1
    except (ValueError, OSError, RuntimeError, subprocess.SubprocessError) as error:
        print(str(error), file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
