// SPDX-License-Identifier: GPL-3.0-or-later
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawnExperienceGem,tickPickupFormulas} from '../src/gamesync-pickup-formulas.mjs';
const p=()=>({x:0,y:0,magnetRange:50,level:1,xp:0,xpToNext:10});
test('original range crossing is collected on the next tick, not before movement',()=>{
 const player=p(),gems=[];
 spawnExperienceGem(gems,20,0,4);
 assert.deepEqual(gems,[{x:20,y:0,xp:4,size:8,life:15,magnetized:false}]);
 assert.deepEqual(tickPickupFormulas({gems,player,dt:.025}),[]);
 assert.equal(player.xp,0);assert.equal(gems[0].x,12.5);assert.equal(gems[0].magnetized,true);
 assert.deepEqual(tickPickupFormulas({gems,player,dt:.01}),[]);assert.equal(player.xp,4);assert.equal(gems.length,0);
});
test('same tick expiry beats pickup and multiple level gates are preserved without rolling an upgrade',()=>{
 const player=p(),gems=[];
 spawnExperienceGem(gems,0,0,1000);gems[0].life=.02;
 spawnExperienceGem(gems,0,0,10);spawnExperienceGem(gems,0,0,18);
 const result=tickPickupFormulas({gems,player,dt:.02});
 assert.equal(gems.length,0);
 assert.deepEqual(result,[{level:2,xp:8,xpToNext:15},{level:3,xp:3,xpToNext:22}]);
 assert.deepEqual(player,{...p(),level:3,xp:3,xpToNext:22});
});

test('pinned original pickup stage agrees through 300 moving ticks and generated gem drops',async()=>{
 const {readFileSync}=await import('node:fs'),{createHash}=await import('node:crypto'),{runInNewContext}=await import('node:vm');
 const raw=readFileSync(new URL('../upstream/gamesync/game-survivors.js',import.meta.url));
 assert.equal(createHash('sha256').update(raw).digest('hex'),'1cd392de5cddcd14845b46324777fc762af8c95a4dc46c0e16ee61a54ff29cc7');
 const src=raw.toString('utf8'),stage=src.slice(src.indexOf('      // Update gems'),src.indexOf('      // Update damage numbers'));
 assert.match(stage,/player.xp \+= g.xp/);
 const core={createCanvas:()=>({}),createInput:()=>({}),createParticleSystem:()=>({}),createButton:()=>({}),
  Audio:{play:()=>{}},pick:items=>items[0]};
 const window={__gsMascotGameCore:core},math=Object.create(Math);math.random=()=>.75;
 const probe=`
   return {spawnGem, probe(dt, position){
     player.x=position.x;player.y=position.y;
${stage}
     return {gems,player:{x:player.x,y:player.y,magnetRange:player.magnetRange,level:player.level,xp:player.xp,xpToNext:player.xpToNext}};
   }};
 `;
 runInNewContext(src.replace('    /* ── Weapon firing',probe+'\n    /* ── Weapon firing'),{window,Math:math});
 const previous=window.__gsMascotGameSurvivors.create(null),player=p(),gems=[];
 let earned=0;
 for(let t=0;t<300;t++){
  const x=t%35-15,y=(t*11)%22-10,dt=t%17===0?.04:.016;
  if(t%3===0){const a=(t*23)%50-20,b=(t*7)%40-15,value=t%17+1;previous.spawnGem(a,b,value);spawnExperienceGem(gems,a,b,value);}
  Object.assign(player,{x,y});const gained=tickPickupFormulas({gems,player,dt});earned+=gained.length;
  assert.equal(JSON.stringify({gems,player}), JSON.stringify(previous.probe(dt,{x,y})));
 }
 assert.ok(earned>4);
});
