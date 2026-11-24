const assert=require('node:assert/strict');
const {test}=require('node:test');
const {createHash}=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {resolve}=require('node:path');
const {parseHTML}=require('linkedom');

const pack=resolve(process.env.ATHENA_LAB_PROVENANCE_PACKAGE||resolve(__dirname,'../dist'));
const base=pathToFileURL(resolve(pack,'workspaces/engineering/lab/index.mjs'));
const id='AANobbMI', generations=['9007199254740993','9007199254740994','9007199254740995'];
const payload=' {"id":"AANobbMI","slug":"fixture","title":"Retained twice","project_type":"mod","versions":[],"exact":18446744073709551617} ';
const bytes=Buffer.from(payload),sha256=createHash('sha256').update(bytes).digest('hex');
const archiveURL=generation=>'/api/project-archive/'+id+'/'+generation;
const jobs=generations.map((generation,i)=>({id:i+8,id_text:String(i+8),state:'succeeded',attempt:1,job:{CollectModrinthRaw:{project:'fixture'}},result:{project_archive:{schema_version:1,status:'complete_received_response',canonical_id:id,generation,payload_bytes:bytes.length,payload_sha256:sha256}}}));

test('Lab separately downloads one exact raw file and one exact reviewed metadata sidecar; unverified selection cannot export it',async()=>{
 const {mount}=await import(base),{document,window}=parseHTML('<html><body><section id="lab"></section></body></html>');
 const setup={document,location:new URL('http://127.0.0.1:41379/#lab'),fetch};
 const saved=new Map(Object.keys(setup).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)]));
 const select=Object.getPrototypeOf(document.createElement('select')),sv=Object.getOwnPropertyDescriptor(select,'value');
 const click=Object.getOwnPropertyDescriptor(window.HTMLAnchorElement.prototype,'click');
 Object.defineProperty(select,'value',{configurable:true,get(){return this._value||''},set(v){this._value=v}});
 const downloads=[],pending=new Map(),requests=[],original={create:URL.createObjectURL,revoke:URL.revokeObjectURL};
 URL.createObjectURL=blob=>{const key='blob:synthetic-atlas-'+pending.size;pending.set(key,blob);return key};
 URL.revokeObjectURL=key=>{pending.delete(key)};
 Object.defineProperty(window.HTMLAnchorElement.prototype,'click',{configurable:true,value(){downloads.push({name:this.download,blob:pending.get(this.href)});}});
 setup.fetch=async(url,o={})=>{
  requests.push({url,method:o.method||'GET'});assert.equal(o.method||'GET','GET');
  if(url==='/api/runtime')return Response.json({application:'Athena',api_version:1,loopback_only:true,same_origin_only:true,runtime_manifest_sha256:'a'.repeat(64)});
  if(url==='/api/overview')return Response.json({jobs,counts:{succeeded:3},worker_status:'running'},{headers:{'x-atlas-engine-instance':'a'.repeat(32)}});
  const generation=String(url).split('/').at(-1);
  assert.ok(generations.includes(generation)&&url===archiveURL(generation));
  const body=generation===generations[2]?Buffer.alloc(bytes.length,32):bytes;
  return new Response(body,{headers:{'content-type':'application/json','content-length':String(body.length),'x-atlas-canonical-id':id,'x-atlas-archive-kind':'project','x-atlas-generation':generation,'x-atlas-payload-sha256':sha256}});
 };
 for(const [k,v] of Object.entries(setup))Object.defineProperty(globalThis,k,{configurable:true,writable:true,value:v});
 const host=document.getElementById('lab');let mounted;
 try{
  mounted=await mount({container:host});
  const root=host.shadowRoot,q=id=>root.getElementById(id),dialog=q('saved-archive-dialog');
  dialog.showModal=function(){this.open=true};dialog.close=function(){this.open=false;};
  const actions=[...root.querySelectorAll('[data-project-archive-review]')];
  const inspect=async generation=>{
   const action=actions.find(x=>x.textContent.includes(generation));assert.ok(action);
   action.click();
   for(let i=0;action.disabled&&i<250;i++)await new Promise(r=>setImmediate(r));
   assert.equal(action.disabled,false);
  };
  const side=q('download-saved-archive-provenance');assert.ok(side,'the moved raw archive needs a separate deliberate provenance export');
  side.click();assert.equal(downloads.length,0,'no export before verified archive');
  assert.match(q('saved-archive-provenance-note').textContent,/does not authenticate/);
  for(const [i,generation] of generations.slice(0,2).entries()){
   await inspect(generation);
   assert.equal(dialog.open,true);assert.match(q('saved-archive-title').textContent,new RegExp(generation+'$'));
   assert.equal(downloads.length,i*2,'review alone never downloads');
   q('download-saved-archive').click();assert.equal(downloads.length,i*2+1);
   const raw=downloads.at(-1),name='modrinth-project-'+id+'-generation-'+generation+'.json';
   assert.equal(raw.name,name);assert.deepEqual(Buffer.from(await raw.blob.arrayBuffer()),bytes);
   side.click();assert.equal(downloads.length,i*2+2);
   const receipt=downloads.at(-1);assert.equal(receipt.name,name.slice(0,-5)+'.provenance.json');
   assert.deepEqual(JSON.parse(await receipt.blob.text()),{schema:1,kind:'athena_lab_saved_archive_provenance',
    archive:{kind:'project',canonical_id:id,generation},
    payload:{filename:name,media_type:'application/json',byte_length:bytes.length,sha256},
    verification:'sha256_matched_retained_local_response',authenticity:'not_asserted'});
   dialog.close();
  }
  await inspect(generations[2]);assert.equal(dialog.open,false);
  side.click();assert.equal(downloads.length,4,'corrupt response and closed dialog cannot export a receipt');
  assert.match(actions.find(x=>x.textContent.includes(generations[2])).parentElement.textContent,/Saved-response hash mismatch/);
  q('show-last-archive').click();assert.equal(dialog.open,true);
  side.click();assert.equal(JSON.parse(await downloads.at(-1).blob.text()).archive.generation,generations[1],'only the deliberately reopened last good remains exportable');
  assert.equal(downloads.length,5);
  assert.deepEqual(requests.map(r=>r.url),['/api/runtime','/api/overview',...generations.map(archiveURL)]);
 }finally{
  mounted?.unmount();
  URL.createObjectURL=original.create;URL.revokeObjectURL=original.revoke;
  if(click)Object.defineProperty(window.HTMLAnchorElement.prototype,'click',click);else delete window.HTMLAnchorElement.prototype.click;
  if(sv)Object.defineProperty(select,'value',sv);else delete select.value;
  for(const [k,d] of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}
 }
});
