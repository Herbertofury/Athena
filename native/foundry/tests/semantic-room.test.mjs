import test from 'node:test';import assert from 'node:assert/strict';import {parseHTML} from 'linkedom';
import {parseSemanticRoom,attachSemanticRoom,createSemanticEdits} from '../../../dist/workspaces/foundry/native-semantic-room.mjs';
export const fixture={sourceName:'Synthetic <img onerror=alert(1)>.blend',imported:true,importMode:'unified-detached',keepUnified:true,detachInteractables:true,autoPhysics:false,mascotAffordances:true,selectedId:'sample',stage:'ready',tableAssetId:null,objects:[{id:'sample',name:'Synthetic chair',icon:'X',role:'Seat',physics:'Unverified',interactive:true,detachable:true,visible:true,locked:false,state:'recorded',actions:['Sit','<script>not executable</script>'],mascot:'Recorded action',atlasId:'synthetic-source-id'}]};
const bytes=v=>new TextEncoder().encode(typeof v==='string'?v:JSON.stringify(v)),tick=()=>new Promise(r=>setImmediate(r));
function setup(overrides={}){const {document,window}=parseHTML('<main></main>');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return [...this.options].find(o=>o.selected)?.value||this.options[0]?.value||''},set(v){for(const o of this.options)o.removeAttribute('selected');[...this.options].find(o=>o.value===v)?.setAttribute('selected','')}});const host=document.querySelector('main'),controller=new AbortController(),blobs=[],revoked=[];const api=attachSemanticRoom({host,signal:controller.signal,createURL:b=>(blobs.push(b),'blob:fixture-'+blobs.length),revokeURL:u=>revoked.push(u),...overrides});return {host,document,window,api,controller,blobs,revoked,one:q=>host.querySelector(q),async load(value){const data=bytes(value),input=host.querySelector('input');Object.defineProperty(input,'files',{configurable:true,value:[{size:data.length,arrayBuffer:async()=>data.buffer}]});input.dispatchEvent(new window.Event('change'));await tick();}};}
test('source-backed semantic records validate without executing descriptions',()=>{assert.deepEqual(parseSemanticRoom(bytes(fixture)),fixture);for(const mutate of [v=>v.unknown=true,v=>v.objects[0].future=true,v=>v.objects.push({...v.objects[0]}),v=>v.selectedId='missing',v=>v.objects[0].locked='false',v=>v.objects[0].actions=Array(65).fill('x')]){const v=structuredClone(fixture);mutate(v);assert.throws(()=>parseSemanticRoom(bytes(v)));}assert.throws(()=>parseSemanticRoom(bytes('{"objects":[],"objects":[]}')),/unambiguous/);assert.throws(()=>parseSemanticRoom(bytes('{"a":1,"\\u0061":2}')),/unambiguous/);assert.throws(()=>parseSemanticRoom(new Uint8Array([255])),/UTF-8/);assert.throws(()=>parseSemanticRoom(new Uint8Array(1024*1024+1)));});
test('exact original bytes export, safe text, rejected replacement and close cleanup',async()=>{const s=setup(),raw='\ufeff \n'+JSON.stringify(fixture,null,3)+'\n';await s.load(raw);assert.equal(s.blobs.length,1);for(const key of ['keepUnified','detachInteractables','mascotAffordances','selectedId','tableAssetId'])assert.match(s.one('[data-semantic-summary]').textContent,new RegExp(key));assert.deepEqual(new Uint8Array(await s.blobs[0].arrayBuffer()),bytes(raw));assert.equal(s.host.querySelector('img'),null);assert.equal(s.host.querySelector('script'),null);assert.match(s.one('[data-semantic-details]').textContent,/lockedfalse/);await s.load({...fixture,future:'unsupported'});assert.equal(s.blobs.length,1);assert.match(s.one('[data-semantic-status]').textContent,/Previous snapshot metadata retained/);s.one('[data-semantic-close]').click();assert.deepEqual(s.revoked,['blob:fixture-1']);assert.equal(s.one('[data-semantic-export]').hasAttribute('href'),false);s.api.dispose();assert.equal(s.host.children.length,0);});
test('newer selection, close and abort fence asynchronous reads',async()=>{for(const action of ['replace','close','abort']){const s=setup(),input=s.one('input');let finish;Object.defineProperty(input,'files',{configurable:true,value:[{size:100,arrayBuffer:()=>new Promise(r=>finish=r)}]});input.dispatchEvent(new s.window.Event('change'));if(action==='replace')await s.load({...fixture,sourceName:'newer'});if(action==='close')s.one('[data-semantic-close]').dispatchEvent(new s.window.Event('click'));if(action==='abort')s.controller.abort();finish(bytes(fixture).buffer);await tick();assert.equal(s.blobs.length,action==='replace'?1:0);if(action==='replace')assert.match(s.one('[data-semantic-summary]').textContent,/newer/);s.api.dispose();}});

