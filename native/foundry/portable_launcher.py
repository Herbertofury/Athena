"""Launch a verified portable package with an explicitly selected external database."""
import argparse,hashlib,importlib.util,json,pathlib,sys

def verify(root):
    root=pathlib.Path(root).absolute()
    if any(p.is_symlink() for p in (root,*root.parents)):raise ValueError('Symlink package refused')
    manifest=root/'native-package.json'
    if manifest.is_symlink() or manifest.stat().st_size>1024*1024:raise ValueError('Invalid manifest')
    data=json.loads(manifest.read_text(encoding='utf-8'))
    if data.get('schema')!=1 or data.get('platform') not in ('windows','linux'):raise ValueError('Invalid platform')
    expected_binary='athena-foundry-store.exe' if data['platform']=='windows' else 'athena-foundry-store'
    if data.get('binary')!=expected_binary:raise ValueError('Invalid executable')
    names=set()
    for entry in data['files']:
        name=entry['path'];relative=pathlib.PurePosixPath(name)
        if relative.is_absolute() or str(relative)!=name or '\\' in name or '..' in relative.parts or name in names:raise ValueError('Invalid path')
        names.add(name);path=root/name
        if not path.is_file() or any(p.is_symlink() for p in (path,*path.parents)) or path.stat().st_size!=entry['bytes']:raise ValueError('Invalid file')
        h=hashlib.sha256()
        with path.open('rb') as stream:
            while chunk:=stream.read(1024*1024):h.update(chunk)
        if h.hexdigest()!=entry['sha256']:raise ValueError('Integrity mismatch')
    if not {expected_binary,'bridge.py','launch.py'}<=names:raise ValueError('Incomplete package')
    actual={p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file() or p.is_symlink()}
    if actual!=names|{'native-package.json'}:raise ValueError('Unexpected package content')
    return data

def main():
    sys.dont_write_bytecode=True
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--database');p.add_argument('--verify-only',action='store_true');a=p.parse_args()
    root=pathlib.Path(__file__).resolve().parent
    try:
        data=verify(root)
        if a.verify_only:print('Package file integrity verified; no executable or database opened.');return
        if not a.database:raise ValueError('Explicit database required')
        database=pathlib.Path(a.database).absolute()
        if not database.is_file() or any(x.is_symlink() for x in (database,*database.parents)) or root==database or root in database.parents:raise ValueError('External regular database required')
        if (sys.platform=='win32')!=(data['platform']=='windows') or sys.platform not in ('win32','linux'):raise ValueError('Platform mismatch')
        spec=importlib.util.spec_from_file_location('athena_portable_bridge',root/'bridge.py');bridge=importlib.util.module_from_spec(spec);spec.loader.exec_module(bridge)
        server=bridge.Bridge(root/data['binary'],database,root/'runtime')
    except (OSError,ValueError,KeyError,TypeError):p.exit(2,'Launch refused: verify package, platform and external existing database. No automatic repair or upgrade.\n')
    print(server.origin+'/#build',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
if __name__=='__main__':main()
