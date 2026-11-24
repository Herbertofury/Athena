from pathlib import Path
import subprocess, urllib.request, urllib.error, time, json, sqlite3, signal, hashlib, statistics
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--baseline',type=Path,required=True);parser.add_argument('--candidate',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
out=args.output;out.mkdir(exist_ok=False)
binaries={'baseline':args.baseline.resolve(),'candidate':args.candidate.resolve()}
base='http://127.0.0.1:41379'; records=[]
def req(path,body=None):
 h={'Content-Type':'application/json','Origin':base,'X-Atlas-Request':'local-ui'}
 r=urllib.request.Request(base+path,data=None if body is None else json.dumps(body).encode(),headers=h)
 with urllib.request.urlopen(r,timeout=5) as x:return json.loads(x.read())
for session,kind in enumerate(['baseline','candidate','candidate','baseline']):
 db=out/f'{session}-{kind}.sqlite';log=open(out/f'{session}-{kind}.log','w');p=subprocess.Popen([str(binaries[kind]),'serve',str(db)],stdout=log,stderr=log)
 try:
  for _ in range(100):
   try:
    req('/api/overview');break
   except OSError:time.sleep(.03)
  else:raise RuntimeError('server not ready')
  for i,delay in enumerate([.07,.23,.41,.13,.31]):
   time.sleep(delay);start=time.perf_counter_ns();ident=req('/api/jobs','DedupExperiment')['id'];limit=time.monotonic()+25
   while time.monotonic()<limit:
    row=next(x for x in req('/api/overview')['jobs'] if x['id']==ident)
    if row['state'] in ['succeeded','failed']:break
    time.sleep(.02)
   else:raise RuntimeError('deadline exceeded')
   wall=(time.perf_counter_ns()-start)/1e6
   e=row['result']['experiment'];assert row['state']=='succeeded' and e['completed'];assert len(e['evidence']['trials'])==15 and e['evidence']['stress_cases']==10000 and e['evidence']['stress_failures']==0;assert all(t['equal_complete_output'] for t in e['evidence']['trials']);assert 'Incomplete' in e['decision']
   with sqlite3.connect(db) as c:events=c.execute('select event,at_ms from job_events where job_id=? order by id',(ident,)).fetchall()
   ev=dict(events);assert 'queued' in ev and 'claimed' in ev
   record={'session':session,'kind':kind,'sample':i,'pre_submit_delay_ms':delay*1000,'queue_to_claim_ms':ev['claimed']-ev['queued'],'request_to_completion_ms':wall,'events':events,'complete_job':row}
   records.append(record);(out/'raw.json').write_text(json.dumps(records,indent=2))
  started=time.perf_counter_ns();p.send_signal(signal.SIGINT);p.wait(timeout=35);shutdown=(time.perf_counter_ns()-started)/1e6;assert p.returncode==0
  with sqlite3.connect(db) as c:
   assert c.execute('pragma integrity_check').fetchone()[0]=='ok';assert c.execute('select count(*) from experiments').fetchone()[0]==5
   for r in [x for x in records if x['session']==session]:assert json.loads(c.execute('select result from jobs where id=?',(r['complete_job']['id'],)).fetchone()[0])==r['complete_job']['result']
  (out/f'{session}-integrity.json').write_text(json.dumps({'reopened_exact':True,'jobs':5,'integrity':'ok','shutdown_ms':shutdown}))
 finally:
  if p.poll() is None:p.send_signal(signal.SIGINT);p.wait(timeout=35)
  log.close()
summary={'scope':'Actual Atlas fixed jobs through loopback HTTP, generated algorithm workload; no provider requests or target-project transfer','order':['baseline','candidate','candidate','baseline'],'binary_sha256':{k:hashlib.sha256(v.read_bytes()).hexdigest() for k,v in binaries.items()},'samples':len(records),'results':{}}
for kind in binaries:
 rr=[r for r in records if r['kind']==kind];summary['results'][kind]={metric:{'median':statistics.median(r[metric] for r in rr),'max':max(r[metric] for r in rr),'min':min(r[metric] for r in rr)} for metric in ['queue_to_claim_ms','request_to_completion_ms']}
(out/'summary.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary,indent=2))
