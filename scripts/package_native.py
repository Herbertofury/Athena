"""Build an explicit portable native profile; never include databases or install it."""
import argparse, hashlib, importlib.util, json, os, pathlib, re, shutil
ROOT=pathlib.Path(__file__).resolve().parents[1]

def regular(path):
    path=pathlib.Path(path).absolute()
    if any(p.is_symlink() for p in (path,*path.parents)) or not path.is_file():
        raise ValueError('Regular non-symlink file required')
    return path

def digest(path):
    h=hashlib.sha256()
    with regular(path).open('rb') as stream:
        while chunk:=stream.read(1024*1024):h.update(chunk)
    return h.hexdigest()

def package(source,binary,expected_sha,output,platform,engine=None,engine_sha=None):
    source=pathlib.Path(source).absolute(); output=pathlib.Path(output).absolute(); binary=regular(binary)
    if platform not in ('windows','linux') or not re.fullmatch('[0-9a-f]{64}',expected_sha):raise ValueError('Explicit platform and SHA256 required')
    if binary.stat().st_size>256*1024*1024 or digest(binary)!=expected_sha:raise ValueError('Binary digest/size mismatch')
    if output==source or source in output.parents or output in binary.parents:raise ValueError('Separate output required')
    if any(p.is_symlink() for p in (source,*source.parents,output,*output.parents)):raise ValueError('Symlink paths refused')
    if bool(engine)!=bool(engine_sha):raise ValueError('Engine and reviewed SHA256 required together')
    if engine:
        engine=regular(engine)
        if not re.fullmatch('[0-9a-f]{64}',engine_sha) or engine.stat().st_size>256*1024*1024 or digest(engine)!=engine_sha:raise ValueError('Engine digest/size mismatch')
        if output in engine.parents:raise ValueError('Separate engine output required')
    manifest=json.loads((ROOT/'config/runtime-public-preview.json').read_text())
    approved={row['path']:row['sha256'] for row in manifest['files']}
    actual={p.relative_to(source).as_posix() for p in source.rglob('*') if p.is_file() or p.is_symlink()}
    if actual!=set(approved):raise ValueError('Runtime inventory differs from published allowlist')
    spec=importlib.util.spec_from_file_location('portable_bridge',ROOT/'native/foundry/bridge.py')
    bridge=importlib.util.module_from_spec(spec);spec.loader.exec_module(bridge)
    if not bridge.REQUIRED_CORE_PATHS<=set(approved) or not set(approved)<=bridge.STATIC_PATHS:raise ValueError('Runtime not supported by bridge')
    for name,sha in approved.items():
        if digest(source/name)!=sha:raise ValueError('Runtime digest mismatch')
    # Exclusive reservation: failures may leave a partial NEW directory, never replace one.
    output.mkdir(mode=0o700)
    files=[]
    def copy(src,name,expected=None):
        target=output/name;target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copyfile(regular(src),target)
        sha=digest(target)
        if expected is not None and sha!=expected:raise ValueError('Source changed during packaging')
        files.append({'path':name,'sha256':sha,'bytes':target.stat().st_size})
    if engine:
        spec=importlib.util.spec_from_file_location('athena_runtime_package',ROOT/'scripts/package_app.py')
        app=importlib.util.module_from_spec(spec);spec.loader.exec_module(app)
        app.package(source,output/'runtime',manifest,'public-preview')
        for path in sorted((output/'runtime').rglob('*')):
            if path.is_file():files.append({'path':path.relative_to(output).as_posix(),'sha256':digest(path),'bytes':path.stat().st_size})
    else:
        for name,sha in sorted(approved.items()):copy(source/name,'runtime/'+name,sha)
    exe='athena-foundry-store.exe' if platform=='windows' else 'athena-foundry-store'
    copy(binary,exe,expected_sha)
    if os.name=='posix':(output/exe).chmod(0o700)
    copy(ROOT/'native/foundry/bridge.py','bridge.py')
    copy(ROOT/'native/foundry/challenger_service.py','challenger_service.py')
    copy(ROOT/'scripts/refresh_challenger_sources.py','refresh_challenger_sources.py')
    copy(ROOT/'scripts/check_software_links.py','check_software_links.py')
    copy(ROOT/'native/foundry/portable_launcher.py','launch.py')
    copy(ROOT/'tools/foundry-recovery/sqlite/prepare.py','sqlite_backup.py')
    receipt={'schema':1,'platform':platform,'binary':exe,'files':files,'database_included':False,
        'limits':'File integrity only, not binary authenticity, owner-device acceptance or complete migration.'}
    if engine:
        engine_name='atlas-lab.exe' if platform=='windows' else 'atlas-lab'
        copy(engine,engine_name,engine_sha)
        copy(ROOT/'native/foundry/portable_process.py','portable_process.py')
        if os.name=='posix':(output/engine_name).chmod(0o700)
        receipt['engine']=engine_name;receipt['profile']='unified'
    (output/'native-package.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
    return receipt

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--source',required=True);p.add_argument('--binary',required=True);p.add_argument('--binary-sha256',required=True);p.add_argument('--output',required=True);p.add_argument('--platform',choices=['windows','linux'],required=True);p.add_argument('--engine');p.add_argument('--engine-sha256');a=p.parse_args()
    try:r=package(a.source,a.binary,a.binary_sha256,a.output,a.platform,a.engine,a.engine_sha256)
    except (OSError,ValueError,KeyError):p.exit(2,'Packaging refused. Check inputs and new destination; a partial new output may remain. Nothing installed.\n')
    print(json.dumps({'files':len(r['files']),'database_included':False,'installed':False}))
