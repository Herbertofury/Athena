"""Launch a verified portable package with an explicitly selected external database."""
import argparse,hashlib,importlib.util,json,pathlib,sys,os,subprocess,tempfile

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
    if not {expected_binary,'bridge.py','launch.py','sqlite_backup.py'}<=names:raise ValueError('Incomplete package')
    actual={p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file() or p.is_symlink()}
    if actual!=names|{'native-package.json'}:raise ValueError('Unexpected package content')
    return data

def create_database(root,data,destination):
    destination=pathlib.Path(destination).absolute()
    root=pathlib.Path(root).absolute()
    if root in destination.parents or not destination.parent.is_dir() or any(p.is_symlink() for p in (destination,*destination.parents)) or os.path.lexists(destination):
        raise ValueError('New external database required')
    binary=root/data['binary']
    # Stage on the destination filesystem. Never upgrade or open an existing target.
    with tempfile.TemporaryDirectory(prefix='.athena-first-run-',dir=destination.parent) as temporary:
        staged=pathlib.Path(temporary)/'new.sqlite3'
        def run(command):
            result=subprocess.run([str(binary),command,str(staged)],capture_output=True,timeout=15,check=True)
            return result.stdout.decode('utf-8',errors='strict')
        run('init')
        for suffix in ('history','soundtracks','transforms','scopes','environment','targets','instances','appearance','filters','origins','environments','blend-modes','music-precision'):
            run('upgrade-'+suffix)
        status=json.loads(run('status'))
        if status.get('schema')!=15 or status.get('integrity')!='ok':raise ValueError('Native setup verification failed')
        if any(os.path.lexists(str(staged)+suffix) for suffix in ('-wal','-shm','-journal')):raise ValueError('Native setup is not standalone')
        # Exclusive publication, unlike rename which can replace an existing target.
        # If hard links are unsupported, refuse rather than degrade to overwrite/copy.
        os.link(staged,destination)
    return {'created':True,'schema':15,'integrity':'ok','existing_database_modified':False}

def backup_database(root,data,source,destination,quiescent=False):
    root=pathlib.Path(root).absolute();source=pathlib.Path(source).absolute();destination=pathlib.Path(destination).absolute()
    if not quiescent:raise ValueError('Stop source writes and assert quiescence')
    for path in (source,destination):
        if root in path.parents or any(p.is_symlink() for p in (path,*path.parents)):raise ValueError('External non-symlink paths required')
    if not source.is_file() or not destination.parent.is_dir() or os.path.lexists(destination):raise ValueError('Existing source and new destination required')
    if str(destination) in {str(source)+suffix for suffix in ('','-wal','-shm','-journal')}:raise ValueError('Source aliases refused')
    with tempfile.TemporaryDirectory(prefix='.athena-backup-',dir=destination.parent) as temporary:
        staged=pathlib.Path(temporary)/'backup.sqlite3'
        result=subprocess.run([sys.executable,'-B',str(root/'sqlite_backup.py'),'--source',str(source),'--destination',str(staged),'--scratch',temporary,'--source-quiescent'],capture_output=True,timeout=30,check=True)
        receipt=json.loads(result.stdout.decode('utf-8',errors='strict'))
        status_result=subprocess.run([str(root/data['binary']),'status',str(staged)],capture_output=True,timeout=15,check=True)
        status=json.loads(status_result.stdout.decode('utf-8',errors='strict'))
        if status.get('integrity')!='ok' or not 2<=status.get('schema',0)<=15:raise ValueError('Native backup not verified')
        if any(os.path.lexists(str(staged)+suffix) for suffix in ('-wal','-shm','-journal')):raise ValueError('Backup not standalone')
        if hashlib.sha256(staged.read_bytes()).hexdigest()!=receipt.get('destination_sha256'):raise ValueError('Backup changed after preparation')
        os.link(staged,destination)
    return {'backed_up':True,'schema':status['schema'],'integrity':'ok','bytes':receipt['destination_bytes'],
        'sha256':receipt['destination_sha256'],'source_unchanged_at_checks':receipt['source_unchanged_at_checks'],
        'source_wal_present':receipt['source_wal_present'],'restored':False}

def main():
    sys.dont_write_bytecode=True
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--database');p.add_argument('--create-database');p.add_argument('--backup-database');p.add_argument('--backup-destination');p.add_argument('--source-quiescent',action='store_true');p.add_argument('--verify-only',action='store_true');a=p.parse_args()
    root=pathlib.Path(__file__).resolve().parent
    try:
        data=verify(root)
        if sum((bool(a.database),bool(a.create_database),bool(a.backup_database),a.verify_only))!=1:raise ValueError('Choose one operation')
        if bool(a.backup_database)!=bool(a.backup_destination) or (a.source_quiescent and not a.backup_database):raise ValueError('Backup arguments required together')
        if a.verify_only:print('Package file integrity verified; no executable or database opened.');return
        if (sys.platform=='win32')!=(data['platform']=='windows') or sys.platform not in ('win32','linux'):raise ValueError('Platform mismatch')
        if a.backup_database:
            print(json.dumps(backup_database(root,data,a.backup_database,a.backup_destination,a.source_quiescent)));return
        if a.create_database:
            print(json.dumps(create_database(root,data,a.create_database)));return
        if not a.database:raise ValueError('Explicit database required')
        database=pathlib.Path(a.database).absolute()
        if not database.is_file() or any(x.is_symlink() for x in (database,*database.parents)) or root==database or root in database.parents:raise ValueError('External regular database required')
        if (sys.platform=='win32')!=(data['platform']=='windows') or sys.platform not in ('win32','linux'):raise ValueError('Platform mismatch')
        spec=importlib.util.spec_from_file_location('athena_portable_bridge',root/'bridge.py');bridge=importlib.util.module_from_spec(spec);spec.loader.exec_module(bridge)
        server=bridge.Bridge(root/data['binary'],database,root/'runtime')
    except (OSError,ValueError,KeyError,TypeError,subprocess.SubprocessError):p.exit(2,'Launch refused: verify package, platform and external existing database. No automatic repair or existing-database upgrade.\n')
    print(server.origin+'/#build',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
if __name__=='__main__':main()
