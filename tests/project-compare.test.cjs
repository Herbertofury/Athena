const {test}=require('node:test'),assert=require('node:assert/strict'),{parseHTML}=require('linkedom');
const fixture=async()=>{const m=await import('../dist/workspaces/projects/model.mjs');const input={name:'Project',ownership:'own',stage:'idea',goal:'Original',next:'',blockers:'',decisions:'',resources:'',source:'',version:'',release:''};return m.change(m.change(m.empty(),'p',input,20),'p',{...input,goal:'<img src=x onerror=alert(1)>',next:'Test'},10);};
test('read-only comparison identifies exact changed fields, reverse and identical selections without sorting timestamps',async()=>{const {compareRevisions}=await import('../dist/workspaces/projects/compare.mjs'),state=await fixture(),before=JSON.stringify(state),p=state.entries[0];p.revisions[0].extension={untouched:true};const snapshot=JSON.stringify(state);const c=compareRevisions(p,0,1);assert.deepEqual(c.changes.map(x=>x.field),['goal','next']);assert.equal(c.beforeAt,20);assert.equal(c.afterAt,10);assert.equal(compareRevisions(p,1,0).changes[0].after,'Original');assert.equal(compareRevisions(p,1,1).changes.length,0);assert.equal(JSON.stringify(state),snapshot);for(const i of [-1,2,NaN,0.5,'0'])assert.throws(()=>compareRevisions(p,i,1));});
test('comparison UI is lazy, literal, read-only and reselectable',async()=>{const {mountComparison}=await import('../dist/workspaces/projects/compare.mjs'),state=await fixture(),snapshot=JSON.stringify(state);const {document,Event}=parseHTML('<div id="host"></div>');const host=document.querySelector('div'),panel=mountComparison(host,state.entries[0]);assert.equal(host.querySelectorAll('select').length,0);panel.open=true;panel.dispatchEvent(new Event('toggle'));assert.equal(host.querySelectorAll('select').length,2);assert.equal(host.querySelector('img'),null);assert.match(host.textContent,/<img src=x/);const picks=host.querySelectorAll('select');for(const option of picks[0].options)option.selected=option.value==='1';picks[0].dispatchEvent(new Event('change'));assert.match(host.textContent,/0 changed field/);panel.dispatchEvent(new Event('toggle'));assert.equal(host.querySelectorAll('select').length,2);assert.equal(JSON.stringify(state),snapshot);});
test('one revision shows explanation without empty selectors',async()=>{const {mountComparison}=await import('../dist/workspaces/projects/compare.mjs'),state=await fixture();state.entries[0].revisions.pop();const {document,Event}=parseHTML('<div></div>');const panel=mountComparison(document.querySelector('div'),state.entries[0]);panel.open=true;panel.dispatchEvent(new Event('toggle'));assert.match(panel.textContent,/second revision/);assert.equal(panel.querySelectorAll('select').length,0);});
test('real Projects integration loads comparison without saving or changing project selection',async()=>{const {document}=parseHTML('<html><body><section></section></body></html>');global.document=document;const {mount}=await import('../dist/workspaces/projects/index.mjs');let writes=0;const container=document.querySelector('section'),state=await fixture(),before=JSON.stringify(state);const app=mount({container,state,setState:()=>{writes++;return true;},signal:new AbortController().signal});const root=container.shadowRoot;root.querySelector('[aria-label="Open Project"]').onclick();await new Promise(r=>setTimeout(r,30));assert.match(root.innerHTML,/Compare saved revisions/);assert.equal(writes,0);assert.equal(JSON.stringify(state),before);app.unmount();});

test('identical missing or malformed known fields do not claim no changes',async()=>{const {compareRevisions}=await import('../dist/workspaces/projects/compare.mjs'),state=await fixture(),p=state.entries[0];delete p.revisions[0].goal;delete p.revisions[1].goal;assert.throws(()=>compareRevisions(p,0,1));});

async function waitFor(find){
 for(let i=0;i<100;i++){
  const found=find();if(found)return found;
  await new Promise(resolve=>setImmediate(resolve));
 }
 assert.fail('Optional panel did not settle');
}
const rootFor=()=>{
 const {document,Event}=parseHTML('<html><body><section></section></body></html>');
 global.document=document;return {container:document.querySelector('section'),Event};
};
test('comparison reads durable history only on first open and never promotes a newer editor draft',async()=>{
 const {change}=await import('../dist/workspaces/projects/model.mjs');
 const {mount}=await import('../dist/workspaces/projects/index.mjs');
 const saved=await fixture(),draft=change(saved,'p',{...saved.entries[0].revisions[1],goal:'Unconfirmed private draft'},9);
 const {container,Event}=rootFor();
 let reads=0,writes=0;
 const app=mount({container,state:draft,readSavedProject:id=>{reads++;assert.equal(id,'p');return saved.entries[0];},setState:()=>{writes++;return true;}});
 try{
  const root=container.shadowRoot;root.querySelector('[aria-label="Open Project"]').onclick();
  const panel=await waitFor(()=>[...root.querySelectorAll('details')].find(d=>d.querySelector('summary')?.textContent==='Compare saved revisions'));
  assert.equal(reads,0);
  panel.open=true;panel.dispatchEvent(new Event('toggle'));
  assert.equal(reads,1);assert.equal(writes,0);
  assert.match(panel.textContent,/2 changed field/);
  assert.doesNotMatch(panel.textContent,/Unconfirmed private draft|Revision 3/);
  assert.deepEqual([...panel.querySelector("[aria-label='After revision']").options].map(o=>o.value),['0','1']);
 }finally{app.unmount();}
});
test('unavailable or malformed durable project never falls back to displayed draft revisions',async()=>{
 const {mount}=await import('../dist/workspaces/projects/index.mjs');
 const state=await fixture();
 for(const durable of [null,{...state.entries[0],revisions:[null]}]){
  const {container,Event}=rootFor();
  const app=mount({container,state,readSavedProject:()=>durable,setState:()=>assert.fail('read-only')});
  try{
   const root=container.shadowRoot;root.querySelector('[aria-label="Open Project"]').onclick();
   const panel=await waitFor(()=>[...root.querySelectorAll('details')].find(d=>d.querySelector('summary')?.textContent==='Compare saved revisions'));
   panel.open=true;panel.dispatchEvent(new Event('toggle'));
   assert.match(panel.textContent,/No draft history was used/);
   assert.equal(panel.querySelector('select'),null);
  }finally{app.unmount();}
 }
});
test('missing optional comparison module leaves raw history and guarded edits usable',async()=>{
 const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{pathToFileURL}=require('node:url');
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'athena-optional-project-compare-'));
 try{
  for(const module of ['index','model','import'])await fs.copyFile(path.join(__dirname,'../dist/workspaces/projects',module+'.mjs'),path.join(directory,module+'.mjs'));
  const {mount}=await import(pathToFileURL(path.join(directory,'index.mjs')));
  const state=await fixture(),{container}=rootFor(),saves=[];
  const app=mount({container,state,setState:(value,options)=>{saves.push([value,options]);return true;}});
  try{
   const root=container.shadowRoot;root.querySelector('[aria-label="Open Project"]').onclick();
   await waitFor(()=>root.querySelector('#detail').textContent.includes('Optional revision comparison unavailable'));
   assert.equal(root.querySelectorAll('#detail pre').length,2);
   [...root.querySelectorAll('#detail button')].find(b=>b.textContent==='Archive project').onclick();
   assert.equal(saves[0][0].entries[0].archived,true);
   assert.equal(saves[0][1].reviewedProjectMutation,JSON.stringify(state));
  }finally{app.unmount();}
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});
