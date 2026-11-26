// SPDX-License-Identifier: GPL-3.0-or-later
import {generateLegacyUpgradeOffers,applyLegacyUpgradeChoice} from './gamesync-upgrade-formulas.mjs';

// Logical game state belongs to the caller. This does not grant authority to
// untrusted peers or persist the draft; it binds one offer to this actor.
export function createLegacyUpgradeDirector({random,portable=false}={}){
 if(typeof random!=='function')throw new TypeError('Explicit entropy source required');
 const active=new WeakMap();
 const rng=()=>{
  const n=random();
  if(!Number.isFinite(n)||n<0||n>=1)throw new RangeError('Entropy must be in [0,1)');
  return n;
 };
 // Random comparators consume different draws across sorting implementations.
 // Preserve the source sort on legacy formats, and opt into a fixed-draw
 // Fisher-Yates shuffle only for new portable Expedition formats.
 const shuffle=portable?pool=>{
  for(let i=pool.length-1;i>0;i--){
   const j=Math.floor(rng()*(i+1));
   [pool[i],pool[j]]=[pool[j],pool[i]];
  }
  return pool;
 }:undefined;
 function roll(player){
  if(!player||!Array.isArray(player.weapons)||player.weapons.some(w=>typeof w?.name!=='string'))throw new TypeError('Expected engine-owned player weapons');
  const choices=generateLegacyUpgradeOffers(player,rng,shuffle);
  const view=Object.freeze(choices.map(({id,name,icon,weapon})=>Object.freeze({id,name,icon,kind:weapon?'weapon':'stat'})));
  active.set(player,{view,choices});
  return view;
 }
 function choose(player,view,id){
  const current=active.get(player);
  if(!current||current.view!==view)throw new TypeError('Upgrade offer is stale or belongs to another player');
  const choice=current.choices.find(row=>row.id===id);
  if(!choice)throw new TypeError('Upgrade was not offered');
  applyLegacyUpgradeChoice(player,choice);
  active.delete(player);
  return {id:choice.id,kind:choice.weapon?'weapon':'stat'};
 }
 return Object.freeze({roll,choose});
}
