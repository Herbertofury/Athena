"""Generate, run and retain bounded local-file scan trials in a NEW directory."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import platform
import threading

import file_scan as r


def require(value,message):
    if not value:raise RuntimeError(message)


def write_new(path,data):
    with path.open('x') as stream:stream.write(json.dumps(data,indent=2)+'\n')


def corpus(root):
    root.mkdir()
    contents={f'{i:02}.bin':bytes([i])*((i+1)*531) for i in range(8)}
    contents['empty.bin']=b'';contents['generated-\u00e9.bin']=b'UTF-8 filename, exact binary payload\0\xff'
    for name,data in contents.items():(root/name).write_bytes(data)
    return [{'name_hex':os.fsencode(name).hex(),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest()}
            for name,data in sorted(contents.items(),key=lambda pair:os.fsencode(pair[0]))]


def run(output):
    output=Path(output).resolve();output.mkdir(exist_ok=False)
    summary={'schema_version':1,'synthetic':True,'recorded_at':datetime.now(timezone.utc).isoformat(),
             'environment':{'python':platform.python_version(),'system':platform.system(),'machine':platform.machine()},
             'source_sha256':{},'trials':{},'snapshot_guarantee':False,'performance_claim':False}
    for path in [Path(__file__),Path(r.__file__),Path(__file__).resolve().parents[2]/'tests/test_bounded_file_scan.py']:
        summary['source_sha256'][path.name]=hashlib.sha256(path.read_bytes()).hexdigest()
    limits=r.Limits(entries=16,file_bytes=8192,chunk_bytes=512)
    def save(name,data):
        write_new(output/(name+'.json'),data);summary['trials'][name]=data
    expected=corpus(output/'equivalent-corpus');runs=[]
    for workers in (1,2,4):
        lane=r.scan(output/'equivalent-corpus',r.Limits(workers=workers,inflight=workers*2,
                                                      entries=16,file_bytes=8192,chunk_bytes=512))
        save('workers-'+str(workers),lane);runs.append(lane)
        require(lane['all_checks_passed'],'quiescent corpus unexpectedly failed')
        manifest=r.select_quiescent_manifest(None,lane,quiescence_confirmed=True)
        require(manifest==expected,'complete fingerprint output mismatch')
    require(all(v['outcomes']==runs[0]['outcomes'] for v in runs),'worker lanes changed complete output')
    summary['expected_complete_manifest']=expected
    # A known-bad read-after-check control uses only generated data in this tree.
    naive=output/'naive-control';naive.mkdir();target=naive/'input';target.write_bytes(b'original')
    outside=naive/'generated-other';outside.write_bytes(b'different synthetic bytes')
    was_regular=target.is_file();target.rename(naive/'saved-original');target.symlink_to(outside)
    unsafe=target.read_bytes()
    save('naive-check-then-reopen',{'checked_regular':was_regular,'read_hex':unsafe.hex(),
                                 'followed_replaced_name':unsafe==outside.read_bytes()})
    require(unsafe==b'different synthetic bytes','known-bad control not reproduced')
    case=output/'replacement-case';case.mkdir();root=case/'inputs';root.mkdir()
    target=root/'input';target.write_bytes(b'original');outside=case/'generated-other';outside.write_bytes(b'different synthetic bytes')
    def replace_before_open(stage,name):
        if stage=='before_open':target.rename(case/'saved-original');target.symlink_to(outside)
    changed=r.scan(root,limits,hook=replace_before_open);save('descriptor-replacement-refusal',changed)
    require(changed['outcomes'][0]['status']=='io_error' and changed['outcomes'][0]['bytes_read']==0,
            'descriptor-relative replacement was not refused')
    root=output/'partial-corpus';corpus(root)
    def injected_error(stage,name):
        if stage=='after_chunk' and name==b'03.bin':raise OSError(5,'synthetic read fault')
    partial=r.scan(root,limits,hook=injected_error);save('partial-failure',partial)
    require(not partial['all_checks_passed'] and len(partial['outcomes'])==10,'partial scan coverage lost')
    prior=[{'retained':'previous synthetic manifest'}]
    require(r.select_quiescent_manifest(prior,partial,quiescence_confirmed=True) is prior,'partial result replaced prior')
    root=output/'cancel-corpus';corpus(root);cancelled=threading.Event()
    def cancel_after_chunk(stage,name):
        if stage=='after_chunk':cancelled.set()
    stopped=r.scan(root,limits,cancelled=cancelled,hook=cancel_after_chunk);save('cooperative-cancellation',stopped)
    require(not stopped['all_checks_passed'] and len(stopped['outcomes'])==10,'cancelled coverage lost')
    require(r.select_quiescent_manifest(prior,stopped,quiescence_confirmed=True) is prior,'cancelled result replaced prior')
    overflow=r.scan(root,r.Limits(entries=4));save('entry-overflow',overflow)
    require(not overflow['initial_enumeration_complete'] and overflow['metrics']['submitted']==0,'overflow admitted reads')
    root=output/'same-size-corpus';root.mkdir();target=root/'input';target.write_bytes(b'a'*2048)
    initial=target.stat();mutated=[]
    def same_size_edit(stage,name):
        if stage=='after_chunk' and not mutated:
            target.write_bytes(b'b'*2048);os.utime(target,ns=(initial.st_atime_ns,initial.st_mtime_ns));mutated.append(True)
    mutation=r.scan(root,limits,hook=same_size_edit);save('same-size-restored-mtime',mutation)
    require(mutation['outcomes'][0]['status']=='changed_during_read','same-size edit was not detected in this fixture')
    summary['limits']=['Trusted generated directory ancestry; nonrecursive Linux experiment only.',
        'No hostile mounts/devices, immutable snapshot, watcher, archive or parser acceptance.',
        'Reader-slot/chunk counters are not total descriptors, RSS or kernel-cache measurements.',
        'Cancellation is cooperative; running filesystem calls are not forcibly interrupted.',
        'Quiescence must be maintained through scan and publication, not inferred from metadata.',
        'No worker-count speed ranking or target-project recommendation.']
    write_new(output/'receipt.json',summary)
    return output/'receipt.json'


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',required=True)
    args=parser.parse_args();print(run(args.output))
