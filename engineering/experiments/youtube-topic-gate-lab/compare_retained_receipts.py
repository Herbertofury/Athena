"""Offline comparison of retained WordPress/Bluesky captures across two trees.

Private manifests/bodies are external inputs. No fetching or receipt mutation.
Complete normalized results (including private fields) are compared in memory;
only digests and sanitized receipt projections are emitted. Each tree runs in a
fresh interpreter, avoiding shared import caches. Socket access is prohibited.
"""
from __future__ import annotations
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys

RECEIPTS = {
    'wordpress': 'site-extraction-lab/wordpress-collection-validation-2026-11-11.json',
    'bluesky': 'bluesky-thread-lab/public-validation-2026-11-11.json',
}
IMPLEMENTATIONS = {
    'wordpress': {'wordpress_collection.py': 'site-extraction-lab/wordpress_collection.py',
                  'extractors.py': 'site-extraction-lab/extractors.py'},
    'bluesky': {'threads.py': 'bluesky-thread-lab/threads.py',
                'bluesky.py': 'site-extraction-lab/bluesky.py',
                'extractors.py': 'site-extraction-lab/extractors.py'},
}


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=True,
                      allow_nan=False, default=lambda v: {'__bytes_hex__': v.hex()}
                      if isinstance(v, bytes) else (_ for _ in ()).throw(TypeError(type(v)))).encode()


def digest(value):
    return hashlib.sha256(canonical(value)).hexdigest()


def audit(event, args):
    if event.startswith('socket.'):
        raise RuntimeError('Offline comparison prohibits socket access')


def replay(tree, manifest_path, family):
    sys.addaudithook(audit)
    lab = tree / 'engineering/experiments'
    sys.path.insert(0, str(lab / 'site-extraction-lab'))
    module_path = lab / IMPLEMENTATIONS[family][
        'wordpress_collection.py' if family == 'wordpress' else 'threads.py']
    spec = importlib.util.spec_from_file_location('retained_replay', module_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    captures = json.loads(manifest_path.read_text())
    expected_count = 4 if family == 'wordpress' else 3
    if len(captures) != expected_count:
        raise ValueError('Unexpected capture count')
    for capture in captures:
        body = (manifest_path.parent / capture['bodyFile']).read_bytes()
        if len(body) != capture['bytes'] or hashlib.sha256(body).hexdigest() != capture['sha256']:
            raise ValueError('Capture size or hash mismatch')
        capture['body'] = body
    if family == 'wordpress':
        normalized = [module.reconcile(group, 'public') for group in (captures[:2], captures[2:])]
        public = [module.public_receipt(result) for result in normalized]
    else:
        normalized = [module.normalize_capture(c['body'], uri=c['expectedUri'], depth=c['depth'],
                      parent_height=c['parentHeight'], http_status=c['status']) for c in captures]
        public = [module.receipt(result) for result in normalized]
    return {
        'normalized': normalized,
        'publicReceipts': public,
        'captures': [{k: c[k] for k in ('bytes', 'sha256', 'capturedAt')} for c in captures],
        'implementationSha256': {k: hashlib.sha256((lab / p).read_bytes()).hexdigest()
                                 for k, p in IMPLEMENTATIONS[family].items()},
    }


def compare(baseline, candidate, manifest, family, baseline_tree=None):
    provenance = {}
    if baseline_tree is not None:
        tree = json.loads(baseline_tree.read_text())
        entries = {entry['path']: entry['sha'] for entry in tree['tree']}
        blobs = {}
        for rel in IMPLEMENTATIONS[family].values():
            path = 'engineering/experiments/' + rel
            body = (baseline / path).read_bytes()
            blob = hashlib.sha1(b'blob ' + str(len(body)).encode() + b'\0' + body).hexdigest()
            if entries[path] != blob:
                raise ValueError('Baseline implementation does not match retained source tree')
            blobs[path] = blob
        provenance = {'baselineCommit': tree['sha'], 'baselineSourceBlobs': blobs}
    outputs = []
    for tree in (baseline, candidate):
        completed = subprocess.run([sys.executable, '-B', str(Path(__file__).resolve()),
                                    '--worker', '--family', family, '--candidate', str(tree),
                                    '--manifest', str(manifest)], check=True, capture_output=True,
                                   env={**os.environ, 'PYTHONDONTWRITEBYTECODE': '1'})
        outputs.append(json.loads(completed.stdout))
    old, new = outputs
    for field in ('normalized', 'publicReceipts', 'captures'):
        if old[field] != new[field]:
            raise ValueError(f'{family}: complete {field} differs')
    stored = json.loads((candidate / 'engineering/experiments' / RECEIPTS[family]).read_text())
    historical = ([case['receipt'] for case in stored['cases']] if family == 'wordpress'
                  else [capture['replay'] for capture in stored['captures']])
    if new['publicReceipts'] != historical:
        raise ValueError('Replay differs from historical receipt')
    original = stored.get('originalImplementationSha256', stored['implementationSha256'])
    if old['implementationSha256'] != original:
        raise ValueError('Baseline does not match original implementation provenance')
    historical_times = (stored['capturedAt'] if family == 'wordpress'
                        else [c['capturedAt'] for c in stored['captures']])
    if historical_times != [c['capturedAt'] for c in new['captures']]:
        raise ValueError('Capture timestamps differ from historical receipt')
    return {
        **provenance,
        'classification': 'retained exact-byte offline replay; no new source capture',
        'networkUsed': False,
        'captureCount': len(new['captures']),
        'captures': new['captures'],
        'baselineImplementationSha256': old['implementationSha256'],
        'candidateImplementationSha256': new['implementationSha256'],
        'completeNormalizedOutputEqual': True,
        'historicalSanitizedReceiptsEqual': True,
        'normalizedOutputSha256': digest(new['normalized']),
        'sanitizedReceiptsSha256': digest(new['publicReceipts']),
        'digestEncoding': 'UTF-8 sorted compact ASCII JSON; bytes represented as __bytes_hex__ objects',
        'limits': ['Retained captures only; no new transfer or expanded provider acceptance.',
                   'Full normalized output compared before sanitized projection. Raw output not published.'],
    }


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--baseline', type=Path)
    p.add_argument('--baseline-tree', type=Path)
    p.add_argument('--candidate', type=Path, required=True)
    p.add_argument('--manifest', type=Path, required=True)
    p.add_argument('--family', choices=RECEIPTS, required=True)
    p.add_argument('--worker', action='store_true', help=argparse.SUPPRESS)
    args = p.parse_args()
    if args.worker:
        print(canonical(replay(args.candidate, args.manifest, args.family)).decode())
    else:
        if args.baseline is None:
            p.error('--baseline is required')
        print(json.dumps(compare(args.baseline, args.candidate, args.manifest, args.family, args.baseline_tree), indent=2))


if __name__ == '__main__':
    main()
