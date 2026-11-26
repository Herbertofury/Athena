// SPDX-License-Identifier: GPL-3.0-or-later
import {createFrontierRelay} from './frontier-relay.mjs';
import {createFloodplainEscort} from './floodplain-escort.mjs';
import {createAshglassCavern} from './ashglass-cavern.mjs';
import {createSpatialRegion} from './spatial-region.mjs';
import {createCampWorkshop} from './camp-workshop.mjs';
import {createRiftDirector} from './rift-director.mjs';
import {createRiftSession} from './rift-session.mjs';
import {createLegacySurvivorRun} from './legacy-survivor-run.mjs';

export function createRiftExpedition({seed,random,withCamp=false,withCavern=false,withEscort=false,withRelay=false,regionFormat}) {
 const main=createLegacySurvivorRun({format:regionFormat??'roaming-expedition-20',seed,random});
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
  return {crystal:loot.crystal+earned.crystal+regionBank+relayBank.crystal,gold:loot.gold+earned.gold+cavernGold+relayBank.gold};
 };
 let decision=false, campPrompt=false, regionPrompt=false, relayPrompt=false, inRift=false, regionBank=0, cavernGold=0, escortRemedies=0;
 const relay=withRelay?createFrontierRelay(seed):null,relayBank={gold:0,crystal:0};
 const relayOptions=Object.freeze([
  Object.freeze({id:'relay-supply',name:'Recover a supply sled · 24 gold',icon:'▣',kind:'relay'}),
  Object.freeze({id:'relay-watch',name:'Light two watchline beacons · 12 crystal',icon:'◇',kind:'relay'}),
  Object.freeze({id:'relay-leave',name:'Leave the relay',icon:'↶',kind:'relay'}),
 ]);
 const escort=withEscort?createFloodplainEscort(seed):null;
 const canHeal=()=>escortRemedies>0&&main.canRecoverCampHealth();
 const cavern=withCavern?createAshglassCavern(seed):null;
 const region=regionFormat?createSpatialRegion(seed):null;
 function step(input) {
  if(decision||campPrompt||regionPrompt||relayPrompt)return {status:'choice',audio:[]};
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
  if(region){
   const regional=region.advance({player,dt:input.dt,choicePending:result.status==='choice'});
   if(regional.crystal){regionBank+=regional.crystal;return {...result,region:{amount:regional.crystal}};}
   if(regional.prompt){regionPrompt=true;return {...result,status:'choice'};}
  }
  if(cavern){
   const clue=cavern.visit(player);
   if(clue?.gold)cavernGold+=clue.gold;
   if(clue)return {...result,cavern:clue};
  }
  if(escort){
   const event=escort.advance(player,input.dt);
   if(event?.kind==='recruit')escortRemedies=2;
   if(event)return {...result,escort:event};
  }
  if(relay){
   const next=relay.advance(player,input.dt,{choicePending:result.status==='choice'});
   if(next?.prompt){relayPrompt=true;return {...result,status:'choice'};}
   if(next?.earned){
    relayBank.gold+=next.earned.gold;relayBank.crystal+=next.earned.crystal;
    return {...result,relay:next};
   }
  }
  return result;
 }
 function choose(id){
  if(relayPrompt){relay.choose(id);relayPrompt=false;return {choice:id,relay:{id},audio:[]};}
  if(regionPrompt){
   region.choose(id);regionPrompt=false;
   return {choice:id,region:id,audio:[]};
  }
  if(campPrompt){
   if(id==='camp-ferryman-remedy'){
    if(!canHeal())throw Error('Ferryman remedy is not available');
    camp.choose('camp-stay',wallet(),main.applyCampPerk);
    const recovery=main.recoverCampHealth(36);escortRemedies--;campPrompt=false;
    return {choice:id,camp:{id,recovery},audio:[]};
   }
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
  return {...view,portal,...(camp?{camp:camp.snapshot(wallet())}:{}),...(region?{region:{...region.snapshot(),bankedCrystal:regionBank}}:{}),
   ...(cavern?{cavern:{...cavern.snapshot(),bankedGold:cavernGold}}:{}),
   ...(escort?{escort:{...escort.snapshot(),remedies:escortRemedies}}:{}),
   ...(relay?{relay:{...relay.snapshot(),bank:{...relayBank}}}:{}),
   ...(relayPrompt?{offers:relayOptions.map(o=>({...o}))}:regionPrompt?{offers:[
    {id:'region-intervene',name:'Help the Amber Surveyors',icon:'◇',kind:'region'},
    {id:'region-detour',name:'Leave the factions to it',icon:'↶',kind:'region'},
   ]}:campPrompt?{offers:canHeal()?[{id:'camp-ferryman-remedy',name:'Use the ferryman’s remedy · restore up to 36 HP',icon:'✚',kind:'camp'},...camp.choices(wallet())]:camp.choices(wallet())}:decision?{offers:[
   {id:'rift-enter',icon:'◈',name:'Enter '+portal.marker.minutes+'-minute rift',kind:'rift'},
   {id:'rift-stay',icon:'↶',name:'Stay in the main Expedition',kind:'rift'},
  ]}:{})};
 }
}
