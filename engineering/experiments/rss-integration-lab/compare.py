#!/usr/bin/env python3
"""Compare supplied retained RSS bytes offline. Emits no provider prose.

The caller supplies two extractor files and the exact expected input digest.
The candidate must equal baseline after removing only the integrated RSS title
and publication-date projections. Source titles/dates are checked independently.
No input file or source module is changed, and socket activity is prohibited.
"""
import argparse
import copy
import email.utils
import hashlib
import importlib.util
import json
from pathlib import Path
import sys
from datetime import timezone


def audit(event, args):
    if event.startswith('socket.'):
        raise RuntimeError('Offline comparison prohibits socket access')


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def compare(baseline_path, candidate_path, response_path, expected_sha256, origin):
    raw = response_path.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != expected_sha256:
        raise ValueError('Input digest mismatch')
    baseline = load(baseline_path, 'rss_integration_before')
    candidate = load(candidate_path, 'rss_integration_after')
    before = baseline.extract('rss', {'feed': raw}, origin)
    after = candidate.extract('rss', {'feed': raw}, origin)
    xml = candidate.etree.fromstring(raw, candidate.etree.XMLParser(resolve_entities=False, load_dtd=False, no_network=True))
    items = xml.findall('./channel/item')
    if len(before) != len(after) or len(after) != len(items):
        raise ValueError('Record count differs')
    old_shape = copy.deepcopy(after)
    dates, titles, normalized = 0, 0, 0
    for prior, current, legacy, item in zip(before, after, old_shape, items):
        if 'title' in prior['identity'] or 'publicationDate' in prior:
            raise ValueError('Baseline already has integrated fields')
        if current['identity']['title'] != item.findtext('title'):
            raise ValueError('Title projection differs from source')
        titles += item.find('title') is not None
        dates += bool(item.findall('pubDate'))
        if current['publicationDate']['raw'] != [''.join(n.itertext()) for n in item.findall('pubDate')]:
            raise ValueError('Date projection differs from source')
        if current['publicationDate']['state'] == 'valid':
            independent = email.utils.parsedate_to_datetime(current['publicationDate']['raw'][0].strip())
            if independent.tzinfo is None:
                # RFC -0000 is UTC with unknown source timezone, not local time.
                if current['publicationDate']['sourceTimezoneKnown'] is not False:
                    raise ValueError('Independent date has no timezone')
                independent = independent.replace(tzinfo=timezone.utc)
            instant = independent.astimezone(timezone.utc).isoformat().replace('+00:00','Z')
            if instant != current['publicationDate']['utc']:
                raise ValueError('Independent UTC conversion differs')
            normalized += 1
        projection = candidate.receipt(current)['publicationDate']
        if set(projection) != {'source','state','utc','sourceTimezoneKnown'}:
            raise ValueError('Date receipt contains unexpected fields')
        del legacy['identity']['title']; del legacy['publicationDate']
    if old_shape != before:
        raise ValueError('Preexisting normalized fields differ')
    before_receipt = baseline.receipt(before)
    after_receipt = copy.deepcopy(candidate.receipt(after))
    for record in after_receipt:
        del record['identity']['title']; del record['publicationDate']
    if before_receipt != after_receipt:
        raise ValueError('Preexisting receipt fields differ')
    return {
        'classification': 'retained exact-byte offline integration replay',
        'networkUsed': False, 'inputBytes': len(raw), 'inputSha256': digest,
        'baselineSha256': hashlib.sha256(baseline_path.read_bytes()).hexdigest(),
        'candidateSha256': hashlib.sha256(candidate_path.read_bytes()).hexdigest(),
        'records': len(after), 'titlesPreserved': titles, 'datesPreserved': dates,
        'datesIndependentlyNormalized': normalized,
        'allPreexistingNormalizedFieldsEqual': True, 'allPreexistingReceiptFieldsEqual': True,
        'rawDateExcludedFromReceipt': True,
        'limits': ['No new provider request or freshness claim.',
                   'No complete history, media access, runtime integration or target acceptance.'],
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--baseline', type=Path, required=True)
    parser.add_argument('--candidate', type=Path, required=True)
    parser.add_argument('--response', type=Path, required=True)
    parser.add_argument('--expected-sha256', required=True)
    parser.add_argument('--origin', required=True)
    args = parser.parse_args()
    sys.addaudithook(audit)
    print(json.dumps(compare(args.baseline, args.candidate, args.response, args.expected_sha256, args.origin), indent=2))


if __name__ == '__main__':
    main()