test('control characters reject; unknown bounded source mode is read-only metadata',()=>{const v=structuredClone(fixture);v.importMode='original-future-label';assert.equal(parseSemanticRoom(bytes(v)).importMode,v.importMode);v.sourceName='bad\u0001text';assert.throws(()=>parseSemanticRoom(bytes(v)),/bounded text/);});
test('export allocation and cleanup errors never claim successful replacement or release',async()=>{const s=setup({createURL:()=>{throw Error('allocation failed')}});await s.load(fixture);assert.match(s.one('[data-semantic-status]').textContent,/Rejected/);assert.equal(s.one('[data-semantic-export]').hasAttribute('href'),false);s.api.dispose();let count=0;const t=setup({revokeURL:()=>{count++;throw Error('cleanup failed')}});await t.load(fixture);await t.load({...fixture,sourceName:'replacement'});assert.match(t.one('[data-semantic-status]').textContent,/unverified/);assert.match(t.one('[data-semantic-summary]').textContent,/Synthetic/);t.one('[data-semantic-close]').click();assert.match(t.one('[data-semantic-status]').textContent,/cleanup failed/);assert.equal(t.one('[data-semantic-export]').hasAttribute('href'),false);t.api.dispose();assert.ok(count>=2);});

test('typed metadata patch history preserves unknown classifications, exact IDs and every unrelated field',()=>{const v=structuredClone(fixture);v.objects.push({...v.objects[0],id:'second'});const original=structuredClone(v),e=createSemanticEdits(v),row=e.value.objects[1];e.apply(e.plan('second',{role:row.role,physics:row.physics,visible:false,locked:true}));assert.deepEqual(e.value.objects[0],original.objects[0]);assert.equal(e.value.objects[1].role,'Seat');assert.equal(e.value.objects[1].physics,'Unverified');const expected=structuredClone(original);expected.objects[1].visible=false;expected.objects[1].locked=true;assert.deepEqual(e.value,expected);assert.equal(e.plan('second',{role:row.role,physics:row.physics,visible:false,locked:true}),null);e.undo();assert.deepEqual(e.value,original);e.redo();assert.deepEqual(e.value,expected);assert.throws(()=>e.plan('second',{role:'invented',physics:'Unverified',visible:true,locked:false}));assert.throws(()=>e.plan('missing',{}));for(let i=0;i<100;i++)e.apply(e.plan('second',{role:'Decoration',physics:'No collision',visible:i%2===0,locked:false}));assert.ok(e.retainedEdits<=50);assert.ok(e.retainedBytes<=256*1024);assert.deepEqual(v,original);});
test('editing exports derivative only; original BOM bytes remain exact and retired export URLs release',async()=>{const s=setup(),v=structuredClone(fixture);v.objects.push({...v.objects[0],id:'second'});const raw='\ufeff '+JSON.stringify(v,null,3)+'\n';await s.load(raw);s.one('[data-semantic-select]').value='second';s.one('[data-semantic-select]').dispatchEvent(new s.window.Event('change'));assert.equal(s.one('[data-semantic-role]').value,'Seat');s.one('[data-semantic-visible]').checked=false;s.one('[data-semantic-locked]').checked=true;s.one('[data-semantic-apply]').click();s.one('[data-semantic-prepare]').click();const edited=JSON.parse(await s.blobs[1].text());assert.equal(edited.objects[1].visible,false);assert.equal(edited.objects[1].locked,true);assert.deepEqual(edited.objects[0],v.objects[0]);assert.equal(edited.objects[1].physics,'Unverified');assert.deepEqual(new Uint8Array(await s.blobs[0].arrayBuffer()),bytes(raw));s.one('[data-semantic-undo]').click();assert.deepEqual(s.revoked,['blob:fixture-2']);assert.equal(s.one('[data-semantic-edited]').hasAttribute('href'),false);s.one('[data-semantic-apply]').click();assert.equal(s.one('[data-semantic-redo]').disabled,false);s.one('[data-semantic-redo]').click();s.one('[data-semantic-prepare]').click();s.one('[data-semantic-close]').click();s.one('[data-semantic-discard]').click();assert.deepEqual(new Set(s.revoked),new Set(['blob:fixture-1','blob:fixture-2','blob:fixture-3']));s.api.dispose();});
test('edits fence pending replacement, invalid replacement retains edits, and new file clears history',async()=>{const s=setup();await s.load(fixture);let finish;const input=s.one('[data-semantic-file]');Object.defineProperty(input,'files',{configurable:true,value:[{size:100,arrayBuffer:()=>new Promise(r=>finish=r)}]});input.dispatchEvent(new s.window.Event('change'));s.one('[data-semantic-visible]').checked=false;s.one('[data-semantic-apply]').click();finish(bytes({...fixture,sourceName:'stale'}).buffer);await tick();assert.match(s.one('[data-semantic-summary]').textContent,/Synthetic/);assert.equal(s.one('[data-semantic-visible]').checked,false);await s.load({...fixture,future:true});assert.equal(s.one('[data-semantic-visible]').checked,false);await s.load({...fixture,sourceName:'new'});s.one('[data-semantic-discard]').click();assert.equal(s.one('[data-semantic-undo]').disabled,true);assert.equal(s.one('[data-semantic-visible]').checked,true);s.api.dispose();});
test('failed edited URL allocation preserves metadata and independent original export',async()=>{let calls=0;const s=setup({createURL:()=>{if(++calls>1)throw Error('synthetic allocation');return 'blob:original';}});await s.load(fixture);s.one('[data-semantic-role]').value='Decoration';s.one('[data-semantic-apply]').click();s.one('[data-semantic-prepare]').click();assert.equal(s.one('[data-semantic-role]').value,'Decoration');assert.equal(s.one('[data-semantic-export]').getAttribute('href'),'blob:original');assert.equal(s.one('[data-semantic-edited]').hasAttribute('href'),false);s.api.dispose();});

