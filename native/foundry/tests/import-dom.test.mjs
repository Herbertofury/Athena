import {repoRoot,runtimeRoot,binaryPath,testTemp} from './paths.mjs';
import test from 'node:test';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {attachNativeImport} from '../../../dist/workspaces/foundry/native-import.mjs';const require=createRequire(new URL('../../../package.json',import.meta.url)),{parseHTML}=require('linkedom'),tick=()=>new Promise(r=>setImmediate(r));
const report={lossless_migration:false,reviewed_themes:1,reviewed_rooms:1,soundtracks:1,skipped_unreviewed_themes:0,skipped_unreviewed_rooms:0,skipped_unreviewed_soundtracks:0,skipped_metadata_rows:1,skipped_assignment_metadata_rows:0,source_catalog_rows_not_copied:2,unknown_source_tables:0,source_table_rows:{history:1}};
function setup(store){const {document}=parseHTML('<section></section>'),host=document.querySelector('section');return {host,adapter:attachNativeImport({host,nativeStore:store}),click:q=>host.querySelector(q).click()};}
test('uncertain import outcome is not presented as complete migration',async()=>{const s=setup({reviewLegacy:async()=>({report,review_token:'a'.repeat(64),destination_exists:false}),importLegacy:async()=>({report,imported:true,restart_required:true,lossless_migration:false,source_unchanged_at_checks:false})});s.click('[data-legacy-review]');await tick();s.click('[data-legacy-import]');await tick();assert.match(s.host.textContent,/provenance is uncertain/);assert.equal(s.host.querySelector('[data-legacy-import]').disabled,true);s.adapter.dispose();});
test('errors consume review; no blind retry; disconnected state explicit',async()=>{const d=setup();assert.match(d.host.textContent,/not connected/);d.adapter.dispose();let count=0;const s=setup({reviewLegacy:async()=>({report,review_token:'a'.repeat(64),destination_exists:false}),importLegacy:async()=>{count++;throw Error('partial output')}});s.click('[data-legacy-review]');await tick();s.click('[data-legacy-import]');await tick();s.click('[data-legacy-import]');await tick();assert.equal(count,1);assert.match(s.host.textContent,/never retry blindly/);s.adapter.dispose();});
test('dispose aborts and fences outstanding review',async()=>{let resolve,signal;const s=setup({reviewLegacy:o=>{signal=o.signal;return new Promise(r=>resolve=r)},importLegacy:async()=>{}});s.click('[data-legacy-review]');s.adapter.dispose();assert.equal(signal.aborted,true);resolve({report,review_token:'a'.repeat(64)});await tick();assert.equal(s.host.children.length,0);});

const counts={source:3,athena:4,matching_ids:2,exact_selected_fields:1,changed_selected_fields:1,only_in_source:1,only_in_athena:2};
test('compares selected fields without claiming parity, exposes the separate totals and unknown ecology',async()=>{
 const c={theme_names:counts,room_names:counts,ecology_name_shape_role:null};
 const s=setup({reviewLegacy:async()=>({report:{...report,catalog_comparison:c},review_token:'a'.repeat(64)}),importLegacy:async()=>{}});
 s.click('[data-legacy-review]');await tick();
 assert.match(s.host.textContent,/Theme IDs and names: 1 exact, 1 changed/);
 assert.match(s.host.textContent,/Only in Athena: 2/);
 assert.match(s.host.textContent,/Unknown is not zero/);
 assert.match(s.host.textContent,/Raw catalog rows, media, materials and behavior are not verified/);
 assert.equal(s.host.querySelector('[data-legacy-import]').disabled,false);s.adapter.dispose();
});
test('inconsistent or partial selected-field totals do not arm import',async()=>{
 const c={theme_names:{...counts,exact_selected_fields:2},room_names:counts,ecology_name_shape_role:null};
 const s=setup({reviewLegacy:async()=>({report:{...report,catalog_comparison:c},review_token:'a'.repeat(64)}),importLegacy:async()=>{}});
 s.click('[data-legacy-review]');await tick();
 assert.match(s.host.textContent,/do not reconcile/);
 assert.equal(s.host.querySelector('[data-legacy-import]').disabled,true);
 assert.equal(s.host.querySelector('[data-legacy-counts]').children.length,0);s.adapter.dispose();
});
