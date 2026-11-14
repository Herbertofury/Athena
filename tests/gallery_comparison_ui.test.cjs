const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{parseHTML}=require('linkedom');
const card=JSON.parse(fs.readFileSync('dist/workspaces/engineering/media/public-fixtures.json')).cards.find(c=>c.id==='modrinth:AANobbMI');
const source=fs.readFileSync('engineering/tests/fixtures/modrinth-sodium-public-excerpt-20261105.json');
const file=bytes=>({size:bytes.length,arrayBuffer:async()=>Uint8Array.from(bytes).buffer});
const tick=()=>new Promise(setImmediate);
test('native comparison retains completed result on failure and cancels late unmounted reads',async()=>{
 const {document,window}=parseHTML('<main></main>');const controller=await import('../dist/workspaces/engineering/media/gallery-comparison.mjs');const abort=new AbortController();
 const ui=controller.mountGalleryComparison({container:document.querySelector('main'),cards:[card],signal:abort.signal});
 const form=document.querySelector('form'),input=document.querySelector('input'),select=document.querySelector('select'),status=document.querySelector('[data-gallery-status]');Object.defineProperty(select,'value',{value:card.id,configurable:true});
 Object.defineProperty(input,'files',{value:[file(source)],configurable:true});form.dispatchEvent(new window.Event('submit',{cancelable:true}));await tick();await new Promise(r=>setTimeout(r,15));assert.match(status.textContent,/matching/);
 const completed=status.textContent;Object.defineProperty(input,'files',{value:[file(Buffer.from('{'))],configurable:true});form.dispatchEvent(new window.Event('submit',{cancelable:true}));await tick();assert.match(status.textContent,/Last completed result is retained/);
 [...document.querySelectorAll('button')].find(b=>b.textContent==='Show last completed comparison').click();assert.equal(status.textContent,completed);
 let release;Object.defineProperty(input,'files',{value:[{size:source.length,arrayBuffer:()=>new Promise(r=>release=r)}],configurable:true});form.dispatchEvent(new window.Event('submit',{cancelable:true}));abort.abort();release(Uint8Array.from(source).buffer);await tick();assert.equal(document.querySelector('[data-gallery-comparison]'),null);ui.dispose();
});
