"""Bounded isolated KV comparison; retains every process result and database."""
import argparse,hashlib,json,pathlib,resource,subprocess,time
a=argparse.ArgumentParser();a.add_argument("--inputs",type=pathlib.Path,required=True);a.add_argument("--output",type=pathlib.Path,required=True);a.add_argument("--file-budget-mib",type=int,choices=[64,128],default=64);args=a.parse_args()
root=pathlib.Path(__file__).resolve().parent
binary=root/'target/release/atlas-ordered-kv'
inputs=args.inputs
out=args.output;out.mkdir(exist_ok=False)
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
receipt={'schema_version':1,'scope':'ordered KV replay, not relational SnapshotStore acceptance','binary_sha256':sha(binary),'harness_sha256':sha(root/'src/main.rs'),'lock_sha256':sha(root/'Cargo.lock'),'inputs':{n:sha(inputs/(n+'.json')) for n in ['AANobbMI','YL57xq9U','gvQqBUqZ']},'samples':[],'completed':False,'file_budget_bytes':args.file_budget_mib*1024*1024,'diagnostic_only':args.file_budget_mib==128}
def limits():
 resource.setrlimit(resource.RLIMIT_AS,(512*1024*1024,)*2)
 resource.setrlimit(resource.RLIMIT_CPU,(8,8))
 resource.setrlimit(resource.RLIMIT_FSIZE,(args.file_budget_mib*1024*1024,)*2)
start=time.monotonic()
try:
 for case in ['public','generated']:
  for rnd in range(4):
   lanes=['sqlite','sqlite-extra','redb-insert','redb-cursor'];lanes=lanes[rnd:]+lanes[:rnd]
   for lane in lanes:
    if time.monotonic()-start>120:raise TimeoutError('pass budget')
    if sha(binary)!=receipt['binary_sha256']:raise ValueError('binary changed during pass')
    stem=f'{case}-{rnd}-{lane}'
    try:
     p=subprocess.run([str(binary),lane,str(inputs),case,str(out/stem)],capture_output=True,timeout=12,preexec_fn=limits)
    except subprocess.TimeoutExpired as error:
     (out/(stem+'.stdout')).write_bytes(error.stdout or b'');(out/(stem+'.stderr')).write_bytes(error.stderr or b'')
     receipt['failure']={'sample':stem,'category':'wall_timeout'}
     raise
    (out/(stem+'.stdout')).write_bytes(p.stdout);(out/(stem+'.stderr')).write_bytes(p.stderr)
    if p.returncode:
     receipt['failure']={'sample':stem,'returncode':p.returncode}
     raise RuntimeError(f'{stem} exit {p.returncode}')
    if len(p.stdout)>65536 or len(p.stderr)>65536:raise ValueError('output budget')
    data=json.loads(p.stdout)
    assert data['lane']==lane and data['workload']==case and type(data['rows']) is int and data['rows']==256
    for key in ['write_commit_ns','commit_ns','read_materialize_ns','database_bytes','payload_bytes']:
     if type(data.get(key)) is not int or data[key]<=0:raise ValueError('invalid measurement')
    if data['commit_ns']>data['write_commit_ns']:raise ValueError('invalid commit subset')
    assert all(data[k] is True for k in ['complete_output_equal','rollback_preserved','integrity'])
    receipt['samples'].append({'round':rnd,**data})
 receipt['completed']=len(receipt['samples'])==32
finally:
 (out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'completed':receipt['completed'],'samples':len(receipt['samples'])}))
