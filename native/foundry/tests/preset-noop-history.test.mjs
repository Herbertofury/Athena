import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {parseHTML} from 'linkedom';import {mount} from '../../../dist/workspaces/foundry/index.mjs';import {createLayoutModel} from '../../../dist/workspaces/foundry/layout-state.mjs';
const catalog=JSON.parse(fs.readFileSync(new URL('../../../dist/workspaces/foundry/catalog.json',import.meta.url))),model=createLayoutModel(catalog.themes),shared='instance-00000000-0000-4000-8000-000000000001';
const canonical=value=>JSON.parse(JSON.stringify(model.workspace(value)));
function room(themeIndex,roomIndex,x){const t=catalog.themes[themeIndex],r=model.upgradeBlendModes({...model.initial(t.id),roomId:t.rooms[roomIndex].id});r.placements={[shared]:{...Object.values(r.placements)[0],x,scaleX:-1.2,scaleY:.7,rotation:33,skewX:12,transformOrigin:'br',objectId:t.objects[0].id}};r.environment={...r.environment,target:'object',targetId:shared};return model.validate(r);}
async function setup(stateOverride,saveResult=()=>true){const {document,window}=parseHTML('<html><body><main></main></body></html>');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return [...this.options].find(o=>o.selected)?.value||this.options[0]?.value||''},set(v){for(const o of this.options)o.removeAttribute('selected');[...this.options].find(o=>o.value===v)?.setAttribute('selected','')}});const a=room(0,0,.2),a2=room(0,1,.3),b=room(1,0,.8),state=model.workspace({version:11,active:a,layouts:{[a.roomId]:a,[a2.roomId]:a2,[b.roomId]:b},view:{inspectorDock:'right',inspectorWidth:320},savedLayouts:[]}),writes=[],old=globalThis.fetch;globalThis.fetch=async()=>({ok:true,json:async()=>catalog});const controller=new AbortController();let api;try{api=await mount({container:document.querySelector('main'),signal:controller.signal,state:stateOverride||state,setState:v=>{writes.push(canonical(v));return saveResult(v);},foundryModules:{cinema:false,weather:false,backup:false,soundtrack:false,legacyImport:false,ecology:false,localVideo:false,gizmo:false,environment:false,semanticRoom:false,tones:false,layers:false,canvasView:false,historyKeys:false,objectKeys:false,assetLibrary:false}});}finally{globalThis.fetch=old;}const one=q=>document.querySelector(q),change=(q,v)=>{one(q).value=v;one(q).dispatchEvent(new window.Event('change'));};return{api,document,one,change,writes,a,a2,b,controller};}
test('source-inspired full studio transactions preserve distinct rooms/themes/shared instance UUIDs across complete Undo/Redo',async()=>{const s=await setup(),timeline=[canonical(s.api.exportState())],steps=[];const action=(name,run)=>{const before=s.writes.length;run();assert.equal(s.writes.length,before+1,name+' exactly one save');timeline.push(canonical(s.api.exportState()));steps.push(name);};
 action('edit A1',()=>{s.one('[data-inspect-x]').value='33';s.one('[data-inspect-apply]').click();});
 action('name preset A1',()=>{s.one('[data-preset-name]').value='A room';s.one('[data-preset-save]').click();});
 action('navigate A2',()=>s.change('[data-room-select]',s.a2.roomId));
 action('edit A2 time',()=>s.change('[data-time]','night'));
 action('navigate theme B1',()=>s.change('[data-theme-select]',s.b.themeId));
 action('edit B same UUID',()=>{s.one('[data-inspect-x]').value='66';s.one('[data-inspect-apply]').click();});
 assert.equal(s.api.exportState().layouts[s.a.roomId].placements[shared].x,.33);assert.equal(s.api.exportState().active.placements[shared].objectId,catalog.themes[1].objects[0].id);
 action('name preset B',()=>{s.one('[data-preset-name]').value='B room';s.one('[data-preset-save]').click();});
 action('load preset A across themes',()=>{s.one('[data-preset-select]').value='0';s.one('[data-preset-load]').click();});
 assert.equal(s.api.exportState().active.themeId,s.a.themeId);assert.equal(s.api.exportState().active.placements[shared].x,.33);assert.equal(s.api.exportState().layouts[s.b.roomId].placements[shared].x,.66);
 action('remove B preset',()=>{s.one('[data-preset-select]').value='1';s.one('[data-preset-remove]').click();});
 action('dock layout',()=>s.change('[data-inspector-dock]','left'));
 action('delete A instance retaining reference',()=>s.one('[data-instance-delete]').click());assert.equal(s.api.exportState().active.environment.targetId,shared);
 for(let i=timeline.length-2;i>=0;i--){s.one('[data-undo]').click();assert.deepEqual(canonical(s.api.exportState()),timeline[i],'undo '+steps[i]);}
 assert.equal(s.one('[data-undo]').disabled,true);
 for(let i=1;i<timeline.length;i++){s.one('[data-redo]').click();assert.deepEqual(canonical(s.api.exportState()),timeline[i],'redo '+steps[i-1]);}
 assert.equal(s.one('[data-redo]').disabled,true);s.api.unmount();});
