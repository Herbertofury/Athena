"""Measure one SQLite index's read/write tradeoffs in isolated in-memory databases."""
import argparse
import datetime, hashlib, json, platform, random, sqlite3, statistics, time
from pathlib import Path
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
N=100000
rows=[(i,i%20,(i//20)%10,int(i%3!=0),f'{(i*7919)%100003:06d}',i%17) for i in range(N)]
query='SELECT id,name,version FROM records WHERE scope=? AND kind=? AND active=? ORDER BY name,id'
full='SELECT id,scope,kind,active,name,version FROM records ORDER BY id'
connections={};rng=random.Random(20261026)
report={'schema':1,'date':datetime.datetime.now(datetime.timezone.utc).date().isoformat(),'evidence':'measured_local_generated_workload','environment':{'python':platform.python_version(),'sqlite':sqlite3.sqlite_version,'system':platform.system(),'machine':platform.machine()},'harness_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'input_sha256':hashlib.sha256(json.dumps(rows,separators=(',',':')).encode()).hexdigest(),'rows':N,'storage':'two independent in-memory databases; no disk durability benchmark','runs':{},'query_plans':{},'database_allocated_bytes':{},'pragmas':{}}
def h(value):return hashlib.sha256(json.dumps(value,separators=(',',':')).encode()).hexdigest()
try:
 for name in ['baseline','indexed']:
  c=sqlite3.connect(':memory:');connections[name]=c
  c.execute('CREATE TABLE records(id INTEGER PRIMARY KEY,scope INTEGER NOT NULL,kind INTEGER NOT NULL,active INTEGER NOT NULL,name TEXT NOT NULL,version INTEGER NOT NULL)')
  c.executemany('INSERT INTO records VALUES(?,?,?,?,?,?)',rows);c.commit()
  if name=='indexed':
   t=time.perf_counter_ns();c.execute('CREATE INDEX lookup_cover ON records(scope,kind,active,name,id,version)');c.commit();report['index_build_ms']=(time.perf_counter_ns()-t)/1e6
  c.execute('ANALYZE')
  report['query_plans'][name]={'filtered':c.execute('EXPLAIN QUERY PLAN '+query,(7,3,1)).fetchall(),'full':c.execute('EXPLAIN QUERY PLAN '+full).fetchall()}
  report['database_allocated_bytes'][name]=c.execute('PRAGMA page_count').fetchone()[0]*c.execute('PRAGMA page_size').fetchone()[0]
  report['pragmas'][name]={p:c.execute('PRAGMA '+p).fetchone()[0] for p in ['journal_mode','synchronous','cache_size']}
 assert connections['baseline'].execute(full).fetchall()==connections['indexed'].execute(full).fetchall()
 for case,sql,rounds in [('filtered_complete',query,21),('full_complete',full,9)]:
  samples={'baseline':[],'indexed':[]};orders=[];hashes=[];counts=[]
  for trial in range(rounds):
   params=(trial%20,(trial*3)%10,1) if case=='filtered_complete' else ()
   order=list(connections);rng.shuffle(order);orders.append(order);outputs={}
   for name in order:
    t=time.perf_counter_ns();result=connections[name].execute(sql,params).fetchall();samples[name].append((time.perf_counter_ns()-t)/1e6);outputs[name]=result
   assert outputs['baseline']==outputs['indexed']
   hashes.append(h(outputs['baseline']));counts.append(len(outputs['baseline']))
  report['runs'][case]={'samples_ms':samples,'median_ms':{k:statistics.median(v) for k,v in samples.items()},'round_orders':orders,'result_sha256':hashes,'result_counts':counts}
 samples={'baseline':[],'indexed':[]};orders=[]
 updates=[(f'changed-{i:06d}',99,i*97) for i in range(1000)]
 original=h(connections['baseline'].execute(full).fetchall())
 for trial in range(9):
  order=list(connections);rng.shuffle(order);orders.append(order);outputs={}
  for name in order:
   c=connections[name];t=time.perf_counter_ns();c.execute('BEGIN');c.executemany('UPDATE records SET name=?,version=? WHERE id=?',updates);samples[name].append((time.perf_counter_ns()-t)/1e6)
   outputs[name]=h(c.execute(full).fetchall());c.rollback();assert h(c.execute(full).fetchall())==original
  assert outputs['baseline']==outputs['indexed']
 report['runs']['update_1000_precommit']={'samples_ms':samples,'median_ms':{k:statistics.median(v) for k,v in samples.items()},'round_orders':orders,'all_updated_states_equal':True,'all_rollbacks_restored_exact_state':True,'commit_and_durability_timed':False}
 report['qualification']='Generated data, version-recorded SQLite in-memory query/update experiment. Full fetches, no LIMIT. Index build separately timed. No disk IO, crash durability, concurrent writers, app latency, RSS or isolated CPU proof. EXPLAIN output retained for this version, not parsed as a stable API.'
 args.output.write_text(json.dumps(report,indent=2)+'\n')
 for k,v in report['runs'].items():print(k,v['median_ms'])
 print('allocated database bytes',report['database_allocated_bytes'],'index build ms',report['index_build_ms'])
finally:
 for c in connections.values():c.close()
