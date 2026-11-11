#!/usr/bin/env python3
"""Actual offline Gradle resolution over original local Maven fixtures."""
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
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parent
SCOPE = 'Synthetic local-Maven Gradle graph, lock and checksum observations. No compilation, binary/API compatibility, mod solver, game loading, target change or performance acceptance.'
INPUTS = ['run.py', 'build.gradle', 'settings.gradle', 'fixtures.json', 'dependencies.json', 'initial-build.gradle', 'initial-observations.json']
FLAGS = ['--offline', '--no-daemon', '--console=plain', '--max-workers=1', '--no-build-cache', '--no-configuration-cache', '--rerun-tasks', '-Duser.timezone=UTC', '-Porg.gradle.dependency.verification.console=verbose']
IDS = ['default_conflict', 'strict_transitive', 'incompatible_stricts', 'forced_downgrade', 'unused_constraint', 'write_lock', 'unlocked_added_version', 'locked_added_version', 'locked_missing_version', 'locked_changed_jar', 'write_verification', 'verified_original', 'legacy_changed_jar', 'verified_changed_jar', 'verified_changed_pom']
MAX_JSON = 2097152


def digest(b): return hashlib.sha256(b).hexdigest()


def bounded_read(path, limit=MAX_JSON):
    with Path(path).open('rb') as f: b = f.read(limit + 1)
    if len(b) > limit: raise ValueError('Byte budget exceeded')
    return b


def parse_json(text):
    def pairs(items):
        out = {}
        for k, v in items:
            if k in out: raise ValueError('Duplicate JSON key')
            out[k] = v
        return out
    def constant(_): raise ValueError('Non-finite JSON')
    return json.loads(text, object_pairs_hook=pairs, parse_constant=constant)


def read_json(p): return parse_json(bounded_read(p).decode())


def same(a, b):
    if type(a) is not type(b): return False
    if isinstance(a, dict): return a.keys() == b.keys() and all(same(a[k], b[k]) for k in a)
    if isinstance(a, list): return len(a) == len(b) and all(same(x, y) for x, y in zip(a, b))
    return a == b


def exact(a, b, message):
    if not same(a, b): raise ValueError(message)


def fields(value, names):
    if type(value) is not dict or set(value) != set(names.split()): raise ValueError('Invalid fields')


def text(value, limit=131072):
    if type(value) is not str or len(value) > limit or '\0' in value: raise ValueError('Invalid text')
    return value


def dependency():
    value = read_json(ROOT / 'dependencies.json')
    expected = {'schema_version': 1, 'name': 'gradle-9.2.1-bin.zip', 'url': 'https://downloads.gradle.org/distributions/gradle-9.2.1-bin.zip', 'bytes': 135535598, 'sha256': '72f44c9f8ebcb1af43838f45ee5c4aa9c5444898b3468ab3f4af7b6076c5bc3f', 'checksum_url': 'https://downloads.gradle.org/distributions/gradle-9.2.1-bin.zip.sha256', 'version': '9.2.1', 'revision': '30ecdc708db275e8f8769ea0620f6dd919a58f76'}
    exact(value, expected, 'Unexpected distribution identity')
    return value


def fixtures():
    doc = read_json(ROOT / 'fixtures.json')
    fields(doc, 'schema_version kind cases')
    exact(doc['schema_version'], 1, 'Fixture schema')
    exact(doc['kind'], 'original_synthetic_local_maven_modules', 'Fixture scope')
    if type(doc['cases']) is not list or [c.get('id') for c in doc['cases']] != IDS: raise ValueError('Case identities/order')
    for c in doc['cases']:
        fields(c, 'id mode core_versions mutation use_lock use_verification extra_flags legacy_only expected')
        if c['mode'] not in ['conflict', 'strict', 'impossible', 'force', 'constraint', 'locked', 'dynamic']: raise ValueError('Mode')
        if not isinstance(c['core_versions'], list) or not c['core_versions'] or c['core_versions'] != sorted(set(c['core_versions'])) or any(v not in ['1.0', '1.1', '1.2', '2.0'] for v in c['core_versions']): raise ValueError('Versions')
        if c['mutation'] not in [None, 'jar', 'pom']: raise ValueError('Mutation')
        for k in ['use_lock', 'use_verification', 'legacy_only']:
            if type(c[k]) is not bool: raise ValueError('Boolean control')
        if c['extra_flags'] not in [[], ['--write-locks'], ['--write-verification-metadata', 'sha256']]: raise ValueError('Unexpected flags')
        e = c['expected']; fields(e, 'success core addon reason diagnostic')
        if type(e['success']) is not bool or type(e['addon']) is not bool: raise ValueError('Expected boolean')
        if e['success']:
            if e['core'] not in c['core_versions'] or e['diagnostic'] is not None: raise ValueError('Expected success')
        elif e['core'] is not None or e['addon'] or e['reason'] is not None or not isinstance(e['diagnostic'], str): raise ValueError('Expected failure')
        if e['reason'] not in [None, 'CONFLICT_RESOLUTION', 'BY_ANCESTOR', 'FORCED', 'CONSTRAINT']: raise ValueError('Expected reason')
    return doc


