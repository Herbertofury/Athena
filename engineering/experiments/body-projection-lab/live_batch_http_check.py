import json, pathlib, subprocess, urllib.request, urllib.error, time, signal, sqlite3, hashlib
root=pathlib.Path(__file__).resolve().parents[2] / 'apps/atlas-lab';db=pathlib.Path('/tmp/atlas-body-batch-20261027.sqlite');assert not db.exists(),'Preserve prior run: choose a fresh evidence path'
log=open('/tmp/atlas-body-batch-server.log','w');p=subprocess.Popen([str(root/'target/release/atlas-lab'),'serve',str(db)],stdout=log,stderr=log)
base='http://127.0.0.1:41379';checks=[]
def request(path,body=None,headers=None):
 data=None if body is None else json.dumps(body).encode();h={'Content-Type':'application/json'};h.update(headers or {});r=urllib.request.Request(base+path,data=data,headers=h)
 try:
  with urllib.request.urlopen(r,timeout=5) as x:return x.status,x.read(),dict(x.headers)
 except urllib.error.HTTPError as e:return e.code,e.read(),dict(e.headers)
def expect(name,actual,wanted):
 checks.append({'name':name,'observed':actual,'expected':wanted,'passed':actual==wanted});assert actual==wanted,(name,actual,wanted)
try:
 for _ in range(100):
  try:
   status,_,_=request('/api/overview')
   if status==200:break
  except OSError:pass
  if p.poll() is not None:raise RuntimeError('Server exited')
  time.sleep(.1)
 else:raise RuntimeError('Server not ready')
 h={'Origin':base,'X-Atlas-Request':'local-ui'};job={'CollectModrinthBatch':{'projects':['AANobbMI','gvQqBUqZ','YL57xq9U']}}
 expect('missing origin rejected',request('/api/jobs',job)[0],403)
 expect('foreign origin rejected',request('/api/jobs',job,{'Origin':'https://evil.example','X-Atlas-Request':'local-ui'})[0],403)
 expect('wrong host rejected',request('/api/overview',headers={'Host':'evil.example'})[0],403)
 expect('duplicate identities rejected',request('/api/jobs',{'CollectModrinthBatch':{'projects':['AANobbMI','AANobbMI']}},h)[0],400)
 expect('batch size budget enforced',request('/api/jobs',{'CollectModrinthBatch':{'projects':[str(x).zfill(8) for x in range(21)]}},h)[0],400)
 expect('arbitrary URL rejected',request('/api/jobs',{'CollectModrinthBatch':{'projects':['https://evil.example']}},h)[0],400)
 expect('request body budget enforced',request('/api/jobs',{'CollectModrinth':{'project':'x'*5000}},h)[0],413)
 expect('arbitrary operation remains rejected',request('/api/jobs',{'RunShell':{'command':'unrecognized'}},h)[0],422)
 status,content,headers=request('/collection-input.mjs');expect('input module served',status,200);expect('module type',headers.get('content-type'),'text/javascript');expect('no-store preserved',headers.get('cache-control'),'no-store');expect('CSP remains same-origin',"connect-src 'self'" in headers.get('content-security-policy',''),True)
 status,content,_=request('/');expect('HTML uses module entrypoint',b'type="module" src="/app.js"' in content,True)
 status,content,_=request('/api/jobs',job,h);expect('batch queued',status,200);ident=json.loads(content)['id']
 status,content,_=request('/api/jobs',job,h);expect('active duplicate shares job',json.loads(content)['id'],ident)
 until=time.monotonic()+70
 while time.monotonic()<until:
  status,body,_=request('/api/overview');overview=json.loads(body);row=next(x for x in overview['jobs'] if x['id']==ident)
  if row['state'] in ('succeeded','failed'):break
  time.sleep(.2)
 else:raise RuntimeError('Job did not finish within budget')
 expect('real batch job succeeds',row['state'],'succeeded');batch=row['result']['batch'];expect('no missing source IDs',batch['missing_ids'],[]);expect('all identities retained',[x['id'] for x in batch['projects']],job['CollectModrinthBatch']['projects'])
 expect('long bodies present in actual HTTP result',all(isinstance(x.get('body'),str) and len(x['body'])>0 for x in batch['projects']),True)
 p.send_signal(signal.SIGINT);p.wait(timeout=40);expect('graceful shutdown',p.returncode,0)
 connection=sqlite3.connect(db);saved=connection.execute('select state,result from jobs where id=?',(ident,)).fetchone();expect('reopened job state',saved[0],'succeeded');expect('complete result survives reopen',json.loads(saved[1])==row['result'],True);expect('SQLite integrity',connection.execute('pragma integrity_check').fetchone()[0],'ok')
 result={'checked_at':'2026-10-27','scope':'Real same-process loopback HTTP and public Modrinth batch; not visual browser acceptance','binary_sha256':hashlib.sha256((root/'target/release/atlas-lab').read_bytes()).hexdigest(),'checks':checks,'projection_counts':[{'id':x['id'],'gallery':None if x['gallery'] is None else len(x['gallery']),'versions':len(x['versions']),'body_bytes':len(x['body'].encode()),'body_sha256':hashlib.sha256(x['body'].encode()).hexdigest()} for x in batch['projects']]}
 pathlib.Path('/tmp/atlas-body-batch-http-receipt.json').write_text(json.dumps(result,indent=2));print(json.dumps({'passed':len(checks),'total':len(checks),'counts':result['projection_counts']}))
finally:
 if p.poll() is None:p.send_signal(signal.SIGINT);p.wait(timeout=40)
 log.close()
