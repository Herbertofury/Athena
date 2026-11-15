#!/usr/bin/env python3
"""Reviewed updates for a selected dual-lock consumer; never discover consumers.

Both source revisions must be separate clean checkouts. The previous source is
required to validate the installed canonical bytes, not merely a self-made lock.
A digest binds reviewed bytes, not authorization or semantic policy approval.
"""
import argparse
import json
from pathlib import Path
from audit_consumers import git, inspect_lock
from repository_governance import checked_release, content, destination, digest, safe_path, SOURCE_URL, LOCK
from adoption_transaction import write_set

LIMIT = 128 * 1024

def prepare(source, previous, target):
    source, previous, target = (Path(p).resolve() for p in (source, previous, target))
    roots = (source, previous, target)
    for i, root in enumerate(roots):
        if any(root == other or root.is_relative_to(other) or other.is_relative_to(root) for other in roots[i+1:]):
            raise ValueError('separate nonnested checkouts required')
        if git(root, 'status', '--porcelain', '--untracked-files=all').strip():
            raise ValueError('clean checkouts required; preserve edits')
    heads = [git(p, 'rev-parse', 'HEAD').decode().strip() for p in roots]
    manifest, old_manifest = checked_release(source), checked_release(previous)
    installed = inspect_lock(previous, target, 'athena')
    if installed['state'] != 'athena-pin-matches' or installed['sourceCommit'] != heads[1] or installed['version'] != old_manifest['version']:
        raise ValueError('installed source and canonical snapshot require reconciliation')
    old_lock = json.loads(safe_path(target, LOCK).read_text(encoding='utf-8'))
    if old_lock.get('digestFormat') != old_manifest['digestFormat']:
        raise ValueError('unsupported installed digest format')
    for root in (source, previous):
        if inspect_lock(root, target, 'legacy')['state'] != 'legacy-migration-required':
            raise ValueError('legacy preservation requires reconciliation')
    version = lambda s: tuple(map(int, s.split('.')))
    if version(manifest['version']) < version(old_manifest['version']) or (manifest['files'] != old_manifest['files'] and version(manifest['version']) <= version(old_manifest['version'])):
        raise ValueError('changed policy requires newer version; no downgrade')
    router = safe_path(target, 'AGENTS.md')
    with router.open('rb') as stream: router_data = stream.read(LIMIT + 1)
    if len(router_data) > LIMIT or '.agents/athena/AGENTS-adapter.md' not in router_data.decode('utf-8'):
        raise ValueError('bounded existing Athena router required')
    payloads = {destination(p): content(source/p) for p in manifest['files']}
    if any(digest(payloads[destination(p)]) != h for p,h in manifest['files'].items()):
        raise ValueError('source changed')
    # Every managed destination already exists and was validated against previous.
    lock = {'schemaVersion':1, 'sourceRepository':SOURCE_URL, 'sourceCommit':heads[0],
            'sourceWorkingTreeDirty':False, 'version':manifest['version'], 'digestFormat':manifest['digestFormat'],
            'files':{destination(p):h for p,h in manifest['files'].items()}}
    payloads[LOCK] = (json.dumps(lock, indent=2, sort_keys=True)+'\n').encode()
    legacy = inspect_lock(previous, target, 'legacy')
    preserved = {p:digest(safe_path(target,p).read_bytes()) for p in
                 ['AGENTS.md', '.agent-foundry/governance-lock.json', *[r['path'] for r in legacy['snapshots']]]}
    review = {'schemaVersion':1, 'sourceCommit':heads[0], 'previousSourceCommit':heads[1], 'targetCommit':heads[2],
              'oldLockSha256':digest(safe_path(target,LOCK).read_bytes()), 'preserved':preserved,
              'payloads':{p:digest(b) for p,b in payloads.items()}, 'retirementReady':False,
              'scope':'Explicit selected consumer; review exact canonical diff and local policy compatibility before applying. Root router and all unlisted files stay untouched.'}
    review['reviewSha256'] = digest(json.dumps(review,sort_keys=True,separators=(',',':')).encode())
    return review, payloads

def apply(source, previous, target, expected_review):
    review,payloads = prepare(source,previous,target)
    if expected_review != review['reviewSha256']: raise ValueError('review inputs changed; no writes')
    again, data = prepare(source,previous,target)
    if again != review or data != payloads: raise ValueError('inputs changed; no writes')
    write_set(Path(target).resolve(),payloads,safe_path)
    return {'reviewSha256':expected_review, 'writtenPaths':list(payloads), 'rootRouterPreserved':True,
            'legacyPreserved':True, 'retirementReady':False,
            'scope':'Exception rollback, not crash atomic or hostile concurrent-writer safe. No installed-harness acceptance implied.'}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('command', choices=['plan','apply'])
    for name in ('source','previous','target'):p.add_argument('--'+name,type=Path,required=True)
    p.add_argument('--review-sha256');a=p.parse_args()
    try:
        result = prepare(a.source,a.previous,a.target)[0] if a.command=='plan' else apply(a.source,a.previous,a.target,a.review_sha256)
        print(json.dumps(result,indent=2));return 0
    except (OSError,ValueError,KeyError,TypeError):
        print(json.dumps({'error':'Update incomplete; preserve all checkouts and recovery directories. Review exact inputs locally.'}));return 2
if __name__=='__main__':raise SystemExit(main())
