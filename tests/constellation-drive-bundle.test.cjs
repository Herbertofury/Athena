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

const REPLAY=path.resolve(__dirname,'../tools/continuity-review/write-constellation-replay-candidate.mjs');
function replay(f,output){
 const result=spawnSync(process.execPath,[REPLAY,'--index',f.paths.index,'--snapshot',f.paths.snapshot,
   '--journal',f.paths.journal,'--output',output],{encoding:'utf8',cwd:path.dirname(f.paths.index)});
 assert.doesNotMatch(result.stdout+result.stderr,/SECRET-LOCAL|private-marker-123|private-provider-file|quarantine-secret|provider-settings-private/);
 return result;
}

test('private replay merges truly newer overlap without stamping its time, preserves field and isolates review rows',t=>{
 const f=fixture(t);
 const old=t0-50, newer=t0+2;
 const base=[
  {id:'update',createdAt:old-1000,updatedAt:old,title:'before',keep:{nested:true}},
  {id:'conflict',updatedAt:old,title:'base'},
  {id:'same',updatedAt:old,title:'identical'},
  {id:'stale',updatedAt:t0+2,title:'base newer'},
  {id:'dup',updatedAt:old,tags:['a']},{id:'dup',updatedAt:old,tags:['b']},
 ];
 f.snapshot.files=base;f.snapshot.meta={provider:'provider-settings-private'};delete f.snapshot.groups;
 f.journal.files=[
  {id:'update',createdAt:old-500,updatedAt:newer,title:'source journal changed'},
  {id:'conflict',updatedAt:old,title:'same clock different title',secret:'quarantine-secret'},
  {...base[2]},
  {id:'stale',updatedAt:old,title:'old'},
  {id:'new',updatedAt:newer,title:'journal-only'},
  {id:'dup',updatedAt:newer,title:'unresolved duplicate'},
  {id:'unknown-date',updatedAt:null,title:'missing timestamp'},
 ];
 f.journal.groups=[{id:'unseen',updatedAt:newer}];
 f.bundle.journal.recordCount=8;f.store();
 const originals=Object.values(f.paths).map(p=>fs.readFileSync(p));
 const output=path.join(path.dirname(f.paths.index),'new.json'), result=replay(f,output);
 assert.equal(result.status,0,result.stderr);
 const audit=JSON.parse(result.stdout), saved=fs.readFileSync(output), candidate=JSON.parse(saved);
 assert.equal(audit.output.sha256,sha(saved));
 assert.deepEqual(audit.inputHashes,{index:sha(originals[0]),snapshot:sha(originals[1]),journal:sha(originals[2])});
 assert.equal(audit.output.bytes,saved.length);
 assert.equal(candidate.schema,'athena-constellation-replay-candidate-v1');
 assert.deepEqual(candidate.collections.files[0],{id:'update',createdAt:old-1000,updatedAt:newer,title:'source journal changed',keep:{nested:true}});
 assert.deepEqual(candidate.collections.files.slice(1,6),base.slice(1));
 assert.deepEqual(candidate.collections.files[6],f.journal.files[4]);
 assert.deepEqual(candidate.unresolved.files.map(x=>x.reason),
  ['same-timestamp-different-record','duplicate-base-id','journal-timestamp-unrecognized']);
 assert.equal(candidate.unresolved.files[0].baseIndex,1);
 assert.equal(candidate.unresolved.files[0].row.secret,'quarantine-secret');
 assert.equal(candidate.collections.groups,null);
 assert.deepEqual(candidate.unresolved.groups,[{reason:'base-collection-absent',row:f.journal.groups[0]}]);
 assert.equal(candidate.audit.outcomes.files.newerMerged,1);
 assert.equal(candidate.audit.outcomes.files.identical,1);
 assert.equal(candidate.audit.outcomes.files.older,1);
 assert.equal(candidate.audit.unresolvedCount,4);
 assert.doesNotMatch(saved.toString(),/provider-settings-private/);
 assert.deepEqual(Object.values(f.paths).map(p=>fs.readFileSync(p)),originals);
 if(process.platform!=='win32')assert.equal(fs.statSync(output).mode & 0o777,0o600);
 const second=path.join(path.dirname(output),'second.json');
 assert.equal(replay(f,second).status,0);
 assert.deepEqual(fs.readFileSync(second),saved,'same inputs must produce exact same candidate bytes');
});

