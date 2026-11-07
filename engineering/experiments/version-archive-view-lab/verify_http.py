"""Bounded read-only verification on a new copy of an inactive public-fixture DB."""
import argparse,datetime,hashlib,json,pathlib,signal,socket,sqlite3,subprocess,time,urllib.request,urllib.error
p=argparse.ArgumentParser();p.add_argument('--source-db',type=pathlib.Path,required=True);p.add_argument('--binary',type=pathlib.Path,required=True);p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=False)
root=pathlib.Path(__file__).resolve().parents[2];base='http://127.0.0.1:41379';db=a.output/'fixture.sqlite';checks=[];proc=None
sha=lambda b:hashlib.sha256(b).hexdigest()
if a.source_db.stat().st_size>32*1024*1024:raise ValueError('Source database byte budget')
source_before=sha(a.source_db.read_bytes())
def require(ok,message):
 if not ok:raise ValueError(message)
def check(name,actual,expected):
 checks.append({'name':name,'actual':actual,'expected':expected,'passed':actual==expected});require(actual==expected,name)
with sqlite3.connect(a.source_db.resolve().as_uri()+'?mode=ro',uri=True) as source,sqlite3.connect(db) as target:
 require(source.execute("SELECT count(*) FROM jobs WHERE state IN ('queued','running')").fetchone()[0]==0,'Source has active jobs')
 count,total=source.execute('SELECT count(*),coalesce(sum(length(CAST(payload AS BLOB))),0) FROM snapshots').fetchone();require(count<=100 and total<=16*1024*1024,'Source history budget');source.backup(target)
 version='{"id":"SHARED01","project_id":"AANobbMI","name":"Generated fixture","version_number":"1","date_published":"2026-10-30T00:00:00Z","game_versions":["1.21.1"],"loaders":["fabric"],"dependencies":[],"files":[{"filename":"fixture.jar","url":"https://example.invalid/not-fetched","size":7,"primary":true,"hashes":{"sha1":"generated-only"}}],"changelog":"雪 <script>inert</script>","unknown":18446744073709551617}'
 project=' {"id":"SHARED01","slug":"generated","title":"Generated project","description":"Not a real provider item","project_type":"mod","versions":[],"unknown":18446744073709551617} '
 for generation,provider,payload in [(9007199254740993,'modrinth-version',version),(9007199254740994,'modrinth-project-raw',project)]:
  target.execute('INSERT INTO snapshots(generation,provider,canonical_id,payload) VALUES(?,?,?,?)',(generation,provider,'SHARED01',payload))
 for ident,payload in [('CORRUPT1',version),('INVALID1','{'),('BIG00001','x'*(5*1024*1024))]:target.execute("INSERT INTO snapshots(provider,canonical_id,payload) VALUES('modrinth-version',?,?)",(ident,payload))
 target.commit();before=target.execute('SELECT generation,provider,canonical_id,payload FROM snapshots ORDER BY generation').fetchall();jobs=target.execute('SELECT count(*) FROM jobs').fetchone()[0]
 expected=[]
 for kind,provider in [('version','modrinth-version'),('project','modrinth-project-raw')]:
  for ident,generation,payload in target.execute('SELECT s.canonical_id,s.generation,s.payload FROM snapshots s WHERE s.provider=? AND s.generation=(SELECT max(t.generation) FROM snapshots t WHERE t.provider=s.provider AND t.canonical_id=s.canonical_id)',(provider,)):
   if ident in ['CORRUPT1','INVALID1','BIG00001']:continue
   b=payload.encode();expected.append({'kind':kind,'id':ident,'generation':str(generation),'bytes':len(b),'sha256':sha(b)})
require(len(expected)<=20,'Record count budget')
try:
 with socket.create_connection(('127.0.0.1',41379),timeout=.2):raise ValueError('Port is owned by another process')
