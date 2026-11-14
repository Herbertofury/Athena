const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const read=p=>fs.readFileSync(p,'utf8');
test('release recovery receipt matches all original assets without private handles or readiness inflation',()=>{
const p='migration/feature-foundry/release-recovery-2026-11-14.json',text=read(p),r=JSON.parse(text);
const assets=JSON.parse(read('migration/feature-foundry/release-inventory.json'))[0].assets;
assert.equal(r.assets.length,6);assert.equal(r.verifiedCopiesPerAsset,2);
for(const original of assets){const a=r.assets.find(a=>a.name===original.name);assert.ok(a);assert.equal(a.bytes,original.bytes);assert.equal(a.sha256,original.digest.replace('sha256:',''));assert.equal(a.matches_original_inventory,true);}
assert.equal(r.retirementReady,false);assert.equal(r.noDeletion,true);
assert.doesNotMatch(text,/libfile_|file_[a-f0-9]{20}|https?:|\/workspace\/|@/);
assert.match(r.limits.join(' '),/67 blocked/);assert.match(r.limits.join(' '),/sharing ACL/);assert.match(r.limits.join(' '),/Private issue/);
assert.equal(JSON.parse(read('migration/feature-foundry/retirement-audit-2026-11-14.json')).release.missing.length,2);
});
