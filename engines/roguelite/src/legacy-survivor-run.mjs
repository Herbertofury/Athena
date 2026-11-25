// SPDX-License-Identifier: GPL-3.0-or-later
import {createLegacyCombat,createLegacyPlayer} from './gamesync-combat-formulas.mjs';
import {tickPlayerMovement,tickEnemyContact} from './gamesync-movement-formulas.mjs';
import {tickPickupFormulas} from './gamesync-pickup-formulas.mjs';
import {tickSpawnFormulas} from './gamesync-spawn-formulas.mjs';
import {createLegacyUpgradeDirector} from './upgrade-draft.mjs';
import {arenaFormat,endurancePressure} from './arena-formats.mjs';

export const LEGACY_SURVIVOR_RUN_CONTRACT='athena.roguelite.gamesync-live.v1';
const SURVIVE_TIME=300;

export function createLegacySurvivorRun({random,format='classic'}={}) {
 const recipe=arenaFormat(format),classic=recipe.id==='classic';
 if(typeof random!=='function')throw new TypeError('Explicit entropy source required');
 const rng=()=>{
  const n=random();
  if(!Number.isFinite(n)||n<0||n>=1)throw new RangeError('Entropy must be in [0,1)');
  return n;
 };
 const player=createLegacyPlayer();
 const run={kills:0,gameOver:false,won:false};
 const enemies=[],gems=[];
 const combat=createLegacyCombat(rng),upgrades=createLegacyUpgradeDirector({random:rng});
 let gameTime=0,spawnTimer=0,offers=null,missedSpawns=0;
 const dispatch=(events)=>events.filter(cue=>{
  if(cue.type!=='particles')return true;
  combat.emit(cue.x,cue.y,cue.count,cue.style);
  return false;
 });
 function step({dt,keys={}}){
  if(!Number.isFinite(dt)||dt<0||dt>SURVIVE_TIME)throw new RangeError('Invalid tick duration');
  if(run.gameOver||offers)return {status:offers?'choice':'finished',audio:[]};
  gameTime+=dt;
  if(recipe.seconds!==null&&gameTime>=recipe.seconds){
   run.gameOver=true;run.won=true;
   return {status:'finished',audio:[]};
  }
  const input={...keys};
  const audio=dispatch(tickPlayerMovement({player,keys:input,dt}));
  const current=classic?null:endurancePressure(recipe,gameTime);
  const coordinate=classic?gameTime:current.pressure*SURVIVE_TIME;
  const next=tickSpawnFormulas({spawnTimer,dt,gameTime:coordinate,SURVIVE_TIME,player,random:rng});
  spawnTimer=next.spawnTimer;
  for(const enemy of next.enemies){
   if(current&&enemies.length>=current.activeLimit){missedSpawns++;continue;}
   if(current&&current.scale>1){
    enemy.hp*=current.scale;enemy.maxHp*=current.scale;enemy.dmg*=current.scale;
   }
   enemies.push(enemy);
  }
  combat.step(player,enemies,dt);
  audio.push(...dispatch(tickEnemyContact({player,enemies,gems,run,dt})));
  const levels=tickPickupFormulas({gems,player,dt});
  // One offer roll per original XP-gate crossing; if several gems level up
  // together, the last offer is shown, as in the original update loop.
  for(const _ of levels){
   offers=upgrades.roll(player);
   audio.push({type:'audio',id:'collect'});
  }
  combat.settle(dt);
  return {status:offers?'choice':run.gameOver?'finished':'running',audio};
 }
 function choose(id){
  if(!offers)throw new TypeError('No pending level-up');
  const choice=upgrades.choose(player,offers,id);
  offers=null;
  return {choice,audio:[{type:'audio',id:'collect'}]};
 }
 function snapshot(){
  return {contract:LEGACY_SURVIVOR_RUN_CONTRACT,gameTime,spawnTimer,offers,player:structuredClone(player),
   run:{...run},enemies:structuredClone(enemies),gems:structuredClone(gems),...combat.snapshot(enemies),
   ...(!classic?{arenaFormat:{id:recipe.id,seconds:recipe.seconds,missedSpawns,...endurancePressure(recipe,gameTime)}}:{})};
 }
 return Object.freeze({step,choose,snapshot});
}
