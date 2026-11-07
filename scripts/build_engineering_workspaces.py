"""Build native Athena workspaces from the retained, tested engineering modules.

No iframe wrappers, runtime eval, remote code fetching or automatic media loading.
The transforms are exact and fail closed when source structure changes.
"""
from pathlib import Path
import hashlib,json,re,shutil,argparse
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'engineering/docs'
DEST=ROOT/'dist/workspaces/engineering'


def replace(text,old,new,count=1):
    if text.count(old)!=count:raise ValueError(f'Expected {count} occurrences of {old!r}, found {text.count(old)}')
    return text.replace(old,new)


def body(path):
    s=path.read_text().split('<body>',1)[1].split('</body>',1)[0]
    s=re.sub(r'<header\b.*?</header>','',s,flags=re.S)
    s=re.sub(r'<script\b.*?</script>','',s,flags=re.S)
    return s


LIFECYCLE='''
  if (!container?.attachShadow) throw new TypeError('A workspace container is required');
  const root=container.shadowRoot || container.attachShadow({mode:'open'});
  const lifetime=new AbortController(), cleanups=[], timeouts=new Set(), objectURLs=new Set();
  let disposed=false;
  const setTimeout=(fn,ms)=>{const id=globalThis.setTimeout(()=>{timeouts.delete(id);if(!disposed)fn();},ms);timeouts.add(id);return id;};
  const clearTimeout=id=>{timeouts.delete(id);globalThis.clearTimeout(id);};
  const createObjectURL=blob=>{const url=URL.createObjectURL(blob);objectURLs.add(url);return url;};
  const revokeObjectURL=url=>{objectURLs.delete(url);URL.revokeObjectURL(url);};
  function unmount(){if(disposed)return;disposed=true;lifetime.abort();for(const cleanup of cleanups.splice(0)){try{cleanup();}catch{}}for(const id of timeouts)globalThis.clearTimeout(id);timeouts.clear();for(const url of objectURLs)URL.revokeObjectURL(url);objectURLs.clear();root.replaceChildren();outerSignal?.removeEventListener('abort',unmount);}
  function setTheme(value){container.dataset.theme=value==='light'?'light':'dark';}
  outerSignal?.addEventListener('abort',unmount,{once:true});
  if(outerSignal?.aborted){unmount();return {unmount,setTheme,setSearch(){},exportState(){return null;},ready:false};}
'''


def scoped_css(path,kind):
    s=path.read_text().replace('@charset "UTF-8";','').replace(':root',':host').replace('body{',':host{')
    s+='\n:host{display:block;min-width:0}.masthead{display:none}.shell{min-height:0}main{min-width:0}.skip{display:none}\n'
    if kind=='research':
        s+=':host([data-theme="dark"]){color-scheme:dark;--ink:#edf4ef;--muted:#a3b7bf;--paper:#101b24;--white:#192b35;--line:#36505c;--teal:#8ee1c7;--teal-dark:#8ee1c7;--mint:#183b36;--orange:#f1ba8a;--amber:#3d3021;--nav:#101e28}.search-field,.filters select,.plan-control select,.sort-label select,dialog,.comparison-card{background:var(--white);color:var(--ink)}\n'
    else:
        s+=':host([data-theme="light"]){color-scheme:light;--bg:#f4f6f2;--panel:#fff;--edge:#c5d5cf;--ink:#173237;--muted:#51676c;--green:#176c53}:host([data-theme="light"]) .metrics div,:host([data-theme="light"]) .scope{background:#e9f0ec;color:#28484b}:host([data-theme="light"]) button,:host([data-theme="light"]) select{background:#e7eeeb;color:var(--ink)}\n'
    return s


