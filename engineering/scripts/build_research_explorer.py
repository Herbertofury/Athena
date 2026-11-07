#!/usr/bin/env python3
"""Validate and build a deterministic static research explorer. No network access."""
from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import math
import re
import statistics
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
import importlib.util
_registry_spec = importlib.util.spec_from_file_location('atlas_source_registry', Path(__file__).with_name('source_registry.py'))
_registry_module = importlib.util.module_from_spec(_registry_spec)
_registry_spec.loader.exec_module(_registry_module)
load_sources = _registry_module.load_sources

KINDS = {'repository', 'paper', 'method', 'benchmark', 'platform', 'language', 'framework', 'tool'}
ID = re.compile(r'[a-z0-9]+(?:-[a-z0-9]+)*\Z')
REPO = re.compile(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\Z')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def clean_url(value):
    require(isinstance(value, str), 'URL must be text')
    u = urlsplit(value)
    require(u.scheme == 'https' and u.hostname and not u.username and not u.password,
            'Clean HTTPS URL required: ' + value)
    require(not any(ord(c) < 32 for c in value), 'Control characters in URL')


def date(value, today):
    parsed = dt.date.fromisoformat(value)
    require(parsed <= today, 'Future evidence date: ' + value)
    return parsed


def timestamp(value, today):
    require(isinstance(value, str), 'Timestamp must be text')
    parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    require(parsed.tzinfo is not None, 'Timestamp must have an explicit timezone')
    require(parsed.astimezone(dt.timezone.utc).date() <= today, 'Future observation timestamp')


def text_fields(row, keys, context):
    for key in keys:
        require(isinstance(row.get(key), str) and row[key].strip(), context + ': missing ' + key)


def validate_catalog(catalog, registry, today=None):
    today = today or dt.datetime.now(dt.timezone.utc).date()
    require(type(catalog.get('schema_version')) is int and catalog['schema_version'] == 1, 'Unsupported catalog schema')
    date(catalog['snapshot_date'], today)
    require(catalog['snapshot_timezone'] == 'America/Denver', 'Snapshot timezone must be explicit')
    categories = {c['id'] for c in catalog['categories']}
    tracks = {t['id'] for t in catalog['tracks']}
    require(len(categories) == len(catalog['categories']), 'Duplicate category')
    require(len(tracks) == len(catalog['tracks']), 'Duplicate track')
    layers = catalog.get('layers', [])
    require(isinstance(layers, list), 'Stack layers must be a list')
    if 'layers' in catalog:
        require(bool(layers), 'Stack layer taxonomy cannot be empty')
    layer_ids = set()
    for layer in layers:
        require(isinstance(layer, dict), 'Stack layer must be an object')
        text_fields(layer, ['id', 'label', 'decision', 'gate'], 'Stack layer')
        require(ID.fullmatch(layer['id']) and layer['id'] not in layer_ids, 'Invalid or duplicate stack layer')
        layer_ids.add(layer['id'])
        selected = []
        for role in ('baseline_ids', 'challenger_ids', 'watch_ids'):
            require(isinstance(layer.get(role), list) and all(isinstance(x, str) for x in layer[role]),
                    'Invalid stack layer comparison role')
            selected += layer[role]
        require(bool(layer['baseline_ids']), 'Stack layer needs a reference choice')
        require(len(selected) == len(set(selected)), 'Candidate has conflicting stack layer roles')
    sources = {s['id']: s for s in registry}
    ids = set()
    require(isinstance(catalog['entries'], list) and catalog['entries'], 'Catalog must contain entries')
    for e in catalog['entries']:
        text_fields(e, ['id', 'name', 'summary', 'priority_reason'], 'Entry')
        require(ID.fullmatch(e['id']) and e['id'] not in ids, 'Invalid or duplicate entry ID: ' + e['id'])
        ids.add(e['id'])
        require(e['kind'] in KINDS, 'Invalid entry kind: ' + e['id'])
        if 'publication_year' in e:
            require(e['kind'] == 'paper' and type(e['publication_year']) is int and
                    1900 <= e['publication_year'] <= today.year, 'Invalid year-only paper publication')
        require(e['category'] in categories, 'Unknown category: ' + e['id'])
        if layers or 'layers' in e:
            assigned = e.get('layers')
            require(isinstance(assigned, list) and assigned and all(isinstance(x, str) for x in assigned),
                    'Missing stack layer assignment: ' + e['id'])
            require(len(assigned) == len(set(assigned)) and set(assigned) <= layer_ids,
                    'Unknown or duplicate stack layer: ' + e['id'])
        require(e['status'] == 'candidate', 'Source review does not promote a candidate to accepted')
        require(e['maturity'] in {'established', 'emerging', 'experimental'}, 'Invalid maturity')
        require(type(e['priority']) is int and e['priority'] in {1, 2, 3}, 'Invalid editorial priority')
        clean_url(e['url'])
        if e.get('paper_url'):
            clean_url(e['paper_url'])
        require(e.get('repo') is None or REPO.fullmatch(e['repo']), 'Invalid GitHub repository identifier')
        require(isinstance(e['tags'], list) and all(isinstance(t, str) and t for t in e['tags']), 'Invalid tags')
        require(e['source_ids'] and len(set(e['source_ids'])) == len(e['source_ids']), 'Missing or duplicate source IDs')
        require(len(e['sources']) == len(e['source_ids']), 'Source IDs and detail count differ')
        for source_id, source in zip(e['source_ids'], e['sources']):
            require(source_id in sources, 'Unregistered source: ' + source_id)
            clean_url(source['url'])
            require(source['url'] == sources[source_id]['url'], 'Catalog/source register URL mismatch: ' + source_id)
            text_fields(source, ['title', 'note'], e['id'])
            checked = date(source['checked_at'], today)
            if source.get('published_at'):
                published = date(source['published_at'], today)
                require(published <= checked, 'Publication after source check')
        evaluation = e['evaluation']
        require(evaluation['track'] in tracks, 'Unknown evaluation track: ' + e['id'])
        text_fields(evaluation, ['proposal'], e['id'])
        for key in ('metrics', 'caveats'):
            require(isinstance(evaluation[key], list) and evaluation[key] and
                    all(isinstance(x, str) and x.strip() for x in evaluation[key]), 'Missing ' + key + ': ' + e['id'])
    entries = {e['id']: e for e in catalog['entries']}
    for layer in layers:
        for role in ('baseline_ids', 'challenger_ids', 'watch_ids'):
            for candidate in layer[role]:
                require(candidate in entries, 'Unknown stack layer choice: ' + candidate)
                require(layer['id'] in entries[candidate].get('layers', []), 'Stack layer choice outside assigned layer')
    return ids


def validate_results(results, candidate_tracks, today=None):
    today = today or dt.datetime.now(dt.timezone.utc).date()
    require(type(results.get('schema_version')) is int and results['schema_version'] == 1, 'Unsupported results schema')
    cohorts = {}
    for c in results['cohorts']:
        text_fields(c, ['id', 'label', 'metric', 'unit', 'description', 'protocol'], 'Cohort')
        require(ID.fullmatch(c['id']) and c['id'] not in cohorts, 'Invalid/duplicate cohort')
        require(c['evidence'] in {'atlas_measured', 'external_reported'}, 'Invalid evidence lane')
        require(c['direction'] in {'higher', 'lower'}, 'Unknown metric direction')
        require(c.get('track') in set(candidate_tracks.values()), 'Unknown cohort track')
        require(isinstance(c['caveats'], list) and c['caveats'] and all(isinstance(x, str) and x.strip() for x in c['caveats']), 'Cohort caveats required')
        clean_url(c['source_url'])
        date(c['observed_at'], today)
        cohorts[c['id']] = c
    seen = set()
    for o in results['observations']:
        require(o['candidate_id'] in candidate_tracks, 'Unknown measured candidate')
        require(o['cohort_id'] in cohorts, 'Unknown cohort')
        require(candidate_tracks[o['candidate_id']] == cohorts[o['cohort_id']]['track'], 'Candidate outside cohort track')
        require(o.get('evidence', cohorts[o['cohort_id']]['evidence']) == cohorts[o['cohort_id']]['evidence'], 'Observation evidence differs from cohort')
        key = (o['candidate_id'], o['cohort_id'])
        require(key not in seen, 'Multiple configurations require separate candidate/cohort identities')
        seen.add(key)
        require(type(o['value']) in {float, int} and math.isfinite(o['value']), 'Invalid measurement')
        text_fields(o, ['subject', 'note'], 'Observation')
        clean_url(o['source_url'])
        date(o['observed_at'], today)
        if cohorts[o['cohort_id']]['evidence'] == 'atlas_measured':
            require(type(o.get('sample_count')) is int and o['sample_count'] >= 5, 'Local evidence must retain repeated samples')
            require(re.fullmatch(r'[a-f0-9]{64}', o.get('raw_sha256', '')), 'Local evidence hash required')
            require(re.fullmatch(r'[a-f0-9]{64}', o.get('workload_sha256', '')), 'Workload hash required')
    return cohorts


def validate_test_plans(registry, catalog, today=None):
    """Validate proposals without turning them into measured cohorts or results."""
    today = today or dt.datetime.now(dt.timezone.utc).date()
    require(isinstance(registry, dict), 'Test-plan registry must be an object')
    require(type(registry.get('schema_version')) is int and registry['schema_version'] == 1,
            'Unsupported test-plan schema')
    require(set(registry) == {'schema_version', 'reviewed_at', 'description', 'plans'},
            'Unexpected or missing test-plan registry field')
    text_fields(registry, ['reviewed_at', 'description'], 'Test-plan registry')
    date(registry['reviewed_at'], today)
    require(isinstance(registry['plans'], list) and registry['plans'], 'Test-plan registry must contain plans')
    candidate_ids = {entry['id'] for entry in catalog['entries']}
    layer_ids = {layer['id'] for layer in catalog.get('layers', [])}
    fields = {'id', 'title', 'priority', 'status', 'decision', 'layer_ids', 'candidate_ids',
              'controls', 'gates', 'metrics', 'protocol'}
    seen = set()
    for plan in registry['plans']:
        require(isinstance(plan, dict), 'Test plan must be an object')
        require(set(plan) == fields, 'Unexpected or missing test-plan field')
        text_fields(plan, ['id', 'title', 'decision'], 'Test plan')
        require(ID.fullmatch(plan['id']) and plan['id'].startswith('planned-') and plan['id'] not in seen,
                'Invalid or duplicate test-plan ID')
        seen.add(plan['id'])
        require(plan['status'] == 'planned', 'Test plans cannot claim execution, acceptance or ranking')
        require(type(plan['priority']) is int and plan['priority'] in {1, 2, 3}, 'Invalid test-plan priority')
        for key in ('layer_ids', 'candidate_ids', 'controls', 'gates', 'metrics', 'protocol'):
            values = plan[key]
            require(isinstance(values, list) and values and
                    all(isinstance(value, str) and value.strip() for value in values),
                    'Missing or invalid test-plan ' + key)
            require(len(values) == len(set(values)), 'Duplicate test-plan ' + key)
        require(set(plan['candidate_ids']) <= candidate_ids, 'Unknown test-plan candidate')
        require(set(plan['layer_ids']) <= layer_ids, 'Unknown test-plan layer')
    return seen


def validate_signals(signals, community, catalog, today=None):
    today = today or dt.datetime.now(dt.timezone.utc).date()
    require(type(signals.get('schema_version')) is int and type(community.get('schema_version')) is int and
            signals['schema_version'] == community['schema_version'] == 1, 'Unsupported signal schema')
    require(isinstance(signals['errors'], list), 'Refresh errors must be retained')
    require(isinstance(community.get('errors'), list), 'Community errors must be retained')
    for snapshot in (signals, community):
        for key in ('last_attempted_at', 'last_completed_at'):
            if snapshot.get(key) is not None:
                timestamp(snapshot[key], today)
    repos = {e['repo'].lower() for e in catalog['entries'] if e.get('repo')}
    for name, s in signals['repositories'].items():
        require(name in repos and name == name.lower(), 'Unknown signal repository: ' + name)
        for metric in ('stars', 'forks'):
            require(type(s[metric]) is int and s[metric] >= 0, 'Invalid popularity count')
        require(type(s['archived']) is bool, 'Missing archive state')
        timestamp(s['observed_at'], today)
        clean_url(s['url'])
    entries = {e['id']: e for e in catalog['entries']}
    seen = set()
    for r in community['ratings']:
        require(r['candidate_id'] in entries, 'Unknown rated candidate')
        require(r['track'] == entries[r['candidate_id']]['evaluation']['track'], 'Rating outside candidate track')
        require(type(r['score']) is int and 1 <= r['score'] <= 5, 'Rating must be integer 1–5')
        require(type(r['author_id']) is int and r['author_id'] > 0, 'Stable public account ID required')
        text_fields(r, ['author', 'experience', 'version'], 'Rating')
        require(r.get('review_state') == 'approved', 'Unreviewed ratings cannot be aggregated')
        require(re.fullmatch(r'https://github.com/Herbertofury/Engineering-Atlas/issues/[1-9][0-9]*', r['issue_url']), 'Rating must refer to this repository')
        timestamp(r['updated_at'], today)
        key = (r['author_id'], r['candidate_id'], r['track'])
        require(key not in seen, 'Duplicate account/candidate/track vote')
        seen.add(key)


def import_retained_json_lab(root, ids):
    """Derive all 27 existing results from retained raw samples, never hand-copied scores."""
    path = root / 'experiments/json-lab/results-2026-10-26.json'
    raw = path.read_bytes()
    retained_sha256 = '73215a334a00ea773a8d03ddd18079fb2b873addec24f1a5df1f9a04473e1ed5'
    require(hashlib.sha256(raw).hexdigest() == retained_sha256,
            'Retained JSON evidence changed; review its immutable source revision and importer before publication')
    data = json.loads(raw)
    require(data['evidence'] == 'measured_local_generated_workload', 'Unexpected JSON lab provenance')
    mapping = {'stdlib': 'python-stdlib-json', 'orjson': 'orjson', 'ujson': 'ultrajson'}
    require(set(mapping.values()) <= ids, 'Local JSON candidates missing')
    sha = hashlib.sha256(raw).hexdigest()
    revision = '4ed47c5c324231d65b81c3c846bd8fa3f880bee8'
    base = 'https://github.com/Herbertofury/Engineering-Atlas/blob/' + revision + '/experiments/json-lab/'
    cohorts, observations = [], []
    workloads = sorted(data['workloads'], key=lambda x: (x != 'catalog_2000', x))
    for workload in workloads:
        record = data['workloads'][workload]
        operations = sorted(record['operations'], key=lambda x: (x != 'decode_encode_utf8', x))
        for operation in operations:
            op = record['operations'][operation]
            cohort = 'json-' + workload.replace('_', '-') + '-' + operation.replace('_', '-')
            cohorts.append({'id': cohort, 'label': 'Python JSON · ' + workload + ' · ' + operation,
                'track': 'json-serialization',
                'metric': 'median_elapsed_ms', 'unit': 'ms', 'direction': 'lower', 'evidence': 'atlas_measured',
                'protocol': 'CPython 3.12.14 / Linux x86_64 / 15 randomized rounds / 30 iterations / warmed in process',
                'description': 'Retained Atlas run from 26 Oct 2026; generated ' + workload + ' workload; ' + operation + '.',
                'source_url': base + 'README.md', 'observed_at': data['date'],
                'caveats': ['Warmed generated inputs on one shared Linux host; not a new run or application acceptance.',
                    'No cold startup, memory or confidence interval claim. Required numeric and duplicate-key semantics can disqualify a faster parser.']})
            for library, values in op['libraries'].items():
                samples = values['samples_ms']
                require(len(samples) == data['protocol']['rounds'], 'Incomplete retained JSON lab samples')
                require(all(type(x) in {int, float} and math.isfinite(x) and x > 0 for x in samples), 'Invalid retained sample')
                median = statistics.median(samples)
                require(math.isclose(median, values['median_ms'], rel_tol=1e-12), 'Raw median mismatch')
                version = data['environment']['versions'].get(library, data['environment']['python'])
                observations.append({'candidate_id': mapping[library], 'cohort_id': cohort, 'value': median,
                    'subject': library + ' ' + version, 'observed_at': data['date'], 'source_url': base + path.name,
                    'sample_count': len(samples), 'raw_sha256': sha, 'workload_sha256': record['input_sha256'],
                    'note': 'Imported from retained raw measurements. All three defaults collapse duplicate keys; orjson rounds the recorded integer above u64. Review all adversarial cases before adoption.'})
    return cohorts, observations


def load_bundle(root=ROOT):
    read = lambda name: json.loads((root / name).read_text())
    catalog = read('data/research-catalog.json')
    registry = load_sources(root)
    ids = validate_catalog(catalog, registry)
    results = read('data/research-results.json')
    # Imported evidence is generated from its original source file at build time.
    local_cohorts, local_observations = import_retained_json_lab(root, ids)
    results['cohorts'] += local_cohorts
    results['observations'] += local_observations
    validate_results(results, {e['id']: e['evaluation']['track'] for e in catalog['entries']})
    signals = read('data/research-signals.json')
    community = read('data/research-community.json')
    validate_signals(signals, community, catalog)
    plans_path = root / 'data/research-test-plans.json'
    if plans_path.exists():
        test_plans = read('data/research-test-plans.json')
        validate_test_plans(test_plans, catalog)
    else:
        test_plans = {'plans': [], 'reviewed_at': None}
    return {**catalog, 'results': results, 'signals': signals, 'community': community,
            'test_plans': test_plans['plans'], 'test_plans_reviewed_at': test_plans['reviewed_at']}


def markdown_catalog(bundle):
    text = ['# Research catalog', '', '**Snapshot: ' + bundle['snapshot_date'] + ' (' + bundle['snapshot_timezone'] + ').** Source checks use UTC dates.', '',
        '[Interactive Explorer](https://herbertofury.github.io/Engineering-Atlas/explorer/) · [Ranking methodology](research-explorer.md) · [Test queue](research-test-queue.md)', '',
        'Every entry below is a research candidate. Priority is an editorial test queue, not a performance score. Existing local measurements are exposed separately by exact cohort. No universal winner is implied.', '']
    for category in bundle['categories']:
        entries = sorted([e for e in bundle['entries'] if e['category'] == category['id']], key=lambda e: (e['priority'], e['name']))
        text += ['## ' + category['label'] + ' (' + str(len(entries)) + ')', '']
        for e in entries:
            text += ['### ' + e['name'], '', '**' + e['kind'] + ' · ' + e['maturity'] + ' · P' + str(e['priority']) + '** · ID: ' + e['id'], '',
                e['summary'], '',
                '**Stack layers:** ' + ('; '.join(next(layer['label'] for layer in bundle.get('layers', []) if layer['id'] == layer_id)
                                                for layer_id in e.get('layers', [])) or 'Not assigned in this legacy catalog') + '.', '',
                '**Current signal:** ' + (e.get('latest_signal') or 'See the dated primary sources.'), '',
                '**Test:** ' + e['evaluation']['proposal'], '', '**Measure:** ' + '; '.join(e['evaluation']['metrics']) + '.', '',
                '**Constraints:** ' + ' '.join(e['evaluation']['caveats']), '',
                '**Priority rationale:** ' + e['priority_reason'], '',
                '**Sources:** ' + ' · '.join('[' + sid + '](' + s['url'] + ')' for sid, s in zip(e['source_ids'], e['sources'])), '']
    return '\n'.join(text).rstrip() + '\n'


def markdown_layer_map(bundle):
    """One canonical decision map shared by the explorer and the existing stack guide."""
    entries = {e['id']: e for e in bundle['entries']}
    def choices(ids):
        return ', '.join('[' + entries[id]['name'] + '](' + entries[id]['url'] + ')' for id in ids) or 'None in this review'
    lines = ['## Stack layer comparison map', '',
        'Updated from the same catalog data as the Explorer. Reference choices establish a comparison baseline; challengers and watchlist entries require the stated adoption gate. A layer can contain complementary components: compare only the same functional role and workload, and treat adding a component separately from replacing one. These roles do not claim measured superiority. Every choice links to an upstream project; full sources and constraints are in the catalog.', '',
        '| Stack layer | Reference choices | Compare next | Research watchlist | Decision and adoption gate |',
        '|---|---|---|---|---|']
    for layer in bundle.get('layers', []):
        row = ['[' + layer['label'] + '](https://herbertofury.github.io/Engineering-Atlas/explorer/?layer=' + layer['id'] + '#catalog)',
               choices(layer['baseline_ids']), choices(layer['challenger_ids']), choices(layer['watch_ids']),
               layer['decision'] + ' **Gate:** ' + layer['gate']]
        lines.append('| ' + ' | '.join(cell.replace('|', '\\|').replace('\n', ' ') for cell in row) + ' |')
    return '\n'.join(lines) + '\n'


def markdown_test_plan_directory(bundle):
    """Keep the existing queue and the Explorer linked to one proposal registry."""
    layers = {layer['id']: layer['label'] for layer in bundle.get('layers', [])}
    lines = ['## Planned comparison directory', '',
        'Generated from the same [test-plan registry](../data/research-test-plans.json) used by the Explorer. '
        'Every row is planned, not a result. Priority orders research work; it does not rank the candidates. '
        'Open a plan to filter its candidates, inspect controls and gates, or export the proposal. '
        'Candidate counts include complementary components and separate follow-on lanes, not only interchangeable alternatives.', '',
        '| Planned comparison | Priority | Stack layers | Candidates |',
        '|---|---|---|---|']
    for plan in bundle.get('test_plans', []):
        row = ['[' + plan['title'] + '](https://herbertofury.github.io/Engineering-Atlas/explorer/?plan=' + plan['id'] + '#catalog)',
               'P' + str(plan['priority']), '; '.join(layers[layer_id] for layer_id in plan['layer_ids']),
               str(len(plan['candidate_ids']))]
        lines.append('| ' + ' | '.join(cell.replace('|', '\\|').replace('\n', ' ') for cell in row) + ' |')
    return '\n'.join(lines) + '\n'


def build(root=ROOT, check=False):
    bundle = load_bundle(root)
    destination = root / 'docs/explorer'
    outputs = {}
    def asset(stem, ext, content):
        data = content.encode() if isinstance(content, str) else content
        digest = hashlib.sha256(data).hexdigest()
        name = stem + '.' + digest[:16] + '.' + ext
        outputs[destination / name] = data
        return name
    catalog_name = asset('catalog', 'json', json.dumps(bundle, ensure_ascii=False, sort_keys=True, separators=(',', ':')) + '\n')
    core = asset('explorer-core', 'mjs', (destination / 'explorer-core.mjs').read_bytes())
    script = asset('explorer', 'mjs', (destination / 'explorer.mjs').read_text().replace('__CORE__', core))
    style = asset('explorer', 'css', (destination / 'explorer.css').read_bytes())
    html = (destination / 'index.template.html').read_text()
    for token, value in {'__CATALOG__': catalog_name, '__SCRIPT__': script, '__STYLE__': style}.items():
        html = html.replace(token, value)
    require('__CATALOG__' not in html and '__SCRIPT__' not in html, 'Unresolved template')
    outputs[destination / 'index.html'] = html.encode()
    outputs[root / 'docs/research-catalog.md'] = markdown_catalog(bundle).encode()
    stack_path = root / 'docs/stack-selection.md'
    if bundle.get('layers') or stack_path.exists():
        stack_text = stack_path.read_text()
        start, end = '<!-- stack-layer-map:start -->', '<!-- stack-layer-map:end -->'
        if bundle.get('layers') or start in stack_text or end in stack_text:
            require(stack_text.count(start) == stack_text.count(end) == 1 and stack_text.index(start) < stack_text.index(end),
                    'Existing stack guide must contain one ordered layer-map marker pair')
            prefix, rest = stack_text.split(start)
            _, suffix = rest.split(end)
            generated = '\n\n' + markdown_layer_map(bundle) + '\n' if bundle.get('layers') else '\n'
            outputs[stack_path] = (prefix + start + generated + end + suffix).encode()
    queue_path = root / 'docs/research-test-queue.md'
    if bundle.get('test_plans') or queue_path.exists():
        require(queue_path.exists(), 'Test-plan registry requires the existing test queue')
        queue_text = queue_path.read_text()
        start, end = '<!-- test-plan-directory:start -->', '<!-- test-plan-directory:end -->'
        if bundle.get('test_plans') or start in queue_text or end in queue_text:
            require(queue_text.count(start) == queue_text.count(end) == 1 and queue_text.index(start) < queue_text.index(end),
                    'Existing test queue must contain one ordered test-plan directory marker pair')
            prefix, rest = queue_text.split(start)
            _, suffix = rest.split(end)
            generated = '\n\n' + markdown_test_plan_directory(bundle) + '\n' if bundle.get('test_plans') else '\n'
            outputs[queue_path] = (prefix + start + generated + end + suffix).encode()
    manifest = {'schema_version': 1, 'files': {str(path.relative_to(root)): hashlib.sha256(data).hexdigest() for path, data in outputs.items()},
        'entries': len(bundle['entries']), 'test_plans': len(bundle.get('test_plans', [])),
        'cohorts': len(bundle['results']['cohorts']), 'observations': len(bundle['results']['observations'])}
    outputs[destination / 'build-manifest.json'] = (json.dumps(manifest, indent=2, sort_keys=True) + '\n').encode()
    errors = []
    for path, data in outputs.items():
        if check:
            if not path.exists() or path.read_bytes() != data:
                errors.append(str(path.relative_to(root)))
        else:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(data)
    require(not errors, 'Generated explorer files are stale: ' + ', '.join(errors))
    return {'entries': len(bundle['entries']), 'sources': len({s for e in bundle['entries'] for s in e['source_ids']}),
        'cohorts': len(bundle['results']['cohorts']), 'observations': len(bundle['results']['observations']),
        'test_plans': len(bundle.get('test_plans', [])),
        'community_reports': len(bundle['community']['ratings']), 'mode': 'check' if check else 'build'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Fail if generated outputs differ; do not write')
    args = parser.parse_args()
    try:
        print(json.dumps(build(check=args.check), indent=2))
    except (ValueError, KeyError, TypeError) as error:
        parser.exit(1, str(error) + '\n')
