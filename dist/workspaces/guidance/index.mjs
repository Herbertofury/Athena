import {validateCatalog,findDocuments,exportPacket,exportMarkdown,reviewReference,MAX_REFERENCE_BYTES} from './model.mjs';
export async function mount({container,search='',theme='dark',signal,state={},setState=()=>true}={}){
 const root=container.shadowRoot||container.attachShadow({mode:'open'}),cleanup=[],urls=new Set();let disposed=false,catalog=null,query=search,selected=new Set(),current='',saved=true;
 const style=document.createElement('link');style.rel='stylesheet';style.href=new URL('./style.css',import.meta.url).href;
 const shell=document.createElement('section');shell.className='guidance';root.replaceChildren(style,shell);
 function element(tag,text,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;}
 function setTheme(value){container.dataset.theme=value==='light'?'light':'dark';}
 function unmount(){if(disposed)return;disposed=true;for(const fn of cleanup)fn();for(const url of urls)URL.revokeObjectURL(url);urls.clear();root.replaceChildren();signal?.removeEventListener('abort',unmount);}
 function listen(node,type,fn){node.addEventListener(type,fn);cleanup.push(()=>node.removeEventListener(type,fn));}
 signal?.addEventListener('abort',unmount,{once:true});setTheme(theme);
 shell.append(element('p','Loading the versioned Athena guidance library…','status'));
 if(signal?.aborted){unmount();return {ready:false,unmount,setTheme,setSearch(){}};}
 try{
  const response=await fetch(new URL('./catalog.json',import.meta.url),{signal});if(!response.ok)throw Error('Catalog HTTP '+response.status);catalog=validateCatalog(await response.json());
  if(disposed)return {ready:false,unmount,setTheme,setSearch(){}};
  const restored=state||{};selected=new Set(Array.isArray(restored.selected)?restored.selected.filter(id=>catalog.documents.some(d=>d.id===id)):[]);current=catalog.documents.some(d=>d.id===restored.current)?restored.current:catalog.documents[0].id;
 }catch(error){if(!disposed)shell.replaceChildren(element('h2','Guidance could not load'),element('p',error.message+' Your other Athena workspaces remain available. Retry by reopening this workspace.','status'));return {ready:false,unmount,setTheme,setSearch(){}};}
 const intro=element('header',undefined,'intro');intro.append(element('p','SHARED KNOWLEDGE · LOCAL OWNERSHIP','eyebrow'),element('h2','Build once. Carry the understanding.'),element('p','A living engineering core for your projects. Explore the complete standards, choose what is useful, and export a source-attributed reference pack. Your project rules remain yours.'));
 const identity=element('p',`Athena guidance ${catalog.version} · ${catalog.documents.length} complete standards · source digests retained`,'identity');intro.append(identity);
 const bar=element('div',undefined,'toolbar'),all=element('button','Select all standards'),clear=element('button','Clear selection'),json=element('button','Export selected JSON'),markdown=element('button','Export selected Markdown');bar.append(all,clear,json,markdown);
 const status=element('p','','status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');const columns=element('div',undefined,'columns'),list=element('div',undefined,'standards'),reader=element('article',undefined,'reader');list.setAttribute('aria-label','Guidance standards');reader.setAttribute('aria-label','Selected standard');columns.append(list,reader);
 const note=element('details',undefined,'boundary');note.append(element('summary','What this does and does not do'),element('p','This reader and its exports do not modify any repository, install Skills, execute guidance or grant access. Existing Agent-Foundry consumers keep their known-good pins pending reviewed migration. Full source migration and repository deletion readiness are not claimed.'));
 const check=element('details',undefined,'boundary');check.append(element('summary','Verify or compare a local guidance pack'));
 const checkIntro=element('p','Compare an exported JSON pack with this app’s current standards. The file stays here; nothing is imported, installed or executed.');
 const choose=element('label','Local reference pack JSON '), input=element('input');input.type='file';input.accept='application/json,.json';choose.append(input);
 const checkStatus=element('p','Choose a JSON reference pack.');checkStatus.setAttribute('role','status');
 const findings=element('ul');check.append(checkIntro,choose,checkStatus,findings);
 let checkGeneration=0;
 listen(input,'change',async()=>{
  const generation=++checkGeneration,file=input.files[0];findings.replaceChildren();
  if(!file){checkStatus.textContent='Choose a JSON reference pack.';return;}
  if(file.size>MAX_REFERENCE_BYTES){checkStatus.textContent='This file exceeds the 512 KiB review limit.';return;}
  checkStatus.textContent='Reviewing the pack locally…';
  try{
   const report=await reviewReference(catalog,new Uint8Array(await file.arrayBuffer()));
   if(disposed||generation!==checkGeneration)return;
   checkStatus.textContent=report.exactSelection
    ? `${report.exact} of ${report.provided} selected standards exactly match. ${report.notIncluded} not included in this pack.`
    : `${report.exact} of ${report.provided} selected standards exactly match. ${report.notIncluded} not included. ${report.unknown} unknown IDs (${report.unknownBadDigest} failed checksum).`+(report.identityMatches?'':' The pack’s source or version differs.');
   const labels={exact:'Exact match','invalid-digest':'Checksum does not match the pack','content-changed':'Content differs from the current standard','source-changed':'Title or source metadata differs'};
   for(const row of report.rows){
    const li=element('li'),link=element('a',row.title);link.href=row.sourceUrl;link.rel='noopener noreferrer';link.target='_blank';
    li.append(link,document.createTextNode(' · '+labels[row.state]));findings.append(li);
   }
  }catch(error){if(!disposed&&generation===checkGeneration)checkStatus.textContent=error.message;}
 });
 shell.replaceChildren(intro,bar,status,columns,check,note);
 function persist(){saved=setState({current,selected:[...selected]})!==false;}
 function updateStatus(){status.textContent=`${selected.size} selected · ${findDocuments(catalog,query).length} of ${catalog.documents.length} standards match.`+(saved?' Selection is saved in this browser.':' Selection could not be saved. Export it before leaving this page.');json.disabled=markdown.disabled=selected.size===0;}
 function showDocument(){const d=catalog.documents.find(d=>d.id===current);reader.replaceChildren();if(!d)return;const title=element('h3',d.title);const link=element('a','View canonical source');link.href=d.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';reader.append(title,link,element('p',`${d.sourcePath} · SHA-256 ${d.sha256}`,'digest'));
  const source=element('div',undefined,'document');for(const [i,line] of d.text.split('\n').entries()){if(i===0&&line==='# '+d.title)continue;const h=/^(#{1,6})\s+(.+)$/.exec(line);source.append(element(h?'h4':'p',h?h[2]:line.replace(/<code>(.*?)<\/code>/g,'`$1`')));}reader.append(source);
 }
 function renderList(){list.replaceChildren();const matches=findDocuments(catalog,query);if(!matches.length)list.append(element('p','No matching standards. Clear the shared search to see the complete library.'));for(const d of matches){const row=element('div',undefined,'standard');row.dataset.document=d.id;const label=element('label'),check=document.createElement('input');check.type='checkbox';check.checked=selected.has(d.id);check.setAttribute('aria-label','Include '+d.title);check.onchange=()=>{check.checked?selected.add(d.id):selected.delete(d.id);persist();updateStatus();};label.append(check);const open=element('button',d.title);open.setAttribute('aria-pressed',String(current===d.id));open.onclick=()=>{current=d.id;persist();renderList();showDocument();};row.append(label,open);list.append(row);}updateStatus();}
 function download(kind){try{const packet=exportPacket(catalog,[...selected]),text=kind==='json'?JSON.stringify(packet,null,2):exportMarkdown(packet),url=URL.createObjectURL(new Blob([text],{type:kind==='json'?'application/json':'text/markdown'}));urls.add(url);const a=document.createElement('a');a.href=url;a.download=`athena-guidance-${catalog.version}.${kind==='json'?'json':'md'}`;shell.append(a);a.click();a.remove();status.textContent=`Exported ${packet.documents.length} complete standards with source paths and hashes. Reference only; no repository changed.`;}catch(error){status.textContent=error.message;}}
 listen(all,'click',()=>{selected=new Set(catalog.documents.map(d=>d.id));persist();renderList();});listen(clear,'click',()=>{selected.clear();persist();renderList();});listen(json,'click',()=>download('json'));listen(markdown,'click',()=>download('markdown'));
 function setSearch(value){query=String(value||'');if(!disposed)renderList();}
 renderList();showDocument();return {ready:true,unmount,setTheme,setSearch};
}
