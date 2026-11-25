// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRiftExpedition} from '../src/rift-expedition.mjs';
test('a real journey finds a rift and explicitly enters, freezes, and abandons it',()=>{
 const h=createRiftExpedition({seed:1,random:()=>.4});
 for(let i=0;i<6000;i++){
  const s=h.snapshot();
  const point=s.portal.marker;
  const dx=point?point.x-s.player.x:1,dy=point?point.y-s.player.y:0;
  const keys={KeyA:dx<-4,KeyD:dx>4||!point,KeyW:dy<-4,KeyS:dy>4};
  const t=h.step({dt:.025,keys});
  assert.notEqual(t.status,'finished');
  if(t.status!=='choice')continue;
  const o=h.snapshot().offers;
  if(o[0].id!=='rift-enter'){h.choose((o.find(x=>x.id==='speed')??o[0]).id);continue;}
  const parent=h.snapshot();
  h.choose('rift-enter');
  assert.ok(h.snapshot().rift.active?.minutes>=10);
  assert.equal(h.snapshot().rift.mainTime,parent.gameTime);
  assert.equal(h.snapshot().gameTime,0);
  for(let j=0;j<25;j++)h.step({dt:.025,keys:{KeyW:true}});
  assert.equal(h.captureSuspended().main.gameTime,parent.gameTime);
  h.choose('rift-abandon');
  assert.deepEqual(h.snapshot().player,parent.player);
  assert.deepEqual(h.snapshot().run,parent.run);
  assert.equal(h.snapshot().gameTime,parent.gameTime);
  assert.equal(h.snapshot().rift.last.result,'abandoned');
  return;
 }
 assert.fail('the fixture did not reach a real portal');
});

import {createHash} from 'node:crypto';
import {encodeArenaTape,decodeArenaTape} from '../src/arena-replay.mjs';
import {reachRift} from './rift-fixture.mjs';
const digest=s=>createHash('sha256').update(s).digest('hex');
test('portable rift tape keeps the parent world and independent entropy and records explicit exit',async()=>{
 const source=reachRift(), before=source.snapshot();
 assert.ok(before.portal.awaitingDecision);assert.equal(source.phase(),'choice');
 const offerTape=await encodeArenaTape(source,digest);
 const declined=await decodeArenaTape(offerTape,{digest});
 declined.choose('rift-stay');assert.equal(declined.snapshot().rift.active,null);
 source.choose('rift-enter');assert.equal(source.snapshot().gameTime,0);
 for(let i=0;i<90;i++)source.advance(1);
 const view=JSON.parse(source.capture().final);
 assert.ok(view.suspended.main.player);
 assert.ok(Number.isInteger(view.suspended.sideEntropy));
 assert.equal(view.world.rift.mainTime,view.suspended.main.gameTime);
 const tape=await encodeArenaTape(source,digest);
 const reopened=await decodeArenaTape(tape,{digest});
 assert.deepEqual(reopened.snapshot(),source.snapshot());
 source.choose('rift-abandon');reopened.choose('rift-abandon');
 assert.equal(reopened.snapshot().rift.last.result,'abandoned');
 assert.deepEqual(reopened.snapshot().player,before.player);
 assert.deepEqual(reopened.snapshot().run,before.run);
 assert.equal(reopened.phase(),'running');
 const exitTape=await encodeArenaTape(reopened,digest);
 const fromExit=await decodeArenaTape(exitTape,{digest});
 assert.deepEqual(fromExit.snapshot(),source.snapshot());
 await assert.rejects(decodeArenaTape(tape.replace('"rift-enter"','"rift-stay"'),{digest}),/choice|match|tape|ended/i);
});
