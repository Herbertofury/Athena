"""Read fixed saved public upstreams without changing provider budgets or history."""
import argparse,datetime,hashlib,json,pathlib,signal,socket,sqlite3,subprocess,time,urllib.request,urllib.error
p=argparse.ArgumentParser();p.add_argument('--source-db',type=pathlib.Path,required=True);p.add_argument('--binary',type=pathlib.Path,required=True);p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=False)
root=pathlib.Path(__file__).resolve().parents[2];base='http://127.0.0.1:41379';db=a.output/'fixture.sqlite';sha=lambda b:hashlib.sha256(b).hexdigest();checks=[];proc=None
if a.source_db.stat().st_size>32*1024*1024:raise ValueError('Source database budget')
source_before=sha(a.source_db.read_bytes())
def check(name,actual,expected):
 checks.append({'name':name,'actual':actual,'expected':expected,'passed':actual==expected})
 if actual!=expected:raise ValueError(name)
with sqlite3.connect(a.source_db.resolve().as_uri()+'?mode=ro',uri=True) as src,sqlite3.connect(db) as dst:
 if src.execute("SELECT count(*) FROM jobs WHERE state IN ('queued','running')").fetchone()[0]:raise ValueError('Active source jobs')
 src.backup(dst);hls=dst.execute("SELECT payload FROM snapshots WHERE provider='github-upstream' AND canonical_id='hls' ORDER BY generation DESC LIMIT 1").fetchone()[0]
 dst.execute("INSERT INTO snapshots(generation,provider,canonical_id,payload) VALUES(9007199254740993,'github-upstream','hls',?)",(hls,));dst.execute('UPDATE upstream_budget SET pending=1,next_allowed=max(next_allowed,4102444800)');dst.commit()
 original=dst.execute('SELECT * FROM snapshots ORDER BY generation').fetchall();attempts=dst.execute('SELECT * FROM collection_attempts ORDER BY id').fetchall();budget=dst.execute('SELECT * FROM upstream_budget').fetchall();jobs=dst.execute('SELECT * FROM jobs ORDER BY id').fetchall()
 expected=[]
 for ident in ['rustsec','hls','serde-json']:
  generation,payload=dst.execute("SELECT generation,payload FROM snapshots WHERE provider='github-upstream' AND canonical_id=? ORDER BY generation DESC LIMIT 1",(ident,)).fetchone();body=payload.encode();expected.append({'kind':'upstream','id':ident,'generation':str(generation),'bytes':len(body),'sha256':sha(body)})
try:
 with socket.create_connection(('127.0.0.1',41379),timeout=.2):raise ValueError('Unrelated process owns port')
