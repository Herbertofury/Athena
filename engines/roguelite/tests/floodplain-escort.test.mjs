// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createFloodplainEscort} from '../src/floodplain-escort.mjs';
test('an escort follows the bending river only when approached and recruitment requires actually reaching the far dock',()=>{
 const h=createFloodplainEscort(42), base=h.snapshot();
 assert.deepEqual(base,createFloodplainEscort(42).snapshot());
 assert.equal(h.advance({x:0,y:0},100),null);
 assert.equal(h.advance(base.dock,0.1),null);
 assert.equal(h.advance(base.start,.1).kind,'discover');
 assert.equal(h.advance(base.start,.1).kind,'launch');
 let usedBend=false;
 for(let i=0;i<1000;i++){
  const here=h.snapshot();
  if(here.leg===1)usedBend=true;
  if(h.advance(here.position,1/60)?.kind==='dock')break;
 }
 assert.ok(usedBend);
 assert.equal(h.snapshot().state,'docked');
 assert.ok(h.snapshot().hull>80&&h.snapshot().hull<100);
 assert.equal(h.snapshot().recruited,false);
 assert.equal(h.advance(base.start,.1),null);
 assert.deepEqual(h.advance(base.dock,.1),{kind:'recruit',companion:base.companion});
 assert.equal(h.advance(base.dock,.1),null);
});
test('leaving the moving skiff unprotected produces a real failure, not a delayed reward',()=>{
 const h=createFloodplainEscort(42), p=h.snapshot();
 h.advance(p.start,.1);h.advance(p.start,.1);
 for(let i=0;i<60;i++)h.advance({x:0,y:0},.2);
 assert.equal(h.snapshot().state,'lost');
 assert.equal(h.snapshot().hull,0);
 assert.equal(h.advance(p.dock,60),null);
 assert.equal(h.snapshot().recruited,false);
});
import {createRecordedArena,encodeArenaTape,decodeArenaTape} from '../src/arena-replay.mjs';
import {createRiftExpedition} from '../src/rift-expedition.mjs';
import {createHash} from 'node:crypto';
import {choose,walk} from './ashglass-fixture.mjs';
const format='frontier-expedition-90', digest=s=>createHash('sha256').update(s).digest('hex');
test('real Arena movement launches, resumes the escort and recruits at the dock without double granting medicine',async()=>{
 const h=createRecordedArena({seed:42,format});
 const {start,dock}=h.snapshot().escort;
 const escort=()=>h.snapshot().escort;
 walk(h,{...start,id:'ferry-launch'},()=>escort().state==='escorting',3500);
 for(let i=0;i<130;i++){
  if(h.phase()==='choice')choose(h);
  h.advance(0);
 }
 const recovered=await decodeArenaTape(await encodeArenaTape(h,digest),{digest});
 assert.deepEqual(h.snapshot(),recovered.snapshot());
 for(let n=0;n<2000&&recovered.frameView().escort.state==='escorting';n++){
  if(recovered.phase()==='choice')choose(recovered);
  const q=recovered.frameView(),{position}=q.escort,{x,y}=q.player,dx=position.x-x,dy=position.y-y;
  recovered.advance((Math.abs(dx)<12?0:dx>0?8:4)|(Math.abs(dy)<12?0:dy>0?2:1));
 }
 assert.equal(recovered.snapshot().escort.state,'docked');
 assert.equal(recovered.snapshot().escort.remedies,0);
 walk(recovered,{...dock,id:'ferry-dock'},()=>recovered.snapshot().escort.recruited);
 assert.equal(recovered.snapshot().escort.remedies,2);
 for(let i=0;i<10;i++)recovered.advance(0);
 assert.equal(recovered.snapshot().escort.remedies,2);
 assert.throws(()=>recovered.choose('camp-ferryman-remedy'),/No such pending/);
});
test('real 90-minute parent survives past 60 and finishes at the 90-minute boundary',()=>{
 const h=createRiftExpedition({seed:7,random:()=>.4,withCamp:true,withCavern:true,withEscort:true,regionFormat:format});
 let past60=false;
 for(let i=0;i<=108000;i++){
  const step=h.step({dt:.05,keys:{KeyD:true}});
  if(step.status==='choice')choose(h);
  if(i===80000)past60=h.snapshot().gameTime>3600;
  if(step.status==='finished')break;
 }
 assert.equal(past60,true);
 assert.equal(h.snapshot().run.won,true);
 assert.ok(h.snapshot().gameTime>=5400&&h.snapshot().gameTime<5400.05);
});
import {reachFloodplain} from './floodplain-fixture.mjs';
test('choosing camp recovery spends one earned remedy and heals actual damage without altering cash or rank',async()=>{
 const {injuredCamp:h}=reachFloodplain();
 const before=h.snapshot();
 assert.ok(before.player.hp<before.player.maxHp);
 const remedy=h.choose('camp-ferryman-remedy');
 const after=h.snapshot();
 assert.equal(after.escort.remedies,1);
 assert.equal(after.player.hp-before.player.hp,remedy.camp.recovery);
 assert.ok(after.player.hp<=after.player.maxHp);
 assert.deepEqual(after.camp.ranks,before.camp.ranks);assert.deepEqual(after.camp.balance,before.camp.balance);
 assert.throws(()=>h.choose('camp-ferryman-remedy'),/No such pending/);
 assert.deepEqual((await decodeArenaTape(await encodeArenaTape(h,digest),{digest})).snapshot(),after);
});
