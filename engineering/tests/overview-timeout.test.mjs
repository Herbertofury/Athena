import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../apps/atlas-lab/ui/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
const settle=()=>new Promise(resolve=>setImmediate(resolve));
function mount(fetchImpl){
 const elements=new Map(),timers=new Map();let next=0,interval;
 const get=id=>{if(!elements.has(id))elements.set(id,{textContent:id==='jobs'?'last good results':'',addEventListener(){},classList:{add(){},remove(){}}});return elements.get(id);};
 const context={document:{hidden:false,getElementById:get,querySelectorAll:()=>[],addEventListener(){}},window:{addEventListener(){}},location:{hash:'#overview'},createArchiveSelection:()=>({}),fetch:fetchImpl,AbortController,DOMException,Date,setTimeout(fn,ms){const id=++next;timers.set(id,{fn,ms});return id;},clearTimeout(id){timers.delete(id);},setInterval(fn){interval=fn;}};
 get('jobs');vm.runInNewContext(source,context);
 return {elements,timers,refresh:()=>interval()};
}
test('stalled overview fetch times out, keeps previous results and allows next poll',async()=>{
 let requests=0;const app=mount((_url,{signal})=>{requests++;return new Promise((_resolve,reject)=>signal?.addEventListener('abort',()=>reject(signal.reason),{once:true}));});
 assert.equal(requests,1);await app.refresh();assert.equal(requests,1,'only one in-flight poll');
 const deadline=[...app.timers.values()].find(t=>t.ms===15000);assert.ok(deadline,'overview request needs a finite deadline');deadline.fn();await settle();
 assert.match(app.elements.get('connection').textContent,/timed out.*Previous results remain visible/);
 assert.equal(app.elements.get('jobs').textContent,'last good results');assert.equal(app.timers.size,0);
 const next=app.refresh();assert.equal(requests,2);[...app.timers.values()][0].fn();await next;assert.equal(app.timers.size,0);
});
test('stalled overview body is covered by the same deadline',async()=>{
 const app=mount(async(_url,{signal})=>({ok:true,json:()=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}))}));
 await settle();const deadline=[...app.timers.values()].find(t=>t.ms===15000);assert.ok(deadline);deadline.fn();await settle();
 assert.match(app.elements.get('connection').textContent,/timed out/);assert.equal(app.timers.size,0);assert.equal(app.elements.get('jobs').textContent,'last good results');
});
test('failed HTTP response clears the poll deadline without rendering',async()=>{
 const app=mount(async()=>({ok:false,status:503}));await settle();assert.equal(app.timers.size,0);assert.match(app.elements.get('connection').textContent,/503/);assert.equal(app.elements.get('jobs').textContent,'last good results');
});
