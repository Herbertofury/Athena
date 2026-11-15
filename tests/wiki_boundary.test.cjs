const test=require('node:test');
const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
test('wiki migration symlink boundaries',()=>{
 const r=spawnSync(process.platform==='win32'?'python':'python3',['tests/wiki_boundary_test.py'],{encoding:'utf8'});
 assert.equal(r.status,0,r.stdout+r.stderr);
});
