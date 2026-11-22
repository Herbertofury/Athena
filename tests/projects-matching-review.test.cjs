const test=require('node:test'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const row={name:'Project A',ownership:'own',stage:'research',goal:'repeat target mark',next:'',blockers:'',decisions:'',resources:'',source:'',version:'',release:'',at:0};
const old='https://example.test/old',release='https://example.test/releases/old';
function fixture(count=27){
 return {schema:1,entries:[{id:'a',archived:false,revisions:Array.from({length:count},(_,i)=>({...row,at:i,goal:i===0?'repeat target mark <img src=x>':row.goal,...(i===0?{source:old,release,hiddenMetadata:'do not render orphan extension'}:{})}))}]};
}
async function mountFixture(state,readSavedProject){
 const {document}=parseHTML('<body><section></section></body>'),container=document.querySelector('section');
 const origin={document:globalThis.document,fetch:globalThis.fetch};
 globalThis.document=document;globalThis.fetch=()=>assert.fail('Review must not issue a request');
 const {mount}=await import('../dist/workspaces/projects/index.mjs');
 const controller=mount({container,state,readSavedProject,setState:()=>assert.fail('Review must not change storage')});
 const q=s=>container.shadowRoot.querySelector(s),qa=s=>[...container.shadowRoot.querySelectorAll(s)];
 controller.setSearch('repeat target mark');q('#history-search').onchange({target:{value:'history'}});q('[data-project] button').onclick();
 const click=(region,name)=>qa(region+' button').find(x=>x.textContent===name).onclick();
 return {q,qa,click,controller,cleanup(){controller.unmount();globalThis.document=origin.document;globalThis.fetch=origin.fetch;}};
}
const matches='[aria-label="Matching saved revisions"]',review='[aria-label="Reviewed saved revision"]';
test('history match opens only the exact confirmed revision after explicit paging and preserves raw history',async()=>{
 const state=fixture(),bytes=JSON.stringify(state),app=await mountFixture(state);
 const {q,qa,click}=app;
 try{
  assert.equal(qa(matches+' li').length,24);assert.equal(q(review).hidden,true);assert.equal(q('#saved-history pre'),null);
  assert.equal(q(matches+' [data-match-revision="1"]'),null);
  click(matches,'Show next 3 matching revisions');
  assert.equal(qa(matches+' li').length,27);
  q(matches+' [data-match-revision="1"]').onclick();
  assert.equal(q(review).hidden,false);
  assert.match(q(review+' h4').textContent,/Revision 1/);
  assert.match(q(review).textContent,/repeat target mark <img src=x>/);assert.equal(q(review+' img'),null);
  assert.doesNotMatch(q(review).textContent,/do not render orphan extension/);
  assert.deepEqual(qa(review+' a').map(a=>[a.getAttribute('href'),a.rel]),[[old,'noopener noreferrer'],[release,'noopener noreferrer']]);
  assert.equal(q('#saved-history pre'),null);assert.equal(JSON.stringify(state),bytes);
  const staleClose=q(review+' button');q(matches+' [data-match-revision="2"]').onclick();
  staleClose.onclick();assert.equal(q(review).hidden,false);assert.match(q(review+' h4').textContent,/Revision 2/);
  click(review,'Close revision review');assert.equal(q(review).hidden,true);
 }finally{app.cleanup();}
});

test('host changes refuse exact review; detached match controls cannot populate the newer view',async()=>{
 const state=fixture(2);let reads=0,fresh=structuredClone(state.entries[0]);
 const app=await mountFixture(state,id=>{assert.equal(id,'a');reads++;return fresh;});
 const {q,controller}=app;
 try{
  const oldControl=q(matches+' [data-match-revision="1"]');
  fresh.revisions[0].goal='Different confirmed revision';
  oldControl.onclick();assert.equal(reads,1);assert.equal(q(review).hidden,true);
  assert.match(q(matches).textContent,/cannot be verified/);assert.doesNotMatch(q(matches).textContent,/Different confirmed revision/);
  controller.setSearch('repeat target');const current=q(matches+' [data-match-revision="1"]');assert.notEqual(current,oldControl);
  fresh=structuredClone(state.entries[0]);oldControl.onclick();assert.equal(reads,1);assert.equal(q(review).hidden,true);
  current.onclick();assert.equal(reads,2);assert.equal(q(review).hidden,false);assert.match(q(review).textContent,/repeat target mark <img src=x>/);
 }finally{app.cleanup();}
});
