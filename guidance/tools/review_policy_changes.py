#!/usr/bin/env python3
"""Read-only, selected legacy snapshot comparison; never adopts or edits guidance."""
import argparse
import difflib
import json
from pathlib import Path
from repository_governance import POLICY_FILES, checked_release, destination, digest, safe_path
from audit_consumers import expected_paths, LEGACY

MAX_FILE = 1024 * 1024
MAX_TOTAL = 8 * 1024 * 1024

def read_text(path, budget):
    if not path.is_file():
        raise ValueError('Nonregular input')
    with path.open('rb') as stream:
        data = stream.read(min(MAX_FILE, budget[0]) + 1)
    if len(data) > MAX_FILE or len(data) > budget[0]:
        raise ValueError('Comparison input budget exceeded')
    budget[0] -= len(data)
    return data.decode('utf-8').replace('\r\n', '\n')

def compare(source, target, include_content=False):
    source, target = source.resolve(), target.resolve()
    if source == target or not target.is_dir():
        raise ValueError('Select a separate consumer directory')
    budget = [MAX_TOTAL]
    # Bound every canonical/selected input before the shared manifest verifier reads it.
    canonical = {name: read_text(safe_path(source, name), budget) for name in POLICY_FILES}
    read_text(safe_path(source, 'registry/repository-governance.json'), budget)
    manifest = checked_release(source)
    lock_path = safe_path(target, '.agent-foundry/governance-lock.json')
    lock = json.loads(read_text(lock_path, budget))
    if not isinstance(lock, dict) or lock.get('schemaVersion') != 1 or lock.get('sourceRepository') != LEGACY or not isinstance(lock.get('files'), dict):
        raise ValueError('Unsupported legacy lock')
    rows = []
    for old_path, name in expected_paths('.agents/foundry').items():
        path = safe_path(target, old_path)
        old = read_text(path, budget) if path.exists() else None
        old_hash = digest(old.encode('utf-8')) if old is not None else None
        new = canonical[name]
        new_hash = digest(new.encode('utf-8'))
        if new_hash != manifest['files'][name]:
            raise ValueError('Source changed during review')
        pinned = lock['files'].get(old_path)
        row = {'legacyPath': old_path, 'proposedPath': destination(name),
               'observedSha256': old_hash, 'proposedSha256': new_hash,
               'pinMatches': old_hash is not None and old_hash == pinned,
               'state': 'missing' if old is None else ('identical' if old == new else 'different')}
        if include_content:
            # A line-level review aid, not policy-semantic equivalence or an apply patch.
            row['diff'] = ''.join(difflib.unified_diff(
                (old or '').splitlines(keepends=True), new.splitlines(keepends=True),
                fromfile=old_path, tofile=destination(name), n=3))
        rows.append(row)
    return {'schemaVersion': 1, 'proposalOnly': True, 'writesPerformed': False,
            'contentIncluded': include_content, 'destinationVersion': manifest['version'],
            'knownPolicyCount': len(rows), 'changedCount': sum(r['state'] != 'identical' for r in rows),
            'allSelectedPinsMatch': all(r['pinMatches'] for r in rows), 'policies': rows,
            'unrecognizedLockPathCount': len(set(lock['files']) - set(expected_paths('.agents/foundry'))),
            'scope': 'Only the 16 known snapshots and selected lock were read. No root/nested project instructions or other repositories scanned.',
            'limitations': ['Differences do not establish safer or equivalent instructions.',
                           'Content is omitted by default; opt-in diffs can contain private local edits. Keep reports local.',
                           'Stable checkout required; not a concurrent filesystem snapshot.',
                           'No approval, apply, rollback, installed harness qualification or retirement readiness.'],
            'applySupported': False, 'retirementReady': False}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--target', type=Path, required=True)
    parser.add_argument('--include-content', action='store_true', help='Include local snapshot text diffs; keep this report private')
    args = parser.parse_args()
    try:
        print(json.dumps(compare(args.source, args.target, args.include_content), indent=2))
        return 0
    except (OSError, ValueError, KeyError, TypeError):
        print(json.dumps({'proposalOnly': True, 'writesPerformed': False,
                          'error': 'Comparison incomplete; select valid regular UTF-8 snapshot files within the stated budgets. No changes made.'}))
        return 2

if __name__ == '__main__':
    raise SystemExit(main())