test('editing after Undo truncates future without contaminating another room or preset',async()=>{const s=await setup();s.change('[data-time]','night');s.change('[data-room-select]',s.a2.roomId);s.one('[data-undo]').click();assert.equal(s.api.exportState().active.roomId,s.a.roomId);s.change('[data-time]','dusk');assert.equal(s.one('[data-redo]').disabled,true);assert.equal(s.api.exportState().layouts[s.a2.roomId].time,'day');s.one('[data-undo]').click();assert.equal(s.api.exportState().active.time,'night');s.api.unmount();});
test('opening an identical named layout should not discard an available Redo transaction',async()=>{const s=await setup();try{s.one('[data-preset-name]').value='Same current room';s.one('[data-preset-save]').click();s.change('[data-time]','night');s.one('[data-undo]').click();assert.equal(s.one('[data-redo]').disabled,false);const before=canonical(s.api.exportState()),writes=s.writes.length;s.one('[data-preset-select]').value='0';s.one('[data-preset-load]').click();const after=canonical(s.api.exportState());assert.deepEqual(after,before);const evidence={snapshotUnchanged:true,redoAvailableBefore:true,redoAvailableAfter:!s.one('[data-redo]').disabled,extraHostWrites:s.writes.length-writes,action:'Open named layout equal to current room after undoing time change',sourceRecordHistorySkipsEqualHash:true};assert.equal(evidence.extraHostWrites,0);assert.equal(s.one('[data-redo]').disabled,false,'identical named layout must preserve the undone night-time edit');}finally{s.api.unmount();}});

test('equal-looking legacy layout upgrade is a genuine transaction, not skipped',async()=>{const active=model.initial(),preset=model.upgradeInstances(active),state=model.workspace({version:6,active,layouts:{},view:model.view(),savedLayouts:[{name:'Explicit instances',layout:preset}]});const s=await setup(state);try{s.one('[data-preset-load]').click();assert.equal(s.api.exportState().active.version,6);assert.equal(s.writes.length,1);s.one('[data-undo]').click();assert.deepEqual(canonical(s.api.exportState()),canonical(state));assert.equal(s.api.exportState().active.version,1);}finally{s.api.unmount();}});


