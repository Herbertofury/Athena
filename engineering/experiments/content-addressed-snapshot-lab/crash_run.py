"""Linux-only bounded interruption of newly created, owned fixture processes."""
import argparse,hashlib,json,pathlib,resource,select,subprocess,time
from recovery_gate import validate
from runner_io import digest,fixed_binary
p=argparse.ArgumentParser();p.add_argument('--binary',type=pathlib.Path,required=True);p.add_argument('--input',type=pathlib.Path,required=True);p.add_argument('--output',type=pathlib.Path,required=True);p.add_argument('--candidate',choices=['addressed','compact'],default='addressed');a=p.parse_args();a.binary=fixed_binary(a.binary)
a.output.mkdir(parents=True,exist_ok=False)
root=pathlib.Path(__file__).resolve().parents[2]
sources=[pathlib.Path(__file__),pathlib.Path(__file__).with_name('recovery_gate.py'),pathlib.Path(__file__).with_name('compact_store.rs' if a.candidate=='compact' else 'store.rs'),root/'apps/atlas-lab/examples/addressed_snapshot_crash_probe.rs',root/'apps/atlas-lab/src/snapshots.rs',root/'apps/atlas-lab/src/storage_connection.rs',root/'apps/atlas-lab/Cargo.lock',pathlib.Path(__file__).with_name('runner_io.py')]
receipt={'sources':{str(f.relative_to(root)):hashlib.sha256(f.read_bytes()).hexdigest() for f in sources},'schema_version':1,'complete':False,'candidate_lane':a.candidate,'scope':'Owned subprocess SIGKILL after first committed generation; exact transaction phase unobserved; not physical power-loss testing','binary_sha256':digest(a.binary),'samples':[]}
def limits():resource.setrlimit(resource.RLIMIT_CPU,(5,5))
def require(v,message):
 if not v:raise ValueError(message)
try:
 for delay in [0.005,0.01,0.02,0.05,0.1,0.2]:
  for lane in ['baseline',a.candidate]:
   require(digest(a.binary)==receipt['binary_sha256'],'Binary changed during run');stem=f'{lane}-{delay}';db=a.output/(stem+'.sqlite')
   child=subprocess.Popen([str(a.binary.resolve()),'write',lane,str(a.input.resolve()),str(db.resolve())],stdout=subprocess.PIPE,stderr=subprocess.PIPE,preexec_fn=limits)
   try:
    ready=select.select([child.stdout],[],[],5)[0];require(ready,'No child readiness within budget');line=child.stdout.readline();require(line==b'READY\n','Unexpected child readiness')
    time.sleep(delay);alive=child.poll() is None
    if alive:child.kill()
    out,err=child.communicate(timeout=5)
    (a.output/(stem+'.stdout')).write_bytes(line+out);(a.output/(stem+'.stderr')).write_bytes(err)
    require(alive and child.returncode==-9,'Child was not interrupted as planned; no recovery pass claimed')
    check=subprocess.run([str(a.binary.resolve()),'verify',lane,str(a.input.resolve()),str(db.resolve())],capture_output=True,timeout=10,preexec_fn=limits)
    (a.output/(stem+'.verify.stdout')).write_bytes(check.stdout);(a.output/(stem+'.verify.stderr')).write_bytes(check.stderr)
    require(check.returncode==0,'Recovery verification failed');v=validate(check.stdout,lane)
    require(v.get('schema_version')==1 and v.get('lane')==lane,'Receipt identity mismatch')
    require(type(v.get('committed_generations')) is int and 1<=v['committed_generations']<=1001,'Invalid generation count')
    require(all(v.get(k) is True for k in ['complete_payload_history_equal','attempt_atomicity','integrity_ok']),'Incomplete recovery parity')
    receipt['samples'].append({'requested_delay_seconds':delay,'child_exit':child.returncode,**v})
   finally:
    if child.poll() is None:child.kill();child.communicate(timeout=5)
 receipt['complete']=len(receipt['samples'])==12
except Exception as error:
 receipt['failure']={'type':type(error).__name__,'message':str(error)};raise
finally:(a.output/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'complete':receipt['complete'],'samples':len(receipt['samples'])}))
