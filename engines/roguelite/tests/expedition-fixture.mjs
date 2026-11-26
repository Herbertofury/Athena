// SPDX-License-Identifier: GPL-3.0-or-later
import {createRecordedArena} from '../src/arena-replay.mjs';
export function followExpedition(seed=1) {
 const h=createRecordedArena({seed,format:'roaming-expedition-20'});
 const collections=[];let firstSight=null,cacheSight=null;
 for(let tick=0;tick<60*120;tick++){
  const s=h.snapshot();
  if(s.roaming.live?.kind==='geode'&&!firstSight)firstSight=h.capture();
  if(s.roaming.caches.length&&!cacheSight)cacheSight=h.capture();
  const target=s.roaming.caches[0]??s.roaming.live;
  // Use only ordinary recorded player input, never grant XP or modify enemies.
  const dx=target?target.x-s.player.x:10,dy=target?target.y-s.player.y:0;
  const mask=(Math.abs(dx)<6?0:dx>0?8:4)|(Math.abs(dy)<6?0:dy>0?2:1);
  const step=h.advance(mask);
  if(step.status==='choice'){
   const options=h.snapshot().offers;
   h.choose((options.find(x=>x.id==='speed')??options[0]).id);
  }
  for(const cue of step.audio)if(cue.resource)collections.push(cue.resource);
  if(collections.length===2||step.status==='finished')break;
 }
 return {h,collections,firstSight,cacheSight};
}
