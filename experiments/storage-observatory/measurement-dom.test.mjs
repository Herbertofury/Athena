import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {mkdtempSync,mkdirSync,openSync,closeSync,linkSync,rmSync,symlinkSync,truncateSync,writeFileSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {parseHTML} from 'linkedom';
import {parseStorageReport} from './model.mjs';

const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('actual Linux measurement loads in the Observatory with separate path and allocation totals',{skip:process.platform!=='linux'},async()=>{
  const parent=mkdtempSync(join(tmpdir(),'athena-storage-fixture-'));
  try{
    const root=join(parent,'selected'),a=join(root,'Sources'),b=join(root,'Media');
    mkdirSync(root);mkdirSync(a);mkdirSync(b);
    const normal=join(a,'normal'),sparse=join(b,'sparse'),outside=join(parent,'outside');
    writeFileSync(normal,Buffer.alloc(4097,3));linkSync(normal,join(b,'hardlink'));
    closeSync(openSync(sparse,'w'));truncateSync(sparse,4*1024*1024);writeFileSync(outside,'outside');symlinkSync(outside,join(a,'excluded'));
    const report=execFileSync('python3',[fileURLToPath(new URL('./measure.py',import.meta.url)),root,'--category','Source files=Sources','--category','Media files=Media'],{encoding:'utf8',timeout:7000});
    const observation=parseStorageReport(report);
    assert.equal(observation.source,'imported-measurement');assert.equal(observation.totals.logicalBytes,4*1024*1024+4097*2);
    assert.equal(observation.totals.files,3);assert.equal(observation.totals.physicalFiles,2);assert.equal(observation.skipped.links,1);
    assert.ok(observation.totals.allocatedBytes<observation.totals.logicalBytes);assert.ok(!report.includes(parent));
    const {document,window}=parseHTML(await readFile(new URL('./index.html',import.meta.url),'utf8'));
    globalThis.document=document;await import('./app.mjs');
    const file=document.getElementById('file');
    async function load(value){file.files=[{size:Buffer.byteLength(value),text:async()=>value}];file.dispatchEvent(new window.Event('change'));await tick();}
    await load(report);
    assert.match(document.getElementById('source').textContent,/NOT VERIFIED BY THIS PAGE/);
    assert.match(document.getElementById('capacity').textContent,/2 unique files.*3 pathnames/);
    assert.match(document.getElementById('free').textContent,/no free-space estimate.*1 links/);
    const buttons=[...document.querySelectorAll('.category')];const shared=buttons.find(x=>x.textContent.includes('Shared across categories'));
    assert.ok(shared);shared.onclick();assert.match(document.getElementById('selection').textContent,/0 pathnames, 0 B logical/);
    const invalid={...JSON.parse(report),totals:{...observation.totals,allocatedBytes:observation.totals.allocatedBytes+1}};
    await load(JSON.stringify(invalid));assert.match(document.getElementById('error').textContent,/Previous snapshot preserved/);
    const partial=JSON.parse(report);partial.partial=true;partial.stops.unreadable=1;partial.categories[0].name='<img src=x onerror=alert(1)>';
    await load(JSON.stringify(partial));assert.match(document.getElementById('source').textContent,/PARTIAL/);
    assert.match(document.getElementById('mode-description').textContent,/unreadable 1/);assert.equal(document.querySelectorAll('#categories img').length,0);
    document.getElementById('reset').onclick();assert.match(document.getElementById('source').textContent,/DEMO/);
    assert.equal(document.querySelectorAll('.category').length,5);delete globalThis.document;
  }finally{rmSync(parent,{recursive:true,force:true});}
});
