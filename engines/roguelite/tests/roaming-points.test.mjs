// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createRoamingPoints} from '../src/roaming-points.mjs';
import {createRecordedArena,encodeArenaTape,decodeArenaTape} from '../src/arena-replay.mjs';
import {followExpedition} from './expedition-fixture.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
const player={x:0,y:0};
test('mining drops a cache, but only proximity awards resources once',()=>{
 const lane=createRoamingPoints(23);assert.equal(lane.advance(player,23),null);
 const node=lane.advance(player,1);assert.equal(node.kind,'geode');
 const xy=[node.x,node.y];assert.equal(lane.advance(player,.5),node);
 assert.notDeepEqual([node.x,node.y],xy);assert.equal(lane.resolve(),null);
 node.hp=0;const cache=lane.resolve();
 assert.deepEqual(lane.collect(player),[]);
 assert.deepEqual(lane.snapshot().balance,{crystal:0,gold:0});
 assert.deepEqual(lane.collect(cache),[cache]);
 assert.equal(lane.resolve(),null);assert.deepEqual(lane.collect(cache),[]);
 assert.deepEqual(lane.snapshot().balance,{crystal:12,gold:0});
});
test('goblin flees; caches and live encounters expire without credit',()=>{
 const a=createRoamingPoints(23), b=createRoamingPoints(23);
 const g=a.advance(player,24);b.advance(player,24);
 assert.deepEqual(a.snapshot(),b.snapshot());g.hp=0;const loot=a.resolve();
 a.advance(player,29);assert.deepEqual(a.collect(loot),[]);
 a.advance(player,48);const before=a.snapshot().live;
 assert.equal(before.kind,'goblin');
 a.advance(player,.5);const after=a.snapshot().live;
 assert.ok(Math.hypot(after.x,after.y)>Math.hypot(before.x,before.y));
 a.advance(player,43);assert.equal(a.snapshot().live,null);
 assert.deepEqual(a.snapshot().balance,{crystal:0,gold:0});
});
test('actual combat collects both resources and exact portable tape reproduces the battle and rewards',async()=>{
 const {h,collections,firstSight,cacheSight}=followExpedition();
 assert.deepEqual(collections,['crystal','gold']);
 assert.ok(firstSight&&cacheSight&&h.snapshot().run.kills>0);
 assert.deepEqual(h.snapshot().roaming.balance,{crystal:12,gold:24});
 assert.ok(h.snapshot().player.level>1);
 const text=await encodeArenaTape(h,digest);
 const restored=await decodeArenaTape(text,{digest});
 assert.deepEqual(restored.snapshot(),h.snapshot());
 for(let i=0;i<25;i++){
  if(h.phase()==='choice'){
   const id=h.snapshot().offers[0].id;h.choose(id);restored.choose(id);
  }else {h.advance(8);restored.advance(8);}
 }
 assert.deepEqual(restored.capture(),h.capture());
 const classic=createRecordedArena({seed:1});classic.advance(0);
 assert.equal(classic.snapshot().roaming,undefined);
});
test('existing formats retain original exact state digests',()=>{
 const originals={
  classic:'11e528282762962a1e398b6b4bdde20b3b8b82e5ec19a3b7df1b505679987c1c',
  'marathon-20':'eeccf0aa9d8a7a2c5f57c615783ce29e3fb8c48f8f1e5a1c1030007a710cd609',
  'marathon-30':'d21f23c43979e3e7113c370d89cecfd7f0cdc5766707f44996d2da5b2376b160',
  'marathon-60':'36e97092ff8fc11a3f15aececa0fcfd553489e2eeefb739b20bd8b729c756ec5',
  'marathon-120':'17fd50c82c7003177a9aa43321bd9bff272fa4b58c341284bbc840be52e98b26',
  endless:'4ceb9ea7a4ed1e44346d05b684eb08aaebf09dccd07f57cb78af1b9de53ccf15',
 };
 for(const [format,expected] of Object.entries(originals)){
  const h=createRecordedArena({seed:42,format});
  for(let i=0;i<3700;i++){
   if(h.phase()==='choice')h.choose(h.snapshot().offers[0].id);
   if(h.phase()==='finished')break;
   h.advance(i%600<300?8:2);
  }
  assert.equal(digest(h.capture().final),expected,format);
 }
});
