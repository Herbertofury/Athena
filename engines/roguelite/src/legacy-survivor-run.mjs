// SPDX-License-Identifier: GPL-3.0-or-later
import {createLegacyCombat,createLegacyPlayer} from './gamesync-combat-formulas.mjs';
import {tickPlayerMovement,tickEnemyContact} from './gamesync-movement-formulas.mjs';
import {tickPickupFormulas,spawnExperienceGem} from './gamesync-pickup-formulas.mjs';
import {tickSpawnFormulas} from './gamesync-spawn-formulas.mjs';
import {createLegacyUpgradeDirector} from './upgrade-draft.mjs';
import {arenaFormat,endurancePressure,arcSideFormat} from './arena-formats.mjs';

import {createRoamingPoints} from './roaming-points.mjs';

export const LEGACY_SURVIVOR_RUN_CONTRACT='athena.roguelite.gamesync-live.v1';
const SURVIVE_TIME=300;

// Cosmetic-only reproducible stream. Distinct from the legacy gameplay LCG.
export function createVisualEntropy(seed,domain=0){
 if(![seed,domain].every(value=>Number.isInteger(value)&&value>=0&&value<=0xffffffff))throw RangeError('Invalid visual stream seed');
 let cursor=(seed^domain^0x9e3779b9)>>>0;
 return Object.freeze({state:()=>cursor,next:()=>{
  cursor=(cursor+0x6d2b79f5)>>>0;
  let n=Math.imul(cursor^(cursor>>>15),cursor|1);
  n^=n+Math.imul(n^(n>>>7),n|61);
  return ((n^(n>>>14))>>>0)/4294967296;
 }});
}

export function createLegacySurvivorRun({random,visualRandom,format='classic',seed,sideMinutes}={}) {
 const recipe=sideMinutes===undefined?arenaFormat(format):arcSideFormat(sideMinutes),classic=recipe.id==='classic';
 const checked=(source)=>{
  if(typeof source!=='function')throw new TypeError('Explicit entropy source required');
  return ()=>{
   const n=source();
   if(!Number.isFinite(n)||n<0||n>=1)throw new RangeError('Entropy must be in [0,1)');
   return n;
  };
 };
 const rng=checked(random),visualRng=visualRandom===undefined||visualRandom===random?rng:checked(visualRandom);
 const roaming=recipe.roaming?createRoamingPoints(seed):null;
 const player=createLegacyPlayer();
 const run={kills:0,gameOver:false,won:false};
 const enemies=[],gems=[];
 const combat=createLegacyCombat(rng,visualRng),upgrades=createLegacyUpgradeDirector({random:rng,portable:!!roaming||sideMinutes!==undefined});
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
  const target=roaming?.advance(player,dt);
  // The node has stable object identity for piercing shots and is never an
  // ordinary enemy: it cannot contact-damage the player or grant kill credit.
  combat.step(player,target?[...enemies,target]:enemies,dt);
  if(roaming){
   roaming.resolve();
   for(const cache of roaming.collect(player)){
    spawnExperienceGem(gems,player.x,player.y,cache.xp);
    audio.push({type:'audio',id:'collect',resource:cache.resource,amount:cache.amount});
   }
  }
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
  const roamingView=roaming?.snapshot(), target=roaming?.target();
  return {contract:LEGACY_SURVIVOR_RUN_CONTRACT,gameTime,spawnTimer,offers,player:structuredClone(player),
   run:{...run},enemies:structuredClone(enemies),gems:structuredClone(gems),...combat.snapshot(target?[...enemies,target]:enemies),
   ...(roamingView?{roaming:roamingView}:{}),
   ...(!classic?{arenaFormat:{id:recipe.id,seconds:recipe.seconds,missedSpawns,...endurancePressure(recipe,gameTime)}}:{})};
 }
 function frameView(){
  const {x,y,hp,maxHp,level,xp,xpToNext,dashTimer,weapons}=player;
  return {gameTime,offers,
   player:{x,y,hp,maxHp,level,xp,xpToNext,dashTimer,weapons:weapons.map(({name})=>({name}))},
   run:{...run},
   enemies:enemies.map(({x,y,size,hp,maxHp,color,hitFlash})=>({x,y,size,hp,maxHp,color,hitFlash})),
   gems:gems.map(({x,y,size})=>({x,y,size})),...combat.frameView(),
   ...(roaming?{roaming:roaming.snapshot()}:{}),
   ...(!classic?{arenaFormat:{id:recipe.id,seconds:recipe.seconds,missedSpawns,...endurancePressure(recipe,gameTime)}}:{}),
  };
 }
 function applyCampPerk(perk){
  if(run.gameOver||offers)throw Error('Cannot build between decisions or after the run');
  switch(perk){
   case 'health': player.maxHp+=15; player.hp=Math.min(player.hp+15,player.maxHp);break;
   case 'damage': player.dmgMult*=1.1;break;
   default: throw Error('Unknown camp perk');
  }
 }
 function recoverCampHealth(points){
  if(!Number.isInteger(points)||points<1||points>36)throw Error('Invalid camp recovery');
  const prior=player.hp;player.hp=Math.min(player.maxHp,player.hp+points);return player.hp-prior;
 }
 return Object.freeze({step,choose,snapshot,frameView,applyCampPerk,recoverCampHealth,canRecoverCampHealth:()=>player.hp<player.maxHp,balance:()=>roaming?.balance()??{crystal:0,gold:0},location:()=>({gameTime,player:{x:player.x,y:player.y}})});
}
