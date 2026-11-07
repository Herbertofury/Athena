export function validateBounds(count,bytes) {
  if(!Number.isInteger(count)||count<1||count>3000||!Number.isInteger(bytes)||bytes<64||bytes>65536||count*bytes>96*1024*1024)throw new RangeError('Dataset exceeds validated bounds');
}
export function makeData(count,bytes) {
  validateBounds(count,bytes);
  return Array.from({length:count},(_,i)=>{const id='card-'+String(i).padStart(6,'0');const prefix=id+'|';return {id,title:'Discovery '+String(i+1).padStart(4,'0'),description:'A complete generated record. Exact identity and full metadata retained.',metadata:prefix+'abcdefgh01234567'.repeat(Math.ceil((bytes-prefix.length)/16)).slice(0,bytes-prefix.length)};});
}
export function completePairs(samples) {
  const rounds=new Map();
  for(const sample of samples){if(!rounds.has(sample.round))rounds.set(sample.round,{});const pair=rounds.get(sample.round);if(pair[sample.strategy])throw Error('Duplicate strategy in one round');pair[sample.strategy]=sample;}
  return [...rounds.values()].filter(p=>{const initial=[p.containment,p.grouped_containment,p.metadata_containment].filter(Boolean);if(initial.length>1)throw Error('Ambiguous initial candidate');return (p.full_dom&&initial.length===1)||(p.full_dom_update&&p.keyed_update);});
}

export function updateOnePercent(records) {
  const stride=100;
  return records.map((r,i)=>i%stride===0?{...r,title:r.title+' · updated',metadata:r.metadata.slice(0,-1)+'Z'}:r);
}
export function workloadIsVisible(bounds,windowHeight) {
  return [bounds.top,bounds.bottom,bounds.height,windowHeight].every(Number.isFinite)&&windowHeight>0&&bounds.height>0&&bounds.top>=-1&&bounds.bottom<=windowHeight+1;
}

export function overlapsWindow(entry,start,end) {
  return [entry.start_ms,entry.duration_ms,start,end].every(Number.isFinite)&&entry.duration_ms>=0&&end>=start&&entry.start_ms<end&&entry.start_ms+entry.duration_ms>start;
}

export function partitionRecords(records, groupSize=12) {
  if(!Array.isArray(records)||!Number.isInteger(groupSize)||groupSize<1||groupSize>64)throw new RangeError('Invalid grouping input');
  const groups=[];
  for(let index=0;index<records.length;index+=groupSize)groups.push(records.slice(index,index+groupSize));
  return groups;
}
export function groupHeight(count,columns) {
  if(!Number.isInteger(count)||count<1||count>64||!Number.isInteger(columns)||columns<1||columns>3)throw new RangeError('Invalid group geometry');
  const rows=Math.ceil(count/columns);
  return rows*244+(rows-1)*14;
}

export function strategiesFor(operation,round) {
  if(!Number.isInteger(round)||round<0)throw new RangeError('Invalid round');
  const pairs={initial:['full_dom','containment'],grouped:['full_dom','grouped_containment'],metadata:['full_dom','metadata_containment'],update:['full_dom_update','keyed_update']};
  if(!Object.hasOwn(pairs,operation))throw new RangeError('Unknown operation');
  return round%2?[...pairs[operation]].reverse():[...pairs[operation]];
}
export function eventsInWindow(entries,start,end) {
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)throw new RangeError('Invalid event window');
  return entries.filter(entry=>overlapsWindow(entry,start,end));
}

export function retainCompleted(run,previous=null) {
  if(!run?.complete)return previous;
  if(!Array.isArray(run.samples)||!run.samples.length||completePairs(run.samples).length*2!==run.samples.length||run.samples.some(x=>x.complete_output_equal!==true))throw new Error('Incomplete or unequal run cannot replace last completed evidence');
  return structuredClone(run);
}

// Retain only observations overlapping the measured run, including delayed delivery.
// Idle events are not part of a benchmark and must not accumulate for the page lifetime.
export function retainWindowObservation(entries,entry,start,end) {
  if(!Array.isArray(entries))throw new TypeError('Observation collection must be an array');
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<start)return false;
  if(!overlapsWindow(entry,start,end))return false;
  entries.push(entry);return true;
}
