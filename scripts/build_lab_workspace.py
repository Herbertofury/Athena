"""Generate the native Athena lab UI from retained runtime algorithms; no iframe/eval."""
from pathlib import Path
import argparse, hashlib, json, re
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'engineering/apps/atlas-lab/ui'
DEST=ROOT/'dist/workspaces/engineering/lab'
def replace(text, old, new):
    if text.count(old)!=1: raise ValueError(f'Expected exact single source marker: {old}')
    return text.replace(old,new)
def build():
    html=(SOURCE/'index.html').read_text().split('<body>',1)[1].split('</body>',1)[0]
    html=re.sub(r'<script\b.*?</script>','',html,flags=re.S)
    html=re.sub(r'<aside>.*?</aside>','',html,flags=re.S)
    html=re.sub(r'<header>.*?</header>','',html,flags=re.S)
    html=re.sub(r'<footer>.*?</footer>','',html,flags=re.S)
    nav='<nav class="lab-tabs" aria-label="Laboratory panels"><button data-panel="overview">Overview</button><button data-panel="collectors">Collection</button><button data-panel="experiments">Experiments</button></nav><p id="workspace-warning" role="status"></p><p id="lab-search-status" role="status"></p>'
    html='<link rel="stylesheet" href="'+str('STYLE_URL')+'">'+nav+html
    css=(SOURCE/'style.css').read_text().replace(':root',':host').replace('body{',':host{')
    css+='\n:host{display:block}.shell{display:block;min-height:0}main{padding:0;max-width:none}.panel{min-height:0;padding-top:20px}.lab-tabs{display:flex;flex-wrap:wrap;gap:10px;margin:0}.lab-tabs button{border:1px solid var(--edge)}#workspace-warning{color:var(--cyan)}#lab-search-status{font-size:12px;color:var(--muted)}button:not(.primary){background:var(--panel);color:var(--ink);border:1px solid var(--edge);border-radius:6px;padding:9px 13px;cursor:pointer}button:disabled{opacity:.55;cursor:default}\n'
    css+=':host([data-theme="light"]){color-scheme:light;--bg:#f4f6f2;--panel:#fff;--edge:#a9bdb4;--ink:#173237;--muted:#51676c;--green:#176c53;--cyan:#146671}:host([data-theme="light"]) .metrics article,:host([data-theme="light"]) .empty,:host([data-theme="light"]) .job{background:var(--panel)}:host([data-theme="light"]) .metrics span,:host([data-theme="light"]) label{color:var(--ink)}:host([data-theme="light"]) input,:host([data-theme="light"]) select,:host([data-theme="light"]) .job pre{background:#e7eeeb;color:var(--ink)}:host([data-theme="light"]) .primary{color:#fff}:host([data-theme="light"]) nav button[aria-current=page],:host([data-theme="light"]) .badge{background:#e1ebe5;color:var(--ink)}:host([data-theme="light"]) .badge.failed,:host([data-theme="light"]) .error{color:#8f321b!important;background:#fbeae3}:host([data-theme="light"]) .badge.running{background:#dcebef;color:#175b64}\n'
    code=(SOURCE/'app.js').read_text()
    imports,code=code.split('const $ =',1)
    imports=imports.replace('import {submitJob}', 'import {submitJob as originalSubmitJob}')
    code='const $ ='+code
    code=replace(code,'const $ = id => document.getElementById(id);',"const elements=new Map([...root.querySelectorAll('[id]')].map(el=>[el.id,el]));const $ = id => elements.get(id);")
    code=code.replace('document.querySelectorAll','root.querySelectorAll')
    code=replace(code,"root.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>{location.hash=b.dataset.panel;}));\nwindow.addEventListener('hashchange',()=>showPanel(location.hash.slice(1)));showPanel(location.hash.slice(1));", "root.querySelectorAll('[data-panel]').forEach(b=>b.addEventListener('click',()=>{currentPanel=b.dataset.panel;showPanel(currentPanel);navigate?.('#lab?panel='+currentPanel,{replace:false});}));showPanel(currentPanel);")
    code=replace(code,"let fetching=false;", "let fetching=false,overviewController=null;cancelOverview=()=>overviewController?.abort();")
    code=replace(code,'if(fetching||document.hidden)return;', 'if(disposed||fetching||document.hidden)return;')
    code=replace(code,'const controller=new AbortController(),timer=', 'const controller=new AbortController();overviewController=controller;const timer=')
    code=replace(code,'const data=await r.json();render(data,', 'const data=await r.json();if(disposed)return;render(data,')
    code=replace(code,"$('connection').classList.remove('error');", "$('connection').classList.remove('error');applySearch();")
    code=replace(code,"finally{clearTimeout(timer);fetching=false;}","finally{clearTimeout(timer);fetching=false;overviewController=null;}")
    code=replace(code,'refresh();setInterval(refresh,2500);document.addEventListener(\'visibilitychange\',refresh);', "await refresh();if(disposed){return controller;}const poll=setInterval(refresh,2500);cleanups.push(()=>clearInterval(poll));document.addEventListener('visibilitychange',refresh);cleanups.push(()=>document.removeEventListener('visibilitychange',refresh));")
    code=code.replace('URL.createObjectURL(', 'createObjectURL(').replace('URL.revokeObjectURL(', 'revokeObjectURL(')
    header=imports+'''\nexport async function mount({container,search='',theme='dark',route='#lab',state=null,navigate,signal}={}){
 if(!container?.attachShadow)throw new TypeError('Workspace container is required');
 const root=container.shadowRoot||container.attachShadow({mode:'open'}),lifetime=new AbortController(),cleanups=[],urls=new Set(),timers=new Set();
 let disposed=false,pendingSubmissions=0,warning=state?.submissionWarning||'',currentPanel=new URLSearchParams(route.split('?')[1]||'').get('panel')||state?.panel||'overview',query=String(search||'');
 const setTimeout=(fn,ms)=>{const id=globalThis.setTimeout(()=>{timers.delete(id);if(!disposed)fn();},ms);timers.add(id);return id;};
 const clearTimeout=id=>{timers.delete(id);globalThis.clearTimeout(id);};
 const createObjectURL=blob=>{const url=URL.createObjectURL(blob);urls.add(url);return url;};
 const revokeObjectURL=url=>{urls.delete(url);URL.revokeObjectURL(url);};
 function setTheme(v){container.dataset.theme=v==='light'?'light':'dark';}
 let cancelArchive=()=>{},cancelOverview=()=>{};
 function unmount(){if(disposed)return;disposed=true;lifetime.abort();cancelOverview();cancelArchive();for(const f of cleanups.splice(0)){try{f();}catch{}}for(const id of timers)globalThis.clearTimeout(id);timers.clear();for(const u of urls)URL.revokeObjectURL(u);urls.clear();root.querySelector('dialog[open]')?.close();root.replaceChildren();signal?.removeEventListener('abort',unmount);}
 signal?.addEventListener('abort',unmount,{once:true});setTheme(theme);
 const controller={unmount,setTheme,setSearch(value){query=String(value||'');if(controller.ready&&!disposed)applySearch();},setRoute(value){if(disposed||!controller.ready)return;currentPanel=new URLSearchParams(value.split('?')[1]||'').get('panel')||'overview';showPanel(currentPanel);},ready:false,exportState(){return {panel:currentPanel,submissionWarning:pendingSubmissions?'A submission was still pending when you left. Check Overview before submitting again; the job may already exist.':warning};}};
 if(signal?.aborted){unmount();return controller;}
 if(globalThis.location?.origin!=='http://127.0.0.1:41379'){
   const title=document.createElement('h2');title.textContent='Local evidence engine required';const message=document.createElement('p');message.textContent='This workspace reads and writes your local SQLite journal. Start Athena with serve-athena and its verified package, then open the local Athena address. This public page will not connect to localhost, queue work or create a database.';root.replaceChildren(title,message);return controller;
 }
 let info;try{const response=await fetch('/api/runtime',{signal:AbortSignal.any([lifetime.signal,AbortSignal.timeout(15000)]),cache:'no-store',redirect:'error',credentials:'same-origin'});if(!response.ok)throw Error('Local runtime is unavailable.');info=await response.json();if(info.application!=='Athena'||info.api_version!==1||info.same_origin_only!==true||info.loopback_only!==true||!info.runtime_manifest_sha256)throw Error('A verified unified Athena runtime is required.');}catch(error){if(!disposed){root.textContent=error.message;}return controller;}
 if(disposed)return controller;
 root.innerHTML=MARKUP.replace('STYLE_URL',new URL('./style.css',import.meta.url).href);
 const writeControls=[...root.querySelectorAll('#collect-form button,#project-archive-form button,#version-collect-form button,#upstream-form button,#version-experiment-form button,#run-experiment')];
 for(const button of writeControls)button.disabled=true;
 async function submitJob(job){if(!controller.ready||disposed)throw new Error('Local engine initialization is incomplete; no job was submitted.');pendingSubmissions++;try{return await originalSubmitJob(job,{fetchImpl:(url,options)=>fetch(url,{...options,signal:AbortSignal.any([options.signal,lifetime.signal])})});}catch(error){warning=error.message;throw error;}finally{pendingSubmissions--;}}
 '''.replace('MARKUP',json.dumps(html))
    footer='''
 cancelArchive=()=>archiveSelection.cancel();cancelOverview=()=>overviewController?.abort();
 if(warning)$('workspace-warning').textContent=warning;
 function applySearch(){const terms=query.toLocaleLowerCase().split(/\\s+/).filter(Boolean);let shown=0;for(const job of root.querySelectorAll('.job')){job.hidden=!terms.every(term=>job.textContent.toLocaleLowerCase().includes(term));if(!job.hidden)shown++;}const status=root.getElementById('lab-search-status');if(status)status.textContent=query?shown+' matching recent jobs. Search does not change the durable journal.':'';}
 applySearch();controller.ready=!disposed;if(controller.ready)for(const button of writeControls)button.disabled=false;return controller;
}
'''
    outputs={DEST/'index.mjs':(header+code+footer).encode(),DEST/'style.css':css.encode()}
    for name in ['collection-input.mjs','archive-view.mjs','job-submit.mjs']:outputs[DEST/name]=(SOURCE/name).read_bytes()
    manifest={'schema':1,'kind':'native loopback Athena lab adapter','source_files':[],'limits':['Same-origin loopback runtime only; public static app never probes localhost.','Generated source UI with retained job/archive validation; no automatic provider collection.','Switching workspaces cancels receipt/read waits, not durable jobs; unknown submission outcomes require checking Overview.','Shared shell retains only panel and uncertain submission warning, not archived provider JSON.']}
    for name in ['index.html','style.css','app.js','collection-input.mjs','archive-view.mjs','job-submit.mjs']:manifest['source_files'].append({'path':'engineering/apps/atlas-lab/ui/'+name,'sha256':hashlib.sha256((SOURCE/name).read_bytes()).hexdigest()})
    outputs[DEST/'manifest.json']=(json.dumps(manifest,indent=2)+'\n').encode();return outputs
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args();bad=[]
    for path,data in build().items():
        if a.check:
            if not path.exists() or path.read_bytes()!=data:bad.append(str(path.relative_to(ROOT)))
        else:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
    if bad:raise SystemExit('Stale lab adapter: '+', '.join(bad))
    print('6 lab workspace files '+('verified' if a.check else 'generated'))
