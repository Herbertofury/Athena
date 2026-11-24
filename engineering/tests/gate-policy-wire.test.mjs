import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../experiments/gate-policy-lab/',import.meta.url);
test('actual CLI and completed/cancelled HTTP policies survive JavaScript JSON unchanged',async()=>{
 const cli=JSON.parse(await readFile(new URL('cli-result.json',root),'utf8'));
 const http=JSON.parse(await readFile(new URL('http-receipt.json',root),'utf8'));
 const policies=[cli.acceptance_policy,http.real_saved_record_job.acceptance_policy,http.generated_fixture_cancelled_job.acceptance_policy];
 for(const policy of policies){
  assert.deepEqual(JSON.parse(JSON.stringify(policy)),policy);
  for(const key of ['minimum_pairs_decimal','minimum_stress_cases_decimal','memory_budget_bytes_decimal'])assert.match(policy[key],/^\d+$/);
  assert.match(policy.minimum_speedup_bits_hex,/^[0-9a-f]{16}$/);
  const view=new DataView(new ArrayBuffer(8));view.setBigUint64(0,BigInt('0x'+policy.minimum_speedup_bits_hex));assert.equal(view.getFloat64(0),Number(policy.minimum_speedup_text));
 }
 assert.deepEqual(policies[0],policies[1]);assert.deepEqual(policies[1],policies[2]);
});
test('generated maximum integer and invalid float identity remain exact string data',()=>{
 const fixture={memory_budget_bytes_decimal:'18446744073709551615',minimum_speedup_bits_hex:'7ff8000000000042',minimum_speedup_text:'NaN'};
 const decoded=JSON.parse(JSON.stringify(fixture));assert.deepEqual(decoded,fixture);assert.equal(BigInt(decoded.memory_budget_bytes_decimal),2n**64n-1n);
});
