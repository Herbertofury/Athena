// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {createRecordedArena} from '../src/arena-replay.mjs';
import {choose,walk} from './ashglass-fixture.mjs';
export const relayFormat='frontier-expedition-endless';
const step=(h,n)=>{for(let i=0;i<n;i++){if(h.phase()==='choice')choose(h);assert.equal(h.phase(),'running');h.advance(0);}};
export function relayTrail(){
 const h=createRecordedArena({seed:42,format:relayFormat});
 const v=()=>h.frameView().relay;
 walk(h,{...v().post,id:'first-relay'},()=>v().route==='decision',5000);
 const first=h.capture();
 h.choose('relay-supply');
 const supply=v().next;
 walk(h,{...supply,id:'supply-point'},()=>v().checked===1);
 const loaded=h.capture();
 walk(h,{...v().post,id:'supply-return'},()=>v().completed===1);
 const paid=h.capture();
 walk(h,{...v().post,id:'second-relay'},()=>v().route==='decision');
 const second=h.capture();
 h.choose('relay-watch');
 for(const i of [0,1]){
  walk(h,{...v().next,id:'watch-'+i},()=>v().progress>0);
  step(h,142);
  assert.equal(v().checked,i+1);
 }
 walk(h,{...v().post,id:'watch-return'},()=>v().completed===2);
 return {first,loaded,paid,second,finished:h};
}
