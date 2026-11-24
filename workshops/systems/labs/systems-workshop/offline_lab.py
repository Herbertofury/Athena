#!/usr/bin/env python3
"""Bounded Systems Workshop. No network, privileged changes or arbitrary targets.

Actual work is confined to fresh TemporaryDirectory instances and fixed Python
children created by this program. No user file path, command or PID is accepted.
"""
import argparse
from contextlib import closing
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile

FIXTURES=Path(__file__).resolve().parent/'fixtures'
GIB=1024**3
CHILD=r'''
import sys,time
mode=sys.argv[1]
if mode=='failure':
    print('REQUEST_REJECTED: fixed teaching error',file=sys.stderr)
    raise SystemExit(7)
if mode=='timeout':
    time.sleep(2)
    raise SystemExit(0)
print('READY',flush=True)
for line in sys.stdin:
    command=line.strip()
    if command=='PING': print('PONG',flush=True)
    elif command=='STOP':
        print('BYE',flush=True)
        raise SystemExit(0)
    else:
        print('UNKNOWN_COMMAND',file=sys.stderr)
        raise SystemExit(8)
raise SystemExit(9)
'''


def fixture(name):
    return json.loads((FIXTURES/name).read_text(encoding='utf-8'))


def files_demo():
    with tempfile.TemporaryDirectory(prefix='athena-system-files-') as name:
        root=Path(name);source=root/'work order.txt';copy=root/'copied note.txt'
        text='café\n';source.write_text(text,encoding='utf-8',newline='\n')
        raw=source.read_bytes();copy.write_bytes(raw)
        result=dict(characters=len(text),utf8_bytes=len(raw),stat_size=source.stat().st_size,
            roundtrip_text=source.read_text(encoding='utf-8')==text,copy_equal=copy.read_bytes()==raw,
            expected_missing=not (root/'missing.txt').exists(),
            scope='Actual synthetic file I/O in a new temporary directory; no personal files read.')
    result['temporary_directory_removed']=not root.exists()
    return result


def child_case(mode):
    if mode not in {'normal','failure','timeout'}:raise ValueError('unknown fixed child case')
    with tempfile.TemporaryDirectory(prefix='athena-system-child-') as directory:
        # Do not pass the parent's environment credentials into the child.
        env={}
        if os.name=='nt' and os.environ.get('SystemRoot'):
            env['SystemRoot']=os.environ['SystemRoot']
        child=subprocess.Popen([sys.executable,'-I','-S','-c',CHILD,mode],
            stdin=subprocess.PIPE,stdout=subprocess.PIPE,stderr=subprocess.PIPE,
            text=True,encoding='utf-8',cwd=directory,env=env,shell=False)
        started=child.poll() is None
        timed_out=False
        try:
            try:
                out,err=child.communicate('PING\nSTOP\n' if mode=='normal' else '',timeout=.1 if mode=='timeout' else 5)
            except subprocess.TimeoutExpired:
                timed_out=True
                # This exact child is ours. Do not search for or kill by name/PID.
                child.kill()
                out,err=child.communicate(timeout=5)
        finally:
            if child.poll() is None:
                child.kill();child.communicate(timeout=5)
        result=dict(case=mode,launch_observed=started,stdout_lines=out.splitlines(),
                    stderr_lines=err.splitlines(),returncode=child.returncode,
                    timed_out=timed_out,reaped=child.poll() is not None)
    result['temporary_directory_removed']=not Path(directory).exists()
    return result


def capacity(case):
    keys=('total_bytes','used_bytes','new_bytes','temporary_bytes','reserve_bytes','free_file_slots','new_files')
    for k in keys:
        if type(case.get(k)) is not int or case[k]<0:raise ValueError(k+' must be a nonnegative integer')
    if case['used_bytes']>case['total_bytes']:raise ValueError('used exceeds total')
    available=case['total_bytes']-case['used_bytes']
    required=case['new_bytes']+case['temporary_bytes']+case['reserve_bytes']
    return dict(id=case['id'],available_bytes=available,required_bytes=required,
        byte_shortfall=max(0,required-available),file_slot_shortfall=max(0,case['new_files']-case['free_file_slots']),
        fits_bytes=available>=required,fits_file_slots=case['free_file_slots']>=case['new_files'])


def no_duplicates(pairs):
    out={}
    for key,value in pairs:
        if key in out:raise ValueError('duplicate key: '+key)
        out[key]=value
    return out


def parse_config(text):
    if not isinstance(text,str) or len(text.encode('utf-8'))>1024:raise ValueError('configuration must be at most 1024 UTF-8 bytes')
    data=json.loads(text,object_pairs_hook=no_duplicates)
    if not isinstance(data,dict) or set(data)!={'workers','queue_limit'}:raise ValueError('exact workers and queue_limit fields required')
    if type(data['workers']) is not int or not 1<=data['workers']<=8:raise ValueError('workers must be an integer from 1 to 8')
    if type(data['queue_limit']) is not int or not 1<=data['queue_limit']<=1000:raise ValueError('queue_limit must be an integer from 1 to 1000')
    if data['queue_limit']<data['workers']:raise ValueError('queue_limit must cover workers')
    return data


