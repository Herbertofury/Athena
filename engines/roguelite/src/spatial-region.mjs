// SPDX-License-Identifier: GPL-3.0-or-later
// Authored region addresses derive independently from the parent fight entropy.
export function createSpatialRegion(seed){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw Error('Invalid region seed');
 const a=Math.imul(seed^0x9e3779b9,0x85ebca6b)>>>0;
 const direction=a&1?1:-1, x=direction*(750+((a>>>8)%81)), y=((a>>>16)%101)-50;
 const battle={id:'skirmish-basin',x,y,r:86},survey={id:'survey-outcrop',x:-x,y:-y,r:110};
 let state='unseen', seenSurvey=false, cache=null, paid=false;
 let amber=54, violet=47, conflict=0, approach=0, waitFor=0;
 function advance({player,dt,choicePending=false}){
  if(!Number.isFinite(player?.x)||!Number.isFinite(player?.y)||!Number.isFinite(dt)||dt<0)throw Error('Invalid spatial region tick');
  const near=site=>(player.x-site.x)**2+(player.y-site.y)**2<=site.r**2;
  if(state==='unseen'&&(player.x-battle.x)**2+(player.y-battle.y)**2<=(battle.r+155)**2){
   approach+=dt;
   amber=Math.max(20,amber-2.5*dt);
   violet=Math.max(16,violet-3.5*dt);
  }
  if(near(survey))seenSurvey=true;
  if(!choicePending&&state==='unseen'&&near(battle)){state='decision';return {region:battle.id,prompt:true};}
  if(state==='intervening'){
   conflict+=dt;
   // Opposing groups each inflict pressure. The chosen intervention gives
   // one side a concrete advantage; this is not another parent enemy wave.
   const supporting=near(battle);
   amber=Math.max(0,amber-(supporting?5:13)*dt);
   violet=Math.max(0,violet-(supporting?11:3)*dt);
   if(violet===0||amber===0){state='resolved';if(amber>0){cache={x:battle.x,y:battle.y,crystal:8};waitFor=0;}}
  }
  if(cache){
   waitFor+=dt;
   if(waitFor>45)cache=null;
   else if((player.x-cache.x)**2+(player.y-cache.y)**2<=24**2&&!paid){
    paid=true;const crystal=cache.crystal;cache=null;
    return {region:battle.id,crystal};
   }
  }
  return {region:seenSurvey?survey.id:null};
 }
 function choose(id){
  if(state!=='decision'||!['region-intervene','region-detour'].includes(id))throw Error('No matching region decision');
  state=id==='region-intervene'?'intervening':'detoured';
 }
 function snapshot(){return {battle:{...battle},survey:{...survey},state,seenSurvey,amber,violet,approach,conflict,cache:cache&&{...cache},paid};}
 return Object.freeze({advance,choose,snapshot});
}
