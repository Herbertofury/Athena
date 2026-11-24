"""Bounded real official-API collection -> durable snapshot -> fixed experiment check.
No credentials, file downloads, arbitrary URLs, or private data. Retains receipts and DB.
"""
from pathlib import Path
import argparse,datetime,hashlib,json,signal,sqlite3,subprocess,time,urllib.request,urllib.error
p=argparse.ArgumentParser();p.add_argument('--binary',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);a=p.parse_args()
a.output_dir.mkdir(parents=True,exist_ok=False);db=a.output_dir/'test.sqlite';base='http://127.0.0.1:41379';checks=[];proc=None
receipt={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'real official Modrinth public metadata through local queue; no browser interaction claim','binary_sha256':hashlib.sha256(a.binary.read_bytes()).hexdigest(),'checks':checks,'completed':False}
def req(path,body=None,authorized=True):
 h={'Content-Type':'application/json'}
 if authorized:h.update({'Origin':base,'X-Atlas-Request':'local-ui'})
 try:
  with urllib.request.urlopen(urllib.request.Request(base+path,data=None if body is None else json.dumps(body).encode(),headers=h),timeout=5) as r:return r.status,r.read()
 except urllib.error.HTTPError as e:return e.code,e.read()
def expect(name,actual,want):
 checks.append({'name':name,'observed':actual,'expected':want,'passed':actual==want});assert actual==want,(name,actual,want)
def queue(body):
 code,raw=req('/api/jobs',body);expect('queue accepted',code,200);return json.loads(raw)['id']
def wait(ident):
 end=time.monotonic()+40
 while time.monotonic()<end:
  code,raw=req('/api/overview');assert code==200
  row=next(j for j in json.loads(raw)['jobs'] if j['id']==ident)
  if row['state'] in ('succeeded','failed'):return row
  time.sleep(.05)
 raise TimeoutError('job did not reach terminal state within bounded observation')
log=(a.output_dir/'server.log').open('w')
try:
 proc=subprocess.Popen([str(a.binary.resolve()),'serve',str(db.resolve())],stdout=log,stderr=log)
 for _ in range(100):
  if proc.poll() is not None:raise RuntimeError('new process exited; do not test unrelated server')
  try:
   if req('/api/overview')[0]==200:break
  except OSError:pass
  time.sleep(.05)
 else:raise TimeoutError('server unavailable')
 command={'CollectModrinthVersions':{'versions':['g6ju16VJ','Ag5S66CF','1rb9wI5K']}}
 expect('CSRF guard retained',req('/api/jobs',command,False)[0],403)
 for ids in [[],['sodium'],['abcdefgh','abcdefgh'],[str(i).zfill(8) for i in range(21)]]:expect('invalid ID batch rejected',req('/api/jobs',{'CollectModrinthVersions':{'versions':ids}})[0],400)
 expect('arbitrary URL field rejected',req('/api/jobs',{'CollectModrinthVersions':{'versions':['g6ju16VJ'],'url':'https://example.invalid'}})[0],422)
 row=wait(queue(command));receipt['collection_job']=row;expect('real public collection succeeds',row['state'],'succeeded')
 result=row['result']['version_collection'];expect('three records retained',len(result['records']),3);expect('no missing IDs',result['missing_ids'],[])
 conn=sqlite3.connect(db);saved={}
 for rec in result['records']:
  generation,payload=conn.execute("select generation,payload from snapshots where provider='modrinth-version' and canonical_id=? order by generation desc limit 1",(rec['canonical_id'],)).fetchone();saved[rec['canonical_id']]=(generation,payload)
  expect('receipt generation exact '+rec['canonical_id'],rec['generation'],str(generation));expect('receipt SHA matches complete stored bytes '+rec['canonical_id'],rec['payload_sha256'],hashlib.sha256(payload.encode()).hexdigest());expect('receipt length matches complete stored bytes '+rec['canonical_id'],rec['payload_bytes'],len(payload.encode()));expect('stored canonical ID '+rec['canonical_id'],json.loads(payload)['id'],rec['canonical_id'])
 # One bounded refresh includes an explicitly missing ID. No erase of prior snapshot.
 row=wait(queue({'CollectModrinthVersions':{'versions':['g6ju16VJ','00000000']}}));receipt['partial_job']=row;expect('partial is not success',row['state'],'failed');expect('missing identity explicit',row['result']['version_collection']['missing_ids'],['00000000']);expect('previous generation retained',conn.execute('select payload from snapshots where generation=?',(saved['g6ju16VJ'][0],)).fetchone()[0]==saved['g6ju16VJ'][1],True)
 row=wait(queue({'VersionValidationExperiment':{'version':'g6ju16VJ'}}));receipt['experiment_summary']={'state':row['state'],'source':row.get('result',{}).get('experiment',{}).get('source'),'decision':row.get('result',{}).get('experiment',{}).get('decision')};expect('collected record usable by experiment',row['state'],'succeeded');run=row['result']['experiment'];expect('experiment source matches receipt',run['source']['payload_sha256'],receipt['partial_job']['result']['version_collection']['records'][0]['payload_sha256']);expect('promotion still blocked','Incomplete' in run['decision'],True);expect('full parity retained',all(s['equal_complete_output'] for s in run['samples']),True)
 expect('integrity check',conn.execute('pragma integrity_check').fetchone()[0],'ok');conn.close();receipt['completed']=True
except Exception as e:
 receipt['error']=str(e);raise
finally:
 if proc is not None and proc.poll() is None:proc.send_signal(signal.SIGINT);proc.wait(timeout=35)
 log.close();(a.output_dir/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'completed':receipt['completed'],'checks':len(checks),'passed':sum(c['passed'] for c in checks),'error':receipt.get('error')}))
