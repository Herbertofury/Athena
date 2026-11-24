import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createHash} from 'node:crypto';
import {mkdtemp, readFile, writeFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier, context, next){
  if(specifier==='./github-release.js' && context.parentURL===new URL('./verified-transfer.ts',import.meta.url).href) return next('./github-release.ts',context);
  return next(specifier,context);
}});
const {verifiedTransfer, TransferHttpError}=await import('./verified-transfer.ts');
const bytes=Buffer.from('complete file payload');
const sha=createHash('sha256').update(bytes).digest('hex');
const opts={timeoutMs:5000,userAgent:'AthenaFixture/1'};
test('verify full transfer, reject incomplete/mismatched and keep last-good destination',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'athena-transfer-'));
  const server=createServer((req,res)=>{
    if(req.url==='/partial'){res.writeHead(200,{'Content-Length':bytes.length+10});res.write(bytes);return res.destroy();}
    if(req.url==='/throttled'){res.writeHead(429,{'Retry-After':'120'});return res.end();}
    res.writeHead(200);res.write(bytes.subarray(0,5));res.end(bytes.subarray(5));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${server.address().port}`;
  const dl={url,filename:'asset.zip',expectedSizeBytes:bytes.length,expectedSha256:sha};
  try {
    await writeFile(join(dir,'asset.zip'),'last good');
    for(const [request,options] of [[{...dl,expectedSha256:'0'.repeat(64)},opts],[{...dl,expectedSizeBytes:bytes.length+1},opts],[{...dl,url:url+'/partial'},opts],[{url,filename:'asset.zip'},{...opts,maxBytes:5}],[{...dl,filename:'../asset.zip'},opts]]){
      await assert.rejects(verifiedTransfer(request,dir,options));
      assert.equal(await readFile(join(dir,'asset.zip'),'utf8'),'last good');
      assert.deepEqual(await readdir(dir),['asset.zip']);
    }
    await assert.rejects(verifiedTransfer({...dl,url:url+'/throttled'},dir,opts),err=>err instanceof TransferHttpError&&err.status===429&&err.retryAfterMs===120000);
    const result=await verifiedTransfer(dl,dir,opts);
    assert.equal(result.sha256,sha);assert.equal(result.sizeBytes,bytes.length);assert.deepEqual(await readFile(result.localPath),bytes);assert.deepEqual(await readdir(dir),['asset.zip']);
  }finally{await new Promise(resolve=>server.close(resolve));await rm(dir,{recursive:true,force:true});}
});
