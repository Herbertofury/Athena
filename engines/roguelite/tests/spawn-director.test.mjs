// SPDX-License-Identifier: GPL-3.0-or-later
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import {createSpawnDirector,SURVIVORS_SPAWN_CONTRACT} from '../src/spawn-director.mjs';

const originals={
 source: ['../upstream/gamesync/game-survivors.js','1cd392de5cddcd14845b46324777fc762af8c95a4dc46c0e16ee61a54ff29cc7'],
 core:['../../shared-game-runtime/upstream/gamesync/game-core.js','f6c4f182ec271a1aefe2decea72cd9da0d120cfa8e649126c04e55d15a4b038e'],
};
function checked([file,sha]){
 const raw=readFileSync(new URL(file,import.meta.url));assert.equal(createHash('sha256').update(raw).digest('hex'),sha);
 return raw.toString('utf8');
}

// Independent reference: run the original create function with fake DOM-only
// collaborators and expose its exact spawn stage through a test-only seam.
function pinnedReference(random){
 const source=checked(originals.source), helper=checked(originals.core);
 const lines=helper.split('\n').filter(l=>['const rand  =','const randInt =','const TAU   ='].some(id=>l.includes(id)));
 assert.equal(lines.length,3);
 const math=Object.create(Math);math.random=random;
 const core=runInNewContext(lines.join('\n')+'\n({rand,randInt,TAU})',{Math:math});
 Object.assign(core,{createCanvas:()=>({}),createInput:()=>({}),createParticleSystem:()=>({}),createButton:()=>({})});
 const win={__gsMascotGameCore:core};
 const region=source.slice(source.indexOf('      // Spawn enemies'),source.indexOf('      // Fire weapons'));
 assert.match(region,/for \(let i = 0; i < count; i\+\+\) spawnEnemy\(\)/);
 const insertion=`
    return {runProbe(dt, position){
      gameTime+=dt;
      if(gameTime>=SURVIVE_TIME)return {elapsed:SURVIVE_TIME,finished:true,spawns:[]};
      player.x=position.x; player.y=position.y; enemies=[];
${region}
      return {elapsed:gameTime,finished:false,spawns:enemies};
    }};
`;
 runInNewContext(source.replace('    function spawnGem(', insertion+'\n    function spawnGem('),{window:win,Math:math});
 return win.__gsMascotGameSurvivors.create(null);
}

// Scripted deterministic entropy, not an API-owned RNG.
function entropy(seed){
 let value=seed>>>0;
 return {next(){value=(Math.imul(1664525,value)+1013904223)>>>0;return value/2**32;},snapshot:()=>value};
}
test('exact extracted rules agree byte-for-byte with pinned upstream across a complete five-minute spawn lane',()=>{
 const p=entropy(42),q=entropy(42);
 const d=createSpawnDirector({random:p.next}),original=pinnedReference(q.next);
 let n=0,big=0;
 for(let i=0;i<1200;i++){
  const player={x:i*2-50,y:i%16};
  const result=d.step({dt:.25,player});
  assert.equal(JSON.stringify(result),JSON.stringify(original.runProbe(.25,player)));
  n+=result.spawns.length;
  for(const spawn of result.spawns){big=Math.max(big,spawn.hp);assert.ok(Math.hypot(spawn.x-player.x,spawn.y-player.y)>=349.999);}
 }
 assert.ok(n>400&&big>220);assert.equal(p.snapshot(),q.snapshot());
 assert.equal(d.checkpoint().elapsed,300);
});
test('explicit host duration and serialized checkpoint restore preserve remaining spawns exactly',()=>{
 const stream=entropy(7),a=createSpawnDirector({duration:20,random:stream.next});
 const tick=()=>({dt:.125,player:{x:600,y:100}});
 for(let i=0;i<71;i++)a.step(tick());
 const c=JSON.parse(JSON.stringify(a.checkpoint()));
 assert.equal(c.contract,SURVIVORS_SPAWN_CONTRACT);
 const restore=entropy(stream.snapshot());
 const b=createSpawnDirector({duration:20,random:restore.next,checkpoint:c});
 for(let i=0;i<100;i++)assert.deepEqual(a.step(tick()),b.step(tick()));
 assert.equal(a.checkpoint().elapsed,20);
 assert.throws(()=>createSpawnDirector({duration:40,random:restore.next,checkpoint:c}),/does not match/);
});
test('invalid input fails without advancing timer; hitch preserves original no-catch-up behavior',()=>{
 assert.throws(()=>createSpawnDirector(),/entropy source/);
 const d=createSpawnDirector({random:()=>.99});
 const c=d.checkpoint();
 assert.throws(()=>d.step({dt:Infinity,player:{x:0,y:0}}),/tick/);
 assert.throws(()=>d.step({dt:0,player:{x:NaN,y:0}}),/position/);
 assert.deepEqual(c,d.checkpoint());
 const h=d.step({dt:250,player:{x:0,y:0}});
 assert.equal(h.spawns.length,4);assert.equal(h.spawns[0].color,'#dc2626');
 const timer=d.checkpoint();
 assert.equal(d.step({dt:0,player:{x:0,y:0}}).spawns.length,0);
 assert.deepEqual(timer,d.checkpoint());
});