def identity(): return {n: digest(bounded_read(ROOT / n)) for n in INPUTS}


def assert_unchanged(snapshot):
    exact(identity(), snapshot, 'Inputs changed during execution')


def original_jar(label):
    b = io.BytesIO()
    with zipfile.ZipFile(b, 'w') as z:
        info = zipfile.ZipInfo('original-fixture.txt', (2020, 1, 1, 0, 0, 0))
        info.external_attr = 0o100644 << 16
        z.writestr(info, label.encode())
    return b.getvalue()


def repository(c):
    out = {}
    for name, versions in [('core', c['core_versions']), ('addon', ['1.0'])]:
        for v in versions:
            prefix = f'atlas/synthetic/{name}/{v}/{name}-{v}'
            dep = '<dependencies><dependency><groupId>atlas.synthetic</groupId><artifactId>core</artifactId><version>2.0</version></dependency></dependencies>' if name == 'addon' else ''
            changed = name == 'core' and v == '1.1'
            extra = '<description>mutated metadata</description>' if changed and c['mutation'] == 'pom' else ''
            out[prefix + '.pom'] = f'<project><modelVersion>4.0.0</modelVersion><groupId>atlas.synthetic</groupId><artifactId>{name}</artifactId><version>{v}</version>{dep}{extra}</project>\n'.encode()
            out[prefix + '.jar'] = original_jar(f'original synthetic {name} {v}\n' + ('mutation\n' if changed and c['mutation'] == 'jar' else ''))
        out[f'atlas/synthetic/{name}/maven-metadata.xml'] = (f'<metadata><groupId>atlas.synthetic</groupId><artifactId>{name}</artifactId><versioning><latest>{versions[-1]}</latest><release>{versions[-1]}</release><versions>' + ''.join(f'<version>{v}</version>' for v in versions) + '</versions><lastUpdated>20261111000000</lastUpdated></versioning></metadata>\n').encode()
    return out


def inventory(c):
    return [{'path': p, 'bytes': len(b), 'sha256': digest(b), 'base64': base64.b64encode(b).decode()} for p, b in sorted(repository(c).items())]


def validate_graph(g):
    fields(g, 'components edges')
    if type(g['components']) is not list or not 1 <= len(g['components']) <= 8 or type(g['edges']) is not list or len(g['edges']) > 12: raise ValueError('Graph bounds')
    ids = []
    for c in g['components']:
        fields(c, 'id reasons'); ids.append(text(c['id'], 256))
        if not (c['id'] == 'root project :' or re.fullmatch(r'atlas\.synthetic:(core|addon):[12]\.[012]', c['id'])): raise ValueError('Unexpected component')
        if type(c['reasons']) is not list or not 1 <= len(c['reasons']) <= 8: raise ValueError('Reasons')
        for r in c['reasons']:
            fields(r, 'cause description'); text(r['description'], 2048)
            if r['cause'] not in ['ROOT', 'REQUESTED', 'CONFLICT_RESOLUTION', 'CONSTRAINT', 'BY_ANCESTOR', 'FORCED', 'SELECTED_BY_RULE', 'REJECTION', 'COMPOSITE_BUILD']: raise ValueError('Reason cause')
    if ids != sorted(set(ids)) or 'root project :' not in ids: raise ValueError('Component identities/order')
    for e in g['edges']:
        if type(e) is not dict or type(e.get('resolved')) is not bool or type(e.get('constraint')) is not bool: raise ValueError('Edge flags')
        fields(e, 'from requested constraint resolved ' + ('selected' if e['resolved'] else 'failure'))
        if e['from'] not in ids: raise ValueError('Edge origin')
        text(e['requested'], 256)
        if not e['requested'].startswith('atlas.synthetic:'): raise ValueError('Requested identity')
        if e['resolved']:
            if e['selected'] not in ids: raise ValueError('Edge target')
        else: text(e['failure'], 8192)
    return g


