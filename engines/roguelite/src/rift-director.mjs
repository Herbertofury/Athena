// SPDX-License-Identifier: GPL-3.0-or-later
import {RIFT_DURATIONS} from './rift-session.mjs';
const DIRECTIONS=Object.freeze([[0,-1],[.70710678,-.70710678],[1,0],[.70710678,.70710678],[0,1],[-.70710678,.70710678],[-1,0],[-.70710678,-.70710678]]);
const hash=(seed,slot)=>{
 let bits=(seed^Math.imul(slot,0x9e3779b9))>>>0;
 bits=Math.imul(bits^(bits>>>16),0x7feb352d);bits=Math.imul(bits^(bits>>>15),0x846ca68b);
 return (bits^(bits>>>16))>>>0;
};
const uint=v=>Number.isSafeInteger(v)&&v>=0&&v<=0xffffffff;
export function createRiftDirector(seed) {
 if(!uint(seed))throw new RangeError('Invalid rift seed');
 let marker=null,next=95,seen=0,decision=false;
 function step({clock,player,choicePending=false}){
  if(!Number.isFinite(clock)||clock<0||!Number.isFinite(player?.x)||!Number.isFinite(player?.y))throw new RangeError('Invalid rift clock or target');
  if(!decision&&marker&&clock>=marker.expires)marker=null;
  if(!marker&&clock>=next){
   const n=++seen, bits=hash(seed,n);
   const [x,y]=DIRECTIONS[bits&7],offset=190+((bits>>>3)%27);
   marker={x:player.x+x*offset,y:player.y+y*offset,minutes:RIFT_DURATIONS[(bits>>>8)%3],seed:hash(bits,n+321),expires:clock+58};
   next=clock+165+((bits>>>16)%91);
  }
  if(marker&&!choicePending&&!decision&&Math.hypot(player.x-marker.x,player.y-marker.y)<=28)decision=true;
  return decision;
 }
 function choose(yes){
  if(!decision)throw new Error('No rift decision');
  const result=yes?{minutes:marker.minutes,seed:marker.seed}:null;
  decision=false;marker=null;
  return result;
 }
 return Object.freeze({step,choose,snapshot:()=>({marker:marker?{...marker}:null,awaitingDecision:decision,next,seen})});
}
