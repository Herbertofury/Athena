"""Reuse existing localhost security/asset checks; never queue a provider request.
Input database must contain only terminal fixture jobs. No tokens or private payloads exported.
"""
from pathlib import Path
import argparse,datetime,hashlib,json,signal,socket,sqlite3,subprocess,time,urllib.request,urllib.error
p=argparse.ArgumentParser();p.add_argument('--binary',type=Path,required=True);p.add_argument('--database',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);p.add_argument('--fixtures',type=Path,required=True);a=p.parse_args()
root=Path(__file__).resolve().parents[2];a.output_dir.mkdir(parents=True,exist_ok=False)
with sqlite3.connect(a.database) as c:
 pending=c.execute("select count(*) from jobs where state in ('queued','running')").fetchone()[0]
 if pending:raise RuntimeError('Refuse a database containing active jobs')
 original_jobs=c.execute('select count(*) from jobs').fetchone()[0]
try:
 with socket.create_connection(('127.0.0.1',41379),timeout=.2):raise RuntimeError('Port already in use; do not operate an unrelated process')
except ConnectionRefusedError:pass
base='http://127.0.0.1:41379';checks=[];proc=None
receipt={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'real loopback archive reads, compiled assets, JavaScript reader and negative security controls; retained public and generated fixtures; no provider requests or native-browser claim','binary_sha256':hashlib.sha256(a.binary.read_bytes()).hexdigest(),'harness_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'checks':checks,'completed':False}
def request(path,body=None,headers=None):
 h={'Content-Type':'application/json','Origin':base,'X-Atlas-Request':'local-ui'}
 if headers:
  for k,v in headers.items():
   if v is None:h.pop(k,None)
   else:h[k]=v
 data=body if isinstance(body,bytes) else None if body is None else json.dumps(body).encode()
 try:
  with urllib.request.urlopen(urllib.request.Request(base+path,data=data,headers=h),timeout=5) as r:return r.status,r.read(),dict(r.headers)
 except urllib.error.HTTPError as e:return e.code,e.read(),dict(e.headers)
def expect(name,actual,expected):
 checks.append({'name':name,'observed':actual,'expected':expected,'passed':actual==expected});assert actual==expected,(name,actual,expected)
log=(a.output_dir/'server.log').open('w')
try:
 proc=subprocess.Popen([str(a.binary.resolve()),'serve',str(a.database.resolve())],stdout=log,stderr=log)
 for _ in range(100):
  if proc.poll() is not None:raise RuntimeError('Owned process exited before readiness')
  try:
   if request('/api/overview')[0]==200:break
  except OSError:pass
  time.sleep(.05)
 else:raise TimeoutError('Loopback server did not become ready')
 for url,name in [('/','index.html'),('/app.js','app.js'),('/collection-input.mjs','collection-input.mjs'),('/style.css','style.css'),('/archive-view.mjs','archive-view.mjs')]:
  status,body,headers=request(url);expect(name+' status',status,200);expected=(root/'apps/atlas-lab/ui'/name).read_bytes();expect(name+' exact bytes',hashlib.sha256(body).hexdigest(),hashlib.sha256(expected).hexdigest());headers={k.lower():v for k,v in headers.items()};expect(name+' no-store',headers.get('cache-control'),'no-store');expect(name+' nosniff',headers.get('x-content-type-options'),'nosniff');expect(name+' frame isolation',"frame-ancestors 'none'" in headers.get('content-security-policy',''),True)
 valid={'CollectModrinthRaw':{'project':'sodium'}}
 expect('spoofed Host rejected',request('/api/overview',headers={'Host':'evil.invalid'})[0],403)
 expect('missing Origin rejected',request('/api/jobs',valid,{'Origin':None})[0],403)
 expect('foreign Origin rejected',request('/api/jobs',valid,{'Origin':'https://example.invalid'})[0],403)
 expect('missing request marker rejected',request('/api/jobs',valid,{'X-Atlas-Request':None})[0],403)
 for project in ['', '../path','https://example.invalid/','AANobbMI,gvQqBUqZ']:
  expect('invalid archive identity rejected',request('/api/jobs',{'CollectModrinthRaw':{'project':project}})[0],400)
 for extra in ['url','token']:
  expect('unrecognized archive field rejected',request('/api/jobs',{'CollectModrinthRaw':{'project':'sodium',extra:'generated-invalid'}})[0],422)
 expect('malformed JSON rejected',request('/api/jobs',b'{')[0],400)
 expect('oversized request rejected',request('/api/jobs',{'CollectModrinthRaw':{'project':'x'*5000}})[0],413)
 code,raw,headers=request('/api/overview');expect('overview status',code,200);data=json.loads(raw);expect('job count unchanged',len(data['jobs']),original_jobs);expect('no pending provider jobs',sum(data['counts'].get(k,0) for k in ['queued','running']),0)
 expect('no cross-origin read grant','access-control-allow-origin' in {k.lower():v for k,v in headers.items()},False)
 for job in data['jobs']:
  if job['state']=='succeeded':
   output=job['result']['project_archive'];expect('compact receipt has canonical identity',isinstance(output.get('canonical_id'),str),True);expect('generation remains a string',isinstance(output.get('generation'),str),True);expect('raw payload not copied into job output','payload' in output,False)
 # Read only existing archives and generated corrupt/large fixtures; no collection jobs.
 expected={}
 for file in sorted(a.fixtures.glob('*.json')):
  original=file.read_bytes();ident=json.loads(original)['id'];status,body,headers=request('/api/project-archive/'+ident);headers={k.lower():v for k,v in headers.items()}
  expect(ident+' archive status',status,200);expect(ident+' exact source bytes',body==original,True);expect(ident+' bound identity',headers.get('x-atlas-canonical-id'),ident);expect(ident+' source hash',headers.get('x-atlas-payload-sha256'),hashlib.sha256(original).hexdigest());expect(ident+' no-store',headers.get('cache-control'),'no-store')
  expected[ident]={'sha256':hashlib.sha256(original).hexdigest(),'generation':headers['x-atlas-generation'],'bytes':len(original)}
 with sqlite3.connect(a.database) as db:
  generated=db.execute("SELECT payload FROM snapshots WHERE provider='modrinth-project-raw' AND canonical_id='TEST0001'").fetchone()[0].encode()
 status,body,headers=request('/api/project-archive/TEST0001');headers={k.lower():v for k,v in headers.items()};expect('large generation status',status,200);expect('large generation remains exact header string',headers.get('x-atlas-generation'),'9007199254740993');expect('generated original bytes preserved',body==generated,True)
 expected['TEST0001']={'sha256':hashlib.sha256(generated).hexdigest(),'generation':'9007199254740993','bytes':len(generated)}
 for ident,status in [('sodium',400),('MISS0001',404),('CORRUPT1',422),('BIG00001',422)]:expect(ident+' read rejection',request('/api/project-archive/'+ident)[0],status)
 expect('archive read Host guard',request('/api/project-archive/AANobbMI',headers={'Host':'evil.invalid'})[0],403)
 (a.output_dir/'expected.json').write_text(json.dumps(expected))
 subprocess.run(['node',str(Path(__file__).with_name('read_saved.mjs')),str(a.output_dir/'expected.json'),str(a.output_dir/'javascript-reader.json')],check=True,timeout=20)
 receipt['javascript_reader']=json.loads((a.output_dir/'javascript-reader.json').read_text())
 receipt['completed']=True
finally:
 if proc is not None and proc.poll() is None:
  proc.send_signal(signal.SIGINT)
  try:proc.wait(timeout=5)
  except subprocess.TimeoutExpired:proc.terminate();proc.wait(timeout=5);receipt['forced_shutdown']=True
 log.close();(a.output_dir/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'checks':len(checks),'passed':all(x['passed'] for x in checks),'completed':receipt['completed']}))
