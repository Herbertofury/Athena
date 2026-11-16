"""Bounded analyst runner for already-built Atlas examples and retained public inputs.
No network, installer, credential or app command-execution endpoint.
"""
import argparse, datetime, hashlib, json, os, platform, statistics, subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--binary-dir',type=Path,required=True);p.add_argument('--input-dir',type=Path,required=True);p.add_argument('--output-dir',type=Path,required=True);a=p.parse_args()
a.output_dir.mkdir(parents=True,exist_ok=False)
rows=[];runs=[];report={'checked_at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'completed':False,'scope':'Actual parser component; real retained public inputs and generated augmentation separately classified by this operator manifest, not attested by the binary','environment':{'platform':platform.platform(),'cpu_count':os.cpu_count()},'timings':rows,'runs':runs,'binaries':{n:hashlib.sha256((a.binary_dir/n).read_bytes()).hexdigest() for n in ['upstream_validation_lab','upstream_validation_allocations']}}
try:
 for repeat in range(2):
  for case,source in [('hls','hls'),('rustsec','rustsec'),('serde-json','serde-json'),('generated-hls-128k-whitespace','hls')]:
   origin='generated_augmentation' if case.startswith('generated') else 'retained_public_response'
   for kind,name in [('timing','upstream_validation_lab'),('allocation','upstream_validation_allocations')]:
    output=a.output_dir/f'{kind}-{case}-{repeat}.json';stderr=output.with_suffix('.stderr');command=[str((a.binary_dir/name).resolve()),source,str((a.input_dir/(case+'.json')).resolve())]
    try:result=subprocess.run(command,capture_output=True,text=True,timeout=20)
    except subprocess.TimeoutExpired as error:
     output.write_bytes(error.stdout or b'');stderr.write_bytes(error.stderr or b'');runs.append({'case':case,'kind':kind,'repeat':repeat,'state':'timeout'});raise
    output.write_text(result.stdout);stderr.write_text(result.stderr);runs.append({'case':case,'origin':origin,'kind':kind,'repeat':repeat,'exit_code':result.returncode,'output_sha256':hashlib.sha256(output.read_bytes()).hexdigest()});assert result.returncode==0,'Example failed; retained stderr'
    data=json.loads(result.stdout);assert all(s['complete_record_equal'] for s in data['samples'])
    if kind=='timing':
     assert data['complete'];ss=[s for s in data['samples'] if not s['warmup']];base=[s['baseline_ns']/s['iterations'] for s in ss];cand=[s['candidate_ns']/s['iterations'] for s in ss];x=statistics.median(base);y=statistics.median(cand)
     rows.append({'case':case,'origin':origin,'repeat':repeat,'bytes':data['input_bytes'],'baseline_median_ns':x,'candidate_median_ns':y,'ratio_of_medians':x/y,'candidate_pair_wins':sum(c<b for b,c in zip(base,cand)),'pairs':len(ss),'baseline_sample_max_ns':max(base),'candidate_sample_max_ns':max(cand)})
    else:
     assert not data['accounting_error'];assert all(s['post_drop_live_requested_delta']==0 for s in data['samples'])
 report['completed']=True
except Exception as error:report['error']=type(error).__name__+': '+str(error);raise
finally:
 (a.output_dir/'summary.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
