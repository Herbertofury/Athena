"""A source-routing qualification gate, not an embedding or similarity scorer."""
from pathlib import Path
from urllib.parse import urlsplit
from collections import Counter
import argparse
import hashlib
import json
import re
from score import parse, exact, read_bounded

HERE = Path(__file__).resolve().parent
HOSTS = {'x.com', 'www.x.com', 'twitter.com', 'www.twitter.com', 'mobile.twitter.com'}
POST = re.compile(r'/(?:[a-z0-9_]{1,15}/status|i/web/status)/([1-9][0-9]{7,24})(?:/(?:photo|video)/[1-9][0-9]{0,2})?/?\Z', re.I | re.ASCII)


def post_id(value):
    if not isinstance(value, str) or len(value) > 2048:
        return None
    try:
        url = urlsplit(value)
        if url.scheme != 'https' or url.hostname not in HOSTS or url.username is not None or url.password is not None or url.port not in (443, None):
            return None
    except ValueError:
        return None
    result = POST.fullmatch(url.path)
    return result.group(1) if result else None


def evaluate(raw, candidate):
    fixture = parse(raw)
    exact(fixture, ('schema','provider','source_commit','entries','cases'))
    if fixture['schema'] != 'athena-review-exact-source-v1' or fixture['provider'] != 'x':
        raise ValueError('Unsupported source fixture')
    digest = hashlib.sha256(raw.replace(b'\r\n', b'\n')).hexdigest()
    exact(candidate, ('schema','fixture_sha256','candidate','source_commit','cases'))
    if candidate['schema'] != 'athena-source-route-receipt-v1' or candidate['fixture_sha256'] != digest or candidate['source_commit'] != fixture['source_commit']:
        raise ValueError('Mismatch between fixture, reviewed source and candidate')
    records = {}
    for record in fixture['entries']:
        exact(record, ('id','title','source'))
        if record['id'] in records or post_id(record['source']) is None:
            raise ValueError('Invalid source identity')
        records[record['id']] = record
    expected, reported = {}, {}
    for row in fixture['cases']:
        exact(row, ('id','query','mode','expect'))
        if row['id'] in expected or row['mode'] not in ('exact','text'):
            raise ValueError('Invalid route case')
        pid = post_id(row['query'])
        if (pid is not None) != (row['mode'] == 'exact'):
            raise ValueError('Conflicting query classification')
        expected_ids = [r['id'] for r in records.values() if post_id(r['source']) == pid] if pid else None
        if (row['expect'] is not None and row['expect'] not in records) or (pid is not None and expected_ids != ([row['expect']] if row['expect'] else [])):
            raise ValueError('Invalid expected route')
        expected[row['id']] = row
    for row in candidate['cases']:
        exact(row, ('id','mode','rows'))
        if row['id'] in reported or not isinstance(row['rows'], list) or len(row['rows']) > 100:
            raise ValueError('Invalid candidate case')
        reported[row['id']] = row
    if expected.keys() != reported.keys():
        raise ValueError('Missing or unexpected route case')
    counts = Counter()
    failures = []
    for ident, ref in expected.items():
        seen = reported[ident]
        want = [records[ref['expect']]] if ref['expect'] else []
        category = 'exact_hit' if want and ref['mode'] == 'exact' else 'exact_abstention' if not want else 'descriptive_hit'
        counts[category+'_total'] += 1
        if seen['mode'] == ref['mode'] and seen['rows'] == want:
            counts[category+'_passed'] += 1
        else:
            failures.append(ident)
    return {'candidate':candidate['candidate'],'fixture_sha256':digest,'source_commit':fixture['source_commit'],
            'counts':dict(sorted(counts.items())),'failed_cases':failures,'passed':not failures,
            'scope':'exact route abstention and descriptive provenance only; no embeddings, general ranking, speed or deployment evidence'}


def main():
    p = argparse.ArgumentParser()
    p.add_argument('receipt', type=Path)
    args = p.parse_args()
    score = evaluate(read_bounded(HERE/'source-routing-fixture.json'), parse(read_bounded(args.receipt)))
    print(json.dumps(score, indent=2, ensure_ascii=False))
    return 0 if score['passed'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