test('reordered identical typed fields are no-op and preserve Redo',()=>{const e=createSemanticEdits(fixture);e.apply(e.plan('sample',{locked:true,visible:false,physics:'Unverified',role:'Seat'}));e.undo();assert.equal(e.canRedo,true);assert.equal(e.plan('sample',{locked:false,visible:true,physics:'Unverified',role:'Seat'}),null);assert.equal(e.canRedo,true);const patch=e.plan('sample',{locked:true,visible:false,physics:'Unverified',role:'Seat'});patch.before={locked:false,visible:true,physics:'Unverified',role:'Seat'};assert.equal(e.apply(patch),true);assert.equal(e.value.objects[0].visible,false);});

test('a valid replacement cannot silently discard applied metadata or its export',async()=>{
 const s=setup();await s.load(fixture);
 s.one('[data-semantic-role]').value='Decoration';s.one('[data-semantic-apply]').click();s.one('[data-semantic-prepare]').click();
 const replacement={...fixture,sourceName:'replacement'};
 await s.load(replacement);
 assert.match(s.one('[data-semantic-summary]').textContent,/Synthetic/);
 assert.equal(s.one('[data-semantic-edited]').getAttribute('href'),'blob:fixture-2');
 assert.equal(s.one('[data-semantic-discard-panel]').hidden,false);
 assert.equal(s.blobs.length,2);
 s.one('[data-semantic-keep]').click();assert.equal(s.one('[data-semantic-discard-panel]').hidden,true);
 assert.equal(s.one('[data-semantic-role]').value,'Decoration');assert.deepEqual(s.revoked,[]);
 await s.load(replacement);s.one('[data-semantic-discard]').click();
 assert.match(s.one('[data-semantic-summary]').textContent,/replacement/);
 assert.equal(s.one('[data-semantic-undo]').disabled,true);
 assert.deepEqual(s.revoked,['blob:fixture-2','blob:fixture-1']);s.api.dispose();
});

