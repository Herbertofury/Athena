const {test}=require('node:test'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const use=()=>import('../dist/shared/artifact-bundle.mjs');
const id='00000000-0000-4000-8000-000000000001';
const bytes=Uint8Array.of(0,255,10,13,0);
function make(){
 const hash=createHash('sha256').update(bytes).digest('hex');
 return {artifacts:[{id,latest:2}],revisions:[{artifactId:id,sequence:2,filename:'👾.html',mime:'text/html',size:5,hash,at:1234},{artifactId:id,sequence:1,filename:'fixture.bin',mime:'',size:5,hash,at:100}],blobs:new Map([[hash,bytes]])};
}
test('opaque binary journal round-trip is canonical, retains exact metadata and deduplicates payload',async()=>{
 const {encodeBundle,decodeBundle}=await use();
 const fixture=make(),file=await encodeBundle(fixture);
 const raw=Buffer.from(await file.arrayBuffer());
 assert.equal(raw.subarray(0,8).toString(),'ATHART01');
 const metadataSize=raw.readUInt32BE(8);
 assert.equal(raw.length,44+metadataSize+bytes.length);
 assert.deepEqual(raw.subarray(44+metadataSize),Buffer.from(bytes));
 const read=await decodeBundle(file);assert.equal(read.revisions.length,2);
 assert.equal(read.revisions[1].filename,'👾.html');
 assert.deepEqual(read.artifacts,fixture.artifacts);
 assert.deepEqual(read.revisions,fixture.revisions.toReversed());assert.deepEqual(read.blobs,fixture.blobs);
 assert.deepEqual(await (await encodeBundle(read)).arrayBuffer(),await file.arrayBuffer());
});
test('damaged metadata and bytes, truncated bundle and extra bytes are all rejected',async()=>{
 const {encodeBundle,decodeBundle}=await use();const raw=new Uint8Array(await (await encodeBundle(make())).arrayBuffer());
 for(const i of [0,8,12,44,raw.length-1]){
  const corrupt=raw.slice();corrupt[i]^=255;await assert.rejects(decodeBundle(new Blob([corrupt])));
 }
 await assert.rejects(decodeBundle(new Blob([raw.subarray(0,-1)])));
 await assert.rejects(decodeBundle(new Blob([raw,bytes])));
 // Recomputing an unsigned transport hash still cannot admit duplicate fields or unexpected schemas.
 const bad=Buffer.from('{"artifacts":[],"revisions":[],"revisions":[]}');
 const prefix=Buffer.from(raw.subarray(0,44));prefix.writeUInt32BE(bad.length,8);createHash('sha256').update(bad).digest().copy(prefix,12);
 await assert.rejects(decodeBundle(new Blob([prefix,bad])));
});
test('broken sequence, unknown metadata, mislabeled duplicate hash size and aborted export refuse',async()=>{
 const {encodeBundle,decodeBundle}=await use();const fixture=make(),one=fixture.revisions[0];
 for(const invalid of [{...one,sequence:1},{...one,filename:''},{...one,size:4},{...one,extra:'do not silently drop'}]){
  await assert.rejects(encodeBundle({...fixture,revisions:[invalid,fixture.revisions[1]]}));
 }
 const ctl=new AbortController();ctl.abort();
 await assert.rejects(encodeBundle(fixture,ctl.signal),{name:'AbortError'});
 await assert.rejects(decodeBundle(await encodeBundle(fixture),ctl.signal),{name:'AbortError'});
 assert.equal((await decodeBundle(await encodeBundle({artifacts:[],revisions:[],blobs:new Map()}))).revisions.length,0);
});
