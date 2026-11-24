import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {safeMediaUrl,safeSourceUrl,validateFixture,mediaCounts,nativePlaybackLabel} from '../docs/media-lab/media-core.mjs';
const fixture=()=>JSON.parse(readFileSync(new URL('../docs/media-lab/public-fixtures.json',import.meta.url)));
test('all selected source galleries and trailers survive normalization',()=>{const x=validateFixture(fixture());assert.deepEqual(mediaCounts(x),{cards:5,gallery_images:19,video_entries:19});assert.equal(x.cards.find(c=>c.id==='steam:620').videos.length,17);assert.equal(x.cards.find(c=>c.id.startsWith('modrinth:')).gallery.length,6);});
test('rejects active protocols, credentials and deceptive media hosts',()=>{for(const u of ['javascript:alert(1)','http://cdn.modrinth.com/a','https://cdn.modrinth.com.evil.example/a','https://user:secret@cdn.modrinth.com/a','https://localhost/a','https://127.0.0.1/a'])assert.equal(safeMediaUrl(u),null);});
test('original and preview URLs remain distinct',()=>{const x=fixture();const m=x.cards[0].gallery[0];assert.notEqual(m.preview,m.original);assert.equal(safeMediaUrl(m.original),m.original);});
test('private fixture state cannot silently enter public demo',()=>{const x=fixture();x.private_data_included=true;assert.throws(()=>validateFixture(x));});
test('duplicate canonical identities are rejected',()=>{const x=fixture();x.cards.push(x.cards[0]);assert.throws(()=>validateFixture(x));});
test('unavailable gallery coverage remains explicit',()=>{const x=fixture();assert.match(x.cards.find(c=>c.provider==='Nexus Mods').completeness,/unknown/);});

test('source links cannot execute script or leave the provider allowlist',()=>{for(const u of ['javascript:alert(1)','https://evil.example/','https://www.youtube.com:8443/watch?v=x'])assert.equal(safeSourceUrl(u),null);const x=fixture();x.cards[0].source='javascript:alert(1)';assert.throws(()=>validateFixture(x));});

test('media cannot be borrowed from an unrelated provider card',()=>{const x=fixture();x.cards[0].cover=x.cards[1].cover;assert.throws(()=>validateFixture(x));});

test('card source belongs to the declared provider',()=>{const x=fixture();x.cards[0].source=x.cards[2].source;assert.throws(()=>validateFixture(x),/source/i);});
test('player kind cannot cross the provider boundary',()=>{const x=fixture();x.cards[0].videos=[{kind:'youtube',id:'M7lc1UVf-VE'}];assert.throws(()=>validateFixture(x),/video|player/i);});
test('unknown player kinds fail closed',()=>{const x=fixture();x.cards[2].videos[0].kind='future-unreviewed';assert.throws(()=>validateFixture(x),/video|player/i);});
test('optional trailer posters are provider-bound too',()=>{const x=fixture();x.cards[2].videos[0].poster=x.cards[0].cover;assert.throws(()=>validateFixture(x),/poster/i);});
test('fixture validation is lossless and does not mutate input',()=>{const x=fixture(),before=JSON.stringify(x);assert.equal(validateFixture(x),x);assert.equal(JSON.stringify(x),before);});

test('native playback labels distinguish playing, paused, ended and failed',()=>{assert.equal(nativePlaybackLabel('playing'),'Playing the selected source trailer.');assert.equal(nativePlaybackLabel('pause'),'Paused.');assert.equal(nativePlaybackLabel('ended'),'Playback ended.');assert.match(nativePlaybackLabel('error'),/failed/);assert.equal(nativePlaybackLabel('loadedmetadata'),null);assert.equal(nativePlaybackLabel('constructor'),null);});

test('the previous four real cards remain completely unchanged',()=>{const old=JSON.parse(readFileSync(new URL('../docs/media-lab/public-fixtures.09bc53f20b0f552b.json',import.meta.url)));assert.deepEqual(fixture().cards.slice(0,4),old.cards);});
test('Bilibili source, provider, video ID and poster scope are bound together',()=>{const original=fixture();const index=original.cards.findIndex(c=>c.provider==='Bilibili');assert.equal(original.cards[index].cover,null);for(const change of [c=>c.videos[0].id='BV1B7411m7Lx',c=>c.source='https://www.bilibili.com/video/BV1B7411m7Lx/',c=>c.source+='?autoplay=1',c=>c.cover='https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg',c=>c.cover_status='complete',c=>c.videos[0].kind='youtube',c=>c.provider='YouTube']){const x=structuredClone(original);change(x.cards[index]);assert.throws(()=>validateFixture(x));}});
