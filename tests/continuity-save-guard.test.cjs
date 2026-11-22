const {test}=require('node:test'),assert=require('node:assert/strict'),{readFileSync}=require('node:fs'),vm=require('node:vm'),{parseHTML}=require('linkedom');
const app=readFileSync(require('node:path').join(__dirname,'../dist/app.js'),'utf8');
const saveHelpers=app.slice(app.indexOf('function saveWorkspace('),app.indexOf('function routeParts('));
const snapshot=(workspaces,extra={})=>({schema:1,...extra,workspaces});
const continuity=(id,schema=2)=>({schema,entries:id?[{id,project:'Fixture',kind:'decision',pinned:false,ignored:false,revisions:[{text:'Original',source:'',at:1}],history:[]}]:[]});
function shared(initial){
 let raw=initial===null?null:JSON.stringify(initial), writes=0, fault='';
 const storage={getItem:()=>raw,setItem(_key,value){
  if(fault==='quota')throw Error('fixture quota failure');
  writes++;
  if(fault!=='unconfirmed')raw=value;
 }};
 return {read:()=>raw,writes:()=>writes,setRaw:value=>{raw=value;},fault:kind=>{fault=kind;},tab(initial){
  const host={workspaceStore:structuredClone(initial),localStorage:storage,toast(){}};
  vm.runInNewContext(saveHelpers,host);
  return {host,projects:(next,expected)=>host.saveReviewedProjectBackup(next,JSON.stringify(expected),true),
   continuity:(next,expected)=>host.saveReviewedContinuity?host.saveReviewedContinuity(next,JSON.stringify(expected)??''):host.saveWorkspace('continuity',next)};
 }};
}
test('older Continuity tab preserves a newly saved project and latest unrelated metadata',()=>{
 const original=continuity('original',1), initial=snapshot({continuity:original},{fixtureUnknown:'original'}), db=shared(initial);
 const a=db.tab(initial),b=db.tab(initial);
 const projectData={schema:1,entries:[{id:'newer-project'}],unknown:['preserved']};
 assert.equal(a.projects(projectData,{schema:1,entries:[]}),true);
 const newer=JSON.parse(db.read());newer.fixtureUnknown='updated';newer.workspaces.research={fixture:'untouched'};
 db.setRaw(JSON.stringify(newer));
 const note=continuity('second');
 assert.equal(b.continuity(note,original),true);
 assert.deepEqual(JSON.parse(db.read()),{...newer,workspaces:{...newer.workspaces,continuity:note}});
 assert.equal(db.writes(),2);
});
test('same-Continuity stale, corrupt storage and uncertain readback never claim success or promote the host cache',()=>{
 const original=continuity('original'), initial=snapshot({continuity:original}), db=shared(initial);
 const older=db.tab(initial),newer=db.tab(initial);
 assert.equal(newer.continuity(continuity('winner'),original),true);
 const won=db.read(),writes=db.writes();
 assert.throws(()=>older.continuity(continuity('stale'),original),{code:'CONTINUITY_WRITE_CONFLICT'});
 assert.equal(db.writes(),writes);assert.equal(db.read(),won);
 assert.deepEqual(older.host.workspaceStore,initial);
 for(const corrupt of ['{not-json','{"schema":1,"workspaces":null}']){
  db.setRaw(corrupt);assert.throws(()=>older.continuity(continuity('candidate'),original));
  assert.equal(db.writes(),writes);assert.equal(db.read(),corrupt);assert.deepEqual(older.host.workspaceStore,initial);
 }
 db.setRaw(JSON.stringify(initial));
 db.fault('quota');assert.throws(()=>older.continuity(continuity('quota'),original));
 assert.equal(db.writes(),writes);assert.deepEqual(older.host.workspaceStore,initial);
 db.fault('unconfirmed');assert.throws(()=>older.continuity(continuity('uncertain'),original));
 assert.deepEqual(older.host.workspaceStore,initial);
 db.fault('');assert.equal(older.continuity(continuity('confirmed'),original),true);
 assert.equal(JSON.parse(db.read()).workspaces.continuity.entries[0].id,'confirmed');
});
test('missing Continuity baseline accepts one deliberate save and Projects inverse order preserves it',()=>{
 const initial=snapshot({}),db=shared(null),projects=db.tab(initial),notes=db.tab(initial);
 assert.equal(notes.continuity(continuity('first'),undefined),true);
 const projectData={schema:1,entries:[{id:'new-project'}]};
 assert.equal(projects.projects(projectData,{schema:1,entries:[]}),true);
 assert.deepEqual(JSON.parse(db.read()).workspaces,{projects:projectData,continuity:continuity('first')});
});
test('ordinary Continuity edit keeps raw legacy comparison base and a failed draft exportable',async()=>{
 const {document}=parseHTML('<html><body><section></section></body></html>'); global.document=document;
 const proto=Object.getPrototypeOf(document.createElement('select'));Object.defineProperty(proto,'value',{configurable:true,get(){return this._value||'';},set(v){this._value=v;}});
 const {mount}=await import('../dist/workspaces/continuity/index.mjs');
 const container=document.querySelector('section'), prior=continuity('old',1),calls=[];
 const view=mount({container,state:prior,setState(data,options){
  calls.push({data,options});if(calls.length===1)throw Object.assign(Error('test stale copy'),{code:'CONTINUITY_WRITE_CONFLICT'});
  return true;
 }});
 let draft;const create=URL.createObjectURL,revoke=URL.revokeObjectURL;
 URL.createObjectURL=b=>{draft=b;return 'blob:fixture';};URL.revokeObjectURL=()=>{};
 try{
  const root=container.shadowRoot,form=root.querySelector('form'),p=Object.fromEntries([...form.querySelectorAll('[name]')].map(e=>[e.getAttribute('name'),e]));
  Object.defineProperty(form,'elements',{value:p});Object.defineProperty(form,'reset',{value(){}});
  p.project.value='Fixture';p.kind.value='decision';p.text.value='New local note';p.source.value='';
  form.onsubmit({preventDefault(){}});
  assert.equal(calls[0].options?.reviewedContinuityWrite,JSON.stringify(prior));
  assert.match(root.querySelector('#notice').textContent,/Saved Continuity changed.*export the local draft/i);
  root.querySelector('#export').onclick();
  assert.match(await draft.text(),/New local note/);
  root.querySelector('#entries').onclick({target:root.querySelector('[data-action="pin"]')});
  assert.equal(calls[1].options.reviewedContinuityWrite,JSON.stringify(prior));
  assert.match(root.querySelector('#notice').textContent,/Saved in this browser/);
  root.querySelector('#entries').onclick({target:root.querySelector('[data-action="pin"]')});
  assert.equal(calls[2].options.reviewedContinuityWrite,JSON.stringify(calls[1].data));
 }finally{URL.createObjectURL=create;URL.revokeObjectURL=revoke;view.unmount();}
});
