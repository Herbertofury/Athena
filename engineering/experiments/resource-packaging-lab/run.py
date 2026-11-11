#!/usr/bin/env python3
"""Bounded, offline resource-only Gradle archive experiment, not a mod build."""
from __future__ import annotations
import argparse
import base64
import datetime as dt
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import platform
import re
import stat
import subprocess
import sys
import tempfile
import zipfile

ROOT = Path(__file__).resolve().parent
SCOPE = 'Measured resource-only Gradle packaging on original synthetic inputs. No game, loader, resource import, remapping, signing, target build, or native compatibility acceptance.'
MAX_JSON = 1048576
TASKS = ['defaultJar', 'timestampJar', 'missingJar', 'excludeJar', 'includeJar']
RUNS = ['a:success', 'b:success', 'a:failDifferent', 'a:failIdentical']
INPUTS = ['run.py', 'build.gradle', 'settings.gradle', 'fixtures.json', 'dependencies.json', 'setup-attempts.json']
FLAGS = ['--offline', '--no-daemon', '--console=plain', '--max-workers=1', '--rerun-tasks', '--no-build-cache', '--no-configuration-cache', '-Duser.timezone=UTC']


def digest(data):
    return hashlib.sha256(data).hexdigest()


def bounded_read(path, limit=MAX_JSON):
    with Path(path).open('rb') as stream: data = stream.read(limit + 1)
    if len(data) > limit: raise ValueError('Input exceeds byte budget')
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


def read_json(path):
    return parse_json(bounded_read(path).decode('utf-8'))


def same_value(a, b):
    if type(a) is not type(b): return False
    if isinstance(a, dict): return a.keys() == b.keys() and all(same_value(a[k], b[k]) for k in a)
    if isinstance(a, list): return len(a) == len(b) and all(same_value(x, y) for x, y in zip(a, b))
    return a == b


def safe_path(name):
    if not isinstance(name, str) or len(name) > 256 or not name or '\\' in name or ':' in name or any(ord(c) < 32 or ord(c) == 127 for c in name): raise ValueError('Unsafe archive path')
    p = PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or '.' in name.split('/') or '//' in name: raise ValueError('Unsafe archive path')
    return p


def validate_fixtures(doc):
    if not isinstance(doc, dict) or set(doc) != {'schema_version', 'kind', 'resources', 'alternate', 'variants'}: raise ValueError('Invalid fixture fields')
    if type(doc['schema_version']) is not int or doc['schema_version'] != 1 or doc['kind'] != 'original_synthetic_resources': raise ValueError('Invalid fixture schema')
    resources = doc['resources']
    if not isinstance(resources, list) or len(resources) != 3: raise ValueError('Three fixed resources required')
    expected_paths = ['atlas-lab.json', 'assets/atlas_lab/data/message.txt', 'assets/atlas_lab/data/bytes.bin']
    if [r.get('path') for r in resources if isinstance(r, dict)] != expected_paths: raise ValueError('Unexpected resource paths/order')
    for row in resources + [doc['alternate']]:
        if not isinstance(row, dict) or set(row) != {'path', 'hex'}: raise ValueError('Invalid resource fields')
        safe_path(row['path'])
        if not isinstance(row['hex'], str) or not re.fullmatch('(?:[0-9a-f]{2}){1,1024}', row['hex']): raise ValueError('Invalid resource bytes')
    if doc['alternate']['path'] != expected_paths[1] or doc['alternate']['hex'] == resources[1]['hex']: raise ValueError('A different duplicate is required')
    variants = {'a': {'mtime': 1577836800, 'reverse_creation': False}, 'b': {'mtime': 1704067200, 'reverse_creation': True}}
    if not same_value(doc['variants'], variants): raise ValueError('Invalid perturbation controls')
    return doc


def dependency():
    doc = read_json(ROOT / 'dependencies.json')
    expected = {'schema_version': 1, 'name': 'gradle-9.2.1-bin.zip', 'url': 'https://downloads.gradle.org/distributions/gradle-9.2.1-bin.zip', 'bytes': 135535598, 'sha256': '72f44c9f8ebcb1af43838f45ee5c4aa9c5444898b3468ab3f4af7b6076c5bc3f', 'checksum_url': 'https://downloads.gradle.org/distributions/gradle-9.2.1-bin.zip.sha256', 'version': '9.2.1', 'revision': '30ecdc708db275e8f8769ea0620f6dd919a58f76'}
    if not same_value(doc, expected): raise ValueError('Unexpected dependency identity')
    return doc


