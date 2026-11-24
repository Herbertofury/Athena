from pathlib import Path
import sqlite3,subprocess,urllib.request,urllib.error,time,signal,json,hashlib,statistics
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);parser.add_argument('--seed',type=Path,required=True);parser.add_argument('--baseline',type=Path,required=True);parser.add_argument('--candidate',type=Path,required=True);args=parser.parse_args()
out=args.output;out.mkdir(exist_ok=False)
seed=args.seed;assert seed.exists()
bins={'baseline':args.baseline.resolve(),'candidate':args.candidate.resolve()};base='http://127.0.0.1:41379';records=[];checks=[];expected={}
def request(path='/api/overview',host=None,body=None):
 h={}
 if host:h['Host']=host
 if body is not None:h['Content-Type']='application/json'
 req=urllib.request.Request(base+path,data=None if body is None else json.dumps(body).encode(),headers=h);started=time.perf_counter_ns()
 try:
  with urllib.request.urlopen(req,timeout=10) as r:b=r.read();return r.status,b,dict(r.headers),(time.perf_counter_ns()-started)/1e6
 except urllib.error.HTTPError as e:return e.code,e.read(),dict(e.headers),(time.perf_counter_ns()-started)/1e6
def check(name,actual,want):
 checks.append({'name':name,'passed':actual==want,'observed':actual,'expected':want});assert actual==want,(name,actual,want)
def semantic(b):return hashlib.sha256(json.dumps(json.loads(b),sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
for count in [1,10,50]:
 for session,kind in enumerate(['baseline','candidate','candidate','baseline']):
  db=out/f'{count}-{session}-{kind}.sqlite'
  with sqlite3.connect(seed) as src,sqlite3.connect(db) as dst:src.backup(dst)
  with sqlite3.connect(db) as c:
   row=c.execute('select payload,state,attempt,result from jobs order by id limit 1').fetchone();assert row[1]=='succeeded'
   c.execute('delete from job_events');c.execute('delete from jobs')
   for i in range(1,count+1):
    c.execute('insert into jobs(id,payload,state,attempt,result) values(?,?,?,?,?)',(i,*row))
    c.execute("insert into job_events(job_id,attempt,event,at_ms) values(?,?,'succeeded',0)",(i,row[2]))
  log=open(out/f'{count}-{session}-{kind}.log','w');p=subprocess.Popen([str(bins[kind]),'serve' if kind=='baseline' else 'serve-candidate',str(db)],stdout=log,stderr=log)
  try:
   for _ in range(150):
    try:
     status,b,h,_=request()
     if status==200 and json.loads(b)['worker_status']=='running':break
    except OSError:pass
    if p.poll() is not None:raise RuntimeError('server exited')
    time.sleep(.02)
   else:raise RuntimeError('not ready')
   label=f'{count}/{session}/{kind}'
   check(label+' full count',len(json.loads(b)['jobs']),count)
   digest=semantic(b)
   if count not in expected:expected[count]=digest
   check(label+' full output parity',digest,expected[count])
   check(label+' JSON type',h.get('content-type'),'application/json');check(label+' no-store',h.get('cache-control'),'no-store');check(label+' nosniff',h.get('x-content-type-options'),'nosniff');check(label+' CSP',"connect-src 'self'" in h.get('content-security-policy',''),True)
   if kind=='candidate':check(label+' candidate identity',h.get('x-atlas-overview-strategy'),'validated-raw-candidate')
   check(label+' foreign host',request(host='evil.example')[0],403);check(label+' missing write origin',request('/api/jobs',body='DedupExperiment')[0],403)
   status,html,_,_=request('/');check(label+' visible candidate banner',b'ISOLATED OVERVIEW CANDIDATE' in html,kind=='candidate')
   for trial in range(25):
    status,b,h,elapsed=request();assert status==200 and semantic(b)==expected[count]
    records.append({'count':count,'session':session,'strategy':kind,'trial':trial,'warmup':trial<5,'response_ms':elapsed,'bytes':len(b),'full_semantic_sha256':semantic(b),'parity':True})
   with sqlite3.connect(db) as c:c.execute("update jobs set result='1e400' where id=1")
   check(label+' corrupt stored JSON rejected',request()[0],500)
   with sqlite3.connect(db) as c:c.execute('update jobs set result=? where id=1',(row[3],))
   check(label+' exact recovery',semantic(request()[1]),expected[count])
   rss=[x for x in Path(f'/proc/{p.pid}/status').read_text().splitlines() if x.startswith('VmHWM:')]
   checks.append({'name':label+' approximate process HWM','diagnostic_only':True,'value':rss})
   p.send_signal(signal.SIGINT);p.wait(timeout=35);check(label+' clean shutdown',p.returncode,0)
   with sqlite3.connect(db) as c:check(label+' integrity',c.execute('pragma integrity_check').fetchone()[0],'ok')
  finally:
   if p.poll() is None:p.send_signal(signal.SIGINT);p.wait(timeout=35)
   log.close();(out/'raw.json').write_text(json.dumps(records,indent=2));(out/'checks.json').write_text(json.dumps(checks,indent=2))
summary={'scope':'Actual one-job public batch and explicitly replay-expanded 10/50-job histories; full response parity, no source bodies published','seed_sha256':hashlib.sha256(seed.read_bytes()).hexdigest(),'binary_sha256':{k:hashlib.sha256(v.read_bytes()).hexdigest() for k,v in bins.items()},'raw_samples':len(records),'results':[],'limitations':['One Linux shared host; not a UI input/paint benchmark','VmHWM is approximate diagnostic only, not exact allocator peak','Replay workloads are not target-project evidence','Default server is not switched to the candidate']}
for count in [1,10,50]:
 for kind in bins:
  rr=[x for x in records if x['count']==count and x['strategy']==kind and not x['warmup']];summary['results'].append({'count':count,'strategy':kind,'measured_samples':len(rr),'median_ms':statistics.median(x['response_ms'] for x in rr),'max_ms':max(x['response_ms'] for x in rr),'bytes':rr[0]['bytes']})
(out/'summary.json').write_text(json.dumps(summary,indent=2));print(json.dumps(summary,indent=2))
