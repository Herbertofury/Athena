const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {parseHTML}=require('linkedom');
const original=JSON.parse(fs.readFileSync('dist/workspaces/guidance/catalog.json','utf8'));
async function fixture(catalog,state={}){
 const {document}=parseHTML('<html><body><section></section></body></html>'),container=document.querySelector('section');
 const old={document:globalThis.document,fetch:globalThis.fetch};
 let reads=0,writes=0;
 globalThis.document=document;globalThis.fetch=async()=>{reads++;return {ok:true,json:async()=>catalog};};
 const {mount}=await import('../dist/workspaces/guidance/index.mjs');
 const api=await mount({container,state,setState(){writes++;return true;}});
 const root=container.shadowRoot,query=s=>root.querySelector(s);
 return {root,query,api,reads:()=>reads,writes:()=>writes,finish(){api.unmount();globalThis.document=old.document;globalThis.fetch=old.fetch;}};
}
test('native long standard offers exact local section jumps and returns to the opener without fetching or saving',async()=>{
 const selected=original.documents.find(d=>d.title==='Athena Product Invariants');
 const x=await fixture(original,{current:selected.id,selected:[selected.id]});const q=x.query;
 try{
  const outline=q('[aria-label="Sections in selected standard"]'),last=[...outline.querySelectorAll('button')].at(-1);
  assert.equal(outline.querySelectorAll('button').length,19);assert.match(last.textContent,/Project to-do awareness without task drift/);
  const heading=[...q('.document').querySelectorAll('h4')].at(-1);
  let focused;heading.focus=()=>{focused=heading;};last.focus=()=>{focused=last;};
  last.click();assert.equal(focused,heading);assert.equal(heading.tabIndex,-1);
  heading.parentElement.querySelector('button').click();assert.equal(focused,last);
  assert.equal(x.reads(),1);assert.equal(x.writes(),0);assert.equal([...x.root.querySelectorAll('input')].find(input=>input.checked)?.getAttribute('aria-label'),'Include Athena Product Invariants');
  assert.equal(q('.reader a').getAttribute('href'),selected.sourceUrl);
 }finally{x.finish();}
});

test('fenced headings stay literal, duplicate real sections stay distinct, stale controls do nothing',async()=>{
 const catalog=structuredClone(original),d=catalog.documents[0];
 d.text=['# '+d.title,'## Repeat','first','```md','## Not a heading','```','~~~md','## Also literal','~~~','## Repeat','second'].join('\n');
 const x=await fixture(catalog),q=x.query;
 try{
  const first=q('[aria-label="Sections in selected standard"] button');
  const links=[...q('[aria-label="Sections in selected standard"]').querySelectorAll('button')],headings=[...q('.document').querySelectorAll('h4')];
  assert.equal(links.length,2);assert.deepEqual(headings.map(h=>h.textContent),['Repeat','Repeat']);
  assert.notEqual(links[0].textContent,links[1].textContent);
  assert.match(q('.document').textContent,/## Not a heading/);assert.match(q('.document').textContent,/## Also literal/);
  let focus=[];headings.forEach((h,i)=>{h.focus=()=>focus.push(i);});
  links[1].click();assert.deepEqual(focus,[1]);
  [...x.root.querySelectorAll('.standard button')][1].click();
  assert.equal(x.writes(),1,'only the existing standard selection persists');
  first.click();assert.deepEqual(focus,[1]);assert.equal(x.reads(),1);
 }finally{x.finish();}
});
