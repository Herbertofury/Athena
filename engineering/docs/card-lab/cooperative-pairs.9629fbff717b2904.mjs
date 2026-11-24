import {completePairs as basePairs,strategiesFor as baseStrategies,retainCompleted as baseRetain,eventsInWindow} from './lab-core.07b69b8b7583dd03.mjs';
const names=['metadata_baseline','cooperative_metadata'];
export function strategiesFor(operation,round){
 if(operation!=='cooperative')return baseStrategies(operation,round);
 if(!Number.isInteger(round)||round<0)throw RangeError('Invalid round');
 return round%2?[...names].reverse():[...names];
}
export function completePairs(samples){
 if(!samples.some(s=>names.includes(s.strategy)))return basePairs(samples);
 if(samples.some(s=>!names.includes(s.strategy)))throw Error('Mixed cooperative pair');
 const originals=new Map();
 const mapped=samples.map(s=>{const mapped={...s,strategy:s.strategy===names[0]?'full_dom':'containment'};originals.set(mapped,s);return mapped;});
 return basePairs(mapped).map(pair=>({metadata_baseline:originals.get(pair.full_dom),cooperative_metadata:originals.get(pair.containment)}));
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
