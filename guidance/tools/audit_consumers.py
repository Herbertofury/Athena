#!/usr/bin/env python3
"""Read-only retirement dependency audit of explicitly selected Git consumers.

Never discovers targets, changes locks/instructions, or emits file contents.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path
from repository_governance import MANIFEST, POLICY_FILES, checked_release, content, safe_path

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

def source_git(source, *args, batch=None):
    # Inspect only the selected local checkout. No credential prompt, object
    # replacement, implicit fetch or index stat-cache update.
    env = {**os.environ, 'GIT_NO_LAZY_FETCH': '1', 'GIT_NO_REPLACE_OBJECTS': '1',
           'GIT_OPTIONAL_LOCKS': '0', 'GIT_TERMINAL_PROMPT': '0'}
    result = subprocess.run(['git', '-C', str(source), *args], input=batch,
                            capture_output=True, env=env)
    if result.returncode:
        raise ValueError('selected source Git evidence unavailable')
    return result.stdout

def selected_head(source):
    try:
        head = source_git(source, 'rev-parse', '--verify', 'HEAD').decode('ascii').strip()
        return head if re.fullmatch(r'[a-f0-9]{40}', head) else None
    except (OSError, ValueError):
        return None

def committed_release_matches(source, head, manifest):
    # Bound local blob reads to the version lock and the fixed public policy core.
    try:
        prefix = source_git(source, 'rev-parse', '--show-prefix').removesuffix(b'\n').removesuffix(b'\r')
        if b'\n' in prefix or b'\r' in prefix:
            return False
        names = [MANIFEST, *POLICY_FILES]
        specs = b''.join(head.encode('ascii')+b':'+prefix+name.encode('ascii')+b'\n' for name in names)
        meta = source_git(source, 'cat-file', '--batch-check=%(objecttype) %(objectsize)', batch=specs).splitlines()
        if len(meta) != len(names) or any(not re.fullmatch(rb'blob [0-9]{1,7}', row) for row in meta):
            return False
        sizes = [int(row.split()[1]) for row in meta]
        if any(size > 1024 * 1024 for size in sizes):
            return False
        blobs = source_git(source, 'cat-file', '--batch', batch=specs)
        start = 0
        for name, size in zip(names, sizes):
            newline = blobs.index(b'\n', start)
            header = blobs[start:newline].split()
            if len(header) != 3 or header[1] != b'blob' or int(header[2]) != size:
                return False
            start = newline + 1
            raw = blobs[start:start+size]
            if blobs[start+size:start+size+1] != b'\n':
                return False
            start += size + 1
            if name == MANIFEST:
                if json.loads(raw) != manifest:
                    return False
            elif sha(raw.replace(b'\r\n',b'\n').replace(b'\r',b'\n')) != manifest['files'][name]:
                return False
        return start == len(blobs)
    except (OSError, ValueError, KeyError, TypeError):
        return False

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
        manifest = checked_release(source)
        expected = manifest['files']
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
    if legacy:
        result['state'] = 'needs-review' if result['issues'] else 'legacy-migration-required'
        return result
    result['policyBytesMatch'] = (set(lock['files']) == set(paths) and
        all(row['matchesPreservedCanonical'] and row['state'] == 'unchanged' for row in result['snapshots']))
    head = selected_head(source)
    result['selectedSourceCommit'] = head
    pin = 'claim-unverified'
    bad_digest = lock.get('digestFormat') != manifest['digestFormat']
    wrong_version = head is not None and head == result['sourceCommit'] and result['version'] != manifest['version']
    if bad_digest or wrong_version:
        if bad_digest:
            result['issues'].append('digestFormat differs from supported policy digest convention')
        if wrong_version:
            result['issues'].append('version differs from the selected source release')
        pin = 'claim-metadata-mismatch'
    elif result['version'] and result['sourceCommit'] and lock.get('sourceWorkingTreeDirty') is False:
        if head is None:
            pin = 'selected-revision-unavailable'
        elif head != result['sourceCommit']:
            pin = 'different-revision'
        elif committed_release_matches(source, head, manifest):
            pin = 'verified-selected-revision'
        else:
            pin = 'selected-source-drift'
    result['sourcePinStatus'] = pin
    result['state'] = ('needs-review' if result['issues'] else 'athena-pin-matches'
                       if pin == 'verified-selected-revision' else 'athena-canonical-bytes-match')
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
            'remainingConsumerWork':bool(references or any(x['state'] in ('needs-review','foreign-or-invalid','legacy-migration-required','athena-canonical-bytes-match') for x in locks)),
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
