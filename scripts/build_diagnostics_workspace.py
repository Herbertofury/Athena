"""Native composition of the two retained media diagnostic harnesses, no embed."""
from pathlib import Path
import argparse,json,re,hashlib
from build_engineering_workspaces import replace
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'engineering/docs/media-lab';DEST=ROOT/'dist/workspaces/engineering/diagnostics'
def build():
 files={DEST/n:(SRC/n).read_bytes() for n in ['preview-loader.mjs','event-log-recovery.mjs','event-log-baseline.mjs','event-log-view.mjs','event-log-fixture.json']}
 event=(SRC/'event-log-benchmark.js').read_text();preview=(SRC/'preview-timeout-check.js').read_text();imports='\n'.join(l for code in [event,preview] for l in code.splitlines() if l.startswith('import '));event='\n'.join(l for l in event.splitlines() if not l.startswith('import '));preview='\n'.join(l for l in preview.splitlines() if not l.startswith('import '))
 event=event.replace('receipt=null,hidden=false','receipt=retained.receipt,hidden=false').replace('let recoveryReceipt=null','let recoveryReceipt=retained.recovery')
 event=event.replace('document.getElementById','root.getElementById')
 event=replace(event,"document.addEventListener('visibilitychange',()=>{if(busy&&document.hidden)hidden=true;});","const visibility=()=>{if(busy&&document.hidden)hidden=true;};document.addEventListener('visibilitychange',visibility);cleanups.push(()=>document.removeEventListener('visibilitychange',visibility));")
 event=event.replace('if(busy)return;', 'if(disposed||busy||previewBusy)return;')
 event=event.replace('if(document.hidden||hidden)', 'if(disposed||document.hidden||hidden)')
 event=replace(event,"}catch(error){receipt.error=String(error.message);", "}catch(error){if(disposed)return;receipt.error=String(error.message);")
 event=replace(event,'finally{receipt.finished_at=', 'finally{if(disposed)return;receipt.finished_at=')
 event=replace(event,"fetch('./event-log-fixture.json')", "fetch(new URL('./event-log-fixture.json',import.meta.url),{signal:lifetime.signal})")
 event=replace(event,"source=await response.json();", "source=await response.json();if(disposed)return {unmount,setTheme,setSearch,ready:false};")
 event=replace(event,"}catch(error){$('status').textContent=error.message;}","}catch(error){if(!disposed)$('status').textContent=error.message;}")
 preview=preview.replace('document.getElementById','root.getElementById').replace("('output')","('preview-output')").replace("('run')","('preview-run')")
 preview=replace(preview,'event.target.disabled=true;', 'if(disposed||busy||previewBusy)return;previewBusy=true;event.target.disabled=true;')
 preview=replace(preview,"const img=document.createElement('img');", "const img=document.createElement('img');activeImage=img;")
 preview=replace(preview,'{timeoutMs:30,report:', '{timeoutMs:30,setTimer:setTimeout,clearTimer:clearTimeout,report:')
 preview=replace(preview,'const first=await loader.run();','const first=await loader.run();if(disposed)return;')
 preview=replace(preview,'const retry=await loader.run();','const retry=await loader.run();if(disposed)return;')
 preview=replace(preview,'}catch(error){output.textContent=', '}catch(error){if(disposed)return;output.textContent=')
 preview=replace(preview,'finally{event.target.disabled=false;}', 'finally{previewBusy=false;if(!disposed)event.target.disabled=false;}')
 # Child module-scoped nodes are retained only while mounted. No automatic diagnostics.
 markup=(SRC/'event-log-benchmark.template.html').read_text().split('</style>',1)[1].split('<script',1)[0]
 markup=markup.replace('<h1>','<h2>').replace('</h1>','</h2>')
 p=(SRC/'preview-timeout-check.template.html').read_text().split('<body>',1)[1].split('<script',1)[0].replace('<h1>','<h2>').replace('</h1>','</h2>').replace('id="run"','id="preview-run"').replace('id="output"','id="preview-output"')
 markup='<p id="search-status" role="status"></p>'+markup+p
 header=(ROOT/'scripts/card_workspace_header.mjs').read_text().replace('MARKUP',json.dumps(markup))
 code=event+'\n'+preview
 code=code.replace('URL.createObjectURL(', 'createObjectURL(').replace('URL.revokeObjectURL(', 'revokeObjectURL(')
 footer="""
function setSearch(q){if(!disposed)$('search-status').textContent=String(q||'')?'Diagnostics: event-log rendering, DOM recovery and preview timeout. Search does not filter evidence.':'Native media diagnostics. Explicit actions only; generated tests are not live-provider acceptance.';}
setSearch(search);
if(receipt){$('results').textContent=JSON.stringify(receipt,null,2);$('export').disabled=false;$('status').textContent='Previous diagnostic receipt retained; new runs are explicit.';}
if(recoveryReceipt){$('recovery-results').textContent=JSON.stringify(recoveryReceipt,null,2);$('export-recovery').disabled=false;}
cancelRun=()=>{lifetime.abort();activeImage?.removeAttribute('src');if(busy&&receipt){receipt.complete=false;receipt.error='Navigation interrupted comparison; no winner declared.';}retained={receipt,recovery:recoveryReceipt};};
return {unmount,setTheme,setSearch,ready:!!source,exportState(){return {available:true};}};
}
"""
 # Install cancellation before async fixture loading, so early navigation aborts reads too.
 prefix="const lifetime=new AbortController();let previewBusy=false,activeImage=null;cancelRun=()=>{lifetime.abort();activeImage?.removeAttribute('src');};\n"
 files[DEST/'index.mjs']=(imports+'\nlet retained={receipt:null,recovery:null};\n'+header+prefix+code+footer).encode()
 css=':host{display:block;color:inherit;font:16px system-ui;min-width:0}*{box-sizing:border-box}button,select{font:inherit;padding:10px;margin:6px;max-width:100%;min-height:44px;background:#192b35;color:#edf4ef;border:1px solid #607080;border-radius:8px}pre{white-space:pre-wrap;overflow:auto;border:1px solid #607080;padding:12px;height:280px;overflow-wrap:anywhere}#results,#preview-output,#recovery-results{height:180px}label{display:inline-block;max-width:100%}p{line-height:1.5}button:focus-visible,select:focus-visible{outline:3px solid #80dfbd;outline-offset:2px}:host([data-theme="light"]) button,:host([data-theme="light"]) select{background:#fff;color:#172139}'
 files[DEST/'style.css']=css.encode();files[DEST/'manifest.json']=(json.dumps({'kind':'native auxiliary media diagnostics','source_files':{n:hashlib.sha256((SRC/n).read_bytes()).hexdigest() for n in ['event-log-benchmark.js','preview-timeout-check.js',*['preview-loader.mjs','event-log-recovery.mjs','event-log-baseline.mjs','event-log-view.mjs','event-log-fixture.json']]},'limits':['No iframe or automatic runs','Original full output comparison and recovery algorithms retained','Generated preview timeout, not provider outage','Measurements remain environment-specific; no target promotion']},indent=2)+'\n').encode();return files
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args()
 for path,data in build().items():
  if a.check:
   if not path.exists() or path.read_bytes()!=data:raise SystemExit('Stale diagnostics asset '+str(path))
  else:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
 print('Native diagnostics '+('verified' if a.check else 'generated'))