def graph_contract(c, graph):
    """Declared topology for these fixed fixtures, not a general Gradle solver."""
    if graph is None: raise ValueError('Every case must retain its graph')
    root = 'root project :'; core = 'atlas.synthetic:core:'; addon = 'atlas.synthetic:addon:1.0'
    mode = c['mode']; unresolved = c['id'] in ['incompatible_stricts', 'locked_missing_version']
    selected_version = c['expected']['core'] or ('1.1' if c['id'].startswith('verified_changed_') else None)
    selected = core + selected_version if selected_version else None
    edges = []
    def edge(origin, requested, constraint=False, target=selected, failure_prefix=None):
        e = {'from': origin, 'requested': requested, 'constraint': constraint, 'resolved': not unresolved}
        if unresolved: e['failure_prefix'] = failure_prefix
        else: e['selected'] = target
        edges.append(e)
    if mode in ['conflict', 'strict', 'force']:
        edge(addon, core + '2.0'); edge(root, addon, target=addon); edge(root, core + '1.0')
        if mode == 'strict': edge(root, core + '{strictly 1.0}', True)
    elif mode == 'constraint': edge(root, core + '1.0')
    elif mode == 'impossible':
        for v in ['1.+', '{strictly 1.0}', '{strictly 2.0}']:
            edge(root, core + v, failure_prefix='Could not resolve ' + core + v + '.')
    else:
        edge(root, core + '1.+', failure_prefix='Could not find ' + core + '1.1.')
        if c['id'] == 'locked_missing_version': edge(root, core + '1.1', True, failure_prefix='Dependency lock state out of date')
        if c['use_lock']: edge(root, core + '{strictly 1.1}', True, failure_prefix='Could not find ' + core + '1.1.')
    key = lambda e: (e['from'] + e['requested'] + str(e['constraint']).lower())
    edges.sort(key=key)
    actual = []
    for e in graph['edges']:
        x = dict(e)
        if not x['resolved']:
            message = x.pop('failure')
            matches = [v for v in edges if v['from'] == x['from'] and v['requested'] == x['requested'] and v['constraint'] == x['constraint']]
            x['failure_prefix'] = matches[0]['failure_prefix'] if len(matches) == 1 and message.startswith(matches[0]['failure_prefix']) else None
        actual.append(x)
    expected_components = {root: ['ROOT']}
    if not unresolved:
        causes = ['REQUESTED']
        if mode == 'conflict': causes += ['CONFLICT_RESOLUTION']
        if mode == 'strict': causes += ['CONSTRAINT', 'BY_ANCESTOR']
        if mode == 'force': causes += ['FORCED']
        if c['use_lock']: causes = ['CONSTRAINT', 'REQUESTED']
        expected_components[selected] = causes
        if mode in ['conflict', 'strict', 'force']: expected_components[addon] = ['REQUESTED']
    actual_components = {x['id']: [v['cause'] for v in x['reasons']] for x in graph['components']}
    return same(actual_components, expected_components) and same(actual, edges)


def parse_lock(value):
    if value is None: return None
    rows = [s for s in text(value, 4096).splitlines() if s and not s.startswith('#')]
    exact(rows, ['atlas.synthetic:core:1.1=atlas', 'empty='], 'Unexpected lock state')
    return rows


def parse_verification(value):
    if value is None: return None
    text(value, 16384)
    if '<!DOCTYPE' in value or '<!ENTITY' in value: raise ValueError('XML declarations prohibited')
    root = ET.fromstring(value); ns = '{https://schema.gradle.org/dependency-verification}'
    if [e.tag for e in root] != [ns + 'configuration', ns + 'components']: raise ValueError('Unexpected verification sections')
    if root.tag != ns + 'verification-metadata': raise ValueError('Verification namespace')
    config = root.find(ns + 'configuration')
    if config is not None and (config.attrib or any(e.attrib or len(e) for e in config)): raise ValueError('Unexpected verification configuration')
    if config is None: raise ValueError('Missing verification config')
    exact([(e.tag.removeprefix(ns), e.text) for e in config], [('verify-metadata', 'true'), ('verify-signatures', 'false')], 'Verification policy')
    comps = root.find(ns + 'components')
    if comps is None or len(comps) != 1: raise ValueError('Verification components')
    if comps.attrib or comps[0].tag != ns + 'component': raise ValueError('Verification component structure')
    comp = comps[0];exact(comp.attrib, {'group': 'atlas.synthetic', 'name': 'core', 'version': '1.1'}, 'Verification identity')
    baseline = repository(fixtures()['cases'][5]); out = {}
    for a in comp:
        if a.tag != ns + 'artifact' or set(a.attrib) != {'name'} or len(a) != 1 or a[0].tag != ns + 'sha256': raise ValueError('Verification artifact')
        if len(a[0]): raise ValueError('Unexpected checksum children')
        name = a.attrib['name']
        if name in out or name not in ['core-1.1.jar', 'core-1.1.pom']: raise ValueError('Verification filenames')
        exact(a[0].attrib, {'value': digest(baseline['atlas/synthetic/core/1.1/' + name]), 'origin': 'Generated by Gradle'}, 'Verification checksum')
        out[name] = a[0].attrib['value']
    if len(out) != 2: raise ValueError('Incomplete checksum set')
    return out


