// Local report inspection only. Never audits a checkout or changes consumer pins.
export const MAX_AUDIT_BYTES = 2 * 1024 * 1024;
const text = (v, max=2000) => typeof v === 'string' && v.length <= max;
const count = v => Number.isSafeInteger(v) && v >= 0;
const hash = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const list = (v,max) => Array.isArray(v) && v.length <= max;
export function parseConsumerAudit(bytes) {
 if (!(bytes instanceof Uint8Array) || bytes.byteLength > MAX_AUDIT_BYTES) throw Error('Report exceeds the 2 MiB limit or is not readable bytes.');
 let report;
 try {
 const text = new TextDecoder('utf-8',{fatal:true}).decode(bytes);
 report = JSON.parse(text);
  // Reject duplicate keys and numerically lossy values before JSON's last-key-wins
  // normalization can silently change an explicit report. No raw input is logged.
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
    if (depth > 128) throw Error('Report nesting exceeds admission budget');
    const token = tokens[at++];
    if (token === '{') {
      const keys = new Set();
      if (tokens[at] !== '}') do {
        const key = JSON.parse(tokens[at++]);
        if (keys.has(key)) throw Error('Duplicate report property');
        keys.add(key); at++; scan(depth + 1);
      } while (tokens[at] === ',' && ++at);
      at++;
    } else if (token === '[') {
      if (tokens[at] !== ']') do {scan(depth + 1);} while (tokens[at] === ',' && ++at);
      at++;
    } else if (/^-?\d/.test(token)) {
      const number = Number(token);
      if (!Number.isFinite(number) || (Number.isInteger(number) && !Number.isSafeInteger(number)) || decimal(token) !== decimal(JSON.stringify(number))) throw Error('Lossy report number');
    }
  }
  scan();
 }
 catch { throw Error('Report must be unambiguous UTF-8 JSON without duplicate keys or lossy numbers. Previous report retained.'); }
 const invalid = () => { throw Error('Unsupported or incomplete consumer audit report. Previous report retained.'); };
 if(report?.schema !== 1 || report.producer !== 'Athena guidance consumer audit' || !list(report.consumers,100)) invalid();
 for(const c of report.consumers){
  if(!c || !text(c.label,200) || typeof c.head !== 'string' || !/^[a-f0-9]{40}$/.test(c.head) || !text(c.scope) || !text(c.referenceDisposition) || !text(c.retirementReason) || c.legacyRetirementReady !== false || c.writesPerformed !== false || typeof c.remainingConsumerWork !== 'boolean' || !count(c.scannedTextFiles) || !list(c.uninspectedPaths,10000) || !c.uninspectedPaths.every(p=>text(p)) || !list(c.legacyReferences,10000) || !list(c.locks,2) || c.locks.length !== 2) invalid();
  const kinds=new Set();
  for(const lock of c.locks){
   if(!lock || !['legacy','athena'].includes(lock.kind) || kinds.has(lock.kind) || typeof lock.present !== 'boolean' || !['absent','unverified','foreign-or-invalid','needs-review','legacy-migration-required','athena-pin-matches'].includes(lock.state)) invalid();
   kinds.add(lock.kind);
   if(lock.issues !== undefined && (!list(lock.issues,1000) || !lock.issues.every(i=>text(i)))) invalid();
   if(lock.snapshots !== undefined && (!list(lock.snapshots,1000) || !lock.snapshots.every(s=>s && text(s.path) && ['unchanged','missing-or-locally-modified'].includes(s.state) && typeof s.matchesPreservedCanonical==='boolean' && (s.sha256===null || hash(s.sha256))))) invalid();
  }
  for(const ref of c.legacyReferences) if(!ref || !text(ref.path) || !hash(ref.sha256) || !ref.counts || !['sourceUrl','snapshotPath','statePath'].every(k=>count(ref.counts[k]))) invalid();
 }
 return report;
}
export function attachConsumerAudit({host,signal}={}) {
 const doc=host.ownerDocument;let disposed=false,generation=0;
 const el=(tag,value)=>{const e=doc.createElement(tag);if(value!==undefined)e.textContent=value;return e;};
 const title=el('h3','Review a local consumer audit'),intro=el('p','Open JSON produced by Athena guidance/tools/audit_consumers.py. This displays reported evidence only, not a live audit or an authenticated result. No checkout is opened, no instructions installed, no report uploaded or saved. Files and paths may be private; review locally.');
 const label=el('label','Choose consumer audit JSON (up to 2 MiB)'),input=el('input');input.type='file';input.accept='.json,application/json';label.append(input);
 const clear=el('button','Clear local audit view');clear.type='button';const status=el('p','No report loaded.'),results=el('div');status.setAttribute('role','status');
 host.replaceChildren(title,intro,label,clear,status,results);
 function render(report){
  const nodes=[el('p',`${report.consumers.length} reported consumer(s). Source retirement is NOT established by this report, including when no remaining consumer work is reported.`)];
  for(const c of report.consumers){const section=el('section');section.append(el('h4',c.label),el('p',`Reported checkout revision: ${c.head}`),el('p',`Reported coverage: ${c.scannedTextFiles} tracked text files; ${c.uninspectedPaths.length} uninspected paths; ${c.legacyReferences.length} files with legacy references.`),el('p',c.remainingConsumerWork?'Reported consumer work remains.':'No remaining consumer work reported. This is not proof of migration completeness.'),el('p',c.referenceDisposition));
   for(const lock of c.locks){section.append(el('p',`${lock.kind} pin: ${lock.state}`));for(const issue of lock.issues||[])section.append(el('p','Reported issue: '+issue));}
   const details=el('details'),summary=el('summary','Inspect complete reported evidence'),raw=el('pre',JSON.stringify(c,null,2));raw.style.whiteSpace='pre-wrap';raw.style.overflowWrap='anywhere';details.append(summary,raw);section.append(details);nodes.push(section);
  }
  results.replaceChildren(...nodes);
 }
 input.onchange=async()=>{const token=++generation,file=input.files?.[0];if(disposed||!file)return;status.textContent='Reading local report…';try{if(!count(file.size)||file.size>MAX_AUDIT_BYTES)throw Error('Report exceeds the 2 MiB limit. Previous report retained.');const bytes=new Uint8Array(await file.arrayBuffer());if(disposed||token!==generation)return;const report=parseConsumerAudit(bytes);render(report);status.textContent='Local report opened for this view only. Evidence is reported, not independently verified.';}catch(error){if(!disposed&&token===generation)status.textContent=error.message;}finally{if(!disposed&&token===generation)input.value='';}};
 function clearView(){if(disposed)return;generation++;input.value='';results.replaceChildren();status.textContent='Local audit view cleared. Original file unchanged.';}
 clear.onclick=clearView;
 function unmount(){if(disposed)return;disposed=true;generation++;input.onchange=null;clear.onclick=null;host.replaceChildren();signal?.removeEventListener('abort',unmount);}
 signal?.addEventListener('abort',unmount,{once:true});if(signal?.aborted)unmount();return {unmount};
}
