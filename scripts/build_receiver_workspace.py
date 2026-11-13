"""Native Athena complete-receiver workspace; preserve source validation and bundle identities."""
from pathlib import Path
import argparse,hashlib,importlib.util,json,re
from build_engineering_workspaces import replace
ROOT=Path(__file__).resolve().parents[1];SOURCE=ROOT/'engineering/docs/card-receiver-lab';DEST=ROOT/'dist/workspaces/engineering/receiver'
def build():
    spec=importlib.util.spec_from_file_location('source_receiver_builder',ROOT/'engineering/scripts/build_receiver_lab.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    original=module.outputs();manifest=json.loads(original['build-manifest.json']);files={DEST/name:data for name,data in original.items() if name.endswith('.mjs')}
    entry=next(name for name in original if name.startswith('receiver.') and name.endswith('.js'));code=original[entry].decode();imports='\n'.join(line for line in code.splitlines() if line.startswith('import '));code='\n'.join(line for line in code.splitlines() if not line.startswith('import '))
    code=replace(code,'document.getElementById(id)','root.getElementById(id)');code=replace(code,'createFocusGuard(document,window)','createFocusGuard(document,{addEventListener:listenWindow})')
    code=replace(code,"const identity='atlas-complete-receiver-v9-explicit-phase-status';","const identity='athena-native-complete-receiver-v1';")
    code=replace(code,'harness:identity,','harness:identity,source_harness:'+json.dumps(manifest['harness'])+',')
    code=replace(code,'cancelWorker=null,current=null,lastGood=null;','cancelWorker=null,current=retained.current,lastGood=retained.lastGood;')
    code=replace(code,"document.addEventListener('visibilitychange',()=>{if(busy&&document.hidden)hidden=true;});","const visibility=()=>{if(busy&&document.hidden)hidden=true;};document.addEventListener('visibilitychange',visibility);cleanups.push(()=>document.removeEventListener('visibilitychange',visibility));")
    code=replace(code,'const publish=()=>{','const publish=()=>{if(disposed)return;')
    code=replace(code,'if(busy)return;busy=true;','if(disposed||busy)return;busy=true;')
    code=replace(code,'guard.begin();',"guard.begin();$('status').textContent='Calibrating current run…';$('summary').textContent='Run in progress; previous completion is not this run.';")
    code=replace(code,"}catch(error){current.error=error.message;", "}catch(error){if(disposed)return;current.error=error.message;")
    code=replace(code,'finally{current.focus_state=guard.snapshot();','finally{if(disposed)return;current.focus_state=guard.snapshot();')
    code=code.replace('URL.createObjectURL(', 'createObjectURL(').replace('URL.revokeObjectURL(', 'revokeObjectURL(')
    html=(SOURCE/'index.template.html').read_text();css=html.split('<style>',1)[1].split('</style>',1)[0];html=html.split('</style>',1)[1].split('<script',1)[0].replace('<h1>','<h2>').replace('</h1>','</h2>')
    html='<p class="notice">Native Athena receiver lab. Complete generated workload only; no target-project winner. Receipts survive navigation in this tab only. Download before closing or reloading.</p><p id="search-status" role="status"></p>'+html
    header=(ROOT/'scripts/card_workspace_header.mjs').read_text().replace('MARKUP',json.dumps(html))
    footer='''
cancelRun=()=>{stopped=true;cancelWorker?.();guard.finish();if(busy&&current){current.complete=false;current.error='Workspace navigation interrupted this run; no winner declared.';}retained={current,lastGood};};
if(current){publish();$('status').textContent='Previous receipt retained. A new run is explicit.';}
$('last').disabled=!lastGood;
function setSearch(value){if(disposed)return;const q=String(value??'').trim().toLowerCase();$('search-status').textContent=!q?'Search matches experiment descriptions, not measured output.':('whole bounded validation worker clone transfer receipt modules esbuild rolldown complete receiver').includes(q)?'This receiver experiment matches your search.':'No match in this receiver experiment. Run controls and output are unchanged.';}
setSearch(search);
return {unmount,setTheme,setSearch,ready:true,exportState(){return {receiptAvailable:!!current,lastGoodAvailable:!!lastGood};}};
}
'''
    files[DEST/'index.mjs']=(imports+'\nlet retained={current:null,lastGood:null};\n'+header+code+footer).encode()
    css=css.replace('body{',':host{').replace('max-width:1000px;margin:32px auto;padding:20px','display:block;min-width:0;padding:20px')+'\n*{box-sizing:border-box}select,input{max-width:100%}input{font:inherit;min-height:44px}button{min-height:44px}button:focus-visible,select:focus-visible,input:focus-visible{outline:3px solid #80dfbd;outline-offset:3px}.notice{line-height:1.6}#output{max-height:60vh;overflow:auto}:host([data-theme="light"]){color-scheme:light;background:#f4f6fa;color:#172139}:host([data-theme="light"]) pre{background:#e8edf3;color:#172139}:host([data-theme="light"]) small{color:#405369}\n'
    files[DEST/'style.css']=css.encode()
    files[DEST/'manifest.json']=(json.dumps({'schema':1,'kind':'native complete receiver experiment','source_harness':manifest['harness'],'source_entry_sha256':hashlib.sha256(original[entry]).hexdigest(),'source_modules':{name:hashlib.sha256(data).hexdigest() for name,data in original.items() if name.endswith('.mjs')},'boundaries':['All original validation/transport/build lanes retained','No automatic runs; no target-project winner claimed','Navigation interrupts and retains incomplete receipt without replacing last good','Exact generated modules and bundled workers, not rebuilt dependencies']},indent=2)+'\n').encode()
    return files
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args()
    for path,data in build().items():
        if a.check:
            if not path.exists() or path.read_bytes()!=data:raise SystemExit('Stale native receiver asset: '+str(path))
        else:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
    print('Native receiver workspace '+('verified' if a.check else 'generated'))