def identity():
    return {name: digest(bounded_read(ROOT / name)) for name in INPUTS}


def unpack_distribution(path, destination):
    spec = dependency()
    data = bounded_read(path, spec['bytes'])
    if len(data) != spec['bytes'] or digest(data) != spec['sha256']: raise ValueError('Gradle distribution hash/size mismatch')
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        rows = archive.infolist(); seen = set()
        if len(rows) > 10000 or sum(r.file_size for r in rows) > 500000000: raise ValueError('Distribution extraction budget exceeded')
        for row in rows:
            p = safe_path(row.filename)
            if p.parts[0] != 'gradle-9.2.1' or row.filename in seen or stat.S_ISLNK(row.external_attr >> 16): raise ValueError('Unexpected distribution entry')
            seen.add(row.filename)
        archive.extractall(destination)
    return destination / 'gradle-9.2.1/bin/gradle'


def inspect_archive(data):
    if not isinstance(data, bytes) or not 1 <= len(data) <= 65536: raise ValueError('Archive byte budget exceeded')
    inventory = []
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        rows = archive.infolist()
        if len(rows) > 64 or sum(r.file_size for r in rows) > 65536: raise ValueError('Archive entry/expanded-byte budget exceeded')
        for index, row in enumerate(rows):
            safe_path(row.filename)
            if row.flag_bits & 1 or stat.S_ISLNK(row.external_attr >> 16): raise ValueError('Encrypted/linked fixture entry rejected')
            if row.compress_type not in {zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED}: raise ValueError('Unexpected compression')
            # Read ZipInfo, not name: a filename dictionary loses duplicate occurrences.
            with archive.open(row) as stream: payload = stream.read(65537)
            if len(payload) != row.file_size or len(payload) > 65536: raise ValueError('Invalid expanded payload')
            inventory.append({'index': index, 'path': row.filename, 'directory': row.is_dir(), 'bytes': len(payload), 'sha256': digest(payload), 'date_time': list(row.date_time), 'unix_mode': row.external_attr >> 16, 'compression': row.compress_type, 'crc32': row.CRC})
    return {'bytes': len(data), 'sha256': digest(data), 'entries': inventory}


def resource_rows(inventory):
    return [{'path': r['path'], 'sha256': r['sha256']} for r in inventory['entries'] if not r['directory'] and r['path'] != 'META-INF/MANIFEST.MF']


def expectations(fixtures):
    primary = [{'path': r['path'], 'sha256': digest(bytes.fromhex(r['hex']))} for r in fixtures['resources']]
    alternate = {'path': fixtures['alternate']['path'], 'sha256': digest(bytes.fromhex(fixtures['alternate']['hex']))}
    return primary, alternate


def analyze(artifacts, fixtures):
    expected_ids = [f'{v}:{t}' for v in ['a', 'b'] for t in TASKS]
    if not isinstance(artifacts, list) or [r.get('id') for r in artifacts if isinstance(r, dict)] != expected_ids: raise ValueError('Missing, extra, or reordered artifacts')
    primary, alternate = expectations(fixtures); primary_by_path = {r['path']: r for r in primary}
    observations = []
    for row in artifacts:
        if set(row) != {'id', 'base64'} or not isinstance(row['base64'], str) or len(row['base64']) > 90000: raise ValueError('Invalid artifact fields')
        data = base64.b64decode(row['base64'], validate=True)
        info = inspect_archive(data); actual = resource_rows(info)
        variant, task = row['id'].split(':'); wanted = list(primary)
        if task == 'missingJar': wanted = [r for r in primary if not r['path'].endswith('/bytes.bin')]
        if task == 'excludeJar' and variant == 'b': wanted = [alternate if r['path'] == alternate['path'] else r for r in primary]
        if task == 'includeJar': wanted += [alternate]
        sorted_rows = lambda rows: sorted(rows, key=lambda r: (r['path'], r['sha256']))
        file_entries = [r for r in info['entries'] if not r['directory']]
        duplicates = sorted({r['path'] for r in file_entries if sum(x['path'] == r['path'] for x in file_entries) > 1})
        manifests = [r for r in file_entries if r['path'] == 'META-INF/MANIFEST.MF']
        manifest_valid = len(manifests) == 1 and manifests[0]['sha256'] == digest(b'Manifest-Version: 1.0\r\n\r\n')
        expected_duplicates = [alternate['path']] if task == 'includeJar' else []
        occurrences = [r['sha256'] for r in actual if r['path'] == alternate['path']]
        expected_occurrences = [primary_by_path[alternate['path']]['sha256']]
        if task == 'excludeJar' and variant == 'b': expected_occurrences = [alternate['sha256']]
        if task == 'includeJar': expected_occurrences = expected_occurrences + [alternate['sha256']] if variant == 'a' else [alternate['sha256']] + expected_occurrences
        checks = {'resource_multiset': sorted_rows(actual) == sorted_rows(wanted), 'duplicate_occurrence_order': occurrences == expected_occurrences, 'duplicate_paths': duplicates == expected_duplicates, 'generated_manifest': manifest_valid}
        # Unique paths and full source completeness are findings, not universal expected successes.
        observations.append({'id': row['id'], 'archive': info, 'resource_entries': actual, 'duplicate_paths': duplicates, 'complete_primary_resources': sorted_rows(actual) == sorted_rows(primary), 'matches_expected': all(checks.values())})
    by_id = {r['id']: r for r in observations}
    comparisons = []
    for task, expect_equal in [('defaultJar', True), ('timestampJar', False), ('missingJar', True), ('excludeJar', False), ('includeJar', False)]:
        a, b = by_id[f'a:{task}'], by_id[f'b:{task}']
        equal = a['archive']['sha256'] == b['archive']['sha256']
        comparisons.append({'task': task, 'archive_bytes_equal': equal, 'expected_equal': expect_equal, 'matches_expected': equal == expect_equal})
    return observations, comparisons


