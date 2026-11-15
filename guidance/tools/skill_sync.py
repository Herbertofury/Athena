#!/usr/bin/env python3
"""Explicit reviewed Athena Skill copies. No discovery, execution or client grants.

Trusted quiescent directories only. Retain the transaction directory as local
recovery evidence; exception rollback is not crash/power-loss atomicity.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import stat
import tempfile
from skill_preflight import inspect

MARKER = '.athena-skill-install.json'
MAX_BYTES = 32 * 1024 * 1024
MAX_SKILLS = 16
DEVICES = {'CON','PRN','AUX','NUL',*[f'COM{i}' for i in range(10)],*[f'LPT{i}' for i in range(10)]}

def portable(part):
    return bool(re.fullmatch(r'[A-Za-z0-9_.-]+',part)) and part not in ('.','..') and not part.endswith(('.', ' ')) and part.split('.')[0].upper() not in DEVICES

def sha(data):return hashlib.sha256(data).hexdigest()
def encoded(data):return (json.dumps(data,sort_keys=True,indent=2)+'\n').encode()
def safe(path):
    path=Path(path).absolute()
    if '..' in path.parts:raise ValueError('parent components refused')
    for item in (path,*path.parents):
        if os.path.lexists(item):
            info=item.lstat()
            if stat.S_ISLNK(info.st_mode) or getattr(info,'st_file_attributes',0)&0x400:
                raise ValueError('linked/reparse path refused')
    return path

def tree(root, installed=False):
    root=safe(root); report=inspect(root)
    if not report['structuralPass']:raise ValueError('Skill structural review required')
    files={};total=0
    for row in report['files']:
        name=row['path']
        if name==MARKER:
            if not installed:raise ValueError('source contains managed marker')
            continue
        for part in Path(name).parts:
            if not portable(part):
                raise ValueError('nonportable Skill path')
        path=safe(root/name)
        with path.open('rb') as f:data=f.read(MAX_BYTES+1)
        total+=len(data)
        if total>MAX_BYTES:raise ValueError('Skill byte budget')
        files[name]=data
    if len({p.casefold() for p in files})!=len(files):raise ValueError('case-aliased paths')
    hashes={p:sha(b) for p,b in sorted(files.items())}
    return files,hashes

def marker(root):
    path=safe(root/MARKER)
    with path.open('rb') as f:data=f.read(1024*1024+1)
    if len(data)>1024*1024:raise ValueError('marker budget')
    value=json.loads(data)
    if not isinstance(value,dict) or type(value.get('schema')) is not int or value.get('schema')!=1 or value.get('managedBy')!='athena':raise ValueError('unmanaged destination')
    return value,data

def prepare(sources,target,own_recovery=None):
    target=safe(target)
    if not target.is_dir():raise ValueError('existing explicit target root required')
    if not 1<=len(sources)<=MAX_SKILLS:raise ValueError('select one to sixteen Skills')
    entries=[]
    with os.scandir(target) as scan:
        for entry in scan:
            entries.append(Path(entry.path))
            if len(entries)>2000:raise ValueError('target inventory budget')
    for entry in entries:
        if entry.name.startswith('.athena-skill-recovery-') and entry!=own_recovery:
            receipt=safe(entry/'receipt.json')
            with receipt.open('rb') as f:raw=f.read(1024*1024+1)
            if len(raw)>1024*1024 or json.loads(raw).get('state') not in ('committed','rolled-back'):
                raise ValueError('unresolved recovery; preserve and inspect')
    rows=[];payloads={};total=0;names=set()
    for raw in sources:
        source=safe(raw);name=source.name
        if not portable(name):raise ValueError('nonportable Skill name')
        if name.casefold() in names:raise ValueError('duplicate Skill name')
        names.add(name.casefold())
        if source==target or source.is_relative_to(target) or target.is_relative_to(source):raise ValueError('separate source and target required')
        files,hashes=tree(source);total+=sum(map(len,files.values()))
        if total>MAX_BYTES:raise ValueError('batch byte budget')
        dest=safe(target/name);old_hashes=None;old_marker=None
        if os.path.lexists(dest):
            if not dest.is_dir():raise ValueError('unmanaged destination')
            existing,old_marker=marker(dest);_,old_hashes=tree(dest,True)
            if existing.get('name')!=name or existing.get('files')!=old_hashes:raise ValueError('locally edited or invalid managed Skill')
        row={'name':name,'source':str(source),'destination':str(dest),'files':hashes,'oldFiles':old_hashes,'oldMarkerSha256':sha(old_marker) if old_marker else None,
             'action':'create' if old_hashes is None else 'noop' if old_hashes==hashes else 'update'}
        rows.append(row);payloads[name]=files
    # Detect case aliases already on disk, even on case-sensitive hosts.
    for row in rows:
        if any(p.name.casefold()==row['name'].casefold() and p.name!=row['name'] for p in entries):raise ValueError('target name alias')
    plan={'schema':1,'target':str(target),'skills':rows,'scope':'Local private paths; review complete Skill contents/rights and client compatibility before apply. No execution or permission grant.'}
    plan['reviewSha256']=sha(encoded(plan))
    return plan,payloads

def apply(sources,target,expected):
    plan,payloads=prepare(sources,target)
    if expected!=plan['reviewSha256']:raise ValueError('review changed; no writes')
    again,data=prepare(sources,target)
    if again!=plan or data!=payloads:raise ValueError('inputs changed; no writes')
    rows=[r for r in plan['skills'] if r['action']!='noop']
    if not rows:return {'changed':False,'retirementReady':False}
    root=Path(target).absolute()
    # Retained outside active Skill folders; verify client hidden-folder discovery separately.
    recovery=Path(tempfile.mkdtemp(prefix='.athena-skill-recovery-',dir=root))
    (recovery/'receipt.json').write_bytes(encoded({'state':'preparing','plan':plan}))
    moved=[];published=[];new_markers={}
    try:
        for row in rows:
            name=row['name'];stage=recovery/('new-'+name);stage.mkdir()
            for relative,body in payloads[name].items():
                path=stage/relative;path.parent.mkdir(parents=True,exist_ok=True)
                with path.open('xb') as f:f.write(body)
            new_markers[name]=encoded({'schema':1,'managedBy':'athena','name':name,'files':row['files'],'sourceDigest':sha(encoded(row['files']))})
            (stage/MARKER).write_bytes(new_markers[name])
        # Revalidate full input immediately before any installed path is moved.
        check,_=prepare(sources,target,own_recovery=recovery)
        if check!=plan:raise ValueError('inputs changed during staging')
        for row in rows:
            name=row['name'];dest=safe(root/name)
            if row['oldFiles'] is not None:
                dest.rename(recovery/('old-'+name));moved.append(name)
            elif os.path.lexists(dest):raise ValueError('destination appeared')
            (recovery/('new-'+name)).rename(dest);published.append(name)
        (recovery/'receipt.json').write_bytes(encoded({'state':'committed','plan':plan}))
    except (Exception,KeyboardInterrupt):
        incomplete=False
        for name in reversed(published):
            try:
                _,actual=tree(root/name,True)
                if actual!={p:sha(b) for p,b in payloads[name].items()} or marker(root/name)[1]!=new_markers[name]:raise ValueError('published Skill changed; preserve')
                (root/name).rename(recovery/('failed-new-'+name))
            except (Exception,KeyboardInterrupt):incomplete=True
        for name in reversed(moved):
            try:
                if os.path.lexists(root/name):raise ValueError('destination occupied; preserve')
                (recovery/('old-'+name)).rename(root/name)
            except (Exception,KeyboardInterrupt):incomplete=True
        (recovery/'receipt.json').write_bytes(encoded({'state':'rollback-incomplete' if incomplete else 'rolled-back','plan':plan}))
        raise
    return {'changed':True,'recoveryDirectory':str(recovery),'retirementReady':False,'scope':'Retained previous copies; no client discovery/execution, global settings or source changes. Review acceptance in actual client separately.'}

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('command',choices=['plan','status','apply']);p.add_argument('--source',type=Path,action='append',required=True);p.add_argument('--target-root',type=Path,required=True);p.add_argument('--review-sha256');a=p.parse_args()
    try:
        result=apply(a.source,a.target_root,a.review_sha256) if a.command=='apply' else prepare(a.source,a.target_root)[0]
        print(json.dumps(result,indent=2));return 2 if a.command=='status' and any(r['action']!='noop' for r in result['skills']) else 0
    except (OSError,ValueError,KeyError,TypeError):
        print(json.dumps({'error':'Sync incomplete. Preserve selected paths and all recovery directories; inspect locally. No successful installation is claimed.'}));return 3
if __name__=='__main__':raise SystemExit(main())