test('rename at twenty-layout capacity preserves exact slot, content, selection, Undo/Redo and reload',async()=>{
 const a=room(0,0,.2),b=room(1,0,.8),state=model.workspace({version:11,active:a,layouts:{[a.roomId]:a,[b.roomId]:b},savedLayouts:Array.from({length:20},(_,i)=>({name:'Layout '+i,layout:i%2?b:a}))});
 const s=await setup(state);try{
  s.one('[data-preset-select]').value='7';s.one('[data-preset-name]').value='  Renamed <b>room</b>  ';
  const before=canonical(s.api.exportState()),expected=structuredClone(before);expected.savedLayouts[7].name='Renamed <b>room</b>';
  s.one('[data-preset-rename]').click();assert.deepEqual(canonical(s.api.exportState()),expected);assert.equal(s.writes.length,1);assert.equal(s.one('[data-preset-select]').value,'7');assert.equal(s.one('[data-preset-select]').querySelector('b'),null);
  s.one('[data-undo]').click();assert.deepEqual(canonical(s.api.exportState()),before);s.one('[data-redo]').click();assert.deepEqual(canonical(s.api.exportState()),expected);
  const reopened=await setup(expected);try{assert.deepEqual(canonical(reopened.api.exportState()),expected);assert.equal(reopened.one('[data-preset-select]').options[7].textContent,'Renamed <b>room</b>');}finally{reopened.api.unmount();}
 }finally{s.api.unmount();}
});

test('rename invalid duplicate and unchanged names preserve state, draft inputs, writes and Redo',async()=>{
 const s=await setup();try{
  for(const name of ['First','Second']){s.one('[data-preset-name]').value=name;s.one('[data-preset-save]').click();}
  s.change('[data-time]','night');s.one('[data-undo]').click();s.one('[data-preset-select]').value='0';s.one('[data-inspect-x]').value='37';
  const before=canonical(s.api.exportState()),count=s.writes.length;
  for(const name of ['','   ','Second','x'.repeat(81),' First ']){s.one('[data-preset-name]').value=name;s.one('[data-preset-rename]').click();assert.deepEqual(canonical(s.api.exportState()),before);assert.equal(s.writes.length,count);assert.equal(s.one('[data-redo]').disabled,false);assert.equal(s.one('[data-inspect-x]').value,'37');}
  s.one('[data-redo]').click();assert.equal(s.api.exportState().active.time,'night');
  s.one('[data-preset-name]').value='x'.repeat(80);s.one('[data-preset-rename]').click();assert.equal(s.api.exportState().savedLayouts[0].name,'x'.repeat(80));assert.equal(s.writes.length,count+2);
 }finally{s.api.unmount();}
});

test('rename is disabled without presets and retained controls cannot mutate disposed or aborted mount',async()=>{
 for(const abort of [false,true]){
  const s=await setup();try{
   assert.equal(s.one('[data-preset-rename]').disabled,true);s.one('[data-preset-name]').value='Only';s.one('[data-preset-save]').click();assert.equal(s.one('[data-preset-rename]').disabled,false);
   const button=s.one('[data-preset-rename]'),input=s.one('[data-preset-name]'),before=canonical(s.api.exportState()),count=s.writes.length;
   if(abort)s.controller.abort();else s.api.unmount();input.value='Must not apply';button.click();assert.deepEqual(canonical(s.api.exportState()),before);assert.equal(s.writes.length,count);
  }finally{s.api.unmount();}
 }
});

test('rename keeps recoverable draft and exact Undo after sync or async host storage refusal',async()=>{
 const active=room(0,0,.2),state=model.workspace({version:11,active,layouts:{[active.roomId]:active},savedLayouts:[{name:'Before',layout:active}]});
 for(const pending of [false,true]){
  let resolve;const result=pending?new Promise(r=>resolve=r):false,s=await setup(state,()=>result);
  try{s.one('[data-preset-name]').value='After';s.one('[data-preset-rename]').click();const expected=canonical(state);expected.savedLayouts[0].name='After';assert.deepEqual(canonical(s.api.exportState()),expected);assert.equal(s.one('[data-undo]').disabled,false);assert.equal(s.writes.length,1);
   if(pending){assert.match(s.one('.foundry-status').textContent,/pending/);resolve(false);await new Promise(r=>setImmediate(r));}
   assert.match(s.one('.foundry-status').textContent,/Could not save/);s.one('[data-undo]').click();assert.deepEqual(canonical(s.api.exportState()),canonical(state));
  }finally{s.api.unmount();}
 }
});
