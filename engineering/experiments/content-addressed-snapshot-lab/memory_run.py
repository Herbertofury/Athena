"""Linux fresh-child peak RSS via wait4, with complete post-write verification."""
import argparse,hashlib,importlib.util,json,os,pathlib,resource,signal,subprocess,time
from recovery_gate import validate,wire
from runner_io import digest,fixed_binary
ROOT=pathlib.Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location("shared_memory_gate",ROOT/"experiments/process-memory-lab/snapshot_gate.py");memory_gate=importlib.util.module_from_spec(spec);spec.loader.exec_module(memory_gate)
OBSERVER_SHA=hashlib.sha256((ROOT/"experiments/process-memory-lab/linux_memory.rs").read_bytes()).hexdigest()
p=argparse.ArgumentParser();p.add_argument('--binary',type=pathlib.Path,required=True);p.add_argument('--input',type=pathlib.Path,required=True);p.add_argument('--output',type=pathlib.Path,required=True);p.add_argument('--candidate',choices=['addressed','compact'],default='addressed');a=p.parse_args();a.binary=fixed_binary(a.binary);a.output.mkdir(parents=True,exist_ok=False)
receipt={'schema_version':2,'complete':False,'candidate_lane':a.candidate,'scope':'Fresh Linux child writes 1001 repeated public-response observations; wait4 peak includes launcher overhead; use separately labeled post-exec self VmHWM/rollup observations; not browser, whole-app or cold-cache evidence','binary_sha256':digest(a.binary),'input_sha256':digest(a.input,2*1024*1024),'sources':{str(f.relative_to(ROOT)):hashlib.sha256(f.read_bytes()).hexdigest() for f in [ROOT/'apps/atlas-lab/examples/addressed_snapshot_crash_probe.rs',ROOT/'apps/atlas-lab/Cargo.lock',ROOT/('experiments/content-addressed-snapshot-lab/compact_store.rs' if a.candidate=='compact' else 'experiments/content-addressed-snapshot-lab/store.rs'),ROOT/'experiments/process-memory-lab/snapshot_gate.py',pathlib.Path(__file__).with_name('runner_io.py')]},'observer_sha256':OBSERVER_SHA,'runner_sha256':hashlib.sha256(pathlib.Path(__file__).read_bytes()).hexdigest(),'samples':[]};deadline=time.monotonic()+120

def limits():resource.setrlimit(resource.RLIMIT_CPU,(8,8))
def require(v,message):
 if not v:raise ValueError(message)
try:
 for round in range(4):
  for lane in (['baseline',a.candidate] if round%2==0 else [a.candidate,'baseline']):
   require(digest(a.binary)==receipt['binary_sha256'],'Binary changed during run');stem=f'{round}-{lane}';db=a.output/(stem+'.sqlite');require(time.monotonic()<deadline,'Overall memory experiment budget')
   with (a.output/(stem+'.stdout')).open('wb') as out,(a.output/(stem+'.stderr')).open('wb') as err:
    child=subprocess.Popen([str(a.binary.resolve()),'write-memory',lane,str(a.input.resolve()),str(db.resolve())],stdout=out,stderr=err,preexec_fn=limits);reaped=False;started=time.monotonic()
    try:
     while True:
      pid,status,usage=os.wait4(child.pid,os.WNOHANG)
      if pid:reaped=True;child.returncode=os.waitstatus_to_exitcode(status);break
      if time.monotonic()>=min(deadline,started+30):
       os.kill(child.pid,signal.SIGKILL);pid,status,usage=os.wait4(child.pid,0);reaped=True;child.returncode=os.waitstatus_to_exitcode(status);raise TimeoutError('Owned memory probe exceeded budget')
      time.sleep(0.01)
    finally:
     if not reaped:
      os.kill(child.pid,signal.SIGKILL);pid,status,usage=os.wait4(child.pid,0);child.returncode=os.waitstatus_to_exitcode(status)
   elapsed=time.monotonic()-started;require(child.returncode==0,'Write child failed');lines=(a.output/(stem+'.stdout')).read_bytes().splitlines();require(len(lines)==3 and lines[0]==b'READY' and lines[2]==b'DONE','Unexpected write completion')
   memory=wire.decode_receipt(lines[1]);require(type(memory.get('schema_version')) is int and memory['schema_version']==1 and memory.get('lane')==lane and type(memory.get('observations')) is int and memory['observations']==1001 and memory.get('input_sha256')==receipt['input_sha256'] and memory.get('observer_sha256')==OBSERVER_SHA,'Memory receipt identity')
   for phase in ['before_input','retained_connection','after_connection_drop']:memory_gate.validate_snapshot(memory.get(phase))
   remaining=deadline-time.monotonic();require(remaining>0,'No verification budget')
   check=subprocess.run([str(a.binary.resolve()),'verify',lane,str(a.input.resolve()),str(db.resolve())],capture_output=True,timeout=min(10,remaining),preexec_fn=limits)
   (a.output/(stem+'.verify.stdout')).write_bytes(check.stdout);(a.output/(stem+'.verify.stderr')).write_bytes(check.stderr);require(check.returncode==0,'Full history verification failed');v=validate(check.stdout,lane);require(v['committed_generations']==1001,'Missing committed observations')
   require(type(usage.ru_maxrss) is int and usage.ru_maxrss>0,'Invalid kernel RSS receipt');require(sum(x.stat().st_size for x in a.output.glob('*.sqlite'))<=256*1024*1024,'Retained database budget')
   receipt['samples'].append({'round':round,'lane':lane,'peak_rss_kib':usage.ru_maxrss,'parent_observed_process_seconds':elapsed,'database_bytes':db.stat().st_size,'verification':v,'self_observation':memory})
 receipt['complete']=len(receipt['samples'])==8
except Exception as error:receipt['failure']={'type':type(error).__name__,'message':str(error)};raise
finally:(a.output/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'complete':receipt['complete'],'samples':len(receipt['samples'])}))
