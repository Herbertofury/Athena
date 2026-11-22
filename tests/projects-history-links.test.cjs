const test=require('node:test'),assert=require('node:assert/strict');
const {parseHTML}=require('linkedom');
const row={name:'A saved project',ownership:'own',stage:'research',goal:'Historical source review',next:'',blockers:'',decisions:'',resources:'',source:'',version:'',release:''};
const earlier='https://example.test/old-source',beforeRelease='https://example.test/releases/old',current='https://example.test/current-source';
const links=node=>[...node.querySelectorAll('a')].map(a=>[a.textContent,a.getAttribute('href'),a.target,a.rel]);
async function fixture(){
 const {empty,change}=await import('../dist/workspaces/projects/model.mjs');
 let s=change(empty(),'project',{...row,source:earlier,release:beforeRelease},20);
 return change(s,'project',{...row,source:current},10);
}
test('only exact saved revision source and release URLs become labeled links; raw bytes and state stay unchanged',async()=>{
 const state=await fixture(),original=JSON.stringify(state),{document,Event}=parseHTML('<body><section></section></body>');
 const {mount}=await import('../dist/workspaces/projects/index.mjs'),container=document.querySelector('section');
 const oldDoc=globalThis.document,oldFetch=globalThis.fetch;
 globalThis.document=document;globalThis.fetch=()=>assert.fail('Rendering saved references must not fetch');
 const mounted=mount({container,state,setState:()=>assert.fail('Saved history must not write')});
 try{
  const root=container.shadowRoot;root.querySelector('[data-project] button').click();
  const panel=root.querySelector('#saved-history');assert.equal(panel.querySelectorAll('a').length,0);
  panel.open=true;panel.ontoggle(new Event('toggle'));
  const [newer,older]=panel.querySelectorAll('[data-saved-revision]');
  assert.deepEqual(links(newer),[['Open revision 2 official source (new tab)',current,'_blank','noopener noreferrer']]);
  assert.deepEqual(links(older),[['Open revision 1 official source (new tab)',earlier,'_blank','noopener noreferrer'],['Open revision 1 release reference (new tab)',beforeRelease,'_blank','noopener noreferrer']]);
  assert.equal(older.querySelector('pre').textContent,JSON.stringify(state.entries[0].revisions[0],null,2));
  assert.equal(JSON.stringify(state),original);assert.match(panel.textContent,/availability is not checked/);
 }finally{mounted.unmount();globalThis.document=oldDoc;globalThis.fetch=oldFetch;}
});

test('comparison exposes only valid exact before and after HTTPS locators without fallback for blank or refused values',async()=>{
 const state=await fixture(),{document,Event}=parseHTML('<div id="host"></div>'),host=document.querySelector('div');
 const {mountComparison}=await import('../dist/workspaces/projects/compare.mjs');
 state.entries[0].revisions[1].release='https://ignored:secret@example.test/refused';
 const panel=mountComparison(host,state.entries[0]);
 panel.open=true;panel.dispatchEvent(new Event('toggle'));
 assert.deepEqual(links(panel),[
  ['Open before official source (new tab)',earlier,'_blank','noopener noreferrer'],['Open after official source (new tab)',current,'_blank','noopener noreferrer'],
  ['Open before release reference (new tab)',beforeRelease,'_blank','noopener noreferrer']
 ]);
 assert.match(panel.textContent,/https:\/\/ignored:secret@example.test\/refused/);
 assert.equal(panel.querySelectorAll('a[href*="refused"]').length,0);
 const controls=panel.querySelectorAll('select');
 for(const option of controls[1].options)option.removeAttribute('selected');
 controls[1].options[0].setAttribute('selected','');
 controls[1].dispatchEvent(new Event('change'));assert.equal(panel.querySelectorAll('a').length,0);assert.match(panel.textContent,/0 changed field/);
});
