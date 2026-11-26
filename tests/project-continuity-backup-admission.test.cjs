'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const unicode=new TextEncoder();
const runtime=process.env.ATHENA_BACKUP_TEST_RUNTIME||path.resolve(__dirname,'../dist');
const fromRuntime=workspace=>import(pathToFileURL(path.join(runtime,'workspaces',workspace,'import.mjs')).href);
const inputs=Promise.all([
 fromRuntime('projects'),
 fromRuntime('continuity'),
]);

test('shared portable admission keeps precision and independent schemas',async()=>{
 const [projects,notes]=await inputs;
 const fixture=schema=>unicode.encode('{"schema":'+schema+',"entries":[],"opaque":{"𝄞":"keep","same":[1,1.0,1e0,0e10,1e-7,9007199254740991], "__proto__":{"kept":true}}}');
 const p=projects.parseBackup(fixture(1)), n=notes.parseBackup(fixture(1));
 assert.equal(p.schema,1);assert.equal(n.schema,2);
 assert.deepEqual(p.opaque.same,[1,1,1,0,1e-7,9007199254740991]);
 assert.deepEqual(n.opaque,p.opaque);
 assert.equal(Object.getOwnPropertyDescriptor(p.opaque,'__proto__').value.kept,true);
 assert.throws(()=>projects.parseBackup(fixture(2)),/Unsupported projects/);
 assert.equal(notes.parseBackup(fixture(2)).schema,2);
});

test('neither importer accepts duplicate, lossy, oversized or malformed backup input',async()=>{
 const envelope=x=>unicode.encode('{"schema":1,"entries":[],"opaque":'+x+'}');
 for(const parser of await inputs){
  for(const data of ['{"title":1,"\\u0074itle":2}','[{"x":1,"x":2}]']){
   assert.throws(()=>parser.parseBackup(envelope(data)),/Duplicate backup property/);
  }
  for(const data of ['-0','-0.0','1e400','1e-999','9007199254740992','0.30000000000000004'+'1']){
   assert.throws(()=>parser.parseBackup(envelope(data)),/Lossy backup number/);
  }
  assert.throws(()=>parser.parseBackup(envelope('['.repeat(130)+'0'+']'.repeat(130))),/nesting exceeds/);
  assert.throws(()=>parser.parseBackup(new Uint8Array(16*1024*1024+1)),/budget/);
  assert.throws(()=>parser.parseBackup(new Uint8Array([255])),TypeError);
  assert.throws(()=>parser.parseBackup(envelope('[0,]')),SyntaxError);
 }
});

test('both local parsers retain a large dense metadata backup in order',async()=>{
 const len=180000;
 const bytes=unicode.encode('{"schema":1,"entries":[],"opaque":['+'0,1,2,'.repeat(len/3-1)+'0,1,2]}');
 for(const parser of await inputs){
  const result=parser.parseBackup(bytes);
  assert.equal(result.opaque.length,len);
  assert.ok(result.opaque.every((x,i)=>x===i%3));
 }
});
