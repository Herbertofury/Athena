// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {createRecordedArena} from '../src/arena-replay.mjs';
export const ashglassFormat='frontier-expedition-60';
export const choose=h=>{const o=h.frameView().offers;h.choose((o.find(v=>['rift-stay','camp-stay','region-detour','speed'].includes(v.id))??o[0]).id);};
export function walk(h,p,satisfied,cap=1900){
 for(let n=0;n<cap&&!satisfied();n++){
  if(h.phase()==='choice')choose(h);
  assert.equal(h.phase(),'running');
  const {x,y}=h.frameView().player, dx=p.x-x,dy=p.y-y;
  h.advance((Math.abs(dx)<5?0:dx>0?8:4)|(Math.abs(dy)<5?0:dy>0?2:1));
 }
 assert.ok(satisfied(), 'ordinary movement did not reach target: '+p.id);
}
export function routeAshglass(){
 const trial=createRecordedArena({seed:42,format:ashglassFormat});
 const {mouth,pedestal,mirrors,order}=trial.snapshot().cavern;
 walk(trial,mouth,()=>trial.snapshot().cavern.entered);
 walk(trial,mirrors[order[0]],()=>trial.snapshot().cavern.aligned===1);
 const first=trial.capture();
 walk(trial,mirrors[order[1]],()=>trial.snapshot().cavern.aligned===2);
 walk(trial,mirrors[order[2]],()=>trial.snapshot().cavern.vaultOpen);
 const direction=Math.sign(pedestal.x-mouth.x);
 const dock={id:'vault-approach',x:pedestal.x-direction*37,y:pedestal.y};
 walk(trial,dock,()=>{
  const p=trial.frameView().player;
  return Math.abs(p.x-dock.x)<6&&Math.abs(p.y-dock.y)<6;
 });
 assert.equal(trial.snapshot().cavern.taken,false);
 return {first,trial,key:direction>0?'ArrowRight':'ArrowLeft'};
}
