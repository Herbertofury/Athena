import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rename, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildFixedStep } from '../build-fixed-step.mjs';

const runCommand=promisify(execFile);
async function bundle(t){
 const root=await mkdtemp(resolve(tmpdir(),'athena-survivors-'));
 t.after(()=>rm(root,{recursive:true,force:true}));
 const staged=resolve(root,'draft');await buildFixedStep(staged);
 const moved=resolve(root,'moved engine with spaces');await rename(staged,moved);
 const {createSurvivorsRun}=await import(pathToFileURL(resolve(moved,'survivors.mjs')));
 return {createSurvivorsRun,moved};
}
function complete(create,seed){
 const run=create({seed});const checkpoints=[];
 for(let i=0;i<19500;i++){
  const phase=run.step();
  if(phase==='draft'){
   const state=run.inspect();checkpoints.push({time:state.activeTicks,offer:state.pending});
   run.step({upgrade:state.pending.at(-1).id});
  }
  if(phase==='won'||phase==='lost')break;
 }
 return {final:run.inspect(),checkpoints};
}

test('real five-minute run replays exactly; deterministic second seed can lose',async t=>{
 const {createSurvivorsRun:create}=await bundle(t);
 const original=Math.random,clock=Date.now;let a,b,c;
 Math.random=Date.now=()=>{throw Error('Ambient input or entropy')};
 try{a=complete(create,123);b=complete(create,123);c=complete(create,22);}
 finally{Math.random=original;Date.now=clock;}
 assert.deepEqual(a,b);
 assert.equal(a.final.phase,'won');assert.equal(a.final.activeTicks,18000);
 assert.equal(a.final.kills,126);assert.equal(a.final.player.level,6);
 assert.ok(a.checkpoints.length>=3);assert.ok(a.checkpoints.every(c=>new Set(c.offer.map(v=>v.id)).size===3));
 assert.equal(c.final.phase,'lost');assert.equal(c.final.activeTicks,16096);
 assert.ok(c.final.player.hp<=0);
});

test('real upgrade pause is time-preserving, with explicit input and no mutable leaks',async t=>{
 const {createSurvivorsRun:create}=await bundle(t);
 const r=create({seed:123,seconds:90});let s;
 for(let i=0;i<4000;i++)if(r.step()==='draft'){s=r.inspect();break;}
 assert.ok(s);assert.equal(s.pending.length,3);
 for(let i=0;i<20;i++)assert.equal(r.step({dx:1,dash:true}),'draft');
 assert.deepEqual(r.inspect(),s);
 assert.throws(()=>r.step({upgrade:'unoffered'}),/listed/);assert.deepEqual(r.inspect(),s);
 const visible=structuredClone(s);s.player.hp=-400;s.pending[0].id='local change';
 assert.deepEqual(r.inspect(),visible);
 assert.equal(r.step({upgrade:visible.pending[0].id}),'running');
 assert.equal(r.inspect().activeTicks,visible.activeTicks);
 assert.equal(r.inspect().player.regen,1);
 r.step({dx:1,dash:true});
 assert.ok(r.inspect().player.x>80);assert.ok(r.inspect().player.dashCooldown>0);
 assert.equal(r.inspect().activeTicks,visible.activeTicks+1);
});

test('offline relocated terminal accepts player input and demo reaches a real ending',async t=>{
 const {moved}=await bundle(t);
 const a=await runCommand(process.execPath,['play.mjs','--demo','123','300'],{cwd:moved});
 assert.equal(JSON.parse(a.stdout).phase,'won');
 await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['play.mjs','123','5'],{cwd:moved});
  let text='',phase=0;
  const timer=setTimeout(()=>{child.kill();reject(Error('Terminal did not accept input'));},8000);
  child.stdin.on('error',()=>{});child.stderr.on('data',b=>{text+=b;});
  child.stdout.on('data',b=>{
   text+=b;
   if(phase===0&&text.includes('Move, wait, or exit > ')){phase=1;child.stdin.write('d!\n');}
   if(phase===1&&text.includes('1.0/5s')&&text.indexOf('Move, wait, or exit > ')!==text.lastIndexOf('Move, wait, or exit > ')){
    phase=2;child.stdin.write('exit\n');
   }
  });
  child.once('error',e=>{clearTimeout(timer);reject(e);});
  child.once('close',code=>{clearTimeout(timer);try{
   assert.equal(code,0);assert.equal(phase,2);assert.match(text,/@/);resolve();
  }catch(e){reject(e);}});
 });
});

test('rejects invalid seeds/durations/actions and refuses existing output',async t=>{
 const {moved,createSurvivorsRun:create}=await bundle(t);
 for(const options of [{seed:-1},{seed:0,seconds:4},{seed:0,seconds:601},{seed:0,seconds:9.1}]){
  assert.throws(()=>create(options));
 }
 const r=create({seed:5});
 assert.throws(()=>r.step({dx:9}));assert.equal(r.inspect().activeTicks,0);
 assert.throws(()=>r.step({upgrade:'hp'}));assert.equal(r.inspect().activeTicks,0);
 await assert.rejects(buildFixedStep(moved),e=>e.code==='EEXIST');
});
