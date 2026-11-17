import {repoRoot,runtimeRoot,binaryPath,testTemp} from './paths.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import fs from 'node:fs';
import {attachNativeBackup} from '../../../dist/workspaces/foundry/native-backup.mjs';import {createLayoutModel} from '../../../dist/workspaces/foundry/layout-state.mjs';
const require=createRequire(new URL('../../../package.json',import.meta.url));const {parseHTML}=require('linkedom');
const themes=JSON.parse(fs.readFileSync(new URL('../../../dist/workspaces/foundry/catalog.json',import.meta.url))).themes,model=createLayoutModel(themes),fixture=model.workspace({version:1,active:model.initial(),layouts:{}});const tick=()=>new Promise(r=>setImmediate(r));
function setup(nativeStore){const {document}=parseHTML('<html><body><section></section></body></html>');const host=document.querySelector('section'),abort=new AbortController();let revision=0,replaced=[];const controller=attachNativeBackup({host,nativeStore,model,snapshot:()=>fixture,replace:v=>replaced.push(v),getRevision:()=>revision,signal:abort.signal});return {host,abort,controller,replaced,edit(){revision++},click(q){host.querySelector(q).click()},status(){return host.querySelector('[data-native-status]')?.textContent}};}
test('unconnected adapter does not probe or break browser authoring',()=>{const s=setup();assert.match(s.status(),/Not connected/);assert.equal(s.host.querySelector('[data-native-save]').disabled,true);s.controller.dispose();});
test('explicit full-workspace save and restore only, repeated clicks fenced',async()=>{let writes=[],resolve;const s=setup({save:async t=>{writes.push(t);await new Promise(r=>resolve=r)},load:async()=>JSON.stringify(fixture)});assert.equal(writes.length,0);s.click('[data-native-save]');s.click('[data-native-save]');assert.equal(writes.length,1);assert.deepEqual(JSON.parse(writes[0]),JSON.parse(JSON.stringify(fixture)));resolve();await tick();assert.match(s.status(),/saved/);s.click('[data-native-load]');await tick();assert.equal(s.replaced.length,1);s.controller.dispose();});
test('newer edit fences delayed native restore and invalid backup never applies',async()=>{let resolve;const s=setup({save:async()=>{},load:()=>new Promise(r=>resolve=r)});s.click('[data-native-load]');s.edit();resolve(JSON.stringify(fixture));await tick();assert.equal(s.replaced.length,0);assert.match(s.status(),/changed while loading/);s.click('[data-native-load]');resolve('{"version":9}');await tick();assert.equal(s.replaced.length,0);assert.match(s.status(),/failed/);s.controller.dispose();});
test('navigation abort fences late completion and leaves no active UI',async()=>{let resolve,signal;const s=setup({save:async()=>{},load:opts=>{signal=opts.signal;return new Promise(r=>resolve=r)}});s.click('[data-native-load]');s.abort.abort();assert.equal(signal.aborted,true);resolve(JSON.stringify(fixture));await tick();assert.equal(s.replaced.length,0);assert.equal(s.host.childNodes.length,0);});
test('save and load failures retain controls for retry; empty store does not replace',async()=>{let fail=true;const s=setup({save:async()=>{if(fail)throw Error('write failed')},load:async()=>{if(fail)throw Error('read failed');return null}});s.click('[data-native-save]');await tick();assert.match(s.status(),/save failed/);assert.equal(s.host.querySelector('[data-native-save]').disabled,false);s.click('[data-native-load]');await tick();assert.match(s.status(),/load failed/);assert.equal(s.replaced.length,0);fail=false;s.click('[data-native-load]');await tick();assert.match(s.status(),/No native backup/);assert.equal(s.replaced.length,0);s.controller.dispose();});
test('edits during save produce captured-snapshot notice, not false current-save claim',async()=>{let resolve;const s=setup({save:()=>new Promise(r=>resolve=r),load:async()=>null});s.click('[data-native-save]');s.edit();resolve();await tick();assert.match(s.status(),/Newer browser edits are not yet saved/);s.controller.dispose();});

