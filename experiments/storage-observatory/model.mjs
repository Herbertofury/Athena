// Original Athena code. No MetalForge source or assets are included.
export const demo = Object.freeze({source:'demo',capacityBytes:536870912000,categories:[
  {name:'Project sources',bytes:92341796864},{name:'Design library',bytes:64424509440},
  {name:'Build artifacts',bytes:48318382080},{name:'Media references',bytes:85899345920},
  {name:'Database snapshots',bytes:17179869184}]});
export function validateSnapshot(input) {
  if (!input || typeof input !== 'object' || !['demo','imported'].includes(input.source)) throw Error('Source must be demo or imported.');
  if (!Number.isSafeInteger(input.capacityBytes) || input.capacityBytes <= 0) throw Error('Capacity must be a positive safe integer in bytes.');
  if (!Array.isArray(input.categories) || input.categories.length > 100) throw Error('At most 100 categories are supported.');
  const names = new Set(); let usedBytes = 0;
  const categories = input.categories.map(category => {
    if (!category || typeof category.name !== 'string' || !category.name.trim() || category.name.length > 80 || /[\x00-\x1f\x7f]/.test(category.name)) throw Error('Category names must be 1–80 readable characters.');
    const name = category.name.trim();
    if (names.has(name.toLowerCase())) throw Error('Category names must be unique.');
    names.add(name.toLowerCase());
    if (!Number.isSafeInteger(category.bytes) || category.bytes < 0) throw Error('Category bytes must be non-negative safe integers.');
    usedBytes += category.bytes;
    if (!Number.isSafeInteger(usedBytes) || usedBytes > input.capacityBytes) throw Error('Category total exceeds capacity. Supply mutually exclusive categories.');
    return {name,bytes:category.bytes,share:category.bytes/input.capacityBytes};
  });
  return {source:input.source,capacityBytes:input.capacityBytes,usedBytes,freeBytes:input.capacityBytes-usedBytes,categories};
}
export function parseImport(text) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > 65536) throw Error('JSON snapshot must be 64 KiB or smaller.');
  const input=JSON.parse(text);
  // Imported data is never promoted to a trusted native scan, even if it claims one.
  return validateSnapshot({...input,source:'imported'});
}
export const formatBytes = value => `${(value/1073741824).toLocaleString(undefined,{maximumFractionDigits:1})} GiB`;

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
  if(input?.schema!=='athena-storage-observation-v1')return parseImport(text);
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
