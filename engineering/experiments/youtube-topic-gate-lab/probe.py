#!/usr/bin/env python3
"""Offline, sanitized replay of supplied bytes; never fetches a feed."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--response', required=True, type=Path)
    parser.add_argument('--extractor', type=Path, default=Path(__file__).resolve().parents[1] / 'site-extraction-lab' / 'extractors.py')
    args = parser.parse_args()
    raw = args.response.read_bytes()
    spec = importlib.util.spec_from_file_location('rss_gate_candidate', args.extractor)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    result = {
        'schema_version': 1,
        'input_sha256': hashlib.sha256(raw).hexdigest(),
        'input_bytes': len(raw),
        'extractor_sha256': hashlib.sha256(args.extractor.read_bytes()).hexdigest(),
        'operation': 'offline_existing_rss_parser_replay',
        'collection_accepted': False,
        'limits': 'A parser outcome only; no channel emptiness, upload coverage, history, media access or Atom adapter acceptance is established.',
    }
    try:
        records = module.rss({'feed': raw}, 'https://www.youtube.com')
    except module.ExtractionError as exc:
        result.update(state='explicit_extraction_rejection', error_type='ExtractionError', reason=str(exc))
    else:
        result.update(state='parser_returned_empty_list' if not records else 'parser_returned_records', record_count=len(records))
        if not records:
            result['returned_value'] = []
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == '__main__':
    main()
