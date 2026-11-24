'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {parseHTML}=require('linkedom'),path=require('node:path');
const seedPath=path.join(__dirname,'../research/skyrim-distributor-review-2026-11-22/manual-followed-projects.json');
const bytes=()=>new Uint8Array(fs.readFileSync(seedPath));
const file=()=>{const data=bytes();return {size:data.byteLength,arrayBuffer:async()=>data.buffer};};
const known=[
 ['36869','Spell Perk Item Distributor','powerof3','Spell-Perk-Item-Distributor','301413449','32599957'],
 ['55728','Keyword Item Distributor','powerof3','Keyword-Item-Distributor','407661894','32599957'],
 ['60805','Base Object Swapper','powerof3','BaseObjectSwapper','441953497','32599957'],
 ['62861','Seasons of Skyrim SKSE','powerof3','SeasonsOfSkyrim','451625279','32599957'],
 ['74037','FormList Manipulator','MaskedRPGFan','FormList-Manipulator','530685130','112493515']
];
const nexus=id=>'https://www.nexusmods.com/skyrimspecialedition/mods/'+id;
const entryId=id=>'manual:nexus:skyrimspecialedition:'+id;
const graphUrl=(owner,repo)=>'https://github.com/'+owner+'/'+repo;

test('Skyrim seed separates five canonical projects from two public repository operator accounts and makes no release claim',async()=>{
 const {parseBackup,mergeBackup}=await import('../dist/workspaces/projects/import.mjs');
 const {empty,change}=await import('../dist/workspaces/projects/model.mjs');
 const seed=parseBackup(bytes());
 assert.deepEqual(Object.keys(seed),['schema','entries']);assert.equal(seed.entries.length,5);
 for(const [i,[id,name,owner,repo,repositoryId,operatorId]] of known.entries()){
  const row=seed.entries[i],rev=row.revisions[0],publicData=row.sourceReview;
  assert.deepEqual([row.id,row.archived,row.revisions.length,rev.name,rev.ownership,rev.stage,rev.source,rev.version,rev.release],
   [entryId(id),false,1,name,'followed','research',nexus(id),'','']);
  assert.deepEqual(publicData.projectIdentity,{provider:'Nexus Mods',game:'skyrimspecialedition',projectId:id,url:nexus(id)});
  assert.deepEqual(publicData.githubRepository,{fullName:owner+'/'+repo,id:repositoryId,url:graphUrl(owner,repo),source:'https://api.github.com/repos/'+owner+'/'+repo});
  assert.deepEqual(publicData.publicRepositoryOperator,{account:owner,id:operatorId,url:'https://github.com/'+owner});
  assert.equal(publicData.reviewedUtcDate,'2026-11-22');
  assert.equal(publicData.nexusLinkEvidence.kind,id==='74037'?'official repository homepage':'pinned author README');
  if(id==='74037')assert.equal(publicData.nexusLinkEvidence.url,'https://api.github.com/repos/'+owner+'/'+repo);
  else assert.match(publicData.nexusLinkEvidence.url,new RegExp('^'+graphUrl(owner,repo)+'/blob/[0-9a-f]{40}/README\\.md$'));
  assert.match(rev.blockers,/file and runtime compatibility are unverified/);
  assert.match(rev.decisions,/manual source reference only/i);
 }
 assert.equal(new Set(seed.entries.map(x=>x.sourceReview.publicRepositoryOperator.id)).size,2);
 assert.doesNotMatch(JSON.stringify(seed),/releases\/|tab=files|\/download|\.(?:dll|zip|7z)|api\.nexusmods\.com|"license"|"compatibility"|\bguaranteed\b/i);
 const own=change(empty(),'synthetic-own',{...seed.entries[0].revisions[0],name:'Unrelated local fixture',ownership:'own'},0);
 const added=mergeBackup(own,seed);
 assert.equal(added.added,5);assert.equal(added.unchanged,0);assert.deepEqual(added.data.entries,[...own.entries,...seed.entries]);
 assert.deepEqual(mergeBackup(added.data,seed),{data:added.data,added:0,unchanged:5});
 const edited=change(added.data,entryId('74037'),{...seed.entries[4].revisions[0],name:'My local FLM entry'},1);
 assert.throws(()=>mergeBackup(edited,seed),/conflicting project ID/);
 assert.equal(edited.entries.find(x=>x.id===entryId('74037')).revisions.at(-1).name,'My local FLM entry');
});

test('mounted Athena Projects previews then adds the opt-in references once without fetching, preserves links and loads a saved workspace',async()=>{
 const {mount}=await import('../dist/workspaces/projects/index.mjs');
 const {document}=parseHTML('<body><section></section></body>');
 const container=document.querySelector('section'),oldDocument=globalThis.document,oldFetch=globalThis.fetch;
 globalThis.document=document;let outgoing=0;globalThis.fetch=()=>{outgoing++;throw Error('No network is allowed during a manual project seed import');};
 let saved,writes=0,mounted;
 const open=()=>mount({container,state:saved,setState:(value,options)=>{
  assert.equal(options.reviewedProjectBackup,'{"schema":1,"entries":[]}');
  saved=structuredClone(value);writes++;return true;
 }});
 try{
  mounted=open();assert.equal(mounted.ready,true);
  const root=container.shadowRoot,q=s=>root.querySelector(s),load=()=>q('#import').onchange({target:{files:[file()],value:''}});
  assert.equal(q('[data-project]'),null);
  let resolve;const delayed={size:bytes().byteLength,arrayBuffer:()=>new Promise(r=>{resolve=r;})};
  const pending=q('#import').onchange({target:{files:[delayed],value:''}});
  mounted.unmount();mounted=open();resolve(bytes().buffer);await pending;
  assert.equal(q('#backup-review').hidden,true);assert.equal(writes,0);assert.equal(q('[data-project]'),null);
  await load();assert.equal(q('#backup-review').hidden,false);
  assert.deepEqual([...root.querySelectorAll('#backup-projects li')].map(x=>x.textContent),known.map(x=>x[1]));
  assert.equal(q('[data-project]'),null);assert.equal(writes,0);
  q('#backup-cancel').onclick();assert.equal(writes,0);assert.equal(q('[data-project]'),null);
  await load();q('#backup-confirm').onclick();assert.match(q('#notice').textContent,/Imported 5 new projects/);assert.equal(writes,1);
  mounted.unmount();mounted=open();
  q('#ownership').onchange({target:{value:'own'}});assert.equal(q('[data-project]'),null);
  q('#ownership').onchange({target:{value:'followed'}});assert.equal(root.querySelectorAll('[data-project]').length,5);
  for(const [id,name] of known){
   const card=q('[data-project="'+entryId(id)+'"]');assert.match(card.textContent,new RegExp(name));
   card.querySelector('button').onclick();
   const links=[...root.querySelectorAll('#detail > a')];assert.deepEqual(links.map(a=>a.getAttribute('href')),[nexus(id)]);
   assert.ok(links.every(a=>a.getAttribute('rel')==='noopener noreferrer'));
  }
  await load();assert.match(q('#notice').textContent,/adds nothing/);assert.equal(writes,1);assert.equal(outgoing,0);
 }finally{mounted?.unmount();globalThis.document=oldDocument;globalThis.fetch=oldFetch;}
});
