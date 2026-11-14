import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {compareGallery} from '../../dist/workspaces/engineering/media/compare.mjs';
import {createLocalComparison,comparisonReceipt} from '../../dist/workspaces/engineering/media/local-compare.mjs';
const fixture=JSON.parse(readFileSync(new URL('../tests/fixtures/modrinth-sodium-public-excerpt-20261105.json',import.meta.url),'utf8'));
const card=JSON.parse(readFileSync(new URL('../../dist/workspaces/engineering/media/public-fixtures.json',import.meta.url),'utf8')).cards.find(c=>c.id==='modrinth:AANobbMI');
const fields=[['project','url'],['project','raw_url'],['card','preview'],['card','original']];
const variants=url=>[[url],[[url]],[[[url]]],[],{},null,true,false,27];
const inputs=()=>({project:structuredClone(fixture),card:structuredClone(card)});
function file(project){const bytes=new TextEncoder().encode(JSON.stringify(project));return {bytes,size:bytes.byteLength,arrayBuffer:async()=>bytes.slice().buffer};}

test('JSON URL arrays cannot masquerade as valid gallery pairs on either side',()=>{
 for(const [side,key] of fields)for(let i=0;i<fixture.gallery.length;i++){
  for(const invalid of variants(side==='project'?fixture.gallery[i][key]:card.gallery[i][key])){
   const data=inputs();data[side].gallery[i][key]=invalid;
   // The fault exists in ordinary serialized JSON, not getters or custom objects.
   const roundTrip=JSON.parse(JSON.stringify(data)),result=compareGallery(roundTrip.project,roundTrip.card);
   assert.equal(result.status,'unknown',JSON.stringify({side,key,i,invalid}));
   assert.equal(result.reason,'missing or unsupported media URL');
  }
 }
});
test('actual local file and exported receipt report unknown, retaining the exact input hash',async()=>{
 const data=inputs();for(const entry of data.project.gallery){entry.url=[entry.url];entry.raw_url=[[entry.raw_url]];}
 const input=file(data.project),comparison=createLocalComparison(),loaded=await comparison.load(input,data.card);
 assert.equal(loaded.status,'ready');assert.equal(loaded.record.result.status,'unknown');
 assert.equal(comparison.last,loaded.record);
 assert.equal(loaded.record.sha256,createHash('sha256').update(input.bytes).digest('hex'));
 const receipt=comparisonReceipt(loaded.record);assert.equal(receipt.result.status,'unknown');assert.equal(receipt.input_sha256,loaded.record.sha256);
 assert.equal('text' in receipt,false);assert.equal('bytes' in receipt,false);assert.equal('path' in receipt,false);
});
test('valid string normalization and ordered comparison are unchanged',()=>{
 const data=inputs();assert.equal(compareGallery(data.project,data.card).status,'matching');
 data.project.gallery[0].url=data.project.gallery[0].url.replace('https://cdn.modrinth.com/','https://CDN.MODRINTH.COM:443/');
 assert.equal(compareGallery(data.project,data.card).status,'matching');
 data.project.gallery.reverse();assert.equal(compareGallery(data.project,data.card).status,'changed');
 data.project.gallery=[];data.card.gallery=[];assert.equal(compareGallery(data.project,data.card).status,'matching');
 delete data.project.gallery;assert.equal(compareGallery(data.project,data.card).status,'unknown');
});
test('unsupported schemes, hosts, credentials and ports remain unknown',()=>{
 for(const url of ['http://cdn.modrinth.com/a','https://other.example/a','https://user:pass@cdn.modrinth.com/a','https://cdn.modrinth.com:444/a','data:image/png,synthetic','javascript:synthetic','/relative.webp','']){
  const data=inputs();data.project.gallery[0].url=url;assert.equal(compareGallery(data.project,data.card).status,'unknown');
 }
});
test('matching, unknown and failed-read recovery keep their distinct meanings',async()=>{
 const comparison=createLocalComparison();const first=await comparison.load(file(fixture),card);assert.equal(first.record.result.status,'matching');
 const data=inputs();data.project.gallery[0].raw_url=[data.project.gallery[0].raw_url];
 const unknown=await comparison.load(file(data.project),card);assert.equal(unknown.record.result.status,'unknown');
 await assert.rejects(comparison.load({size:1,arrayBuffer:async()=>Uint8Array.of(123).buffer},card),/valid UTF-8 project JSON/);
 assert.equal(comparison.last,unknown.record,'a failed read retains the most recent completed comparison, even when it was unknown');
 const recovered=await comparison.load(file(fixture),card);assert.equal(recovered.record.result.status,'matching');assert.equal(comparison.last,recovered.record);
});
test('native emitted comparison modules match reviewed source bytes',()=>{
 for(const name of ['compare.mjs','local-compare.mjs'])assert.deepEqual(readFileSync(new URL('../../dist/workspaces/engineering/media/'+name,import.meta.url)),readFileSync(new URL('../docs/media-lab/'+name,import.meta.url)));
});
