import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mount} from '../experiments/job-identity-lab/render-harness.mjs';
import * as input from '../apps/atlas-lab/ui/collection-input.mjs';
const source=readFileSync(new URL('../apps/atlas-lab/ui/app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
const A='a'.repeat(32),B='b'.repeat(32);
const data=message=>({counts:{succeeded:1},jobs:[{id:1,id_text:'1',job:'DedupExperiment',state:'succeeded',attempt:1,result:{error:message}}]});
test('engine identity scopes keyed reuse without comparing full results',()=>{
 const app=mount(source,input);app.render(data('old database'),A);const old=app.get('jobs').firstChild;
 app.render(data('new database'),B);assert.match(app.get('jobs').textContent,/new database/);assert.notEqual(app.get('jobs').firstChild,old);
 const current=app.get('jobs').firstChild;app.render(data('new database'),B);assert.equal(app.get('jobs').firstChild,current);
});
test('missing identity disables reuse and invalid identity retains last good',()=>{
 const app=mount(source,input);app.render(data('old database'),null);app.render(data('new database'),null);assert.match(app.get('jobs').textContent,/new database/);
 const current=app.get('jobs').firstChild;assert.throws(()=>app.render(data('invalid engine'),'not-valid'));assert.equal(app.get('jobs').firstChild,current);
});
test('failed new-engine preparation cannot commit its cache namespace',()=>{
 const app=mount(source,input);app.render(data('last good'),A);const old=app.get('jobs').firstChild;
 const bad=data('unused');bad.jobs[0].result={project:{title:'malformed',id:'fixture',versions:null}};
 assert.throws(()=>app.render(bad,B));assert.equal(app.get('jobs').firstChild,old);
 app.render(data('last good'),A);assert.equal(app.get('jobs').firstChild,old);
 app.render(data('recovered new engine'),B);assert.match(app.get('jobs').textContent,/recovered new engine/);
});
test('1000 engine replacements retain all fifty cards and full recorded output',()=>{
 const app=mount(source,input);
 for(let revision=1;revision<=1000;revision++){
  const value={counts:{succeeded:50},jobs:Array.from({length:50},(_,i)=>({id:i+1,id_text:String(i+1),job:'DedupExperiment',state:'succeeded',attempt:1,result:{error:'engine '+revision+' row '+i,unknown:[null,false,'文字',revision]}}))};
  app.render(value,revision.toString(16).padStart(32,'0'));
  const cards=app.get('jobs').children;assert.equal(cards.length,50);
  for(let i=0;i<50;i++){assert.match(cards[i].textContent,new RegExp('engine '+revision+' row '+i));assert.ok(cards[i].textContent.includes(JSON.stringify(value.jobs[i].result,null,2)));}
 }
});
test('actual refresh consumes response engine header across server replacement',async()=>{
 let instance=A,message='first response',reads=0;
 const app=mount(source,input,{fetchImpl:async()=>({ok:true,headers:{get(name){assert.equal(name,'x-atlas-engine-instance');reads++;return instance;}},json:async()=>data(message)})});
 await new Promise(resolve=>setImmediate(resolve));assert.match(app.get('jobs').textContent,/first response/);
 instance=B;message='replacement response';await app.refresh();
 assert.match(app.get('jobs').textContent,/replacement response/);assert.equal(reads,2);
});