test('conflict is actionable and never replaces browser edits',async()=>{const e=Error('Restore and review first');e.code='NATIVE_CONFLICT';const s=setup({save:async()=>{throw e},load:async()=>null});s.click('[data-native-save]');await tick();assert.match(s.status(),/Save conflict.*Restore and review/);assert.equal(s.replaced.length,0);s.controller.dispose();});
test('stale or invalid restore never acknowledges native version',async()=>{let resolve,accepted=0;const s=setup({save:async()=>{},load:()=>new Promise(r=>resolve=r),acceptLoad:()=>accepted++});s.click('[data-native-load]');s.edit();resolve(JSON.stringify(fixture));await tick();assert.equal(accepted,0);s.click('[data-native-load]');resolve('invalid');await tick();assert.equal(accepted,0);s.click('[data-native-load]');resolve(JSON.stringify(fixture));await tick();assert.equal(accepted,1);s.controller.dispose();});
test('history failure and delayed recovery do not replace newer edits',async()=>{let resolve,writes=0;const s=setup({save:async()=>writes++,load:async()=>null,revisions:async()=>[{id:1,event:'save',source_revision:null}],restoreRevision:async()=>{writes++;return JSON.stringify(fixture)},readRevision:()=>new Promise(r=>resolve=r)});s.click('[data-native-history]');await tick();s.host.querySelector('option').selected=true;s.click('[data-native-recover]');s.edit();resolve(JSON.stringify(fixture));await tick();assert.equal(writes,0);assert.equal(s.replaced.length,0);assert.match(s.status(),/changed while reading/);s.controller.dispose();});
test('newer edits during recovery save are retained and truthfully distinguished',async()=>{let resolve;const s=setup({save:()=>new Promise(r=>resolve=r),load:async()=>null,revisions:async()=>[{id:1,event:'save',source_revision:null}],restoreRevision:()=>new Promise(r=>resolve=r),readRevision:async()=>JSON.stringify(fixture)});s.click('[data-native-history]');await tick();s.host.querySelector('option').selected=true;s.click('[data-native-recover]');await tick();s.edit();resolve(JSON.stringify(fixture));await tick();assert.equal(s.replaced.length,0);assert.match(s.status(),/saved to native storage.*browser edits were retained/);s.controller.dispose();});

// Mutable authoring state deliberately independent of nativeStore calls.
function comparisonSetup(overrides={}){
 const {document}=parseHTML('<html><body><section></section></body></html>'),host=document.querySelector('section'),abort=new AbortController(),calls=[];
 let current=model.parseWorkspace(model.encodeWorkspace(fixture)),revision=0;
 const store={save:async text=>{calls.push(['save',text]);},load:async()=>{calls.push(['load']);return model.encodeWorkspace(fixture);},revisions:async()=>{calls.push(['history']);return [{id:1,event:'save'}];},readRevision:async()=>{calls.push(['readRevision']);return model.encodeWorkspace(fixture);},restoreRevision:async()=>{calls.push(['restoreRevision']);return model.encodeWorkspace(fixture);},...overrides};
 const controller=attachNativeBackup({host,nativeStore:store,model,snapshot:()=>current,replace:value=>{current=value;revision++;},getRevision:()=>revision,signal:abort.signal});
 return {host,abort,controller,calls,store,click(selector){host.querySelector(selector).click();},label(){return host.querySelector('[data-native-comparison]')?.textContent;},status(){return host.querySelector('[data-native-status]')?.textContent;},edit(time){current=model.parseWorkspace(model.encodeWorkspace(current));current.active.time=time;revision++;controller.update();},invalid(){current={version:999};revision++;controller.update();},state(){return current;}};
}

test('native comparison unknown to match to different to match requires no implicit native calls',async()=>{
 const s=comparisonSetup();try{
  assert.match(s.label(),/unknown/);assert.deepEqual(s.calls,[]);s.controller.update();assert.deepEqual(s.calls,[]);
  s.click('[data-native-save]');await tick();assert.match(s.label(),/matches the last verified/);assert.equal(s.calls.length,1);const status=s.status();
  s.edit('night');assert.match(s.label(),/differs from the last verified/);assert.equal(s.status(),status);
  s.edit('day');assert.match(s.label(),/matches the last verified/);assert.equal(s.calls.length,1);
 }finally{s.controller.dispose();}
});

