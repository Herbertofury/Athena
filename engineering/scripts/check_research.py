#!/usr/bin/env python3
"""Offline source/structure checks; not external-link or factual validation."""
from pathlib import Path
from urllib.parse import urlsplit,unquote
import datetime as dt,json,re,sys
ROOT=Path(__file__).resolve().parents[1]
import importlib.util
_registry_spec = importlib.util.spec_from_file_location('atlas_source_registry', Path(__file__).with_name('source_registry.py'))
_registry_module = importlib.util.module_from_spec(_registry_spec)
_registry_spec.loader.exec_module(_registry_module)
load_sources = _registry_module.load_sources


def validate_sources(rows,today):
    if not isinstance(rows,list) or not rows:raise ValueError('source register must be a nonempty list')
    ids=set();stale=[]
    for row in rows:
        if not isinstance(row,dict):raise ValueError('source must be an object')
        ident=row.get('id')
        if not isinstance(ident,str) or not re.fullmatch(r'[A-Z]+[0-9]+',ident) or ident in ids:raise ValueError('invalid/duplicate source ID')
        ids.add(ident)
        for key in ('title','observed_version','topic','note'):
            if not isinstance(row.get(key),str) or not row[key].strip():raise ValueError(f'{ident}: missing {key}')
        u=urlsplit(row.get('url',''))
        if u.scheme!='https' or not u.hostname or u.username or u.password:raise ValueError(f'{ident}: clean HTTPS source URL required')
        if row.get('evidence')!='primary_documented':raise ValueError(f'{ident}: no unsupported evidence promotion')
        checked=dt.date.fromisoformat(row['checked_at'])
        if checked>today:raise ValueError(f'{ident}: future review date')
        interval=row.get('review_after_days')
        if isinstance(interval,bool) or not isinstance(interval,int) or not 1<=interval<=365:raise ValueError(f'{ident}: invalid review interval')
        if (today-checked).days>interval:stale.append(ident)
    return ids,stale

def utc_today():
    """Source review dates use UTC, independent of executor local timezone."""
    return dt.datetime.now(dt.timezone.utc).date()

def check(root=ROOT,today=None):
    ids,stale=validate_sources(load_sources(root),today or utc_today())
    failures=[];files=list(root.rglob('*.md'))
    for path in files:
        text=path.read_text()
        for ref in re.findall(r'\[([A-Z]+[0-9]+)\]',text):
            if ref not in ids:failures.append(f'{path.relative_to(root)}: unknown source {ref}')
        for link in re.findall(r'\[[^\]]*\]\(([^)]+)\)',text):
            u=urlsplit(link)
            if u.scheme or link.startswith('#'):continue
            target=(path.parent/unquote(u.path)).resolve()
            if not target.is_relative_to(root.resolve()) or not target.exists():failures.append(f'{path.relative_to(root)}: broken local link {link}')
    if failures:raise ValueError('\n'.join(failures))
    return {'sources':len(ids),'markdown_files':len(files),'stale_source_ids':stale,'scope':'Offline structure only; external availability and factual accuracy require review.'}
if __name__=='__main__':
    try:print(json.dumps(check(),indent=2))
    except (ValueError,KeyError,TypeError) as e:print(e,file=sys.stderr);sys.exit(1)
