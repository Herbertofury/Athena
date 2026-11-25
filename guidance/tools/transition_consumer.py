#!/usr/bin/env python3
"""Explicit reviewed legacy transition; generic adoption still refuses legacy locks.

Requires a clean, trusted, quiescent checkout and external reviewed router bytes.
Review digests bind inputs, not user permission. Never discovers consumers.
"""
import argparse
import json
import os
import re
from pathlib import Path
from audit_consumers import expected_paths, git, inspect_lock
from repository_governance import checked_release, content, destination, digest, safe_path, SOURCE_URL, LOCK
from adoption_transaction import write_set

LIMIT = 128 * 1024

def router_bytes(path):
    if path.is_symlink() or (hasattr(path, 'is_junction') and path.is_junction()) or not path.is_file():
        raise ValueError('regular reviewed router required')
    with path.open('rb') as f: data = f.read(LIMIT + 1)
    if len(data) > LIMIT: raise ValueError('router size limit')
    text = data.decode('utf-8')
    if '.agents/athena/AGENTS-adapter.md' not in text: raise ValueError('Athena router required')
    return data

def prepare(source, target, router):
    source, target = Path(source).resolve(), Path(target).resolve()
    if source == target or source.is_relative_to(target) or target.is_relative_to(source):
        raise ValueError('separate source and consumer required')
    for root in (source, target):
        if git(root, 'status', '--porcelain', '--untracked-files=all').strip():
            raise ValueError('clean checkout required; preserve edits')
    source_head = git(source, 'rev-parse', 'HEAD').decode().strip()
    target_head = git(target, 'rev-parse', 'HEAD').decode().strip()
    manifest = checked_release(source)
    legacy = inspect_lock(source, target, 'legacy')
    if legacy['state'] != 'legacy-migration-required': raise ValueError('legacy pin requires review')
    original = safe_path(target, 'AGENTS.md')
    if not original.is_file() or original.stat().st_size > LIMIT: raise ValueError('bounded existing router required')
    old = original.read_bytes()
    router.decode('utf-8')
    if len(router) > LIMIT or b'.agents/athena/AGENTS-adapter.md' not in router: raise ValueError('reviewed router required')
    payloads = {destination(p): content(source / p) for p in manifest['files']}
    if any(digest(payloads[destination(p)]) != expected for p, expected in manifest['files'].items()):
        raise ValueError('source changed')
    lock = {'schemaVersion':1, 'sourceRepository':SOURCE_URL, 'sourceCommit':source_head,
            'sourceWorkingTreeDirty':False, 'version':manifest['version'], 'digestFormat':manifest['digestFormat'],
            'files':{destination(p):h for p,h in manifest['files'].items()}}
    payloads['AGENTS.md'] = router
    payloads[LOCK] = (json.dumps(lock,indent=2,sort_keys=True)+'\n').encode()
    for p in payloads:
        local=safe_path(target,p)
        if p != 'AGENTS.md' and os.path.lexists(local): raise ValueError('existing destination preserved')
    preserved = {p:digest(safe_path(target,p).read_bytes()) for p in
                 ['.agent-foundry/governance-lock.json', *[r['path'] for r in legacy['snapshots']]]}
    review = {'schemaVersion':1,'sourceCommit':source_head,'targetCommit':target_head,
              'oldRouterSha256':digest(old),'payloads':{p:digest(b) for p,b in payloads.items()},
              'preservedLegacy':preserved,'retirementReady':False,
              'scope':'Explicit selected consumer only. Review root router semantics separately; no skill installation or historical link rewrites.'}
    review['reviewSha256']=review_digest(review)
    return review,payloads

def apply(source,target,router,expected_review):
    review,payloads=prepare(source,target,router)
    if expected_review != review['reviewSha256']: raise ValueError('review inputs changed; no writes')
    # Rebuild immediately before writing; callers must exclude concurrent writers.
    checked,again=prepare(source,target,router)
    if checked != review or again != payloads: raise ValueError('inputs changed; no writes')
    write_set(Path(target).resolve(),payloads,safe_path)
    return {'reviewSha256':expected_review,'writtenPaths':list(payloads),'legacyPreserved':True,
            'retirementReady':False,'scope':'Exception rollback only, not crash atomic or hostile-concurrency safe; actual harness acceptance still required.'}

def review_digest(review):
    return digest(json.dumps(review,sort_keys=True,separators=(',',':')).encode())