test('pending native save compares captured snapshot against newer edits on completion',async()=>{
 let finish,captured;const s=comparisonSetup({save:text=>{captured=text;return new Promise(r=>finish=r);}});try{
  s.click('[data-native-save]');assert.match(s.label(),/operation in progress/);s.edit('night');assert.match(s.label(),/operation in progress/);assert.equal(JSON.parse(captured).active.time,'day');
  finish();await tick();assert.match(s.label(),/differs from the last verified/);assert.match(s.status(),/Newer browser edits/);
  s.edit('day');assert.match(s.label(),/matches the last verified/);
 }finally{s.controller.dispose();}
});

test('failed native writes or conflicts invalidate previously verified comparison without replacing edits',async()=>{
 for(const conflict of [false,true]){
  const s=comparisonSetup();try{
   s.click('[data-native-save]');await tick();assert.match(s.label(),/matches/);s.edit('night');const before=model.encodeWorkspace(s.state());
   const failure=Error('synthetic refusal');if(conflict)failure.code='NATIVE_CONFLICT';s.store.save=async()=>{throw failure;};s.click('[data-native-save]');await tick();
   assert.match(s.label(),/unknown/);assert.equal(model.encodeWorkspace(s.state()),before);s.edit('day');assert.match(s.label(),/unknown/);
  }finally{s.controller.dispose();}
 }
});

test('empty native backup and invalid current or loaded snapshots have distinct safe comparison states',async()=>{
 const s=comparisonSetup({load:async()=>null});try{
  s.click('[data-native-load]');await tick();assert.match(s.label(),/no native backup/);s.edit('night');assert.match(s.label(),/no native backup/);
  s.click('[data-native-save]');await tick();assert.match(s.label(),/matches/);s.invalid();assert.match(s.label(),/cannot be compared safely/);
  s.store.load=async()=>'invalid JSON';s.click('[data-native-load]');await tick();assert.match(s.label(),/unknown/);assert.equal(s.state().version,999);
 }finally{s.controller.dispose();}
 const unavailable=setup();assert.match(unavailable.host.querySelector('[data-native-comparison]').textContent,/unavailable/);unavailable.controller.dispose();
});

test('history listing and ordinary history failure preserve native comparison baseline',async()=>{
 const s=comparisonSetup();try{
  s.click('[data-native-load]');await tick();assert.match(s.label(),/matches/);s.edit('night');
  s.click('[data-native-history]');await tick();assert.match(s.label(),/differs/);assert.deepEqual(s.calls.map(v=>v[0]),['load','history']);
  s.store.revisions=async()=>{throw Error('history unavailable');};s.click('[data-native-history]');await tick();assert.match(s.label(),/differs/);assert.match(s.status(),/history failed/);
  s.edit('day');assert.match(s.label(),/matches/);assert.equal(s.calls.length,2);
 }finally{s.controller.dispose();}
});

test('recovery establishes committed snapshot even when newer browser edits prevent replacement',async()=>{
 let finish;const s=comparisonSetup({restoreRevision:()=>new Promise(r=>finish=r)});try{
  s.click('[data-native-history]');await tick();s.host.querySelector('option').selected=true;s.click('[data-native-recover]');await tick();s.edit('night');finish(model.encodeWorkspace(fixture));await tick();
  assert.equal(s.state().active.time,'night');assert.match(s.label(),/differs/);assert.match(s.status(),/browser edits were retained/);s.edit('day');assert.match(s.label(),/matches/);
 }finally{s.controller.dispose();}
});

test('comparison disposal or abort fences late completion and retained controls without native probes',async()=>{
 for(const abort of [false,true]){
  let finish,count=0;const s=comparisonSetup({save:()=>{count++;return new Promise(r=>finish=r);}});
  const button=s.host.querySelector('[data-native-save]');button.click();if(abort)s.abort.abort();else s.controller.dispose();s.controller.update();finish();await tick();button.click();s.controller.update();assert.equal(count,1);assert.equal(s.host.childNodes.length,0);
 }
});
