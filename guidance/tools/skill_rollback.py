#!/usr/bin/env python3
"""Reviewed rollback of one committed Skill sync; preserve all displaced bytes.

Use only quiescent trusted local directories. Not crash-atomic. An interrupted
rollback blocks further sync and requires inspection, never a blind retry.
"""
import argparse
import json
import os
from pathlib import Path
from skill_sync import safe, portable, tree, marker, sha, encoded, MAX_SKILLS, MARKER
from skill_preflight import inspect, header, MAX_HEADER


def plan(recovery):
    recovery = safe(recovery)
    if not recovery.name.startswith('.athena-skill-recovery-'):
        raise ValueError('explicit Skill recovery directory required')
    receipt = safe(recovery / 'receipt.json')
    with receipt.open('rb') as stream:
        raw = stream.read(1024 * 1024 + 1)
    if len(raw) > 1024 * 1024:
        raise ValueError('receipt budget')
    value = json.loads(raw)
    if value.get('state') != 'committed':
        raise ValueError('only a committed install can be rolled back')
    original = value['plan']
    target = safe(original['target'])
    if recovery.parent != target:
        raise ValueError('recovery target mismatch')
    rows = original['skills']
    if not isinstance(rows, list) or not 1 <= len(rows) <= MAX_SKILLS:
        raise ValueError('invalid Skill batch')
    names = set()
    actions = []
    for row in rows:
        name = row['name']
        if not portable(name) or name.casefold() in names:
            raise ValueError('invalid or duplicate Skill name')
        names.add(name.casefold())
        if row['action'] not in ('create', 'update', 'noop'):
            raise ValueError('invalid action')
        dest = safe(target / name)
        if str(dest) != row['destination']:
            raise ValueError('destination mismatch')
        current, current_bytes = marker(dest)
        _, hashes = tree(dest, True)
        if current.get('name') != name or current.get('files') != hashes or hashes != row['files']:
            raise ValueError('installed Skill changed; preserve local edits')
        if row['action'] == 'noop':
            continue
        old = safe(recovery / ('old-' + name))
        displaced = safe(recovery / ('reverted-new-' + name))
        if os.path.lexists(displaced):
            raise ValueError('rollback destination occupied')
        if row['action'] == 'update':
            prior, prior_bytes = marker(old)
            report = inspect(old)
            if set(report['errors']) - {'directory-name-mismatch'}:
                raise ValueError('previous copy structural failure')
            with safe(old / 'SKILL.md').open('rb') as stream:
                if header(stream.read(MAX_HEADER))['name'] != name:
                    raise ValueError('previous Skill identity mismatch')
            old_hashes = {r['path']: sha(safe(old / r['path']).read_bytes()) for r in report['files'] if r['path'] != MARKER}
            if (prior.get('name') != name or prior.get('files') != old_hashes
                or old_hashes != row['oldFiles'] or sha(prior_bytes) != row['oldMarkerSha256']):
                raise ValueError('previous copy changed; preserve')
        elif row['oldFiles'] is not None or os.path.lexists(old):
            raise ValueError('invalid create recovery')
        actions.append({'name': name, 'restorePrevious': row['action'] == 'update',
                        'currentMarkerSha256': sha(current_bytes)})
    result = {'schema': 1, 'recovery': str(recovery), 'target': str(target),
              'receiptSha256': sha(raw), 'actions': actions,
              'scope': 'Private local review. Retains displaced copies; no source changes or client execution.'}
    result['reviewSha256'] = sha(encoded(result))
    return result


def apply(recovery, expected):
    reviewed = plan(recovery)
    if expected != reviewed['reviewSha256'] or plan(recovery) != reviewed:
        raise ValueError('review changed; no writes')
    recovery = safe(recovery)
    receipt = recovery / 'receipt.json'
    original = json.loads(receipt.read_bytes())
    state = dict(original, state='rollback-in-progress', rollback=reviewed)
    # Block future sync before the first installed directory is moved.
    receipt.write_bytes(encoded(state))
    try:
        for row in reviewed['actions']:
            name = row['name']
            dest = safe(Path(reviewed['target']) / name)
            dest.rename(recovery / ('reverted-new-' + name))
            if row['restorePrevious']:
                (recovery / ('old-' + name)).rename(dest)
        state['state'] = 'rolled-back'
        receipt.write_bytes(encoded(state))
    except (Exception, KeyboardInterrupt):
        state['state'] = 'rollback-incomplete'
        receipt.write_bytes(encoded(state))
        raise
    return {'changed': bool(reviewed['actions']), 'retirementReady': False,
            'scope': 'Previous copies restored; displaced copies retained. Client acceptance is separate.'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=('plan', 'apply'))
    parser.add_argument('--recovery', type=Path, required=True)
    parser.add_argument('--review-sha256')
    args = parser.parse_args()
    try:
        result = plan(args.recovery) if args.command == 'plan' else apply(args.recovery, args.review_sha256)
        print(json.dumps(result, indent=2))
        return 0
    except (OSError, ValueError, KeyError, TypeError):
        print(json.dumps({'error': 'Rollback not completed. Preserve all recovery and installed paths; inspect locally.'}))
        return 3


if __name__ == '__main__':
    raise SystemExit(main())
