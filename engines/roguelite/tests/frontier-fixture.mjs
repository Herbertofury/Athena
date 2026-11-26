// SPDX-License-Identifier: GPL-3.0-or-later
import {createRecordedArena} from '../src/arena-replay.mjs';
export const frontierFormat='frontier-expedition-30';
function navigate(host,point){
 const {x,y}=host.frameView().player,dx=point.x-x,dy=point.y-y;
 return (Math.abs(dx)<5?0:dx>0?8:4)|(Math.abs(dy)<5?0:dy>0?2:1);
}
export function followFrontier(){
 const yes=createRecordedArena({seed:42,format:frontierFormat});
 const no=createRecordedArena({seed:42,format:frontierFormat});
 const a=yes.snapshot().region.battle,b=no.snapshot().region.survey;
 const fallback=h=>{const o=h.frameView().offers;h.choose((o.find(v=>['rift-stay','camp-stay','speed'].includes(v.id))??o[0]).id);};
 let ticks=0;
 for(;ticks<1000;ticks++){
  const step=yes.advance(navigate(yes,a)),other=no.advance(navigate(no,b));
  if(other.status==='choice')fallback(no);
  if(step.status!=='choice')continue;
  if(yes.snapshot().region.state==='decision')break;
  fallback(yes);
 }
 if(yes.snapshot().region.state!=='decision'||!no.snapshot().region.seenSurvey)throw Error('Actual fixed paths did not reach both regions');
 return {yes,no,a,b,ticks:ticks+1};
}
export function interveneAndAdvance(h,steps){
 const point=h.snapshot().region.battle;
 if(h.phase()==='choice'&&h.snapshot().region.state==='decision')h.choose('region-intervene');
 for(let i=0;i<steps;i++){
  const next=h.advance(navigate(h,point));
  if(next.status==='choice')h.choose(h.frameView().offers[0].id);
 }
 return h;
}
