import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import * as input from '../apps/atlas-lab/ui/collection-input.mjs';
import {createArchiveSelection} from '../apps/atlas-lab/ui/archive-view.mjs';
const appSource=readFileSync(new URL('../apps/atlas-lab/ui/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
const helperPath=new URL('../apps/atlas-lab/ui/job-submit.mjs',import.meta.url);
const helper=existsSync(helperPath)?readFileSync(helperPath,'utf8').replace(/^export /gm,''):'';
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function mount(bodyStall=false){
 const elements=new Map(),timers=new Map(),requests=[];let timerId=0;
 const values={project:'sodium','version-experiment-id':'g6ju16VJ','version-collect-ids':'g6ju16VJ','upstream-source':'rustsec','project-archive-id':'sodium'};
 const get=id=>{if(!elements.has(id)){const handlers=new Map(),button={disabled:false};elements.set(id,{value:values[id]||'',textContent:id==='jobs'?'last good results':'',disabled:false,handlers,classList:{add(){},remove(){}},addEventListener(type,fn){handlers.set(type,fn);},querySelector(){return button;}});}return elements.get(id);};
 const fetchImpl=async(url,options={})=>{if(options.method!=='POST')return {ok:false,status:503};requests.push({url,options});
  if(bodyStall)return new Response(new ReadableStream({start(controller){options.signal?.addEventListener('abort',()=>controller.error(options.signal.reason),{once:true});}}),{headers:{'content-type':'application/json'}});
  return new Promise((_resolve,reject)=>options.signal?.addEventListener('abort',()=>reject(options.signal.reason),{once:true}));
 };
 const context={...input,document:{hidden:false,getElementById:get,querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}},location:{hash:'#collectors'},createArchiveSelection,fetch:fetchImpl,AbortController,DOMException,Date,Uint8Array,TextDecoder,setTimeout(fn,ms){const id=++timerId;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);},setInterval(){}};
 get('jobs');vm.runInNewContext(helper+'\n'+appSource,context);return {get,timers,requests};
}
const actions=[['collect-form','collect-status'],['version-experiment-form','version-experiment-status'],['version-collect-form','version-collect-status'],['upstream-form','upstream-status'],['project-archive-form','project-archive-status'],['run-experiment','experiment-status']];
for(const [node,status] of actions)test(node+' recovers from an unconfirmed submission without retrying',async()=>{
 const app=mount();await settle();const element=app.get(node),click=node==='run-experiment',button=click?element:element.querySelector();const pending=element.handlers.get(click?'click':'submit')({preventDefault(){},currentTarget:element});
 assert.equal(app.requests.length,1);assert.equal(button.disabled,true);const deadline=[...app.timers.values()].find(t=>t.ms===15000);assert.ok(deadline,'submission needs a bounded receipt deadline');deadline.fn();await pending;
 assert.equal(button.disabled,false);assert.equal(app.requests.length,1,'never retry an uncertain POST');assert.match(app.get(status).textContent,/unconfirmed.*Overview/i);assert.equal(app.get('jobs').textContent,'last good results');assert.equal(app.timers.size,0);
});
test('submission deadline covers a stalled receipt body, not only response headers',async()=>{
 const app=mount(true);await settle();const form=app.get('collect-form');const pending=form.handlers.get('submit')({preventDefault(){},currentTarget:form});await settle();const deadline=[...app.timers.values()].find(t=>t.ms===15000);assert.ok(deadline);deadline.fn();await pending;assert.equal(form.querySelector().disabled,false);assert.match(app.get('collect-status').textContent,/unconfirmed/i);assert.equal(app.requests.length,1);
});
