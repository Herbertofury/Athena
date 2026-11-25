// SPDX-License-Identifier: GPL-3.0-or-later
import {createRecordedArena} from '../src/arena-replay.mjs';
export function reachCamp() {
 const h=createRecordedArena({format:'camp-expedition-20',seed:1});
 let s;
 for(let n=0;n<60*150;n++){
  if(!s||n%6===0)s=h.frameView();
  const haveLoot=s.camp.balance.crystal>=12||s.camp.balance.gold>=24;
  const point=s.roaming.caches[0]??(haveLoot?s.camp.mark:null)??s.roaming.live;
  const dx=point?point.x-s.player.x:10,dy=point?point.y-s.player.y:0;
  const mask=(Math.abs(dx)<5?0:dx>0?8:4)|(Math.abs(dy)<5?0:dy>0?2:1);
  const next=h.advance(mask);
  if(next.status==='finished')throw Error('Fixture ended before the camp');
  if(next.status!=='choice')continue;
  s=h.frameView();
  const shop=s.offers.find(o=>o.id==='camp-totem');
  if(shop)return h;
  const fallback=s.offers.find(o=>o.id==='camp-stay'||o.id==='rift-stay'||o.id==='speed');
  h.choose((fallback??s.offers[0]).id);
 }
 throw Error('Fixture did not reach camp with earned crystal');
}
