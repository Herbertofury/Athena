const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync('dist/app.js','utf8');
const source=app.slice(app.indexOf('const workspaceDrafts='),app.indexOf('function routeParts('));
function host(fail=false){
 const state={workspaceStore:{schema:1,workspaces:{}},toastMessages:[],writes:[]};
 let raw=null;
 state.toast=m=>state.toastMessages.push(m);
 state.localStorage={getItem:()=>raw,setItem:(key,value)=>{
  if(fail)throw Error('quota');
  state.writes.push([key,value]);raw=value;
 }};
 vm.createContext(state);vm.runInContext(source,state);
 state.draft=id=>vm.runInContext('workspaceDrafts.get('+JSON.stringify(id)+')',state);
 return state;
}
test('workspace host acknowledges completed storage write',()=>{const h=host();assert.equal(h.saveWorkspace('foundry',{test:1}),true);assert.equal(h.writes.length,1);assert.equal(h.draft('foundry'),undefined);assert.equal(h.workspaceStore.workspaces.foundry.test,1);});
test('workspace host rejects quota failure without hiding draft',()=>{const h=host(true);assert.equal(h.saveWorkspace('foundry',{test:1}),false);assert.equal(h.draft('foundry').test,1);assert.equal(h.workspaceStore.workspaces.foundry,undefined);assert.match(h.toastMessages[0],/not saved/);});
test('invalid and overbudget settings cannot report success',()=>{const h=host();assert.equal(h.saveWorkspace('foundry',null),false);assert.equal(h.saveWorkspace('foundry',{v:'x'.repeat(250001)}),false);assert.equal(h.writes.length,0);});
