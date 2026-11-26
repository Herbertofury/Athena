'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {parseHTML}=require('linkedom'),path=require('node:path');
const seedPath=path.join(__dirname,'../research/sims4-maru-review-2026-11-22/manual-followed-projects.json');
const bytes=()=>new Uint8Array(fs.readFileSync(seedPath));
const file=()=>{const data=bytes();return {size:data.byteLength,arrayBuffer:async()=>data.buffer};};
const cf='https://www.curseforge.com/sims4/mods/dynamic-cas-columns',release=cf+'/files/9746859';
const mover='https://www.patreon.com/marumaruSIMSMOD/posts/cc-list-mover-174372555',tooltip='https://www.patreon.com/marumaruSIMSMOD/posts/cas-tooltip-174022486';
const styled='https://www.curseforge.com/sims4/mods/styled-look-creator',styledRelease=styled+'/files/9746944';
const known=[
 ['manual:curseforge:1720674:dynamic-cas-companion','Dynamic CAS Companion',cf,release],
 ['manual:patreon:174372555:cc-list-mover','CC List Mover',mover,''],
 ['manual:patreon:174022486:cas-tooltip-studio','CAS Tooltip Studio',tooltip,''],
 ['manual:curseforge:1780050:styled-look-creator','Styled Look Creator',styled,styledRelease]
];
test('Maru seed separates exact release metadata, separate tool locators and directional relationships',async()=>{
 const {parseBackup,mergeBackup}=await import('../dist/workspaces/projects/import.mjs');
 const {empty,change}=await import('../dist/workspaces/projects/model.mjs');
 const seed=parseBackup(bytes());
 assert.deepEqual(Object.keys(seed),['schema','entries']);
 assert.deepEqual(seed.entries.map(({id,revisions:[r]})=>[id,r.name,r.source,r.release]),known);
 for(const {sourceReview:s,revisions:[r]} of seed.entries.slice(0,3)){
  assert.equal(s.reviewedUtcDate,'2026-11-22');
  assert.deepEqual(s.creatorAccounts.map(x=>x.account),['maru','marumaruSIMSMOD']);
  assert.deepEqual(s.identityEvidence,[{source:cf,linksTo:[mover,tooltip]},{source:mover,linksTo:[cf]}]);
  assert.equal(r.ownership,'followed');assert.equal(r.stage,'research');
 }
 const [dcc,cc,tool,look]=seed.entries;
 assert.deepEqual(dcc.sourceReview.observedFile,{fileId:'9746859',filename:'maru_DCC261122.zip',platformUploadDate:'2026-11-22',listedGameVersion:'1.129.39',fileChangelog:'not provided',url:release,uploader:'maru'});
 assert.match(dcc.revisions[0].blockers,/Actual game compatibility is unverified/);
 assert.deepEqual([cc.revisions[0].version,cc.revisions[0].release,tool.revisions[0].version,tool.revisions[0].release],['','','','']);
 assert.deepEqual(dcc.sourceReview.documentedRelationships.map(x=>[x.type,x.targetId]),[['uses_tool_for_name_preparation',tool.id]]);
 assert.deepEqual(cc.sourceReview.documentedRelationships.map(x=>[x.type,x.targetId]),[['requires_for_documented_workflow',dcc.id]]);
 assert.deepEqual(tool.sourceReview.documentedRelationships,[]);
 assert.deepEqual(look.sourceReview.observedFile,{fileId:'9746944',filename:'maru_StyledLookCreator261122.zip',platformUploadDate:'2026-11-22',listedGameVersion:'1.129.39',fileChangelog:'not provided',url:styledRelease,uploader:'maru'});
 assert.deepEqual(look.sourceReview.documentedRelationships,[]);
 assert.deepEqual(look.sourceReview.packageWorkflow,{direction:'live_outfit_to_styled_look',outputFolder:'CreatedLooks',outputExtension:'.package',requiresRestartForCas:true,favoritesSyncVerified:false,bidirectionalApplyVerified:false});
 assert.deepEqual(look.sourceReview.authorUpdateNotes.map(n=>[n.date,n.fileChangelog]),[['2026-11-22',false],['2026-11-11',false]]);
 const existing={schema:1,entries:seed.entries.slice(0,3)};
 assert.deepEqual(mergeBackup(existing,seed),{data:seed,added:1,unchanged:3});
 assert.doesNotMatch(JSON.stringify(seed),/https?:\/\/(?:[^/]*forgecdn|x\.com)|\/download\/|\/attachments?\//i);
 const own=change(empty(),'synthetic-own',{...dcc.revisions[0],name:'Unrelated local fixture',ownership:'own'},0);
 const merged=mergeBackup(own,seed);
 assert.deepEqual(merged.data.entries,[...own.entries,...seed.entries]);
 assert.deepEqual(mergeBackup(merged.data,seed),{data:merged.data,added:0,unchanged:4});
 const local=change(merged.data,cc.id,{...cc.revisions[0],name:'My own workflow notes'},1);
 assert.throws(()=>mergeBackup(local,seed),/conflicting project ID/);
 assert.equal(local.entries[2].revisions.at(-1).name,'My own workflow notes');
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
  await load();q('#backup-confirm').onclick();assert.match(q('#notice').textContent,/Imported 4 new projects/);assert.equal(writes,1);
  mounted.unmount();mounted=open();
  q('#ownership').onchange({target:{value:'own'}});assert.equal(q('[data-project]'),null);
  q('#ownership').onchange({target:{value:'followed'}});assert.equal(root.querySelectorAll('[data-project]').length,4);
  for(const [id,name,source,release] of known){
   const card=q('[data-project="'+id+'"]');assert.match(card.textContent,new RegExp(name));
   card.querySelector('button').onclick();
   const links=[...root.querySelectorAll('#detail > a')];assert.deepEqual(links.map(a=>a.getAttribute('href')),[source,...(release?[release]:[])]);
   assert.ok(links.every(a=>a.getAttribute('rel')==='noopener noreferrer'));
  }
  await load();assert.match(q('#notice').textContent,/adds nothing/);assert.equal(writes,1);assert.equal(outgoing,0);
 }finally{mounted?.unmount();globalThis.document=oldDocument;globalThis.fetch=oldFetch;}
});