def analyze(runs):
    cs = fixtures()['cases']
    if type(runs) is not list or len(runs) != len(cs): raise ValueError('Run count')
    observations = []
    lock = verification = None
    for c, r in zip(cs, runs):
        fields(r, 'id command returncode stdout stderr repository graph observation lock verification')
        exact(r['id'], c['id'], 'Run identity/order')
        wanted_cmd = ['gradle', *FLAGS, '-Pmode=' + c['mode'], *c['extra_flags'], *(['-PlegacyOnly=true'] if c['legacy_only'] else []), 'observe']
        exact(r['command'], wanted_cmd, 'Command controls')
        if type(r['returncode']) is not int or r['returncode'] not in [0, 1]: raise ValueError('Run return code')
        stdout, stderr = text(r['stdout']), text(r['stderr'])
        exact(r['repository'], inventory(c), 'Repository bytes/manifest differ')
        expected_lock = c['use_lock'] or c['id'] == 'write_lock'
        if expected_lock:
            parse_lock(r['lock'])
            if r['lock'] is None: raise ValueError('Missing lockfile')
            if lock is None: lock = r['lock']
            exact(r['lock'], lock, 'Lockfile drift')
        elif r['lock'] is not None: raise ValueError('Unexpected lockfile')
        expected_verification = c['use_verification'] or c['id'] == 'write_verification'
        if expected_verification:
            if r['verification'] is None: raise ValueError('Missing verification metadata')
            parse_verification(r['verification'])
            if verification is None: verification = r['verification']
            exact(r['verification'], verification, 'Verification metadata drift')
        elif r['verification'] is not None: raise ValueError('Unexpected verification metadata')
        if r['graph'] is None: raise ValueError('Missing required graph')
        validate_graph(r['graph'])
        emitted = [s[len('ATLAS_OBSERVATION='):] for s in stdout.splitlines() if s.startswith('ATLAS_OBSERVATION=')]
        artifacts = []
        if r['observation'] is not None:
            fields(r['observation'], 'graph artifacts')
            exact(r['observation']['graph'], r['graph'], 'Graph/output discrepancy')
            if len(emitted) != 1: raise ValueError('Missing/extra observation marker')
            exact(parse_json(emitted[0]), r['observation'], 'Raw output discrepancy')
            artifacts = r['observation']['artifacts']
            if type(artifacts) is not list or not 1 <= len(artifacts) <= 2: raise ValueError('Artifact count')
            ids = []
            repo = repository(c)
            for a in artifacts:
                fields(a, 'module name bytes base64 sha256')
                if type(a['module']) is not str or not re.fullmatch(r'atlas\.synthetic:(core|addon):[12]\.[012]', a['module']): raise ValueError('Artifact identity')
                _, name, v = a['module'].split(':'); filename = f'{name}-{v}.jar'
                b = repo.get(f'atlas/synthetic/{name}/{v}/{filename}')
                if b is None: raise ValueError('Artifact absent from repository')
                exact(a, {'module': a['module'], 'name': filename, 'bytes': len(b), 'base64': base64.b64encode(b).decode(), 'sha256': digest(b)}, 'Artifact bytes do not match repository')
                ids.append(a['module'])
            if ids != sorted(set(ids)): raise ValueError('Artifact order/duplicates')
            if r['graph'] is None or sorted(x['id'] for x in r['graph']['components'] if x['id'] != 'root project :') != ids: raise ValueError('Graph/artifact component discrepancy')
            if not all(e['resolved'] for e in r['graph']['edges']): raise ValueError('Successful artifacts with unresolved edge')
        elif emitted: raise ValueError('Unexpected observation marker')
        success = r['returncode'] == 0
        if success != (r['observation'] is not None): raise ValueError('Result/exit discrepancy')
        if ('BUILD SUCCESSFUL' in stdout) != success or ('BUILD FAILED' in stderr) == success: raise ValueError('Build result marker')
        expected = c['expected']
        selected = [a['module'] for a in artifacts]
        wanted = sorted(['atlas.synthetic:core:' + expected['core']] + (['atlas.synthetic:addon:1.0'] if expected['addon'] else [])) if expected['success'] else []
        reasons = {x['id']: [a['cause'] for a in x['reasons']] for x in r['graph']['components']} if r['graph'] is not None else {}
        checks = {'graph_topology': graph_contract(c, r['graph']), 'exit': success == expected['success'], 'selected_modules': selected == wanted,
                  'reason': expected['reason'] is None or expected['reason'] in reasons.get('atlas.synthetic:core:' + str(expected['core']), []),
                  'diagnostic': expected['diagnostic'] is None or expected['diagnostic'] in stderr}
        if c['id'].startswith('verified_changed_'): checks['verification_failure'] = 'Dependency verification failed' in stderr
        observations.append({'id': c['id'], 'success': success, 'selected_modules': selected,
                             'artifact_hashes': {a['module']: a['sha256'] for a in artifacts}, 'checks': checks, 'matches_expected': all(checks.values())})
    return observations


