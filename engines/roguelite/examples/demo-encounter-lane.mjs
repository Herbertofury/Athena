// SPDX-License-Identifier: GPL-3.0-or-later
// Synthetic offline fixture exercising all three exact extracted stages.
import {createSpawnDirector} from '../src/spawn-director.mjs';
import {tickEnemyContact,tickPlayerMovement} from '../src/gamesync-movement-formulas.mjs';
import {tickPickupFormulas} from '../src/gamesync-pickup-formulas.mjs';
const run={kills:0,gameOver:false,won:false};
const player={x:0,y:0,dir:1,speed:130,hp:100,maxHp:100,regen:0,invincible:0,dashCooldown:0,dashTimer:0,alive:true,xp:0,xpToNext:10,level:1,magnetRange:50};
const enemies=[],gems=[],keys={KeyD:true,ShiftLeft:true};
const director=createSpawnDirector({random:()=>.5});
const movement=tickPlayerMovement({player,keys,dt:.025});
enemies.push(...director.step({dt:.025,player}).spawns);
const spawnCount=enemies.length;
// Synthetic host setup: one enemy has already been defeated by an external host.
enemies.push({x:player.x+2,y:player.y,hp:0,speed:20,size:10,dmg:5,xp:10,color:'#22c55e',hitFlash:0});
const contact=tickEnemyContact({player,enemies,gems,run,dt:.025});
const levels=tickPickupFormulas({gems,player,dt:.025});
console.log(JSON.stringify({spawnCount,movement:movement.map(c=>c.type),contact:contact.map(c=>c.type),kills:run.kills,levels,remainingGems:gems.length},null,2));
