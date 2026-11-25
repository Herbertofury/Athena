// SPDX-License-Identifier: GPL-3.0-or-later
import {authoredCityGeometry,bindOriginalTraversal} from './gamesync-city-formulas.mjs';
export {authoredCityGeometry};

export const LEGACY_CITY_TRAVERSAL='athena.mascot-open-world.gamesync-traversal.v1';
const finite=(x,limit,label)=>{
 if(!Number.isFinite(x)||Math.abs(x)>limit)throw new RangeError(label);
 return x;
};

export function createCityTraversal({x=430,y=2000}={}){
 if(x<0||y<0)throw new RangeError('City origin is zero');
 const player={x:finite(x,3200,'Invalid x'),y:finite(y,2200,'Invalid y'),vx:0,vy:0,mode:'ground',
  interiorId:'',roofId:'',airborneRoofId:'',jumpZ:0,jumpVz:0,aimAngle:0};
 const state={player};
 let feedback=null;
 const legacy=bindOriginalTraversal(state,(message,seconds)=>{feedback={message,seconds};});
 function move(dx,dy){
  // Limit these host-requested ground increments explicitly; the legacy
  // endpoint test is not a swept collision detector for arbitrary jumps.
  finite(dx,32,'Ground increment exceeds 32 logical pixels');
  finite(dy,32,'Ground increment exceeds 32 logical pixels');
  legacy.moveWithBuildingCollision(player,dx,dy);
  legacy.updateRoofTraversalAfterMove(player);
  return snapshot();
 }
 function interact(){
  feedback=null;
  const inside=legacy.currentInterior();
  if(inside){
   if(legacy.nearInteriorExit())legacy.exitInterior();
  }else{
   const door=legacy.nearInteriorDoor();
   if(door)legacy.enterInterior(door.id);
  }
  return {changed:!!feedback,feedback:feedback?{...feedback}:null,state:snapshot()};
 }
 function snapshot(){
  const interior=legacy.currentInterior();
  const door=interior?null:legacy.nearInteriorDoor();
  return {contract:LEGACY_CITY_TRAVERSAL,x:player.x,y:player.y,z:legacy.entityAbsoluteZ(player),
   bounds:legacy.sceneBounds(),district:interior?null:legacy.district(player.x,player.y),
   interior:interior?{id:interior.id,name:interior.name}:null,
   action:interior?legacy.nearInteriorExit()?'exit':null:door?'enter':null,
   target:interior?.name??door?.name??null};
 }
 return Object.freeze({move,interact,snapshot});
}