def canonical_config(data):
    # Round-trip validation rejects malformed direct function calls too.
    return json.dumps(parse_config(json.dumps(data)),sort_keys=True,separators=(',',':'))+'\n'


def apply_config(root,text,*,dry_run=False,fail_before_replace=False):
    """Internal fixture function; caller supplies its own new temporary directory."""
    desired=parse_config(text)
    active=root/'active.json';backup=root/'last-good.json'
    before=active.read_bytes();old=parse_config(before.decode('utf-8'))
    if old==desired:return {'changed':False,'reason':'already desired','effective':old}
    if dry_run:return {'changed':False,'reason':'dry run','before':old,'desired':desired}
    stage=None
    try:
        with tempfile.NamedTemporaryFile(mode='wb',dir=root,prefix='candidate-',delete=False) as file:
            stage=Path(file.name);file.write(canonical_config(desired).encode('utf-8'));file.flush();os.fsync(file.fileno())
        if fail_before_replace:raise RuntimeError('injected before replacement')
        # Last-good copy is a teaching rollback point, not a multi-file transaction.
        backup.write_bytes(before)
        os.replace(stage,active)
        return {'changed':True,'reason':'replaced','effective':parse_config(active.read_text(encoding='utf-8'))}
    finally:
        if stage is not None:stage.unlink(missing_ok=True)


def config_demo():
    with tempfile.TemporaryDirectory(prefix='athena-system-config-') as name:
        root=Path(name);active=root/'active.json'
        original=canonical_config(dict(workers=2,queue_limit=20));active.write_text(original,encoding='utf-8')
        desired='{"workers":4,"queue_limit":40}'
        dry=apply_config(root,desired,dry_run=True);dry_preserved=active.read_text(encoding='utf-8')==original
        invalid_rejected=False
        try:apply_config(root,'{"workers":true,"queue_limit":40}')
        except ValueError:invalid_rejected=True
        invalid_preserved=active.read_text(encoding='utf-8')==original
        interrupted=False
        try:apply_config(root,desired,fail_before_replace=True)
        except RuntimeError:interrupted=True
        interrupted_preserved=active.read_text(encoding='utf-8')==original
        applied=apply_config(root,desired)
        no_op=apply_config(root,desired)
        last_good=(root/'last-good.json').read_text(encoding='utf-8')
        rollback=apply_config(root,last_good)
        result=dict(dry_run=dry,dry_run_preserved=dry_preserved,invalid_rejected=invalid_rejected,
            invalid_preserved=invalid_preserved,interruption_injected=interrupted,
            interrupted_preserved=interrupted_preserved,applied=applied,repeated=no_op,
            rollback=rollback,rollback_matches_original=active.read_text(encoding='utf-8')==original,
            staged_files_remaining=len(list(root.glob('candidate-*'))),
            scope='Actual disposable single-file replacement; no forced crash or multi-file atomicity claim.')
    result['temporary_directory_removed']=not root.exists()
    return result


def dependency_order(graph):
    if not isinstance(graph,dict) or not graph:raise ValueError('nonempty graph required')
    for node,parents in graph.items():
        if not isinstance(node,str) or not isinstance(parents,list) or any(not isinstance(p,str) for p in parents):
            raise ValueError('graph nodes and prerequisites must be named strings')
        if len(set(parents))!=len(parents):raise ValueError('duplicate prerequisite')
        if any(p not in graph for p in parents):raise ValueError('unknown prerequisite')
    order=[];remaining=set(graph)
    while remaining:
        ready=sorted(n for n in remaining if set(graph[n])<=set(order))
        if not ready:raise ValueError('dependency cycle')
        order.extend(ready);remaining.difference_update(ready)
    return order


def retry_plan(outcomes,max_attempts):
    if type(max_attempts) is not int or not 1<=max_attempts<=10:raise ValueError('attempt limit must be 1 to 10')
    if not isinstance(outcomes,list) or not outcomes or any(not isinstance(x,str) or x not in {'transient','permanent','uncertain','success'} for x in outcomes):
        raise ValueError('fixed outcome labels required')
    for n,outcome in enumerate(outcomes[:max_attempts],1):
        if outcome=='success':return {'attempts':n,'decision':'complete'}
        if outcome=='permanent':return {'attempts':n,'decision':'stop-permanent'}
        if outcome=='uncertain':return {'attempts':n,'decision':'verify-before-retry'}
    return {'attempts':min(len(outcomes),max_attempts),'decision':'limit-reached' if len(outcomes)>=max_attempts else 'more-evidence-needed'}


def dependencies_demo():
    order=dependency_order(fixture('dependencies.json'))
    cycle_rejected=False
    try:dependency_order({'A':['B'],'B':['A']})
    except ValueError:cycle_rejected=True
    return dict(order=order,cycle_rejected=cycle_rejected,
        transient=retry_plan(['transient','transient','success'],3),
        permanent=retry_plan(['permanent','success'],3),
        uncertain=retry_plan(['uncertain','success'],3),
        exhausted=retry_plan(['transient','transient','success'],2),
        scope='Pure planning on fixed synthetic data; no scheduler, sleeps or requests.')


