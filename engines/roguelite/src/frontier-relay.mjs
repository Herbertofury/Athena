// SPDX-License-Identifier: GPL-3.0-or-later
// One active relay at a time, driven exclusively by the run's movement/ticks.
// Course is decided by where the player delivers, with deterministic sector salt.
const site=(name,x,y,r)=>Object.freeze({name,x,y,r});
export function createFrontierRelay(seed){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw RangeError('Invalid relay seed');
 const hash=n=>Math.imul(seed^Math.imul(n+17,0x85ebca6b),0x9e3779b1)>>>0;
 const at=(p,m)=>Math.hypot(p.x-m.x,p.y-m.y)<=m.r;
 let sequence=1,completed=0,route=null,progress=0,checked=0,last=null;
 const first=hash(1), side=(first&1)?1:-1;
 let post=site('Relay outpost',side*(4370+(first>>>9)%290),side*(350+(first>>>18)%610),75);
 let objectives=[];
 function lay(){
  const n=hash(sequence),dir=(n&2)?1:-1,flip=(n&4)?1:-1;
  objectives=route==='supply'?[
   site('Recover the supply sled',post.x+dir*(340+(n>>>13)%93),post.y+flip*235,39),post
  ]:[
   site('Light the lower beacon',post.x+dir*198,post.y-flip*210,47),
   site('Light the ridge beacon',post.x+dir*384,post.y+flip*94,47),post
  ];
 }
 function choose(id){
  if(route!=='decision'||!['relay-supply','relay-watch','relay-leave'].includes(id))throw Error('No matching Frontier relay decision');
  if(id==='relay-leave'){route='left';return;}
  route=id==='relay-supply'?'supply':'watch';checked=0;progress=0;lay();
 }
 function advance(player,dt,{choicePending=false}={}){
  if(!Number.isFinite(player?.x)||!Number.isFinite(player?.y)||!Number.isFinite(dt)||dt<0)throw RangeError('Invalid relay tick');
  if(route==='left'){if(!at(player,post))route=null;return null;}
  if(route===null&&at(player,post)&&!choicePending){route='decision';return {prompt:true};}
  if(route!=='supply'&&route!=='watch')return null;
  const target=objectives[checked];
  if(!at(player,target)){
   if(route==='watch'&&checked<2)progress=Math.max(0,progress-dt*.5);
   return null;
  }
  if(route==='watch'&&checked<2){progress+=dt;if(progress<2.2)return null;}
  checked++;progress=0;
  if(checked<objectives.length)return {cleared:target.name,next:objectives[checked].name};
  completed++;const earned=route==='supply'?{gold:24,crystal:0}:{gold:0,crystal:12};
  last={name:post.name,number:sequence,route,earned};sequence++;
  const n=hash(sequence), heading=Math.atan2(player.y,player.x),turn=((n>>>8)%3-1)*.73;
  const offset=1030+(n>>>15)%280, angle=heading+turn;
  post=site('Relay outpost',player.x+Math.cos(angle)*offset,player.y+Math.sin(angle)*offset,75);
  route=null;objectives=[];checked=0;
  return {earned};
 }
 function snapshot(){
  return {sequence,completed,route,progress,checked,post,next:objectives[checked]??post,last:last&&{...last,earned:{...last.earned}}};
 }
 return Object.freeze({advance,choose,snapshot});
}
