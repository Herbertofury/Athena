import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateFixture,coverPlaceholderLabel,mediaCounts} from '../docs/media-lab/media-core.mjs';
const fixture=()=>JSON.parse(readFileSync(new URL('../docs/media-lab/public-fixtures.json',import.meta.url)));
// Synthetic no-cover variant of the retained fixture. Live public-source
// reproduction is a separate dated research receipt, not this fixture claim.
function absent(){const x=fixture();x.cards[0].cover=null;x.cards[0].cover_status='not-provided';return x;}
test('explicit Modrinth cover absence is accepted losslessly with galleries retained',()=>{const x=absent(),before=JSON.stringify(x);assert.equal(validateFixture(x),x);assert.equal(JSON.stringify(x),before);assert.deepEqual(mediaCounts(x),{cards:5,gallery_images:19,video_entries:19});});
test('a no-cover Modrinth card can also have no gallery or player',()=>{const x=absent();x.cards=[x.cards[0]];x.cards[0].gallery=[];x.cards[0].videos=[];assert.equal(validateFixture(x),x);assert.deepEqual(mediaCounts(x),{cards:1,gallery_images:0,video_entries:0});});
test('null cover still requires explicit correctly spelled absence status',()=>{for(const status of [undefined,null,'','unknown','official-player-only','not_provided']){const x=absent();x.cards[0].cover_status=status;assert.throws(()=>validateFixture(x),/cover/);}});
test('absence status cannot hide a contradictory or missing cover value',()=>{for(const cover of [undefined,'',false,0,{},'https://cdn.modrinth.com/icon.webp','https://evil.example/icon.webp']){const x=absent();x.cards[0].cover=cover;assert.throws(()=>validateFixture(x),/Contradictory Modrinth cover absence/);}});
test('not-provided does not authorize other providers to omit cover validation',()=>{for(let i=1;i<fixture().cards.length;i++){const x=fixture();x.cards[i].cover=null;x.cards[i].cover_status='not-provided';assert.throws(()=>validateFixture(x),/cover|Bilibili/);}});
test('cover absence does not relax the source-provider boundary',()=>{const x=absent();x.cards[0].source='https://store.steampowered.com/app/620/Portal_2/';assert.throws(()=>validateFixture(x),/source/);});
test('cover absence does not authorize unrelated gallery images',()=>{for(const key of ['preview','original']){const x=absent();x.cards[0].gallery[0][key]=fixture().cards[1].cover;assert.throws(()=>validateFixture(x),/gallery/);}});
test('cover absence does not authorize players under the wrong provider',()=>{const x=absent();x.cards[0].videos=[{kind:'youtube',id:'M7lc1UVf-VE'}];assert.throws(()=>validateFixture(x),/video/);});
test('cover absence never turns private or nonpublic fixtures into public ones',()=>{for(const change of [x=>x.private_data_included=true,x=>x.access='authenticated',x=>x.schema_version=2]){const x=absent();change(x);assert.throws(()=>validateFixture(x),/non-public/);}});
test('ordinary retained covered cards remain accepted without changes',()=>{const x=fixture(),before=JSON.stringify(x);assert.equal(validateFixture(x),x);assert.equal(JSON.stringify(x),before);});
test('no-cover labels distinguish absent public cover from official-player-only poster',()=>{assert.equal(coverPlaceholderLabel(absent().cards[0]),'No cover supplied by the public project record.');assert.equal(coverPlaceholderLabel(fixture().cards.find(x=>x.provider==='Bilibili')),'Poster remains inside the official player');});
test('placeholder fallback does not invent a public source or player claim',()=>{for(const value of [undefined,null,{},fixture().cards[0],{provider:'Modrinth',cover:null,cover_status:'unknown'}])assert.equal(coverPlaceholderLabel(value),'Cover unavailable.');});
