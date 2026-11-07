export function makeData(count,bytes) {
  if(!Number.isInteger(count)||count<1||count>3000||!Number.isInteger(bytes)||bytes<64||bytes>65536||count*bytes>96*1024*1024)throw new RangeError('Dataset exceeds validated bounds');
  return Array.from({length:count},(_,i)=>{const id='card-'+String(i).padStart(6,'0');const prefix=id+'|';return {id,title:'Discovery '+String(i+1).padStart(4,'0'),description:'A complete generated record. Exact identity and full metadata retained.',metadata:prefix+'abcdefgh01234567'.repeat(Math.ceil((bytes-prefix.length)/16)).slice(0,bytes-prefix.length)};});
}
export function completePairs(samples) {
  const rounds=new Map();
  for(const sample of samples){if(!rounds.has(sample.round))rounds.set(sample.round,{});const pair=rounds.get(sample.round);if(pair[sample.strategy])throw Error('Duplicate strategy in one round');pair[sample.strategy]=sample;}
  return [...rounds.values()].filter(p=>(p.full_dom&&p.containment)||(p.full_dom_update&&p.keyed_update));
}

export function updateOnePercent(records) {
  const stride=100;
  return records.map((r,i)=>i%stride===0?{...r,title:r.title+' · updated',metadata:r.metadata.slice(0,-1)+'Z'}:r);
}
export function workloadIsVisible(bounds,windowHeight) {
  return [bounds.top,bounds.bottom,bounds.height,windowHeight].every(Number.isFinite)&&windowHeight>0&&bounds.height>0&&bounds.top>=-1&&bounds.bottom<=windowHeight+1;
}
