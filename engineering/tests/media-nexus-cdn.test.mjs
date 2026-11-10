import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {safeMediaUrl,providerOwnsHost,validateFixture} from '../docs/media-lab/media-core.mjs';

// Exact public GraphQL thumbnailLargeUrl samples, checked 2026-11-08.
// No live requests or complete-gallery/download claims are made by these tests.
const large = [
  'https://images.nexusmods.com/mod-images/1151/t/large/42/42147/42147-1574018373-1181117442.jpeg',
  'https://images.nexusmods.com/mod-images/4187/t/large/10/106/106-1692987450-947775764.png',
];
const fixture = () => JSON.parse(readFileSync(new URL('../docs/media-lab/public-fixtures.json', import.meta.url)));
const card = data => data.cards.find(value => value.provider === 'Nexus Mods');

test('both exact source-returned Nexus large previews pass media URL validation', () => {
  for(const url of large) assert.equal(safeMediaUrl(url),url);
});
test('Nexus large preview CDN belongs only to the Nexus provider', () => {
  for(const url of large) {
    assert.equal(providerOwnsHost(url,'Nexus Mods'),true);
    for(const provider of ['Modrinth','Steam','YouTube','Bilibili','unknown'])
      assert.equal(providerOwnsHost(url,provider),false);
  }
});
test('Nexus large covers and mixed original/preview hosts validate losslessly', () => {
  for(const url of large) {
    const data=fixture(), nexus=card(data);
    nexus.cover=url;nexus.gallery[0].preview=url;
    const before=JSON.stringify(data);
    assert.equal(validateFixture(data),data);
    assert.equal(JSON.stringify(data),before);
  }
});
test('Nexus large original links remain distinct from small previews', () => {
  const data=fixture(), nexus=card(data);
  nexus.gallery[0].original=large[0];
  assert.notEqual(nexus.gallery[0].preview,nexus.gallery[0].original);
  assert.equal(validateFixture(data),data);
});
test('legacy Nexus staticdelivery previews still validate unchanged', () => {
  const data=fixture(), before=JSON.stringify(data);
  assert.equal(providerOwnsHost(card(data).cover,'Nexus Mods'),true);
  assert.equal(validateFixture(data),data);
  assert.equal(JSON.stringify(data),before);
});
test('new Nexus media domain does not become a card source host', () => {
  const data=fixture();card(data).source=large[0];
  assert.throws(()=>validateFixture(data),/source/);
});
test('Nexus media cannot be borrowed for another provider cover or gallery', () => {
  for(const field of ['cover','gallery']) {
    const data=fixture(), other=data.cards.find(c=>c.provider==='Modrinth');
    if(field==='cover')other.cover=large[0];else other.gallery[0].original=large[0];
    assert.throws(()=>validateFixture(data),/cover|gallery/);
  }
});
test('new Nexus host cannot silently authorize an HLS player', () => {
  const data=fixture();card(data).videos=[{kind:'hls',hls:large[0]}];
  assert.throws(()=>validateFixture(data),/player|video/);
});
test('Nexus lookalikes, arbitrary subdomains and non-HTTPS URLs remain rejected', () => {
  for(const value of [
    'http://images.nexusmods.com/image.webp',
    'https://images.nexusmods.com.evil.example/image.webp',
    'https://evil.images.nexusmods.com/image.webp',
    'https://nexusmods.com/image.webp',
    'https://user:secret@images.nexusmods.com/image.webp',
    'https://images.nexusmods.com:8443/image.webp',
    'https://localhost/image.webp',
    'javascript:alert(1)',
  ]) {
    assert.equal(safeMediaUrl(value),null);
    assert.equal(providerOwnsHost(value,'Nexus Mods'),false);
  }
});
