'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {parseHTML}=require('linkedom');
const path=require('node:path');
const seedPath=path.join(__dirname,'../research/minecraft-creator-review-2026-11-22/manual-followed-projects.json');
const bytes=()=>new Uint8Array(fs.readFileSync(seedPath));
const file=()=>{const data=bytes();return {size:data.byteLength,arrayBuffer:async()=>data.buffer};};

test('Minecraft research seed keeps public creator evidence separate from typed projects and release status',async()=>{
 const {parseBackup,mergeBackup}=await import('../dist/workspaces/projects/import.mjs');
 const {empty,change}=await import('../dist/workspaces/projects/model.mjs');
 const seed=parseBackup(bytes());
 assert.deepEqual(Object.keys(seed),['schema','entries']);
 const [doki,kiwi]=seed.entries;
 assert.deepEqual(seed.entries.map(row=>[row.id,row.archived,row.revisions.length,row.revisions[0].ownership,row.revisions[0].stage]),[
  ['manual:mcmodels:307:dokimobs-model-series',false,1,'followed','research'],
  ['manual:curseforge:1765329:kiwis-mobs',false,1,'followed','research']
 ]);
 assert.deepEqual(doki.sourceReview.creatorAccounts.map(row=>row.url),[
  'https://x.com/Equilibre256','https://www.youtube.com/channel/UCog4dBKjooSBFbYRhRQ7xMQ'
 ]);
 assert.equal(doki.sourceReview.projectIdentity.vendorId,'307');
 assert.deepEqual([doki.revisions[0].version,doki.revisions[0].release],['','']);
 assert.match(doki.revisions[0].blockers,/publisher relationship is unresolved/);
 assert.deepEqual(kiwi.sourceReview.creatorAccounts.map(row=>row.url),[
  'https://www.curseforge.com/members/kiwi_2238/projects','https://x.com/New_Zeal_kiwi'
 ]);
 assert.deepEqual(kiwi.sourceReview.observedFile,{fileId:'9667926',version:'1.46.240',minecraft:'1.21.1',loader:'Fabric',channel:'beta',
  publishedDate:'2026-11-17',url:'https://www.curseforge.com/minecraft/mc-mods/kiwis-mobs/files/9667926'});
 assert.equal(kiwi.sourceReview.projectIdentity.projectId,'1765329');
 assert.equal(kiwi.revisions[0].release,kiwi.sourceReview.observedFile.url);
 assert.doesNotMatch(JSON.stringify(seed),/\/(?:download|status)\/|forgecdn\.net|patreon\.com|QinQianjiu|secret|token/i);
 const row={...doki.revisions[0],name:'Synthetic own project',ownership:'own'};
 const existing=change(empty(),'synthetic-own',row,0),imported=mergeBackup(existing,seed);
 assert.deepEqual(imported,{data:{...existing,entries:[...existing.entries,...seed.entries]},added:2,unchanged:0});
 assert.deepEqual(mergeBackup(imported.data,seed),{data:imported.data,added:0,unchanged:2});
 const edit=change(imported.data,doki.id,{...doki.revisions[0],name:'Local synthetic edit'},1);
 assert.throws(()=>mergeBackup(edit,seed),/conflicting project ID/);
 assert.equal(edit.entries[1].revisions.at(-1).name,'Local synthetic edit');
});

test('actual Athena Projects shows manual seed only after confirmed local import and restores source links after remount',async()=>{
 const {mount}=await import('../dist/workspaces/projects/index.mjs');
 const {document}=parseHTML('<body><section></section></body>');
 const container=document.querySelector('section'),previousDocument=globalThis.document,previousFetch=globalThis.fetch;
 globalThis.document=document;globalThis.fetch=()=>assert.fail('Optional seed import must not fetch');
 let saved,writes=0,mounted;
 const open=()=>mount({container,state:saved,setState:(value,options)=>{
  assert.equal(options.reviewedProjectBackup,'{"schema":1,"entries":[]}');
  saved=structuredClone(value);writes++;return true;
 }});
 try{
  mounted=open();
  const root=container.shadowRoot,q=s=>root.querySelector(s);
  const load=()=>q('#import').onchange({target:{files:[file()],value:''}});
  assert.ok(mounted.ready);assert.equal(q('[data-project]'),null);assert.equal(writes,0);
  await load();assert.equal(q('#backup-review').hidden,false);
  assert.deepEqual([...root.querySelectorAll('#backup-projects li')].map(li=>li.textContent),['DokiMobs model series','Kiwi’s Mobs']);
  assert.equal(q('[data-project]'),null);assert.equal(writes,0);
  q('#backup-cancel').onclick();assert.equal(writes,0);assert.equal(q('[data-project]'),null);
  await load();q('#backup-confirm').onclick();assert.equal(writes,1);
  assert.match(q('#notice').textContent,/Imported 2 new projects/);
  mounted.unmount();mounted=open();
  q('#ownership').onchange({target:{value:'own'}});assert.equal(q('[data-project]'),null);
  q('#ownership').onchange({target:{value:'followed'}});assert.equal(root.querySelectorAll('[data-project]').length,2);
  for(const {id,revisions,sourceReview} of saved.entries){
   q('[data-project="'+id+'"] button').onclick();
   const links=[...root.querySelectorAll('#detail > a')];
   assert.deepEqual(links.map(a=>a.getAttribute('href')),[revisions[0].source,...revisions[0].release?[revisions[0].release]:[]]);
   assert.ok(links.every(a=>a.getAttribute('rel')==='noopener noreferrer'));
   assert.equal(sourceReview.reviewedUtcDate,'2026-11-22');
  }
  await load();assert.match(q('#notice').textContent,/adds nothing/);assert.equal(writes,1);
 }finally{mounted?.unmount();globalThis.document=previousDocument;globalThis.fetch=previousFetch;}
});
