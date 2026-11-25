// SPDX-License-Identifier: GPL-3.0-or-later
// Microbenchmark: state projection only, not integrated FPS or a release gate.
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {createRecordedArena} from '../src/arena-replay.mjs';
const h=createRecordedArena({format:'marathon-120',seed:3});
for(let i=0;i<25000;i++){
 if(h.phase()==='choice'){
  const offers=h.snapshot().offers;h.choose((offers.find(o=>o.id==='speed')??offers[0]).id);
 }
 if(h.phase()==='finished')break;
 h.advance(8);
}
const population=h.snapshot().enemies.length;
assert.ok(population>=40);
const measure=(fn,count)=>{
 let seen=0;const time=performance.now();
 for(let i=0;i<count;i++){
  const v=fn();seen+=v.enemies.length+v.player.weapons.length+v.gems.length+v.projectiles.length;
 }
 return {usPerProjection:(performance.now()-time)*1000/count,seen};
};
measure(h.frameView,3000);measure(h.snapshot,3000);
const values={full:[],paint:[]};
for(let sample=0;sample<12;sample++){
 let full,paint;
 if(sample%2){full=measure(h.snapshot,3000);paint=measure(h.frameView,3000);}
 else {paint=measure(h.frameView,3000);full=measure(h.snapshot,3000);}
 assert.equal(full.seen,paint.seen);
 values.full.push(full.usPerProjection);values.paint.push(paint.usPerProjection);
}
const median=rs=>{rs.sort((a,b)=>a-b);return (rs[5]+rs[6])/2;};
const baseline=median(values.full),replacement=median(values.paint);
console.log(JSON.stringify({platform:process.platform,node:process.version,population,countPerSample:3000,samples:12,
 fullMedianMicroseconds:baseline,paintMedianMicroseconds:replacement,ratio:baseline/replacement}));