test('a candidate never overwrites source or existing destination, and failed verification creates nothing',t=>{
 const f=fixture(t);f.store();
 const before=fs.readFileSync(f.paths.snapshot);
 assert.match(replay(f,f.paths.snapshot).stderr,/existing path is never overwritten/);
 assert.deepEqual(fs.readFileSync(f.paths.snapshot),before);
 const output=path.join(path.dirname(f.paths.index),'new-failure.json');
 fs.appendFileSync(f.paths.journal,'corrupted');
 assert.match(replay(f,output).stderr,/did not verify/);
 assert.equal(fs.existsSync(output),false);
 f.store();fs.writeFileSync(output,'existing data');
 assert.match(replay(f,output).stderr,/existing path is never overwritten/);
 assert.equal(fs.readFileSync(output,'utf8'),'existing data');
});

test('intact but stale bundle exposes missing, stale, and same-tick edits against a private independent export',t=>{
 const f=fixture(t);
 const r=(id,updatedAt,body)=>({id,updatedAt,body});
 const secret='omission-test-private';
 const exact=r('a',t0-1,secret), sameTick=r('b',t0,'old'), older=r('c',t0-1,'old');
 f.snapshot.chats=[exact,sameTick,older,r('d',t0+2,'later'),r('e',t0,'a'),r('e',t0,'b'),r('g',t0,'old')];
 f.journal.chats=[r('g',t0,'equal tick conflict')];f.bundle.journal.recordCount=2;
 const source={...f.snapshot,exportedAt:at(t0+4),chats:[{body:secret,updatedAt:t0-1,id:'a'},
  r('b',t0,'edit in same tick'),r('c',t0,'changed'),r('d',t0,'earlier'),
  r('e',t0,'ambiguous'),r('f',t0,'absent'),r('g',t0,'unknown'),r('h',null,'unknown')]};
 delete source.groups;delete f.snapshot.smartCollections;source.smartCollections=[r('some',t0,secret)];
 f.store();const before=Object.values(f.paths).map(p=>fs.readFileSync(p));
 const compare=path.join(path.dirname(f.paths.index),'SECRET-LOCAL-reference.json'),raw=encode(source);
 fs.writeFileSync(compare,raw);
 const result=f.run(true,'--compare-source',compare);
 assert.equal(result.status,0,result.stderr);
 const {sourceComparison:c,warnings}=JSON.parse(result.stdout);
 assert.deepEqual(warnings,[],'index and clocks alone did not expose the absent edit');
 assert.deepEqual(c.collections.chats.counts,{exact:1,notRetained:1,backupOlder:1,
  backupNewer:1,sameTimeDifferent:1,unresolved:3});
 assert.equal(c.collections.smartCollections.coverage,'not-in-backup-snapshot');
 assert.equal(c.collections.smartCollections.counts.unresolved,1);
 assert.equal(c.collections.groups.coverage,'not-in-reference');
 assert.doesNotMatch(result.stdout+result.stderr,/omission-test-private|edit in same tick/);
 assert.deepEqual(Object.values(f.paths).map(p=>fs.readFileSync(p)),before);
 assert.deepEqual(fs.readFileSync(compare),raw);
});

test('comparison refuses a malformed export and does not weaken base verification',t=>{
 const f=fixture(t);f.store();
 const compare=path.join(path.dirname(f.paths.index),'SECRET-LOCAL-reference.json');
 fs.writeFileSync(compare,encode({...f.snapshot,chats:'opaque'}));
 assert.match(f.run(true,'--compare-source',compare).stderr,/invalid known collection/);
 fs.writeFileSync(compare,gzipSync(encode(f.snapshot)));
 assert.match(f.run(true,'--compare-source',compare).stderr,/not a UTF-8 JSON object/);
 fs.appendFileSync(f.paths.snapshot,'corrupt');
 assert.match(f.run(true,'--compare-source',compare).stderr,/does not match the index bytes/);
});
