import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {jobLabel} from '../apps/atlas-lab/ui/collection-input.mjs';
test('actual baseline mislabels archive jobs; repaired discriminator names their real operation',()=>{
 const expression=readFileSync(new URL('../experiments/job-label-lab/baseline-label-expression.txt',import.meta.url),'utf8');
 const before=Function('job','return ('+expression+')');const job={CollectModrinthRaw:{project:'SODIUM'}};
 assert.equal(before({job}),'Identifier deduplication');assert.equal(jobLabel(job),'Complete project archive · SODIUM');
});
test('every current queue operation retains its own label',()=>{
 const cases=[['DedupExperiment','Identifier deduplication'],[{CollectModrinth:{project:'sodium'}},'Modrinth · sodium'],[{CollectModrinthBatch:{projects:['AANobbMI']}},'Modrinth batch · 1 projects'],[{CollectModrinthVersions:{versions:['abcdefgh']}},'Modrinth versions · 1 records'],[{ReviewUpstream:{source:'rustsec'}},'Upstream review · rustsec'],[{VersionValidationExperiment:{version:'abcdefgh'}},'Version validation · abcdefgh']];for(const [job,label]of cases)assert.equal(jobLabel(job),label);
});
test('unknown or malformed records never silently become a deduplication experiment',()=>{
 for(const job of [null,[],42,'future',{}, {Future:{}},{CollectModrinth:{},ReviewUpstream:{}}])assert.equal(jobLabel(job),'Unrecognized recorded operation');
 assert.equal(jobLabel({CollectModrinthRaw:null}),'Complete project archive · [invalid identity]');assert.equal(jobLabel({CollectModrinthVersions:{versions:null}}),'Modrinth versions · [invalid list] records');
});
