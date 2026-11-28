import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {gzipSync} from 'node:zlib';

const input = path.resolve(process.argv[2]);
const native = process.argv[3] ? path.resolve(process.argv[3]) :
  path.join(input, JSON.parse(readFileSync(path.join(input,'native-package.json'),'utf8')).engine);
const runtime = process.argv[3] ? input : path.join(input,'runtime');
const {parseBackup,mergeBackup} = await import(pathToFileURL(path.join(runtime,'workspaces/projects/import.mjs')));
const hash = b => createHash('sha256').update(b).digest('hex');
const dir = mkdtempSync(path.join(tmpdir(),'athena-project-stage '));
const paths = ['chosen export.json.gz','explicit recipe.json','current Projects.json','new candidate.json'].map(n=>path.join(dir,n));
const data = Object.fromEntries('providers projects chats turns turnRevisions outputSnapshots files knowledgeItems knowledgeSources projectContinuity events checkpoints syncReceipts catalogRuns'.split(' ').map(k=>[k,[]]));
Object.assign(data,{schema:'project-constellation',schemaVersion:7,summary:{events:0,checkpoints:0}});
const row = id => ({id,sourceType:'workspace',providerId:'',name:'Same title',archived:false,updatedAt:1700000000001,
                    notes:'never migrate raw notes',description:'private detail',autopilotLedger:{secret:'not from source'}});
data.projects = [row('private-old-a'),row('private-old-b'),{...row('mirror'),sourceType:'provider'}];
let source = gzipSync(Buffer.from(JSON.stringify(data)));
const destination = Buffer.from('{"schema":1,"entries":[]}');
const plan = {schema:1,sourceSha256:hash(source),destinationSha256:hash(destination),namespace:'my-explicit-source-slot',
              selected:[{id:'private-old-a',stage:'testing',ownership:'own'},{id:'private-old-b',stage:'building',ownership:'followed'}]};
try {
 const expected = src => {
   writeFileSync(paths[0],src);
   writeFileSync(paths[2],destination);
 };
 const run = (recipe,ok) => {
   writeFileSync(paths[1],JSON.stringify(recipe));
   const before=paths.slice(0,3).map(f=>hash(readFileSync(f)));
   const out=spawnSync(native,['stage-constellation-projects',...paths],{cwd:dir,encoding:'utf8',timeout:30000});
   assert.equal(out.status===0,ok,out.stderr);
   assert.deepEqual(paths.slice(0,3).map(f=>hash(readFileSync(f))),before);
   assert.doesNotMatch(out.stdout+out.stderr,/private-old|Same title|private detail|not from source|new candidate\.json/);
   return ok?JSON.parse(out.stdout):null;
 };
 expected(source);
 assert.equal(run(plan,true).applied,false);
 const bytes=readFileSync(paths[3]);
 const staged=parseBackup(bytes);
 assert.equal(staged.entries.length,2);
 assert.notEqual(staged.entries[0].id,staged.entries[1].id);
 assert.deepEqual(staged.entries.map(e=>e.revisions[0].stage),['testing','building']);
 assert.deepEqual(staged.entries.map(e=>e.revisions[0].at),[1700000000001,1700000000001]);
 assert.doesNotMatch(bytes.toString(),/private-old|private detail|never migrate|Ledger|not from source/);
 assert.equal(mergeBackup(JSON.parse(destination),staged).added,2);
 assert.equal(mergeBackup(staged,staged).unchanged,2);
 run(plan,false);
 assert.deepEqual(readFileSync(paths[3]),bytes);
 rmSync(paths[3]);
 for(const bad of [{...plan,destinationSha256:'f'.repeat(64)},
                   {...plan,selected:[plan.selected[0],plan.selected[0]]},
                   {...plan,selected:[{...plan.selected[0],id:'mirror'}]},
                   {...plan,selected:[{...plan.selected[0],stage:'assumed'}]}]) {
   run(bad,false);assert.equal(readdirSync(dir).length,3);
 }
 const duplicated=structuredClone(data);duplicated.projects.push(duplicated.projects[0]); 
 source=gzipSync(Buffer.from(JSON.stringify(duplicated)));expected(source);
 run({...plan,sourceSha256:hash(source)},false);
 assert.equal(readdirSync(dir).length,3);
 console.log('PASS exact local CLI and Athena Projects importer: same-label IDs, explicit stage, preserved timestamps, stale inputs and collisions refused, no source changes.');
} finally {rmSync(dir,{recursive:true,force:true});}
