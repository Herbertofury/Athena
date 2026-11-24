import {completePairs as basePairs,strategiesFor as baseStrategies,retainCompleted as baseRetain,eventsInWindow} from './lab-core.07b69b8b7583dd03.mjs';
const names=['metadata_baseline','cooperative_metadata','cooperative_root'];
export function strategiesFor(operation,round){
 if(!['cooperative','cooperative-root'].includes(operation))return baseStrategies(operation,round);
 if(!Number.isInteger(round)||round<0)throw RangeError('Invalid round');
 const selected=[names[0],operation==='cooperative-root'?names[2]:names[1]];return round%2?selected.reverse():selected;
}
export function completePairs(samples){
 if(!samples.some(s=>names.includes(s.strategy)))return basePairs(samples);
 if(samples.some(s=>!names.includes(s.strategy)))throw Error('Mixed cooperative pair');
 const originals=new Map();
 const mapped=samples.map(s=>{const mapped={...s,strategy:s.strategy===names[0]?'full_dom':'containment'};originals.set(mapped,s);return mapped;});
 return basePairs(mapped).map(pair=>{const candidate=originals.get(pair.containment);return {metadata_baseline:originals.get(pair.full_dom),[candidate.strategy]:candidate};});
}

export function retainCompleted(run,previous=null){
 if(!run?.complete||!Array.isArray(run.samples)||!run.samples.some(s=>names.includes(s.strategy)))return baseRetain(run,previous);
 if(run.samples.some(s=>!names.includes(s.strategy)))throw Error('Mixed cooperative pair');
 const mapped={...run,samples:run.samples.map(s=>({...s,strategy:s.strategy===names[0]?'full_dom':'containment'}))};
 const retained=baseRetain(mapped,previous);
 for(let i=0;i<retained.samples.length;i++)retained.samples[i].strategy=run.samples[i].strategy;
 return retained;
}
export function refreshInputEvidence(run,entries,previousCompleted){
 run.observed_input_events=eventsInWindow(entries,run.performance_start_ms,run.performance_end_ms);
 return run.complete?retainCompleted(run,previousCompleted):previousCompleted;
}
