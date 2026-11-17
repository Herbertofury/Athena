"""Launch a verified portable package with an explicitly selected external database."""
import argparse,hashlib,importlib.util,json,pathlib,sys,os,subprocess,tempfile,sqlite3,types,re,stat

def external_path(value):
    path=pathlib.Path(value)
    # absolute() retains parent components, which can evade lexical package checks.
    # Reject rather than resolve so existing symlink checks are never bypassed.
    if '..' in path.parts:raise ValueError('Parent path components are not allowed; use a direct external path')
    return path.absolute()

def destination_clear(destination):
    # Refuse stale recovery state as well as an existing main file. Checks are
    # for trusted private directories, not protection against hostile path races.
    if any(os.path.lexists(str(destination)+suffix) for suffix in ('','-wal','-shm','-journal')):
        raise FileExistsError('Destination database or sidecar exists; preserve it and choose a new name')

def portable_name(name):
    if not isinstance(name,str) or not name or len(name)>512 or any(ord(c)<32 or ord(c)>126 for c in name):return False
    relative=pathlib.PurePosixPath(name)
    if relative.is_absolute() or str(relative)!=name or '..' in relative.parts or any(c in name for c in '\\:<>"|?*'):return False
    reserved={'CON','PRN','AUX','NUL','CONIN$','CONOUT$'}|{f'{prefix}{n}' for prefix in ('COM','LPT') for n in range(1,10)}
    return all(part and part[-1] not in '. ' and part.split('.')[0].upper() not in reserved for part in relative.parts)

def link_or_reparse(path):
    metadata=path.lstat()
    return stat.S_ISLNK(metadata.st_mode) or bool(getattr(metadata,'st_file_attributes',0)&0x400)

def verify(root):
    root=pathlib.Path(root).absolute()
    if any(link_or_reparse(p) for p in (root,*root.parents)):raise ValueError('Symlink package refused')
    manifest=root/'native-package.json'
    if link_or_reparse(manifest) or not manifest.is_file() or manifest.stat().st_size>1024*1024:raise ValueError('Invalid manifest')
    with manifest.open('rb') as stream:payload=stream.read(1024*1024+1)
    if len(payload)>1024*1024:raise ValueError('Invalid manifest')
    data=json.loads(payload.decode('utf-8'))
    if not isinstance(data,dict):raise ValueError('Invalid manifest object')
    if type(data.get('schema')) is not int or data.get('schema')!=1 or data.get('platform') not in ('windows','linux'):raise ValueError('Invalid platform')
    expected_binary='athena-foundry-store.exe' if data['platform']=='windows' else 'athena-foundry-store'
    if data.get('binary')!=expected_binary:raise ValueError('Invalid executable')
    engine=data.get('engine')
    if engine is not None:
        if data.get('profile')!='unified' or engine!=('atlas-lab.exe' if data['platform']=='windows' else 'atlas-lab'):raise ValueError('Invalid engine profile')
    elif 'profile' in data:raise ValueError('Unsupported profile')
    entries=data.get('files')
    if not isinstance(entries,list) or not 1<=len(entries)<=2000:raise ValueError('Invalid file inventory')
    names=set();aliases=set();total=0
    # Validate the entire inventory before consulting any listed path. The manifest
    # is an integrity record, not authority to inspect paths outside the package.
    for entry in entries:
        if not isinstance(entry,dict):raise ValueError('Invalid entry')
        name=entry.get('path');size=entry.get('bytes');digest=entry.get('sha256')
        if not portable_name(name) or name.casefold() in aliases or name.casefold()=='native-package.json':raise ValueError('Invalid path')
        if type(size) is not int or not 0<=size<=600*1024*1024:raise ValueError('Invalid file size')
        if not isinstance(digest,str) or not re.fullmatch('[0-9a-f]{64}',digest):raise ValueError('Invalid digest')
        total+=size
        if total>600*1024*1024:raise ValueError('Package byte bound exceeded')
        names.add(name);aliases.add(name.casefold())
    for entry in entries:
        path=root/entry['path']
        if any(link_or_reparse(p) for p in (path,*path.parents)):raise ValueError('Invalid file')
        metadata=path.stat()
        if not stat.S_ISREG(metadata.st_mode) or metadata.st_size!=entry['bytes']:raise ValueError('Invalid file')
        h=hashlib.sha256();remaining=entry['bytes']
        with path.open('rb') as stream:
            while remaining:
                chunk=stream.read(min(1024*1024,remaining))
                if not chunk:raise ValueError('File changed during verification')
                remaining-=len(chunk);h.update(chunk)
            if stream.read(1):raise ValueError('File changed during verification')
        if h.hexdigest()!=entry['sha256']:raise ValueError('Integrity mismatch')
    if not {expected_binary,'bridge.py','launch.py','sqlite_backup.py'}<=names:raise ValueError('Incomplete package')
    if engine and not {engine,'portable_process.py','runtime/athena-runtime-manifest.json','runtime/learn/index.html','runtime/.nojekyll'}<=names:raise ValueError('Incomplete unified profile')
    actual=set();pending=[root];visited=0
    while pending:
        directory=pending.pop()
        with os.scandir(directory) as children:
            for child in children:
                visited+=1
                if visited>4000:raise ValueError('Package traversal bound exceeded')
                path=pathlib.Path(child.path);metadata=child.stat(follow_symlinks=False)
                if stat.S_ISLNK(metadata.st_mode) or getattr(metadata,'st_file_attributes',0)&0x400:raise ValueError('Package link or reparse point refused')
                if stat.S_ISDIR(metadata.st_mode):pending.append(path)
                elif stat.S_ISREG(metadata.st_mode):actual.add(path.relative_to(root).as_posix())
                else:raise ValueError('Unexpected package entry')
    if actual!=names|{'native-package.json'}:raise ValueError('Unexpected package content')
    return data

