"""Real Athena lesson corpus; candidate-only comparison, no app changes."""
import hashlib,json,pathlib,platform,sqlite3,statistics,subprocess,sys,tempfile,time
HERE=pathlib.Path(__file__).resolve().parent
ROOT=HERE.parents[1]

def no_network(event,args):
    if event.startswith('socket.'):
        raise RuntimeError('Offline research forbids Python network access')
sys.addaudithook(no_network)
queries=json.loads((HERE/'queries.json').read_text())
baseline=json.loads(subprocess.check_output(['node',str(HERE/'baseline.cjs'),str(ROOT),str(HERE/'queries.json')],text=True))
with tempfile.TemporaryDirectory() as directory:
    path=pathlib.Path(directory)/'candidate.sqlite'
    db=sqlite3.connect(path)
    db.execute('CREATE VIRTUAL TABLE corpus USING fts5(id UNINDEXED,text)')
    db.executemany('INSERT INTO corpus VALUES (?,?)',[(d['id'],d['text']) for d in baseline['documents']]);db.commit()
    def search(q):
        if not q.split():return []
        match=' OR '.join('"'+v.replace('"','""')+'"' for v in q.split())
        return [r[0] for r in db.execute('SELECT id FROM corpus WHERE corpus MATCH ? ORDER BY bm25(corpus),id LIMIT 5',(match,))]
    rows=[]
    for task,old in zip(queries,baseline['results']):
        found=search(task['query']);times=[]
        for i in range(101):
            start=time.perf_counter_ns();search(task['query']);times.append((time.perf_counter_ns()-start)/1e6)
        expected=task['expected']
        rows.append({**task,'baseline_top5':old['ids'][:5],'candidate_top5':found,'baseline_total_results':len(old['ids']),
          'baseline_expected_anywhere':expected in old['ids'] if expected else not old['ids'],
          'baseline_target_success':expected in old['ids'][:5] if expected else not old['ids'],
          'candidate_target_success':expected in found if expected else not found,
          'baseline_median_ms':old['median_ms'],'candidate_median_ms':statistics.median(times),
          'baseline_p95_ms':old['p95_ms'],'candidate_p95_ms':sorted(times)[95]})
    # Real persisted candidate database reopened after dropping the original connection.
    db.close();db=sqlite3.connect(path)
    assert [search(q['query']) for q in queries]==[r['candidate_top5'] for r in rows]
    db.close()
receipt={'kind':'actual Athena corpus / author-selected task comparison, not blind user study',
 'source_commit':subprocess.check_output(['git','-C',str(ROOT),'rev-parse','HEAD'],text=True).strip(),
 'source_hashes':{p:hashlib.sha256((ROOT/p).read_bytes()).hexdigest() for p in ['dist/app.js','dist/catalog.js']},
 'query_sha256':hashlib.sha256((HERE/'queries.json').read_bytes()).hexdigest(),
 'baseline_function_sha256':hashlib.sha256(baseline['function_source'].encode()).hexdigest(),
 'python':platform.python_version(),'node':baseline['node'],'sqlite':sqlite3.sqlite_version,
 'documents':len(baseline['documents']),'repeat_measurements':101,'reopen_equal':True,
 'network_scope':'No network APIs used. Python audit socket guard; Node not sandboxed. No OS isolation claimed.',
 'results':rows,'baseline_success':sum(r['baseline_target_success'] for r in rows),
 'candidate_success':sum(r['candidate_target_success'] for r in rows),
 'decision':'RETAIN IN R&D: candidate changes substring/empty-query behavior; timings exclude UI and use different runtimes, no superiority claim.'}
print(json.dumps(receipt,indent=2,sort_keys=True))
