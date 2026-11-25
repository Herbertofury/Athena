const $ = id => document.getElementById(id);
const element = (tag, text = '') => Object.assign(document.createElement(tag), {textContent:text});
const sha = /^[a-f0-9]{40}$/;
const source = /^https:\/\/github\.com\/Herbertofury\/Engineering-Atlas\/(tree|blob)\/[a-f0-9]{40}\/([A-Za-z0-9_.\/-]+)$/;
const notes = new Set(['README.md', 'results-table.md']);
const safePath = path => typeof path === 'string' && /^[A-Za-z0-9_.\/-]+$/.test(path)
  && path.split('/').every(s => s && s !== '.' && s !== '..');
const hex = async (algorithm, bytes) => [...new Uint8Array(await crypto.subtle.digest(algorithm,bytes))]
  .map(n=>n.toString(16).padStart(2,'0')).join('');
const read = async path => {
  const res = await fetch(path, {cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(8000)});
  if (!res.ok) throw Error(`Local archive read failed (${res.status}).`);
  return res;
};
function makeTarget(t) {
  const parsed = typeof t.original === 'string' && source.exec(t.original);
  if (!parsed || !safePath(parsed[2]) || t.kind !== parsed[1] || !sha.test(t.source_object)
      || !Array.isArray(t.files) || !t.files.length || t.files.length > 200
      || t.files.some(f=>!safePath(f.path) || !sha.test(f.blob))
      || new Set(t.files.map(f=>f.path)).size !== t.files.length)
    throw Error('Invalid historical target. The archive was not displayed.');
  const files = t.files.filter(f=>notes.has(f.path));
  const card = element('article'); card.className='runner';
  const upstream = element('a', 'Open pinned original on GitHub'); upstream.href=t.original;
  card.append(element('h2', parsed[2]), element('p', `${t.kind} · ${t.files.length} indexed files · ${t.source_object}`), upstream);
  for (const file of files) {
    const row=element('p'), button=element('button', `Read offline: ${file.path}`);
    button.type='button'; button.addEventListener('click',()=>showDocument(t, file));
    row.append(button); card.append(row);
  }
  if (!files.length) card.append(element('p','Index only. No executable source is served.'));
  const index = element('details'); index.append(element('summary','Indexed files'));
  const list = element('ul');
  for (const f of t.files) list.append(element('li', `${f.path} · ${f.blob}`));
  index.append(list); card.append(index);
  return {card, offline:files.length>0, haystack:`${t.original} ${t.source_object} ${list.textContent}`.toLowerCase()};
}
let selection = 0;
async function showDocument(t, file) {
  const current = ++selection;
  $('reader').hidden=false;
  $('reader-title').textContent=file.path;
  $('reader-title').focus();
  $('reader-status').textContent='Verifying original Git blob…';
  $('document').textContent='';
  try {
    const r = await read(`/api/migration/atlas/${t.source_object}/${file.path}`);
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bytes.length > 65536) throw Error('Unexpected document size.');
    const prefix = new TextEncoder().encode(`blob ${bytes.length}\0`);
    const blob = new Uint8Array(prefix.length+bytes.length); blob.set(prefix); blob.set(bytes,prefix.length);
    if (await hex('SHA-1',blob) !== file.blob) throw Error('Git blob checksum mismatch. Document not shown.');
    const content = new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    if (current !== selection) return;
    $('document').textContent=content;
    $('reader-status').textContent=`Verified original Git blob ${file.blob}. This is historical source text.`;
  } catch(error) { if (current===selection) $('reader-status').textContent=error.message; }
}
async function load(){
  try {
    const r=await read('/api/migration/atlas'), bytes=await r.arrayBuffer();
    const expected=r.headers.get('x-athena-snapshot-sha256');
    if (bytes.byteLength > 131072 || !/^[a-f0-9]{64}$/.test(expected??'') || await hex('SHA-256',bytes)!==expected)
      throw Error('Manifest checksum mismatch. The archive was not displayed.');
    const data=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    if (data.schema_version!==1 || !Array.isArray(data.targets) || !data.targets.length || data.targets.length>100
        || !/^\d{4}-\d\d-\d\d$/.test(data.review_date)
        || new Set(data.targets.map(t=>t.source_object)).size!==data.targets.length)
      throw Error('Unsupported archive manifest.');
    const rows=data.targets.map(makeTarget);
    $('targets').append(...rows.map(r=>r.card));
    $('pin').textContent=`Reviewed ${data.review_date} · verified SHA-256 ${expected}`;
    const update=()=>{
      const terms=$('search').value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const mode=$('scope').value; let visible=0;
      for (const {card,offline,haystack} of rows) {
        card.hidden=!terms.every(s=>haystack.includes(s)) || Boolean(mode && offline!==(mode==='offline'));
        if (!card.hidden) visible++;
      }
      $('status').textContent=`${visible} of ${rows.length} historical targets · ${rows.filter(r=>r.offline).length} with offline notes`;
    };
    $('search').addEventListener('input', update); $('scope').addEventListener('change', update);
    $('filters').hidden=false; update();
  } catch(error) { $('status').textContent=error.message; }
}
load();