except ConnectionRefusedError:pass
receipt={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Retained public version objects plus generated namespace/corruption fixtures; local reads only; no provider requests or browser acceptance','binary_sha256':sha(a.binary.read_bytes()),'harness_sha256':sha(pathlib.Path(__file__).read_bytes()),'checks':checks,'complete':False}
def request(path,headers=None):
 try:
  with urllib.request.urlopen(urllib.request.Request(base+path,headers=headers or {}),timeout=5) as r:status=r.status;b=r.read(2*1024*1024+1);h=dict(r.headers)
 except urllib.error.HTTPError as e:status=e.code;b=e.read(2*1024*1024+1);h=dict(e.headers)
 require(len(b)<=2*1024*1024,'Response budget');return status,b,{k.lower():v for k,v in h.items()}
log=(a.output/'server.log').open('w')
try:
 proc=subprocess.Popen([str(a.binary.resolve()),'serve',str(db.resolve())],stdout=log,stderr=log)
 for _ in range(100):
  require(proc.poll() is None,'Server exited before readiness')
  try:
   if request('/api/overview')[0]==200:break
  except OSError:pass
  time.sleep(.05)
 else:raise TimeoutError('Server readiness')
 for route,name in [('/','index.html'),('/app.js','app.js'),('/archive-view.mjs','archive-view.mjs'),('/style.css','style.css'),('/collection-input.mjs','collection-input.mjs')]:
  status,b,h=request(route);check(name+' status',status,200);check(name+' exact compiled bytes',sha(b),sha((root/'apps/atlas-lab/ui'/name).read_bytes()))
 for row in expected:
  status,b,h=request('/api/'+row['kind']+'-archive/'+row['id']);prefix=row['kind']+' '+row['id'];check(prefix+' status',status,200);check(prefix+' full bytes',sha(b),row['sha256']);check(prefix+' size',len(b),row['bytes']);check(prefix+' kind',h.get('x-atlas-archive-kind'),row['kind']);check(prefix+' id',h.get('x-atlas-canonical-id'),row['id']);check(prefix+' generation',h.get('x-atlas-generation'),row['generation']);check(prefix+' digest header',h.get('x-atlas-payload-sha256'),row['sha256']);check(prefix+' no-store',h.get('cache-control'),'no-store');check(prefix+' no CORS grant','access-control-allow-origin' in h,False);check(prefix+' no sniff',h.get('x-content-type-options'),'nosniff')
 for ident,status in [('sodium',400),('MISSING1',404),('CORRUPT1',422),('INVALID1',422),('BIG00001',422)]:check(ident+' rejection',request('/api/version-archive/'+ident)[0],status)
 check('version Host guard',request('/api/version-archive/SHARED01',{'Host':'evil.invalid'})[0],403)
 check('project route cannot read version-only namespace',request('/api/project-archive/g6ju16VJ')[0],404)
 (a.output/'expected.json').write_text(json.dumps(expected));subprocess.run(['node',str(pathlib.Path(__file__).with_name('read_saved.mjs')),str(a.output/'expected.json'),str(a.output/'javascript.json')],check=True,timeout=30)
 receipt['javascript']=json.loads((a.output/'javascript.json').read_text());receipt['complete']=True
except Exception as error:
 receipt['complete']=False;receipt['failure']={'type':type(error).__name__,'message':str(error)};raise
finally:
 if proc is not None and proc.poll() is None:
  proc.send_signal(signal.SIGINT)
  try:proc.wait(timeout=5)
  except subprocess.TimeoutExpired:proc.terminate();proc.wait(timeout=5);receipt['forced_shutdown']=True
 log.close()
 try:
  with sqlite3.connect(db) as target:
   check('snapshot rows unchanged',target.execute('SELECT generation,provider,canonical_id,payload FROM snapshots ORDER BY generation').fetchall()==before,True);check('jobs unchanged',target.execute('SELECT count(*) FROM jobs').fetchone()[0],jobs);check('integrity',target.execute('PRAGMA integrity_check').fetchone()[0],'ok')
  check('source database unchanged',sha(a.source_db.read_bytes()),source_before)
 except Exception as error:
  receipt['complete']=False;receipt['verification_failure']={'type':type(error).__name__,'message':str(error)};raise
 finally:(a.output/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'complete':receipt['complete'],'checks':len(checks),'records':len(expected)}))
