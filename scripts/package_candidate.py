"""Unsigned CI evaluation bundle, not a release or installer. Never includes user databases."""
import argparse, hashlib, importlib.util, json, os, pathlib, platform, re, shutil, subprocess, sys, tempfile, zipfile, struct
ROOT=pathlib.Path(__file__).resolve().parents[1]
ALLOWED={'MIT','Apache-2.0','Unicode-3.0','ISC','MIT-0','BSD-3-Clause','CC0-1.0','Zlib','Unlicense','BSL-1.0'}
def load(name,path):
 spec=importlib.util.spec_from_file_location(name,path);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
pack=load('candidate_pack',ROOT/'scripts/package_native.py');launch=load('candidate_launch',ROOT/'native/foundry/portable_launcher.py')
def sha(path):return pack.digest(path)
def license_expression(value):
    # Parse the bounded subset actually used by this pinned dependency graph.
    normalized=value.replace('/',' OR ')
    tokens=re.findall(r'[A-Za-z0-9.+-]+|[()]',normalized)
    if ''.join(tokens)!=''.join(normalized.split()):raise ValueError('Malformed SPDX expression')
    position=0
    def atom():
        nonlocal position
        if position>=len(tokens):raise ValueError('Incomplete SPDX expression')
        token=tokens[position];position+=1
        if token=='(':
            expression()
            if position>=len(tokens) or tokens[position]!=')':raise ValueError('Unbalanced SPDX expression')
            position+=1
        elif token not in ALLOWED:raise ValueError('Unreviewed SPDX license')
    def expression():
        nonlocal position
        atom()
        while position<len(tokens) and tokens[position] in ('AND','OR'):
            position+=1;atom()
    expression()
    if position!=len(tokens):raise ValueError('Malformed SPDX expression')
    return value
def notices(metadata,output):
    rows={};total=0
    for source in metadata:
        data=json.loads(pathlib.Path(source).read_text(encoding='utf-8'))
        for p in data['packages']:
            if p.get('source') is None:
                if p['name'] not in ('atlas-lab','athena-foundry-store'):raise ValueError('Unreviewed path dependency')
                rows[p['name']+'-'+p['version']]={'name':p['name'],'version':p['version'],'license_expression':p.get('license'),'source':'workspace','notices':[], 'scope':'Owner project code; no repository-wide license or downstream grant inferred'}
                continue
            if p['source']!='registry+https://github.com/rust-lang/crates.io-index':raise ValueError('Unreviewed dependency source')
            name,version=p['name'],p['version']
            if not re.fullmatch('[A-Za-z0-9_.+-]+',name) or not re.fullmatch('[A-Za-z0-9_.+-]+',version):raise ValueError('Invalid package identity')
            expression=p.get('license') or ''
            license_expression(expression)
            key=name+'-'+version
            if key in rows:
                if rows[key]['license_expression']!=expression:raise ValueError('License metadata conflict')
                continue
            root=pathlib.Path(p['manifest_path']).parent.resolve();paths=[]
            for item in root.rglob('*'):
                if item.is_file() and (item.name.lower().startswith(('license','licence','copying','notice')) or (p.get('license_file') and item==root/p['license_file'])):
                    if item.is_symlink() or any(v.is_symlink() for v in item.parents):raise ValueError('License symlink refused')
                    paths.append(item)
            if not paths:raise ValueError('Missing license notices: '+name)
            retained=[]
            for item in sorted(paths):
                size=item.stat().st_size;total+=size
                if size>2*1024*1024 or total>20*1024*1024:raise ValueError('License bundle exceeds bound')
                relative=item.relative_to(root);target=output/'third-party'/key/relative
                target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(item,target)
                retained.append({'path':target.relative_to(output).as_posix(),'sha256':sha(target),'bytes':size})
            rows[key]={'name':name,'version':version,'license_expression':expression,'source':'https://crates.io/crates/'+name+'/'+version,'notices':retained}
    return [rows[k] for k in sorted(rows)]
def new_path(value):
    path=pathlib.Path(value)
    if '..' in path.parts or any(p.is_symlink() for p in (path,*path.parents)):raise ValueError('Direct non-symlink destination required')
    return path.absolute()
def safe_name(value):
    name=pathlib.PurePosixPath(value)
    reserved={'CON','PRN','AUX','NUL','CONIN$','CONOUT$',*[f'COM{i}' for i in range(1,10)],*[f'LPT{i}' for i in range(1,10)]}
    return bool(name.parts) and not name.is_absolute() and str(name)==value and '..' not in name.parts and '\\' not in value and not any(c in value for c in ':<>\"|?*') and all(32<=ord(c)<127 for c in value) and all(part.rstrip(' .')==part and part.split('.')[0].upper() not in reserved and not any(ord(c)<32 for c in part) for part in name.parts)
