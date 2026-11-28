const familyFields = {
  theme_packages:['id','name','package_version','approved','world_name','material_language','motion','raw_json'],
  rooms:['id','theme_id','district_id','name','lineage','raw_json'],
  ecology_objects:['id','theme_id','name','role','material','shape','affordances_json','behavior_json','raw_json'],
  artist_worlds:['id','artist_id','name','variant','description','palette','material_language','shape_language','lighting','ui_language','mascot','guardrail','raw_json'],
  artist_districts:['id','artist_id','name','thesis','environment_weather','best_use_mode','raw_json'],
  artist_weather:['id','artist_id','name','intensity','behavior','routing','guardrails','raw_json'],
  music_routes:['id','artist_id','label','routing','spotify_uri','url','status','notes','raw_json']
};
const $=id=>document.getElementById(id);
const plain=x=>x!==null&&typeof x==='object'&&Object.getPrototypeOf(x)===Object.prototype;
const exact=(object,fields)=>plain(object)&&Object.keys(object).length===fields.length&&fields.every(k=>Object.hasOwn(object,k));
const label=key=>key.replaceAll('_',' ').replace(/^./,c=>c.toUpperCase());
const el=(tag,text)=>Object.assign(document.createElement(tag),{textContent:text});
const pageSize=48, cap=12*1024*1024;
const encoder=new TextEncoder();
let pending=0, inspected=0, current, shown=pageSize;
function parse(text){
  const payload=text.endsWith('\n')?text.slice(0,-1):text;
  const x=JSON.parse(payload);
  if(JSON.stringify(x)!==payload || !exact(x,['schema','format','families']) ||
     ![1,2].includes(x.schema)||x.format!=='feature-foundry-v24-catalog'||!Array.isArray(x.families))throw Error();
  const expected=Object.keys(familyFields).slice(0,x.schema===1?3:7);
  let count=0;
  if(x.families.length!==expected.length)throw Error();
  for(const [i,f] of x.families.entries()){
    if(!exact(f,['name','rows'])||f.name!==expected[i])throw Error();
    if(f.rows===null&&i>=2)continue;
    if(!Array.isArray(f.rows)||(count+=f.rows.length)>5000)throw Error();
    const ids=new Set(),fields=familyFields[f.name];
    for(const row of f.rows){
      if(!exact(row,['original_fields','original_json_sha256'])||!exact(row.original_fields,fields)||
         typeof row.original_json_sha256!=='string'||!/^[0-9a-f]{64}$/.test(row.original_json_sha256))throw Error();
      for(const [k,value] of Object.entries(row.original_fields)){
        if(k==='approved'?![0,1].includes(value):typeof value!=='string'||encoder.encode(value).byteLength>256*1024)throw Error();
      }
      const id=row.original_fields.id;
      if(!id.trim()||ids.has(id))throw Error();
      ids.add(id);
    }
  }
  return x.families;
}
async function sha256(bytes){
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
}
function clearDetail(){
  inspected++;
  $('record-heading').textContent='Choose a record';
  $('verification').textContent='';
  $('fields').replaceChildren();
  $('raw').open=false;$('raw').hidden=true;$('raw-text').textContent='';
}
async function open(row){
  clearDetail();
  const token=inspected, f=row.original_fields;
  $('record-heading').textContent=f.name??f.label??f.id;
  $('record-heading').focus();
  $('verification').textContent='Checking the raw JSON fingerprint…';
  try{
    const hex=await sha256(encoder.encode(f.raw_json));
    if(token!==inspected)return;
    if(hex!==row.original_json_sha256)throw Error();
    JSON.parse(f.raw_json); // Validate syntax only; render the exact original string.
    $('verification').textContent='Raw JSON fingerprint matches this archive entry.';
    const fields=document.createDocumentFragment();
    for(const [key,value] of Object.entries(f)){
      if(key==='raw_json')continue;
      const detail=el('dd',String(value));
      fields.append(el('dt',label(key)),detail);
    }
    $('fields').replaceChildren(fields);
    $('raw-text').textContent=f.raw_json;$('raw').hidden=false;
  }catch{
    if(token===inspected)$('verification').textContent='Could not verify this record’s raw JSON. Its details were not opened.';
  }
}
function render(){
  const family=current?.find(f=>f.name===$('family').value);
  if(!family)return;
  const q=$('query').value.trim().toLowerCase();
  const rows=family.rows?.filter(row=>[row.original_fields.name,row.original_fields.label,row.original_fields.id].some(v=>v?.toLowerCase().includes(q)))??[];
  $('matches').textContent=family.rows===null?'This table was absent from the original file.':
    `Showing ${Math.min(shown,rows.length)} of ${rows.length} matching records. ${family.rows.length} records in this family.`;
  $('records').replaceChildren(...rows.slice(0,shown).map(row=>{
    const f=row.original_fields, item=document.createElement('li');
    const button=el('button',f.name??f.label??f.id);button.type='button';
    button.addEventListener('click',()=>void open(row));
    item.append(button,el('p',f.id));return item;
  }));
  $('more').hidden=rows.length<=shown;
}
function resetArchive(){
  current=undefined;shown=pageSize;
  $('catalog').hidden=true;$('records').replaceChildren();$('family').replaceChildren();clearDetail();
  $('query').value='';$('archive-identity').hidden=true;$('archive-sha').textContent='';
}
$('expected').addEventListener('input',()=>{
  pending++;resetArchive();$('archive').value='';
  $('status').textContent='Select the archive to check it against this value.';
});
$('archive').addEventListener('change',async ()=>{
  const file=$('archive').files[0], token=++pending;
  const expected=$('expected').value.trim().toLowerCase();
  resetArchive();
  if(expected&&!/^[0-9a-f]{64}$/.test(expected)){$('status').textContent='Enter exactly 64 hexadecimal characters for the expected SHA-256.';return;}
  if(!file||!file.size||file.size>cap){$('status').textContent='Select a catalog archive no larger than 12 MiB.';return;}
  $('status').textContent='Checking the archive in this browser…';
  try{
    const bytes=await file.arrayBuffer();
    const actual=await sha256(bytes);
    if(token!==pending)return;
    if(expected&&expected!==actual){$('status').textContent='Archive refused: the whole-file SHA-256 does not match.';return;}
    const rows=parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
    current=rows;
    $('family').replaceChildren(...rows.map(f=>new Option(label(f.name),f.name)));
    $('catalog').hidden=false;
    $('archive-sha').textContent=actual;$('archive-identity').hidden=false;
    $('status').textContent=expected?'Expected SHA-256 matches. '+ `${rows.length} archive families opened locally. Nothing was imported.`:
      `${rows.length} archive families opened locally. Nothing was imported.`;
    render();
  }catch{if(token===pending)$('status').textContent='Archive refused. Select an unchanged Athena catalog JSON export.';}
});
for(const id of ['family','query'])$(id).addEventListener(id==='family'?'change':'input',()=>{shown=pageSize;clearDetail();render();});
$('more').addEventListener('click',()=>{shown+=pageSize;render();});
