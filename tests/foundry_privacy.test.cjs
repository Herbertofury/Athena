const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');
test('Foundry current snapshot withholds private identifiers without rewriting historical manifest',()=>{
 const receipt=JSON.parse(read('migration/feature-foundry/privacy-redaction-2026-11-13.json'));
 const manifest=JSON.parse(read('migration/feature-foundry/source-manifest.json'));
 assert.equal(receipt.history_rewritten,false);
 for(const row of receipt.files){
  assert.equal(hash(row.path),row.sanitized_sha256,row.path);
  if(row.path.startsWith('feature-foundry/source/')){
   const original=manifest.files.find(f=>f.path===row.path.replace('feature-foundry/source/',''));
   assert.equal(original.sha256,row.original_sha256);
  }
 }
 const artist=JSON.parse(read('feature-foundry/source/src/data/artist-worlds-v4.0.1.json'));
 assert.equal(artist.provenance.length,50);
 assert.equal(artist.worlds.length,10);
 for(const row of artist.artists)assert.match(row.rights_release_gate,/permission or license/);
 assert.doesNotMatch(read('feature-foundry/source/progress.md'),/https:\/\/drive\.google\.com\//);
 assert.equal(JSON.parse(read('feature-foundry/source/reference/authority/V33-SOURCE.json')).driveFileId,'[withheld from public snapshot]');
});
test('Foundry private source and reference images remain outside runtime package',()=>{
 const allowlist=JSON.parse(read('config/runtime-public-preview.json'));
 for(const file of allowlist.files)assert.doesNotMatch(file.path,/feature-foundry\/source|reference\/images|history\.bundle/);
});
