import test from 'node:test';
import assert from 'node:assert/strict';
import {registerHooks} from 'node:module';
registerHooks({resolve(specifier, context, next){
  if(specifier === './github-release.js' && context.parentURL === new URL('./modrinth-release.ts', import.meta.url).href) return next('./github-release.ts', context);
  return next(specifier,context);
}});
const {modrinthVersionFiles,selectModrinthTransfer}=await import('./modrinth-release.ts');
const projectId='AaBbCcDd',versionId='EeFfGgHh';
const source=(filename,hash='a',primary=false)=>({filename,url:'https://cdn.modrinth.com/data/'+projectId+'/versions/'+versionId+'/'+encodeURIComponent(filename),size:104,hashes:{sha512:hash.repeat(128)},primary});
const response=(...files)=>({id:versionId,project_id:projectId,files});
const main=source('example+fabric.jar','a',true), companion=source('example-optional.jar','b');
test('all sibling files are retained and a non-primary SHA-512 selects only itself',()=>{
  const r=response(main,companion);
  const files=modrinthVersionFiles(projectId,versionId,r);
  assert.deepEqual(files.map(f=>[f.filename,f.primary]),[[main.filename,true],[companion.filename,false]]);
  assert.deepEqual(selectModrinthTransfer(projectId,versionId,r,'B'.repeat(128)),{
    filename:companion.filename,url:companion.url,expectedSizeBytes:104,expectedSha512:'b'.repeat(128),redirect:'error'
  });
  assert.throws(()=>selectModrinthTransfer(projectId,versionId,r,'c'.repeat(128)),/No unique/);
  assert.throws(()=>selectModrinthTransfer(projectId,versionId,r,'b'.repeat(128),main.filename),/No unique/);
});
test('foreign IDs, non-provider routes, invalid hashes and portable filename collisions fail closed',()=>{
  assert.throws(()=>modrinthVersionFiles(projectId.toLowerCase(),versionId,response(main)),/identity mismatch/);
  assert.throws(()=>modrinthVersionFiles(projectId,'WrongVersion',response(main)),/identity mismatch/);
  for(const f of [
    {...main,url:main.url.replace('cdn.modrinth.com','cdn.modrinth.com.invalid')},
    {...main,url:main.url.replace(projectId,'Foreign1')},
    {...main,url:main.url.replace(versionId,'Foreign2')},
    {...main,url:main.url+'?redirect=somewhere'},
    {...main,url:main.url.replace('https:','http:')},
    source('nested/file.jar'), source('CON.jar'),
    {...main,hashes:{sha1:'a'.repeat(40)}},{...main,size:Number.MAX_SAFE_INTEGER+1}
  ]) assert.throws(()=>modrinthVersionFiles(projectId,versionId,response(f)));
  assert.throws(()=>modrinthVersionFiles(projectId,versionId,response(main,source('EXAMPLE+FABRIC.JAR'))),/Ambiguous portable/);
});
test('duplicate content under two filenames is ambiguous without the exact filename',()=>{
  const r=response(main,source('identical-copy.jar'));
  assert.throws(()=>selectModrinthTransfer(projectId,versionId,r,'a'.repeat(128)),/No unique/);
  assert.equal(selectModrinthTransfer(projectId,versionId,r,'a'.repeat(128),'identical-copy.jar').filename,'identical-copy.jar');
});

test('legacy CDN route must use the version number of the same exact version response',()=>{
  const legacy={...main,url:main.url.replace(versionId,'2.0%2Bfabric')};
  const r={...response(legacy),version_number:'2.0+fabric'};
  assert.equal(selectModrinthTransfer(projectId,versionId,r,'a'.repeat(128)).url,legacy.url);
  assert.throws(()=>modrinthVersionFiles(projectId,versionId,{...r,version_number:'2.0+forge'}),/route or name mismatch/);
  assert.throws(()=>modrinthVersionFiles(projectId,versionId,{...r,project_id:'ForeignA'}),/identity mismatch/);
  assert.throws(()=>modrinthVersionFiles(projectId,versionId,response(main,{...companion,primary:true})),/Multiple/);
});
