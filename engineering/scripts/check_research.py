#!/usr/bin/env python3
"""Offline source/structure checks; not external-link or factual validation."""
from pathlib import Path, PureWindowsPath
from urllib.parse import urlsplit,unquote
import datetime as dt,json,re,sys
ROOT=Path(__file__).resolve().parents[1]
import importlib.util
_registry_spec = importlib.util.spec_from_file_location('atlas_source_registry', Path(__file__).resolve().with_name('source_registry.py'))
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

def valid_local_link(source, url_path, link_root):
    """Resolve within the caller-selected scope before checking existence.

    Offline validation only: not protection against concurrent path replacement.
    """
    decoded = unquote(url_path)
    if ('\\' in decoded or any(ord(c) < 32 or ord(c) == 127 for c in decoded)
            or Path(decoded).is_absolute() or PureWindowsPath(decoded).drive):
        return False
    try:
        target = (source.parent / decoded).resolve() if decoded else source
        return target.is_relative_to(link_root) and target.exists()
    except (OSError, RuntimeError, ValueError):
        return False


def check(root=ROOT,today=None,link_root=None):
    root = Path(root)
    if root.is_symlink():
        raise ValueError('Research root must not be a symlink')
    root = root.resolve()
    if link_root is None:
        # Preserve Athena's existing repository-wide migration links. A custom
        # fixture root cannot self-authorize this by copying the marker layout.
        link_root = root.parent if root == ROOT and (ROOT.parent / "migration/engineering-atlas").is_dir() else root
    link_root = Path(link_root).resolve()
    ids,stale=validate_sources(load_sources(root),today or utc_today())
    failures=[];files=list(root.rglob('*.md'))
    for path in files:
        try:
            source = path.resolve(strict=True)
            if not source.is_relative_to(root):
                raise ValueError('source escapes Engineering root')
            text = source.read_text()
        except (OSError, RuntimeError, ValueError) as error:
            failures.append(f'{path.relative_to(root)}: unreadable or escaped Markdown source ({type(error).__name__})')
            continue
        for ref in re.findall(r'\[([A-Z]+[0-9]+)\]',text):
            if ref not in ids:failures.append(f'{path.relative_to(root)}: unknown source {ref}')
        for link in re.findall(r'\[[^\]]*\]\(([^)]+)\)',text):
            if (any(ord(c) < 32 or ord(c) == 127 for c in link)
                    or PureWindowsPath(link).drive):
                failures.append(f'{path.relative_to(root)}: broken local link {link}')
                continue
            try:
                u = urlsplit(link)
            except ValueError:
                failures.append(f'{path.relative_to(root)}: broken local link {link}')
                continue
            if u.scheme.lower() == 'file':
                failures.append(f'{path.relative_to(root)}: broken local link {link}')
                continue
            if u.scheme or link.startswith('#'):continue
            if u.netloc or not valid_local_link(path, u.path, link_root):
                failures.append(f'{path.relative_to(root)}: broken local link {link}')
    if failures:raise ValueError('\n'.join(failures))
    return {'sources':len(ids),'markdown_files':len(files),'stale_source_ids':stale,'scope':'Offline structure only; external availability and factual accuracy require review.'}
if __name__=='__main__':
    try:print(json.dumps(check(),indent=2))
    except (ValueError,KeyError,TypeError) as e:print(e,file=sys.stderr);sys.exit(1)