def create_database(root,data,destination):
    destination=external_path(destination)
    root=pathlib.Path(root).absolute()
    if root in destination.parents or not destination.parent.is_dir() or any(p.is_symlink() for p in (destination,*destination.parents)) or os.path.lexists(destination):
        raise ValueError('New external database required')
    destination_clear(destination)
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
        destination_clear(destination)
        os.link(staged,destination)
    return {'created':True,'schema':15,'integrity':'ok','existing_database_modified':False}

def backup_database(root,data,source,destination,quiescent=False,upgrade=False):
    root=pathlib.Path(root).absolute();source=external_path(source);destination=external_path(destination)
    if not quiescent:raise ValueError('Stop source writes and assert quiescence')
    for path in (source,destination):
        if root in path.parents or any(p.is_symlink() for p in (path,*path.parents)):raise ValueError('External non-symlink paths required')
    if not source.is_file() or not destination.parent.is_dir() or os.path.lexists(destination):raise ValueError('Existing source and new destination required')
    destination_clear(destination)
    if str(destination) in {str(source)+suffix for suffix in ('','-wal','-shm','-journal')}:raise ValueError('Source aliases refused')
    with tempfile.TemporaryDirectory(prefix='.athena-backup-',dir=destination.parent) as temporary:
        staged=pathlib.Path(temporary)/'backup.sqlite3'
        result=subprocess.run([sys.executable,'-B',str(root/'sqlite_backup.py'),'--source',str(source),'--destination',str(staged),'--scratch',temporary,'--source-quiescent'],capture_output=True,timeout=30,check=True)
        receipt=json.loads(result.stdout.decode('utf-8',errors='strict'))
        status_result=subprocess.run([str(root/data['binary']),'status',str(staged)],capture_output=True,timeout=15,check=True)
        status=json.loads(status_result.stdout.decode('utf-8',errors='strict'))
        if status.get('integrity')!='ok' or not 2<=status.get('schema',0)<=15:raise ValueError('Native backup not verified')
        if hashlib.sha256(staged.read_bytes()).hexdigest()!=receipt.get('destination_sha256'):raise ValueError('Backup changed after preparation')
        original_schema=status['schema']
        if upgrade:
            upgrades=('history','soundtracks','transforms','scopes','environment','targets','instances','appearance','filters','origins','environments','blend-modes','music-precision')
            for suffix in upgrades[original_schema-2:]:
                subprocess.run([str(root/data['binary']),'upgrade-'+suffix,str(staged)],capture_output=True,timeout=15,check=True)
            final=subprocess.run([str(root/data['binary']),'status',str(staged)],capture_output=True,timeout=15,check=True)
            status=json.loads(final.stdout.decode('utf-8',errors='strict'))
            if status.get('schema')!=15 or status.get('integrity')!='ok':raise ValueError('Upgrade verification failed')
            # Recheck raw source bytes after all transformations. No SQLite source open.
            capture=types.ModuleType('athena_upgrade_capture')
            exec(compile((root/'sqlite_backup.py').read_bytes(),'sqlite_backup.py','exec'),capture.__dict__)
            if capture.digest(capture.capture(source))!=receipt['source_file_hashes']:raise ValueError('Source changed during upgrade')
        if any(os.path.lexists(str(staged)+suffix) for suffix in ('-wal','-shm','-journal')):raise ValueError('Backup not standalone')
        payload=staged.read_bytes();final_sha=hashlib.sha256(payload).hexdigest()
        if not upgrade and final_sha!=receipt.get('destination_sha256'):raise ValueError('Backup changed after preparation')
        destination_clear(destination)
        os.link(staged,destination)
    return {'backed_up':True,'upgraded_copy':upgrade,'source_schema':original_schema,'schema':status['schema'],'integrity':'ok','bytes':len(payload),
        'sha256':final_sha,'source_unchanged_at_checks':receipt['source_unchanged_at_checks'],
        'source_wal_present':receipt['source_wal_present'],'sqlite_runtime':receipt['sqlite_runtime'],'restored':False}

