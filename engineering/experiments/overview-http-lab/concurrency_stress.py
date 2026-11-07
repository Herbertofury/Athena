from pathlib import Path
import sqlite3,subprocess,urllib.request,time,json,threading,signal,collections,hashlib
import argparse
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,required=True);parser.add_argument('--seed',type=Path,required=True);parser.add_argument('--binary',type=Path,required=True);args=parser.parse_args()
out=args.output;out.mkdir(exist_ok=False)
seed=args.seed;binary=args.binary.resolve();reports=[]
for mode in ['serve','serve-candidate']:
 db=out/(mode+'.sqlite')
 with sqlite3.connect(seed) as a,sqlite3.connect(db) as b:a.backup(b)
 log=open(out/(mode+'.log'),'w');p=subprocess.Popen([str(binary),mode,str(db)],stdout=log,stderr=log);stop=threading.Event();writes={'commits':0,'busy':0};samples=[]
 def fetch():
  with urllib.request.urlopen('http://127.0.0.1:41379/api/overview',timeout=10) as r:return json.loads(r.read())
 def writer():
  c=sqlite3.connect(db,timeout=.1)
  while not stop.is_set():
   try:
    c.execute('update jobs set state=?',('failed' if writes['commits']%2 else 'succeeded',));c.commit();writes['commits']+=1
   except sqlite3.OperationalError:c.rollback();writes['busy']+=1
   time.sleep(.001)
  c.close()
 try:
  for _ in range(100):
   try:
    if fetch()['worker_status']=='running':break
   except OSError:time.sleep(.02)
  else:raise RuntimeError('not ready')
  t=threading.Thread(target=writer);t.start();until=time.monotonic()+8
  for i in range(200):
   if time.monotonic()>until:break
   value=fetch();actual=dict(collections.Counter(x['state'] for x in value['jobs']));samples.append({'sample':i,'row_state_counts':actual,'reported_counts':value['counts'],'consistent':actual==value['counts']})
  stop.set();t.join(timeout=2);assert not t.is_alive();p.send_signal(signal.SIGINT);p.wait(timeout=35)
  report={'mode':mode,'writer':writes,'samples':samples,'inconsistent':sum(not x['consistent'] for x in samples),'scope':'Isolated synthetic terminal-state writer against replay-expanded private copy; not user data mutation','binary_sha256':hashlib.sha256(binary.read_bytes()).hexdigest()};reports.append(report);(out/(mode+'.json')).write_text(json.dumps(report,indent=2));print(mode,len(samples),report['inconsistent'],writes)
 finally:
  stop.set()
  if 't' in locals() and t.is_alive():t.join(timeout=2)
  if p.poll() is None:p.send_signal(signal.SIGINT);p.wait(timeout=35)
  log.close()
(out/'summary.json').write_text(json.dumps([{k:v for k,v in r.items() if k!='samples'} for r in reports],indent=2))