def validate_receipt(doc):
    fields(doc, 'schema_version scope recorded_at inputs dependency environment runs observations all_expected')
    exact(doc['schema_version'], 1, 'Receipt schema');exact(doc['scope'], SCOPE, 'Receipt scope')
    if not re.fullmatch(r'\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ', text(doc['recorded_at'], 20)): raise ValueError('UTC recording time')
    dt.datetime.strptime(doc['recorded_at'], '%Y-%m-%dT%H:%M:%SZ')
    exact(doc['inputs'], identity(), 'Input identity');exact(doc['dependency'], dependency(), 'Distribution identity')
    e = doc['environment'];fields(e, 'python system machine gradle_version_output')
    for v in e.values(): text(v, 32768)
    if 'Gradle 9.2.1' not in e['gradle_version_output'] or dependency()['revision'] not in e['gradle_version_output']: raise ValueError('Observed Gradle identity')
    if 'Launcher JVM:' not in e['gradle_version_output']: raise ValueError('Missing JVM identity')
    observations = analyze(doc['runs'])
    exact(doc['observations'], observations, 'Derived findings discrepancy')
    exact(doc['all_expected'], all(x['matches_expected'] for x in observations), 'Summary discrepancy')
    return doc['all_expected']


def safe_path(name):
    if not isinstance(name, str) or len(name) > 256 or not name or '\\' in name or ':' in name or any(ord(c) < 32 for c in name): raise ValueError('Unsafe distribution path')
    p = PurePosixPath(name)
    if p.is_absolute() or '..' in p.parts or '.' in name.split('/') or '//' in name: raise ValueError('Unsafe distribution path')
    return p


def unpack_distribution(path, dest):
    d = dependency();b = bounded_read(path, d['bytes'])
    if len(b) != d['bytes'] or digest(b) != d['sha256']: raise ValueError('Distribution hash/size mismatch')
    with zipfile.ZipFile(io.BytesIO(b)) as z:
        rows = z.infolist();seen = set()
        if len(rows) > 10000 or sum(r.file_size for r in rows) > 500000000: raise ValueError('Distribution budget')
        for r in rows:
            p = safe_path(r.filename)
            if p.parts[0] != 'gradle-9.2.1' or r.filename in seen or stat.S_ISLNK(r.external_attr >> 16): raise ValueError('Unexpected distribution entry')
            seen.add(r.filename)
        z.extractall(dest)
    return dest / 'gradle-9.2.1/bin/gradle'


def run_process(cmd, cwd, env):
    r = subprocess.run(cmd, cwd=cwd, env=env, capture_output=True, text=True, timeout=180)
    if len(r.stdout) + len(r.stderr) > 131072: raise ValueError('Post-capture output budget')
    return r


