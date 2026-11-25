// Shared report format from the tested Observatory root measurement.
const observationKeys=['logicalBytes','allocatedBytes','files'];
const stopKeys=['entryLimit','depthLimit','deadline','unreadable','changed'];
const skipKeys=['links','mounts','special'];
const storageInt=value=>Number.isSafeInteger(value)&&value>=0;
const runSums=(record,keys)=>Object.fromEntries(keys.map(key=>{
  if(!storageInt(record?.[key]))throw Error('Invalid observation counters.');
  return [key,record[key]];
}));
// Standard JSON parsing validates syntax but silently chooses the last duplicate
// field. Check decoded names against their own object, including escaped aliases.
function rejectDuplicateFields(text){
  const tokens=/("(?:[^"\\]|\\.)*")(\s*:)?|[{}\[\]]/g,scope=[];
  for(const token of text.matchAll(tokens)){
    if(token[2]){
      const fields=scope.at(-1),key=JSON.parse(token[1]);
      if(fields.has(key))throw Error('Duplicate observation property.');
      fields.add(key);
    }else if(token[0]==='{')scope.push(new Set());
    else if(token[0]==='[')scope.push(null);
    else if(token[0]==='}'||token[0]===']')scope.pop();
  }
}
function isCanonicalUtc(value){
  return typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value)
    &&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().replace('.000Z','Z')===value;
}
export function parseStorageReport(text){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>65536)throw Error('JSON snapshot must be 64 KiB or smaller.');
  const input=JSON.parse(text);
  rejectDuplicateFields(text);
  if(input?.schema!=='athena-storage-observation-v1')throw Error('Select an Athena observation report (schema v1).');
  if(input.platform!=='linux'||typeof input.partial!=='boolean'||!Array.isArray(input.categories)||input.categories.length>34||!isCanonicalUtc(input.observedAt))throw Error('Invalid observation scope.');
  const stops=runSums(input.stops,stopKeys),skipped=runSums(input.skipped,skipKeys),totals=runSums(input.totals,[...observationKeys,'physicalFiles']);
  if(input.partial!==Object.values(stops).some(Boolean)||totals.physicalFiles>totals.files)throw Error('Inconsistent observation state.');
  const names=new Set(),sum={logicalBytes:0,allocatedBytes:0,files:0};
  const categories=input.categories.map(category=>{
    const name=category?.name;
    if(typeof name!=='string'||!name.trim()||name.length>80||/[\x00-\x1f\x7f]/.test(name)||names.has(name.trim().toLowerCase()))throw Error('Invalid observation category.');
    names.add(name.trim().toLowerCase());const values=runSums(category,observationKeys);
    for(const k of observationKeys){sum[k]+=values[k];if(!storageInt(sum[k]))throw Error('Observation counter overflow.');}
    return {name:name.trim(),...values};
  });
  if(observationKeys.some(key=>sum[key]!==totals[key]))throw Error('Category totals do not match the observation.');
  return {source:'imported-measurement',platform:'linux',observedAt:input.observedAt,partial:input.partial,totals,stops,skipped,categories};
}
export function formatMeasurement(value){
  if(value<1024)return `${value.toLocaleString()} B`;
  if(value<1048576)return `${(value/1024).toLocaleString(undefined,{maximumFractionDigits:2})} KiB`;
  if(value<1073741824)return `${(value/1048576).toLocaleString(undefined,{maximumFractionDigits:2})} MiB`;
  return `${(value/1073741824).toLocaleString(undefined,{maximumFractionDigits:2})} GiB`;
}

// The scanner always emits explicit labels, including empty ones. Optional
// built-in buckets may appear/disappear without changing category configuration.
const categoryShape=report=>JSON.stringify(report.categories.map(row=>row.name)
 .filter(name=>name!=='Other entries'&&name!=='Shared across categories').sort());

// Both inputs are validated Linux v1 observations. Schema and byte units match;
// folder identity and scan/category settings are intentionally not in this format.
export function compareObservations(before,after,asserted=false){
 if(!before||!after)return {reason:'Select a reference report and a second report.',eligible:false};
 let reason='';
 if(before.partial||after.partial)reason='No comparison change: at least one report stopped or missed entries. These are observed values only.';
 else if(![before,after].every(report=>isCanonicalUtc(report.observedAt)))reason='No comparison change: observation dates could not be confirmed as canonical UTC timestamps.';
 else if(after.observedAt<=before.observedAt)reason='No comparison change: the second report must be dated later than the reference.';
 else if(skipKeys.some(key=>before.skipped[key]!==after.skipped[key]))reason='No comparison change: reported exclusion counts differ.';
 else if(categoryShape(before)!==categoryShape(after))reason='No comparison change: reported category configurations differ.';
 const eligible=!reason;
 if(!eligible)return {reason,eligible};
 if(!asserted)return {reason:'No comparison change yet. Only confirm if you used the same folder and scan settings.',eligible};
 const metrics=[...observationKeys,'physicalFiles'];
 return {eligible,reason:'Observed later minus earlier. You supplied the same-folder/settings assertion; the reports cannot verify it. This is not free or reclaimable space.',changes:Object.fromEntries(metrics.map(k=>[k,after.totals[k]-before.totals[k]]))};
}
