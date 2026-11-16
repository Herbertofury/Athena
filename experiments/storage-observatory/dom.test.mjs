import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {parseHTML} from 'linkedom';
test('accessible selection, safe text, failed import and reset race',async()=>{
 const {document,window}=parseHTML(await readFile(new URL('./index.html',import.meta.url),'utf8')); globalThis.document=document; await import('./app.mjs');
 assert.equal(document.querySelectorAll('.category').length,5);
 const first=document.querySelector('.category');first.onclick();assert.equal(first.getAttribute('aria-pressed'),'true');assert.match(document.getElementById('selection').textContent,/Project sources/);
 const file=document.getElementById('file'); const tick=()=>new Promise(resolve=>setImmediate(resolve));
 file.files=[{size:20,text:async()=>'{broken'}];file.dispatchEvent(new window.Event('change'));await tick();assert.match(document.getElementById('error').textContent,/rejected/);assert.equal(document.querySelectorAll('.category').length,5);
 file.files=[{size:100,text:async()=>JSON.stringify({capacityBytes:10,categories:[{name:'<img src=x onerror=alert(1)>',bytes:3}]})}];file.dispatchEvent(new window.Event('change'));await tick();assert.equal(document.querySelectorAll('#categories img').length,0);assert.match(document.getElementById('source').textContent,/IMPORTED/);
 let finish;file.files=[{size:100,text:()=>new Promise(resolve=>finish=resolve)}];file.dispatchEvent(new window.Event('change'));document.getElementById('reset').onclick();finish('{"capacityBytes":10,"categories":[]}');await tick();assert.match(document.getElementById('source').textContent,/DEMO/);assert.equal(document.querySelectorAll('.category').length,5);
 delete globalThis.document;
});
