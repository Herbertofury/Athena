"""Build the isolated audio page; reuse the existing selection state machine."""
import argparse,base64,hashlib,json,importlib.util
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
LAB=ROOT/'docs/audio-lab'
_spec=importlib.util.spec_from_file_location('atlas_audio_build_wire',ROOT/'experiments/upstream-validation-lab/receipt_gate.py')
_wire=importlib.util.module_from_spec(_spec);_spec.loader.exec_module(_wire)
def outputs():
    files={}
    def asset(stem,data,suffix):
        name=stem+'.'+hashlib.sha256(data).hexdigest()[:16]+suffix;files[name]=data;return name
    core=asset('audio-core',(LAB/'audio-core.mjs').read_bytes(),'.mjs')
    selection=asset('archive-selection',(ROOT/'apps/atlas-lab/ui/archive-view.mjs').read_bytes(),'.mjs')
    events=asset('media-events',(ROOT/'docs/media-lab/media-events.mjs').read_bytes(),'.mjs')
    css=(LAB/'audio.css').read_bytes();css_name=asset('audio',css,'.css')
    fixture=(LAB/'public-fixture.json').read_bytes();fixture_hash=hashlib.sha256(fixture).hexdigest();_wire.decode_receipt(fixture.decode())
    script=(LAB/'audio.js').read_text().replace("'./audio-core.mjs'",repr('./'+core)).replace("'__SELECTION_MODULE__'",repr('./'+selection)).replace("'__EVENT_MODULE__'",repr('./'+events)).replace('__FIXTURE_JSON_STRING__',json.dumps(fixture.decode())).replace('__FIXTURE_SHA256__',fixture_hash).encode()
    script_name=asset('audio',script,'.js')
    sri=lambda data:'sha384-'+base64.b64encode(hashlib.sha384(data).digest()).decode()
    html=(LAB/'index.template.html').read_text().replace('href="audio.css"',f'href="{css_name}" integrity="{sri(css)}" crossorigin="anonymous"').replace('src="audio.js"',f'src="{script_name}" integrity="{sri(script)}" crossorigin="anonymous"').encode();files['index.html']=html
    manifest={'harness':'atlas-public-audio-v1-verified-bytes','artifacts':{k:hashlib.sha256(v).hexdigest() for k,v in files.items()},'fixture_sha256':fixture_hash,'selection_source':'apps/atlas-lab/ui/archive-view.mjs'};files['build-manifest.json']=(json.dumps(manifest,indent=2)+'\n').encode();return files
if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
    for name,data in outputs().items():
        path=LAB/name
        if args.check:
            if not path.exists() or path.read_bytes()!=data:raise SystemExit('Stale audio asset: '+name)
        else:path.write_bytes(data)
    print('Audio assets verified' if args.check else 'Audio assets generated')
