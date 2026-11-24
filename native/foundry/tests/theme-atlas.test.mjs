import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {parseHTML} from 'linkedom';
import {runtimeRoot} from './paths.mjs';
const asset=path.resolve(process.env.ATHENA_THEME_ATLAS_PACKAGE||runtimeRoot,'workspaces/foundry');
const themeId='utopian-scholastic',roomId='utopian-scholastic:room:archive-rotunda',roomName='Archive Rotunda';
async function setup({duplicate=false}={}){
 const catalog=JSON.parse(fs.readFileSync(path.join(asset,'catalog.json'),'utf8'));
 if(duplicate){
  const other=catalog.themes.find(t=>t.id==='vaporwave');
  other.name=catalog.themes.find(t=>t.id===themeId).name;other.rooms[0].name=roomName;
 }
 const {mount}=await import(pathToFileURL(path.join(asset,'index.mjs')).href);
 const {document,window}=parseHTML('<html><body><main></main></body></html>'),select=window.HTMLSelectElement.prototype;
 select.remove=function(i){if(arguments.length)this.options[i]?.remove();else window.HTMLElement.prototype.remove.call(this);};
 select.add=function(option){this.append(option);};
 Object.defineProperty(select,'value',{configurable:true,get(){return [...this.options].find(o=>o.selected)?.value||this.options[0]?.value||'';},set(v){for(const o of this.options)o.removeAttribute('selected');[...this.options].find(o=>o.value===v)?.setAttribute('selected','');}});
 const abort=new AbortController(),reads=[],stored=[],previous={fetch:globalThis.fetch,Option:globalThis.Option};
 globalThis.Option=function(text,value){const o=document.createElement('option');o.textContent=text;o.value=value;return o;};
 globalThis.fetch=async u=>{assert.equal(u.protocol,'file:');const local=fileURLToPath(u);assert.equal(local,path.join(asset,'catalog.json'));reads.push(local);return {ok:true,json:async()=>structuredClone(catalog)};};
 const close=()=>{abort.abort();globalThis.fetch=previous.fetch;if(previous.Option)globalThis.Option=previous.Option;else delete globalThis.Option;};
 let mountResult;
 try{mountResult=await mount({container:document.querySelector('main'),signal:abort.signal,setState:v=>{stored.push(v);return true;},
  nativeStore:{save:()=>assert.fail('atlas must not write native store'),load:()=>assert.fail('atlas must not read native backup')},foundryModules:{cinema:false,weather:false,soundtrack:false,legacyImport:false}});}
 catch(e){close();throw e;}
 const shell=document.querySelector('.foundry-workspace'),q=s=>shell.querySelector(s);
 const dispatch=(e,type)=>e.dispatchEvent(new window.Event(type,{bubbles:true}));
 function open(){
  const view=q('[data-foundry-theme-atlas]');assert.ok(view,'expected separate read-only offline Theme Atlas');
  view.open=true;dispatch(view,'toggle');
  return view;
 }
 function search(query){const input=q('[data-theme-atlas-search]');input.value=query;dispatch(input,'input');}
 function click(s){const e=q(s);assert.ok(e,s);e.click();return e;}
 return {catalog,shell,q,open,search,click,close,dispatch,stored,reads,snapshot:()=>mountResult.exportState()};
}
const findTheme=id=>'[data-theme-atlas-id="'+id+'"]';
const findRoom=id=>'[data-theme-atlas-room-id="'+id+'"]';
test('browse exact inactive theme, named room and catalog objects without switching or saving scene',async()=>{
 const s=await setup();try{
  const before=s.snapshot();assert.equal(before.active.themeId,'frutiger-aero');
  assert.doesNotMatch(s.q('[data-room-select]').textContent,/Archive Rotunda/);
  assert.equal(s.q('[data-theme-atlas-results]').children.length,0,'closed atlas does no discovery rendering');
  const view=s.open();s.search(roomName);
  assert.equal(view.querySelectorAll('[data-theme-atlas-id]').length,1);
  const equivalent=s.q(findTheme(themeId));s.search('  ARCHIVE  ROTUNDA  ');
  assert.equal(s.q(findTheme(themeId)),equivalent,'equivalent filter preserves result nodes');
  const result=s.click(findTheme(themeId));assert.equal(result.getAttribute('aria-pressed'),'true');
  s.click(findRoom(roomId));
  assert.match(s.q('[data-theme-atlas-room-preview]').textContent,/Archive Rotunda/);
  assert.match(s.q('[data-theme-atlas-room-preview]').textContent,new RegExp(roomId));
  const inspected=s.q('[data-theme-atlas-inspect]');
  assert.match(inspected.textContent,/Archive Globe/);assert.match(inspected.textContent,/utopian-scholastic:archive-globe/);
  assert.match(inspected.textContent,/Theme catalog objects, not room placements/);
  assert.match(view.textContent,/Built-in Athena catalog/);
  assert.match(view.textContent,/Author and external availability are not recorded/);
  assert.equal(view.querySelectorAll('a,img,video,iframe').length,0);
  assert.equal(s.q('[data-theme-select]').value,'frutiger-aero');
  assert.deepEqual(s.snapshot(),before);assert.equal(s.stored.length,0);assert.equal(s.reads.length,1);
 }finally{s.close();}
});
test('same-named rooms use exact scoped IDs and filtering never silently changes the inspected choice',async()=>{
 const s=await setup({duplicate:true});try{
  const view=s.open(),foreign='vaporwave:room:food-court-mirage';
  s.search(roomName);assert.equal(view.querySelectorAll('[data-theme-atlas-id]').length,2);
  s.click(findTheme('vaporwave'));s.click(findRoom(foreign));
  assert.match(s.q('[data-theme-atlas-room-preview]').textContent,new RegExp(foreign));
  assert.equal(s.q(findRoom(roomId)),null);
  s.search('No such exact theme fixture');
  assert.match(s.q('[data-theme-atlas-results-state]').textContent,/No matching/);
  assert.match(s.q('[data-theme-atlas-room-preview]').textContent,new RegExp(foreign));
  s.search('Archive Globe');assert.ok(s.q(findTheme(themeId)));
  s.click(findTheme(themeId));s.click(findRoom(roomId));
  assert.match(s.q('[data-theme-atlas-room-preview]').textContent,new RegExp(roomId));
  assert.equal(s.q(findRoom(foreign)),null);assert.equal(s.stored.length,0);assert.equal(s.reads.length,1);
 }finally{s.close();}
});
test('existing native scene chooser alone changes state; active marker remains independent of the inspected room',async()=>{
 const s=await setup();try{
  s.open();s.search(roomName);s.click(findTheme(themeId));s.click(findRoom(roomId));
  assert.match(s.q('[data-theme-atlas-active]').textContent,/frutiger-aero/);
  const theme=s.q('[data-theme-select]');theme.value='vaporwave';s.dispatch(theme,'change');
  assert.equal(s.snapshot().active.themeId,'vaporwave');assert.equal(s.stored.length,1);
  assert.match(s.q('[data-theme-atlas-active]').textContent,/vaporwave/);
  assert.match(s.q('[data-theme-atlas-room-preview]').textContent,new RegExp(roomId));
  const stale=s.q(findRoom(roomId));s.close();stale.click();assert.equal(s.stored.length,1);
 }finally{s.close();}
});
