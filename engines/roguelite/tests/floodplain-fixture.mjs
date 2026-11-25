// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {createRecordedArena} from '../src/arena-replay.mjs';
import {choose,walk} from './ashglass-fixture.mjs';
export const floodplainFormat='frontier-expedition-90';
const mask=(dx,dy,e)=>(Math.abs(dx)<e?0:dx>0?8:4)|(Math.abs(dy)<e?0:dy>0?2:1);
export function reachFloodplain(){
 const h=createRecordedArena({seed:42,format:floodplainFormat});
 const {start,dock}=h.frameView().escort;
 walk(h,{...start,id:'ferry-launch'},()=>h.frameView().escort.state==='escorting',3500);
 for(let i=0;i<130;i++){if(h.phase()==='choice')choose(h);h.advance(0);}
 const crossing=h.capture();
 for(let n=0;n<1500&&h.frameView().escort.state==='escorting';n++){
  if(h.phase()==='choice')choose(h);
  const v=h.frameView(),{position}=v.escort;
  h.advance(mask(position.x-v.player.x,position.y-v.player.y,12));
 }
 assert.equal(h.frameView().escort.state,'docked');
 const waitingAtDock=h.capture();
 walk(h,{...dock,id:'ferry-dock'},()=>h.frameView().escort.recruited);
 assert.equal(h.frameView().escort.remedies,2);
 for(let n=0;n<5000;n++){
  if(h.phase()==='choice'){
   if(h.frameView().offers.some(x=>x.id==='camp-ferryman-remedy'))return {crossing,waitingAtDock,injuredCamp:h};
   choose(h);
  }
  assert.equal(h.phase(),'running');
  const v=h.frameView(),m=v.camp.mark;
  h.advance(m?mask(m.x-v.player.x,m.y-v.player.y,5):v.player.hp>85?0:8);
 }
 throw Error('Ordinary movement did not find an injured camp');
}
