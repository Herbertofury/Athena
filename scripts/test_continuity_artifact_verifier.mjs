import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdtempSync,readFileSync,readdirSync,rmSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const packageDir=path.resolve(process.argv[2]);
const manifest=JSON.parse(readFileSync(path.join(packageDir,'native-package.json'),'utf8'));
const engine=path.join(packageDir,manifest.engine);
const {encodeBundle,hashBytes}=await import(pathToFileURL(path.join(packageDir,'runtime','shared','artifact-bundle.mjs')));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const out=mkdtempSync(path.join(tmpdir(),'athena-verify-'));
try{
 const filename=path.join(out,'selected 旧 backup.athart');
 function verify(bytes,success,flags=[]){
  writeFileSync(filename,bytes);
  const before=sha(bytes);
  const r=spawnSync(engine,['verify-continuity-artifact-backup',filename,...flags],{cwd:out,encoding:'utf8',timeout:30000});
  assert.equal(r.status===0,success,r.stderr);
  assert.deepEqual(readdirSync(out),[path.basename(filename)]);
  assert.equal(sha(readFileSync(filename)),before);
  assert.doesNotMatch(r.stdout+r.stderr,/private-fixture-name|selected 旧 backup/);
  return success?JSON.parse(r.stdout):null;
 }
 const id1='00000000-0000-4000-8000-000000000011',id2='00000000-0000-4000-8000-000000000010';
 const tx=Buffer.from([0,255,13,128]),hash=await hashBytes(tx);
 const fixture={artifacts:[{id:id1,latest:2},{id:id2,latest:1}],revisions:[...[[id1,1],[id1,2],[id2,1]]].map(([artifactId,sequence],i)=>({artifactId,sequence,filename:['private-fixture-name 👾','lone\ud800 half','quote " backslash \\ delimiter'][i],mime:['application/octet-stream','text/html',''][i],size:tx.length,hash,at:1})),blobs:new Map([[hash,tx]])};
 const valid=Buffer.from(await (await encodeBundle(fixture)).arrayBuffer()), receipt=verify(valid,true);
 assert.deepEqual(receipt,{schema:'athena-artifact-journal-file-verification-v1',artifacts:2,revisions:3,distinct_payloads:1,distinct_payload_bytes:4,verified:true});
 assert.equal(verify(valid,true,['--include-fingerprint']).archive_sha256,sha(valid));
 verify(valid,false,['--unexpected']);
 const corrupt=Buffer.from(valid);corrupt[corrupt.length-1]^=128;verify(corrupt,false);
 verify(valid.subarray(0,-1),false);verify(Buffer.concat([valid,Buffer.of(0)]),false);
 const invalidMetadata=raw=>{
  const prefix=Buffer.from(valid.subarray(0,44));
  prefix.writeUInt32BE(raw.length,8);createHash('sha256').update(raw).digest().copy(prefix,12);
  return Buffer.concat([prefix,raw,tx]);
 };
 const json=valid.subarray(44,-tx.length).toString();
 verify(invalidMetadata(Buffer.from(json.replace('"at":1','"at":1,"at":1'))),false);
 verify(invalidMetadata(Buffer.from(json.replace('private-fixture-name','\\u0070rivate-fixture-name'))),false);
 verify(invalidMetadata(Buffer.from(json.replace('👾','\\ud83d\\udc7e'))),false);
 verify(invalidMetadata(Buffer.from(json.replace('"size":4','"size":256'))),false);
 console.log('Exact packaged browser writer to native read-only verifier: original bytes, Unicode and lone surrogate labels, bounds, corruption, canonical shape, no writes or leaked names');
}finally{rmSync(out,{recursive:true,force:true});}
