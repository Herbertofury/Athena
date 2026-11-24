import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import path from 'node:path';import {fileURLToPath} from 'node:url';import {spawnSync} from 'node:child_process';
test('unknown parser bytes are rejected before importing the artifact',()=>{
 const stage=mkdtempSync(path.join(tmpdir(),'atlas-hls-reject-'));
 try{writeFileSync(path.join(stage,'parser-1.7.3.mjs'),"throw Error('UNEXPECTED_ARTIFACT_EXECUTION');");const result=spawnSync(process.execPath,[fileURLToPath(new URL('../experiments/hls-release-lab/evaluate.mjs',import.meta.url)),stage],{encoding:'utf8',timeout:5000});assert.equal(result.status,1);assert.match(result.stderr,/Unrecognized parser artifact: 1\.7\.3/);assert.doesNotMatch(result.stderr,/UNEXPECTED_ARTIFACT_EXECUTION/);}finally{rmSync(stage,{recursive:true,force:true});}
});