def validate_runs(runs):
    if not isinstance(runs, list) or [r.get('id') for r in runs if isinstance(r, dict)] != RUNS: raise ValueError('Incomplete build runs')
    for row in runs:
        if set(row) != {'id', 'returncode', 'stdout', 'stderr'} or type(row['returncode']) is not int or not 0 <= row['returncode'] <= 255: raise ValueError('Invalid build result fields')
        for stream in ['stdout', 'stderr']:
            if not isinstance(row[stream], str) or len(row[stream].encode()) > 100000: raise ValueError('Invalid build output')
        output = row['stdout'] + row['stderr']
        if row['id'].endswith(':success'):
            if row['returncode'] != 0 or 'BUILD SUCCESSFUL' not in output or any(f'> Task :{task}' not in output for task in TASKS): raise ValueError('Missing successful archive tasks')
        elif row['returncode'] == 0 or 'BUILD FAILED' not in output or 'assets/atlas_lab/data/message.txt' not in output or 'has already been copied there' not in output or f"> Task :{row['id'].split(':')[1]} FAILED" not in output:
            raise ValueError('Expected duplicate-path failure not observed')


def report(artifacts, runs, fixtures):
    validate_runs(runs)
    observations, comparisons = analyze(artifacts, fixtures)
    return {'observations': observations, 'comparisons': comparisons, 'all_expected': all(r['matches_expected'] for r in observations + comparisons), 'successful_archives': len(observations), 'expected_failed_builds': 2}


def validate_receipt(doc):
    fields = {'schema_version', 'scope', 'recorded_at_utc', 'environment', 'dependency', 'input_sha256', 'flags', 'gradle_version_stdout', 'runs', 'artifacts', 'observations', 'comparisons', 'all_expected', 'successful_archives', 'expected_failed_builds'}
    if not isinstance(doc, dict) or set(doc) != fields or type(doc['schema_version']) is not int or doc['schema_version'] != 1: raise ValueError('Invalid receipt fields')
    if doc['scope'] != SCOPE or not same_value(doc['dependency'], dependency()) or not same_value(doc['input_sha256'], identity()) or not same_value(doc['flags'], FLAGS): raise ValueError('Receipt identity/scope mismatch')
    if not isinstance(doc['recorded_at_utc'], str) or not re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\+00:00', doc['recorded_at_utc']): raise ValueError('Invalid UTC timestamp')
    dt.datetime.fromisoformat(doc['recorded_at_utc'])
    env = doc['environment']
    if not isinstance(env, dict) or set(env) != {'python', 'system', 'machine'} or not all(isinstance(v, str) and 0 < len(v) < 256 and all(ord(c) >= 32 for c in v) for v in env.values()): raise ValueError('Invalid environment labels')
    version = doc['gradle_version_stdout']
    if not isinstance(version, str) or len(version) > 10000 or '\nGradle 9.2.1\n' not in version or dependency()['revision'] not in version: raise ValueError('Unexpected Gradle version')
    derived = report(doc['artifacts'], doc['runs'], validate_fixtures(read_json(ROOT / 'fixtures.json')))
    if not all(same_value(doc[key], value) for key, value in derived.items()): raise ValueError('Derived receipt fields mismatch')
    return derived


