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
