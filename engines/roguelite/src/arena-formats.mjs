// SPDX-License-Identifier: GPL-3.0-or-later
// Explicit experimental endurance profiles. The source legacy rules stay separate.
const make=(id,minutes)=>Object.freeze({id,seconds:minutes===null?null:minutes*60});
export const ARENA_FORMATS=Object.freeze([
 make('classic',5),make('marathon-20',20),make('marathon-30',30),
 make('marathon-60',60),make('marathon-120',120),make('endless',null),
 Object.freeze({id:'roaming-expedition-20',seconds:20*60,roaming:true}),
 Object.freeze({id:'rift-expedition-20',seconds:20*60,roaming:true,rifts:true}),
 Object.freeze({id:'camp-expedition-20',seconds:20*60,roaming:true,rifts:true,camp:true}),
 Object.freeze({id:'frontier-expedition-30',seconds:30*60,roaming:true,rifts:true,camp:true,spatial:true}),
 Object.freeze({id:'frontier-expedition-60',seconds:60*60,roaming:true,rifts:true,camp:true,spatial:true,cavern:true}),
]);
const formats=new Map(ARENA_FORMATS.map(p=>[p.id,p]));
// Isolated side hosts are internal and never appear as standalone choices.
export function arcSideFormat(minutes) {
 if(![10,20,30].includes(minutes))throw new RangeError('Unsupported side duration');
 return make('isolated-rift-'+minutes,minutes);
}
export function arenaFormat(id) {
 const chosen=formats.get(id);
 if(!chosen)throw new RangeError('Unknown arena format');
 return chosen;
}
const phase=(key,label,at,pressure,activeLimit)=>Object.freeze({key,label,at,pressure,activeLimit});
const PHASES=Object.freeze([
 phase('onset','Onset',0,.20,45),
 phase('surge','Surge',.16,.36,65),
 phase('siege','Siege',.38,.56,85),
 phase('overrun','Overrun',.63,.78,105),
 phase('finale','Finale',.85,1,125)
]);
const ENDLESS_START=20*60;
const ENDLESS_CYCLE=2*60;
export function endurancePressure(format,elapsed) {
 if(format.id==='classic')throw new RangeError('Classic uses its unmodified source scheduling');
 if(!Number.isFinite(elapsed)||elapsed<0)throw new RangeError('Invalid arena clock');
 const progress=Math.min(1,elapsed/(format.seconds??ENDLESS_START));
 let stage=PHASES[0];
 for(const p of PHASES){if(progress>=p.at)stage=p;else break;}
 if(format.seconds===null&&elapsed>=ENDLESS_START){
  const wave=1+Math.floor((elapsed-ENDLESS_START)/ENDLESS_CYCLE);
  const cycle=((elapsed-ENDLESS_START)%ENDLESS_CYCLE)/ENDLESS_CYCLE;
  const breather=cycle<.25;
  return {stage:breather?'breather':'endless-surge',label:breather?'Breather':'Endless surge',
   wave,pressure:breather?.68:1,scale:1+Math.min(.75,Math.log2(wave)*.12),activeLimit:125};
 }
 return {stage:stage.key,label:stage.label,wave:null,pressure:stage.pressure,scale:1,activeLimit:stage.activeLimit};
}
