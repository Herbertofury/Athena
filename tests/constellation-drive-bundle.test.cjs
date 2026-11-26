const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {createHash}=require('node:crypto');
const {gzipSync}=require('node:zlib');
const {spawnSync}=require('node:child_process');

const CLI=path.resolve(__dirname,'../tools/continuity-review/verify-constellation-drive.mjs');
const collections='providers groups projects smartCollections chats turns turnRevisions outputSnapshots files knowledgeItems knowledgeSources projectContinuity events checkpoints syncReceipts catalogRuns projectBaselines integrityFindings'.split(' ');
const nul=() => Object.fromEntries(collections.map(k=>[k,[]]));
const encode=data=>Buffer.from(JSON.stringify(data)+'\n');
const sha=b=>createHash('sha256').update(b).digest('hex');
const t0=Date.parse('2026-11-26T00:00:00.000Z');
const at=n=>new Date(n).toISOString();

function fixture(t,opts={}) {
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'constellation bundle fixture '));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 const paths=Object.fromEntries(['index','snapshot','journal'].map(k=>[k,path.join(root,'SECRET-LOCAL-'+k+'.json')]));
 const snapshot={...nul(),schema:'project-constellation',schemaVersion:7,exportedAt:at(t0),summary:{},
                 chats:[{id:'private-marker-123',body:'a private chat'}]};
 const journal={...nul(),schema:'project-constellation-delta',schemaVersion:1,exportedAt:at(t0+2),baseFullSyncAt:t0+1,
                files:[{id:'private-file-456',url:'https://example.invalid/private-file'}]};
 const bundle={schema:'project-constellation-drive-index',schemaVersion:2,updatedAt:at(t0+3),
              snapshot:{lastFullSyncAt:t0+1,fileId:'private-provider-file'},journal:{baseFullSyncAt:t0+1,recordCount:1,fileId:'private-journal'}};
 const meta=(data,encoding)=>({encoding,size:data.length,sha256:sha(data)});
 function store() {
   const full=opts.identity?encode(snapshot):gzipSync(encode(snapshot)), delta=gzipSync(encode(journal));
   fs.writeFileSync(paths.snapshot,full);fs.writeFileSync(paths.journal,delta);
   if(bundle.snapshot)Object.assign(bundle.snapshot,meta(full,opts.identity?'identity':'gzip'));
   if(bundle.journal)Object.assign(bundle.journal,meta(delta,'gzip'));
   fs.writeFileSync(paths.index,encode(bundle));
 }
 function run(includeJournal=true, ...flags){
   const args=['--index',paths.index,'--snapshot',paths.snapshot];
   if(includeJournal)args.push('--journal',paths.journal);
   const result=spawnSync(process.execPath,[CLI,...args,...flags],{encoding:'utf8',cwd:root});
   assert.doesNotMatch(result.stdout+result.stderr,/private-marker-123|private-file-456|private-provider-file|private-journal|SECRET-LOCAL|a private chat|example\.invalid/);
   return result;
 }
 return {paths,snapshot,journal,bundle,store,run};
}

test('source-shaped compressed bundle verifies exact archive, index, journal count and no writes',t=>{
 const f=fixture(t);f.store();
 const before=Object.values(f.paths).map(p=>fs.readFileSync(p));
 const result=f.run();
 assert.equal(result.status,0,result.stderr);
 const report=JSON.parse(result.stdout);assert.equal(report.schema,'athena-constellation-drive-bundle-review-v1');
 assert.equal(report.index.sha256,sha(before[0]));
 assert.equal(report.snapshot.sha256,sha(before[1]));assert.equal(report.snapshot.retained.chats,1);
 assert.equal(report.journal.sha256,sha(before[2]));assert.equal(report.journal.total,1);
 assert.equal(Object.hasOwn(report,'journalPreview'),false);
 assert.equal(report.journal.records.files,1);assert.equal(report.journal.records.chats,0);
 assert.deepEqual(report.warnings,[]);
 assert.deepEqual(Object.values(f.paths).map(p=>fs.readFileSync(p)),before);
 assert.equal(fs.readdirSync(path.dirname(f.paths.index)).length,3);
});

test('identity snapshot without a declared journal distinguishes absent slice and no journal',t=>{
 const f=fixture(t,{identity:true});f.bundle.journal=null;delete f.snapshot.smartCollections;f.store();
 const result=f.run(false);assert.equal(result.status,0,result.stderr);
 const report=JSON.parse(result.stdout);assert.equal(report.journal,null);
 assert.equal(report.snapshot.encoding,'identity');assert.equal(report.snapshot.retained.smartCollections,null);
 assert.match(f.run(true).stderr,/does not declare the selected journal/);
});

test('declared journal must exist and mixed bundle checkpoints fail even with valid hashes',t=>{
 const f=fixture(t);f.store();
 assert.match(f.run(false).stderr,/select it as well/);
 f.bundle.journal.baseFullSyncAt=t0;f.store();
 assert.match(f.run().stderr,/index journal does not identify the same full checkpoint/);
 f.bundle.journal.baseFullSyncAt=t0+1;f.journal.baseFullSyncAt=t0;f.store();
 assert.match(f.run().stderr,/Journal does not identify the same indexed full checkpoint/);
});