def reviewed_plan(path):
    if path.is_symlink() or (hasattr(path, 'is_junction') and path.is_junction()) or not path.is_file():
        raise ValueError('regular reviewed plan required')
    with path.open('rb') as f: data=f.read(LIMIT+1)
    if len(data)>LIMIT: raise ValueError('reviewed plan size limit')
    return json.loads(data.decode('utf-8'))

def verify(source,target,review,expected_review):
    """Check the issued plan against a selected consumer without rewriting anything."""
    source,target=Path(source).resolve(),Path(target).resolve()
    if source==target or source.is_relative_to(target) or target.is_relative_to(source):
        raise ValueError('separate source and consumer required')
    if not isinstance(review,dict) or review.get('schemaVersion')!=1 or review.get('retirementReady') is not False:
        raise ValueError('reviewed transition plan required')
    recorded=review.get('reviewSha256')
    if not isinstance(expected_review,str) or not re.fullmatch(r'[a-f0-9]{64}',expected_review):
        raise ValueError('expected review digest required')
    if recorded!=expected_review or review_digest({k:v for k,v in review.items() if k!='reviewSha256'})!=expected_review:
        raise ValueError('review inputs changed')
    source_head=git(source,'rev-parse','HEAD').decode().strip()
    target_head=git(target,'rev-parse','HEAD').decode().strip()
    if review.get('sourceCommit')!=source_head or git(source,'--no-optional-locks','status','--porcelain','--untracked-files=all').strip():
        raise ValueError('exact clean source checkout required')
    original=review.get('targetCommit')
    if not isinstance(original,str) or not re.fullmatch(r'[a-f0-9]{40}',original):
        raise ValueError('reviewed consumer base required')
    if target_head!=original:
        git(target,'merge-base','--is-ancestor',original,target_head)
    manifest=checked_release(source)
    paths={destination(p) for p in manifest['files']}|{'AGENTS.md',LOCK}
    old_paths=set(expected_paths('.agents/foundry'))|{'.agent-foundry/governance-lock.json'}
    for key,expected_files in [('payloads',paths),('preservedLegacy',old_paths)]:
        hashes=review.get(key)
        if not isinstance(hashes,dict) or hashes.keys()!=expected_files:
            raise ValueError('reviewed path set differs')
        for path in sorted(expected_files):
            current=safe_path(target,path)
            if not current.is_file(): raise ValueError('reviewed file missing')
            with current.open('rb') as f: actual=f.read(LIMIT+1)
            if len(actual)>LIMIT or digest(actual)!=hashes[path]:
                raise ValueError('reviewed file bytes differ')
    legacy=inspect_lock(source,target,'legacy')
    athena=inspect_lock(source,target,'athena')
    if legacy['state']!='legacy-migration-required' or athena['state']!='athena-pin-matches':
        raise ValueError('both pins must be intact')
    if athena['sourceCommit']!=source_head or athena['version']!=manifest['version']:
        raise ValueError('Athena pin differs from reviewed source')
    return {'reviewSha256':expected_review,'sourceCommit':source_head,'consumerCommit':target_head,
            'verifiedNewFiles':len(paths),'preservedLegacyFiles':len(old_paths),
            'writesPerformed':False,'retirementReady':False,
            'scope':'Exact reviewed guidance files only; no installed-client or project application acceptance.'}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=['plan','apply','verify'])
    p.add_argument('--source',type=Path,required=True);p.add_argument('--target',type=Path,required=True)
    p.add_argument('--reviewed-router',type=Path);p.add_argument('--review-sha256')
    p.add_argument('--review-file',type=Path,help='Unchanged JSON output from plan; used only with verify')
    a=p.parse_args()
    if a.command=='verify' and (not a.review_file or a.reviewed_router or not a.review_sha256):
        p.error('verify requires --review-file and --review-sha256')
    if a.command!='verify' and (not a.reviewed_router or a.review_file):
        p.error('plan/apply requires --reviewed-router; --review-file is only for verify')
    try:
        if a.command=='verify':
            result=verify(a.source,a.target,reviewed_plan(a.review_file),a.review_sha256)
        else:
            router=router_bytes(a.reviewed_router)
            result=prepare(a.source,a.target,router)[0] if a.command=='plan' else apply(a.source,a.target,router,a.review_sha256)
        print(json.dumps(result,indent=2));return 0
    except (OSError,ValueError,KeyError,TypeError,RecursionError):
        print(json.dumps({'error':'Transition incomplete; preserve source, consumer and any recovery directory. Review exact inputs locally.'}));return 2
if __name__=='__main__':raise SystemExit(main())