def build(binary,engine,system,metadata,destination,commit,toolchain=None):
    if not re.fullmatch('[0-9a-f]{40}',commit):raise ValueError('Exact source commit required')
    destination=new_path(destination)
    if destination.exists() or destination.is_symlink():raise FileExistsError('New artifact directory required')
    destination.mkdir(mode=0o700)
    with tempfile.TemporaryDirectory(prefix='athena-candidate-',dir=destination.parent) as tmp:
        bundle=pathlib.Path(tmp)/'bundle'
        receipt=pack.package(ROOT/'dist',binary,sha(binary),bundle,system,engine,sha(engine))
        inventory=notices(metadata,bundle)
        doc={'schema':1,'source_commit':commit,'platform':system,'unsigned':True,'release':False,'dependencies':inventory,
             'project_license':'No repository-wide license declared; no new downstream license is granted by this inventory.',
             'limits':'Cargo metadata and retained license/notice files, not full redistribution clearance, a legal opinion or signed build attestation. Native vendored components and runtime assets may have additional obligations. Python and OS prerequisites not bundled.'}
        (bundle/'DEPENDENCIES.json').write_text(json.dumps(doc,indent=2)+'\n',encoding='utf-8')
        (bundle/'START-HERE.txt').write_text('''Athena portable evaluation
==========================
Unsigned test build, not an installer. Python 3.13 or newer is required.
Check that "python --version" reports a supported version.

1. Create a fresh parent folder and extract this ZIP into a new "app" folder
   inside it. Open a terminal in the parent folder, not inside "app".
2. Verify extracted files:
      python -B app/launch.py --verify-only
3. Create an empty sibling "data" folder and initialize it once:
      mkdir data
      python -B app/launch.py --init-portable-data data
   Never point initialization at an existing profile or import real data into
   this evaluation. Keep the separate app and data directories.
4. Start Athena:
      python -B app/launch.py --portable-data-dir data
   Open the local address printed in the terminal. Stop Athena with Ctrl+C.
   To move the portable profile, shut it down first, move the whole parent
   folder and start it again from the new parent. Do not copy open databases.

Optional test: after your first start and shutdown, create a new checkpoint:
      python -B app/launch.py --database data/foundry.sqlite3 --journal data/engineering.sqlite3 --checkpoint-directory checkpoint --source-quiescent
   To make a separate working copy from the saved checkpoint:
      python -B app/launch.py --fork-checkpoint checkpoint --working-directory working --source-quiescent
   Do not use existing destinations. Keep checkpoint and working copies private.

This is an evaluation only. It does not certify actual removable or network
drives, an existing profile, all codecs, any complete source migration, or
retirement of source repositories. Preserve all original repositories and backups.
''',encoding='utf-8')
        listed={row['path'] for row in receipt['files']}
        for path in sorted(bundle.rglob('*')):
            if path.is_file() and path.name!='native-package.json' and path.relative_to(bundle).as_posix() not in listed:
                receipt['files'].append({'path':path.relative_to(bundle).as_posix(),'sha256':sha(path),'bytes':path.stat().st_size})
        (bundle/'native-package.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
        launch.verify(bundle)
        archive=destination/f'athena-unified-{system}-{commit[:12]}.zip'
        with zipfile.ZipFile(archive,'x',compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:
            for path in sorted(bundle.rglob('*')):
                if path.is_file():
                    name=path.relative_to(bundle).as_posix();info=zipfile.ZipInfo(name,date_time=(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED
                    info.external_attr=(0o100700 if name in (receipt['binary'],receipt['engine']) else 0o100600)<<16
                    z.writestr(info,path.read_bytes())
        result={'schema':1,'source_commit':commit,'platform':system,'archive':archive.name,'archive_sha256':sha(archive),'archive_bytes':archive.stat().st_size,
                'unpacked_bytes':sum(row['bytes'] for row in receipt['files'])+(bundle/'native-package.json').stat().st_size,
                'binary_sha256':sha(bundle/receipt['binary']),'engine_sha256':sha(bundle/receipt['engine']),
                'package_receipt_sha256':sha(bundle/'native-package.json'),'toolchain':toolchain,
                'lockfiles':{name:sha(ROOT/name) for name in ('crates/athena-foundry-store/Cargo.lock','engineering/apps/atlas-lab/Cargo.lock')},
                'runtime_allowlist_sha256':sha(ROOT/'config/runtime-public-preview.json'),'dependencies':len(inventory),'unsigned':True,'release':False,'owner_device_accepted':False}
        (destination/'candidate.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
        return result

def archive_preflight(path):
    size=pack.regular(path).stat().st_size
    if size>256*1024*1024 or size<22:raise ValueError('Compressed archive size bound exceeded')
    with path.open('rb') as stream:
        stream.seek(max(0,size-65557));tail=stream.read(65557)
        at=tail.rfind(b'PK\x05\x06')
        if at<0 or at+22>len(tail):raise ValueError('ZIP directory missing')
        signature,disk,start_disk,disk_count,count,directory_size,offset,comment=struct.unpack('<4s4H2LH',tail[at:at+22])
        end=size-len(tail)+at
        if disk or start_disk or disk_count!=count or not 0<count<=2000 or directory_size>2*1024*1024 or offset+directory_size!=end or at+22+comment!=len(tail):raise ValueError('Unsupported ZIP directory')
        stream.seek(offset);directory=stream.read(directory_size)
    cursor=0;seen=0
    while cursor<len(directory):
        if cursor+46>len(directory) or directory[cursor:cursor+4]!=b'PK\x01\x02':raise ValueError('Invalid ZIP directory record')
        name,extra,comment=struct.unpack('<3H',directory[cursor+28:cursor+34])
        if not 0<name<=512:raise ValueError('ZIP name size exceeded')
        cursor+=46+name+extra+comment;seen+=1
        if cursor>len(directory) or seen>2000:raise ValueError('ZIP directory bounds exceeded')
    if seen!=count:raise ValueError('ZIP entry count mismatch')
def extract(archive,destination,expected_sha):
    archive=pathlib.Path(archive);destination=new_path(destination)
    archive_preflight(archive)
    if sha(archive)!=expected_sha:raise ValueError('Archive hash mismatch')
    if destination.exists() or destination.is_symlink():raise FileExistsError('New extraction directory required')
    with zipfile.ZipFile(archive) as z:
        infos=z.infolist();names=set();size=0
        if len(infos)>2000:raise ValueError('Archive entry bound exceeded')
        for i in infos:
            name=pathlib.PurePosixPath(i.filename);size+=i.file_size
            if i.orig_filename!=i.filename or not safe_name(i.orig_filename) or not safe_name(i.filename) or i.filename.casefold() in names or i.is_dir() or ((i.external_attr>>16)&0o170000)!=0o100000:raise ValueError('Unsafe archive entry')
            names.add(i.filename.casefold())
        if size>600*1024*1024:raise ValueError('Archive byte bound exceeded')
        destination.mkdir(mode=0o700)
        for i in infos:
            target=destination/i.filename;target.parent.mkdir(parents=True,exist_ok=True)
            with z.open(i) as source,target.open('xb') as out:shutil.copyfileobj(source,out,1024*1024)
    receipt=launch.verify(destination)
    if os.name=='posix':
        for name in (receipt['binary'],receipt['engine']):(destination/name).chmod(0o700)
    return receipt
if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--binary',required=True);p.add_argument('--engine',required=True);p.add_argument('--platform',choices=['windows','linux'],required=True);p.add_argument('--metadata',action='append',default=[]);p.add_argument('--output',required=True);p.add_argument('--extract-to',required=True);a=p.parse_args()
    commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True,timeout=10).strip()
    compiler=subprocess.check_output(['rustc','-vV'],text=True,timeout=10)
    with tempfile.TemporaryDirectory(prefix='athena-license-metadata-') as tmp:
        metadata=a.metadata
        if not metadata:
            host=next(line.split(': ',1)[1] for line in compiler.splitlines() if line.startswith('host: '))
            metadata=[]
            for number,manifest in enumerate(('crates/athena-foundry-store/Cargo.toml','engineering/apps/atlas-lab/Cargo.toml')):
                result=subprocess.run(['cargo','metadata','--locked','--offline','--filter-platform',host,'--format-version','1','--manifest-path',str(ROOT/manifest)],capture_output=True,check=True,timeout=120)
                path=pathlib.Path(tmp)/f'{number}.json';path.write_bytes(result.stdout);metadata.append(path)
        result=build(a.binary,a.engine,a.platform,metadata,a.output,commit,compiler)
    extract(pathlib.Path(a.output)/result['archive'],a.extract_to,result['archive_sha256'])
    (pathlib.Path(a.output)/'SHA256SUMS').write_text(result['archive_sha256']+'  '+result['archive']+'\n',encoding='ascii')
    print(json.dumps(result))
