const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
test('Foundry actual generated lifecycle passes abort, timeout and failure cleanup probes',()=>{
 const root=path.resolve(__dirname,'..'),env={...process.env};delete env.NODE_TEST_CONTEXT;
 const result=spawnSync(process.execPath,['--test','--test-reporter=tap','scripts/test_foundry_lifecycle.mjs'],{cwd:root,env,encoding:'utf8',timeout:30000});
 assert.equal(result.status,0,result.stdout+'\n'+result.stderr);assert.match(result.stdout,/# tests 6/);assert.match(result.stdout,/# pass 6/);assert.match(result.stdout,/# fail 0/);
});
