import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {mount} from '../experiments/job-identity-lab/render-harness.mjs';
import * as input from '../apps/atlas-lab/ui/collection-input.mjs';
const source=readFileSync(new URL('../experiments/overview-content-identity-lab/candidate-app.js',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');
const response=message=>({counts:{succeeded:1},jobs:[{id:1,id_text:'1',job:'DedupExperiment',state:'succeeded',attempt:1,result:{error:message}}]});
test('same-origin engine replacement cannot reuse stale results with colliding job identity',()=>{
 const app=mount(source,input);app.render(response('FIRST DATABASE RESULT'));
 const old=app.get('jobs').firstChild;
 app.render(response('SECOND DATABASE RESULT'));
 assert.match(app.get('jobs').textContent,/SECOND DATABASE RESULT/);
 assert.doesNotMatch(app.get('jobs').textContent,/FIRST DATABASE RESULT/);
 assert.notEqual(app.get('jobs').firstChild,old);
 const current=app.get('jobs').firstChild;
 app.render(response('SECOND DATABASE RESULT'));
 assert.equal(app.get('jobs').firstChild,current);
});
test('unchanged state and attempt cannot hide malformed replacement data',()=>{
 const app=mount(source,input);app.render(response('LAST GOOD'));
 const old=app.get('jobs').firstChild,bad=response('unused');
 bad.jobs[0].result={project:{title:'malformed',id:'fixture',versions:null}};
 assert.throws(()=>app.render(bad));
 assert.equal(app.get('jobs').firstChild,old);
 assert.match(app.get('jobs').textContent,/LAST GOOD/);
});
test('isolated candidate retains complete replacement output through 1000 generated updates',()=>{
 const app=mount(source,input);
 for(let i=0;i<1000;i++){
  const data=response('revision '+i);data.jobs[0].result.extra={nested:[null,false,i,'文字🦊',{'9007199254740993':String(i)}],unknown:[]};
  app.render(JSON.parse(JSON.stringify(data)));
  const cold=mount(source,input);cold.render(data);
  assert.equal(app.get('jobs').textContent,cold.get('jobs').textContent);
 }
});
test('property order, job type and removed fields all invalidate cached content',()=>{
 const app=mount(source,input),data=response('same');
 data.jobs[0].result.extra={first:1,second:2};app.render(data);const old=app.get('jobs').firstChild;
 const next=response('same');next.jobs[0].result.extra={second:2,first:1};app.render(next);
 assert.notEqual(app.get('jobs').firstChild,old);
 const current=app.get('jobs').firstChild;next.jobs[0]={...next.jobs[0],job:{CollectProject:{id:'AABBCCDD'}},result:{error:'same'}};app.render(next);
 assert.notEqual(app.get('jobs').firstChild,current);
 assert.doesNotMatch(app.get('jobs').textContent,/"extra"/);
});
