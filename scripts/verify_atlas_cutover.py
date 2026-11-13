#!/usr/bin/env python3
"""Verify retained Atlas source completeness without claiming product acceptance."""
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SNAPSHOT = Path('migration/engineering-atlas/cutover-2026-11-13')

def verify(root=ROOT):
    manifest = json.loads((root / SNAPSHOT / 'source-manifest.json').read_text())
    rows = manifest['files']
    seen = set()
    for row in rows:
        path = root / row['athena_path']
        if row['source_path'] in seen or not path.resolve().is_relative_to(root.resolve()):
            raise ValueError('Duplicate or unsafe manifest path')
        seen.add(row['source_path'])
        if not path.is_file():
            raise ValueError(f'Missing migrated file: {path}')
        if row['relation'] not in ('exact', 'athena-adapted'):
            raise ValueError(f'Unresolved migration: {path}')
    # Current implementation can evolve. The source bytes and every source ref
    # must remain recoverable even after subsequent intentional destination edits.
    bundle = root / 'migration/engineering-atlas/engineering-atlas-history.bundle'
    with tempfile.TemporaryDirectory() as directory:
        subprocess.run(['git','clone','--mirror',str(bundle),directory],check=True,capture_output=True)
        subprocess.run(['git','-C',directory,'fetch',str(root / SNAPSHOT / 'history-delta.bundle'),'+refs/*:refs/*'],check=True,capture_output=True)
        subprocess.run(['git','-C',directory,'fsck','--full'],check=True,capture_output=True)
        refs = json.loads((root / SNAPSHOT / 'source-refs.json').read_text())
        for ref in refs:
            actual = subprocess.check_output(['git','-C',directory,'rev-parse',ref['ref']],text=True).strip()
            if actual != ref['sha']:
                raise ValueError(f'Ref mismatch: {ref["ref"]}')
        tracked = subprocess.check_output(['git','-C',directory,'ls-tree','-r','--name-only',manifest['source_revision']],text=True).splitlines()
        if set(tracked) != seen:
            raise ValueError('Source tree inventory mismatch')
        for row in rows:
            data = subprocess.check_output(['git','-C',directory,'show',row['source_blob']])
            if hashlib.sha256(data).hexdigest() != row['source_sha256']:
                raise ValueError(f'Source hash mismatch: {row["source_path"]}')
    return {'source_revision':manifest['source_revision'],'files':len(rows),'refs':len(refs),'source_recovery':'verified','native_acceptance':'not established by this check'}

if __name__ == '__main__':
    print(json.dumps(verify(),indent=2))
