// Explicit local backup admission. No overwrite, network or provider behavior.
import {validate} from './model.mjs';
export const MAX_IMPORT_NOTES = 100; // Admission budget for the current eager dependency UI, not a storage limit.
export const MAX_IMPORT_BYTES = 16 * 1024 * 1024;
const canonical = value => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
export function parseBackup(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength > MAX_IMPORT_BYTES) throw Error('Backup exceeds the local import budget or is not bytes');
  const text = new TextDecoder('utf-8', {fatal:true}).decode(bytes);
  const parsed = JSON.parse(text);
  // Reject duplicate keys and numerically lossy values before JSON's last-key-wins
  // normalization can silently change an explicit backup. No raw input is logged.
  const tokens = text.match(/"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null|[{}\[\]:,]/g) || [];
  function decimal(token) {
    const [mantissa, exponent = '0'] = token.toLowerCase().split('e');
    const negative = mantissa.startsWith('-');
    const parts = mantissa.replace(/^-/, '').split('.');
    let digits = (parts[0] + (parts[1] || '')).replace(/^0+/, '');
    if (!digits) return negative ? '-0' : '0';
    let power = BigInt(exponent) - BigInt((parts[1] || '').length);
    let end = digits.length;
    while (end > 0 && digits[end - 1] === '0') end--;
    const trailing = digits.length - end;
    if (trailing) {digits = digits.slice(0,-trailing);power += BigInt(trailing);}
    return (negative ? '-' : '') + digits + 'e' + power;
  }
  let at = 0;
  function scan(depth = 0) {
    if (depth > 128) throw Error('Backup nesting exceeds admission budget');
    const token = tokens[at++];
    if (token === '{') {
      const keys = new Set();
      if (tokens[at] !== '}') do {
        const key = JSON.parse(tokens[at++]);
        if (keys.has(key)) throw Error('Duplicate backup property');
        keys.add(key); at++; scan(depth + 1);
      } while (tokens[at] === ',' && ++at);
      at++;
    } else if (token === '[') {
      if (tokens[at] !== ']') do {scan(depth + 1);} while (tokens[at] === ',' && ++at);
      at++;
    } else if (/^-?\d/.test(token)) {
      const number = Number(token);
      if (!Number.isFinite(number) || (Number.isInteger(number) && !Number.isSafeInteger(number)) || decimal(token) !== decimal(JSON.stringify(number))) throw Error('Lossy backup number');
    }
  }
  scan();
  return validate(parsed);
}
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
