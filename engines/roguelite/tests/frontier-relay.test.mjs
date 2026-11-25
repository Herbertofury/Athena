// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createFrontierRelay} from '../src/frontier-relay.mjs';
test('successive supply and watch posts use distinct physical actions with no extra background state',()=>{
 const r=createFrontierRelay(42), first=r.snapshot().post;
 assert.equal(r.advance({x:0,y:0},500),null);
 assert.equal(r.advance(first,1,{choicePending:true}),null);
 assert.deepEqual(r.advance(first,0),{prompt:true});r.choose('relay-supply');
 assert.equal(r.advance(first,1),null);
 const supply=r.snapshot().next;
 assert.notDeepEqual(supply,first);
 assert.equal(r.advance(supply,1).cleared,'Recover the supply sled');
 assert.deepEqual(r.advance(first,0).earned,{gold:24,crystal:0});
 const next=r.snapshot().post;
 assert.ok(Math.hypot(next.x-first.x,next.y-first.y)>850);
 assert.equal(r.advance(first,50),null);
 assert.deepEqual(r.advance(next,0),{prompt:true});r.choose('relay-watch');
 const a=r.snapshot().next;
 assert.equal(r.advance(a,1),null);assert.equal(r.advance(next,2),null);assert.equal(r.snapshot().progress,0);
 assert.equal(r.advance(a,2.3).cleared,'Light the lower beacon');
 const b=r.snapshot().next;
 assert.notDeepEqual(a,b);
 assert.equal(r.advance(b,2.3).cleared,'Light the ridge beacon');
 assert.deepEqual(r.advance(next,0).earned,{gold:0,crystal:12});
 assert.equal(r.snapshot().sequence,3);
 assert.equal(r.snapshot().completed,2);
});
test('decline does not immediately reopen and revisiting allows another attempt',()=>{
 const h=createFrontierRelay(7), p=h.snapshot().post;
 assert.deepEqual(h.advance(p,0),{prompt:true});h.choose('relay-leave');
 assert.equal(h.advance(p,50),null);
 h.advance({x:0,y:0},1);
 assert.deepEqual(h.advance(p,.1),{prompt:true});
});
import {createHash} from 'node:crypto';
import {encodeArenaTape,decodeArenaTape} from '../src/arena-replay.mjs';
import {relayTrail,relayFormat} from './frontier-relay-fixture.mjs';
import {createRiftExpedition} from '../src/rift-expedition.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
test('two relays reached by ordinary movement grow the camp wallet and re-decode at their exact next station',async()=>{
 const {first,loaded,paid,second,finished}=relayTrail(), result=finished.snapshot();
 assert.equal(result.relay.completed,2);
 assert.deepEqual(result.relay.bank,{gold:24,crystal:12});
 assert.ok(result.camp.balance.gold>=24&&result.camp.balance.crystal>=12);
 assert.notDeepEqual(JSON.parse(first.final).world.relay.post,result.relay.post);
 assert.equal(JSON.parse(loaded.final).world.relay.completed,0);
 assert.equal(JSON.parse(paid.final).world.relay.completed,1);
 assert.equal(JSON.parse(second.final).world.relay.route,'decision');
 const decoded=await decodeArenaTape(await encodeArenaTape(finished,digest),{digest});
 assert.deepEqual(decoded.snapshot(),result);
});
test('Endless Frontier maintains actual play, waves and location discoveries after the 90-minute ceiling',()=>{
 const h=createRiftExpedition({seed:7,random:()=>.4,withCamp:true,withCavern:true,withEscort:true,withRelay:true,regionFormat:relayFormat});
 for(let i=0;i<121000;i++){
  const step=h.step({dt:.05,keys:{KeyD:true}});
  assert.notEqual(step.status,'finished');
  if(step.status==='choice'){const offers=h.frameView().offers;h.choose((offers.find(o=>['rift-stay','camp-stay','relay-leave','region-detour','speed'].includes(o.id))??offers[0]).id);}
 }
 const snapshot=h.snapshot();
 assert.ok(snapshot.gameTime>6000);
 assert.equal(snapshot.arenaFormat.seconds,null);
 assert.ok(snapshot.arenaFormat.wave>=40);
 assert.equal(snapshot.run.won,false);
 assert.ok(snapshot.relay.post);
});