def checkpoint_stores(root,data,native,journal,destination,quiescent=False,expected_source_hashes=None,parent_checkpoint_sha256=None):
    """Explicit stopped-source copies, not an atomic live snapshot or restore."""
    if not quiescent or data.get('profile')!='unified':raise ValueError('Stopped unified profile required')
    root=pathlib.Path(root).absolute();sources=[external_path(native),external_path(journal)];destination=external_path(destination)
    if os.path.lexists(destination) or not destination.parent.is_dir() or root==destination or root in destination.parents:raise ValueError('New external checkpoint directory required')
    if any(link_or_reparse(p) for p in destination.parents):raise ValueError('Checkpoint ancestors must not be links')
    families=[]
    for source in sources:
        if root==source or root in source.parents or not source.is_file():raise ValueError('Existing external stores required')
        if any(link_or_reparse(p) for p in (source,*source.parents)):raise ValueError('Store ancestors must not be links')
        family=[pathlib.Path(str(source)+suffix) for suffix in ('','-wal','-shm','-journal')]
        for path in family:
            if os.path.lexists(path) and link_or_reparse(path):raise ValueError('Store sidecar link refused')
        families.append(family)
    # Reject reserved-path and inode overlaps, including aliases within one family.
    all_paths=families[0]+families[1]
    if destination in all_paths:raise ValueError('Checkpoint directory must not occupy a source sidecar path')
    for index,path in enumerate(all_paths):
        for other in all_paths[index+1:]:
            if path==other or (path.exists() and other.exists() and os.path.samefile(path,other)):raise ValueError('Store ownership overlap')
    capture=types.ModuleType('athena_checkpoint_capture')
    exec(compile((root/'sqlite_backup.py').read_bytes(),'sqlite_backup.py','exec'),capture.__dict__)
    identities=[capture.digest(capture.capture(path)) for path in sources]
    if expected_source_hashes is not None and identities!=expected_source_hashes:raise ValueError('Checkpoint changed after receipt verification')
    names=('foundry.sqlite3','engineering.sqlite3');receipts=[]
    with tempfile.TemporaryDirectory(prefix='.athena-checkpoint-',dir=destination.parent) as temporary:
        stage=pathlib.Path(temporary)
        for index,(source,name) in enumerate(zip(sources,names)):
            target=stage/name
            result=subprocess.run([sys.executable,'-B',str(root/'sqlite_backup.py'),'--source',str(source),'--destination',str(target),'--scratch',str(stage),'--source-quiescent'],capture_output=True,timeout=30,check=True)
            receipt=json.loads(result.stdout.decode('utf-8',errors='strict'))
            if receipt.get('source_file_hashes')!=identities[index]:raise ValueError('Source changed before preparation')
            if any(os.path.lexists(str(target)+suffix) for suffix in ('-wal','-shm','-journal')):raise ValueError('Non-standalone checkpoint')
            if target.stat().st_size>64*1024*1024 or hashlib.sha256(target.read_bytes()).hexdigest()!=receipt.get('destination_sha256'):raise ValueError('Checkpoint integrity mismatch')
            receipts.append(receipt)
        status=subprocess.run([str(root/data['binary']),'status',str(stage/names[0])],capture_output=True,timeout=15,check=True)
        status=json.loads(status.stdout.decode('utf-8',errors='strict'))
        if status.get('schema')!=15 or status.get('integrity')!='ok':raise ValueError('Current native schema required; no upgrade performed')
        if [capture.digest(capture.capture(path)) for path in sources]!=identities:raise ValueError('Stores changed during checkpoint')
        for name,receipt in zip(names,receipts):
            if any(os.path.lexists(str(stage/name)+suffix) for suffix in ('-wal','-shm','-journal')):raise ValueError('Prepared copy gained sidecars')
            if hashlib.sha256((stage/name).read_bytes()).hexdigest()!=receipt['destination_sha256']:raise ValueError('Prepared copy changed')
        result={'schema':1,'complete':True,'private_user_data':True,'source_unchanged_at_checks':True,'atomic_live_snapshot':False,'restored':False,'native_schema':15,
                'engineering_validation':'SQLite integrity only; semantic/native acceptance remains separate',
                'stores':{name:{'sha256':receipt['destination_sha256'],'bytes':receipt['destination_bytes'],'source_file_hashes':receipt['source_file_hashes'],'source_wal_present':receipt['source_wal_present'],'sqlite_runtime':receipt['sqlite_runtime']} for name,receipt in zip(names,receipts)}}
        if parent_checkpoint_sha256 is not None:result['parent_checkpoint_sha256']=parent_checkpoint_sha256
        # Exclusive directory. Completion marker is linked last; any partial new
        # directory on failure is retained for inspection, never called complete.
        marker=stage/'checkpoint.json'
        with marker.open('x',encoding='utf-8') as stream:
            json.dump(result,stream,indent=2);stream.write('\n');stream.flush();os.fsync(stream.fileno())
        destination.mkdir(mode=0o700)
        for name in (*names,'checkpoint.json'):os.link(stage/name,destination/name)
    return result