def execute(distribution):
    fixtures = validate_fixtures(read_json(ROOT / 'fixtures.json'))
    with tempfile.TemporaryDirectory(prefix='atlas-resource-') as temp:
        work = Path(temp); gradle = unpack_distribution(distribution, work / 'distribution')
        env = {'PATH': os.environ.get('PATH', ''), 'HOME': str(work / 'home'), 'GRADLE_USER_HOME': str(work / 'gradle-home'), 'LANG': 'C.UTF-8', 'TZ': 'UTC'}
        if 'JAVA_HOME' in os.environ: env['JAVA_HOME'] = os.environ['JAVA_HOME']
        def invoke(cwd, args, timeout=180):
            result = subprocess.run(['bash', str(gradle)] + args, cwd=cwd, env=env, capture_output=True, text=True, timeout=timeout)
            streams = [result.stdout, result.stderr]
            if any(len(s.encode()) > 100000 for s in streams): raise ValueError('Build output budget exceeded')
            return result.returncode, *(s.replace(str(work), '<RUN>') for s in streams)
        code, version, stderr = invoke(work, ['--version', '--offline', '--no-daemon', '--console=plain'])
        if code or stderr: raise ValueError('Gradle version probe failed: ' + stderr)
        artifacts, runs = [], []
        for variant, controls in fixtures['variants'].items():
            project = work / ('project-' + variant); project.mkdir()
            for name in ['build.gradle', 'settings.gradle']: (project / name).write_bytes(bounded_read(ROOT / name))
            rows = fixtures['resources'][::-1] if controls['reverse_creation'] else fixtures['resources']
            for directory, entries in [('primary', rows), ('alternate', [fixtures['alternate']]), ('identical', [fixtures['resources'][1]])]:
                for row in entries:
                    target = project / directory / row['path']; target.parent.mkdir(parents=True, exist_ok=True)
                    target.write_bytes(bytes.fromhex(row['hex'])); os.utime(target, (controls['mtime'], controls['mtime']))
            code, out, err = invoke(project, FLAGS + [f'-Pvariant={variant}'] + TASKS)
            runs.append({'id': f'{variant}:success', 'returncode': code, 'stdout': out, 'stderr': err})
            if code: raise ValueError('Fixture packaging failed: ' + out + err)
            for task in TASKS:
                data = bounded_read(project / f'build/artifacts/{task}.jar', 65536)
                artifacts.append({'id': f'{variant}:{task}', 'base64': base64.b64encode(data).decode('ascii')})
        for task in ['failDifferent', 'failIdentical']:
            code, out, err = invoke(work / 'project-a', FLAGS + ['-Pvariant=a', task])
            runs.append({'id': f'a:{task}', 'returncode': code, 'stdout': out, 'stderr': err})
        try:
            derived = report(artifacts, runs, fixtures)
        except ValueError as exc:
            raise ValueError(json.dumps({'stage': 'report_validation', 'error': str(exc), 'runs': runs, 'artifacts': artifacts})) from exc
        receipt = {'schema_version': 1, 'scope': SCOPE, 'recorded_at_utc': dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat(), 'environment': {'python': platform.python_version(), 'system': platform.system(), 'machine': platform.machine()}, 'dependency': dependency(), 'input_sha256': identity(), 'flags': FLAGS, 'gradle_version_stdout': version, 'runs': runs, 'artifacts': artifacts, **derived}
        validate_receipt(receipt)
        return receipt


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--distribution', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--verify-receipt', type=Path)
    args = parser.parse_args(argv)
    try:
        if args.verify_receipt:
            if args.distribution or args.output: raise ValueError('Receipt verification cannot execute a build')
            result = validate_receipt(read_json(args.verify_receipt))
        else:
            if not args.distribution or not args.output: raise ValueError('Provide local verified distribution and new output path')
            if args.output.exists(): raise ValueError('Output exists; preserve prior evidence')
            receipt = execute(args.distribution)
            with args.output.open('x', encoding='utf-8') as stream: json.dump(receipt, stream, indent=2); stream.write('\n')
            result = receipt
        print(json.dumps({k: result[k] for k in ['successful_archives', 'expected_failed_builds', 'all_expected']}))
        return 0 if result['all_expected'] else 1
    except (ValueError, OSError, KeyError, zipfile.BadZipFile, subprocess.SubprocessError) as exc:
        print(str(exc), file=sys.stderr); return 2


if __name__ == '__main__':
    raise SystemExit(main())
