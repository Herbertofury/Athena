// Shared report format from the tested Observatory root measurement.
const observationKeys=['logicalBytes','allocatedBytes','files'];
const stopKeys=['entryLimit','depthLimit','deadline','unreadable','changed'];
const skipKeys=['links','mounts','special'];
const storageInt=value=>Number.isSafeInteger(value)&&value>=0;
const runSums=(record,keys)=>Object.fromEntries(keys.map(key=>{
  if(!storageInt(record?.[key]))throw Error('Invalid observation counters.');
  return [key,record[key]];
}));
export function parseStorageReport(text){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>65536)throw Error('JSON snapshot must be 64 KiB or smaller.');
  const input=JSON.parse(text);
  if(input?.schema!=='athena-storage-observation-v1')throw Error('Select an Athena observation report (schema v1).');
  if(input.platform!=='linux'||typeof input.partial!=='boolean'||!Array.isArray(input.categories)||input.categories.length>34||typeof input.observedAt!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(input.observedAt)||!Number.isFinite(Date.parse(input.observedAt)))throw Error('Invalid observation scope.');
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
 else if(![before,after].every(report=>new Date(report.observedAt).toISOString().replace('.000Z','Z')===report.observedAt))reason='No comparison change: observation dates could not be confirmed as canonical UTC timestamps.';
 else if(after.observedAt<=before.observedAt)reason='No comparison change: the second report must be dated later than the reference.';
 else if(skipKeys.some(key=>before.skipped[key]!==after.skipped[key]))reason='No comparison change: reported exclusion counts differ.';
 else if(categoryShape(before)!==categoryShape(after))reason='No comparison change: reported category configurations differ.';
 const eligible=!reason;
 if(!eligible)return {reason,eligible};
 if(!asserted)return {reason:'No comparison change yet. Only confirm if you used the same folder and scan settings.',eligible};
 const metrics=[...observationKeys,'physicalFiles'];
 const existing=new Map(before.categories.map(row=>[row.name,row]));
 const latest=new Map(after.categories.map(row=>[row.name,row]));
 const categoryChanges=[...new Set([...existing.keys(),...latest.keys()])].sort().map(name=>{
  const earlier=existing.get(name), later=latest.get(name);
  return {name, presence:earlier&&later?'both':earlier?'earlier-only':'later-only',
   changes:earlier&&later?Object.fromEntries(observationKeys.map(key=>[key,later[key]-earlier[key]])):null};
 });
 return {eligible,reason:'Observed later minus earlier. You supplied the same-folder/settings assertion; the reports cannot verify it. This is not free or reclaimable space.',changes:Object.fromEntries(metrics.map(k=>[k,after.totals[k]-before.totals[k]])),categoryChanges};
}

const windowsCounters=['records_examined','observed_file_pathnames','logical_pathname_bytes',
 'identified_unique_files','observed_identified_allocation_bytes','excluded_directories',
 'excluded_reparse_entries','files_without_stable_id','identity_or_name_conflicts'];
const windowsFlags=['stopped_entry_limit','stopped_batch_limit','partial','point_in_time_snapshot','reclaimable_space_inferred'];
const windowsFields=new Set(['schema','scope',...windowsCounters,...windowsFlags]);
export function parseWindowsDirectoryReport(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>4096)throw Error('Select Windows directory observation JSON up to 4 KiB.');
 const input=JSON.parse(text);
 if(input?.schema!=='athena-windows-directory-observation-v1'||
    input.scope!=='Explicit directory direct children only. No child content, recursion, names, IDs or paths returned.'||
    Object.keys(input).some(key=>!windowsFields.has(key))||
    windowsFlags.some(key=>typeof input[key]!=='boolean')||
    input.point_in_time_snapshot||input.reclaimable_space_inferred)throw Error('Invalid Windows directory observation v1.');
 const v=runSums(input,windowsCounters);
 const {records_examined:entries,observed_file_pathnames:files,identified_unique_files:identified,
  files_without_stable_id:unknown,identity_or_name_conflicts:conflicts,excluded_directories:dirs,
  excluded_reparse_entries:reparse,observed_identified_allocation_bytes:allocated,logical_pathname_bytes:logical}=v;
 const counted=files+dirs+reparse;
 if(entries>100000||counted>entries||entries-counted>conflicts||conflicts>entries||
    unknown>files||identified>files-unknown||(!identified&&(allocated!==0||files!==unknown))||(!files&&logical!==0)||
    input.partial!==Boolean(input.stopped_entry_limit||input.stopped_batch_limit||unknown||conflicts))
  throw Error('Inconsistent Windows directory observation.');
 return {...v,...Object.fromEntries(windowsFlags.map(key=>[key,input[key]]))};
}

const windowsMetrics=['logical_pathname_bytes','observed_identified_allocation_bytes','observed_file_pathnames','identified_unique_files'];
export function compareWindowsDirectoryReports(before,after,asserted=false){
 if(!before||!after)return {eligible:false,reason:'Choose a Windows reference and a second observation.'};
 if(before.partial||after.partial)return {eligible:false,reason:'No differences shown: at least one Windows observation was partial.'};
 if(before.excluded_directories!==after.excluded_directories||before.excluded_reparse_entries!==after.excluded_reparse_entries)
  return {eligible:false,reason:'No differences shown: excluded directory or reparse-entry counts differ.'};
 if(!asserted)return {eligible:true,reason:'Only confirm if these are the same directory and settings, in the order you intend.'};
 return {eligible:true,reason:'Second observation minus reference. Folder, order and settings were not verified by Athena. Not free or reclaimable space.',
  changes:Object.fromEntries(windowsMetrics.map(key=>[key,after[key]-before[key]]))};
}