def verify_checkpoint(directory):
    """Read a bounded unsigned integrity receipt; never treat receipt paths as authority."""
    directory=external_path(directory)
    if not directory.is_dir() or any(link_or_reparse(p) for p in (directory,*directory.parents)):raise ValueError('Ordinary checkpoint directory required')
    expected={'foundry.sqlite3','engineering.sqlite3','checkpoint.json'};observed=set()
    with os.scandir(directory) as entries:
        for entry in entries:
            if entry.name not in expected or entry.name in observed:raise ValueError('Unexpected checkpoint content')
            metadata=entry.stat(follow_symlinks=False)
            if not stat.S_ISREG(metadata.st_mode) or getattr(metadata,'st_file_attributes',0)&0x400:raise ValueError('Checkpoint links refused')
            observed.add(entry.name)
    if observed!=expected:raise ValueError('Incomplete checkpoint')
    marker=directory/'checkpoint.json'
    if marker.stat().st_size>1024*1024:raise ValueError('Checkpoint receipt too large')
    with marker.open('rb') as stream:payload=stream.read(1024*1024+1)
    if len(payload)>1024*1024:raise ValueError('Checkpoint receipt too large')
    def unique(pairs):
        result={}
        for key,value in pairs:
            if key in result:raise ValueError('Duplicate receipt key')
            result[key]=value
        return result
    receipt=json.loads(payload.decode('utf-8'),object_pairs_hook=unique)
    if not isinstance(receipt,dict) or type(receipt.get('schema')) is not int or receipt['schema']!=1 or receipt.get('complete') is not True:raise ValueError('Unsupported checkpoint receipt')
    stores=receipt.get('stores')
    if not isinstance(stores,dict) or set(stores)!=expected-{'checkpoint.json'}:raise ValueError('Invalid checkpoint stores')
    # Validate every row before reading either database. Output names are fixed.
    for row in stores.values():
        if not isinstance(row,dict) or type(row.get('bytes')) is not int or not 16<=row['bytes']<=64*1024*1024:raise ValueError('Invalid checkpoint size')
        if not isinstance(row.get('sha256'),str) or not re.fullmatch('[0-9a-f]{64}',row['sha256']):raise ValueError('Invalid checkpoint digest')
    for name,row in stores.items():
        path=directory/name
        if path.stat().st_size!=row['bytes']:raise ValueError('Checkpoint size mismatch')
        digest=hashlib.sha256();remaining=row['bytes']
        with path.open('rb') as stream:
            while remaining:
                chunk=stream.read(min(1024*1024,remaining))
                if not chunk:raise ValueError('Checkpoint changed')
                remaining-=len(chunk);digest.update(chunk)
            if stream.read(1):raise ValueError('Checkpoint changed')
        if digest.hexdigest()!=row['sha256']:raise ValueError('Checkpoint hash mismatch')
    return receipt,hashlib.sha256(payload).hexdigest()

