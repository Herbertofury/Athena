// SPDX-License-Identifier: GPL-3.0-or-later
import {createCampWorkshop} from './camp-workshop.mjs';
import {createRiftDirector} from './rift-director.mjs';
import {createRiftSession} from './rift-session.mjs';
import {createLegacySurvivorRun} from './legacy-survivor-run.mjs';

export function createRiftExpedition({seed,random,withCamp=false}) {
 const main=createLegacySurvivorRun({format:'roaming-expedition-20',seed,random});
 const director=createRiftDirector(seed),camp=withCamp?createCampWorkshop():null;
 const travel=createRiftSession({main,createSide:({minutes,seed})=>{
  let cursor=seed>>>0;
  const side=createLegacySurvivorRun({sideMinutes:minutes,random:()=>{
   cursor=(Math.imul(cursor,1664525)+1013904223)>>>0;return cursor/4294967296;
  }});
  return {...side,entropyCursor:()=>cursor};
 }});
 const wallet=()=>{
  const loot=main.balance(), earned=travel.bank();
  return {crystal:loot.crystal+earned.crystal,gold:loot.gold+earned.gold};
 };
 let decision=false, campPrompt=false, inRift=false;
 function step(input) {
  if(decision||campPrompt)return {status:'choice',audio:[]};
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
  if(camp?.step({clock:gameTime,player,choicePending:result.status==='choice'})){
   campPrompt=true;
   return {...result,status:'choice'};
  }
  return result;
 }
 function choose(id){
  if(campPrompt){
   const choice=camp.choose(id,wallet(),main.applyCampPerk);
   campPrompt=false;
   return {choice:id,camp:choice,audio:[]};
  }
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
  return {...view,portal,...(camp?{camp:camp.snapshot(wallet())}:{}),...(campPrompt?{offers:camp.choices(wallet())}:decision?{offers:[
   {id:'rift-enter',icon:'◈',name:'Enter '+portal.marker.minutes+'-minute rift',kind:'rift'},
   {id:'rift-stay',icon:'↶',name:'Stay in the main Expedition',kind:'rift'},
  ]}:{})};
 }
}