test('hash, encoding and row-count mismatches fail without applying anything',t=>{
 const f=fixture(t);f.store();
 fs.appendFileSync(f.paths.snapshot,'changed');
 assert.match(f.run().stderr,/Snapshot does not match the index bytes/);
 f.store();f.bundle.snapshot.encoding='identity';fs.writeFileSync(f.paths.index,encode(f.bundle));
 assert.match(f.run().stderr,/encoding disagrees/);
 f.bundle.journal.recordCount=999;f.store();
 assert.match(f.run().stderr,/Journal record count differs/);
});

test('rejects unsupported schema and unknown row shape while reporting clock anomalies',t=>{
 const f=fixture(t);f.snapshot.schemaVersion=8;f.store();assert.match(f.run().stderr,/v7 export/);
 f.snapshot.schemaVersion=7;f.journal.groups={};f.store();assert.match(f.run().stderr,/missing an expected collection/);
 f.journal.groups=[];f.journal.exportedAt=at(t0);f.store();
 assert.match(JSON.parse(f.run().stdout).warnings[0],/clock order/);
});

test('refuses invalid gzip, bounded expansion, and linked selected paths',t=>{
 const f=fixture(t);f.store();
 for(const [input,needle] of [
   [Buffer.from([31,139,0]),/gzip is invalid/],
   [gzipSync(Buffer.alloc(16*1024*1024+1,32)),/expands past 16 MiB/]
 ]){
   fs.writeFileSync(f.paths.snapshot,input);Object.assign(f.bundle.snapshot,{size:input.length,sha256:sha(input)});
   fs.writeFileSync(f.paths.index,encode(f.bundle));assert.match(f.run().stderr,needle);
 }
 f.store();
 const file=f.paths.snapshot;fs.renameSync(file,file+'.orig');
 try{fs.symlinkSync(file+'.orig',file);}catch{return;}
 assert.match(f.run().stderr,/not an ordinary file/);
});

test('opt-in journal preview proves historical overlap risk without writing or exposing IDs',async t=>{
 const f=fixture(t);
 const row=(id,updatedAt,secret='private-marker-123')=>({id,updatedAt,secret});
 const old=t0-500;
 f.snapshot.files=[row('updated',old),row('equal',old),row('earlier',old),row('snapshot-duplicate',old),row('snapshot-duplicate',old)];
 f.journal.files=[row('updated',old+3),row('equal',old),row('earlier',old-10),row('only',old+4),
  row('snapshot-duplicate',old+8),row('journal-duplicate',old+10),row('journal-duplicate',old+11),row('date-unknown',null)];
 f.snapshot.files.push(row('date-unknown',old));
 f.bundle.journal.recordCount=f.journal.files.length;f.store();
 const {verifyDriveBundle}=await import('../tools/continuity-review/verify-constellation-drive.mjs');
 const clock=t0+10;
 const report=verifyDriveBundle({...f.paths,previewJournal:true,clock});
 assert.deepEqual(report.journalPreview.total,
  {onlyInJournal:1,newerStoredTime:1,equalStoredTime:1,olderStoredTime:1,unresolved:4,riskOfLegacySkip:2});
 assert.deepEqual(report.journalPreview.collections.files,report.journalPreview.total);
 assert.equal(report.journalPreview.assumedFreshRestoreAt,at(clock));
 assert.doesNotMatch(JSON.stringify(report),/snapshot-duplicate|journal-duplicate|date-unknown|private-marker-123/);
 const before=Object.values(f.paths).map(p=>fs.readFileSync(p));
 const cli=f.run(true,'--preview-journal');
 assert.equal(cli.status,0,cli.stderr);
 assert.equal(JSON.parse(cli.stdout).journalPreview.total.newerStoredTime,1);
 assert.deepEqual(Object.values(f.paths).map(p=>fs.readFileSync(p)),before);
});

test('future relative to modeled restore clock is not mislabeled and absent groups are unknown',async t=>{
 const f=fixture(t);
 delete f.snapshot.groups;
 f.snapshot.chats[0].updatedAt=t0+10;
 f.journal.chats=[{id:f.snapshot.chats[0].id,updatedAt:t0+200}];
 f.journal.groups=[{id:'unseen-group',updatedAt:t0+1}];
 f.bundle.journal.recordCount=3;f.store();
 const {verifyDriveBundle}=await import('../tools/continuity-review/verify-constellation-drive.mjs');
 const {journalPreview:p}=verifyDriveBundle({...f.paths,previewJournal:true,clock:t0+20});
 assert.equal(p.collections.chats.newerStoredTime,1);
 assert.equal(p.collections.chats.riskOfLegacySkip,0);
 assert.equal(p.collections.groups.unresolved,1);assert.equal(p.collections.groups.onlyInJournal,0);
 assert.strictEqual(p.collections.files.onlyInJournal,1);
});

test('a bundle without a declared journal is still verifiable but cannot preview a journal',t=>{
 const f=fixture(t,{identity:true});f.bundle.journal=null;f.store();
 assert.equal(f.run(false).status,0);
 assert.match(f.run(false,'--preview-journal').stderr,/does not|no journal to preview/);
});