def initialize_database(connection):
    connection.executescript('CREATE TABLE stock (id INTEGER PRIMARY KEY, remaining INTEGER NOT NULL CHECK(remaining>=0)); CREATE TABLE receipts (job_id TEXT PRIMARY KEY, payload TEXT NOT NULL); INSERT INTO stock VALUES (1,3);')


def apply_job(connection,job_id,payload,*,inject_failure=False):
    if not isinstance(job_id,str) or not job_id or not isinstance(payload,str):raise ValueError('nonempty ID and text payload required')
    connection.execute('BEGIN IMMEDIATE')
    try:
        prior=connection.execute('SELECT payload FROM receipts WHERE job_id=?',(job_id,)).fetchone()
        if prior:
            if prior[0]!=payload:raise ValueError('job ID payload conflict')
            connection.execute('ROLLBACK');return 'already-applied'
        cursor=connection.execute('UPDATE stock SET remaining=remaining-1 WHERE id=1 AND remaining>0')
        if cursor.rowcount!=1:raise ValueError('insufficient stock')
        if inject_failure:raise RuntimeError('injected after decrement')
        connection.execute('INSERT INTO receipts(job_id,payload) VALUES (?,?)',(job_id,payload))
        connection.execute('COMMIT');return 'applied'
    except BaseException:
        if connection.in_transaction:connection.execute('ROLLBACK')
        raise


def database_state(connection):
    return dict(stock=connection.execute('SELECT remaining FROM stock WHERE id=1').fetchone()[0],
        receipts=[dict(job_id=r[0],payload=r[1]) for r in connection.execute('SELECT job_id,payload FROM receipts ORDER BY job_id')])


def database_demo():
    with tempfile.TemporaryDirectory(prefix='athena-system-db-') as name:
        root=Path(name);primary=root/'primary.db';backup=root/'backup.db'
        with closing(sqlite3.connect(primary,isolation_level=None)) as connection:
            initialize_database(connection)
            applied=apply_job(connection,'job-001','replace filter')
            duplicate=apply_job(connection,'job-001','replace filter')
            conflict=False
            try:apply_job(connection,'job-001','different request')
            except ValueError:conflict=True
            rolled_back=False
            try:apply_job(connection,'job-002','tighten handle',inject_failure=True)
            except RuntimeError:rolled_back=True
            before=database_state(connection)
            with closing(sqlite3.connect(backup)) as target:connection.backup(target)
        with closing(sqlite3.connect(primary)) as reopened:primary_state=database_state(reopened)
        with closing(sqlite3.connect(backup)) as restored:
            backup_state=database_state(restored)
            integrity=restored.execute('PRAGMA integrity_check').fetchone()[0]
        result=dict(sqlite_version=sqlite3.sqlite_version,applied=applied,duplicate=duplicate,
            conflicting_payload_rejected=conflict,injected_failure_rolled_back=rolled_back,
            before_close=before,primary_reopened=primary_state,backup_reopened=backup_state,
            backup_integrity_check=integrity,
            scope='Actual temporary SQLite transactions, close/reopen and backup; same temporary failure domain, no power-loss test.')
    result['temporary_directory_removed']=not root.exists()
    return result


def reconcile_jobs(events,receipts):
    if not isinstance(events,list) or not isinstance(receipts,list):raise ValueError('lists required')
    ids=[]
    for row in events:
        if not isinstance(row,dict) or not isinstance(row.get('job_id'),str) or row.get('event') not in {'accepted','started'}:
            raise ValueError('invalid synthetic event')
        if row['job_id'] not in ids:ids.append(row['job_id'])
    if any(not isinstance(r,str) for r in receipts) or len(set(receipts))!=len(receipts):raise ValueError('receipt IDs must be unique strings')
    return {'completed':[i for i in ids if i in receipts],
            'not_established_complete':[i for i in ids if i not in receipts],
            'receipts_without_supplied_events':[i for i in receipts if i not in ids]}


def run(command):
    if command=='files':return files_demo()
    if command=='process':return {'cases':[child_case(x) for x in ['normal','failure','timeout']], 'scope':'Only fixed child processes owned by this lab.'}
    if command=='capacity':return [capacity(x) for x in fixture('capacity.json')]
    if command=='config':return config_demo()
    if command=='dependencies':return dependencies_demo()
    if command=='database':return database_demo()
    if command=='incident':
        x=fixture('incident.json');return {'provided_state':x['state'],'reconciliation':reconcile_jobs(x['events'],x['receipts']),
            'capacity':capacity(fixture('capacity.json')[0]),'scope':'Synthetic incident facts and arithmetic, not live diagnosis.'}
    raise ValueError('unknown fixed command')


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('command',choices=['files','process','capacity','config','dependencies','database','incident'])
    args=p.parse_args();print(json.dumps(run(args.command),indent=2,ensure_ascii=False,sort_keys=True))

if __name__=='__main__':main()