def execute(distribution, output):
    if output.exists() or output.with_name(output.name + '.partial.json').exists(): raise ValueError('Output and partial output must not exist')
    input_snapshot = identity()
    runs = []; lock = verification = None
    with tempfile.TemporaryDirectory(prefix='atlas-dependency-') as tmp:
        temp = Path(tmp); gradle = unpack_distribution(distribution, temp / 'distribution')
        env = {k: v for k, v in os.environ.items() if k not in ['JAVA_OPTS', 'GRADLE_OPTS', 'JAVA_TOOL_OPTIONS', 'JDK_JAVA_OPTIONS']}
        env['GRADLE_OPTS'] = '-Dorg.gradle.daemon=false'; env['GRADLE_USER_HOME'] = str(temp / 'version-home')
        version = run_process(['bash', str(gradle), '--version'], temp, env)
        if version.returncode: raise ValueError('Gradle version execution failed')
        clean = lambda s, p: s.replace(str(p), '<run>').replace(str(temp), '<temp>')
        environment = {'python': platform.python_version(), 'system': platform.system(), 'machine': platform.machine(), 'gradle_version_output': clean(version.stdout + version.stderr, temp)}
        for c in fixtures()['cases']:
            p = temp / c['id']; p.mkdir()
            for name in ['build.gradle', 'settings.gradle']: (p / name).write_bytes(bounded_read(ROOT / name))
            for path, b in repository(c).items():
                target = p / 'repo' / path; target.parent.mkdir(parents=True, exist_ok=True); target.write_bytes(b)
            if c['use_lock']:
                if lock is None: raise ValueError('Missing generated lock')
                (p / 'gradle.lockfile').write_text(lock)
            if c['use_verification']:
                if verification is None: raise ValueError('Missing generated verification')
                (p / 'gradle').mkdir(); (p / 'gradle/verification-metadata.xml').write_text(verification)
            env['GRADLE_USER_HOME'] = str(p / 'home')
            command = ['gradle', *FLAGS, '-Pmode=' + c['mode'], *c['extra_flags'], *(['-PlegacyOnly=true'] if c['legacy_only'] else []), 'observe']
            r = run_process(['bash', str(gradle), *command[1:]], p, env)
            def read_optional(name, json_value=False):
                f = p / name
                if not f.exists(): return None
                s = clean(bounded_read(f, 131072).decode(), p)
                return parse_json(s) if json_value else s
            row = {'id': c['id'], 'command': command, 'returncode': r.returncode,
                   'stdout': clean(r.stdout, p), 'stderr': clean(r.stderr, p), 'repository': inventory(c),
                   'graph': read_optional('graph.json', True), 'observation': read_optional('observation.json', True),
                   'lock': read_optional('gradle.lockfile'), 'verification': read_optional('gradle/verification-metadata.xml')}
            runs.append(row)
            # Always retain the completed prefix before validation; failed probes are evidence too.
            output.with_name(output.name + '.partial.json').write_text(json.dumps({'scope': 'Incomplete run prefix, not accepted receipt.', 'runs': runs}, indent=2) + '\n')
            if c['id'] == 'write_lock': lock = row['lock']
            if c['id'] == 'write_verification': verification = row['verification']
            print(c['id'], 'exit', r.returncode, flush=True)
        observations = analyze(runs)
        assert_unchanged(input_snapshot)
        receipt = {'schema_version': 1, 'scope': SCOPE, 'recorded_at': dt.datetime.now(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'inputs': input_snapshot, 'dependency': dependency(), 'environment': environment, 'runs': runs, 'observations': observations, 'all_expected': all(x['matches_expected'] for x in observations)}
        validate_receipt(receipt)
        with output.open('x') as f: f.write(json.dumps(receipt, indent=2) + '\n')
        return receipt['all_expected']


def main():
    p = argparse.ArgumentParser();p.add_argument('--verify-receipt', type=Path);p.add_argument('--distribution', type=Path);p.add_argument('--output', type=Path);a = p.parse_args()
    if a.verify_receipt and not a.distribution and not a.output: ok = validate_receipt(read_json(a.verify_receipt))
    elif a.distribution and a.output and not a.verify_receipt: ok = execute(a.distribution, a.output)
    else: p.error('Use --verify-receipt or both --distribution and --output')
    print('All declared outcomes match:', ok)
    return 0 if ok else 1


if __name__ == '__main__':
    try: sys.exit(main())
    except (ValueError, KeyError, TypeError, OSError, ET.ParseError, subprocess.SubprocessError) as e:
        print('Evidence rejected:', e, file=sys.stderr);sys.exit(2)
