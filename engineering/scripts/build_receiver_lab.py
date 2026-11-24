"""Build isolated browser receiver assets from the tested experiment sources."""
import hashlib,json,argparse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'docs/card-receiver-lab'
def outputs(stage_worker=False):
    names={};files={}
    paths=[ROOT/'docs/card-lab/lab-core.mjs',ROOT/'experiments/card-receiver-lab/baseline.mjs',ROOT/'experiments/card-receiver-lab/bounded-encoding.mjs',ROOT/'experiments/card-receiver-lab/verified-receiver.mjs',ROOT/'experiments/card-receiver-lab/receipt-protocol.mjs',ROOT/'experiments/card-receiver-lab/phase-clock.mjs',OUT/'receiver-worker.mjs',OUT/'receiver.js']
    for path in paths:
        if path.name == 'receiver.js':
            if stage_worker:
                continue
            bundle_root=ROOT/'experiments/worker-bundle-lab'
            receipt=json.loads((bundle_root/'build-receipt.json').read_text())
            packages=json.loads((bundle_root/'tools/package.json').read_text())['devDependencies']
            for relative,digest in receipt['inputs'].items():
                source=Path(relative)
                if source.parent.as_posix()!='docs/card-receiver-lab' or source.name not in files or hashlib.sha256(files[source.name]).hexdigest()!=digest:
                    raise ValueError('Worker bundle input no longer matches the generated module graph: '+relative)
            for tool in ('esbuild','rolldown'):
                info=receipt['tools'][tool]
                data=(bundle_root/'artifacts'/('worker-'+tool+'.mjs')).read_bytes()
                if packages[tool]!=info['version'] or hashlib.sha256(data).hexdigest()!=info['sha256']:
                    raise ValueError('Worker bundle tool/output identity mismatch: '+tool)
                plain='worker-'+tool+'.mjs';name='worker-'+tool+'.'+hashlib.sha256(data).hexdigest()[:16]+'.mjs'
                names[plain]=name;files[name]=data
        text=path.read_text().replace('../../docs/card-lab/lab-core.mjs','./lab-core.mjs')
        for old,new in names.items():text=text.replace("'./"+old+"'","'./"+new+"'")
        data=text.encode();name=path.stem+'.'+hashlib.sha256(data).hexdigest()[:16]+path.suffix;names[path.name]=name;files[name]=data
    if stage_worker:
        files['worker-input-manifest.json']=(json.dumps({'scope':'Staged source graph only; not a published harness switch','entry':names['receiver-worker.mjs'],'artifacts':{name:hashlib.sha256(data).hexdigest() for name,data in files.items()}},indent=2)+'\n').encode()
        return files
    files['index.html']=(OUT/'index.template.html').read_text().replace('src="receiver.js"','src="'+names['receiver.js']+'"').encode()
    files['build-manifest.json']=(json.dumps({'harness':'atlas-complete-receiver-v9-explicit-phase-status','artifacts':{name:hashlib.sha256(data).hexdigest() for name,data in files.items()}},indent=2)+'\n').encode()
    return files
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');parser.add_argument('--stage-worker',action='store_true');args=parser.parse_args()
    for name,data in outputs(stage_worker=args.stage_worker).items():
        p=OUT/name
        if args.check:
            if not p.exists() or p.read_bytes()!=data:raise SystemExit('Asset mismatch: '+name)
        else:p.write_bytes(data)
    print('Receiver asset identities verified' if args.check else 'Worker source graph staged; published entrypoints unchanged' if args.stage_worker else 'Receiver assets generated')
