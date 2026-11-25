// SPDX-License-Identifier: GPL-3.0-or-later
// A deliberately small deterministic demonstration host, not a full game.
import {createHash} from 'node:crypto';
import {createSpawnDirector} from '../src/spawn-director.mjs';
const seed=process.argv[2]===undefined?42:Number(process.argv[2]);
const duration=process.argv[3]===undefined?300:Number(process.argv[3]);
if(!Number.isInteger(seed)||seed<0||seed>0xffffffff||!Number.isInteger(duration)||duration<1||duration>3600)
 throw Error('Usage: node demo-spawn-lane.mjs [uint32 seed] [1–3600 seconds]');
let cursor=seed;
const d=createSpawnDirector({duration,random:()=>{cursor=(Math.imul(1664525,cursor)+1013904223)>>>0;return cursor/2**32;}});
const hash=createHash('sha256');let count=0,ticks=0,maxHp=0,result;
do {
 result=d.step({dt:.25,player:{x:ticks*2-50,y:ticks%16}});
 hash.update(JSON.stringify(result)+'\n');
 for(const enemy of result.spawns){count++;maxHp=Math.max(maxHp,enemy.hp);}
 ticks++;
}while(!result.finished);
console.log(JSON.stringify({seed,duration,ticks,spawned:count,maxEnemyHp:maxHp,finished:result.finished,transcriptSha256:hash.digest('hex'),finalCheckpoint:d.checkpoint()},null,2));
