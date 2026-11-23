import {repoRoot,runtimeRoot,binaryPath,testTemp} from './paths.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {attachNativeImport} from '../../../dist/workspaces/foundry/native-import.mjs';const require=createRequire(new URL('../../../package.json',import.meta.url)),{parseHTML}=require('linkedom'),tick=()=>new Promise(r=>setImmediate(r));
const report={lossless_migration:false,reviewed_themes:1,reviewed_rooms:1,soundtracks:1,skipped_unreviewed_themes:0,skipped_unreviewed_rooms:0,skipped_unreviewed_soundtracks:0,skipped_metadata_rows:1,skipped_assignment_metadata_rows:0,source_catalog_rows_not_copied:2,unknown_source_tables:0,source_table_rows:{history:1}};
function setup(store){const {document}=parseHTML('<section></section>'),host=document.querySelector('section');return {host,adapter:attachNativeImport({host,nativeStore:store}),click:q=>host.querySelector(q).click()};}
test('uncertain import outcome is not presented as complete migration',async()=>{const s=setup({reviewLegacy:async()=>({report,review_token:'a'.repeat(64),destination_exists:false}),importLegacy:async()=>({report,imported:true,restart_required:true,lossless_migration:false,source_unchanged_at_checks:false})});s.click('[data-legacy-review]');await tick();s.click('[data-legacy-import]');await tick();assert.match(s.host.textContent,/provenance is uncertain/);assert.equal(s.host.querySelector('[data-legacy-import]').disabled,true);s.adapter.dispose();});
test('errors consume review; no blind retry; disconnected state explicit',async()=>{const d=setup();assert.match(d.host.textContent,/not connected/);d.adapter.dispose();let count=0;const s=setup({reviewLegacy:async()=>({report,review_token:'a'.repeat(64),destination_exists:false}),importLegacy:async()=>{count++;throw Error('partial output')}});s.click('[data-legacy-review]');await tick();s.click('[data-legacy-import]');await tick();s.click('[data-legacy-import]');await tick();assert.equal(count,1);assert.match(s.host.textContent,/never retry blindly/);s.adapter.dispose();});
test('dispose aborts and fences outstanding review',async()=>{let resolve,signal;const s=setup({reviewLegacy:o=>{signal=o.signal;return new Promise(r=>resolve=r)},importLegacy:async()=>{}});s.click('[data-legacy-review]');s.adapter.dispose();assert.equal(signal.aborted,true);resolve({report,review_token:'a'.repeat(64)});await tick();assert.equal(s.host.children.length,0);});

test('failed re-review removes old counts immediately and cannot authorize import',async()=>{
 let calls=0,fail,imports=0;
 const s=setup({reviewLegacy:async()=>++calls===1?{report,review_token:'a'.repeat(64),destination_exists:false}:new Promise((_,reject)=>{fail=reject}),importLegacy:async()=>{imports++;}});
 const el=key=>s.host.querySelector(`[data-legacy-${key}]`);
 s.click('[data-legacy-review]');await tick();
 assert.match(el('counts').textContent,/reviewed_rooms: 1/);
 assert.equal(el('import').disabled,false);
 s.click('[data-legacy-review]');
 assert.equal(el('counts').textContent,'');
 assert.match(el('status').textContent,/Reviewing/);
 fail(new Error('source unavailable'));await tick();
 assert.equal(el('counts').textContent,'');
 assert.match(el('status').textContent,/source unavailable/);
 assert.equal(el('import').disabled,true);
 s.click('[data-legacy-import]');await tick();
 assert.equal(imports,0);
 s.adapter.dispose();
});

test('invalid report, token or destination state never displays review counts',async()=>{
 for(const response of [
  {report:{...report,source_table_rows:{history:-1}},review_token:'a'.repeat(64),destination_exists:false},
  {report,review_token:'invalid',destination_exists:false},
  {report,review_token:'a'.repeat(64)}
 ]){
  const s=setup({reviewLegacy:async()=>response,importLegacy:async()=>{}});
  s.click('[data-legacy-review]');await tick();
  assert.equal(s.host.querySelector('[data-legacy-counts]').textContent,'');
  assert.match(s.host.querySelector('[data-legacy-status]').textContent,/Review failed/);
  assert.equal(s.host.querySelector('[data-legacy-import]').disabled,true);
  s.adapter.dispose();
 }
});

test('unverified import result cannot leave review or partial outcome counts on screen',async()=>{
 const s=setup({reviewLegacy:async()=>({report,review_token:'a'.repeat(64),destination_exists:false}),
  importLegacy:async()=>({report:{...report,source_table_rows:{history:-1}},imported:true,restart_required:true,lossless_migration:false})});
 s.click('[data-legacy-review]');await tick();
 s.click('[data-legacy-import]');await tick();
 assert.equal(s.host.querySelector('[data-legacy-counts]').textContent,'');
 assert.match(s.host.querySelector('[data-legacy-status]').textContent,/Import not confirmed/);
 assert.equal(s.host.querySelector('[data-legacy-import]').disabled,true);
 s.adapter.dispose();
});

test('confirmed counts still display for a destination that will not be overwritten',async()=>{
 const s=setup({reviewLegacy:async()=>({report,review_token:'a'.repeat(64),destination_exists:true}),
  importLegacy:async()=>assert.fail('an existing destination must not authorize import')});
 s.click('[data-legacy-review]');await tick();
 assert.match(s.host.querySelector('[data-legacy-counts]').textContent,/Source history rows: 1/);
 assert.match(s.host.querySelector('[data-legacy-status]').textContent,/will not be overwritten/);
 assert.equal(s.host.querySelector('[data-legacy-import]').disabled,true);
 s.adapter.dispose();
});

test('a truthy non-boolean source check never claims the source matched',async()=>{
 const s=setup({reviewLegacy:async()=>({report,review_token:'a'.repeat(64),destination_exists:false}),
  importLegacy:async()=>({report,imported:true,restart_required:true,lossless_migration:false,source_unchanged_at_checks:'false'})});
 s.click('[data-legacy-review]');await tick();
 s.click('[data-legacy-import]');await tick();
 assert.match(s.host.querySelector('[data-legacy-status]').textContent,/provenance is uncertain/);
 assert.match(s.host.querySelector('[data-legacy-counts]').textContent,/reviewed_rooms: 1/);
 s.adapter.dispose();
});
