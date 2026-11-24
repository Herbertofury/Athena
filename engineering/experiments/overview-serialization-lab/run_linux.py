from pathlib import Path
import subprocess,os,time,json,hashlib,statistics,platform
root=Path(__file__).resolve().parents[2];binary=root/'apps/atlas-lab/target/release/examples/overview_lab';capture=root/'experiments/modrinth-batch-lab/pair-0-2026-10-27.json';out=Path('/tmp/atlas-overview-lab-v2-20261027');out.mkdir(exist_ok=False)
workloads=[('actual_live_queue',Path('/tmp/atlas-queue-batch-20261027.sqlite'))]
for count in [1,10,50]:
 db=out/f'replay-{count}.sqlite';subprocess.run([str(binary),'fixture',str(db),str(count),str(capture)],check=True,capture_output=True,timeout=15);workloads.append((f'replay_{count}',db))
records=[];pairs=[]
for name,db in workloads:
 for pair in range(5):
  outputs={}
  for strategy in (['baseline','candidate'] if pair%2==0 else ['candidate','baseline']):
   response=out/f'{name}-{pair}-{strategy}.json';metrics=out/f'{name}-{pair}-{strategy}-metrics.json'
   with response.open('wb') as stdout,metrics.open('wb') as stderr:
    process=subprocess.Popen([str(binary),strategy,str(db),'10'],stdout=stdout,stderr=stderr)
    deadline=time.monotonic()+30
    while True:
     pid,status,usage=os.wait4(process.pid,os.WNOHANG)
     if pid:process.returncode=os.waitstatus_to_exitcode(status);break
     if time.monotonic()>deadline:process.kill();pid,status,usage=os.wait4(process.pid,0);process.returncode=os.waitstatus_to_exitcode(status);raise RuntimeError('Per-process budget exhausted')
     time.sleep(.01)
   if process.returncode:raise RuntimeError(metrics.read_text())
   value=json.loads(response.read_text());outputs[strategy]=value;measurement=json.loads(metrics.read_text());measurement.update({'workload':name,'pair':pair,'wait4_peak_rss_kib':usage.ru_maxrss,'complete_output_sha256':hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':'),ensure_ascii=False).encode()).hexdigest(),'raw_output_sha256':hashlib.sha256(response.read_bytes()).hexdigest(),'process_user_seconds':usage.ru_utime,'process_system_seconds':usage.ru_stime});records.append(measurement)
  equal=outputs['baseline']==outputs['candidate'];pairs.append({'workload':name,'pair':pair,'complete_output_equal':equal});assert equal,(name,pair)
result={'schema_version':1,'checked_at':'2026-10-27','baseline_commit':'5b8b11cabc1b80a476de7d13e59de92170608665','environment':{'system':platform.system(),'release':platform.release(),'machine':platform.machine(),'rss_unit':'KiB; child /proc/self/status VmHWM is primary, wait4 retained as diagnostic'},'binary_sha256':hashlib.sha256(binary.read_bytes()).hexdigest(),'input_capture_sha256':hashlib.sha256(capture.read_bytes()).hexdigest(),'source_sha256':{p:hashlib.sha256((root/'apps/atlas-lab'/p).read_bytes()).hexdigest() for p in ['src/jobs.rs','src/validated_raw.rs','examples/overview_lab.rs']},'samples':records,'pairs':pairs,'complete':True,'limits':['No HTTP/client parse/UI timings','Three replay histories are generated from real public metadata; actual_live_queue is the prior real HTTP job database','OS page cache uncontrolled; every sample reconstructs the complete response, no result cache','Peak RSS includes process startup, SQLite and a retained first-output reference','Candidate is isolated; HTTP route unchanged','No cross-project recommendation or generic autonomous optimization claim']}
(out/'results.json').write_text(json.dumps(result,indent=2))
for name,_ in workloads:
 row={}
 for strategy in ['baseline','candidate']:
  samples=[x for x in records if x['workload']==name and x['strategy']==strategy]
  row[strategy]={'median_process_median_ms':statistics.median(statistics.median(y['elapsed_ns'] for y in x['samples'])/1e6 for x in samples),'median_peak_rss_kib':statistics.median(x['process_peak_rss_kib'] for x in samples)}
 print(name,json.dumps(row))
print('result',str(out/'results.json'))
