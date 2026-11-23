import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import vm from 'node:vm';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';import {attachNativeSoundtrack} from '../../../dist/workspaces/foundry/native-soundtrack.mjs';
const require=createRequire(import.meta.url),{parseHTML}=require('linkedom');
const source=process.env.ATHENA_TEST_SOURCE,binary=process.env.ATHENA_FOUNDRY_STORE_BINARY;
test('mounted UI → bootstrap → real bridge Handler → native SQLite: cancel, remove, recreate, conflict, reopen',{skip:!source||!binary},async()=>{
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'foundry-dom-native-')),db=path.join(temp,'synthetic.sqlite');let view;
 try{
 const cli=(cmd,body)=>{const out=execFileSync(binary,[cmd,db],{input:body?JSON.stringify(body):undefined,encoding:'utf8',timeout:15000});return out.trim()?JSON.parse(out):null};
 const theme='frutiger-aero',room=theme+':room:aqua-atrium',other=theme+':room:cloud-terminal';
 const read=r=>JSON.parse(execFileSync(binary,['read-native-versioned',db,theme,r],{encoding:'utf8',timeout:15000}));
 const assign=(r,label)=>cli('compare-assign-soundtrack',{expected:read(r).version,assignment:{theme_id:theme,room_id:r,provider:'spotify',url:'https://open.spotify.com/track/synthetic',label}});
 for(const cmd of ['init','upgrade-history','upgrade-soundtracks'])cli(cmd);assign(room,'First');assign(other,'Untouched');const kept=read(other);let clears=0;
 const context={location:{protocol:'http:',hostname:'127.0.0.1'},fetch:async(url,o)=>{if(url==='/__native/clear-soundtrack')clears++;const r=JSON.parse(execFileSync('python3',['-B',new URL('./handler_transport.py',import.meta.url).pathname,source,binary,db],{input:JSON.stringify({path:url,method:o.method,headers:o.headers,body:o.body||''}),encoding:'utf8',timeout:20000}));return {ok:r.status<400,status:r.status,headers:{get:()=>r.etag},json:async()=>JSON.parse(r.body)};}};
 vm.runInNewContext(fs.readFileSync(new URL('../../../dist/native-store-bootstrap.js',import.meta.url),'utf8'),context);
 const {document,window}=parseHTML('<html><body><section></section></body></html>');Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return [...this.options].find(o=>o.selected)?.value||this.options[0]?.value||'';},set(v){for(const o of this.options)o.removeAttribute('selected');[...this.options].find(o=>o.value===v)?.setAttribute('selected','')}});
 const host=document.querySelector('section'),q=x=>host.querySelector('[data-soundtrack-'+x+']'),tick=()=>new Promise(r=>setImmediate(r));
 view=attachNativeSoundtrack({host,nativeStore:context.AthenaNativeStore});await view.update(theme,room);
 const libraryLoad=host.querySelector('[data-library-load]');libraryLoad.click();await tick();assert.equal(host.querySelector('[data-library-rows]').children.length,2);assert.match(host.querySelector('[data-library-rows]').textContent,/Untouched/);assert.deepEqual(read(other),kept);
 // Explicit library staging must not write or acquire the source room token.
 const beforeStage=read(room),sourceRow=[...host.querySelector('[data-library-rows]').children].find(row=>row.textContent.includes('Untouched'));
 sourceRow.querySelector('button').click();assert.equal(q('label').value,'Untouched');assert.deepEqual(read(room),beforeStage);assert.deepEqual(read(other),kept);assert.match(q('status').textContent,/Nothing saved/);
 // A concurrent target write must cause the captured target ETag to conflict.
 assign(room,'Concurrent before staged save');q('save').click();await tick();assert.match(q('status').textContent,/not confirmed/);assert.equal(q('save').disabled,true);assert.equal(q('label').value,'Untouched');assert.equal(read(room).value.assignment.label,'Concurrent before staged save');assert.deepEqual(read(other),kept);
 q('refresh').click();await tick();assert.equal(q('label').value,'Untouched');q('save').click();await tick();assert.equal(read(room).value.assignment.label,'Untouched');assert.deepEqual(read(other),kept);
 // Start the inherited clear checks with an explicitly saved local label.
 q('label').value='First';q('save').click();await tick();assert.equal(read(room).value.assignment.label,'First');
 q('clear').click();q('cancel').click();assert.equal(clears,0);assert.equal(read(room).value.assignment.label,'First');
 q('label').value='Draft';q('clear').click();q('confirm').click();await tick();assert.match(q('status').textContent,/Local bookmark removed/);assert.equal(read(room).value,null);assert.deepEqual(read(other),kept);assert.equal(q('label').value,'Draft');
 q('save').click();await tick();assert.equal(read(room).value.assignment.label,'Draft');
 assign(room,'New concurrent value');q('clear').click();q('confirm').click();await tick();assert.match(q('status').textContent,/not confirmed/);assert.equal(read(room).value.assignment.label,'New concurrent value');assert.equal(q('save').disabled,true);
 q('refresh').click();await tick();q('clear').click();q('confirm').click();await tick();assert.equal(read(room).value,null);assert.deepEqual(read(other),kept);
 view.dispose();view=attachNativeSoundtrack({host,nativeStore:context.AthenaNativeStore});await view.update(theme,room);assert.match(q('status').textContent,/No native soundtrack/);assert.equal(q('clear').disabled,true);
 }finally{view?.dispose();fs.rmSync(temp,{recursive:true,force:true});}
});
