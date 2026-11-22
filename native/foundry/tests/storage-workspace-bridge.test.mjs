import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn,execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {binaryPath,pythonCommand,runtimeRoot,repoRoot,testTemp} from './paths.mjs';
import {mount} from '../../../dist/workspaces/storage/index.mjs';

const require=createRequire(new URL('../../../package.json',import.meta.url)),{parseHTML}=require('linkedom');
const ready=child=>new Promise((resolve,reject)=>{
 let buf='';const timer=setTimeout(()=>reject(Error('Native bridge startup timeout')),10000);
 child.once('exit',()=>{clearTimeout(timer);reject(Error('Native bridge exited'));});
 child.once('error',error=>{clearTimeout(timer);reject(error);});
 child.stdout.on('data',data=>{buf+=data;if(buf.includes('\n')){clearTimeout(timer);resolve(new URL(buf.split('\n')[0]).origin);}});
});
const defaultFixture={schema:'athena-storage-observation-v1',platform:'linux',observedAt:'2026-11-21T00:00:00Z',partial:false,
 stops:{entryLimit:0,depthLimit:0,deadline:0,unreadable:0,changed:0},skipped:{links:1,mounts:0,special:0},
 totals:{logicalBytes:4208306,allocatedBytes:12288,files:3,physicalFiles:2},categories:[
  {name:'Media',logicalBytes:4201305,allocatedBytes:4096,files:2},
  {name:'Source',logicalBytes:7001,allocatedBytes:0,files:1},
  {name:'Shared across categories',logicalBytes:0,allocatedBytes:8192,files:0}]};
const tick=()=>new Promise(setImmediate);

