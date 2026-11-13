'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../data/creative-ai-tools.json');
const { validateCatalog } = require('../scripts/validate_creative_ai_catalog.cjs');
const clone = () => structuredClone(catalog);
test('creative AI catalog validates and spans all requested disciplines', () => {
  assert.deepEqual(validateCatalog(catalog), []);
  const categories = new Set(catalog.tools.flatMap(t => t.categories));
  for (const category of ['web-design', 'graphics-photo', 'music-audio', 'video']) assert.ok(categories.has(category));
});
test('code licenses cannot substitute for missing model licenses', () => {
  const c = clone(); delete c.tools[0].licenses.weights;
  assert.ok(validateCatalog(c).some(e => e.includes('licenses.weights')));
});
test('source review cannot claim target superiority or unsupported benchmarks', () => {
  const c = clone(); c.tools[0].verification = 'source-reviewed'; c.tools[0].recommendedForTarget = true;
  c.tools[0].benchmarks = [{ latency: 1 }]; delete c.tools[0].evidence;
  const errors = validateCatalog(c);
  assert.ok(errors.some(e => e.includes('target comparison')));
  assert.ok(errors.some(e => e.includes('benchmarks require')));
});
test('runtime status requires retained evidence', () => {
  const c = clone(); c.tools[0].verification = 'runtime-tested'; delete c.tools[0].evidence;
  assert.ok(validateCatalog(c).some(e => e.includes('evidence')));
});
test('duplicate identities and unsafe source URLs fail', () => {
  const c = clone(); c.tools.push(structuredClone(c.tools[0])); c.tools[0].sources[0].url = 'javascript:alert(1)';
  const errors = validateCatalog(c);
  assert.ok(errors.some(e => e.includes('duplicate')));
  assert.ok(errors.some(e => e.includes('HTTPS')));
});