test('closing protects unapplied input and preserves a redo-only session until explicitly discarded',async()=>{
 const s=setup();await s.load(fixture);
 s.one('[data-semantic-role]').value='Decoration';s.one('[data-semantic-close]').click();
 assert.equal(s.one('[data-semantic-discard-panel]').hidden,false);
 assert.equal(s.one('[data-semantic-role]').value,'Decoration');
 s.one('[data-semantic-keep]').click();
 s.one('[data-semantic-apply]').click();s.one('[data-semantic-undo]').click();
 s.one('[data-semantic-close]').click();
 assert.equal(s.one('[data-semantic-redo]').disabled,false);assert.deepEqual(s.revoked,[]);
 s.one('[data-semantic-discard]').click();
 assert.equal(s.one('[data-semantic-export]').hasAttribute('href'),false);
 assert.deepEqual(s.revoked,['blob:fixture-1']);s.api.dispose();
});

test('a superseding rejected file cancels stale approval and a successful edit cancels pending replacement',async()=>{
 const s=setup();await s.load(fixture);
 s.one('[data-semantic-role]').value='Decoration';await s.load({...fixture,sourceName:'staged'});
 assert.equal(s.one('[data-semantic-discard-panel]').hidden,false);
 await s.load({...fixture,future:true});
 s.one('[data-semantic-discard]').click();
 assert.equal(s.one('[data-semantic-discard-panel]').hidden,true);
 assert.match(s.one('[data-semantic-summary]').textContent,/Synthetic/);
 await s.load({...fixture,sourceName:'staged again'});s.one('[data-semantic-apply]').click();
 assert.equal(s.one('[data-semantic-discard-panel]').hidden,true);
 s.one('[data-semantic-discard]').click();
 assert.match(s.one('[data-semantic-summary]').textContent,/Synthetic/);
 assert.equal(s.one('[data-semantic-role]').value,'Decoration');assert.deepEqual(s.revoked,[]);
 s.controller.abort();assert.deepEqual(s.revoked,['blob:fixture-1']);
});

