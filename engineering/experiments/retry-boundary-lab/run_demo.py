"""Run four synthetic recovery/control scenarios in a fresh owned directory."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import platform
import sqlite3
import subprocess
import sys

import retry_boundary as r


def require(value, message):
    if not value:
        raise RuntimeError(message)


def states(producer, receiver):
    return {'producer': r.snapshot(producer,'producer'),
            'receiver': r.snapshot(receiver,'receiver')}


def create_pair(root):
    root.mkdir()
    p,s = root/'producer.sqlite',root/'receiver.sqlite'
    r.create_fixture(p,'producer');r.create_fixture(s,'receiver')
    return p,s


def crash(producer, receiver, operation, phase):
    code='''import importlib.util,os,sys
s=importlib.util.spec_from_file_location('r',sys.argv[1]);r=importlib.util.module_from_spec(s);s.loader.exec_module(r)
def fault(stage):
 if stage==sys.argv[5]: os._exit(91)
if sys.argv[4]=='submit': r.submit(sys.argv[2],'demo','command-1','synthetic task',7,fault=fault)
else: r.dispatch_one(sys.argv[2],sys.argv[3],fault=fault)
'''
    proc=subprocess.run([sys.executable,'-c',code,str(Path(r.__file__).resolve()),
                         str(producer),str(receiver),operation,phase],
                        capture_output=True,timeout=15)
    result={'operation':operation,'phase':phase,'returncode':proc.returncode,
            'stdout':proc.stdout.decode(),'stderr':proc.stderr.decode()}
    # Keep unexpected child failures too, before enforcing the expected outcome.
    with (Path(producer).parent/f'child-{operation}-{phase}.json').open('x') as stream:
        stream.write(json.dumps(result,indent=2)+'\n')
    require(proc.returncode==91,'child did not exit at the declared boundary')
    return result


def lost_ack(stage):
    if stage=='after_delivery':
        raise InterruptedError('synthetic lost acknowledgement')


def demo(output):
    output=Path(output).resolve()
    output.mkdir(exist_ok=False)
    result={'schema_version':1,'synthetic':True,
            'recorded_at':datetime.now(timezone.utc).isoformat(),
            'environment':{'python':platform.python_version(),'sqlite':sqlite3.sqlite_version,
                           'system':platform.system(),'machine':platform.machine(),
                           'journal_mode':'delete','synchronous':2},
            'source_sha256':{},'scenarios':{}}
    paths=[Path(__file__),Path(r.__file__),Path(__file__).resolve().parents[2]/'tests/test_retry_boundary.py']
    for path in paths:
        result['source_sha256'][path.name]=hashlib.sha256(path.read_bytes()).hexdigest()
    p,s=create_pair(output/'producer-lost-response')
    case={'fault':crash(p,s,'submit','after_commit'),'after_crash':states(p,s)}
    receipt=r.submit(p,'demo','command-1','synthetic task',7)
    case['replayed_receipt']=json.loads(receipt);case['after_replay']=states(p,s)
    require(case['after_crash']==case['after_replay'],'producer replay changed state')
    require(len(case['after_replay']['producer']['effects'])==1,'missing producer effect')
    result['scenarios']['producer_lost_response']=case
    p,s=create_pair(output/'receiver-lost-acknowledgement')
    r.submit(p,'demo','command-1','synthetic task',7)
    case={'fault':crash(p,s,'dispatch','after_delivery'),'after_crash':states(p,s)}
    receipt=r.dispatch_one(p,s);case['replayed_receipt']=json.loads(receipt)
    case['after_replay']=states(p,s)
    require(case['after_crash']['receiver']==case['after_replay']['receiver'],'deduplicating receiver changed state')
    require(case['after_crash']['producer']['outbox'][0][4] is None,'acknowledged before crash')
    require(case['after_replay']['producer']['outbox'][0][4]=={'hex':receipt.hex()},'acknowledgement missing after replay')
    result['scenarios']['receiver_lost_acknowledgement']=case
    p,s=create_pair(output/'naive-receiver-control')
    r.submit(p,'demo','command-1','synthetic task',7)
    try:
        r.dispatch_one(p,s,deduplicate=False,fault=lost_ack)
    except InterruptedError as error:
        case={'fault':str(error),'after_interruption':states(p,s)}
    else:
        raise RuntimeError('expected injected interruption')
    receipt=r.dispatch_one(p,s,deduplicate=False)
    case['new_receipt']=json.loads(receipt);case['after_replay']=states(p,s)
    require(len(case['after_replay']['receiver']['effects'])==2,'naive duplicate control not reproduced')
    result['scenarios']['outbox_without_receiver_deduplication']=case
    p,s=create_pair(output/'incomplete-ledger-control')
    r.submit(p,'demo','command-1','synthetic task',7)
    try:
        r.dispatch_one(p,s,fault=lost_ack)
    except InterruptedError:
        pass
    else:
        raise RuntimeError('expected injected interruption')
    original=r.snapshot(s,'receiver')
    copy=s.with_name('incomplete-receiver.sqlite');r.create_fixture(copy,'receiver')
    with r.connect(s,'receiver') as source,r.connect(copy,'receiver') as incomplete:
        incomplete.executemany('INSERT INTO effects VALUES(?,?,?,?)',source.execute('SELECT * FROM effects'))
    case={'original_receiver':original,'incomplete_receiver_before':r.snapshot(copy,'receiver')}
    receipt=r.dispatch_one(p,copy)
    case['replay_receipt']=json.loads(receipt);case['incomplete_receiver_after']=r.snapshot(copy,'receiver')
    case['original_receiver_after']=r.snapshot(s,'receiver')
    require(original==case['original_receiver_after'],'control changed original receiver')
    require(len(case['incomplete_receiver_after']['effects'])==2,'ledger-omission duplicate not reproduced')
    result['scenarios']['incomplete_receipt_ledger']=case
    result['limitations']=['No network/service or production app was exercised.',
        'Process exit is not OS crash, power-loss or physical storage fault evidence.',
        'No bounded-backlog, ordering, fairness, authentication or retention policy is implemented.',
        'A fresh incomplete fixture models omitted receipt state, not elapsed-time expiry.']
    path=output/'receipt.json'
    with path.open('x') as stream:
        stream.write(json.dumps(result,indent=2)+'\n')
    return path


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',required=True,help='new directory for generated fixtures and receipt')
    args=parser.parse_args()
    print(demo(args.output))
