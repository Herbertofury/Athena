const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
const catalog=JSON.parse(fs.readFileSync('dist/workspaces/guidance/catalog.json','utf8'));
test('native guidance contains every canonical standard with exact source digests',()=>{cp.execFileSync('python3',['scripts/build_guidance.py','--check']);const manifest=JSON.parse(fs.readFileSync('guidance/registry/repository-governance.json','utf8'));assert.equal(catalog.documents.length,Object.keys(manifest.files).length);for(const d of catalog.documents){assert.equal(crypto.createHash('sha256').update(d.text).digest('hex'),manifest.files[d.id]);assert.equal(d.sha256,manifest.files[d.id]);assert.equal(d.text,fs.readFileSync(d.sourcePath,'utf8'));}});
test('complete guidance search, selection and exports preserve evidence without installing instructions',async()=>{const m=await import('../dist/workspaces/guidance/model.mjs');m.validateCatalog(catalog);assert.equal(m.findDocuments(catalog,'').length,16);assert(m.findDocuments(catalog,'Sensitive actions').some(d=>d.id==='AUTHORIZATION_CONTROL_STANDARD.md'));assert.equal(m.findDocuments(catalog,'nonexistent synthetic phrase').length,0);assert.throws(()=>m.exportPacket(catalog,[]));const ids=catalog.documents.map(d=>d.id),packet=m.exportPacket(catalog,ids.concat(ids));assert.equal(packet.documents.length,16);assert(packet.scope.includes('Does not install'));const markdown=m.exportMarkdown(packet);for(const d of packet.documents){assert(markdown.includes(d.text));assert(markdown.includes(d.sha256));assert(markdown.includes(d.sourceUrl));}assert.throws(()=>m.validateCatalog({...catalog,documents:[catalog.documents[0],catalog.documents[0]]}));assert.throws(()=>m.validateCatalog({...catalog,documents:[{...catalog.documents[0],sourcePath:'guidance/../private.md'}]}));});
test('native reader mounts complete data, handles shared search and cleans up its DOM',async()=>{const {parseHTML}=require('linkedom');const {document,window}=parseHTML('<html><body><div id="root"></div></body></html>');const previous={document:global.document,fetch:global.fetch};global.document=document;global.fetch=async()=>({ok:true,json:async()=>catalog});try{const {mount}=await import('../dist/workspaces/guidance/index.mjs');let state;const container=document.getElementById('root');const api=await mount({container,state:{},setState:v=>{state=v;return true;}});assert.equal(api.ready,true);const root=container.shadowRoot;assert.equal(root.querySelectorAll('input[type=checkbox]').length,16);assert.equal([...root.querySelectorAll('h3,h4')].filter(x=>x.textContent===catalog.documents[0].title).length,1);root.querySelector('button').click();assert.equal(state.selected.length,16);api.setSearch('synthetic unmatched');assert.equal(root.querySelectorAll('input[type=checkbox]').length,0);api.setSearch('');assert.equal(root.querySelectorAll('input[type=checkbox]').length,16);api.unmount();assert.equal(root.children.length,0);const restored=await mount({container,state,setState:()=>true});assert.equal([...root.querySelectorAll('input[type=checkbox]')].filter(x=>x.checked).length,16);restored.unmount();}finally{global.document=previous.document;global.fetch=previous.fetch;}});
test('native reference review compares exact local bytes, identity and scope without exposing untrusted data',async()=>{
 const m=await import('../dist/workspaces/guidance/model.mjs'), enc=x=>new TextEncoder().encode(JSON.stringify(x));
 const packet=m.exportPacket(catalog,catalog.documents.slice(0,3).map(d=>d.id));
 const digest=crypto.webcrypto.subtle;
 const exact=await m.reviewReference(catalog,enc(packet),digest);
 assert.deepEqual([exact.exactSelection,exact.exact,exact.notIncluded],[true,3,13]);
 const edited=structuredClone(packet);
 edited.documents[0].text='PRIVATE_MARKER_36';
 edited.documents[1].sourceUrl='https://example.invalid/private';
 edited.documents[2].text='same forged input with self-asserted digest';
 edited.documents[2].sha256=crypto.createHash('sha256').update(edited.documents[2].text).digest('hex');
 edited.documents.push({...packet.documents[0],id:'PRIVATE_UNKNOWN_ID'});
 const report=await m.reviewReference(catalog,enc(edited),digest);
 assert.equal(report.exactSelection,false);
 assert.deepEqual(report.rows.map(r=>r.state),['invalid-digest','source-changed','content-changed']);
 assert.equal(report.unknown,1);
 assert.doesNotMatch(JSON.stringify(report),/PRIVATE|example\.invalid|forged input/);
 const wrongVersion=await m.reviewReference(catalog,enc({...packet,version:'older'}),digest);
 assert.equal(wrongVersion.exact,3);assert.equal(wrongVersion.exactSelection,false);
 await assert.rejects(m.reviewReference(catalog,enc({...packet,documents:[packet.documents[0],packet.documents[0]]}),digest),/duplicate/);
 await assert.rejects(m.reviewReference(catalog,new Uint8Array([0xff]),digest),/Invalid UTF-8/);
 await assert.rejects(m.reviewReference(catalog,new Uint8Array(m.MAX_REFERENCE_BYTES+1),digest),/512 KiB/);
});
test('mounted native pack checker stays local and displays only reviewed findings',async()=>{
 const {parseHTML}=require('linkedom');
 const {document,window}=parseHTML('<html><body><div id="root"></div></body></html>');
 const previous={document:global.document,fetch:global.fetch};global.document=document;
 let requests=0;global.fetch=async()=>{requests++;return{ok:true,json:async()=>catalog};};
 try{
  const {mount}=await import('../dist/workspaces/guidance/index.mjs');
  const model=await import('../dist/workspaces/guidance/model.mjs');
  const container=document.getElementById('root'),api=await mount({container,state:{},setState:()=>true});
  const root=container.shadowRoot,input=root.querySelector('input[type=file]');
  const original=model.exportPacket(catalog,[catalog.documents[0].id]);
  async function select(value,expected){
   const file=new Blob([JSON.stringify(value)],{type:'application/json'});
   input.files=[file];input.dispatchEvent(new window.Event('change'));
   for(let i=0;i<50&&!root.querySelector('.boundary ul').textContent.includes(expected);i++)await new Promise(r=>setTimeout(r,10));
   assert(root.querySelector('.boundary ul').textContent.includes(expected));
  }
  await select(original,'Exact match');
  await select({...original,documents:[{...original.documents[0],text:'PRIVATE_EDIT_MARKER'}]},'Checksum does not match');
  assert.doesNotMatch(root.querySelector('.boundary').textContent,/PRIVATE_EDIT_MARKER/);
  assert.equal(requests,1);api.unmount();assert.equal(root.children.length,0);
 }finally{global.document=previous.document;global.fetch=previous.fetch;}
});
