#!/usr/bin/env python3
"""Private, local Git recovery capsule: bundle plus exact reference metadata."""
import argparse
import json
import os
from pathlib import Path
import re
import tempfile
import zipfile
from history_bundle import create as create_bundle, git, refs, head, checksum

MAX_BUNDLE = 32 * 1024 * 1024
MAX_MANIFEST = 1024 * 1024

def reference_metadata(repo):
    pointers = {}
    for row in git(repo, 'for-each-ref', '--format=%(refname) %(symref)').decode().splitlines():
        name, _, target = row.partition(' ')
        if target: pointers[name] = target
    try: selected = git(repo, 'symbolic-ref', '-q', 'HEAD').decode().strip()
    except ValueError: selected = None
    return {'refs': refs(repo), 'symbolicRefs': pointers, 'head': head(repo), 'headSymbolic': selected,
            'objectFormat': git(repo, 'rev-parse', '--show-object-format').decode().strip()}

def validated_manifest(value, repo):
    required = {'schema', 'version', 'refs', 'symbolicRefs', 'head', 'headSymbolic', 'objectFormat', 'bundleSha256'}
    if not isinstance(value, dict) or set(value) != required or value['schema'] != 'athena-git-recovery' or value['version'] != 1:
        raise ValueError('Unsupported recovery manifest')
    if value['objectFormat'] not in ('sha1', 'sha256'): raise ValueError('Unsupported object format')
    size = 40 if value['objectFormat'] == 'sha1' else 64
    oid = lambda text: isinstance(text, str) and re.fullmatch('[a-f0-9]{'+str(size)+'}', text)
    if not oid(value['head']) or not isinstance(value['bundleSha256'],str) or not re.fullmatch('[a-f0-9]{64}',value['bundleSha256']):
        raise ValueError('Invalid object/hash')
    if not isinstance(value['refs'], list) or len(value['refs']) > 10000 or not isinstance(value['symbolicRefs'], dict):
        raise ValueError('Invalid reference collection')
    names=set()
    def check(name):
        if not isinstance(name,str) or not name.startswith('refs/') or name.startswith('refs/replace/'):
            raise ValueError('Unsafe reference')
        git(repo,'check-ref-format',name)
    for row in value['refs']:
        if not isinstance(row,str): raise ValueError('Invalid ref row')
        object_id, separator, name = row.partition(' ')
        if not separator or not oid(object_id) or name in names: raise ValueError('Invalid ref identity')
        check(name); names.add(name)
    for name,target in value['symbolicRefs'].items():
        check(name);check(target)
        if name not in names or target not in names: raise ValueError('Missing symbolic destination')
        seen={name}; cursor=target
        while cursor in value['symbolicRefs']:
            if cursor in seen: raise ValueError('Symbolic cycle')
            seen.add(cursor); cursor=value['symbolicRefs'][cursor]
    if value['headSymbolic'] is not None:
        check(value['headSymbolic'])
        if value['headSymbolic'] not in names: raise ValueError('Missing HEAD destination')
    return value

