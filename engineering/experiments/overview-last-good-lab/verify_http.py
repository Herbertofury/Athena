"""Owned corruption fixture; preserve complete responses and source database."""
import argparse,datetime,hashlib,json,pathlib,signal,socket,sqlite3,subprocess,time,urllib.request
p=argparse.ArgumentParser();p.add_argument('--source-db',type=pathlib.Path,required=True);p.add_argument('--binary',type=pathlib.Path,required=True);p.add_argument('--output',type=pathlib.Path,required=True);p.add_argument('--expect-correct',action='store_true');a=p.parse_args();a.output.mkdir(parents=True,exist_ok=False)
if a.source_db.stat().st_size>32*1024*1024:raise ValueError('Source budget')
sha=lambda b:hashlib.sha256(b).hexdigest();source_hash=sha(a.source_db.read_bytes());db=a.output/'fixture.sqlite';base='http://127.0.0.1:41379';proc=None
with sqlite3.connect(a.source_db.resolve().as_uri()+'?mode=ro',uri=True) as src,sqlite3.connect(db) as dst:
 if src.execute("SELECT count(*) FROM jobs WHERE state IN ('queued','running')").fetchone()[0]:raise ValueError('Source must be inactive')
 src.backup(dst)
 ids=[r[0] for r in dst.execute('SELECT id FROM jobs ORDER BY id DESC LIMIT 2')]
 if len(ids)!=2 or dst.execute('SELECT count(*) FROM jobs').fetchone()[0]>50:raise ValueError('Fixture count')
 tables=[r[0] for r in dst.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name!='jobs'")]
 before={t:dst.execute('SELECT * FROM "'+t.replace('"','""')+'" ORDER BY rowid').fetchall() for t in tables}
try:
 with socket.create_connection(('127.0.0.1',41379),timeout=.2):raise ValueError('Port already owned')
except ConnectionRefusedError:pass
receipt={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'binary_sha256':sha(a.binary.read_bytes()),'harness_sha256':sha(pathlib.Path(__file__).read_bytes()),'scope':'Actual loopback server; generated malformed results added only to an owned copy with retained public jobs','complete':False};log=(a.output/'server.log').open('w')
def fetch(path,name):
 with urllib.request.urlopen(base+path,timeout=5) as r:b=r.read(2*1024*1024+1)
 if len(b)>2*1024*1024:raise ValueError('Response budget')
 (a.output/name).write_bytes(b);return b
try:
 proc=subprocess.Popen([str(a.binary.resolve()),'serve',str(db.resolve())],stdout=log,stderr=log)
 for _ in range(100):
  if proc.poll() is not None:raise RuntimeError('Server exited')
  try:fetch('/api/overview','good.json');break
  except OSError:time.sleep(.05)
 else:raise TimeoutError('Readiness')
 app=fetch('/app.js','served-app.js');receipt['served_app_sha256']=sha(app)
 with sqlite3.connect(db) as c:
  c.execute('UPDATE jobs SET state=?,attempt=?,result=? WHERE id=?',('failed',17,json.dumps({'error':'UNCOMMITTED RESULT'}),ids[0]))
  c.execute('UPDATE jobs SET state=?,attempt=?,result=? WHERE id=?',('failed',17,json.dumps({'project':{'id':'fixture','title':'Malformed generated fixture','versions':None}}),ids[1]));c.commit()
 fetch('/api/overview','malformed.json')
 with sqlite3.connect(db) as c:
  for id in ids:c.execute('UPDATE jobs SET result=? WHERE id=?',(json.dumps({'error':'VERIFIED NEXT RESULT'}),id))
  c.commit();expected=c.execute('SELECT * FROM jobs ORDER BY id').fetchall()
 fetch('/api/overview','recovered.json')
 subprocess.run(['node',str(pathlib.Path(__file__).with_name('render.mjs')),str(a.output)],check=True,timeout=20)
 result=json.loads((a.output/'render-receipt.json').read_text());receipt['renderer']=result
 receipt['application_correct']=bool(result.get('preparationError')) and all(result[k] for k in ['retainedCards','retainedMetrics','recoveredCorrect'])
 if a.expect_correct and not receipt['application_correct']:raise ValueError('Last-good gate failed')
 receipt['complete']=True
finally:
 if proc is not None and proc.poll() is None:
  proc.send_signal(signal.SIGINT)
  try:proc.wait(timeout=5)
  except subprocess.TimeoutExpired:proc.terminate();proc.wait(timeout=5);receipt['forced_shutdown']=True
 log.close()
 with sqlite3.connect(db) as c:
  receipt['unrelated_tables_unchanged']=all(c.execute('SELECT * FROM "'+t.replace('"','""')+'" ORDER BY rowid').fetchall()==v for t,v in before.items());receipt['integrity_ok']=c.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
  receipt['final_jobs_unchanged_by_reads']='expected' in locals() and c.execute('SELECT * FROM jobs ORDER BY id').fetchall()==expected
 receipt['source_unchanged']=sha(a.source_db.read_bytes())==source_hash
 (a.output/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
 if not all(receipt[k] for k in ['unrelated_tables_unchanged','integrity_ok','final_jobs_unchanged_by_reads','source_unchanged']):raise ValueError('Persistence gate')
print(json.dumps({'complete':receipt['complete'],'application_correct':receipt.get('application_correct')}))