test('real native bridge serves the main Storage route, imports an observation without API or database changes',async()=>{
 const tmp=fs.mkdtempSync(testTemp('athena-storage-workspace-')),db=path.join(tmp,'native.sqlite');
 const checkedRuntime=process.env.ATHENA_TEST_STORAGE_RUNTIME||runtimeRoot;
 const commands=path.join(repoRoot,'native','foundry','bridge.py');execFileSync(binaryPath,['init',db]);
 const baseline=fs.readFileSync(db);
 const child=spawn(pythonCommand,[commands,'--binary',binaryPath,'--database',db,'--runtime',checkedRuntime],{stdio:['ignore','pipe','pipe']});
 const exited=new Promise(r=>child.once('exit',r)),originalFetch=globalThis.fetch;
 try{
  const origin=await ready(child),read=async f=>{
   const res=await originalFetch(new URL(f,origin));assert.equal(res.status,200);return await res.text();
  };
  const paths=['workspaces/storage/index.mjs','workspaces/storage/style.css','workspaces/storage/model.mjs'];
  for(const asset of paths) assert.equal(await read('/'+asset),fs.readFileSync(path.join(checkedRuntime,asset),'utf8'));
  for(const unsanctioned of ['/__native/storage','/__native/storage-scan','/workspaces/storage/measure.py','/native.sqlite'])assert.equal((await originalFetch(new URL(unsanctioned,origin),{headers:{'X-Athena-Native':'1'}})).status,404);
  const shell=await read('/');assert.match(shell,/href="#storage"/);
  const {window,document}=parseHTML(shell);const requests=[];
  window.AbortController=AbortController;window.URL=URL;window.URLSearchParams=URLSearchParams;window.Blob=Blob;
  window.location=new URL('/#storage',origin);window.history={replaceState:(_a,_b,value)=>window.location.hash=value};
  const writes=[];window.localStorage={getItem:()=>null,setItem:(...args)=>writes.push(args)};
  window.confirm=()=>true;window.setTimeout=()=>1;window.clearTimeout=()=>{};window.HTMLElement.prototype.focus=function(){};
  window.document.querySelector('#search').value='';
  window.fetch=(...a)=>{requests.push(a);throw Error('The app must not send an observation to the native host.');};
  window.AthenaWorkspaceLoaders={storage:async()=>({mount})};
  const dialog=window.document.querySelector('dialog');dialog.showModal=()=>{dialog.open=true;};dialog.close=()=>{dialog.open=false;dialog.dispatchEvent(new window.Event('close'));};
  const ctx=vm.createContext(window);for(const name of ['catalog.js','core.js','workspace-host.js','native-store-bootstrap.js','app.js'])vm.runInContext(await read('/'+name),ctx);
  await tick();await tick();const host=document.querySelector('.workspace-container')?.shadowRoot;assert.ok(host);
  const input=host.querySelector('input');
  const text=process.env.ATHENA_STORAGE_ACCEPTANCE_REPORT?fs.readFileSync(process.env.ATHENA_STORAGE_ACCEPTANCE_REPORT,'utf8'):JSON.stringify(defaultFixture);
  input.files=[{size:Buffer.byteLength(text),text:async()=>text}];await input.onchange();
  assert.match(host.querySelector('#evidence').textContent,/12 KiB.*3 pathnames \/ 2 unique files/);
  assert.match(host.querySelector('#status').textContent,/unverified/);
  assert.equal(host.querySelector('.coverage').dataset.state,'no-stops');
  const evidenceFile=process.env.ATHENA_STORAGE_COVERAGE_FIXTURES;
  if(evidenceFile){
   const cases=JSON.parse(fs.readFileSync(evidenceFile,'utf8'));
   for(const [name,report] of Object.entries(cases)){
    const source=JSON.stringify(report);
    input.files=[{size:Buffer.byteLength(source),text:async()=>source}];await input.onchange();
    const coverage=host.querySelector('.coverage');
    assert.equal(coverage.dataset.state,report.partial?'partial':'no-stops',name);
    if(name==='inaccessible')assert.match(coverage.textContent,/unreadable entries.*does not mean the folder is empty/);
    if(name==='capped')assert.match(coverage.textContent,/entry limit.*do not cover the whole selected folder/);
    if(name==='late-final-entry')assert.match(coverage.textContent,/time limit.*do not cover the whole selected folder/);
   }
  }
  if(process.env.ATHENA_COMPARE_SYNTHETIC_REPORTS){
   const pair=JSON.parse(fs.readFileSync(process.env.ATHENA_COMPARE_SYNTHETIC_REPORTS,'utf8'));
   const q=s=>host.querySelector(s),secondary=q('#comparison-file'),check=q('#compare-same');
   assert.ok(secondary&&check,'second-report UI not present on this exact route');
   const bytes=observation=>JSON.stringify(observation);
   const chosen=(field,t,reader)=>{field.files=[{size:Buffer.byteLength(t),text:reader??(async()=>t),name:'secret-leaf-native-file.json'}];return field.onchange();};
   const values=()=>q('#comparison-values').textContent, metrics=()=>q('#compare-metrics').textContent;
   const hint=()=>q('#comparison-guidance').textContent;
   const assent=()=>{check.checked=true;check.onchange();};
   await chosen(input,bytes(pair.reference));
   const safeLater={...pair.second,root:'/private/secret-leaf-native',categories:pair.second.categories.map((v,i)=>({...v,name:'secret-leaf-category-'+i}))};
   await chosen(secondary,bytes(safeLater));
   assert.match(values(),/Reference.*Second observation/);assert.match(values(),/No traversal stops reported/);
   assert.doesNotMatch(q('#comparison-result').textContent,/secret-leaf|\/private\//);
   assert.match(hint(),/category configurations differ/);assert.equal(check.disabled,true);
   const comparableLater={...pair.second,root:'/private/secret-leaf-native'};
   await chosen(secondary,bytes(comparableLater));
   assert.doesNotMatch(q('#comparison-result').textContent,/secret-leaf|\/private\//);
   assert.equal(check.disabled,false);assert.equal(check.checked,false);
   assert.equal(metrics(),'');assert.match(hint(),/Only confirm/);
   assent();
   for(const number of Object.values(pair.expected))assert.ok(metrics().includes('+'+number.toLocaleString()));
   assert.match(hint(),/reports cannot verify it.*not free or reclaimable/);
   let finish;
   const slow=chosen(secondary,bytes(comparableLater),()=>new Promise(done=>finish=done));
   assert.equal(metrics(),'');assert.equal(check.checked,false);assert.equal(check.disabled,true);
   const later=bytes(pair.capped);
   await chosen(secondary,later);
   assert.match(values(),/entry limit \(1\)/);assert.match(values(),/20,000 pathnames/);
   finish(bytes(comparableLater));await slow;
   assert.match(values(),/entry limit \(1\)/);assert.match(hint(),/observed values only/);
   assert.equal(check.disabled,true);assent();assert.equal(metrics(),'');
   await chosen(secondary,bytes(pair.denied));assert.match(values(),/unreadable entries \(1\).*0 pathnames/);
   assert.equal(metrics(),'');assert.equal(check.disabled,true);
   await chosen(secondary,bytes(pair.exclude));assert.match(hint(),/exclusion counts differ/);
   await chosen(secondary,bytes(pair.reference));assert.match(hint(),/dated later/);
   await chosen(secondary,bytes(comparableLater));assent();assert.notEqual(metrics(),'');
   const previous=values();
   for(const invalid of ['not JSON',bytes({...comparableLater,schema:'future-v2'}),bytes({...comparableLater,totals:{...comparableLater.totals,logicalBytes:42}})]){
    await chosen(secondary,invalid);
    assert.match(q('#compare-status').textContent,/refused.*preserved/i);
    assert.equal(values(),previous);assert.equal(check.checked,false);assert.equal(metrics(),'');
    assent();assert.notEqual(metrics(),'');
   }
   await chosen(input,bytes(pair.denied));assert.equal(check.disabled,true);assert.equal(metrics(),'');
   await chosen(input,bytes(pair.reference));assert.equal(check.disabled,false);assert.equal(metrics(),'');
   const beforeClear=chosen(secondary,bytes(comparableLater),()=>new Promise(done=>finish=done));
   q('#clear-comparison').onclick();finish(bytes(comparableLater));await beforeClear;
   assert.equal(q('#comparison-result').hidden,true);assert.equal(metrics(),'');
   await chosen(secondary,bytes(comparableLater));assent();assert.notEqual(metrics(),'');
   const beforeClose=chosen(secondary,bytes(comparableLater),()=>new Promise(done=>finish=done));
   window.location.hash='#certificates';window.dispatchEvent(new window.Event('hashchange'));await tick();await tick();
   finish(bytes(comparableLater));await beforeClose;assert.equal(host.childNodes.length,0);
   window.location.hash='#storage';window.dispatchEvent(new window.Event('hashchange'));await tick();await tick();
   const reopened=document.querySelector('.workspace-container')?.shadowRoot;
   assert.ok(reopened);assert.equal(reopened.querySelector('#comparison-result').hidden,true);
  }
  assert.deepEqual(requests,[]);assert.deepEqual(writes,[]);
  assert.deepEqual(fs.readFileSync(db),baseline);
 }finally{globalThis.fetch=originalFetch;child.kill('SIGTERM');await exited;fs.rmSync(tmp,{recursive:true,force:true});}
});
