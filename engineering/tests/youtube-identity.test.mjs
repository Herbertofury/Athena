import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateFixture,mediaCounts} from '../docs/media-lab/media-core.mjs';
const fixture=()=>JSON.parse(readFileSync(new URL('../docs/media-lab/public-fixtures.json',import.meta.url)));
const youtube=x=>x.cards.find(c=>c.provider==='YouTube');

test('YouTube source, canonical card and selected player refer to one video',()=>{
 for(const mutate of [c=>c.id='youtube:aaaaaaaaaaa',c=>c.source='https://www.youtube.com/watch?v=aaaaaaaaaaa',c=>c.videos[0].id='aaaaaaaaaaa']){
  const x=fixture();mutate(youtube(x));assert.throws(()=>validateFixture(x),/YouTube.*identity/);
 }
});
test('duplicate or unreviewed source identities fail closed',()=>{
 for(const source of ['https://www.youtube.com/watch?v=M7lc1UVf-VE&v=aaaaaaaaaaa','https://www.youtube.com/watch?v=M7lc1UVf-VE&v=M7lc1UVf-VE','https://www.youtube.com/channel/M7lc1UVf-VE','https://www.youtube.com/watch']){
  const x=fixture();youtube(x).source=source;assert.throws(()=>validateFixture(x),/YouTube/);
 }
});
test('current single-video card contract rejects missing or unrelated players',()=>{
 for(const videos of [[],[{kind:'youtube',id:'M7lc1UVf-VE'},{kind:'youtube',id:'aaaaaaaaaaa'}]]){
  const x=fixture();youtube(x).videos=videos;assert.throws(()=>validateFixture(x),/YouTube/);
 }
});
test('cover and gallery thumbnail URL identities cannot silently change videos',()=>{
 for(const mutate of [c=>c.cover='https://i.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg',c=>c.gallery=[{preview:'https://i.ytimg.com/vi/aaaaaaaaaaa/default.jpg',original:c.cover}],c=>c.gallery=[{preview:c.cover,original:'https://i.ytimg.com/vi/aaaaaaaaaaa/default.jpg'}]]){
  const x=fixture();mutate(youtube(x));assert.throws(()=>validateFixture(x),/YouTube.*identity/);
 }
});
test('same-video thumbnail variants and nonidentity source parameters are retained losslessly',()=>{
 const x=fixture(),c=youtube(x);c.source+='&t=30#example';c.cover='https://i.ytimg.com/vi_webp/M7lc1UVf-VE/hqdefault.webp';c.gallery=[{preview:c.cover,original:'https://i.ytimg.com/vi/M7lc1UVf-VE/maxresdefault.jpg',future:{a:[1,2]}}];c.future_metadata={retained:true};const before=JSON.stringify(x);assert.equal(validateFixture(x),x);assert.equal(JSON.stringify(x),before);
});
test('all retained public fields and media counts remain unchanged',()=>{
 const x=fixture(),before=JSON.stringify(x);assert.equal(validateFixture(x),x);assert.equal(JSON.stringify(x),before);assert.deepEqual(mediaCounts(x),{cards:5,gallery_images:19,video_entries:19});
});

test('served manifest and source receipt agree on the exact harness identity',()=>{
 const source=readFileSync(new URL('../docs/media-lab/media.js',import.meta.url),'utf8');
 const manifest=JSON.parse(readFileSync(new URL('../docs/media-lab/build-manifest.json',import.meta.url)));
 const match=/harness:'([^']+)'/.exec(source);assert.ok(match);assert.equal(manifest.harness,match[1]);assert.equal(match[1],'atlas-real-media-v13-player-ready-deadline');
});
