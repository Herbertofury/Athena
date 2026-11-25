// SPDX-License-Identifier: GPL-3.0-or-later
import {tickSpawnFormulas} from './gamesync-spawn-formulas.mjs';

export const SURVIVORS_SPAWN_CONTRACT = 'athena.roguelite.gamesync-spawns.v1';
const number=(n,min,max,label)=>{
 if(typeof n!=='number'||!Number.isFinite(n)||n<min||n>max)throw new RangeError(label);
 return n;
};

// Required explicit entropy function: caller controls seed, independent
// streams, snapshot of its PRNG state, and replay of host ticks/positions.
export function createSpawnDirector({duration=300,random,checkpoint}={}){
 number(duration,1,86400,'Invalid run duration');
 if(typeof random!=='function')throw new TypeError('Explicit entropy source required');
 const rng=()=>{
  const sample=random();
  if(typeof sample!=='number'||!Number.isFinite(sample)||sample<0||sample>=1)throw new RangeError('Entropy must be in [0,1)');
  return sample;
 };
 let time=0,timer=0;
 if(checkpoint!==undefined){
  if(checkpoint?.contract!==SURVIVORS_SPAWN_CONTRACT||checkpoint.duration!==duration)throw new TypeError('Checkpoint does not match this spawn contract');
  time=number(checkpoint.elapsed,0,duration,'Invalid checkpoint time');
  timer=number(checkpoint.spawnTimer,0,2,'Invalid checkpoint spawn timer');
 }
 function step({dt,player}){
  const delta=number(dt,0,86400,'Invalid tick step');
  const x=number(player?.x,-1e9,1e9,'Invalid player position');
  const y=number(player?.y,-1e9,1e9,'Invalid player position');
  const nextTime=Math.min(time+delta,duration);
  // GameSync's win check happens before the spawning section.
  if(nextTime===duration){time=nextTime;return {elapsed:time,finished:true,spawns:[]};}
  const r=tickSpawnFormulas({spawnTimer:timer,dt:delta,gameTime:nextTime,SURVIVE_TIME:duration,player:{x,y},random:rng});
  time=nextTime;timer=r.spawnTimer;
  return {elapsed:time,finished:false,spawns:r.enemies};
 }
 return Object.freeze({step,checkpoint:()=>({contract:SURVIVORS_SPAWN_CONTRACT,duration,elapsed:time,spawnTimer:timer})});
}
