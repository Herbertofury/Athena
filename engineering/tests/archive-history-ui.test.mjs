import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {createArchiveSelection} from '../apps/atlas-lab/ui/archive-view.mjs';
const source=readFileSync(new URL('../apps/atlas-lab/ui/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
const html=readFileSync(new URL('../apps/atlas-lab/ui/index.html',import.meta.url),'utf8');
const tick=()=>new Promise(r=>setImmediate(r));
const newPage=(entries,next_before=null)=>new Response(JSON.stringify({entries,next_before,scope:'Metadata only'}),{headers:{'content-type':'application/json'}});
const entry=(generation,observed_at='2026-01-01 00:00:00')=>({generation,observed_at,stored_bytes:414});
const newer='9007199254741009',older='9007199254741008',cursor='9007199254740998';
const first=Array.from({length:12},(_,i)=>entry(String(BigInt(newer)-BigInt(i)),i===0?'<img src=x onerror=alert(1)>':undefined));
async function fixture(respond){
 const {document,window}=parseHTML(html),q=id=>document.getElementById(id),calls=[],verified=[];
 let navigated;
 const kind=q('saved-archive-kind');Object.defineProperty(kind,'value',{writable:true,value:'project'});
 const dialog=q('saved-archive-dialog');dialog.showModal=()=>{dialog.open=true;};
 const form=q('saved-archive-form');form.requestSubmit=()=>form.dispatchEvent(new window.Event('submit',{cancelable:true}));
 q('saved-archive-id').value='SHARED01';q('saved-archive-generation').value='';
 const fetch=async(path,options)=>{if(path==='/api/overview')return {ok:false,status:503};calls.push([path,options]);return respond(path,options);};
 const loadSavedArchive=async(kind,id,options)=>{if(options.fetchImpl)await options.fetchImpl('/api/'+kind+'-archive/'+id,{});return {kind,id,generation:q('saved-archive-generation').value,bytes:new Uint8Array(),hash:'f'.repeat(64),text:'verified original bytes'};};
 const realLoad=async(...args)=>{const r=await loadSavedArchive(...args);verified.push(r);return r;};
 vm.runInNewContext(source,{document,window:{addEventListener(name,fn){if(name==='hashchange')navigated=fn;}},location:{hash:'#collectors'},createArchiveSelection,loadSavedArchive:realLoad,fetch,AbortController,AbortSignal,DOMException,TextDecoder,Uint8Array,URLSearchParams,setTimeout,clearTimeout,setInterval(){}});
 await tick();return {q,document,window,calls,verified,navigate:navigated};
}
const rows=s=>s.q('saved-archive-history-list').querySelectorAll('li');
test('history is explicit, inert, bounded and chooses an exact large generation through the verifier',async()=>{
 const s=await fixture((path)=>path.includes('-archive/')?new Response('{}',{headers:{'x-atlas-generation':older}}):newPage(first,cursor));
 assert.deepEqual(s.calls,[]);s.q('list-saved-generations').click();await tick();
 assert.equal(s.calls[0][0],'/api/project-history/SHARED01?limit=12');
 assert.equal(s.calls[0][1].redirect,'error');assert.equal(s.calls[0][1].credentials,'same-origin');
 assert.equal(rows(s).length,12);assert.match(rows(s)[0].textContent,/<img src=x/);assert.equal(rows(s)[0].querySelector('img'),null);
 rows(s)[1].querySelector('button').click();await tick();
 assert.equal(s.calls[1][0],'/api/project-archive/SHARED01/'+older);
 assert.equal(s.verified[0].generation,older);assert.equal(s.q('saved-archive-generation').value,older);
 assert.equal(s.q('saved-archive-text').textContent,'verified original bytes');
});
test('only explicit Older follows the exact cursor; malformed and failed pages retain last good',async()=>{
 let step=0;const s=await fixture(()=>{step++;if(step===1)return newPage(first,cursor);if(step===2)return newPage([entry(newer)]);if(step===3)return new Response('{}',{status:429});return newPage([entry('9007199254740997')]);});
 s.q('list-saved-generations').click();await tick();
 for(let i=0;i<2;i++){
  s.q('older-saved-generations').click();await tick();
  assert.equal(s.calls.at(-1)[0],'/api/project-history/SHARED01?limit=12&before='+cursor);
  assert.equal(rows(s).length,12);assert.match(s.q('saved-archive-history-status').textContent,/previous page remains/);
 }
 s.q('older-saved-generations').click();await tick();
 assert.equal(rows(s).length,1);assert.match(rows(s)[0].textContent,/9007199254740997/);assert.equal(s.q('older-saved-generations').disabled,true);
});
test('changing ID or dismissing the panel aborts a late page and never opens a stale choice',async()=>{
 const pending=[];const s=await fixture((_path,options)=>new Promise(resolve=>pending.push([resolve,options.signal])));
 s.q('list-saved-generations').click();await tick();s.q('saved-archive-id').value='OTHER001';s.q('saved-archive-id').dispatchEvent(new s.window.Event('input'));assert.equal(pending[0][1].aborted,true);pending[0][0](newPage(first,cursor));await tick();
 assert.equal(rows(s).length,0);assert.equal(s.q('saved-archive-history').hidden,true);
 s.q('list-saved-generations').click();await tick();s.q('dismiss-saved-generations').click();assert.equal(pending[1][1].aborted,true);pending[1][0](newPage(first,cursor));await tick();assert.equal(rows(s).length,0);
 s.q('list-saved-generations').click();await tick();pending[2][0](newPage([entry(older)]));await tick();const stale=rows(s)[0].querySelector('button');
 s.q('saved-archive-kind').value='upstream';s.q('saved-archive-kind').dispatchEvent(new s.window.Event('change'));stale.click();await tick();assert.equal(s.calls.length,3);assert.equal(s.verified.length,0);
 s.q('saved-archive-id').value='hls';s.q('list-saved-generations').click();await tick();assert.equal(s.calls.at(-1)[0],'/api/upstream-history/hls?limit=12');pending[3][0](newPage([]));await tick();assert.match(s.q('saved-archive-history-status').textContent,/No retained/);
});
test('invalid targets, oversized pages and lossy numeric generations fail closed',async()=>{
 let step=0;const s=await fixture(()=>++step===1?new Response('x'.repeat(17000),{headers:{'content-type':'application/json'}}):newPage([entry(9007199254740992)]));
 s.q('saved-archive-id').value='bad/target';s.q('list-saved-generations').click();await tick();assert.deepEqual(s.calls,[]);assert.match(s.q('saved-archive-history-status').textContent,/canonical eight-character/);
 s.q('saved-archive-kind').value='version';s.q('saved-archive-id').value='SHARED01';s.q('list-saved-generations').click();await tick();assert.equal(s.calls.at(-1)[0],'/api/version-history/SHARED01?limit=12');assert.match(s.q('saved-archive-history-status').textContent,/size budget/);
 s.q('list-saved-generations').click();await tick();assert.equal(rows(s).length,0);assert.match(s.q('saved-archive-history-status').textContent,/Invalid/);
});
test('Previous returns to the exact retained metadata page without fetch, loss or stale action',async()=>{
 const middle=Array.from({length:12},(_,i)=>entry(String(BigInt(cursor)-1n-BigInt(i))));
 const last=middle.at(-1).generation,tail=String(BigInt(last)-1n);
 const s=await fixture(path=>path.endsWith('before='+last)?newPage([entry(tail)]):
   path.endsWith('before='+cursor)?newPage(middle,last):newPage(first,cursor));
 const previous=s.q('previous-saved-generations'), olderButton=s.q('older-saved-generations');
 assert.equal(previous.disabled,true);
 s.q('list-saved-generations').click();await tick();olderButton.click();await tick();olderButton.click();await tick();
 const stale=rows(s)[0].querySelector('button');
 assert.match(stale.textContent,new RegExp(tail));assert.equal(s.calls.length,3);
 previous.click();await tick();
 stale.click();await tick();
 assert.equal(s.calls.length,3);assert.equal(s.verified.length,0);
 assert.match(rows(s)[0].textContent,new RegExp(middle[0].generation));
 assert.match(s.q('saved-archive-history-status').textContent,/no new read/i);
 previous.click();await tick();
 assert.equal(s.calls.length,3);assert.match(rows(s)[0].textContent,new RegExp(newer));assert.equal(previous.disabled,true);
 olderButton.click();await tick();
 assert.equal(s.calls[3][0],'/api/project-history/SHARED01?limit=12&before='+cursor);
 s.q('saved-archive-id').value='OTHER001';s.q('saved-archive-id').dispatchEvent(new s.window.Event('input'));
 assert.equal(previous.disabled,true);assert.equal(rows(s).length,0);
});
test('Previous history is capped and retained across a failed deliberate Older request',async()=>{
 let fail=false;
 const s=await fixture(route=>{
   if(fail)return new Response('{}',{status:429});
   const match=route.match(/&before=(\d+)$/),head=match?BigInt(match[1])-1n:1000n;
   const entries=Array.from({length:12},(_,i)=>entry(String(head-BigInt(i))));
   return newPage(entries,entries.at(-1).generation);
 });
 const previous=s.q('previous-saved-generations'),olderButton=s.q('older-saved-generations');
 s.q('list-saved-generations').click();await tick();
 for(let i=0;i<10;i++){olderButton.click();await tick();}
 assert.match(rows(s)[0].textContent,/880/);
 fail=true;olderButton.click();await tick();
 assert.match(rows(s)[0].textContent,/880/);
 for(let i=0;i<8;i++){assert.equal(previous.disabled,false);previous.click();}
 assert.match(rows(s)[0].textContent,/976/);assert.equal(previous.disabled,true);
 assert.equal(s.calls.length,12);
});
