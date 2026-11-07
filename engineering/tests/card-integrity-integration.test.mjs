import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prepareDataset,validatePrepared} from '../docs/card-lab/preparation-core.mjs';
import {verifyPreparedBounded} from '../experiments/card-receiver-lab/verified-receiver.mjs';
test('actual card preparation baseline accepts tail damage; integrated verifier rejects it',async()=>{
 const good=await prepareDataset(2,512),changed=structuredClone(good);changed.records[0].metadata=changed.records[0].metadata.slice(0,-1)+'Z';
 assert.equal(validatePrepared(changed,2,512),changed);await assert.rejects(verifyPreparedBounded(changed,2,512),/metadata mismatch/);
 assert.equal(await verifyPreparedBounded(good,2,512),good);
});
test('integrated preparation rejects plausible digest, byte-count and extra-field damage',async()=>{
 const good=await prepareDataset(2,512);
 for(const mutate of [x=>x.dataset.sha256='0'.repeat(64),x=>x.dataset.serialized_bytes++,x=>x.records[0].hidden='not displayed']){
  const bad=structuredClone(good);mutate(bad);await assert.rejects(verifyPreparedBounded(bad,2,512));
 }
});
test('both actual main and worker lanes cross full verification before record installation',()=>{
 const source=readFileSync(new URL('../docs/card-lab/lab.js',import.meta.url),'utf8');
 assert.match(source,/const received=await \(preparationStrategy==='worker'\?prepareInWorker\(count,bytes\):prepareDataset\(count,bytes\)\)/);
 assert.match(source,/const prepared=await verifyPreparedBounded\(received,count,bytes\)/);
 assert.ok(source.indexOf('await verifyPreparedBounded')<source.indexOf('records=prepared.records'));
 assert.match(source,/complete_validation_ms:completeValidationMs/);
});
