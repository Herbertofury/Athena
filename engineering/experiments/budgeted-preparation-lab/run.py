"""Bounded fresh-process generated workload; preserve every stdout/stderr."""
import argparse,importlib.util,json,math,pathlib,re,resource,subprocess,time,hashlib
p=argparse.ArgumentParser();p.add_argument('--output',type=pathlib.Path,required=True);a=p.parse_args();a.output.mkdir(parents=True,exist_ok=False)
root=pathlib.Path(__file__).resolve().parents[2];spec=importlib.util.spec_from_file_location('wire',root/'experiments/upstream-validation-lab/receipt_gate.py');wire=importlib.util.module_from_spec(spec);spec.loader.exec_module(wire)
gs=importlib.util.spec_from_file_location('budget_gate',pathlib.Path(__file__).with_name('receipt_gate.py'));gate=importlib.util.module_from_spec(gs);gs.loader.exec_module(gate)
receipt={'scope':'fresh Node processes, generated complete data, unchanged full receiver; not browser or target-project acceptance','completed':False,'samples':[],'sources':{str(f.relative_to(root)):hashlib.sha256(f.read_bytes()).hexdigest() for f in [pathlib.Path(__file__),pathlib.Path(__file__).with_name('child.mjs'),pathlib.Path(__file__).with_name('encoder.mjs'),pathlib.Path(__file__).with_name('preparation.mjs'),pathlib.Path(__file__).with_name('receipt_gate.py'),root/'docs/card-lab/preparation-core.mjs',root/'docs/card-lab/lab-core.mjs',root/'experiments/card-receiver-lab/verified-receiver.mjs']}}
expected={};start=time.monotonic()
def limits():resource.setrlimit(resource.RLIMIT_CPU,(8,8))
def require(value,message):
 if not value:raise ValueError(message)
try:
 for count,size in [(200,8192),(1000,8192),(1000,65536)]:
  for round in range(5):
   for mode in (['baseline','budgeted'] if round%2==0 else ['budgeted','baseline']):
    require(time.monotonic()-start<120,'Overall experiment budget')
    stem=f'{count}-{size}-{round}-{mode}'
    try:r=subprocess.run(['node','--max-old-space-size=512',str(pathlib.Path(__file__).with_name('child.mjs')),mode,str(count),str(size)],capture_output=True,timeout=12,preexec_fn=limits)
    except subprocess.TimeoutExpired as e:
     (a.output/(stem+'.stdout')).write_bytes(e.stdout or b'');(a.output/(stem+'.stderr')).write_bytes(e.stderr or b'');receipt['failure']={'sample':stem,'reason':'wall_timeout'};raise
    (a.output/(stem+'.stdout')).write_bytes(r.stdout);(a.output/(stem+'.stderr')).write_bytes(r.stderr)
    require(r.returncode==0,f'Child exit {r.returncode}')
    require(len(r.stdout)<=8192 and len(r.stderr)<=8192,'Receipt budget')
    v=gate.validate(wire.decode_receipt(r.stdout),mode,count,size)
    key=(count,size);binding=(v['serialized_bytes'],v['sha256']);expected.setdefault(key,binding);require(expected[key]==binding,'Full serialized result differs across lanes/rounds')
    receipt['samples'].append({'round':round,**v})
 receipt['completed']=len(receipt['samples'])==30
except Exception as error:
 receipt.setdefault('failure',{'sample':locals().get('stem'),'reason':type(error).__name__,'message':str(error)});raise
finally:(a.output/'receipt.json').write_text(json.dumps(receipt,indent=2)+'\n')
print(json.dumps({'completed':receipt['completed'],'samples':len(receipt['samples'])}))
