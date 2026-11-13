"""Native Athena card benchmark adapter; exact source transforms, no app iframe."""
from pathlib import Path
import argparse, hashlib, json, re
from build_engineering_workspaces import replace, body, scoped_css
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'engineering/docs/card-lab'
DEST=ROOT/'dist/workspaces/engineering/cards'

def build():
    files={}
    mappings={
      '../../experiments/cooperative-card-lab/commit.mjs':'./cooperative-commit.mjs',
      '../../experiments/cooperative-card-lab/pairs.mjs':'./cooperative-pairs.mjs',
      '../../experiments/cooperative-card-lab/scheduler.mjs':'./cooperative-scheduler.mjs',
      '../../experiments/card-receiver-lab/verified-receiver.mjs':'./verified-receiver.mjs',
    }
    origins={}
    def emit(name,content,source):
        files[DEST/name]=content.encode()
        origins[str(source.relative_to(ROOT))]=hashlib.sha256(source.read_bytes()).hexdigest()
    for relative in ['lab-core.mjs','preparation-core.mjs','lab-worker.mjs']:
        emit(relative,(SOURCE/relative).read_text(),SOURCE/relative)
    for old,new in mappings.items():
        path=(SOURCE/old).resolve()
        emit(new[2:],path.read_text().replace('../../docs/card-lab/lab-core.mjs','./lab-core.mjs'),path)
    for name in ['baseline.mjs','bounded-encoding.mjs']:
        path=ROOT/'engineering/experiments/card-receiver-lab'/name
        emit(name,path.read_text().replace('../../docs/card-lab/lab-core.mjs','./lab-core.mjs'),path)
    code=(SOURCE/'lab.js').read_text()
    for old,new in mappings.items():code=replace(code,old,new)
    imports='\n'.join(line for line in code.splitlines() if line.startswith('import '))
    code='\n'.join(line for line in code.splitlines() if not line.startswith('import '))
    code=replace(code,'Loaded harness: v14 · complete data and isolated commit variants','Loaded harness: Athena native v1 (source v14) · complete data and isolated commit variants')
    code=replace(code,'const $=id=>document.getElementById(id);','const $=id=>root.getElementById(id);')
    code=replace(code,'createFocusGuard(document,window)','createFocusGuard(document,{addEventListener:listenWindow})')
    code=replace(code,"document.addEventListener('visibilitychange',()=>{if(busy&&document.hidden)visibilityLost=true;});", "const visibility=()=>{if(busy&&document.hidden)visibilityLost=true;};document.addEventListener('visibilitychange',visibility);cleanups.push(()=>document.removeEventListener('visibilitychange',visibility));")
    code=replace(code,'let records=[],evidence=null,lastCompletedEvidence=null,busy=false,stop=false;', 'let records=[],evidence=retained.evidence,lastCompletedEvidence=retained.lastCompletedEvidence,busy=false,stop=false;')
    code=replace(code,"$('run').addEventListener('click',async()=>{if(busy)return;", "$('run').addEventListener('click',async()=>{if(disposed||busy)return;")
    code=replace(code,'}catch(error){if(evidence){', '}catch(error){if(disposed)return;if(evidence){')
    code=replace(code,'finally{focusGuard.finish();busy=false;', 'finally{focusGuard.finish();busy=false;if(disposed)return;')
    code=code.replace("harness:'atlas-card-density-v14-cooperative-commit'","harness:'athena-native-card-density-v1',source_harness:'atlas-card-density-v14-cooperative-commit'")
    code=code.replace('URL.createObjectURL(', 'createObjectURL(').replace('URL.revokeObjectURL(', 'revokeObjectURL(')
    code=code.replace('atlas-card-density-evidence.json','athena-card-density-evidence.json').replace('atlas-card-density-last-completed.json','athena-card-density-last-completed.json')
    header=(ROOT/'scripts/card_workspace_header.mjs').read_text()
    html=body(SOURCE/'index.template.html')
    html='<p class="notice">Generated workload only. No target-project speedup claim. Evidence survives workspace navigation in this tab; download it before closing or reloading Athena. Shared search finds an exact record ID without filtering measured output.</p>'+html
    header=header.replace('MARKUP',json.dumps(html))
    footer='''
  cancelRun=()=>{stop=true;preparationCancel?.();focusGuard.finish();if(evidence&&!evidence.complete&&busy){evidence.complete=false;evidence.error='Workspace navigation interrupted this run; no winner is declared.';evidence.performance_end_ms=performance.now();}retained={evidence,lastCompletedEvidence};};
  $('download-last-good').disabled=!lastCompletedEvidence;
  if(evidence){summarize();$('status').textContent='Previous receipt retained. Generate a new workload to inspect records; downloaded receipt remains unchanged.';}
  function setSearch(value){if(disposed)return;$('find').value=String(value??'').slice(0,300);}
  setSearch(search);
  return {unmount,setTheme,setSearch,ready:!disposed,exportState(){return {receiptAvailable:!!evidence,lastCompletedAvailable:!!lastCompletedEvidence};}};
}
'''
    emit('index.mjs',imports+'\nlet retained={evidence:null,lastCompletedEvidence:null};\n'+header+code+footer,SOURCE/'lab.js')
    css=scoped_css(SOURCE/'lab.css','cards')+'\n:host([data-theme="light"]){color-scheme:light;--bg:#f4f6fa;--panel:#fff;--text:#172139;--muted:#4e5e77;--line:#aebbd0;--accent:#2459a9;--green:#245c35}:host([data-theme="light"]) .controls,:host([data-theme="light"]) dialog{background:#eef2f7}:host([data-theme="light"]) button,:host([data-theme="light"]) input,:host([data-theme="light"]) select{background:#fff;border-color:#aebbd0}:host([data-theme="light"]) #run{background:#245c35;color:#fff}:host([data-theme="light"]) #viewport{background:#e8edf3}:host([data-theme="light"]) .card{background:linear-gradient(135deg,#fff,#eaf0f6);border-color:#aebbd0}:host([data-theme="light"]) .card .metadata{color:#405369}:host([data-theme="light"]) .eyebrow{color:#24596a}main{padding:0} .notice{padding:1rem;border:1px solid var(--line)}\n'
    emit('style.css',css,SOURCE/'lab.css')
    files[DEST/'manifest.json']=(json.dumps({'schema':1,'kind':'native card benchmark workspace','source_files':origins,'boundaries':['Generated workload; no target-project superiority claim','No iframe app wrapper; original worker/algorithms and validation retained','Stop/cleanup on navigation; no benchmark auto-run','Tab-memory receipts only; download before reload','No autoplay or provider/network requests']},indent=2)+'\n').encode()
    return files

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args();out=build()
    for path,data in out.items():
        if a.check:
            if not path.exists() or path.read_bytes()!=data:raise SystemExit('Stale native card asset: '+str(path.relative_to(ROOT)))
        else:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
    print(f'{len(out)} native card workspace assets '+('verified' if a.check else 'generated'))
