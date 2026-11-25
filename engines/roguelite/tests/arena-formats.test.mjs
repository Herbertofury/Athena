// SPDX-License-Identifier: GPL-3.0-or-later
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ARENA_FORMATS,arenaFormat,endurancePressure} from '../src/arena-formats.mjs';
import {createLegacySurvivorRun} from '../src/legacy-survivor-run.mjs';
test('legacy remains five minutes and alternate formats define exact bounded durations',()=>{
 assert.deepEqual(ARENA_FORMATS.map(p=>p.seconds),[300,1200,1800,3600,7200,null]);
 const classic=createLegacySurvivorRun({random:()=>.4});
 assert.equal(classic.snapshot().arenaFormat,undefined);
 assert.throws(()=>createLegacySurvivorRun({random:()=>.4,format:'unknown'}),/Unknown/);
 assert.equal(classic.step({dt:300}).status,'finished');
 assert.equal(classic.snapshot().run.won,true);
 const marathon=arenaFormat('marathon-20');
 const phases=[0,195,470,770,1199].map(t=>endurancePressure(marathon,t));
 assert.deepEqual(phases.map(p=>p.stage),['onset','surge','siege','overrun','finale']);
 assert.deepEqual(phases.map(p=>p.activeLimit),[45,65,85,105,125]);
 const infinite=arenaFormat('endless');
 assert.deepEqual([1199,1200,1229,1230,1320,1380].map(t=>endurancePressure(infinite,t).stage),
  ['finale','breather','breather','endless-surge','breather','endless-surge']);
 assert.equal(endurancePressure(infinite,1320).wave,2);
 assert.ok(endurancePressure(infinite,10**10).scale<=1.75);
});
function simulate(format,seconds){
 const h=createLegacySurvivorRun({random:()=>.4,format});
 let choices=0;
 for(let i=0;i<=seconds*20;i++){
  const tick=h.step({dt:.05,keys:{KeyD:true}});
  if(tick.status==='choice'){
   const keys=h.snapshot().offers;
   h.choose(keys.some(k=>k.id==='speed')?'speed':keys[0].id);choices++;
  }
  if(i%300===0){
   const s=h.snapshot();
   assert.ok(s.enemies.length<=s.arenaFormat.activeLimit);
  }
  if(tick.status==='finished')break;
 }
 return {s:h.snapshot(),choices};
}
test('actual deterministic inputs finish all four marathons; Endless stays open and enters its next wave',()=>{
 for(const id of ['marathon-20','marathon-30','marathon-60','marathon-120']){
  const target=arenaFormat(id).seconds, {s}=simulate(id,target);
  assert.ok(s.gameTime>=target&&s.gameTime<target+.1);
  assert.equal(s.run.won,true);assert.equal(s.run.gameOver,true);
  assert.equal(s.arenaFormat.stage,'finale');assert.ok(s.arenaFormat.missedSpawns>0);
 }
 const e=simulate('endless',1320).s;
 assert.ok(e.gameTime>=1320&&e.gameTime<1320.1);
 assert.equal(e.run.gameOver,false);
 assert.equal(e.arenaFormat.stage,'breather');assert.equal(e.arenaFormat.wave,2);
});
