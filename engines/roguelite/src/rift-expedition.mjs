// SPDX-License-Identifier: GPL-3.0-or-later
import {createRiftDirector} from './rift-director.mjs';
import {createRiftSession} from './rift-session.mjs';
import {createLegacySurvivorRun} from './legacy-survivor-run.mjs';

export function createRiftExpedition({seed,random}) {
 const main=createLegacySurvivorRun({format:'roaming-expedition-20',seed,random});
 const director=createRiftDirector(seed);
 const travel=createRiftSession({main,createSide:({minutes,seed})=>{
  let cursor=seed>>>0;
  const side=createLegacySurvivorRun({sideMinutes:minutes,random:()=>{
   cursor=(Math.imul(cursor,1664525)+1013904223)>>>0;return cursor/4294967296;
  }});
  return {...side,entropyCursor:()=>cursor};
 }});
 let decision=false, inRift=false;
 function step(input) {
  if(decision)return {status:'choice',audio:[]};
  const result=travel.step(input);
  if(inRift){
   if(result.rift)inRift=false;
   return result;
  }
  if(result.status==='finished')return result;
  // The minimal coordinates accessor avoids any giant snapshot on each tick.
  const {gameTime,player}=main.location();
  if(director.step({clock:gameTime,player,choicePending:result.status==='choice'})) {
   decision=true;
   return {...result,status:'choice'};
  }
  return result;
 }
 function choose(id){
  if(decision){
   if(id!=='rift-enter'&&id!=='rift-stay')throw Error('Invalid rift decision');
   const offered=director.choose(id==='rift-enter');
   decision=false;
   if(offered){travel.enter(offered);inRift=true;}
   return {choice:id,audio:[]};
  }
  if(id==='rift-abandon'&&inRift){
   const rift=travel.abandon();inRift=false;
   return {choice:id,rift,audio:[]};
  }
  return travel.choose(id);
 }
 return Object.freeze({step,choose,riftActive:()=>inRift,captureSuspended:travel.captureSuspended,snapshot:()=>project(false),frameView:()=>project(true)});
 function project(frame){
  const view=frame?travel.frameView():travel.snapshot(), portal=director.snapshot();
  return {...view,portal,...(decision?{offers:[
   {id:'rift-enter',icon:'◈',name:'Enter '+portal.marker.minutes+'-minute rift',kind:'rift'},
   {id:'rift-stay',icon:'↶',name:'Stay in the main Expedition',kind:'rift'},
  ]}:{})};
 }
}
