"""Fixed fresh-process memory protocol; no downloads or arbitrary executable path.
Raw stdout/stderr stay in a new caller-owned directory before receipt validation.
"""
from pathlib import Path
import argparse,hashlib,importlib.util,json,subprocess,time
ROOT=Path(__file__).resolve().parents[2]
spec=importlib.util.spec_from_file_location('atlas_receipt_decoder',ROOT/'experiments/upstream-validation-lab/receipt_gate.py')
decoder=importlib.util.module_from_spec(spec);spec.loader.exec_module(decoder)
snapshot_spec=importlib.util.spec_from_file_location('atlas_memory_snapshot_gate',Path(__file__).with_name('snapshot_gate.py'))
snapshot_gate=importlib.util.module_from_spec(snapshot_spec);snapshot_spec.loader.exec_module(snapshot_gate)
FIELDS=snapshot_gate.FIELDS
def validate(data,lane,mode,source,harness_sha,adapter_sha,observer_sha):
    if not isinstance(data,dict) or type(data.get('schema_version')) is not int or data['schema_version']!=2:raise ValueError('Wrong schema')
    if data.get('lane')!=lane or data.get('capacity_mode')!=mode:raise ValueError('Lane mismatch')
    if data.get('source_sha256')!=source['sha256'] or type(data.get('source_bytes')) is not int or data['source_bytes']!=source['bytes'] or data.get('project_id')!=source['id']:raise ValueError('Input mismatch')
    if data.get('harness_sha256')!=harness_sha or data.get('adapter_sha256')!=adapter_sha or data.get('observer_sha256')!=observer_sha:raise ValueError('Source fingerprint mismatch')
    if data.get('complete_output_equal') is not True or type(data.get('repeated_records')) is not int or data['repeated_records']!=8:raise ValueError('Incomplete parity')
    for phase in ('before_input','before_records','retained','after_drop'):
        snapshot_gate.validate_snapshot(data.get(phase))
    return data

def run(sources,generated,output):
    output.mkdir(parents=True,exist_ok=False)
    binary=ROOT/'apps/atlas-lab/target/release/examples/project_process_memory_lab'
    digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
    observer_sha=digest(ROOT/'experiments/process-memory-lab/linux_memory.rs');binary_sha=digest(binary);harness_sha=digest(ROOT/'apps/atlas-lab/examples/project_process_memory_lab.rs');adapter_sha=digest(ROOT/'apps/atlas-lab/src/modrinth.rs')
    receipt={'scope':'48 fresh Linux processes; eight-record generated replay of each retained public or generated input','binary_sha256':binary_sha,'runner_sha256':digest(Path(__file__)),'harness_sha256':harness_sha,'adapter_sha256':adapter_sha,'observer_sha256':observer_sha,'snapshot_gate_sha256':digest(Path(__file__).with_name('snapshot_gate.py')),'lock_sha256':digest(ROOT/'apps/atlas-lab/Cargo.lock'),'completed':False,'samples':[]}
    start=time.monotonic()
    try:
        for case,path in [(x,sources/(x+'.json')) for x in ('AANobbMI','YL57xq9U','gvQqBUqZ')]+[('generated-large',generated)]:
            with path.open('rb') as source_file:raw=source_file.read(2*1024*1024+1)
            if not 0<len(raw)<=2*1024*1024:raise ValueError('Input budget exceeded')
            source={'sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'id':decoder.decode_receipt(raw)['id']}
            for mode in ('exact','spare'):
                for round_index in range(3):
                    for lane in (('baseline','candidate') if round_index%2==0 else ('candidate','baseline')):
                        if time.monotonic()-start>90:raise TimeoutError('Total experiment budget exceeded')
                        if digest(binary)!=binary_sha:raise ValueError('Binary changed during experiment')
                        stem=f'{case}-{mode}-{round_index}-{lane}'
                        try:result=subprocess.run([str(binary),str(path),lane,mode],capture_output=True,timeout=10,check=False)
                        except subprocess.TimeoutExpired as error:
                            (output/(stem+'.stdout')).write_bytes(error.stdout or b'');(output/(stem+'.stderr')).write_bytes(error.stderr or b'');raise
                        (output/(stem+'.stdout')).write_bytes(result.stdout);(output/(stem+'.stderr')).write_bytes(result.stderr)
                        if result.returncode or len(result.stdout)>65536 or len(result.stderr)>65536:raise ValueError('Execution/output budget failure')
                        data=validate(decoder.decode_receipt(result.stdout),lane,mode,source,harness_sha,adapter_sha,observer_sha)
                        receipt['samples'].append({'case':case,'source_mode':'generated augmentation' if case=='generated-large' else 'retained public response repeated eight times','round':round_index,'result':data})
        if len(receipt['samples'])!=48:raise ValueError('Incomplete run count')
        receipt['completed']=True
    except Exception as error:
        receipt['error_category']=type(error).__name__;raise
    finally:
        (output/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
    return receipt
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--sources',type=Path,required=True);p.add_argument('--generated',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();r=run(a.sources,a.generated,a.output);print(json.dumps({'completed':r['completed'],'samples':len(r['samples'])}))
