import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const cli=fileURLToPath(new URL('../scripts/compare_local_galleries.mjs',import.meta.url));
const id='Abcd1234';
const a={url:'https://cdn.modrinth.com/data/one.png',raw_url:'https://cdn.modrinth.com/data/one-full.png'};
const b={url:'https://cdn.modrinth.com/data/two.png',raw_url:'https://cdn.modrinth.com/data/two-full.png'};
const text=(gallery,other={})=>JSON.stringify({id,gallery,unrelated:'private fixture marker',...other});
function run(t,before,after,params=[]){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'athena-two-gallery-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const p=['before.json','after.json'].map(name=>path.join(dir,name));
 for(const [i,raw] of [before,after].entries())fs.writeFileSync(p[i],raw);
 const r=spawnSync(process.execPath,[cli,'--project',id,'--before',p[0],'--after',p[1],...params],{encoding:'utf8',timeout:5000});
 assert.ifError(r.error);
 assert.deepEqual(p.map(f=>fs.readFileSync(f)),[Buffer.from(before),Buffer.from(after)]);
 assert.deepEqual(fs.readdirSync(dir).sort(),['after.json','before.json']);
 return r;
}
function noLeak(r){
 assert.doesNotMatch(r.stdout+r.stderr,/private fixture marker|cdn\.modrinth\.com|before\.json|after\.json/);
}
test('compares exact preserved inputs and reports distinct digests without payloads',t=>{
 const before=text([a,b]),after=text([a,b],{unrelated:'changed unexamined field'});
 const r=run(t,before,after); noLeak(r);assert.equal(r.status,0,r.stderr);
 const value=JSON.parse(r.stdout);
 assert.equal(value.result.status,'matching');
 for(const [key,raw] of Object.entries({before,after})){
   assert.equal(value[key].bytes,Buffer.byteLength(raw));
   assert.equal(value[key].sha256,createHash('sha256').update(raw).digest('hex'));
 }
 assert.notEqual(value.before.sha256,value.after.sha256);
});
test('equal cardinality but reordered pairs are not matching',t=>{
 const r=run(t,text([a,b]),text([b,a]));noLeak(r);assert.equal(r.status,0,r.stderr);
 const {result}=JSON.parse(r.stdout);assert.equal(result.status,'changed');assert.equal(result.actual_count,2);assert.equal(result.snapshot_count,2);
});
test('malformed gallery URL or absent gallery stays unknown, not empty or matching',t=>{
 for(const after of [text([{...a,url:[a.url]}]),JSON.stringify({id})]){
   const r=run(t,text([a]),after);noLeak(r);assert.equal(r.status,3);assert.equal(JSON.parse(r.stdout).result.status,'unknown');
 }
});
test('duplicate decoded property names are refused rather than silently choosing a gallery',t=>{
 for(const raw of [`{"id":"${id}","gallery":[],"galle\\u0072y":${JSON.stringify([a])}}`, `{"id":"${id}","gallery":${JSON.stringify([a])},"x":[{"n":1,"n":2}]}`]){
   const r=run(t,text([a]),raw);assert.equal(r.status,2);assert.equal(r.stdout,'');assert.match(r.stderr,/Duplicate JSON property/);noLeak(r);
 }
});
test('identity, malformed UTF-8, budget, depth and duplicate options refuse without output',t=>{
 for(const [after,args] of [[text([a],{id:'wrong123'}),[]],[Buffer.from([0xff]),[]],[Buffer.alloc(2*1024*1024+1,32),[]],
  [`{"id":"${id}","nested":`+'['.repeat(128)+'0'+']'.repeat(128)+'}',[]],[text([a]),['--project',id]]]){
  const r=run(t,text([a]),after,args);assert.equal(r.status,2);assert.equal(r.stdout,'');noLeak(r);
 }
});
test('symbolic input link is rejected without changing its target',{skip:process.platform==='win32'},t=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'athena-two-gallery-link-'));
 t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
 const original=path.join(dir,'original.json'),link=path.join(dir,'linked.json');
 fs.writeFileSync(original,text([a]));fs.symlinkSync(original,link);
 const r=spawnSync(process.execPath,[cli,'--project',id,'--before',original,'--after',link],{encoding:'utf8',timeout:5000});
 assert.ifError(r.error);assert.equal(r.status,2);assert.equal(r.stdout,'');noLeak(r);
 assert.equal(fs.readFileSync(original,'utf8'),text([a]));assert.equal(fs.lstatSync(link).isSymbolicLink(),true);
});
