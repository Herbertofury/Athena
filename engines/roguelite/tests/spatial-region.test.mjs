import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpatialRegion} from '../src/spatial-region.mjs';
test('two directions on the same seed at the same time lead to different encounters and one paid cache',()=>{
 const north=createSpatialRegion(42),south=createSpatialRegion(42);
 const start=north.snapshot();
 assert.deepEqual(start,south.snapshot());
 const a=north.advance({player:start.battle,dt:0}), b=south.advance({player:start.survey,dt:0});
 assert.equal(a.prompt,true);assert.equal(b.prompt,undefined);
 assert.equal(south.snapshot().seenSurvey,true);
 assert.equal(north.snapshot().violet,47);assert.equal(north.snapshot().amber,54);
 north.choose('region-intervene');
 const support={x:start.battle.x,y:start.battle.y+52};
 for(let i=0;i<4;i++)north.advance({player:support,dt:1});
 assert.ok(north.snapshot().amber<54&&north.snapshot().violet<47);
 north.advance({player:support,dt:1});
 assert.equal(north.advance({player:start.battle,dt:.1}).crystal,8);
 assert.equal(north.advance({player:start.battle,dt:1}).crystal,undefined);
 assert.equal(south.snapshot().state,'unseen');
});
test('both factions take damage in view before the player accepts and unrelated choices cannot steal focus',()=>{
 const h=createSpatialRegion(19),b=h.snapshot().battle;
 const seen=h.advance({player:{x:b.x+130,y:b.y},dt:.5});
 assert.equal(seen.prompt,undefined);
 assert.ok(h.snapshot().amber<54&&h.snapshot().violet<47);
 assert.equal(h.snapshot().state,'unseen');
 assert.equal(h.advance({player:b,dt:.5,choicePending:true}).prompt,undefined);
 assert.equal(h.advance({player:b,dt:0}).prompt,true);
 h.choose('region-detour');
 assert.equal(h.snapshot().cache,null);
 assert.equal(h.advance({player:b,dt:1}).prompt,undefined);
});

import {createHash} from 'node:crypto';
import {encodeArenaTape,decodeArenaTape} from '../src/arena-replay.mjs';
import {createRiftExpedition} from '../src/rift-expedition.mjs';
import {followFrontier,interveneAndAdvance,frontierFormat} from './frontier-fixture.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
test('ordinary movement takes equal-length routes to distinct discoveries, then real cache and replay work',async()=>{
 const {yes,no,ticks}=followFrontier();
 const fight=yes.snapshot(),survey=no.snapshot();
 assert.ok(ticks>200);
 assert.equal(fight.gameTime,survey.gameTime);
 assert.equal(fight.arenaFormat.seconds,1800);
 assert.equal(fight.region.state,'decision');
 assert.equal(survey.region.state,'unseen');
 assert.equal(survey.region.seenSurvey,true);
 assert.ok(fight.region.amber<54&&fight.region.violet<47);
 const raw=await encodeArenaTape(yes,digest);
 const detour=await decodeArenaTape(raw,{digest});detour.choose('region-detour');
 assert.equal(detour.snapshot().region.bankedCrystal,0);
 interveneAndAdvance(yes,90);
 assert.equal(yes.snapshot().region.state,'intervening');
 const restored=await decodeArenaTape(await encodeArenaTape(yes,digest),{digest});
 interveneAndAdvance(yes,240);interveneAndAdvance(restored,240);
 assert.deepEqual(restored.snapshot(),yes.snapshot());
 assert.equal(restored.snapshot().region.bankedCrystal,8);
 assert.equal(restored.snapshot().region.paid,true);
 const before=restored.snapshot().camp.balance.crystal;
 interveneAndAdvance(restored,120);
 assert.equal(restored.snapshot().region.bankedCrystal,8);
 assert.equal(restored.snapshot().camp.balance.crystal,before);
});
test('the actual 30-minute parent continues past 20 and finishes at 30',()=>{
 const h=createRiftExpedition({seed:7,random:()=>.4,withCamp:true,regionFormat:frontierFormat});
 let pastShortEnd=false;
 for(let i=0;i<=36000;i++){
  const step=h.step({dt:.05,keys:{KeyD:true}});
  if(step.status==='choice'){
   const offers=h.frameView().offers;
   h.choose((offers.find(o=>['rift-stay','camp-stay','region-detour','speed'].includes(o.id))??offers[0]).id);
  }
  if(i===25000){pastShortEnd=true;assert.ok(h.snapshot().gameTime>1200);}
  if(step.status==='finished')break;
 }
 assert.equal(pastShortEnd,true);
 assert.equal(h.snapshot().run.won,true);
 assert.ok(h.snapshot().gameTime>=1800&&h.snapshot().gameTime<1800.05);
});

test('abandoning the battle area changes the outcome and never creates a claim',()=>{
 const h=createSpatialRegion(31),point=h.snapshot().battle;
 h.advance({player:point,dt:0});h.choose('region-intervene');
 for(let i=0;i<6;i++)h.advance({player:{x:0,y:0},dt:1});
 assert.equal(h.snapshot().amber,0);
 assert.equal(h.snapshot().state,'resolved');
 assert.equal(h.snapshot().cache,null);
 assert.equal(h.advance({player:point,dt:1}).crystal,undefined);
});