def build():
    outputs={};origins=[]
    def emit(path,data,source=None):
        if isinstance(data,str):data=data.encode()
        outputs[DEST/path]=data
        if source:origins.append({'destination':str(path),'source':str(source.relative_to(ROOT)),'source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'output_sha256':hashlib.sha256(data).hexdigest()})
    def copy(path,source):emit(path,source.read_bytes(),source)
    # Research keeps the exact pure query/comparison module and content snapshot.
    r=SOURCE/'explorer';src=(r/'explorer.mjs').read_text();split=src.index("const $ =")
    imports=src[:split].replace('./__CORE__','./explorer-core.mjs');code=src[split:]
    code=replace(code,'document.getElementById(id)','root.getElementById(id)')
    code=replace(code,"let state = parseState(location.search);","let state = parseState(route.includes('?')?route.slice(route.indexOf('?')+1):typeof initialState==='string'?initialState:initialState?.query||'');\nif(search!==undefined)state.q=String(search).slice(0,300);")
    code=replace(code,"history.replaceState(null, '', location.pathname + (query ? '?' + query : '') + location.hash);","navigate?.('#research?'+(query||'q='),{replace:true});")
    code=replace(code,"window.addEventListener('popstate', () => { state = parseState(location.search); render(); });",'// The Athena shell owns history and route changes.')
    code=replace(code,"fetch($('app').dataset.catalog)","fetch(new URL('./catalog.json',import.meta.url),{signal:lifetime.signal})")
    code=replace(code,'let catalog;','let catalog,loaded=false;')
    code=replace(code,'renderStats(); bindEvents(); render();','renderStats(); bindEvents(); render(); loaded=true;')
    code=replace(code,'catalog = await response.json();','catalog = await response.json(); if(disposed)return;')
    code=replace(code,"  } catch (error) {\n    $('result-count')","  } catch (error) {\n    if(disposed)return;\n    $('result-count')")
    code=replace(code,"navigator.clipboard.writeText(location.href)","navigator.clipboard.writeText(shareURL())")
    code=replace(code,'document.body.append(a);','root.append(a);')
    code=code.replace('URL.createObjectURL(','createObjectURL(').replace('URL.revokeObjectURL(','revokeObjectURL(')
    code=code.replace('engineering-atlas-filtered-catalog.csv','athena-research-catalog.csv').replace('engineering-atlas-test-plan.json','athena-research-test-plan.json')
    code=replace(code,'main();','await main();')
    code=replace(code,'function notify(message) {','function notify(message) {\n  if(hostNotify){hostNotify(message);return;}')
    code=replace(code,"const saved = JSON.parse(localStorage.getItem('engineering-atlas-shortlist-v1') || '[]')","const saved = initialState?.shortlist || JSON.parse(localStorage.getItem('engineering-atlas-shortlist-v1') || '[]')")
    # Keep the search field for accessibility and workspace-level fallback; both use the same query state.
    html=body(r/'index.template.html').replace('__CATALOG__','catalog.json').replace('<label class="search-field">','<label class="search-field" hidden>')
    css=scoped_css(r/'explorer.css','research')
    pre=imports+'\nexport async function mount({container,search,theme="dark",notify:hostNotify,navigate,state:initialState,route="",signal:outerSignal}={}){\n'+LIFECYCLE
    pre+='  root.innerHTML='+json.dumps('<style>'+css+'</style>'+html)+';setTheme(theme);\n'
    pre+='  function shareURL(){const url=new URL(globalThis.location.href);url.hash="research?"+(encodeState(state)||"q=");return url.href;}\n'
    pre+='  root.addEventListener("click",e=>{const a=e.target.closest?.("a[href]");if(!a)return;const href=a.getAttribute("href");if(href.startsWith("?")){e.preventDefault();state=parseState(href.split("#")[0]);render();}else if(href.startsWith("#")){e.preventDefault();root.getElementById(href.slice(1))?.scrollIntoView?.({block:"start"});}});\n'
    post='''
  return {unmount,setTheme,ready:loaded,setRoute(value){if(disposed||!catalog)return;const next=parseState(value.includes('?')?value.slice(value.indexOf('?')+1):'');if(encodeState(next)!==encodeState(state)){state=next;render();}},setSearch(q){if(disposed||!catalog)return;setState({q:String(q??'').slice(0,300)});},exportState(){return {query:encodeState(state),shortlist:[...shortlist],loaded};}};
}
'''
    emit(Path('research/index.mjs'),pre+code+post,r/'explorer.mjs')
    copy(Path('research/explorer-core.mjs'),r/'explorer-core.mjs')
    manifest=json.loads((r/'build-manifest.json').read_text());catalog=next(p for p in manifest['files'] if re.fullmatch(r'docs/explorer/catalog\.[a-f0-9]+\.json',p))
    copy(Path('research/catalog.json'),ROOT/'engineering'/catalog)
    # Media reuses official players, complete receipts and the existing codec/player state machines.
    m=SOURCE/'media-lab';src=(m/'media.js').read_text();split=src.index('const $=');imports=src[:split];code=src[split:]
    code=replace(code,'document.getElementById(id)','root.getElementById(id)')
    code=replace(code,"new URL(location.href).searchParams.get('event_view')==='bounded'","(route.includes('?')?new URLSearchParams(route.slice(route.indexOf('?')+1)).get('event_view'):initialState?.event_view)==='bounded'")
    code=replace(code,'let dataset=null,decoded=0,previewLoader=null,previewBusy=false;','let dataset=null,decoded=0,previewLoader=null,previewBusy=false,mediaReady=false;')
    code=replace(code,"$('status').textContent='Real public metadata loaded. Media remains unloaded until you choose to test it.';","$('status').textContent='Real public metadata loaded. Media remains unloaded until you choose to test it.';mediaReady=true;")
    code=replace(code,'const eventMode=','let eventMode=')
    code=replace(code,'const eventRecorder=','let eventRecorder=')
    code=replace(code,'function event(type,details={}){','function event(type,details={}){if(disposed)return;')
    code=replace(code,'const controller=createBilibiliController({host,createFrame:', 'const controller=createBilibiliController({host,setTimer:setTimeout,clearTimer:clearTimeout,createFrame:')
    code=replace(code," load.addEventListener('click',()=>{try{controller.load", " cleanups.push(()=>controller.unload());\n load.addEventListener('click',()=>{try{controller.load")
    code=replace(code," load.addEventListener('click',async()=>{cleanup();", " cleanups.push(cleanup);\n load.addEventListener('click',async()=>{cleanup();")
    code=replace(code,"script.src='vendor/hls-1.7.3.min.js'","script.src=new URL('./vendor/hls-1.7.3.min.js',import.meta.url).href")
    vendor=m/'vendor/hls-1.7.3.min.js';import base64
    code=replace(code,'__HLS_SRI__','sha384-'+base64.b64encode(hashlib.sha384(vendor.read_bytes()).digest()).decode())
    code=replace(code," try{document.head.append(script);}catch(error){finish(error);}"," cleanups.push(()=>finish(Error('Workspace unloaded')));\n try{document.head.append(script);}catch(error){finish(error);}")
    code=replace(code," window.onYouTubeIframeAPIReady=onReady;", " cleanups.push(()=>finish(Error('Workspace unloaded')));\n window.onYouTubeIframeAPIReady=onReady;")
    code=replace(code,"fetch('./public-fixtures.json')","fetch(new URL('./public-fixtures.json',import.meta.url),{signal:lifetime.signal})")
    code=replace(code,"JSON.stringify(receipt,null,2)","JSON.stringify(blockedReceipt||receipt,null,2)")
    code=replace(code,'receipt.fixture_counts=mediaCounts(dataset);',"if(disposed)throw Error('Workspace unloaded');if(savedReceipt){if(savedReceipt.fixture_sha256!==receipt.fixture_sha256){blockedReceipt=savedReceipt;$('export').disabled=false;throw Error('The saved receipt belongs to a different fixture. Export it before beginning another media session.');}receipt.started_at=savedReceipt.started_at;for(const previous of savedReceipt.events)eventRecorder.record(previous);event('workspace_resumed',{retained_events:savedReceipt.events.length});}receipt.fixture_counts=mediaCounts(dataset);")
    code=replace(code,'const bytes=await response.arrayBuffer();','const bytes=await response.arrayBuffer();if(disposed)throw Error("Workspace unloaded");')
    code=replace(code,"catch(error){$('status').textContent=error.message;","catch(error){if(!disposed){$('status').textContent=error.message;")
    code=replace(code,"$('load-media').disabled=true;}\n","$('load-media').disabled=true;}}\n")
    code=replace(code,'createPreviewLoader(pendingImages,{report:', 'createPreviewLoader(pendingImages,{signal:lifetime.signal,setTimer:setTimeout,clearTimer:clearTimeout,report:')
    code=replace(code,'const result=await previewLoader.run();','const result=await previewLoader.run();if(disposed)return;')
    code=replace(code," catch{ $('status')"," catch{ if(disposed)return; $('status')")
    code=replace(code," finally{previewBusy=false;$('retry-media')"," finally{previewBusy=false;if(!disposed)$('retry-media')")
    code=code.replace('URL.createObjectURL(','createObjectURL(').replace('URL.revokeObjectURL(','revokeObjectURL(').replace('atlas-real-media-receipt.json','athena-media-receipt.json')
    html=body(m/'index.template.html')
    html=html.replace('<a href="?event_view=baseline">Baseline event view</a>','<button type="button" data-event-mode="baseline">Baseline event view</button>').replace('<a href="?event_view=bounded">Test bounded event view</a>','<button type="button" data-event-mode="bounded">Test bounded event view</button>')
    html=html.replace('<section id="cards"','<p id="search-status" role="status"></p><section id="cards"')
    pre=imports+'\nexport async function mount({container,search="",theme="dark",notify,navigate,state:initialState,route="",signal:outerSignal}={}){\n'+LIFECYCLE
    pre+='  root.innerHTML='+json.dumps('<style>'+scoped_css(m/'media.css','media')+'</style>'+html)+';setTheme(theme);\n'
    pre+='  let blockedReceipt=null;const savedReceipt=initialState?.receipt?.schema_version===1 && Array.isArray(initialState.receipt.events)?JSON.parse(JSON.stringify(initialState.receipt)):null;\n'
    pre+='  root.addEventListener("click",e=>{const button=e.target.closest?.("[data-event-mode]");if(button)navigate?.("#media?event_view="+button.dataset.eventMode);});\n'
    post='''
  function setSearch(value){if(disposed)return;search=String(value??'').slice(0,300);const terms=search.toLocaleLowerCase().split(/\\s+/).filter(Boolean);let visible=0;for(const card of root.querySelectorAll('article.card')){card.hidden=!terms.every(term=>card.textContent.toLocaleLowerCase().includes(term));if(!card.hidden)visible++;}root.getElementById('search-status').textContent=visible+' of '+(dataset?.cards.length||0)+' source records shown';}
  setSearch(search);
  return {unmount,setTheme,setSearch,setRoute(value){if(disposed)return;const query=new URLSearchParams(value.includes('?')?value.slice(value.indexOf('?')+1):'');setSearch(query.get('q')||'');const mode=query.get('event_view')==='bounded'?'bounded':'baseline';if(mode!==eventMode){const prior=[...receipt.events];receipt.events=[];eventMode=mode;eventRecorder=createMediaEventRecorder($('events'),receipt.events,eventMode);receipt.event_view=eventRecorder.state;for(const item of prior)eventRecorder.record(item);$('event-mode').textContent=mode==='bounded'?'Bounded event renderer: isolated integration candidate.':'Full-history event renderer: baseline.';event('event_view_changed',{mode});}},ready:mediaReady&&!disposed,exportState(){return {search,event_view:eventMode,receipt:JSON.parse(JSON.stringify(blockedReceipt||receipt))};}};
}
'''
    emit(Path('media/index.mjs'),pre+code+post,m/'media.js')
    deps=['media-event-recorder.mjs','media-events.mjs','bilibili-player.mjs','resource-loader.mjs','media-core.mjs','event-log-view.mjs','public-fixtures.json','vendor/hls-1.7.3.min.js','vendor/HLS-LICENSE.txt','vendor/provenance.json']
    for name in deps:copy(Path('media')/name,m/name)
    p=m/'preview-loader.mjs';s=p.read_text();s=replace(s,'{concurrency=4,','{signal=null,concurrency=4,');s=replace(s,"if(timer!==null)clearTimer(timer);timer=null;ok?resolve():reject(error);","if(timer!==null)clearTimer(timer);timer=null;signal?.removeEventListener('abort',onAbort);ok?resolve():reject(error);")
    s=replace(s,'    timer=setTimer(()=>{',"    const onAbort=()=>{try{entry.image.removeAttribute('src');}catch{notify('image_abort_cleanup_failed',{source:entry.image.dataset.source,attempt:entry.attempts});}finish(false,Error('Workspace unloaded'));};\n    if(signal?.aborted){onAbort();return;}signal?.addEventListener('abort',onAbort,{once:true});\n    timer=setTimer(()=>{")
    s=replace(s,'while(next<work.length)','while(!signal?.aborted&&next<work.length)')
    emit(Path('media/preview-loader.mjs'),s,p)
    emit(Path('manifest.json'),json.dumps({'schema_version':1,'kind':'native Athena workspace adapters','source_modules':origins,'boundaries':['No iframe app wrapper or runtime eval','No automatic provider requests or autoplay','Research pure query/comparison module copied unchanged','Media lifecycle adds abort/cleanup; source player behavior and completeness states retained','Rust local API workspace is not mounted by these static modules','Real-browser visual/input and actual player acceptance remain separate gates']},indent=2)+'\n')
    return outputs


if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');args=p.parse_args();outputs=build();bad=[]
    for path,data in outputs.items():
        if args.check:
            if not path.exists() or path.read_bytes()!=data:bad.append(str(path.relative_to(ROOT)))
        else:path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
    if bad:raise SystemExit('Stale engineering workspace assets: '+', '.join(bad))
    print(f'{len(outputs)} native engineering workspace files '+('verified' if args.check else 'generated'))