test('original capsule hashes both Unicode units and unrelated entries before selecting the room',async()=>{
 const {inspectSemanticSelection}=await import('../../../dist/workspaces/foundry/native-semantic-room.mjs');
 const {createHash,webcrypto}=await import('node:crypto');
 const entry=(key,value)=>({key,value,utf16_sha256:createHash('sha256').update(Buffer.from(value,'utf16le')).digest('hex')});
 const raw='\ufeff\n'+JSON.stringify({...fixture,sourceName:'😀 room'},null,2)+'\n';
 const capsule={format:'athena-foundry-original-values',version:1,native_import:false,entries:[entry('ff-room-semantic-state',raw),entry('ff.music-hub.v2','secret-not-room'+String.fromCharCode(0xd800))]};
 const result=await inspectSemanticSelection(bytes(capsule),webcrypto.subtle);
 assert.deepEqual(Object.keys(result).sort(),['bytes','fromCapsule','value']);
 assert.deepEqual(result.bytes,bytes(raw));assert.equal(result.value.sourceName,'😀 room');assert.equal(result.fromCapsule,true);
 assert.equal((await inspectSemanticSelection(bytes(raw),null)).fromCapsule,false);
 await assert.rejects(inspectSemanticSelection(bytes(capsule),null),/secure local/);
 for(const change of [
   v=>v.entries.push({...v.entries[0]}),v=>v.entries[1].value+='tamper',
   v=>{v.entries[0]=entry('ff-room-semantic-state',raw+String.fromCharCode(0xd800));},
   v=>v.entries.shift(),v=>v.extra='not supported',v=>v.native_import=true,
 ]){const c=structuredClone(capsule);change(c);await assert.rejects(inspectSemanticSelection(bytes(c),webcrypto.subtle));}
});

test('digest verification resolving after a newer selection cannot replace it',async()=>{
 const {createHash}=await import('node:crypto');const s=setup(),raw=JSON.stringify(fixture);
 const capsule={format:'athena-foundry-original-values',version:1,native_import:false,entries:[{key:'ff-room-semantic-state',value:raw,utf16_sha256:createHash('sha256').update(Buffer.from(raw,'utf16le')).digest('hex')}]};
 const before=Object.getOwnPropertyDescriptor(globalThis,'crypto');let finish;
 Object.defineProperty(globalThis,'crypto',{configurable:true,value:{subtle:{digest:()=>new Promise(resolve=>finish=resolve)}}});
 try{
  await s.load(capsule);assert.equal(typeof finish,'function');assert.equal(s.blobs.length,0);
  await s.load({...fixture,sourceName:'Newer direct selection'});const digest=Uint8Array.from(Buffer.from(capsule.entries[0].utf16_sha256,'hex'));
  finish(digest.buffer);await tick();assert.equal(s.blobs.length,1);
  assert.match(s.one('[data-semantic-summary]').textContent,/Newer direct selection/);
 }finally{if(before)Object.defineProperty(globalThis,'crypto',before);else delete globalThis.crypto;s.api.dispose();}
});

test('explicit large selection transfers exact owned bytes and terminates once per outcome',async()=>{
 const {inspectSelectedRoom}=await import('../../../dist/workspaces/foundry/native-semantic-room.mjs');
 const padded=new Uint8Array(130*1024+2);padded[0]=44;padded[padded.length-1]=99;
 const input=padded.subarray(1,-1);
 function harness(){
  const w={terminated:0,postMessage(data,transfers){this.sent={data,transfers};},terminate(){this.terminated++;}};
  return w;
 }
 for(const action of ['success','cancel','module-error','timeout']){
  const w=harness(),c=new AbortController();
  const work=inspectSelectedRoom(input,{signal:c.signal,makeWorker:()=>w,timeoutMs:action==='timeout'?1:15000});
  assert.ok(w.sent.data instanceof Uint8Array);assert.equal(w.sent.data.byteLength,input.byteLength);
  assert.notEqual(w.sent.data.buffer,padded.buffer);assert.deepEqual(w.sent.transfers,[w.sent.data.buffer]);
  const handle=w.onmessage;const selected={value:fixture,bytes:bytes(fixture),fromCapsule:true};
  if(action==='success'){handle({data:{selected}});assert.equal(await work,selected);}
  else{
   if(action==='cancel')c.abort();else if(action==='module-error')w.onerror();
   await assert.rejects(work);
  }
  handle({data:{selected}});assert.equal(w.terminated,1);assert.equal(w.onmessage,null);
  assert.equal(padded[0],44);assert.equal(padded[padded.length-1],99);
 }
 const selected=await inspectSelectedRoom(bytes(fixture),{makeWorker:()=>{throw Error('small file should not create a worker')}});
 assert.equal(selected.fromCapsule,false);
});
