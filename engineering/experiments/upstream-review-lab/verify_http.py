"""Bounded loopback test: one public GET, then explicitly generated offline gates."""
import argparse, datetime, hashlib, json, signal, sqlite3, subprocess, time, urllib.request, urllib.error
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--binary',type=Path,required=True);p.add_argument('--seed-db',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);a=p.parse_args()
out=a.output_dir;out.mkdir(parents=True,exist_ok=False);db=out/'test.sqlite';source=sqlite3.connect(f'file:{a.seed_db.resolve()}?mode=ro',uri=True);target=sqlite3.connect(db);source.backup(target);source.close();target.close()
base='http://127.0.0.1:41379';root=Path(__file__).resolve().parents[2]/'apps/atlas-lab';checks=[];receipt={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'binary_sha256':hashlib.sha256(a.binary.read_bytes()).hexdigest(),'scope':'One actual public request using copied existing budget; then generated cooldown/interruption states, no further provider requests','checks':checks,'completed':False};proc=None;log=open(out/'server.log','w')
def req(path,body=None,headers=None):
 h={'Content-Type':'application/json','Origin':base,'X-Atlas-Request':'local-ui'};h.update(headers or {});r=urllib.request.Request(base+path,data=None if body is None else json.dumps(body).encode(),headers=h)
 try:
  with urllib.request.urlopen(r,timeout=5) as response:return response.status,response.read(),dict(response.headers)
 except urllib.error.HTTPError as e:return e.code,e.read(),dict(e.headers)
def check(name,actual,expected):
 checks.append({'name':name,'observed':actual,'expected':expected,'passed':actual==expected});assert actual==expected,(name,actual,expected)
def start():
 global proc
 proc=subprocess.Popen([str(a.binary.resolve()),'serve',str(db.resolve())],stdout=log,stderr=log)
 for _ in range(100):
  if proc.poll() is not None:raise RuntimeError('New server exited, not testing another process')
  try:
   if req('/api/overview')[0]==200:return
  except OSError:pass
  time.sleep(.05)
 raise TimeoutError('Server startup')
def stop():
 if proc is not None and proc.poll() is None:proc.send_signal(signal.SIGINT);proc.wait(timeout=35);check('clean server shutdown',proc.returncode,0)
def job():
 code,body,_=req('/api/jobs',{'ReviewUpstream':{'source':'hls'}});check('fixed job queued',code,200);ident=json.loads(body)['id'];end=time.monotonic()+40
 while time.monotonic()<end:
  rows=json.loads(req('/api/overview')[1])['jobs'];row=next(x for x in rows if x['id']==ident)
  if row['state'] in ('succeeded','failed'):return row
  time.sleep(.05)
 raise TimeoutError('Queue terminal state')
try:
 start()
 for name,body,headers,expected in [('foreign origin',{'ReviewUpstream':{'source':'hls'}},{'Origin':'https://example.invalid'},403),('foreign host',{'ReviewUpstream':{'source':'hls'}},{'Host':'example.invalid'},403),('unknown source',{'ReviewUpstream':{'source':'other'}},{},400),('credential field',{'ReviewUpstream':{'source':'hls','token':'fixture-not-secret'}},{},422),('oversize body',{'ReviewUpstream':{'source':'x'*5000}},{},413)]:check(name+' rejected',req('/api/jobs',body,headers)[0],expected)
 for url,path in [('/',root/'ui/index.html'),('/app.js',root/'ui/app.js'),('/collection-input.mjs',root/'ui/collection-input.mjs'),('/style.css',root/'ui/style.css')]:
  code,body,headers=req(url);check('asset status '+url,code,200);check('asset exact '+url,hashlib.sha256(body).hexdigest(),hashlib.sha256(path.read_bytes()).hexdigest())
 row=job();receipt['public_job']=row;check('public observation succeeds',row['state'],'succeeded');r=row['result']['upstream_review'];check('actual selected API version',r['response']['api_version_selected'],'2026-03-10');check('repeat unchanged',r['comparison'],'unchanged');stop()
 con=sqlite3.connect(db);payload=con.execute('select payload from snapshots where generation=?',(r['generation'],)).fetchone()[0];check('stored full payload hash',hashlib.sha256(payload.encode()).hexdigest(),r['payload_sha256']);check('stored bytes',len(payload.encode()),r['payload_bytes']);before=con.execute('select count(*) from snapshots').fetchone()[0];budget=con.execute('select attempts from upstream_budget').fetchone()[0]
 con.execute('update upstream_budget set next_allowed=?',(int(time.time())+300,));con.commit();con.close();start();row=job();receipt['generated_cooldown_job']=row;check('persisted cooldown fails without fetching',row['state'],'failed');check('cooldown state',row['result']['upstream_review']['state'],'cooldown');stop()
 con=sqlite3.connect(db);check('cooldown adds no request',con.execute('select attempts from upstream_budget').fetchone()[0],budget);con.execute('update upstream_budget set next_allowed=0,pending=1');con.commit();con.close();start();row=job();receipt['generated_interrupted_job']=row;check('interrupted reservation fails closed',row['state'],'failed');check('interruption actionable','Interrupted' in row['result']['error'],True);stop()
 con=sqlite3.connect(db);check('gates retain prior snapshots',con.execute('select count(*) from snapshots').fetchone()[0],before);check('interruption adds no request',con.execute('select attempts from upstream_budget').fetchone()[0],budget);check('SQLite integrity',con.execute('pragma integrity_check').fetchone()[0],'ok');con.close();receipt['completed']=True
except Exception as error:receipt['error']=str(error);raise
finally:
 stop();log.close();(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'completed':receipt['completed'],'checks':len(checks),'passed':sum(c['passed'] for c in checks),'error':receipt.get('error')}))
