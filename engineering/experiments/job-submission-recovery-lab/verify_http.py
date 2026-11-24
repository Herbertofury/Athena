"""Exercise two explicit bounded local jobs in a new inactive-fixture copy."""
import argparse,datetime,hashlib,json,pathlib,signal,socket,sqlite3,subprocess,time,urllib.request
p=argparse.ArgumentParser();p.add_argument('--source-db',type=pathlib.Path,required=True);p.add_argument('--binary',type=pathlib.Path,required=True);p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=False)
root=pathlib.Path(__file__).resolve().parents[2];base='http://127.0.0.1:41379';db=a.output/'fixture.sqlite';sha=lambda b:hashlib.sha256(b).hexdigest();checks=[];proc=None
if a.source_db.stat().st_size>32*1024*1024:raise ValueError('Source database budget')
source_before=sha(a.source_db.read_bytes())
def check(name,actual,expected):
 checks.append({'name':name,'actual':actual,'expected':expected,'passed':actual==expected})
 if actual!=expected:raise ValueError(name)
with sqlite3.connect(a.source_db.resolve().as_uri()+'?mode=ro',uri=True) as src,sqlite3.connect(db) as dst:
 if src.execute("SELECT count(*) FROM jobs WHERE state IN ('queued','running')").fetchone()[0]:raise ValueError('Active source jobs')
 src.backup(dst);dst.execute("INSERT INTO jobs(id,payload,state) VALUES(9007199254740992,'\"DedupExperiment\"','succeeded')");dst.commit()
 snapshots=dst.execute('SELECT generation,provider,canonical_id,payload FROM snapshots ORDER BY generation').fetchall()
try:
 with socket.create_connection(('127.0.0.1',41379),timeout=.2):raise ValueError('Unrelated process owns test port')
except ConnectionRefusedError:pass
receipt={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Generated large job id plus real local Rust enqueue/worker/receipt behavior; no provider collection or native browser claim','binary_sha256':sha(a.binary.read_bytes()),'checks':checks,'complete':False};log=(a.output/'server.log').open('w')
try:
 proc=subprocess.Popen([str(a.binary.resolve()),'serve',str(db.resolve())],stdout=log,stderr=log)
 for _ in range(100):
  if proc.poll() is not None:raise RuntimeError('Server exited')
  try:
   with urllib.request.urlopen(base+'/api/overview',timeout=2) as r:
    if r.status==200:break
  except OSError:pass
  time.sleep(.05)
 else:raise TimeoutError('Server readiness')
 for route,name in [('/app.js','app.js'),('/job-submit.mjs','job-submit.mjs')]:
  with urllib.request.urlopen(base+route,timeout=5) as r:b=r.read(131073);headers={k.lower():v for k,v in r.headers.items()}
  check(name+' byte budget',len(b)<=131072,True);check(name+' exact bytes',sha(b),sha((root/'apps/atlas-lab/ui'/name).read_bytes()));check(name+' no-store',headers.get('cache-control'),'no-store');check(name+' no sniff',headers.get('x-content-type-options'),'nosniff')
 subprocess.run(['node',str(pathlib.Path(__file__).with_name('transport.mjs')),str(a.output/'transport.json')],check=True,timeout=35)
 transport=json.loads((a.output/'transport.json').read_text());receipt['transport']=transport
 check('transport completed',transport['complete'],True);check('confirmed id retained exactly',transport['confirmed']['id'],'9007199254740993');check('stalled call forwarded once',transport['forwarded_posts'],1);check('backend accepted stalled call',transport['backend_status'],200)
 accepted=str(json.loads(transport['backend_receipt'])['id']);receipt['accepted_after_unconfirmed_id']=accepted
 with sqlite3.connect(db) as c:
  for ident in [transport['confirmed']['id'],accepted]:check('accepted job exists '+ident,c.execute('SELECT count(*) FROM jobs WHERE id=?',(ident,)).fetchone()[0],1)
 receipt['complete']=True
except Exception as error:receipt['complete']=False;receipt['failure']={'type':type(error).__name__,'message':str(error)};raise
finally:
 try:
  if proc is not None and proc.poll() is None:
   proc.send_signal(signal.SIGINT)
   try:proc.wait(timeout=5)
   except subprocess.TimeoutExpired:proc.terminate();proc.wait(timeout=5);receipt['forced_shutdown']=True
  log.close()
  with sqlite3.connect(db) as c:
   receipt['new_jobs']=[[str(ident),state] for ident,state in c.execute('SELECT id,state FROM jobs WHERE id>9007199254740992 ORDER BY id')];check('at most two explicit jobs',1<=len(receipt['new_jobs'])<=2,True);check('existing snapshots unchanged',c.execute('SELECT generation,provider,canonical_id,payload FROM snapshots ORDER BY generation').fetchall()==snapshots,True);check('integrity',c.execute('PRAGMA integrity_check').fetchone()[0],'ok')
  check('source database unchanged',sha(a.source_db.read_bytes()),source_before)
 except Exception as error:receipt['complete']=False;receipt['cleanup_failure']={'type':type(error).__name__,'message':str(error)};raise
 finally:(a.output/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'complete':receipt['complete'],'checks':len(checks),'new_jobs':len(receipt['new_jobs'])}))
