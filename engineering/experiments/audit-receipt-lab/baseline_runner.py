"""Fixed Atlas lockfile audits with pinned tool/database and retained failed evidence.
This is an analyst CLI, not an application endpoint or a general command executor.
"""
from pathlib import Path
import argparse,datetime,hashlib,json,re,subprocess

LOCKS=('apps/atlas-lab/Cargo.lock','experiments/compressed-snapshot-lab/Cargo.lock','experiments/rust-json-parser-lab/Cargo.lock')
MAX_LOCK=1024*1024

def digest(data):return hashlib.sha256(data).hexdigest()
def git_read(db,*args,runner=subprocess.run):
    p=runner(['git','-C',str(db),*args],capture_output=True,text=True,timeout=15,check=False)
    if p.returncode:raise ValueError('Database Git inspection failed')
    return p.stdout

def validate_database(db,expected,runner=subprocess.run):
    if not re.fullmatch('[0-9a-f]{40}',expected):raise ValueError('Expected a full database commit')
    if git_read(db,'rev-parse','HEAD',runner=runner).strip()!=expected:raise ValueError('Database commit mismatch')
    if git_read(db,'status','--porcelain=v1','--untracked-files=all',runner=runner).strip():raise ValueError('Database worktree is not clean')
    tracked={p for p in git_read(db,'ls-tree','-r','--name-only','HEAD','--','crates',runner=runner).splitlines() if p.endswith('.md')}
    actual=set()
    for p in (db/'crates').rglob('*.md'):
        actual.add(p.relative_to(db).as_posix())
        if len(actual)>10000:raise ValueError('Advisory file inventory budget exceeded')
    if not tracked or actual!=tracked:raise ValueError('Advisory file inventory differs from the pinned tree')
    return len(tracked)

def validate_tool(tool,expected):
    if not re.fullmatch('[0-9a-f]{64}',expected):raise ValueError('Expected a tool SHA-256')
    if tool.stat().st_size>128*1024*1024:raise ValueError('Tool binary exceeds budget')
    actual=digest(tool.read_bytes())
    if actual!=expected:raise ValueError('Audit tool identity mismatch')
    return actual

def freeze_locks(root,out):
    records=[]
    for i,relative in enumerate(LOCKS):
        source=(root/relative).resolve(strict=True)
        if not source.is_relative_to(root.resolve()):raise ValueError('Lockfile escapes repository')
        if source.stat().st_size>MAX_LOCK:raise ValueError('Lockfile exceeds budget')
        with source.open('rb') as f:data=f.read(MAX_LOCK+1)
        if len(data)>MAX_LOCK:raise ValueError('Lockfile grew beyond budget')
        dest=out/f'input-{i}.lock';dest.write_bytes(data)
        records.append({'path':relative,'sha256':digest(data),'input_file':dest.name})
    return records

def unfiltered_result(result):
    settings=result.get('settings',{})
    return (all(settings.get(k)==[] for k in ('ignore','target_arch','target_os')) and settings.get('severity') is None and set(settings.get('informational_warnings',[]))=={'unmaintained','unsound','notice'})

def run(root,db,expected_db,tool,expected_tool,out,runner=subprocess.run):
    # All validation precedes any executable invocation. Existing outputs are never reused.
    inventory=validate_database(db,expected_db,runner);validate_tool(tool,expected_tool)
    out.mkdir(parents=True,exist_ok=False)
    receipt={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'database_commit':expected_db,'advisory_markdown_files':inventory,'tool_sha256':expected_tool,'scope':'Fixed Atlas lockfiles; expected revision currentness must be verified independently','runs':[],'completed':False,'all_clear':False}
    try:
        receipt['locks']=freeze_locks(root,out)
        for i,lock in enumerate(receipt['locks']):
            validate_database(db,expected_db,runner);validate_tool(tool,expected_tool)
            command=[str(tool),'audit','--no-fetch','--db',str(db),'--file',str(out/lock['input_file']),'--json']
            try:
                p=runner(command,capture_output=True,text=True,timeout=60,check=False)
            except subprocess.TimeoutExpired as error:
                def text(value):return value.decode('utf-8',errors='replace') if isinstance(value,bytes) else value or ''
                (out/f'audit-{i}.partial.txt').write_text(text(error.stdout))
                (out/f'audit-{i}.stderr.txt').write_text(text(error.stderr))
                raise
            # Preserve tool output before interpretation, including nonzero/error outcomes.
            (out/f'audit-{i}.json').write_text(p.stdout);(out/f'audit-{i}.stderr.txt').write_text(p.stderr)
            if len(p.stdout.encode())>4*1024*1024 or len(p.stderr.encode())>1024*1024:raise ValueError('Audit output exceeded receipt budget')
            result=json.loads(p.stdout)
            if not unfiltered_result(result):raise ValueError('Audit filtering or ignores differ from the required policy')
            receipt['runs'].append({'lock':lock['path'],'tool_exit_code':p.returncode,'raw_result':f'audit-{i}.json','known_matches':result['vulnerabilities']['count'],'warnings':result.get('warnings',{})})
            if digest((out/lock['input_file']).read_bytes())!=lock['sha256']:raise ValueError('Frozen input changed during audit')
        validate_database(db,expected_db,runner);validate_tool(tool,expected_tool)
        receipt['completed']=True
        receipt['all_clear']=all(x['tool_exit_code']==0 and x['known_matches']==0 and not x['warnings'] for x in receipt['runs'])
    except Exception as e:
        receipt['error_category']=type(e).__name__;receipt['error']=str(e)
        raise
    finally:
        (out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
    return receipt

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--db',type=Path,required=True);p.add_argument('--db-commit',required=True);p.add_argument('--tool',type=Path,required=True);p.add_argument('--tool-sha256',required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    receipt=run(Path(__file__).resolve().parents[2],a.db.resolve(),a.db_commit,a.tool.resolve(),a.tool_sha256,a.output.resolve())
    print(json.dumps({'completed':receipt['completed'],'all_clear':receipt['all_clear'],'runs':len(receipt['runs'])}))
    raise SystemExit(0 if receipt['all_clear'] else 1)
