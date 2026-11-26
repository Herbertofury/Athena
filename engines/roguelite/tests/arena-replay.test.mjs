// SPDX-License-Identifier: GPL-3.0-or-later
import {createHash} from 'node:crypto';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ARENA_TAPE_MAX_BYTES,createRecordedArena,encodeArenaTape,decodeArenaTape} from '../src/arena-replay.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
function run(match,n=6000){
 let choices=0;
 for(let i=0;i<n&&match.phase()!=='finished';i++){
  if(match.phase()==='choice'){
   const options=match.snapshot().offers;
   match.choose(options.find(x=>x.id==='speed')?.id??options[0].id);choices++;
  }
  if(match.phase()!=='finished')match.step({keys:i<15?{ArrowRight:true}:{}});
 }
 return choices;
}

test('portable real Arena combat prefix and offspring inputs preserve exact RNG, enemy state and upgrades',async()=>{
 const m=createRecordedArena({seed:42});
 assert.ok(run(m)>0);
 const raw=await encodeArenaTape(m,digest);
 assert.ok(raw.length<5000,'repeated host input ticks compress into short spans');
 const proof=await decodeArenaTape(raw,{digest});
 assert.deepEqual(proof.snapshot(),m.snapshot());
 assert.equal(proof.phase(),m.phase());
 run(m,1000);run(proof,1000);
 assert.equal(await encodeArenaTape(proof,digest),await encodeArenaTape(m,digest));
});

test('rejects altered choices, duplicate keys, stale rules or illegal input without mutating the source',async()=>{
 const m=createRecordedArena({seed:42,format:'endless'});
 run(m,90);
 const raw=await encodeArenaTape(m,digest);
 const unknown=JSON.parse(raw);unknown.rules='different';
 await assert.rejects(decodeArenaTape(JSON.stringify(unknown)+'\n',{digest}),/Incompatible/);
 const redundant=raw.replace('"seed":42','"seed":5,"seed":42');
 await assert.rejects(decodeArenaTape(redundant,{digest}),/canonical/);
 const edited=JSON.parse(raw);edited.seed=99;
 await assert.rejects(decodeArenaTape(JSON.stringify(edited)+'\n',{digest}),/state|movement/);
 const bad=JSON.parse(raw);bad.inputs[0]=['not an offer'];
 await assert.rejects(decodeArenaTape(JSON.stringify(bad)+'\n',{digest}),/pending/);
 await assert.rejects(decodeArenaTape('x'.repeat(ARENA_TAPE_MAX_BYTES+1),{digest}),/size/);
 assert.equal(await encodeArenaTape(m,digest),raw);
});

test('long verification reports only measured frame counts and can stop at a yield boundary',async()=>{
 const m=createRecordedArena({seed:42});
 run(m,6550);
 const raw=await encodeArenaTape(m,digest);
 let stop=false;
 const progress=[];
 await assert.rejects(decodeArenaTape(raw,{digest,onProgress:(n,total)=>progress.push([n,total]),
  yieldTask:async()=>{stop=true},cancelled:()=>stop}),/cancelled/);
 assert.equal(progress[0][0],4096);assert.ok(progress[0][1]>=4096);
});
