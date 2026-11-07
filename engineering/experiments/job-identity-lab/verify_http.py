"""Retain real overview responses and exercise their actual served renderer."""
import argparse,datetime,hashlib,json,pathlib,re,signal,socket,sqlite3,subprocess,time,urllib.request
p=argparse.ArgumentParser();p.add_argument('--source-db',type=pathlib.Path,required=True);p.add_argument('--binary',type=pathlib.Path,required=True);p.add_argument('--output',type=pathlib.Path,required=True);p.add_argument('--mode',choices=['serve','serve-candidate'],default='serve');p.add_argument('--expect-correct',action='store_true');a=p.parse_args();a.output.mkdir(parents=True,exist_ok=False)
root=pathlib.Path(__file__).resolve().parents[2];base='http://127.0.0.1:41379';db=a.output/'fixture.sqlite';sha=lambda b:hashlib.sha256(b).hexdigest();proc=None
if a.source_db.stat().st_size>32*1024*1024:raise ValueError('Database budget')
source_before=sha(a.source_db.read_bytes())
with sqlite3.connect(a.source_db.resolve().as_uri()+'?mode=ro',uri=True) as src,sqlite3.connect(db) as dst:
 if src.execute("SELECT count(*) FROM jobs WHERE state IN ('queued','running')").fetchone()[0] or src.execute('SELECT count(*) FROM jobs').fetchone()[0]>40:raise ValueError('Source job budget or active jobs')
 src.backup(dst)
 for ident in [9007199254740992,9007199254740993,9223372036854775807]:dst.execute("INSERT INTO jobs(id,payload,state) VALUES(?,'\"DedupExperiment\"','succeeded')",(ident,))
 dst.commit();before=dst.execute('SELECT * FROM jobs ORDER BY id').fetchall();expected=[str(row[0]) for row in reversed(before)]
try:
 with socket.create_connection(('127.0.0.1',41379),timeout=.2):raise ValueError('Port already owned')
except ConnectionRefusedError:pass
receipt={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Generated high IDs alongside retained public fixture jobs; actual Rust HTTP and served UI in controlled DOM, not native browser paint','mode':a.mode,'binary_sha256':sha(a.binary.read_bytes()),'harness_sha256':sha(pathlib.Path(__file__).read_bytes()),'expected_ids':expected,'verification_complete':False};log=(a.output/'server.log').open('w')
try:
 proc=subprocess.Popen([str(a.binary.resolve()),a.mode,str(db.resolve())],stdout=log,stderr=log)
 for _ in range(100):
  if proc.poll() is not None:raise RuntimeError('Owned server exited')
  try:
   with urllib.request.urlopen(base+'/api/overview',timeout=2) as r:wire=r.read(2*1024*1024+1);strategy=r.headers.get('x-atlas-overview-strategy')
   break
  except OSError:time.sleep(.05)
 else:raise TimeoutError('Server readiness')
 if len(wire)>2*1024*1024:raise ValueError('Overview budget')
 receipt['reported_strategy']=strategy
 if strategy!=('baseline' if a.mode=='serve' else 'validated-raw-candidate'):raise ValueError('Loaded strategy mismatch')
 (a.output/'overview.json').write_bytes(wire);data=json.loads(wire)
 if [str(row['id']) for row in data['jobs']]!=expected:raise ValueError('Legacy API or ordering changed')
 subprocess.run(['node',str(pathlib.Path(__file__).with_name('render_http.mjs')),str(a.output/'renderer.json')],check=True,timeout=20)
 renderer=json.loads((a.output/'renderer.json').read_text());receipt['renderer']=renderer
 labels=renderer['rendered_id_labels'];matches=[re.match(r'^Job ([0-9]+) · attempt ',label or '') for label in labels];rendered_ids=[m.group(1) if m else None for m in matches]
 receipt['rendered_ids']=rendered_ids;receipt['application_correct']=renderer['error'] is None and renderer['rendered_card_count']==len(expected) and rendered_ids==expected
 receipt['exact_fields']=[row.get('id_text') for row in data['jobs']]
 if a.expect_correct and (not receipt['application_correct'] or receipt['exact_fields']!=expected):raise ValueError('Exact card identity gate failed')
 receipt['verification_complete']=True
except Exception as error:receipt['failure']={'type':type(error).__name__,'message':str(error)};raise
finally:
 try:
  if proc is not None and proc.poll() is None:
   proc.send_signal(signal.SIGINT)
   try:proc.wait(timeout=5)
   except subprocess.TimeoutExpired:proc.terminate();proc.wait(timeout=5);receipt['forced_shutdown']=True
  log.close()
  with sqlite3.connect(db) as c:
   receipt['jobs_unchanged']=c.execute('SELECT * FROM jobs ORDER BY id').fetchall()==before;receipt['integrity_ok']=c.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
  receipt['source_unchanged']=sha(a.source_db.read_bytes())==source_before
  if not all(receipt[k] for k in ['jobs_unchanged','integrity_ok','source_unchanged']):raise ValueError('Persistence regression')
 except Exception as error:receipt['verification_complete']=False;receipt['cleanup_failure']={'type':type(error).__name__,'message':str(error)};raise
 finally:(a.output/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'verified':receipt['verification_complete'],'application_correct':receipt['application_correct'],'expected_cards':len(expected),'rendered_cards':len(receipt['rendered_ids'])}))
