'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{spawnSync}=require('node:child_process');
test('offline learner pack rejects linked or special input and retains the last good download',()=>{const result=spawnSync('python3',['tests/workshop_pack_boundary_test.py'],{cwd:path.resolve(__dirname,'..'),encoding:'utf8',timeout:30000});assert.equal(result.error,undefined,result.error?.message);assert.equal(result.status,0,result.stdout+'\n'+result.stderr);assert.match(result.stderr,/Ran 12 tests/);});
