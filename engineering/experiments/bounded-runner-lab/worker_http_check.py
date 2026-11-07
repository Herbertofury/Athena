from pathlib import Path
import subprocess,urllib.request,urllib.error,time,json,sqlite3,signal,hashlib
root=Path(__file__).resolve().parents[2] / 'apps/atlas-lab';db=Path('/tmp/atlas-experiment-worker-20261027.sqlite');assert not db.exists(),'Do not overwrite prior evidence'
log=open('/tmp/atlas-experiment-worker.log','w');process=subprocess.Popen([str(root/'target/release/atlas-lab'),'serve',str(db)],stdout=log,stderr=log)
base='http://127.0.0.1:41379';checks=[]
def request(path,body=None,authorized=True):
 h={'Content-Type':'application/json'}
 if authorized:h.update({'Origin':base,'X-Atlas-Request':'local-ui'})
 req=urllib.request.Request(base+path,data=None if body is None else json.dumps(body).encode(),headers=h)
 try:
  with urllib.request.urlopen(req,timeout=5) as r:return r.status,r.read()
 except urllib.error.HTTPError as e:return e.code,e.read()
def expect(name,observed,expected):
 checks.append({'name':name,'observed':observed,'expected':expected,'passed':observed==expected});assert observed==expected,(name,observed,expected)
def job(ident):
 _,data=request('/api/overview');return next(x for x in json.loads(data)['jobs'] if x['id']==ident)
try:
 for _ in range(100):
  try:
   if request('/api/overview')[0]==200:break
  except OSError:pass
  time.sleep(.05)
 else:raise RuntimeError('Server not ready')
 expect('experiment requires same-origin guard',request('/api/jobs','DedupExperiment',False)[0],403)
 expect('arbitrary command remains rejected',request('/api/jobs',{'RunShell':'not executed'})[0],422)
 _,html=request('/');expect('explicit run control served',b'id="run-experiment"' in html,True)
 status,data=request('/api/jobs','DedupExperiment');expect('fixed experiment accepted',status,200);first=json.loads(data)['id']
 expect('active duplicate shares job',json.loads(request('/api/jobs','DedupExperiment')[1])['id'],first)
 until=time.monotonic()+25
 while time.monotonic()<until:
  row=job(first)
  if row['state'] in ('succeeded','failed'):break
  time.sleep(.01)
 else:raise RuntimeError('Bounded experiment did not complete')
 expect('execution succeeds',row['state'],'succeeded');run=row['result']['experiment'];expect('run completed',run['completed'],True);expect('timed pairs',len(run['evidence']['trials']),15);expect('warmups retained',len(run['warmup_trials']),2);expect('run-specific stress cases',run['evidence']['stress_cases'],10000);expect('complete output parity',all(x['equal_complete_output'] for x in run['evidence']['trials']),True);expect('missing evidence blocks promotion','Incomplete' in run['decision'],True);expect('memory remains explicitly unmeasured',all(x['peak_bytes']==0 for x in run['evidence']['trials']),True)
 first_result=row['result'];expect('journal ID present',isinstance(first_result.get('experiment_id'),int),True)
 status,data=request('/api/jobs','DedupExperiment');second=json.loads(data)['id'];expect('new completed-run history is append-only',second>first,True)
 until=time.monotonic()+5
 while time.monotonic()<until:
  current=job(second)
  if current['state']=='running':break
  if current['state'] in ('succeeded','failed'):raise RuntimeError('Cancellation window missed; do not claim cancellation acceptance')
  time.sleep(.005)
 else:raise RuntimeError('Second job not started')
 process.send_signal(signal.SIGINT);process.wait(timeout=35);expect('graceful cancellation shutdown',process.returncode,0)
 connection=sqlite3.connect(db);state,result=connection.execute('select state,result from jobs where id=?',(second,)).fetchone();cancelled=json.loads(result);expect('cancelled job is not successful',state,'failed');expect('cancellation is explicit',cancelled['experiment']['reason'],'Cancelled');expect('cancelled run not complete',cancelled['experiment']['completed'],False);expect('cancelled result has journal record',isinstance(cancelled.get('experiment_id'),int),True);expect('prior good result retained',json.loads(connection.execute('select result from jobs where id=?',(first,)).fetchone()[0])==first_result,True);expect('both evidence records retained',connection.execute('select count(*) from experiments').fetchone()[0],2);expect('SQLite integrity',connection.execute('pragma integrity_check').fetchone()[0],'ok')
 output={'checked_at':'2026-10-27','scope':'Real fixed local experiment job and cooperative process shutdown; no general self-modification or visual UI acceptance','binary_sha256':hashlib.sha256((root/'target/release/atlas-lab').read_bytes()).hexdigest(),'checks':checks,'completed_job':first_result,'cancelled_job':cancelled};Path('/tmp/atlas-experiment-worker-receipt.json').write_text(json.dumps(output,indent=2));print(json.dumps({'passed':len(checks),'total':len(checks),'elapsed_ms':run['elapsed_ms'],'cancelled_trials':len(cancelled['experiment']['evidence']['trials']),'cancelled_warmups':len(cancelled['experiment']['warmup_trials'])}))
finally:
 if process.poll() is None:process.send_signal(signal.SIGINT);process.wait(timeout=35)
 log.close()
