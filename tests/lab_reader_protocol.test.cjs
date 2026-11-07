const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
test('Retained Lab job and project/version/upstream archive protocol regressions pass',()=>{
 const root=path.resolve(__dirname,'..'),files=['job-submit','archive-view','version-archive-view','upstream-archive-view'].map(name=>path.join(root,'engineering/tests/'+name+'.test.mjs'));
 const result=spawnSync(process.execPath,['--test',...files],{cwd:root,encoding:'utf8',timeout:30000});
 assert.equal(result.error,undefined,result.error?.message);assert.equal(result.status,0,result.stdout+'\n'+result.stderr);
});
