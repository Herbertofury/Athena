"""Two owned inactive database copies; actual same-origin sequential server restarts."""
import argparse,datetime,hashlib,json,pathlib,re,signal,socket,sqlite3,subprocess,time,urllib.request
p=argparse.ArgumentParser();p.add_argument('--source-db',type=pathlib.Path,required=True);p.add_argument('--binary',type=pathlib.Path,required=True);p.add_argument('--output',type=pathlib.Path,required=True);p.add_argument('--expect-correct',action='store_true');a=p.parse_args()
a.output.mkdir(parents=True,exist_ok=False)
if a.source_db.stat().st_size>32*1024*1024:raise ValueError('Source budget')
sha=lambda b:hashlib.sha256(b).hexdigest()
source_hash=sha(a.source_db.read_bytes())
receipt={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'binary_sha256':sha(a.binary.read_bytes()),'harness_sha256':sha(pathlib.Path(__file__).read_bytes()),'complete':False,'scope':'Two actual local server processes, generated distinct results in owned copies of retained public fixture database'}
try:
 with socket.create_connection(('127.0.0.1',41379),timeout=.2):raise ValueError('Port already owned')
except ConnectionRefusedError:pass

def fetch(path):
 with urllib.request.urlopen('http://127.0.0.1:41379'+path,timeout=5) as r:
  b=r.read(2*1024*1024+1)
  if path=='/api/overview':receipt[label+'_engine']=r.headers.get('x-atlas-engine-instance')
 if len(b)>2*1024*1024:raise ValueError('Response budget')
 return b
try:
 for label,message in [('first','FIRST DATABASE RESULT'),('second','SECOND DATABASE RESULT')]:
  db=a.output/(label+'.sqlite')
  with sqlite3.connect(a.source_db.resolve().as_uri()+'?mode=ro',uri=True) as src,sqlite3.connect(db) as dst:
   if src.execute("SELECT count(*) FROM jobs WHERE state IN ('queued','running')").fetchone()[0]:raise ValueError('Inactive source required')
   src.backup(dst)
   count=dst.execute('SELECT count(*) FROM jobs').fetchone()[0]
   if not 1<=count<=50:raise ValueError('Fixture count')
   dst.execute('UPDATE jobs SET result=? WHERE id=(SELECT max(id) FROM jobs)',(json.dumps({'error':message}),));dst.commit()
   expected=dst.execute('SELECT * FROM jobs ORDER BY id').fetchall()
  proc=None
  with (a.output/(label+'-server.log')).open('w') as log:
   try:
    proc=subprocess.Popen([str(a.binary.resolve()),'serve',str(db.resolve())],stdout=log,stderr=log)
    for _ in range(100):
     if proc.poll() is not None:raise RuntimeError('Server exited')
     try:body=fetch('/api/overview');break
     except OSError:time.sleep(.05)
    else:raise TimeoutError('Readiness')
    (a.output/(label+'.json')).write_bytes(body)
    instance=receipt[label+'_engine']
    if a.expect_correct and not re.fullmatch('[0-9a-f]{32}',instance or ''):raise ValueError('Missing engine namespace')
    fetch('/api/overview')
    if receipt[label+'_engine']!=instance:raise ValueError('Namespace changed within process')
    (a.output/(label+'-engine.json')).write_text(json.dumps(instance))
    app=fetch('/app.js')
    if label=='first':(a.output/'served-app.js').write_bytes(app);receipt['served_app_sha256']=sha(app)
    elif sha(app)!=receipt['served_app_sha256']:raise ValueError('Served code changed across restarts')
   finally:
    if proc is not None and proc.poll() is None:
     proc.send_signal(signal.SIGINT)
     try:proc.wait(timeout=5)
     except subprocess.TimeoutExpired:proc.terminate();proc.wait(timeout=5);receipt['forced_shutdown']=True
  with sqlite3.connect(db) as c:
   if c.execute('PRAGMA integrity_check').fetchone()[0]!='ok':raise ValueError('Integrity failure')
   if c.execute('SELECT * FROM jobs ORDER BY id').fetchall()!=expected:raise ValueError('Read changed jobs')
 if a.expect_correct and receipt['first_engine']==receipt['second_engine']:raise ValueError('Restart reused namespace')
 subprocess.run(['node',str(pathlib.Path(__file__).with_name('render.mjs')),str(a.output)],check=True,timeout=20)
 receipt['renderer']=json.loads((a.output/'render-receipt.json').read_text())
 receipt['correct']=all(receipt['renderer'][k] for k in ['showsReplacement','staleResultAbsent','unchangedNodeReused'])
 if a.expect_correct and not receipt['correct']:raise ValueError('Replacement gate failed')
 receipt['complete']=True
finally:
 receipt['source_unchanged']=sha(a.source_db.read_bytes())==source_hash
 (a.output/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
 if not receipt['source_unchanged']:raise ValueError('Source changed')
print(json.dumps({'complete':receipt['complete'],'correct':receipt.get('correct')}))
