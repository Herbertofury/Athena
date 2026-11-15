import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mount} from '../experiments/job-identity-lab/render-harness.mjs';
import * as input from '../apps/atlas-lab/ui/collection-input.mjs';
const source=readFileSync(new URL('../apps/atlas-lab/ui/app.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'');
const A='a'.repeat(32),B='b'.repeat(32);
const row=(id=1)=>({id,id_text:String(id),job:'DedupExperiment',state:'queued',attempt:0,result:{unknown:{preserved:[null,false,'文字',id]}}});
const fixture=()=>({counts:{queued:3,succeeded:4,failed:5},jobs:[row()]});
const metrics=app=>Object.fromEntries(['pending','completed','failed'].map(id=>[id,app.get(id).textContent]));
function prepared(){const app=mount(source,input);app.render(fixture(),A);return app;}
function rejectsUnchanged(app,data,instance=A){
 const nodes=[...app.get('jobs').children],before=metrics(app),content=app.get('jobs').textContent;
 assert.throws(()=>app.render(data,instance),/Invalid overview counts/);
 assert.deepEqual(metrics(app),before);assert.deepEqual(app.get('jobs').children,nodes);assert.equal(app.get('jobs').textContent,content);
}
test('present invalid count values never replace last-good metrics or nodes',()=>{
 const invalid=['4','',null,false,true,-1,0.5,NaN,Infinity,-Infinity,Number.MAX_SAFE_INTEGER+1,{},[],undefined];
 for(const key of ['queued','running','succeeded','failed'])for(const value of invalid){
  const app=prepared(),data=fixture();data.counts[key]=value;rejectsUnchanged(app,data);
 }
});
test('malformed overview containers fail before committing any view state',()=>{
 for(const data of [null,[],false,{}, {counts:{},jobs:null},{counts:{},jobs:{}}, ...[null,[],false,'',undefined].map(counts=>({counts,jobs:[]}))])rejectsUnchanged(prepared(),data);
});
test('pending total must remain exact even when both individual counts are safe',()=>{
 for(const counts of [{queued:Number.MAX_SAFE_INTEGER,running:1},{queued:Number.MAX_SAFE_INTEGER-1,running:2}])rejectsUnchanged(prepared(),{counts,jobs:[]});
 const app=prepared();app.render({counts:{queued:Number.MAX_SAFE_INTEGER-1,running:1},jobs:[]});assert.equal(app.get('pending').textContent,String(Number.MAX_SAFE_INTEGER));
});
test('absent sparse states mean zero and totals are not constrained to fifty displayed rows',()=>{
 const app=prepared();app.render({counts:{},jobs:[]});assert.deepEqual(metrics(app),{pending:'0',completed:'0',failed:'0'});
 const data={counts:{queued:1000,running:4,succeeded:50000,failed:29},jobs:Array.from({length:50},(_,i)=>row(i+1)),new_metadata:{preserved:true}};
 app.render(data);assert.equal(app.get('jobs').children.length,50);assert.deepEqual(metrics(app),{pending:'1004',completed:'50000',failed:'29'});
 assert.match(app.get('jobs').textContent,/attempt 0/);assert.ok(app.get('jobs').textContent.includes(JSON.stringify(data.jobs[0].result,null,2)));
});
test('invalid new-engine counts cannot commit cache namespace and healthy recovery still reuses nodes',()=>{
 const app=prepared(),node=app.get('jobs').firstChild;rejectsUnchanged(app,{counts:{failed:-1},jobs:[row()]},B);
 app.render(fixture(),A);assert.equal(app.get('jobs').firstChild,node);
 app.render(fixture(),B);const replacement=app.get('jobs').firstChild;assert.notEqual(replacement,node);
 app.render(fixture(),B);assert.equal(app.get('jobs').firstChild,replacement);
});
test('ordinary JSON exponent overflow is rejected rather than displaying Infinity',()=>{
 rejectsUnchanged(prepared(),JSON.parse('{"counts":{"queued":1e309},"jobs":[]}'));
});
test('actual refresh reports invalid metrics, retains previous results, and recovers',async()=>{
 let data={...fixture(),worker_status:'running'},instance=A;
 const app=mount(source,input,{fetchImpl:async()=>({ok:true,headers:{get:()=>instance},json:async()=>data})});
 await new Promise(resolve=>setImmediate(resolve));const nodes=[...app.get('jobs').children],before=metrics(app);
 data={counts:{queued:'4',running:2},jobs:[],worker_status:'running'};instance=B;await app.refresh();
 assert.match(app.get('connection').textContent,/Invalid overview counts/);assert.deepEqual(app.get('jobs').children,nodes);assert.deepEqual(metrics(app),before);
 data={counts:{running:2,succeeded:9},jobs:[row()],worker_status:'running'};await app.refresh();
 assert.match(app.get('connection').textContent,/Connected/);assert.deepEqual(metrics(app),{pending:'2',completed:'9',failed:'0'});
});

test('extra count-map keys retain the integer-map contract without affecting displayed states',()=>{
 const app=prepared();app.render({counts:{queued:2,future_state:7},jobs:[]},A);
 assert.deepEqual(metrics(app),{pending:'2',completed:'0',failed:'0'});
 for(const value of ['7',null,-1,Infinity])rejectsUnchanged(app,{counts:{queued:2,future_state:value},jobs:[]},A);
});

test('ten thousand generated healthy sparse counts preserve exact expected metrics',()=>{
 const app=mount(source,input);let seed=7611907;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 for(let i=0;i<10000;i++){
  const counts={};for(const state of ['queued','running','succeeded','failed'])if(next()%3)counts[state]=next();
  app.render({counts,jobs:[]},A);
  assert.deepEqual(metrics(app),{pending:String((counts.queued??0)+(counts.running??0)),completed:String(counts.succeeded??0),failed:String(counts.failed??0)});
 }
});
