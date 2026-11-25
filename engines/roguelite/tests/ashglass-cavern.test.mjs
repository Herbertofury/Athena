// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createAshglassCavern} from '../src/ashglass-cavern.mjs';
test('walking the mirrored surface route does not find the cave; approaching the seeded entrance does',()=>{
 const cave=createAshglassCavern(42), replay=createAshglassCavern(42);
 const {mouth,pedestal,mirrors,order}=cave.snapshot();
 assert.deepEqual(cave.snapshot(),replay.snapshot());
 assert.notDeepEqual(cave.snapshot().mouth,createAshglassCavern(43).snapshot().mouth);
 assert.equal(cave.visit({x:-mouth.x,y:-mouth.y}),null);
 assert.equal(cave.visit(pedestal),null);
 assert.deepEqual(cave.visit(mouth),{kind:'discover'});
 assert.equal(cave.visit(pedestal),null);
 assert.equal(cave.visit(mirrors[order[1]]).kind,'realign');
 for(const i of order){
  cave.visit(mouth);
  const e=cave.visit(mirrors[i]);
  assert.ok(['align','unlock'].includes(e.kind));
  assert.equal(cave.visit(mirrors[i]),null);
 }
 assert.equal(cave.snapshot().vaultOpen,true);
 assert.equal(cave.snapshot().wrongTurns,1);
 assert.deepEqual(cave.visit(pedestal),{kind:'claim',gold:34});
 assert.equal(cave.visit(pedestal),null);
 assert.equal(cave.visit(mouth),null);
 assert.equal(cave.visit(pedestal),null);
 assert.equal(cave.snapshot().taken,true);
});
test('room addresses are stable, reachable and order is a non-repeating permutation',()=>{
 for(let seed=0;seed<1024;seed++){
  const a=createAshglassCavern(seed).snapshot();
  assert.ok(Math.abs(a.mouth.x)>2000);
  assert.equal(new Set(a.order).size,3);
  assert.equal(a.mirrors.length,3);
  for(const [i,m] of a.mirrors.entries()){
   assert.ok(Math.hypot(m.x-a.mouth.x,m.y-a.mouth.y)<200);
   for(const other of [...a.mirrors.slice(i+1),a.pedestal])assert.ok(Math.hypot(m.x-other.x,m.y-other.y)>m.r+other.r);
  }
  assert.equal(new Set([...a.mirrors,a.pedestal].map(m=>m.id)).size,4);
 }
});
import {createRecordedArena,encodeArenaTape,decodeArenaTape} from '../src/arena-replay.mjs';
import {createRiftExpedition} from '../src/rift-expedition.mjs';
import {createHash} from 'node:crypto';
import {ashglassFormat as format,choose,walk} from './ashglass-fixture.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
test('real walking discovers the rare cavern, exact mid-puzzle replay resumes and funds the same run only once',async()=>{
 const h=createRecordedArena({seed:42,format});
 const {mouth,mirrors,order,pedestal}=h.snapshot().cavern;
 walk(h,mouth,()=>h.snapshot().cavern.entered);
 walk(h,mirrors[order[0]],()=>h.snapshot().cavern.aligned===1);
 const saved=await encodeArenaTape(h,digest);
 const next=await decodeArenaTape(saved,{digest});
 assert.deepEqual(next.snapshot(),h.snapshot());
 const prior=next.snapshot().camp.balance.gold;
 walk(next,mirrors[order[1]],()=>next.snapshot().cavern.aligned===2);
 walk(next,mirrors[order[2]],()=>next.snapshot().cavern.vaultOpen);
 assert.equal(next.snapshot().cavern.bankedGold,0);
 walk(next,pedestal,()=>next.snapshot().cavern.taken);
 assert.equal(next.snapshot().cavern.bankedGold,34);
 assert.equal(next.snapshot().camp.balance.gold,prior+34);
 for(let n=0;n<15;n++)next.advance(0);
 assert.equal(next.snapshot().cavern.bankedGold,34);
});
test('recipe is a real 60-minute parent rather than a menu relabel',()=>{
 const h=createRiftExpedition({seed:7,random:()=>.4,withCamp:true,withCavern:true,regionFormat:format});
 for(let i=0;i<=72000;i++){
  const step=h.step({dt:.05,keys:{KeyD:true}});
  if(step.status==='choice')choose(h);
  if(i===40000)assert.ok(h.snapshot().gameTime>1800);
  if(step.status==='finished')break;
 }
 assert.equal(h.snapshot().run.won,true);
 assert.ok(h.snapshot().gameTime>=3600&&h.snapshot().gameTime<3600.05);
});
