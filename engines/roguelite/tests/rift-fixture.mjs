// SPDX-License-Identifier: GPL-3.0-or-later
import {createRecordedArena} from '../src/arena-replay.mjs';
export function reachRift() {
 const h=createRecordedArena({format:'rift-expedition-20',seed:1});
 let snapshot;
 for(let n=0;n<60*140;n++){
  if(!snapshot||n%6===0)snapshot=h.snapshot();
  const {portal,player}=snapshot,point=portal.marker;
  const dx=point?point.x-player.x:10,dy=point?point.y-player.y:0;
  const mask=(Math.abs(dx)<6?0:dx>0?8:4)|(Math.abs(dy)<6?0:dy>0?2:1);
  const next=h.advance(mask);
  if(next.status==='finished')throw Error('Fixture ended before it reached the portal');
  if(next.status!=='choice')continue;
  snapshot=h.snapshot();
  const choices=snapshot.offers;
  if(snapshot.portal.awaitingDecision)return h;
  h.choose((choices.find(x=>x.id==='speed')??choices[0]).id);
 }
 throw Error('Fixture never reached rift');
}
