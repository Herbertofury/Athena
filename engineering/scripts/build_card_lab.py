#!/usr/bin/env python3
"""Build deterministic content-addressed browser lab assets; --check never writes."""
import argparse,hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/'docs/card-lab'
def outputs():
    core=(ROOT/'lab-core.mjs').read_bytes();core_name=f'lab-core.{hashlib.sha256(core).hexdigest()[:16]}.mjs'
    preparation=(ROOT/'preparation-core.mjs').read_text().replace("'./lab-core.mjs'",repr('./'+core_name)).encode()
    preparation_name=f'preparation-core.{hashlib.sha256(preparation).hexdigest()[:16]}.mjs'
    extras={};extra_names={}
    for module in ['baseline.mjs','bounded-encoding.mjs','verified-receiver.mjs']:
        text=(ROOT.parents[1]/'experiments/card-receiver-lab'/module).read_text().replace('../../docs/card-lab/lab-core.mjs','./'+core_name)
        for old,new in extra_names.items():text=text.replace("'./"+old+"'",repr('./'+new))
        data=text.encode();name=Path(module).stem+'.'+hashlib.sha256(data).hexdigest()[:16]+'.mjs';extra_names[module]=name;extras[name]=data
    commit=(ROOT.parents[1]/'experiments/cooperative-card-lab/commit.mjs').read_bytes();commit_name='cooperative-commit.'+hashlib.sha256(commit).hexdigest()[:16]+'.mjs';extras[commit_name]=commit
    pairs=(ROOT.parents[1]/'experiments/cooperative-card-lab/pairs.mjs').read_text().replace('../../docs/card-lab/lab-core.mjs','./'+core_name).encode();pairs_name='cooperative-pairs.'+hashlib.sha256(pairs).hexdigest()[:16]+'.mjs';extras[pairs_name]=pairs
    cooperative=(ROOT.parents[1]/'experiments/cooperative-card-lab/scheduler.mjs').read_bytes();cooperative_name='cooperative-scheduler.'+hashlib.sha256(cooperative).hexdigest()[:16]+'.mjs';extras[cooperative_name]=cooperative
    worker=(ROOT/'lab-worker.mjs').read_text().replace("'./preparation-core.mjs'",repr('./'+preparation_name)).encode()
    worker_name=f'lab-worker.{hashlib.sha256(worker).hexdigest()[:16]}.mjs'
    script=(ROOT/'lab.js').read_text().replace("'../../experiments/cooperative-card-lab/commit.mjs'",repr('./'+commit_name)).replace("'../../experiments/cooperative-card-lab/pairs.mjs'",repr('./'+pairs_name)).replace("'../../experiments/cooperative-card-lab/scheduler.mjs'",repr('./'+cooperative_name)).replace("'../../experiments/card-receiver-lab/verified-receiver.mjs'",repr('./'+extra_names['verified-receiver.mjs'])).replace("'./lab-core.mjs'",repr('./'+core_name)).replace("'./preparation-core.mjs'",repr('./'+preparation_name)).replace("'./lab-worker.mjs'",repr('./'+worker_name)).encode()
    script_name=f'lab.{hashlib.sha256(script).hexdigest()[:16]}.js'
    css=(ROOT/'lab.css').read_bytes();css_name=f'lab.{hashlib.sha256(css).hexdigest()[:16]}.css'
    html=(ROOT/'index.template.html').read_text().replace('href="lab.css"',f'href="{css_name}"').replace('src="lab.js"',f'src="{script_name}"').encode()
    files={**extras,core_name:core,preparation_name:preparation,worker_name:worker,script_name:script,css_name:css,'index.html':html}
    manifest={'harness':'atlas-card-density-v14-cooperative-commit','artifacts':{name:hashlib.sha256(data).hexdigest() for name,data in files.items()}}
    files['build-manifest.json']=(json.dumps(manifest,indent=2)+'\n').encode()
    return files
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args()
    for name,data in outputs().items():
        path=ROOT/name
        if args.check:
            if not path.exists() or path.read_bytes()!=data:raise SystemExit(f'Stale or missing generated asset: {name}')
        else:path.write_bytes(data)
    print('Card lab asset identities verified' if args.check else 'Card lab versioned assets generated')