def restore(capsule, destination):
    # Validate archive members and size before writing any caller destination.
    capsule=Path(capsule)
    if not capsule.is_file() or capsule.is_symlink() or capsule.stat().st_size > MAX_BUNDLE + MAX_MANIFEST + 4096:
        raise ValueError('Invalid capsule file')
    with zipfile.ZipFile(capsule) as archive:
        members=archive.infolist()
        if len(members)!=2 or {m.filename for m in members}!={'history.bundle','manifest.json'}:
            raise ValueError('Unexpected archive members')
        for item in members:
            limit=MAX_BUNDLE if item.filename=='history.bundle' else MAX_MANIFEST
            if item.file_size>limit or item.compress_type!=zipfile.ZIP_STORED or item.flag_bits&1:
                raise ValueError('Unsupported archive entry')
        manifest=json.loads(archive.read('manifest.json').decode('utf-8'))
        with tempfile.TemporaryDirectory(prefix='athena-capsule-') as temporary:
            temp=Path(temporary); raw=temp/'history.bundle';raw.write_bytes(archive.read('history.bundle'))
            validated_manifest(manifest,temp)
            if checksum(raw)!=manifest['bundleSha256']:raise ValueError('Bundle digest mismatch')
            destination=Path(destination)
            destination.mkdir(mode=0o700)  # Exclusive, never reuse or overwrite any existing directory.
            git(destination,'init','--bare','--quiet','--object-format='+manifest['objectFormat'])
            git(destination,'bundle','verify',str(raw))
            git(destination,'-c','protocol.file.allow=always','fetch','--no-tags',str(raw),'refs/*:refs/*','HEAD')
            for name,target in manifest['symbolicRefs'].items():git(destination,'symbolic-ref',name,target)
            if manifest['headSymbolic'] is None:git(destination,'update-ref','--no-deref','HEAD',manifest['head'])
            else:git(destination,'symbolic-ref','HEAD',manifest['headSymbolic'])
            git(destination,'fsck','--full','--strict')
            expected={key:manifest[key] for key in ('refs','symbolicRefs','head','headSymbolic','objectFormat')}
            if reference_metadata(destination)!=expected:raise ValueError('Recovered metadata mismatch')
    return {'schemaVersion':1,'verified':True,'refCount':len(manifest['refs']),
            'symbolicRefCount':len(manifest['symbolicRefs']),'headSymbolicPreserved':manifest['headSymbolic'] is not None,
            'capsuleSha256':checksum(capsule),'retirementReady':False}

def verify(capsule):
    with tempfile.TemporaryDirectory(prefix='athena-capsule-verify-') as temporary:
        return restore(capsule,Path(temporary)/'restored.git')

def create(source, output):
    source=Path(source).resolve();output=Path(output).absolute()
    if output.parent.resolve().is_relative_to(source) or output.exists() or output.is_symlink():raise ValueError('Unsafe output')
    metadata=reference_metadata(source)
    with tempfile.TemporaryDirectory(prefix='athena-capsule-build-',dir=output.parent) as temporary:
        temp=Path(temporary);raw=temp/'history.bundle'
        create_bundle(source,raw)
        if reference_metadata(source)!=metadata:raise ValueError('Source changed')
        manifest={'schema':'athena-git-recovery','version':1,**metadata,'bundleSha256':checksum(raw)}
        encoded=json.dumps(manifest,sort_keys=True).encode('utf-8')
        if len(encoded)>MAX_MANIFEST or raw.stat().st_size>MAX_BUNDLE:raise ValueError('Recovery capsule budget exceeded')
        capsule=temp/'capsule.zip'
        with zipfile.ZipFile(capsule,'w',compression=zipfile.ZIP_STORED) as archive:
            archive.write(raw,'history.bundle');archive.writestr('manifest.json',encoded)
        result=verify(capsule)
        capsule.chmod(0o600);os.link(capsule,output)
    return result

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    sub=parser.add_subparsers(dest='command',required=True)
    build=sub.add_parser('create');build.add_argument('--source',type=Path,required=True);build.add_argument('--output',type=Path,required=True)
    check=sub.add_parser('verify');check.add_argument('capsule',type=Path)
    recover=sub.add_parser('restore');recover.add_argument('capsule',type=Path);recover.add_argument('--destination',type=Path,required=True)
    args=parser.parse_args()
    try:
        result=create(args.source,args.output) if args.command=='create' else (verify(args.capsule) if args.command=='verify' else restore(args.capsule,args.destination))
        print(json.dumps(result,indent=2));return 0
    except Exception:
        print(json.dumps({'verified':False,'error':'Recovery failed. Preserve source and capsule. Any new partial destination remains for inspection; existing destinations were not overwritten.','retirementReady':False}));return 2

if __name__=='__main__':raise SystemExit(main())
