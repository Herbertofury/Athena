// Explicit local backup admission. No overwrite, network or provider behavior.
import {validate} from './model.mjs';
import {parsePortableBackup} from '../../shared/portable-backup-admission.mjs';
export const MAX_IMPORT_NOTES = 100; // Admission budget for the current eager dependency UI, not a storage limit.
export const MAX_IMPORT_BYTES = 16 * 1024 * 1024;
const canonical = value => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
export function parseBackup(bytes) { return parsePortableBackup(bytes, validate, MAX_IMPORT_BYTES); }
export function mergeBackup(current, incoming) {
  const next = validate(current), backup = validate(incoming);
  // Unknown fields are retained, not silently discarded or overwritten.
  for (const key of Object.keys(backup)) {
    if (key === 'schema' || key === 'entries') continue;
    if (Object.hasOwn(next,key) && canonical(next[key]) !== canonical(backup[key])) throw Error('Backup metadata conflicts; existing projects were not changed');
    if (!Object.hasOwn(next,key)) Object.defineProperty(next,key,{value:structuredClone(backup[key]),enumerable:true,writable:true,configurable:true});
  }
  const known = new Map(next.entries.map(entry => [entry.id,entry]));
  let added = 0, unchanged = 0;
  for (const entry of backup.entries) {
    if (known.has(entry.id)) {
      if (canonical(known.get(entry.id)) !== canonical(entry)) throw Error('Backup contains a conflicting project ID; existing projects were not changed');
      unchanged++;
    } else {next.entries.push(entry);known.set(entry.id,entry);added++;}
  }
  if (next.entries.length > MAX_IMPORT_NOTES) throw Error('Import exceeds the current UI admission budget; no projects were changed');
  return {data:validate(next), added, unchanged};
}
