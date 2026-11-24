#!/usr/bin/env python3
"""Read-only retirement dependency audit of explicitly selected Git consumers.

Never discovers targets, changes locks/instructions, or emits file contents.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import re
import subprocess
from pathlib import Path
from repository_governance import POLICY_FILES, checked_release, content, safe_path

ATHENA = 'https://github.com/Herbertofury/Athena'
LEGACY = 'https://github.com/Herbertofury/Agent-Foundry'
TEXT_SUFFIXES = {'.md', '.txt', '.json', '.py', '.yml', '.yaml', '.toml', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx', '.html', '.css', '.rs', '.sh', '.ps1', '.xml'}
HEX = re.compile(r'^[0-9a-f]{64}$')

def sha(data):
    return hashlib.sha256(data).hexdigest()

def git(target, *args):
    result = subprocess.run(['git', '-C', str(target), *args], capture_output=True)
    if result.returncode:
        raise ValueError('Git inspection failed; target must be a readable Git checkout')
    return result.stdout

def expected_paths(prefix):
    return {f'{prefix}/'+('AGENTS-adapter.md' if path.startswith('templates/') else path): path for path in POLICY_FILES}

def inspect_lock(source, target, kind):
    legacy = kind == 'legacy'
    prefix = '.agents/foundry' if legacy else '.agents/athena'
    lock_name = '.agent-foundry/governance-lock.json' if legacy else '.athena/governance-lock.json'
    lock_path = safe_path(target, lock_name)
    if not lock_path.exists():
        return {'kind': kind, 'present': False, 'state': 'absent'}
    lock = json.loads(lock_path.read_text(encoding='utf-8'))
    result = {'kind': kind, 'present': True, 'state': 'unverified', 'issues': [], 'snapshots': []}
    if not isinstance(lock, dict) or lock.get('schemaVersion') != 1 or lock.get('sourceRepository') != (LEGACY if legacy else ATHENA) or not isinstance(lock.get('files'), dict):
        result.update(state='foreign-or-invalid', issues=['unsupported lock identity/schema; preserve for review'])
        return result
    version = lock.get('version')
    result['version'] = version if isinstance(version, str) and re.fullmatch(r'\d+\.\d+\.\d+', version) else None
    commit = lock.get('sourceCommit')
    result['sourceCommit'] = commit if isinstance(commit, str) and re.fullmatch(r'[a-f0-9]{40}', commit) else None
    if result['version'] is None or result['sourceCommit'] is None:
        result['issues'].append('invalid version or source revision')
    if lock.get('sourceWorkingTreeDirty') is not False:
        result['issues'].append('source clean-tree provenance not established')
    if legacy:
        inventory = json.loads((source/'registry/agent-foundry-source-inventory.json').read_text())
        expected = {row['path']: row['sha256'] for row in inventory['files']}
        result['knownSourceCommit'] = inventory['sourceCommit']
        if result['sourceCommit'] != inventory['sourceCommit']:
            result['issues'].append('source revision differs from preserved migration inventory')
    else:
        expected = checked_release(source)['files']
    paths = expected_paths(prefix)
    if set(lock['files']) != set(paths):
        result['issues'].append('managed path set differs from complete core')
    for relative, canonical in paths.items():
        path = safe_path(target, relative)
        actual = sha(content(path)) if path.is_file() else None
        pinned = lock['files'].get(relative)
        valid_pin = isinstance(pinned, str) and HEX.fullmatch(pinned) is not None
        state = 'unchanged' if actual is not None and actual == pinned and valid_pin else 'missing-or-locally-modified'
        known = valid_pin and pinned == expected.get(canonical)
        result['snapshots'].append({'path': relative, 'state': state, 'matchesPreservedCanonical': known, 'sha256': actual})
    if any(row['state'] != 'unchanged' for row in result['snapshots']):
        result['issues'].append('local snapshots changed or missing; do not overwrite')
    if any(not row['matchesPreservedCanonical'] for row in result['snapshots']):
        result['issues'].append('source pin needs canonical reconciliation')
    result['state'] = 'needs-review' if result['issues'] else ('legacy-migration-required' if legacy else 'athena-pin-matches')
    return result

def audit(source, target, label):
    source=source.resolve();target=target.resolve()
    checked_release(source)
    commit=git(target,'rev-parse','HEAD').decode().strip()
    paths=git(target,'ls-files','-z').decode('utf-8').split('\0')
    references=[];skipped=[];scanned=0
    for relative in filter(None, paths):
        path=Path(relative)
        if path.name.startswith('.env') or path.suffix.lower() not in TEXT_SUFFIXES:
            skipped.append(relative);continue
        local=safe_path(target, relative)
        if not local.is_file():
            skipped.append(relative);continue
        try:
            data=local.read_bytes();text=data.decode('utf-8')
        except UnicodeError:
            skipped.append(relative);continue
        counts={'sourceUrl':text.count(LEGACY),'snapshotPath':text.count('.agents/foundry'),'statePath':text.count('.agent-foundry')}
        scanned+=1
        if any(counts.values()):
            references.append({'path':relative,'sha256':sha(data),'counts':counts})
    locks=[inspect_lock(source,target,kind) for kind in ('legacy','athena')]
    return {'label':label,'head':commit,'scope':'Explicit checkout only. Working tracked text and known adoption locks; no network, file contents or private notes in output.',
            'referenceDisposition':'Unreviewed references may be provenance rather than active dependencies; review before rewriting.',
            'legacyRetirementReady':False,'retirementReason':'This audit cannot prove source history, releases, wiki, runtime parity or unseen consumers reconciled.',
            'locks':locks,'legacyReferences':references,'scannedTextFiles':scanned,'uninspectedPaths':skipped,
            'remainingConsumerWork':bool(references or any(x['state'] in ('needs-review','foreign-or-invalid','legacy-migration-required') for x in locks)),
            'writesPerformed':False}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source',type=Path,default=Path(__file__).resolve().parents[1])
    parser.add_argument('--target',type=Path,action='append',required=True,help='Explicit target; repeat for a reviewed batch')
    args=parser.parse_args()
    try:
        results=[audit(args.source,target,f'consumer-{i+1}') for i,target in enumerate(args.target)]
        print(json.dumps({'schema':1,'producer':'Athena guidance consumer audit','consumers':results},indent=2))
        return 0
    except (ValueError,OSError,KeyError,TypeError) as exc:
        # Do not echo arbitrary lock values, source content or absolute paths.
        print(json.dumps({'schema':1,'error':type(exc).__name__,'message':'Inspection incomplete; preserve source and target. Check selected paths, lock schema, links and canonical manifest.'}))
        return 2
if __name__=='__main__':raise SystemExit(main())
