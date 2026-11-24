/** Preserve observation identity separately from provider-owned detail fields.
 * Invalid envelopes fail before insertion; this is not payload ownership validation.
 */
export function createMediaEvent(type, atMs, details={}) {
  if(typeof type!=='string'||!/^[a-z][a-z0-9_]{0,127}$/.test(type))
    throw new TypeError('Invalid event type');
  if(typeof atMs!=='number'||!Number.isFinite(atMs)||atMs<0)
    throw new TypeError('Invalid event timestamp');
  if(details===null||typeof details!=='object'||Array.isArray(details)||
      ![Object.prototype,null].includes(Object.getPrototypeOf(details)))
    throw new TypeError('Event details must be a plain object');
  for(const key of ['type','at_ms'])if(Object.hasOwn(details,key))
    throw new TypeError('Reserved event envelope key: '+key);
  return Object.freeze({type,at_ms:atMs,...details});
}
