const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const runtime=require('node:path').resolve(process.env.ATHENA_PORTABLE_TEST_DIST||'dist');
const app=fs.readFileSync(runtime+'/app.js','utf8');
const {createHost}=require(runtime+'/workspace-host.js');
const source=app.slice(app.indexOf('function saveWorkspace('),app.indexOf('// Explicit Projects writes'));
const snapshot=(workspaces,extra={})=>({schema:1,...extra,workspaces});
const key='athena-workspaces-v1';
function storage(initial=null){
 let raw=initial===null?null:JSON.stringify(initial),fault='';
 const writes=[];
 return {writes,raw:()=>raw,replace:value=>{raw=value;},fault:next=>{fault=next;},
  tab(initial=snapshot({})){
   const h={workspaceStore:structuredClone(initial),toastMessages:[],toast(message){h.toastMessages.push(message);},localStorage:{
    getItem(k){assert.equal(k,key);if(fault==='read')throw Error('read failed');return raw;},
    setItem(k,value){assert.equal(k,key);if(fault==='quota')throw Error('quota');writes.push(value);if(fault!=='unconfirmed')raw=value;}
   }};
   vm.runInNewContext(source,h);
   const writeScope=id=>h.createWorkspaceWriteScope?.(id)??{read:()=>h.workspaceStore.workspaces[id],save:value=>h.saveWorkspace(id,value)};
   function mount(id){const scope=writeScope(id);return {state:scope.read(),save:scope.save};}
   return {h,mount,writeScope};
  }};
}
test('generic workspace saves acknowledge confirmed storage only and keep an invalid request out of the draft',()=>{
 const db=storage(),tab=db.tab(),foundry=tab.mount('build');
 assert.equal(foundry.save({test:1}),true);
 assert.equal(foundry.save({test:2}),true);
 assert.equal(foundry.save(null),false);
 assert.equal(foundry.save({v:'x'.repeat(250001)}),false);
 assert.equal(tab.mount('build').state.test,2);
 assert.equal(db.writes.length,2);
 assert.equal(JSON.parse(db.raw()).workspaces.build.test,2);
});
test('an older generic workspace teardown preserves newer Projects, Continuity history and unrelated metadata',async()=>{
 const initial=snapshot({software:{filters:{q:''}}},{unknown:['old']});
 const db=storage(initial),tab=db.tab(initial),scope=tab.writeScope('software');
 const exported={filters:{q:'retained selection'},selected:['fixture']};
 const host=createHost({load:async()=>({mount:({state})=>{
  assert.equal(state.filters.q,'');return {unmount(){},exportState:()=>exported};
 }})});
 assert.equal(await host.open('software',{}, {getState:scope.read,setState:scope.save}),true);
 const latest=snapshot({...initial.workspaces,projects:{schema:1,entries:[{id:'new-project',revisions:[{fixture:1},{fixture:2}]}]},continuity:{schema:2,entries:[{id:'new-note',history:[{fixture:'reviewed'}]}]}},{unknown:['preserve']});
 db.replace(JSON.stringify(latest));
 await host.clear();
 assert.equal(db.writes.length,1);
 assert.deepEqual(JSON.parse(db.raw()),{...latest,workspaces:{...latest.workspaces,software:exported}});
 assert.equal(tab.mount('continuity').state.entries[0].id,'new-note');
});
test('same-workspace changes refuse stale mounted snapshots even if a different save refreshed the tab cache',()=>{
 const initial=snapshot({build:{name:'original'}}),db=storage(initial),tab=db.tab(initial),old=tab.mount('build');
 const winner=snapshot({build:{name:'newer saved work'}});
 db.replace(JSON.stringify(winner));
 assert.equal(tab.mount('software').save({filters:{q:'same tab unrelated settings'}}),true);
 const before=db.raw();
 assert.equal(old.save({name:'stale draft'}),false);
 assert.equal(db.raw(),before);
 assert.equal(db.writes.length,1);
 assert.match(tab.h.toastMessages.at(-1),/saved workspace changed.*export/i);
 const reopened=tab.mount('build');
 assert.equal(reopened.state.name,'stale draft');
 assert.equal(reopened.save({name:'edited stale draft'}),false,'remounting a draft cannot silently rebase it');
 assert.equal(db.raw(),before);
 assert.deepEqual(JSON.parse(JSON.stringify(tab.h.workspaceStore.workspaces.build)),winner.workspaces.build);
});
test('read errors, corrupt envelopes, quota and unconfirmed readback preserve durable bytes and only retain a tab draft',()=>{
 const initial=snapshot({build:{name:'original'}}),db=storage(initial),tab=db.tab(initial),foundry=tab.mount('build');
 for(const fault of ['read','quota','unconfirmed']){
  db.fault(fault);assert.equal(foundry.save({name:fault}),false);
  assert.equal(db.raw(),JSON.stringify(initial));assert.equal(tab.mount('build').state.name,fault);
  assert.equal(tab.h.workspaceStore.workspaces.build.name,'original');
 }
 db.fault('');
 for(const malformed of ['', '{unrecoverable through JSON', '{"schema":2,"workspaces":{}}','{"schema":1,"workspaces":[]}']){
  db.replace(malformed);assert.equal(foundry.save({name:'recovery copy'}),false);
  assert.equal(db.raw(),malformed);assert.equal(tab.mount('build').state.name,'recovery copy');
  assert.match(tab.h.toastMessages.at(-1),/original data for recovery/);
  assert.doesNotMatch(tab.h.toastMessages.at(-1),/unrecoverable through JSON/);
 }
 db.replace(JSON.stringify(initial));
 const retry=tab.mount('build');
 assert.equal(retry.save(retry.state),true);
 assert.equal(JSON.parse(db.raw()).workspaces.build.name,'recovery copy');
 assert.equal(tab.mount('build').state.name,'recovery copy');
});