except ConnectionRefusedError:pass
receipt={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Three retained public upstream snapshots; generated generation, pending-budget and corruption fixtures; no provider request, budget reset, grant or browser acceptance','binary_sha256':sha(a.binary.read_bytes()),'harness_sha256':sha(pathlib.Path(__file__).read_bytes()),'checks':checks,'complete':False};log=(a.output/'server.log').open('w')
def request(path,headers=None,method='GET'):
 try:
  with urllib.request.urlopen(urllib.request.Request(base+path,headers=headers or {},method=method),timeout=5) as r:status=r.status;b=r.read(2*1024*1024+1);h=dict(r.headers)
 except urllib.error.HTTPError as e:status=e.code;b=e.read(2*1024*1024+1);h=dict(e.headers)
 if len(b)>2*1024*1024:raise ValueError('Response budget')
 return status,b,{k.lower():v for k,v in h.items()}
try:
 proc=subprocess.Popen([str(a.binary.resolve()),'serve',str(db.resolve())],stdout=log,stderr=log)
 for _ in range(100):
  if proc.poll() is not None:raise RuntimeError('Server exited')
  try:
   if request('/api/overview')[0]==200:break
  except OSError:pass
  time.sleep(.05)
 else:raise TimeoutError('Server readiness')
 for route,name in [('/','index.html'),('/app.js','app.js'),('/archive-view.mjs','archive-view.mjs'),('/collection-input.mjs','collection-input.mjs'),('/job-submit.mjs','job-submit.mjs')]:
  status,b,h=request(route);check(name+' status',status,200);check(name+' exact compiled bytes',sha(b),sha((root/'apps/atlas-lab/ui'/name).read_bytes()))
 for row in expected:
  status,b,h=request('/api/upstream-archive/'+row['id']);prefix=row['id'];check(prefix+' status',status,200);check(prefix+' exact bytes',sha(b),row['sha256']);check(prefix+' byte count',len(b),row['bytes']);check(prefix+' namespace',h.get('x-atlas-archive-kind'),'upstream');check(prefix+' identity',h.get('x-atlas-canonical-id'),row['id']);check(prefix+' generation',h.get('x-atlas-generation'),row['generation']);check(prefix+' digest',h.get('x-atlas-payload-sha256'),row['sha256']);check(prefix+' no-store',h.get('cache-control'),'no-store');check(prefix+' no CORS grant','access-control-allow-origin' in h,False)
 for ident in ['constructor','HLS','new-unreviewed','AANobbMI']:check(ident+' invalid source',request('/api/upstream-archive/'+ident)[0],400)
 check('Host guard',request('/api/upstream-archive/hls',{'Host':'evil.invalid'})[0],403)
 check('read-only route',request('/api/upstream-archive/hls',{'Origin':base,'X-Atlas-Request':'local-ui'},'POST')[0],405)
 (a.output/'expected.json').write_text(json.dumps(expected));subprocess.run(['node',str(root/'experiments/version-archive-view-lab/read_saved.mjs'),str(a.output/'expected.json'),str(a.output/'reader.json')],check=True,timeout=20);receipt['reader']=json.loads((a.output/'reader.json').read_text())
 for label,payload in [('wrong-repository',hls.replace('video-dev/hls.js','serde-rs/json')),('malformed','{}'),('oversized','x'*(5*1024*1024))]:
  with sqlite3.connect(db) as c:c.execute("INSERT INTO snapshots(provider,canonical_id,payload) VALUES('github-upstream','hls',?)",(payload,));c.commit()
  check(label+' rejection',request('/api/upstream-archive/hls')[0],422)
 subprocess.run(['node',str(pathlib.Path(__file__).with_name('check_retention.mjs')),str(a.output/'retention.json')],check=True,timeout=20);receipt['retention']=json.loads((a.output/'retention.json').read_text());receipt['complete']=True
except Exception as error:receipt['complete']=False;receipt['failure']={'type':type(error).__name__,'message':str(error)};raise
finally:
 try:
  if proc is not None and proc.poll() is None:
   proc.send_signal(signal.SIGINT)
   try:proc.wait(timeout=5)
   except subprocess.TimeoutExpired:proc.terminate();proc.wait(timeout=5);receipt['forced_shutdown']=True
  log.close()
  with sqlite3.connect(db) as c:
   check('original snapshots unchanged',c.execute('SELECT * FROM snapshots WHERE generation<=9007199254740993 ORDER BY generation').fetchall()==original,True)
   check('attempt history unchanged',c.execute('SELECT * FROM collection_attempts ORDER BY id').fetchall()==attempts,True);check('request budget unchanged',c.execute('SELECT * FROM upstream_budget').fetchall()==budget,True);check('jobs unchanged',c.execute('SELECT * FROM jobs ORDER BY id').fetchall()==jobs,True);check('integrity',c.execute('PRAGMA integrity_check').fetchone()[0],'ok')
  check('source database unchanged',sha(a.source_db.read_bytes()),source_before)
 except Exception as error:receipt['complete']=False;receipt['cleanup_failure']={'type':type(error).__name__,'message':str(error)};raise
 finally:(a.output/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'complete':receipt['complete'],'checks':len(checks),'records':len(expected)}))
