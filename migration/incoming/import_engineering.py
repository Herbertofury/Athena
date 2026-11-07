"""Verified, conflict-refusing import of the authorized public Atlas snapshot."""
from pathlib import Path, PurePosixPath
import hashlib, json, os, stat, sys, zipfile
ARCHIVE_SHA256 = '9fab5ca27ace20d317f7a8c6acf2c45e3bb513a5d1ed2894050ba1cdcea94298'
ROOT = Path(__file__).resolve().parents[2]
ARCHIVE = Path(__file__).with_name('engineering-atlas-files.zip')
def allowed(name):
    p = PurePosixPath(name)
    return str(p) == name and chr(92) not in name and chr(0) not in name and not p.is_absolute() and '..' not in p.parts and '\\' not in name and (name.startswith('engineering/') or name.startswith('migration/engineering-atlas/') or (name.startswith('wiki/Engineering-') and name.endswith('.md')) or name == '.github/workflows/athena-engineering-checks.yml')
def run(root=ROOT, archive=ARCHIVE, expected=ARCHIVE_SHA256):
    payload=archive.read_bytes()
    if hashlib.sha256(payload).hexdigest()!=expected:raise ValueError('Archive digest mismatch')
    plans=[]
    skipped_workflow='.github/workflows/athena-engineering-checks.yml'
    with zipfile.ZipFile(archive) as z:
        manifest=json.loads(z.read('IMPORT-MANIFEST.json'))
        if manifest.get('format')!='athena-engineering-import-v1':raise ValueError('Unknown import format')
        rows=manifest['files']; names=[r['path'] for r in rows]
        if len(rows)>2000 or len(set(names))!=len(names):raise ValueError('Duplicate or excessive entries')
        if set(z.namelist()) != set(names)|{'IMPORT-MANIFEST.json'} or len(z.namelist())!=len(names)+1:raise ValueError('Unexpected ZIP entry')
        if sum(x.file_size for x in z.infolist())>50_000_000:raise ValueError('Import exceeds bounded size')
        for r in rows:
            name=r['path']
            if not allowed(name) or r['mode'] not in ('100644','100755'):raise ValueError('Disallowed import target')
            info=z.getinfo(name)
            if stat.S_ISLNK(info.external_attr>>16) or info.is_dir():raise ValueError('Non-file import target')
            data=z.read(name)
            if len(data)!=r['bytes'] or hashlib.sha256(data).hexdigest()!=r['sha256']:raise ValueError('Entry digest mismatch')
            if hashlib.sha1(f'blob {len(data)}\0'.encode()+data).hexdigest()!=r['sha']:raise ValueError('Git blob digest mismatch')
            if name == skipped_workflow:
                continue  # Preserve in the archive; this token may not publish workflow files.
            dest=root/name
            for ancestor in [dest,*dest.parents]:
                if ancestor==root.parent:break
                if ancestor.is_symlink():raise ValueError('Symlink path refused')
            if dest.exists() and (not dest.is_file() or dest.read_bytes()!=data):raise ValueError('Existing file conflict: '+name)
            plans.append((dest,data,r['mode']))
        for r in manifest['separate_history_files']:
            p=root/r['path']
            if not allowed(r['path']) or not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest()!=r['sha256']:raise ValueError('Separate history archive missing or changed')
    # No extraction occurs until every path, hash and conflict was checked.
    added=0
    for p,data,mode in plans:
        if p.exists():continue
        p.parent.mkdir(parents=True,exist_ok=True)
        with p.open('xb') as f:f.write(data)
        p.chmod(0o755 if mode=='100755' else 0o644);added+=1
    print(json.dumps({'verified_entries':len(plans),'added':added,'workflow_not_published':skipped_workflow,'archive_sha256':expected}))
    return len(plans),added
if __name__=='__main__':run()
