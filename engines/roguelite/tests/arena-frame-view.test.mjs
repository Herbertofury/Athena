// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import {ARENA_FORMATS} from '../src/arena-formats.mjs';
import {createRecordedArena} from '../src/arena-replay.mjs';
import {reachRift} from './rift-fixture.mjs';
const pick=(from,keys)=>Object.fromEntries(keys.map(key=>[key,from[key]]));
function expected(s){
 return {gameTime:s.gameTime,offers:s.offers,
  player:{...pick(s.player,['x','y','hp','maxHp','level','xp','xpToNext','dashTimer']),
   weapons:s.player.weapons.map(w=>pick(w,['name']))},
  run:s.run,enemies:s.enemies.map(e=>pick(e,['x','y','size','hp','maxHp','color','hitFlash'])),
  gems:s.gems.map(e=>pick(e,['x','y','size'])),
  projectiles:s.projectiles.map(e=>pick(e,['x','y','size','color'])),
  bibles:s.bibles.map(e=>pick(e,['angle','r','size','color'])),
  damageNumbers:s.damageNumbers.map(e=>pick(e,['x','y','val','color'])),
  ...Object.fromEntries(['roaming','arenaFormat','rift','portal'].filter(x=>Object.hasOwn(s,x)).map(x=>[x,s[x]])),
 };
}
function verify(host){
 const full=host.snapshot(), frame=host.frameView();
 assert.deepEqual(frame,expected(full));
 frame.player.x=123456;
 if(frame.enemies.length)frame.enemies[0].hp=123456;
 if(frame.gems.length)frame.gems[0].size=123456;
 if(frame.projectiles.length)frame.projectiles[0].size=123456;
 assert.deepEqual(host.snapshot(),full,'paint output must not mutate durable state');
 return full.projectiles.length+full.bibles.length+full.damageNumbers.length;
}
test('the lightweight frame preserves every painted value through all existing run recipes',()=>{
 let effects=0;
 for(const {id} of ARENA_FORMATS){
  const h=createRecordedArena({seed:42,format:id});
  for(let i=0;i<1800;i++){
   if(i%40===0)effects+=verify(h);
   if(h.phase()==='choice')h.choose(h.snapshot().offers[0].id);
   if(h.phase()==='finished')break;
   h.advance(i%120<60?0:8);
  }
 }
 assert.ok(effects>10,'fixture includes actual combat effects');
});
test('pending rift and active isolated world paint the same arena, markers and state',()=>{
 const h=reachRift();verify(h);h.choose('rift-enter');verify(h);
 for(let i=0;i<90;i++)h.advance(1);
 verify(h);h.choose('rift-abandon');verify(h);
});
