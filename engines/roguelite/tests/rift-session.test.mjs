// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRiftSession} from '../src/rift-session.mjs';
import {createLegacySurvivorRun} from '../src/legacy-survivor-run.mjs';
const engine=(format='classic')=>createLegacySurvivorRun({format,random:()=>.4});
const factory=({minutes})=>createLegacySurvivorRun({sideMinutes:minutes,random:()=>.4});
function live(host,maxTicks=13000){
 for(let t=0;t<maxTicks;t++){
  const next=host.step({dt:.05,keys:{KeyD:true}});
  if(next.status==='choice'){
   const o=host.snapshot().offers;host.choose((o.find(x=>x.id==='speed')??o[0]).id);
  }
  if(next.rift)return next.rift;
 }
 return null;
}
test('real 10/20/30-minute side matches advance while original and twin remain byte-identical',()=>{
 for(const minutes of [10,20,30]){
 const main=engine(),twin=engine();
 const rift=createRiftSession({main,createSide:factory});
 for(let i=0;i<180;i++){
  const input={dt:.05,keys:{KeyD:true}};
  rift.step(input);twin.step(input);
 }
 const frozen=twin.snapshot();
 rift.enter({minutes,seed:9});
 assert.equal(rift.snapshot().rift.mainTime,frozen.gameTime);
 assert.throws(()=>rift.enter({minutes:20,seed:9}),/current rift/);
 const result=live(rift,minutes*60*20+2);
 const reward={crystal:6*(minutes/10),gold:12*(minutes/10)};
 assert.deepEqual(result,{result:'won',minutes,route:1,reward});
 assert.deepEqual(main.snapshot(),frozen);
 assert.deepEqual(rift.snapshot().rift.earned,reward);
 rift.step({dt:.05,keys:{KeyD:true}});twin.step({dt:.05,keys:{KeyD:true}});
 assert.deepEqual(main.snapshot(),twin.snapshot());
 }
});
test('abandoning midway never pays and does not apply side-run damage or movement to the main run',()=>{
 const main=engine(),r=createRiftSession({main,createSide:factory});
 const before=main.snapshot();
 assert.throws(()=>r.enter({minutes:5,seed:1}),/Invalid/);
 r.enter({minutes:30,seed:7});
 for(let i=0;i<30;i++)r.step({dt:.05,keys:{KeyA:true}});
 assert.notDeepEqual(r.snapshot().player.x,before.player.x);
 assert.equal(r.abandon().result,'abandoned');
 assert.equal(r.abandon(),null);
 assert.deepEqual(main.snapshot(),before);
 assert.deepEqual(r.snapshot().rift.earned,{crystal:0,gold:0});
});
