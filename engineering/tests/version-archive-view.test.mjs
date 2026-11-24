import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as archive from '../apps/atlas-lab/ui/archive-view.mjs';
const id='abcdefgh';
const raw=' {"id":"abcdefgh","project_id":"AANobbMI","future":18446744073709551617,"files":[{"filename":"fixture.jar","url":"https://example.invalid/not-fetched"}],"changelog":"雪 <b>inert</b>"} ';
const bytes=new TextEncoder().encode(raw);
function response(kind='version',extra={}){return new Response(bytes,{headers:{'content-type':'application/json','x-atlas-archive-kind':kind,'x-atlas-canonical-id':id,'x-atlas-generation':'9007199254740993','x-atlas-payload-sha256':createHash('sha256').update(bytes).digest('hex'),...extra}});}
test('version archive reuses bounded verifier without projecting original bytes',async()=>{
 assert.equal(typeof archive.loadSavedArchive,'function');let request;
 const record=await archive.loadSavedArchive('version',id,{fetchImpl:async(url,options)=>{request={url,options};return response();}});
 assert.equal(request.url,'/api/version-archive/'+id);assert.equal(request.options.redirect,'error');assert.equal(record.kind,'version');assert.equal(record.generation,'9007199254740993');assert.equal(record.text,raw);assert.deepEqual(record.bytes,bytes);
});
test('archive kind is fixed and cannot turn into a caller supplied URL',async()=>{
 let called=0;const fetchImpl=async()=>{called++;return response();};
 for(const kind of ['constructor','__proto__','https://example.invalid','../project','',null,{}])await assert.rejects(archive.loadSavedArchive(kind,id,{fetchImpl}));
 assert.equal(called,0);
});
test('same-shaped IDs cannot confuse project and version response namespaces',async()=>{
 for(const kind of ['project','',null])await assert.rejects(archive.loadSavedArchive('version',id,{fetchImpl:async()=>{const r=response();if(kind===null)r.headers.delete('x-atlas-archive-kind');else r.headers.set('x-atlas-archive-kind',kind);return r;}}),/kind mismatch/);
 await assert.rejects(archive.loadSavedArchive('project',id,{fetchImpl:async()=>response('version')}),/kind mismatch/);
});
test('project wrapper stays on its original route and checks its namespace',async()=>{
 let url;const record=await archive.loadSavedProject(id,{fetchImpl:async u=>{url=u;return response('project');}});
 assert.equal(url,'/api/project-archive/'+id);assert.equal(record.kind,'project');assert.equal(record.text,raw);
});
