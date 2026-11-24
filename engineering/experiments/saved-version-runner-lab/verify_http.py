"""Bounded local HTTP verification. Keeps raw receipts, logs and a new test DB."""
from pathlib import Path
import argparse,datetime,hashlib,json,signal,sqlite3,subprocess,time,urllib.request,urllib.error
p=argparse.ArgumentParser();p.add_argument('--binary',type=Path,required=True);p.add_argument('--seed-db',type=Path,required=True);p.add_argument('--version',required=True);p.add_argument('--output-dir',type=Path,required=True);args=p.parse_args()
root=Path(__file__).resolve().parents[2]/'apps/atlas-lab';out=args.output_dir;out.mkdir(parents=True,exist_ok=False);db=out/'test.sqlite';source=sqlite3.connect(f'file:{args.seed_db.resolve()}?mode=ro',uri=True);target=sqlite3.connect(db);source.backup(target);source.close()
generation,payload=target.execute("select generation,payload from snapshots where provider='modrinth-version' and canonical_id=? order by generation desc limit 1",(args.version,)).fetchone();original_hash=hashlib.sha256(payload.encode()).hexdigest()
fixture=json.loads(payload);fixture['id']='QATEST00';fixture['name']='Atlas generated cancellation fixture';fixture['__atlas_generated_cancellation_probe']='x'*65536
fixture_payload=json.dumps(fixture,ensure_ascii=False,separators=(',',':'));target.execute("insert into snapshots(provider,canonical_id,payload) values('modrinth-version','QATEST00',?)",(fixture_payload,));target.commit();initial_snapshots=target.execute('select count(*) from snapshots').fetchone()[0];initial_attempts=target.execute('select count(*) from collection_attempts').fetchone()[0];target.close()
base='http://127.0.0.1:41379';checks=[];receipt={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'actual loopback worker with a retained real public response; cancellation uses a labeled generated augmentation, not a second real source','binary_sha256':hashlib.sha256(args.binary.read_bytes()).hexdigest(),'checks':checks,'completed':False};process=None;log=open(out/'server.log','w')
def request(path,body=None,authorized=True,extra=None):
 headers={'Content-Type':'application/json'}
 if authorized:headers.update({'Origin':base,'X-Atlas-Request':'local-ui'})
 if extra:headers.update(extra)
 req=urllib.request.Request(base+path,data=None if body is None else json.dumps(body).encode(),headers=headers)
 try:
  with urllib.request.urlopen(req,timeout=5) as r:return r.status,r.read(),{k.lower():v for k,v in r.headers.items()}
 except urllib.error.HTTPError as e:return e.code,e.read(),{k.lower():v for k,v in e.headers.items()}
def expect(name,actual,expected):
 checks.append({'name':name,'observed':actual,'expected':expected,'passed':actual==expected});assert actual==expected,(name,actual,expected)
def get_job(ident):
 code,body,_=request('/api/overview');assert code==200;return next(x for x in json.loads(body)['jobs'] if x['id']==ident)
def wait_job(ident,terminal=True):
 end=time.monotonic()+25
 while time.monotonic()<end:
  row=get_job(ident)
  if terminal and row['state'] in ('succeeded','failed'):return row
  if not terminal and row['state']=='running':return row
  if not terminal and row['state'] in ('succeeded','failed'):raise RuntimeError('Cancellation window missed; do not claim cancellation acceptance')
  time.sleep(.005)
 raise TimeoutError('Bounded job did not reach the expected state')
