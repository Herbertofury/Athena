import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseHTML} from 'linkedom';
import {authoredObjectRoute,mount} from '../../../dist/workspaces/foundry/index.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../../../dist/workspaces/foundry/catalog.json',import.meta.url)));
test('source route precedence matches the original for all 85 object IDs',()=>{
 const original=JSON.parse(fs.readFileSync(new URL('../../../feature-foundry/source/src/data/theme-world-packages.json',import.meta.url)));
 const expected=new Map(original.flatMap(t=>t.objects.map(o=>[o.id,
  o.affordances.some(v=>v.includes('screen')||v.includes('video'))?'localVideo':
  o.affordances.some(v=>v.includes('music')||v.includes('note'))?'soundtrack':'ecology'])));
 const actual=catalog.themes.flatMap(t=>t.objects);
 assert.equal(actual.length,85);
 for(const object of actual)assert.equal(authoredObjectRoute(object),expected.get(object.id),object.id);
 assert.deepEqual(Object.fromEntries(['localVideo','soundtrack','ecology'].map(k=>[k,actual.filter(o=>authoredObjectRoute(o)===k).length])),{localVideo:16,soundtrack:8,ecology:61});
 assert.equal(authoredObjectRoute({sourceLabels:{affordances:['play-note','switch-video']}}),'localVideo');
 assert.equal(authoredObjectRoute({}),null);
});
test('mount focuses exactly the selected local controls without writes or media playback',async()=>{
 const {document,window}=parseHTML('<main></main>');
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,
  get(){return [...this.options].find(o=>o.selected)?.value||this.options[0]?.value||''},
  set(v){for(const o of this.options)o.removeAttribute('selected');[...this.options].find(o=>o.value===v)?.setAttribute('selected','')}});
 const before=globalThis.fetch,controller=new AbortController(),writes=[],remote=[],visits=[];
 globalThis.fetch=async url=>{remote.push(String(url));return {ok:true,json:async()=>catalog};};
 const off={cinema:false,weather:false,backup:false,legacyImport:false,localImage:false,environment:false,semanticRoom:false,tones:false,layers:false,canvasView:false,historyKeys:false,objectKeys:false,gizmo:false};
 try{
  const dom=document.querySelector('main'),a=await mount({container:dom,signal:controller.signal,setState:v=>writes.push(v),foundryModules:off});
  for(const route of ['localVideo','soundtrack','ecology']){
   const head=document.querySelector('[data-foundry-module="'+route+'"] h2');head.focus=()=>visits.push(route);head.scrollIntoView=()=>{};
  }
  const choose=document.querySelector('[data-inspect-object]'),act=document.querySelector('[data-object-source-action]');
  const select=o=>{choose.value=o.id;choose.dispatchEvent(new window.Event('change'));};
  const initial=JSON.stringify(a.exportState());
  for(const route of ['ecology','localVideo','soundtrack']){
   const theme=catalog.themes.find(t=>t.objects.some(o=>authoredObjectRoute(o)===route));
   if(theme.id!==catalog.themes[0].id)continue; // This test preserves one room; Chromium separately checks music.
   select(theme.objects.find(o=>authoredObjectRoute(o)===route));
   assert.equal(act.disabled,false);act.click();
  }
  assert.deepEqual(visits,['ecology','localVideo']);
  assert.equal(JSON.stringify(a.exportState()),initial);assert.equal(writes.length,0);
  a.setSearch('no-matching-target-visible');assert.equal(act.disabled,true);
  act.dispatchEvent(new window.Event('click'));assert.equal(visits.length,2);
  assert.equal(document.querySelectorAll('video,audio,iframe').length,0);
  assert.equal(remote.length,1);
  a.unmount();act.dispatchEvent(new window.Event('click'));assert.equal(visits.length,2);
  const b=await mount({container:dom,signal:new AbortController().signal,setState:v=>writes.push(v),foundryModules:{...off,localVideo:false}});
  const choose2=document.querySelector('[data-inspect-object]');choose2.value=catalog.themes[0].objects[1].id;
  choose2.dispatchEvent(new window.Event('change'));
  assert.equal(document.querySelector('[data-object-source-action]').disabled,true);b.unmount();
 }finally{globalThis.fetch=before;controller.abort();}
});
