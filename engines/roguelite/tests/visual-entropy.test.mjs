// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import test from 'node:test';
import {createLegacySurvivorRun} from '../src/legacy-survivor-run.mjs';

function stream(seed) {
 let cursor=seed>>>0,calls=0;
 return {next(){calls++;cursor=(Math.imul(cursor,1664525)+1013904223)>>>0;return cursor/4294967296;},
  count:()=>calls};
}
function gameplay(snapshot) {
 const {particles,damageNumbers,...state}=snapshot;
 for(const enemy of state.enemies)delete enemy.hitFlash;
 return state;
}

test('optional visual entropy does not change live spawns, kills, xp or actual upgrade offers',()=>{
 let checked=0,sawParticles=false,totalChoices=0,totalKills=0;
 for(const seed of [7,42,2147483657,4294967295]){
  const a=stream(seed),b=stream(seed),va=stream(11),vb=stream(93);
  const x=createLegacySurvivorRun({seed,random:a.next,visualRandom:va.next});
  const y=createLegacySurvivorRun({seed,random:b.next,visualRandom:()=>{vb.next();return vb.next();}});
  for(let frame=0;frame<4300;frame++){
   const keys={KeyD:frame%650<350,KeyA:frame%650>=350,Space:frame%50===0};
   const next=x.step({keys,dt:.05});
   assert.deepEqual(next,y.step({keys,dt:.05}));
   if(frame%120===0||next.status==='choice'){
    const l=x.snapshot(),r=y.snapshot();
    checked++;sawParticles||=l.particles>0&&r.particles>0;
    assert.deepEqual(gameplay(l),gameplay(r));
   }
   if(next.status==='choice'){
    totalChoices++;
    const id=x.frameView().offers[0].id;
    assert.deepEqual(x.choose(id),y.choose(id));
   }
   if(next.status==='finished')break;
  }
  assert.equal(a.count(),b.count());
  assert(va.count()>0&&vb.count()>va.count());totalKills+=x.snapshot().run.kills;
 }
 assert(checked>=10&&sawParticles&&totalChoices>0&&totalKills>0,
  'Require actual particle emissions and gameplay events, not two idle states.');
});

test('legacy default uses original stream for every draw and rejects invalid optional sources',()=>{
 const a=stream(42),b=stream(42);
 const x=createLegacySurvivorRun({random:a.next}),y=createLegacySurvivorRun({random:b.next,visualRandom:b.next});
 for(let frame=0;frame<360;frame++){
  const next=x.step({keys:{KeyD:true},dt:.05});
  assert.deepEqual(next,y.step({keys:{KeyD:true},dt:.05}));
  if(next.status==='choice'){const id=x.frameView().offers[0].id;x.choose(id);y.choose(id);}
  if(next.status==='finished')break;
 }
 assert.deepEqual(x.snapshot(),y.snapshot());assert.equal(a.count(),b.count());
 assert.throws(()=>createLegacySurvivorRun({random:a.next,visualRandom:7}),TypeError);
});

import {createLegacyCombat,createLegacyPlayer} from '../src/gamesync-combat-formulas.mjs';
test('a visual roll changes hit-flash and damage numbers but not actual damage or target entropy',()=>{
 const a=stream(1),b=stream(1);
 const x=createLegacyCombat(a.next,()=>0),y=createLegacyCombat(b.next,()=>.99);
 const player=()=>{
  const p=createLegacyPlayer();
  p.weapons=[{orbit:true,orbitR:55,count:2,dmg:6,rate:.1,timer:0,color:'#ffd700'}];return p;
 };
 const enemy=()=>({x:55,y:0,hp:20,size:10,hitFlash:0});
 const left=enemy(),right=enemy();
 x.step(player(),[left],.05);y.step(player(),[right],.05);
 assert.equal(left.hp,right.hp);assert(left.hp<20);
 assert(left.hitFlash>0);assert.equal(right.hitFlash,0);
 assert.equal(x.frameView().damageNumbers.length,1);
 assert.equal(y.frameView().damageNumbers.length,0);
 assert.equal(a.count(),0);assert.equal(b.count(),0);
});

import {createHash} from 'node:crypto';
import {ARENA_PARTITIONED_REPLAY_RULES,ARENA_REPLAY_RULES,createRecordedArena,decodeArenaTape,encodeArenaTape} from '../src/arena-replay.mjs';
import {reachRift} from './rift-fixture.mjs';
const digest=text=>createHash('sha256').update(text).digest('hex');
test('explicit partitioned tapes resume inside a rift and cannot be relabeled as legacy',async()=>{
 const source=reachRift(ARENA_PARTITIONED_REPLAY_RULES);
 source.choose('rift-enter');
 for(let i=0;i<120;i++)source.advance(1);
 const first=source.capture();
 assert.equal(first.header.rules,ARENA_PARTITIONED_REPLAY_RULES);
 const final=JSON.parse(first.final);
 assert(Number.isInteger(final.visualCursor));
 assert(Number.isInteger(final.suspended.sideVisualEntropy));
 const tape=await encodeArenaTape(source,digest);
 const reopened=await decodeArenaTape(tape,{digest});
 assert.deepEqual(first,reopened.capture());
 await assert.rejects(decodeArenaTape(tape.replace(ARENA_PARTITIONED_REPLAY_RULES,ARENA_REPLAY_RULES),{digest}),/choice|match|tape|ended/i);
 source.choose('rift-abandon');reopened.choose('rift-abandon');
 assert.deepEqual(source.capture(),reopened.capture());
 assert.equal(createRecordedArena({seed:1}).capture().header.rules,ARENA_REPLAY_RULES);
});