try:
 process=subprocess.Popen([str(args.binary.resolve()),'serve',str(db.resolve())],stdout=log,stderr=log)
 for _ in range(100):
  if process.poll() is not None:raise RuntimeError('New server exited; do not test an unrelated existing process')
  try:
   if request('/api/overview')[0]==200:break
  except OSError:pass
  time.sleep(.05)
 else:raise TimeoutError('Server did not start')
 command={'VersionValidationExperiment':{'version':args.version}}
 expect('same-origin request guard',request('/api/jobs',command,False)[0],403)
 expect('foreign Origin rejected',request('/api/jobs',command,extra={'Origin':'https://example.invalid'})[0],403)
 expect('foreign Host rejected',request('/api/overview',extra={'Host':'example.invalid'})[0],403)
 expect('unknown executable request rejected',request('/api/jobs',{'RunShell':'not executed'})[0],422)
 expect('extra command field rejected',request('/api/jobs',{'VersionValidationExperiment':{'version':args.version,'command':'not executed'}})[0],422)
 expect('noncanonical version rejected',request('/api/jobs',{'VersionValidationExperiment':{'version':'../file'}})[0],400)
 expect('body budget preserved',request('/api/jobs',{'VersionValidationExperiment':{'version':'x'*5000}})[0],413)
 for url,local in [('/',root/'ui/index.html'),('/app.js',root/'ui/app.js'),('/collection-input.mjs',root/'ui/collection-input.mjs')]:
  code,body,headers=request(url);expect('served asset exact '+url,hashlib.sha256(body).hexdigest(),hashlib.sha256(local.read_bytes()).hexdigest());expect('no-store '+url,'no-store' in headers.get('cache-control',''),True)
 code,body,_=request('/api/jobs',{'VersionValidationExperiment':{'version':'00000000'}});expect('missing source request queues a fixed job',code,200);missing=wait_job(json.loads(body)['id']);expect('missing source is failure, not empty success',missing['state'],'failed');expect('missing source is actionable','No saved version' in missing['result']['error'],True)
 code,body,_=request('/api/jobs',command);expect('saved-version experiment accepted',code,200);first=json.loads(body)['id'];row=wait_job(first);expect('real saved-record execution completes',row['state'],'succeeded');run=row['result']['experiment'];receipt['real_saved_record_job']=row['result'];
 expect('complete is explicit',run['completed'],True);expect('timed pairs',len(run['evidence']['trials']),20);expect('warmup pairs retained',len(run['warmup_trials']),4);expect('raw strategy samples retained',len(run['samples']),48);expect('all timed iterations completed',all(x['completed_iterations']==100 for x in run['samples']),True);expect('run-specific generated stress cases',run['evidence']['stress_cases'],10000);expect('complete output parity',all(x['equal_complete_output'] for x in run['samples']),True);expect('source hash matches stored exact payload',run['source']['payload_sha256'],original_hash);expect('generation is exact string',run['source']['generation'],str(generation));expect('compiled runner identity',run['runner_revision'],hashlib.sha256((root/'src/version_experiment_runner.rs').read_bytes()).hexdigest());expect('actual compiler identity retained','rustc 1.99.1' in run['evidence']['environment_id'],True);expect('dependency lock identity retained',hashlib.sha256((root/'Cargo.lock').read_bytes()).hexdigest() in run['evidence']['environment_id'],True);expect('release profile recorded','profile:release' in run['evidence']['environment_id'],True);expect('measurement harness fingerprint recorded',run['runner_revision'] in run['evidence']['environment_id'],True);expect('compiled candidate identity',run['evidence']['candidate_revision'],'fixed-fields:'+hashlib.sha256((root.parents[1]/'experiments/version-validation-lab/candidate.rs').read_bytes()).hexdigest()+':validator:'+hashlib.sha256((root/'src/validated_raw.rs').read_bytes()).hexdigest());expect('missing acceptance evidence blocks promotion','Incomplete' in run['decision'],True);expect('process peak memory stays unmeasured',all(x['peak_bytes']==0 for x in run['evidence']['trials']),True);expect('journal record present',isinstance(row['result'].get('experiment_id'),int),True)
 first_result=row['result'];code,body,_=request('/api/jobs',{'VersionValidationExperiment':{'version':'QATEST00'}});expect('generated cancellation fixture accepted',code,200);second=json.loads(body)['id'];wait_job(second,False);process.send_signal(signal.SIGINT);process.wait(timeout=35);expect('cooperative shutdown',process.returncode,0)
 connection=sqlite3.connect(db);state,raw=connection.execute('select state,result from jobs where id=?',(second,)).fetchone();cancelled=json.loads(raw);receipt['generated_fixture_cancelled_job']=cancelled;expect('cancelled run not successful',state,'failed');expect('cancel reason retained',cancelled['experiment']['reason'],'Cancelled');expect('partial run is not complete',cancelled['experiment']['completed'],False);expect('partial sample iteration bounds',all(x['completed_iterations']<=100 for x in cancelled['experiment']['samples']),True);expect('previous completed result unchanged',json.loads(connection.execute('select result from jobs where id=?',(first,)).fetchone()[0])==first_result,True);expect('snapshot count unchanged by experiments',connection.execute('select count(*) from snapshots').fetchone()[0],initial_snapshots);expect('no collection attempts added',connection.execute('select count(*) from collection_attempts').fetchone()[0],initial_attempts);expect('both experiment journals retained',connection.execute('select count(*) from experiments').fetchone()[0],2);expect('SQLite integrity',connection.execute('pragma integrity_check').fetchone()[0],'ok');receipt['completed']=True
except Exception as error:
 receipt['error']=str(error)
 raise
finally:
 if process is not None and process.poll() is None:
  process.send_signal(signal.SIGINT);process.wait(timeout=35)
 log.close();(out/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n');print(json.dumps({'completed':receipt['completed'],'checks':len(checks),'passed':sum(x['passed'] for x in checks),'error':receipt.get('error')}))
