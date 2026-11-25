import assert from 'node:assert/strict';
import test from 'node:test';
import {learningActivity} from '../apps/atlas-lab/ui/learning-activity.mjs';
function harness(){
 const doc=new EventTarget(),view=new EventTarget(),indicator={hidden:true,dataset:{},
  hasAttribute(){return 'strip' in this.dataset;},removeAttribute(){delete this.dataset.strip;}};
 const requests=[],paints=[],clear=[];
 doc.hidden=false;view.createImageBitmap=blob=>new Promise(resolve=>requests.push({blob,resolve}));
 const canvas={getContext:()=>({drawImage:frame=>paints.push(frame),clearRect:(...data)=>clear.push(data)})};
 const control=learningActivity({doc,view,indicator,canvas});
 return {doc,view,indicator,requests,paints,clear,control};
}
const state=(id,state)=>({id,state}), turn=()=>new Promise(resolve=>setImmediate(resolve));
test('custom art is not decoded while idle or queued and a running job reuses a single decode',async()=>{
 const h=harness(),file={};h.control.setArtwork(file);await turn();
 assert.equal(h.requests.length,0);
 const job=h.control.begin('9007199254740993');job.observe(state('9007199254740993','queued'));await turn();
 assert.equal(h.indicator.hidden,true);assert.equal(h.requests.length,0);
 job.observe(state('9007199254740993','running'));job.observe(state('9007199254740993','running'));
 await turn();assert.equal(h.requests.length,1);assert.equal(h.requests[0].blob,file);
 let closed=0;
 h.requests[0].resolve({width:768,height:96,close(){closed++;}});await turn();
 assert.equal(h.indicator.dataset.strip,'ready');assert.equal(closed,1);
 job.observe(state('9007199254740993','succeeded'));assert.equal(h.indicator.hidden,true);
 assert.equal(h.indicator.dataset.strip,undefined);assert.equal(h.paints.length,1);
});
test('replacement artwork and a wrong operation do not display stale bytes or change newer status',async()=>{
 const h=harness();h.control.setArtwork({});
 const a=h.control.begin('1');a.observe(state('1','running'));await turn();
 h.control.setArtwork({});
 const b=h.control.begin('2');
 assert.equal(a.observe(state('1','succeeded')),'stale');
 b.observe(state('2','running'));await turn();
 let closed=0;h.requests[0].resolve({width:768,height:96,close(){closed++;}});await turn();
 assert.equal(h.paints.length,0);assert.equal(closed,1);
 assert.equal(b.observe(state('3','running')),'uncertain');
 h.requests.at(-1).resolve({width:768,height:96,close(){closed++;}});await turn();
 assert.equal(h.paints.length,0);assert.equal(closed,2);assert.equal(h.indicator.hidden,true);
});
test('hidden tab does not decode, pagehide drops the session asset, and late callbacks are closed',async()=>{
 const h=harness(),file={};h.control.setArtwork(file);h.doc.hidden=true;
 const a=h.control.begin('1');a.observe(state('1','running'));await turn();assert.equal(h.requests.length,0);
 h.doc.hidden=false;h.doc.dispatchEvent(new Event('visibilitychange'));await turn();
 assert.equal(h.requests.length,1);
 h.view.dispatchEvent(new Event('pagehide'));
 let closed=0;h.requests[0].resolve({width:768,height:96,close(){closed++;}});await turn();
 assert.equal(closed,1);assert.equal(h.indicator.hidden,true);assert.equal(h.paints.length,0);
 h.control.begin('2').observe(state('2','running'));await turn();assert.equal(h.requests.length,1);
 h.control.dispose();assert.equal(h.control.begin('3'),null);
});

test('a real worker-lease requeue pauses animation and drops any unfinished paint until running resumes',async()=>{
 const h=harness();h.control.setArtwork({});
 const a=h.control.begin('5');a.observe(state('5','running'));await turn();
 assert.equal(h.requests.length,1);
 assert.equal(a.observe(state('5','queued')),'queued');
 assert.equal(h.indicator.hidden,true);
 let closed=0;h.requests[0].resolve({width:768,height:96,close(){closed++;}});await turn();
 assert.equal(closed,1);assert.equal(h.paints.length,0);
 a.observe(state('5','running'));await turn();assert.equal(h.requests.length,2);
 h.requests[1].resolve({width:768,height:96,close(){closed++;}});await turn();
 assert.equal(h.indicator.dataset.strip,'ready');assert.equal(closed,2);
 a.observe(state('5','failed'));assert.equal(h.indicator.hidden,true);
});