def fork_checkpoint(root,data,source,destination,quiescent=False):
    if not quiescent:raise ValueError('Stop all checkpoint writers first')
    source=external_path(source);destination=external_path(destination)
    if source==destination or source in destination.parents:raise ValueError('Working directory must be outside preserved checkpoint')
    receipt,parent_digest=verify_checkpoint(source)
    names=('foundry.sqlite3','engineering.sqlite3')
    expected=[{'':receipt['stores'][name]['sha256']} for name in names]
    return checkpoint_stores(root,data,source/names[0],source/names[1],destination,True,expected,parent_digest)

def main():
    sys.dont_write_bytecode=True
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--database');p.add_argument('--journal');p.add_argument('--checkpoint-directory');p.add_argument('--fork-checkpoint');p.add_argument('--working-directory');p.add_argument('--create-database');p.add_argument('--backup-database');p.add_argument('--upgrade-copy');p.add_argument('--backup-destination');p.add_argument('--source-quiescent',action='store_true');p.add_argument('--verify-only',action='store_true');p.add_argument('--challenger-public-repo',action='append',default=[],help='Opt in to public GitHub source refresh; Python bridge profile only');a=p.parse_args()
    root=pathlib.Path(__file__).resolve().parent
    try:
        data=verify(root)
        if a.challenger_public_repo and data.get('engine'):p.error('Fresh public-source review currently requires the standalone Python bridge profile')
        if sum((bool(a.database),bool(a.create_database),bool(a.backup_database),bool(a.upgrade_copy),bool(a.fork_checkpoint),a.verify_only))!=1:raise ValueError('Choose one operation')
        if bool(a.backup_database or a.upgrade_copy)!=bool(a.backup_destination) or (a.source_quiescent and not (a.backup_database or a.upgrade_copy or a.checkpoint_directory or a.fork_checkpoint)):raise ValueError('Backup arguments required together')
        if bool(a.fork_checkpoint)!=bool(a.working_directory):raise ValueError('Fork requires a new working directory')
        if a.fork_checkpoint and (a.journal or a.checkpoint_directory or not a.source_quiescent):raise ValueError('Fork requires stopped source and no unrelated arguments')
        if a.checkpoint_directory and not (a.database and a.journal and a.source_quiescent):raise ValueError('Checkpoint requires both existing stores and stopped-source assertion')
        if a.journal and not a.database:raise ValueError('Journal requires explicit native database')
        if a.database and bool(a.journal)!=bool(data.get('engine')):raise ValueError('Unified profile requires both stores; standalone profile has no journal')
        if a.verify_only:
            print('Package file integrity verified; no executable or database opened.')
            print(json.dumps({'python_sqlite':sqlite3.sqlite_version,'wal_recovery_allowed':sqlite3.sqlite_version_info >= (3,54,0)}));return
        if (sys.platform=='win32')!=(data['platform']=='windows') or sys.platform not in ('win32','linux'):raise ValueError('Platform mismatch')
        if a.fork_checkpoint:
            print(json.dumps(fork_checkpoint(root,data,a.fork_checkpoint,a.working_directory,a.source_quiescent)));return
        if a.backup_database or a.upgrade_copy:
            print(json.dumps(backup_database(root,data,a.backup_database or a.upgrade_copy,a.backup_destination,a.source_quiescent,upgrade=bool(a.upgrade_copy))));return
        if a.create_database:
            print(json.dumps(create_database(root,data,a.create_database)));return
        if not a.database:raise ValueError('Explicit database required')
        database=external_path(a.database)
        if not database.is_file() or any(x.is_symlink() for x in (database,*database.parents)) or root==database or root in database.parents:raise ValueError('External regular database required')
        if (sys.platform=='win32')!=(data['platform']=='windows') or sys.platform not in ('win32','linux'):raise ValueError('Platform mismatch')
        if data.get('engine'):
            journal=external_path(a.journal)
            if root in journal.parents or any(p.is_symlink() for p in (journal,*journal.parents)) or not journal.parent.is_dir():raise ValueError('External journal required')
            if a.checkpoint_directory:
                print(json.dumps(checkpoint_stores(root,data,database,journal,a.checkpoint_directory,a.source_quiescent)));return
            if not journal.exists():destination_clear(journal)
            # Engine performs symmetric sidecar/hardlink ownership and schema checks
            # before opening either store. No proxy or security settings changed.
            if a.challenger_public_repo:raise ValueError('Public source refresh is not integrated with the unified Rust profile')
            command=[str(root/data['engine']),'serve-unified',str(journal),str(root/'runtime'),str(database)]
            if sys.platform=='win32':
                spec=importlib.util.spec_from_file_location('athena_owned_process',root/'portable_process.py');owned=importlib.util.module_from_spec(spec);spec.loader.exec_module(owned)
                raise SystemExit(owned.run_windows(command))
            os.execv(command[0],command)
        spec=importlib.util.spec_from_file_location('athena_portable_bridge',root/'bridge.py');bridge=importlib.util.module_from_spec(spec);spec.loader.exec_module(bridge)
        server=bridge.Bridge(root/data['binary'],database,root/'runtime',challenger_repositories=a.challenger_public_repo)
    except (OSError,ValueError,KeyError,TypeError,subprocess.SubprocessError):p.exit(2,'Launch refused: verify package, platform and external existing database. WAL recovery requires Python SQLite 3.54.0+. No automatic repair or existing-database upgrade.\n')
    print(server.origin+'/#build',flush=True)
    try:server.serve_forever()
    except KeyboardInterrupt:pass
    finally:server.server_close()
if __name__=='__main__':main()
